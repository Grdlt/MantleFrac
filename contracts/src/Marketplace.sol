// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMarketplace.sol";
import "./interfaces/IMantleFracVault.sol";

/**
 * @title Marketplace
 * @notice P2P marketplace for trading vault share tokens
 * @dev Supports atomic swaps with fee collection
 */
contract Marketplace is IMarketplace, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Reference to the vault contract
    IMantleFracVault public immutable vaultContract;

    /// @notice Mapping of listing ID to listing data
    mapping(bytes32 => Listing) private _listings;

    /// @notice Mapping of vault ID to listing IDs
    mapping(bytes32 => bytes32[]) private _vaultListings;

    /// @notice Mapping of seller to listing IDs
    mapping(address => bytes32[]) private _sellerListings;

    /// @notice Fee configuration (basis points)
    uint256 public feeBps = 100; // 1% default
    uint256 public vaultFeeSplitBps = 5000; // 50% to vault treasury
    uint256 public protocolFeeSplitBps = 5000; // 50% to protocol

    /// @notice Protocol treasury address
    address public protocolTreasury;

    /// @notice Vault treasury mapping (vaultId => treasury address)
    mapping(bytes32 => address) public vaultTreasuries;

    /// @notice Counter for generating unique listing IDs
    uint256 private _listingCounter;

    /// @notice Custom errors
    error ListingNotFound(bytes32 listingId);
    error ListingNotOpen(bytes32 listingId, ListingStatus status);
    error NotListingSeller(bytes32 listingId, address caller);
    error VaultNotFound(bytes32 vaultId);
    error InvalidAmount();
    error InvalidPrice();
    error InvalidDuration();
    error ListingHasExpired(bytes32 listingId);
    error InsufficientAllowance();
    error FeeSplitInvalid();

    /// @notice Events
    event FeesUpdated(uint256 feeBps, uint256 vaultSplitBps, uint256 protocolSplitBps);
    event VaultTreasurySet(bytes32 indexed vaultId, address treasury);
    event ProtocolTreasurySet(address treasury);

    /// @notice Constructor
    /// @param _vaultContract Address of the MantleFracVault contract
    /// @param _protocolTreasury Address of the protocol treasury
    constructor(address _vaultContract, address _protocolTreasury) Ownable(msg.sender) {
        vaultContract = IMantleFracVault(_vaultContract);
        protocolTreasury = _protocolTreasury;
    }

    /// @inheritdoc IMarketplace
    function createListing(
        bytes32 vaultId,
        uint256 shareAmount,
        address priceAsset,
        uint256 priceAmount,
        uint256 duration
    ) external nonReentrant returns (bytes32 listingId) {
        if (shareAmount == 0) revert InvalidAmount();
        if (priceAmount == 0) revert InvalidPrice();

        // Verify vault exists
        if (!vaultContract.vaultExists(vaultId)) revert VaultNotFound(vaultId);

        IMantleFracVault.Vault memory vault = vaultContract.getVault(vaultId);

        // Generate listing ID
        listingId = keccak256(abi.encodePacked(block.chainid, address(this), ++_listingCounter));

        // Calculate expiry
        uint256 expiresAt = duration > 0 ? block.timestamp + duration : 0;

        // Transfer shares to marketplace (escrow)
        IERC20(vault.shareToken).safeTransferFrom(msg.sender, address(this), shareAmount);

        // Create listing
        _listings[listingId] = Listing({
            vaultId: vaultId,
            seller: msg.sender,
            shareToken: vault.shareToken,
            shareAmount: shareAmount,
            priceAsset: priceAsset,
            priceAmount: priceAmount,
            status: ListingStatus.Open,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });

        // Update mappings
        _vaultListings[vaultId].push(listingId);
        _sellerListings[msg.sender].push(listingId);

        emit ListingCreated(listingId, vaultId, msg.sender, shareAmount, priceAsset, priceAmount);
    }

    /// @inheritdoc IMarketplace
    function fillListing(bytes32 listingId) external nonReentrant {
        Listing storage listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound(listingId);
        if (listing.status != ListingStatus.Open) revert ListingNotOpen(listingId, listing.status);
        if (listing.expiresAt > 0 && block.timestamp > listing.expiresAt) {
            listing.status = ListingStatus.Expired;
            emit ListingExpired(listingId);
            revert ListingHasExpired(listingId);
        }

        // Calculate fees
        uint256 fee = (listing.priceAmount * feeBps) / 10000;
        uint256 sellerReceives = listing.priceAmount - fee;
        uint256 vaultFee = (fee * vaultFeeSplitBps) / 10000;
        uint256 protocolFee = fee - vaultFee;

        // Transfer payment from buyer
        IERC20 paymentToken = IERC20(listing.priceAsset);

        // Transfer to seller
        paymentToken.safeTransferFrom(msg.sender, listing.seller, sellerReceives);

        // Transfer fees
        if (vaultFee > 0) {
            address vaultTreasury = vaultTreasuries[listing.vaultId];
            if (vaultTreasury != address(0)) {
                paymentToken.safeTransferFrom(msg.sender, vaultTreasury, vaultFee);
            } else {
                // If no vault treasury, send to protocol
                protocolFee += vaultFee;
                vaultFee = 0;
            }
        }

        if (protocolFee > 0 && protocolTreasury != address(0)) {
            paymentToken.safeTransferFrom(msg.sender, protocolTreasury, protocolFee);
        }

        // Transfer shares to buyer
        IERC20(listing.shareToken).safeTransfer(msg.sender, listing.shareAmount);

        // Update status
        listing.status = ListingStatus.Filled;

        emit ListingFilled(listingId, msg.sender, listing.shareAmount, listing.priceAmount);
        emit FeesCollected(listingId, listing.priceAsset, fee, vaultFee, protocolFee);
    }

    /// @inheritdoc IMarketplace
    function cancelListing(bytes32 listingId) external nonReentrant {
        Listing storage listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound(listingId);
        if (listing.seller != msg.sender) revert NotListingSeller(listingId, msg.sender);
        if (listing.status != ListingStatus.Open) revert ListingNotOpen(listingId, listing.status);

        // Update status
        listing.status = ListingStatus.Cancelled;

        // Return shares to seller
        IERC20(listing.shareToken).safeTransfer(listing.seller, listing.shareAmount);

        emit ListingCancelled(listingId);
    }

    /// @inheritdoc IMarketplace
    function getListing(bytes32 listingId) external view returns (Listing memory listing) {
        listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound(listingId);
    }

    /// @inheritdoc IMarketplace
    function getListingsByVault(bytes32 vaultId) external view returns (bytes32[] memory listingIds) {
        return _vaultListings[vaultId];
    }

    /// @inheritdoc IMarketplace
    function getListingsBySeller(address seller) external view returns (bytes32[] memory listingIds) {
        return _sellerListings[seller];
    }

    /// @notice Sets fee parameters
    /// @param _feeBps Total fee in basis points
    /// @param _vaultSplitBps Vault treasury split in basis points
    /// @param _protocolSplitBps Protocol treasury split in basis points
    function setFees(uint256 _feeBps, uint256 _vaultSplitBps, uint256 _protocolSplitBps) external onlyOwner {
        if (_feeBps > 1000) revert FeeSplitInvalid(); // Max 10%
        if (_vaultSplitBps + _protocolSplitBps != 10000) revert FeeSplitInvalid();

        feeBps = _feeBps;
        vaultFeeSplitBps = _vaultSplitBps;
        protocolFeeSplitBps = _protocolSplitBps;

        emit FeesUpdated(_feeBps, _vaultSplitBps, _protocolSplitBps);
    }

    /// @notice Sets vault treasury address
    /// @param vaultId The vault ID
    /// @param treasury The treasury address
    function setVaultTreasury(bytes32 vaultId, address treasury) external {
        // Only vault creator can set treasury
        IMantleFracVault.Vault memory vault = vaultContract.getVault(vaultId);
        require(msg.sender == vault.creator || msg.sender == owner(), "Not authorized");

        vaultTreasuries[vaultId] = treasury;
        emit VaultTreasurySet(vaultId, treasury);
    }

    /// @notice Sets protocol treasury address
    /// @param treasury The treasury address
    function setProtocolTreasury(address treasury) external onlyOwner {
        protocolTreasury = treasury;
        emit ProtocolTreasurySet(treasury);
    }

    /// @notice Expires a listing that has passed its expiry time
    /// @param listingId The listing ID
    function expireListing(bytes32 listingId) external {
        Listing storage listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound(listingId);
        if (listing.status != ListingStatus.Open) revert ListingNotOpen(listingId, listing.status);
        if (listing.expiresAt == 0 || block.timestamp <= listing.expiresAt) {
            revert ListingNotOpen(listingId, listing.status);
        }

        listing.status = ListingStatus.Expired;

        // Return shares to seller
        IERC20(listing.shareToken).safeTransfer(listing.seller, listing.shareAmount);

        emit ListingExpired(listingId);
    }
}
