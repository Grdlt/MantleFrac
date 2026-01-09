// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IDistributor.sol";
import "./interfaces/IMantleFracVault.sol";
import "./VaultShareToken.sol";

/**
 * @title Distributor
 * @notice Distribution/dividend contract for share token holders
 * @dev Implements snapshot-based proportional distribution
 */
contract Distributor is IDistributor, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Reference to the vault contract
    IMantleFracVault public immutable vaultContract;

    /// @notice Mapping of program ID to program data
    mapping(bytes32 => Program) private _programs;

    /// @notice Mapping of program ID to claimed status per account
    mapping(bytes32 => mapping(address => bool)) private _claimed;

    /// @notice Mapping of program ID to snapshot total supply
    mapping(bytes32 => uint256) private _snapshotTotalSupply;

    /// @notice Mapping of vault ID to program IDs
    mapping(bytes32 => bytes32[]) private _vaultPrograms;

    /// @notice Counter for generating unique program IDs
    uint256 private _programCounter;

    /// @notice Custom errors
    error ProgramNotFound(bytes32 programId);
    error ProgramNotActive(bytes32 programId);
    error ProgramNotStarted(bytes32 programId, uint256 startsAt);
    error ProgramEnded(bytes32 programId, uint256 endsAt);
    error AlreadyClaimed(bytes32 programId, address account);
    error NothingToClaim(bytes32 programId, address account);
    error VaultNotFound(bytes32 vaultId);
    error NotVaultCreator(bytes32 vaultId, address caller);
    error InvalidAmount();
    error InvalidTimeWindow();

    /// @notice Constructor
    /// @param _vaultContract Address of the MantleFracVault contract
    constructor(address _vaultContract) Ownable(msg.sender) {
        vaultContract = IMantleFracVault(_vaultContract);
    }

    /// @inheritdoc IDistributor
    function scheduleDistribution(
        bytes32 vaultId,
        address asset,
        uint256 totalAmount,
        uint256 startsAt,
        uint256 endsAt
    ) external nonReentrant returns (bytes32 programId) {
        if (totalAmount == 0) revert InvalidAmount();
        if (startsAt >= endsAt) revert InvalidTimeWindow();
        if (startsAt < block.timestamp) revert InvalidTimeWindow();

        // Verify vault exists and caller is creator
        if (!vaultContract.vaultExists(vaultId)) revert VaultNotFound(vaultId);
        IMantleFracVault.Vault memory vault = vaultContract.getVault(vaultId);
        if (vault.creator != msg.sender) revert NotVaultCreator(vaultId, msg.sender);

        // Generate program ID
        programId = keccak256(abi.encodePacked(block.chainid, address(this), ++_programCounter));

        // Get current total supply for snapshot
        uint256 snapshotSupply = IERC20(vault.shareToken).totalSupply();
        if (snapshotSupply == 0) revert InvalidAmount();

        // Transfer distribution asset
        IERC20(asset).safeTransferFrom(msg.sender, address(this), totalAmount);

        // Create program
        _programs[programId] = Program({
            vaultId: vaultId,
            asset: asset,
            totalAmount: totalAmount,
            claimedAmount: 0,
            startsAt: startsAt,
            endsAt: endsAt,
            snapshotBlock: block.number,
            active: true
        });

        // Store snapshot total supply
        _snapshotTotalSupply[programId] = snapshotSupply;

        // Update vault programs mapping
        _vaultPrograms[vaultId].push(programId);

        emit DistributionScheduled(programId, vaultId, asset, totalAmount, startsAt, endsAt, block.number);
    }

    /// @inheritdoc IDistributor
    function claimPayout(bytes32 programId) external nonReentrant returns (uint256 amount) {
        Program storage program = _programs[programId];
        if (!program.active) revert ProgramNotFound(programId);
        if (block.timestamp < program.startsAt) revert ProgramNotStarted(programId, program.startsAt);
        if (block.timestamp > program.endsAt) revert ProgramEnded(programId, program.endsAt);
        if (_claimed[programId][msg.sender]) revert AlreadyClaimed(programId, msg.sender);

        // Calculate claimable amount
        amount = _calculateClaimAmount(programId, msg.sender);
        if (amount == 0) revert NothingToClaim(programId, msg.sender);

        // Mark as claimed
        _claimed[programId][msg.sender] = true;
        program.claimedAmount += amount;

        // Transfer payout
        IERC20(program.asset).safeTransfer(msg.sender, amount);

        emit PayoutClaimed(programId, msg.sender, amount);
    }

    /// @inheritdoc IDistributor
    function claimMultiple(bytes32[] calldata programIds) external nonReentrant returns (uint256[] memory amounts) {
        amounts = new uint256[](programIds.length);

        for (uint256 i = 0; i < programIds.length; i++) {
            bytes32 programId = programIds[i];
            Program storage program = _programs[programId];

            // Skip invalid programs
            if (!program.active) continue;
            if (block.timestamp < program.startsAt) continue;
            if (block.timestamp > program.endsAt) continue;
            if (_claimed[programId][msg.sender]) continue;

            uint256 amount = _calculateClaimAmount(programId, msg.sender);
            if (amount == 0) continue;

            // Mark as claimed
            _claimed[programId][msg.sender] = true;
            program.claimedAmount += amount;
            amounts[i] = amount;

            // Transfer payout
            IERC20(program.asset).safeTransfer(msg.sender, amount);

            emit PayoutClaimed(programId, msg.sender, amount);
        }
    }

    /// @inheritdoc IDistributor
    function cancelDistribution(bytes32 programId) external nonReentrant {
        Program storage program = _programs[programId];
        if (!program.active) revert ProgramNotFound(programId);

        // Only vault creator or owner can cancel
        IMantleFracVault.Vault memory vault = vaultContract.getVault(program.vaultId);
        require(msg.sender == vault.creator || msg.sender == owner(), "Not authorized");

        // Calculate remaining amount
        uint256 remaining = program.totalAmount - program.claimedAmount;

        // Deactivate program
        program.active = false;

        // Return remaining funds to vault creator
        if (remaining > 0) {
            IERC20(program.asset).safeTransfer(vault.creator, remaining);
        }

        emit DistributionCancelled(programId, remaining);
    }

    /// @inheritdoc IDistributor
    function getProgram(bytes32 programId) external view returns (Program memory program) {
        program = _programs[programId];
        if (program.asset == address(0)) revert ProgramNotFound(programId);
    }

    /// @inheritdoc IDistributor
    function getClaimableAmount(bytes32 programId, address account) external view returns (uint256 amount) {
        Program storage program = _programs[programId];
        if (!program.active) return 0;
        if (block.timestamp < program.startsAt) return 0;
        if (block.timestamp > program.endsAt) return 0;
        if (_claimed[programId][account]) return 0;

        return _calculateClaimAmount(programId, account);
    }

    /// @inheritdoc IDistributor
    function hasClaimed(bytes32 programId, address account) external view returns (bool claimed) {
        return _claimed[programId][account];
    }

    /// @inheritdoc IDistributor
    function getProgramsByVault(bytes32 vaultId) external view returns (bytes32[] memory programIds) {
        return _vaultPrograms[vaultId];
    }

    /// @notice Calculates claim amount for an account
    /// @param programId The program ID
    /// @param account The account address
    /// @return amount The claimable amount
    function _calculateClaimAmount(bytes32 programId, address account) internal view returns (uint256 amount) {
        Program storage program = _programs[programId];
        IMantleFracVault.Vault memory vault = vaultContract.getVault(program.vaultId);

        // Get account's share balance
        uint256 accountBalance = IERC20(vault.shareToken).balanceOf(account);
        if (accountBalance == 0) return 0;

        // Get snapshot total supply
        uint256 totalSupply = _snapshotTotalSupply[programId];
        if (totalSupply == 0) return 0;

        // Calculate proportional share
        // amount = (accountBalance / totalSupply) * totalAmount
        amount = (accountBalance * program.totalAmount) / totalSupply;
    }

    /// @notice Gets snapshot total supply for a program
    /// @param programId The program ID
    /// @return totalSupply The snapshot total supply
    function getSnapshotTotalSupply(bytes32 programId) external view returns (uint256 totalSupply) {
        return _snapshotTotalSupply[programId];
    }
}
