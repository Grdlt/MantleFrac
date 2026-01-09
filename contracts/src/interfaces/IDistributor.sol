// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IDistributor
 * @notice Interface for the distribution/dividend contract
 * @dev Handles scheduling and claiming of distributions to share holders
 */
interface IDistributor {
    /// @notice Distribution program data structure
    struct Program {
        bytes32 vaultId;
        address asset;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startsAt;
        uint256 endsAt;
        uint256 snapshotBlock;
        bool active;
    }

    /// @notice Emitted when a distribution is scheduled
    event DistributionScheduled(
        bytes32 indexed programId,
        bytes32 indexed vaultId,
        address indexed asset,
        uint256 totalAmount,
        uint256 startsAt,
        uint256 endsAt,
        uint256 snapshotBlock
    );

    /// @notice Emitted when a payout is claimed
    event PayoutClaimed(bytes32 indexed programId, address indexed account, uint256 amount);

    /// @notice Emitted when a distribution is cancelled
    event DistributionCancelled(bytes32 indexed programId, uint256 remainingAmount);

    /// @notice Schedules a new distribution
    /// @param vaultId The vault ID
    /// @param asset The asset to distribute
    /// @param totalAmount Total amount to distribute
    /// @param startsAt Distribution start timestamp
    /// @param endsAt Distribution end timestamp
    /// @return programId The created program ID
    function scheduleDistribution(
        bytes32 vaultId,
        address asset,
        uint256 totalAmount,
        uint256 startsAt,
        uint256 endsAt
    ) external returns (bytes32 programId);

    /// @notice Claims payout from a distribution
    /// @param programId The program ID
    /// @return amount The claimed amount
    function claimPayout(bytes32 programId) external returns (uint256 amount);

    /// @notice Claims payouts from multiple distributions
    /// @param programIds Array of program IDs
    /// @return amounts Array of claimed amounts
    function claimMultiple(bytes32[] calldata programIds) external returns (uint256[] memory amounts);

    /// @notice Cancels a distribution (admin only)
    /// @param programId The program ID
    function cancelDistribution(bytes32 programId) external;

    /// @notice Gets program information
    /// @param programId The program ID
    /// @return program The program data
    function getProgram(bytes32 programId) external view returns (Program memory program);

    /// @notice Gets claimable amount for an account
    /// @param programId The program ID
    /// @param account The account address
    /// @return amount Claimable amount
    function getClaimableAmount(bytes32 programId, address account) external view returns (uint256 amount);

    /// @notice Checks if an account has claimed
    /// @param programId The program ID
    /// @param account The account address
    /// @return claimed True if already claimed
    function hasClaimed(bytes32 programId, address account) external view returns (bool claimed);

    /// @notice Gets all programs for a vault
    /// @param vaultId The vault ID
    /// @return programIds Array of program IDs
    function getProgramsByVault(bytes32 vaultId) external view returns (bytes32[] memory programIds);
}
