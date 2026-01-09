// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMantleFracVault.sol";
import "./VaultShareToken.sol";

/**
 * @title MantleFracVault
 * @notice Core vault contract for NFT fractionalization on Mantle Network
 * @dev Creates vaults from ERC-721 NFTs and deploys ERC-20 share tokens
 */
contract MantleFracVault is IMantleFracVault, IERC721Receiver, Ownable, ReentrancyGuard {
    /// @notice Mapping of vault ID to vault data
    mapping(bytes32 => Vault) private _vaults;

    /// @notice Mapping of share token address to vault ID
    mapping(address => bytes32) private _shareTokenToVault;

    /// @notice Mapping of NFT contract + tokenId to vault ID (to prevent double-vaulting)
    mapping(bytes32 => bytes32) private _nftToVault;

    /// @notice Counter for generating unique vault IDs
    uint256 private _vaultCounter;

    /// @notice Custom errors
    error VaultNotFound(bytes32 vaultId);
    error VaultAlreadyExists(bytes32 vaultId);
    error NFTAlreadyVaulted(address nftContract, uint256 tokenId);
    error NotVaultCreator(bytes32 vaultId, address caller);
    error VaultNotOpen(bytes32 vaultId, VaultState currentState);
    error SharesNotBurned(bytes32 vaultId, uint256 remainingSupply);
    error InvalidAddress();
    error InvalidSymbol();

    /// @notice Constructor
    constructor() Ownable(msg.sender) {}

    /// @inheritdoc IMantleFracVault
    function createVault(
        address nftContract,
        uint256 tokenId,
        string calldata shareSymbol,
        string calldata shareName,
        uint256 maxSupply,
        string calldata policy
    ) external nonReentrant returns (bytes32 vaultId) {
        if (nftContract == address(0)) revert InvalidAddress();
        if (bytes(shareSymbol).length == 0) revert InvalidSymbol();

        // Check NFT not already vaulted
        bytes32 nftKey = keccak256(abi.encodePacked(nftContract, tokenId));
        if (_nftToVault[nftKey] != bytes32(0)) {
            revert NFTAlreadyVaulted(nftContract, tokenId);
        }

        // Generate vault ID
        vaultId = keccak256(abi.encodePacked(block.chainid, address(this), ++_vaultCounter));

        // Transfer NFT to this contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        // Deploy share token
        VaultShareToken shareToken = new VaultShareToken(
            shareName,
            shareSymbol,
            vaultId,
            maxSupply,
            address(this)
        );

        // Create vault
        _vaults[vaultId] = Vault({
            nftContract: nftContract,
            tokenId: tokenId,
            shareToken: address(shareToken),
            creator: msg.sender,
            custodian: address(this),
            policy: policy,
            state: VaultState.Open,
            maxSupply: maxSupply,
            createdAt: block.timestamp
        });

        // Update mappings
        _shareTokenToVault[address(shareToken)] = vaultId;
        _nftToVault[nftKey] = vaultId;

        emit VaultCreated(vaultId, nftContract, tokenId, shareSymbol, address(shareToken), msg.sender);
    }

    /// @inheritdoc IMantleFracVault
    function redeemVault(bytes32 vaultId) external nonReentrant {
        Vault storage vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
        if (vault.creator != msg.sender) revert NotVaultCreator(vaultId, msg.sender);
        if (vault.state != VaultState.Open) revert VaultNotOpen(vaultId, vault.state);

        // Check all shares are burned
        VaultShareToken shareToken = VaultShareToken(vault.shareToken);
        uint256 totalSupply = shareToken.totalSupply();
        if (totalSupply > 0) revert SharesNotBurned(vaultId, totalSupply);

        // Update state
        VaultState oldState = vault.state;
        vault.state = VaultState.Redeemed;

        // Transfer NFT back to creator
        IERC721(vault.nftContract).safeTransferFrom(address(this), vault.creator, vault.tokenId);

        // Clear NFT mapping
        bytes32 nftKey = keccak256(abi.encodePacked(vault.nftContract, vault.tokenId));
        delete _nftToVault[nftKey];

        emit VaultStateChanged(vaultId, oldState, VaultState.Redeemed);
        emit VaultRedeemed(vaultId, msg.sender);
    }

    /// @inheritdoc IMantleFracVault
    function getVault(bytes32 vaultId) external view returns (Vault memory vault) {
        vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
    }

    /// @inheritdoc IMantleFracVault
    function getVaultByShareToken(address shareToken) external view returns (bytes32 vaultId) {
        vaultId = _shareTokenToVault[shareToken];
        if (vaultId == bytes32(0)) revert VaultNotFound(bytes32(0));
    }

    /// @inheritdoc IMantleFracVault
    function vaultExists(bytes32 vaultId) external view returns (bool exists) {
        return _vaults[vaultId].nftContract != address(0);
    }

    /// @notice Mints share tokens for a vault
    /// @param vaultId The vault ID
    /// @param to Recipient address
    /// @param amount Amount to mint
    function mintShares(bytes32 vaultId, address to, uint256 amount) external {
        Vault storage vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
        if (vault.creator != msg.sender) revert NotVaultCreator(vaultId, msg.sender);
        if (vault.state != VaultState.Open) revert VaultNotOpen(vaultId, vault.state);

        VaultShareToken(vault.shareToken).mint(to, amount);
    }

    /// @notice Burns share tokens for a vault
    /// @param vaultId The vault ID
    /// @param from Address to burn from
    /// @param amount Amount to burn
    function burnShares(bytes32 vaultId, address from, uint256 amount) external {
        Vault storage vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
        if (vault.creator != msg.sender) revert NotVaultCreator(vaultId, msg.sender);

        VaultShareToken(vault.shareToken).burn(from, amount);
    }

    /// @notice Sets transfer mode for vault's share token
    /// @param vaultId The vault ID
    /// @param mode New transfer mode
    function setShareTransferMode(bytes32 vaultId, IVaultShareToken.TransferMode mode) external {
        Vault storage vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
        if (vault.creator != msg.sender) revert NotVaultCreator(vaultId, msg.sender);

        VaultShareToken(vault.shareToken).setTransferMode(mode);
    }

    /// @notice Adds address to share token allowlist
    /// @param vaultId The vault ID
    /// @param account Address to add
    function addToShareAllowlist(bytes32 vaultId, address account) external {
        Vault storage vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
        if (vault.creator != msg.sender) revert NotVaultCreator(vaultId, msg.sender);

        VaultShareToken(vault.shareToken).addToAllowlist(account);
    }

    /// @notice Removes address from share token allowlist
    /// @param vaultId The vault ID
    /// @param account Address to remove
    function removeFromShareAllowlist(bytes32 vaultId, address account) external {
        Vault storage vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
        if (vault.creator != msg.sender) revert NotVaultCreator(vaultId, msg.sender);

        VaultShareToken(vault.shareToken).removeFromAllowlist(account);
    }

    /// @notice Pauses a vault (admin only)
    /// @param vaultId The vault ID
    function pauseVault(bytes32 vaultId) external onlyOwner {
        Vault storage vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
        if (vault.state != VaultState.Open) revert VaultNotOpen(vaultId, vault.state);

        VaultState oldState = vault.state;
        vault.state = VaultState.Paused;

        emit VaultStateChanged(vaultId, oldState, VaultState.Paused);
    }

    /// @notice Unpauses a vault (admin only)
    /// @param vaultId The vault ID
    function unpauseVault(bytes32 vaultId) external onlyOwner {
        Vault storage vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
        if (vault.state != VaultState.Paused) revert VaultNotOpen(vaultId, vault.state);

        vault.state = VaultState.Open;

        emit VaultStateChanged(vaultId, VaultState.Paused, VaultState.Open);
    }

    /// @notice Gets total supply of vault's share token
    /// @param vaultId The vault ID
    /// @return Total supply
    function getShareTotalSupply(bytes32 vaultId) external view returns (uint256) {
        Vault storage vault = _vaults[vaultId];
        if (vault.nftContract == address(0)) revert VaultNotFound(vaultId);
        return VaultShareToken(vault.shareToken).totalSupply();
    }

    /// @notice ERC721 receiver implementation
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
