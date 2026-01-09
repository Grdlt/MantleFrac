/**
 * Contract interaction hooks for MantleFrac
 * Re-exports all hooks for easy importing
 */

// Vault hooks
export {
  useVaultRead,
  useVaultExists,
  useCreateVault,
  useRedeemVault,
  VaultState,
  type Vault,
} from './useVault';

// Listing hooks
export {
  useListingRead,
  useListingsByVault,
  useListingsBySeller,
  useCreateListing,
  useFillListing,
  useCancelListing,
  ListingStatus,
  type Listing,
} from './useListing';

// Pool hooks
export {
  usePoolRead,
  useLpBalance,
  useAmountOut,
  useCreatePool,
  useAddLiquidity,
  useRemoveLiquidity,
  useSwap,
  type Pool,
} from './usePool';

// Distribution hooks
export {
  useProgramRead,
  useProgramsByVault,
  useClaimableAmount,
  useHasClaimed,
  useScheduleDistribution,
  useClaimPayout,
  useClaimMultiple,
  type Program,
} from './useDistribution';
