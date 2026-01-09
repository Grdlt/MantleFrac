'use client';

import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from 'viem';

/**
 * Error codes for MantleFrac contracts
 */
export const ERROR_CODES = {
  // Vault errors
  VAULT_NOT_FOUND: 'VaultNotFound',
  VAULT_ALREADY_EXISTS: 'VaultAlreadyExists',
  VAULT_NOT_OPEN: 'VaultNotOpen',
  VAULT_HAS_SUPPLY: 'VaultHasSupply',
  NOT_VAULT_CREATOR: 'NotVaultCreator',
  
  // Share token errors
  MAX_SUPPLY_EXCEEDED: 'MaxSupplyExceeded',
  TRANSFER_NOT_ALLOWED: 'TransferNotAllowed',
  NOT_ON_ALLOWLIST: 'NotOnAllowlist',
  
  // Marketplace errors
  LISTING_NOT_FOUND: 'ListingNotFound',
  LISTING_NOT_OPEN: 'ListingNotOpen',
  LISTING_EXPIRED: 'ListingExpired',
  NOT_LISTING_SELLER: 'NotListingSeller',
  INSUFFICIENT_PAYMENT: 'InsufficientPayment',
  
  // AMM errors
  POOL_NOT_FOUND: 'PoolNotFound',
  POOL_ALREADY_EXISTS: 'PoolAlreadyExists',
  INSUFFICIENT_LIQUIDITY: 'InsufficientLiquidity',
  SLIPPAGE_EXCEEDED: 'SlippageExceeded',
  INVALID_TOKEN: 'InvalidToken',
  
  // Distribution errors
  PROGRAM_NOT_FOUND: 'ProgramNotFound',
  PROGRAM_NOT_ACTIVE: 'ProgramNotActive',
  ALREADY_CLAIMED: 'AlreadyClaimed',
  CLAIM_NOT_STARTED: 'ClaimNotStarted',
  CLAIM_ENDED: 'ClaimEnded',
} as const;

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.VAULT_NOT_FOUND]: 'Vault not found',
  [ERROR_CODES.VAULT_ALREADY_EXISTS]: 'A vault already exists for this NFT',
  [ERROR_CODES.VAULT_NOT_OPEN]: 'Vault is not open for operations',
  [ERROR_CODES.VAULT_HAS_SUPPLY]: 'Cannot redeem vault with outstanding shares',
  [ERROR_CODES.NOT_VAULT_CREATOR]: 'Only the vault creator can perform this action',
  
  [ERROR_CODES.MAX_SUPPLY_EXCEEDED]: 'Maximum supply would be exceeded',
  [ERROR_CODES.TRANSFER_NOT_ALLOWED]: 'Transfers are currently paused',
  [ERROR_CODES.NOT_ON_ALLOWLIST]: 'Address is not on the allowlist',
  
  [ERROR_CODES.LISTING_NOT_FOUND]: 'Listing not found',
  [ERROR_CODES.LISTING_NOT_OPEN]: 'Listing is no longer available',
  [ERROR_CODES.LISTING_EXPIRED]: 'Listing has expired',
  [ERROR_CODES.NOT_LISTING_SELLER]: 'Only the seller can cancel this listing',
  [ERROR_CODES.INSUFFICIENT_PAYMENT]: 'Insufficient payment amount',
  
  [ERROR_CODES.POOL_NOT_FOUND]: 'Liquidity pool not found',
  [ERROR_CODES.POOL_ALREADY_EXISTS]: 'A pool already exists for this token pair',
  [ERROR_CODES.INSUFFICIENT_LIQUIDITY]: 'Insufficient liquidity in pool',
  [ERROR_CODES.SLIPPAGE_EXCEEDED]: 'Price slippage exceeded tolerance',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid token for this pool',
  
  [ERROR_CODES.PROGRAM_NOT_FOUND]: 'Distribution program not found',
  [ERROR_CODES.PROGRAM_NOT_ACTIVE]: 'Distribution program is not active',
  [ERROR_CODES.ALREADY_CLAIMED]: 'You have already claimed this distribution',
  [ERROR_CODES.CLAIM_NOT_STARTED]: 'Claim period has not started yet',
  [ERROR_CODES.CLAIM_ENDED]: 'Claim period has ended',
};

/**
 * Parse contract error and return user-friendly message
 */
export function parseContractError(error: unknown): string {
  if (error instanceof UserRejectedRequestError) {
    return 'Transaction was rejected';
  }

  if (error instanceof BaseError) {
    const revertError = error.walk((e) => e instanceof ContractFunctionRevertedError);
    
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName;
      if (errorName && ERROR_MESSAGES[errorName]) {
        return ERROR_MESSAGES[errorName];
      }
      return revertError.shortMessage || 'Transaction failed';
    }

    return error.shortMessage || error.message;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    if (error.message.includes('gas')) {
      return 'Transaction ran out of gas';
    }
    if (error.message.includes('nonce')) {
      return 'Transaction nonce error. Please try again.';
    }
    return error.message;
  }

  return 'An unknown error occurred';
}

/**
 * Transaction error type
 */
export interface TransactionError {
  code: string;
  message: string;
  details?: string;
}

/**
 * Create a structured transaction error
 */
export function createTransactionError(error: unknown): TransactionError {
  const message = parseContractError(error);
  
  let code = 'UNKNOWN_ERROR';
  if (error instanceof UserRejectedRequestError) {
    code = 'USER_REJECTED';
  } else if (error instanceof ContractFunctionRevertedError) {
    code = error.data?.errorName || 'CONTRACT_REVERT';
  }

  return {
    code,
    message,
    details: error instanceof Error ? error.message : undefined,
  };
}
