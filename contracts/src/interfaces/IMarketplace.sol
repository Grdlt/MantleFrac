// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMarketplace
 * @notice Interface for the MantleFrac marketplace
 * @dev Handles listing, buying, and selling of vault share tokens
 */
interface IMarketplace {
    /// @notice Listing status enumeration
    enum ListingStatus {
        Open,
        Filled,
        Cancelled,
        Expired
    }

    /// @notice Listing data structure
    struct Listing {
        bytes32 vaultId;
        address seller;
        address shareToken;
        uint256 shareAmount;
        address priceAsset;
        uint256 priceAmount;
        ListingStatus status;
        uint256 createdAt;
        uint256 expiresAt;
    }

    /// @notice Emitted when a listing is created
    event ListingCreated(
        bytes32 indexed listingId,
        bytes32 indexed vaultId,
        address indexed seller,
        uint256 shareAmount,
        address priceAsset,
        uint256 priceAmount
    );

    /// @notice Emitted when a listing is filled
    event ListingFilled(bytes32 indexed listingId, address indexed buyer, uint256 shareAmount, uint256 priceAmount);

    /// @notice Emitted when a listing is cancelled
    event ListingCancelled(bytes32 indexed listingId);

    /// @notice Emitted when a listing expires
    event ListingExpired(bytes32 indexed listingId);

    /// @notice Emitted when fees are collected
    event FeesCollected(
        bytes32 indexed listingId, address indexed token, uint256 totalFee, uint256 vaultShare, uint256 protocolShare
    );

    /// @notice Creates a new listing
    /// @param vaultId The vault ID
    /// @param shareAmount Amount of shares to sell
    /// @param priceAsset Asset to receive as payment
    /// @param priceAmount Price for all shares
    /// @param duration Listing duration in seconds (0 for no expiry)
    /// @return listingId The created listing ID
    function createListing(
        bytes32 vaultId,
        uint256 shareAmount,
        address priceAsset,
        uint256 priceAmount,
        uint256 duration
    ) external returns (bytes32 listingId);

    /// @notice Fills a listing (buys shares)
    /// @param listingId The listing to fill
    function fillListing(bytes32 listingId) external;

    /// @notice Cancels a listing
    /// @param listingId The listing to cancel
    function cancelListing(bytes32 listingId) external;

    /// @notice Gets listing information
    /// @param listingId The listing ID
    /// @return listing The listing data
    function getListing(bytes32 listingId) external view returns (Listing memory listing);

    /// @notice Gets all listings for a vault
    /// @param vaultId The vault ID
    /// @return listingIds Array of listing IDs
    function getListingsByVault(bytes32 vaultId) external view returns (bytes32[] memory listingIds);

    /// @notice Gets all listings by a seller
    /// @param seller The seller address
    /// @return listingIds Array of listing IDs
    function getListingsBySeller(address seller) external view returns (bytes32[] memory listingIds);
}
