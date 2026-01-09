// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMantleFracVault
 * @notice Interface for the MantleFrac Vault contract
 * @dev Core vault management for NFT fractionalization on Mantle Network
 */
interface IMantleFracVault {
    /// @notice Vault state enumeration
    enum VaultState {
        Open,
        Paused,
        Redeemed
    }

    /// @notice Vault data structure
    struct Vault {
        address nftContract;
        uint256 tokenId;
        address shareToken;
        address creator;
        address custodian;
        string policy;
        VaultState state;
        uint256 maxSupply;
        uint256 createdAt;
    }

    /// @notice Emitted when a new vault is created
    event VaultCreated(
        bytes32 indexed vaultId,
        address indexed nftContract,
        uint256 tokenId,
        string shareSymbol,
        address shareToken,
        address indexed creator
    );

    /// @notice Emitted when a vault is redeemed
    event VaultRedeemed(bytes32 indexed vaultId, address indexed redeemer);

    /// @notice Emitted when vault state changes
    event VaultStateChanged(bytes32 indexed vaultId, VaultState oldState, VaultState newState);

    /// @notice Creates a new fractionalized vault
    /// @param nftContract Address of the NFT contract
    /// @param tokenId Token ID of the NFT to fractionalize
    /// @param shareSymbol Symbol for the share token
    /// @param shareName Name for the share token
    /// @param maxSupply Maximum supply of share tokens (0 for unlimited)
    /// @param policy Policy string for the vault
    /// @return vaultId The unique identifier for the created vault
    function createVault(
        address nftContract,
        uint256 tokenId,
        string calldata shareSymbol,
        string calldata shareName,
        uint256 maxSupply,
        string calldata policy
    ) external returns (bytes32 vaultId);

    /// @notice Redeems a vault and returns the underlying NFT
    /// @param vaultId The vault to redeem
    function redeemVault(bytes32 vaultId) external;

    /// @notice Gets vault information
    /// @param vaultId The vault ID to query
    /// @return vault The vault data
    function getVault(bytes32 vaultId) external view returns (Vault memory vault);

    /// @notice Gets vault ID by share token address
    /// @param shareToken The share token address
    /// @return vaultId The vault ID
    function getVaultByShareToken(address shareToken) external view returns (bytes32 vaultId);

    /// @notice Checks if a vault exists
    /// @param vaultId The vault ID to check
    /// @return exists True if vault exists
    function vaultExists(bytes32 vaultId) external view returns (bool exists);
}
