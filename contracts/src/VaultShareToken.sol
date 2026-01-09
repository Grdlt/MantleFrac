// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IVaultShareToken.sol";

/**
 * @title VaultShareToken
 * @notice ERC-20 token representing fractional ownership of a vault
 * @dev Implements transfer mode controls and minting restrictions
 */
contract VaultShareToken is ERC20, Ownable, IVaultShareToken {
    /// @notice The vault ID this token belongs to
    bytes32 public immutable vaultId;

    /// @notice Maximum supply (0 = unlimited)
    uint256 public immutable maxSupply;

    /// @notice Current transfer mode
    TransferMode public transferMode;

    /// @notice Allowlist mapping
    mapping(address => bool) private _allowlist;

    /// @notice Custom errors
    error MaxSupplyExceeded(uint256 requested, uint256 available);
    error TransferNotAllowed(address from, address to, TransferMode mode);
    error NotOnAllowlist(address account);
    error ZeroAddress();

    /// @notice Constructor
    /// @param _name Token name
    /// @param _symbol Token symbol
    /// @param _vaultId Associated vault ID
    /// @param _maxSupply Maximum supply (0 for unlimited)
    /// @param _owner Owner address (typically the vault contract)
    constructor(string memory _name, string memory _symbol, bytes32 _vaultId, uint256 _maxSupply, address _owner)
        ERC20(_name, _symbol)
        Ownable(_owner)
    {
        vaultId = _vaultId;
        maxSupply = _maxSupply;
        transferMode = TransferMode.Open;
    }

    /// @inheritdoc IVaultShareToken
    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();

        if (maxSupply > 0) {
            uint256 available = maxSupply - totalSupply();
            if (amount > available) {
                revert MaxSupplyExceeded(amount, available);
            }
        }

        _mint(to, amount);
    }

    /// @inheritdoc IVaultShareToken
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /// @inheritdoc IVaultShareToken
    function setTransferMode(TransferMode mode) external onlyOwner {
        TransferMode oldMode = transferMode;
        transferMode = mode;
        emit TransferModeChanged(oldMode, mode);
    }

    /// @inheritdoc IVaultShareToken
    function addToAllowlist(address account) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        _allowlist[account] = true;
        emit AddedToAllowlist(account);
    }

    /// @inheritdoc IVaultShareToken
    function removeFromAllowlist(address account) external onlyOwner {
        _allowlist[account] = false;
        emit RemovedFromAllowlist(account);
    }

    /// @inheritdoc IVaultShareToken
    function isAllowlisted(address account) external view returns (bool) {
        return _allowlist[account];
    }

    /// @notice Override transfer to enforce transfer mode
    function _update(address from, address to, uint256 amount) internal virtual override {
        // Skip checks for minting (from == 0) and burning (to == 0)
        if (from != address(0) && to != address(0)) {
            _checkTransferAllowed(from, to);
        }

        super._update(from, to, amount);
    }

    /// @notice Checks if transfer is allowed based on current mode
    function _checkTransferAllowed(address from, address to) internal view {
        // Owner (vault contract) can always transfer
        if (from == owner() || to == owner()) {
            return;
        }

        if (transferMode == TransferMode.Paused) {
            revert TransferNotAllowed(from, to, TransferMode.Paused);
        }

        if (transferMode == TransferMode.Allowlist) {
            if (!_allowlist[from]) {
                revert NotOnAllowlist(from);
            }
            if (!_allowlist[to]) {
                revert NotOnAllowlist(to);
            }
        }

        // TransferMode.Open allows all transfers
    }
}
