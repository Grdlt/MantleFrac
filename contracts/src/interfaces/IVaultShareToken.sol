// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IVaultShareToken
 * @notice Interface for vault share tokens (ERC-20)
 * @dev Extends ERC-20 with transfer mode controls and minting restrictions
 */
interface IVaultShareToken is IERC20 {
    /// @notice Transfer mode enumeration
    enum TransferMode {
        Open,      // Anyone can transfer
        Allowlist, // Only allowlisted addresses can transfer
        Paused     // No transfers allowed (except admin)
    }

    /// @notice Emitted when transfer mode changes
    event TransferModeChanged(TransferMode oldMode, TransferMode newMode);

    /// @notice Emitted when an address is added to allowlist
    event AddedToAllowlist(address indexed account);

    /// @notice Emitted when an address is removed from allowlist
    event RemovedFromAllowlist(address indexed account);

    /// @notice Mints new share tokens
    /// @param to Recipient address
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external;

    /// @notice Burns share tokens
    /// @param from Address to burn from
    /// @param amount Amount to burn
    function burn(address from, uint256 amount) external;

    /// @notice Sets the transfer mode
    /// @param mode New transfer mode
    function setTransferMode(TransferMode mode) external;

    /// @notice Adds an address to the allowlist
    /// @param account Address to add
    function addToAllowlist(address account) external;

    /// @notice Removes an address from the allowlist
    /// @param account Address to remove
    function removeFromAllowlist(address account) external;

    /// @notice Checks if an address is on the allowlist
    /// @param account Address to check
    /// @return True if on allowlist
    function isAllowlisted(address account) external view returns (bool);

    /// @notice Gets the current transfer mode
    /// @return Current transfer mode
    function transferMode() external view returns (TransferMode);

    /// @notice Gets the maximum supply
    /// @return Maximum supply (0 if unlimited)
    function maxSupply() external view returns (uint256);

    /// @notice Gets the vault ID this token belongs to
    /// @return Vault ID
    function vaultId() external view returns (bytes32);
}
