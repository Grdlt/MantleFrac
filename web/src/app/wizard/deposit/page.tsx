"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useCreateVault } from "@/hooks/contracts";
import { Button } from "@/components/ui/button";
import { isAddress, erc721Abi, decodeEventLog } from "viem";
import Link from "next/link";
import { TEST_NFT_ABI, TEST_NFT_ADDRESS } from "@/lib/abis/testNft";
import { getContractAddresses } from "@/lib/contracts";

export default function WizardDepositPage() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const addresses = getContractAddresses(chainId);
    const { createVault, isPending: isCreatePending, isConfirming: isCreateConfirming, isSuccess, hash, error } = useCreateVault();

    // Form State
    const [nftContract, setNftContract] = useState(TEST_NFT_ADDRESS);
    const [tokenId, setTokenId] = useState("");
    const [shareSymbol, setShareSymbol] = useState("");
    const [shareName, setShareName] = useState("");
    const [maxSupply, setMaxSupply] = useState("1000000");
    const [policy, setPolicy] = useState("");

    // Mint NFT state
    const { writeContract: mintNFT, data: mintHash, isPending: isMinting } = useWriteContract();
    const { isLoading: isMintConfirming, isSuccess: isMintSuccess, data: mintReceipt } = useWaitForTransactionReceipt({ hash: mintHash });

    // Approve State
    const { writeContract: approveNFT, data: approveHash, isPending: isApproving, error: approveError } = useWriteContract();
    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

    // Read Approval
    const { data: approvedAddress, refetch: refetchApproval } = useReadContract({
        address: isAddress(nftContract) ? nftContract as `0x${string}` : undefined,
        abi: erc721Abi,
        functionName: "getApproved",
        args: tokenId ? [BigInt(tokenId)] : undefined,
        query: {
            enabled: isAddress(nftContract) && !!tokenId,
        }
    });

    const isApproved = approvedAddress === addresses?.mantleFracVault || isApproveSuccess;

    // Auto-fill Token ID when mint success
    useEffect(() => {
        if (isMintSuccess && mintReceipt) {
            console.log('Mint receipt:', mintReceipt); // Debug log

            // Try to find Token ID in logs
            for (const log of mintReceipt.logs) {
                try {
                    // If the log is from our TestNFT contract
                    if (log.address.toLowerCase() === TEST_NFT_ADDRESS.toLowerCase()) {
                        // For standard ERC721 Transfer(from, to, tokenId)
                        // topics[0] is event sig, topics[1] is from, topics[2] is to, topics[3] is tokenId
                        if (log.topics.length === 4) {
                            const id = BigInt(log.topics[3]).toString();
                            console.log('Found Token ID from topics:', id);
                            setTokenId(id);
                            break;
                        }
                    }

                    const decoded = decodeEventLog({
                        abi: TEST_NFT_ABI,
                        data: log.data,
                        topics: log.topics,
                    });

                    if (decoded.eventName === 'Transfer' && decoded.args.to?.toLowerCase() === address?.toLowerCase()) {
                        // @ts-ignore
                        const id = decoded.args.tokenId?.toString();
                        if (id) {
                            console.log('Found Token ID from decoded log:', id);
                            setTokenId(id);
                            break;
                        }
                    }
                } catch (e) {
                    console.error("Log parse error", e);
                }
            }
        }
    }, [isMintSuccess, mintReceipt, address]);

    // Refetch approval
    useEffect(() => {
        if (isApproveSuccess) {
            refetchApproval();
        }
    }, [isApproveSuccess, refetchApproval]);


    const handleMintNFT = async () => {
        if (!address) return;

        mintNFT({
            address: TEST_NFT_ADDRESS,
            abi: TEST_NFT_ABI,
            functionName: "mint",
            args: [address],
        });
    };

    const handleApprove = async () => {
        if (!addresses?.mantleFracVault || !tokenId) return;
        approveNFT({
            address: nftContract as `0x${string}`,
            abi: erc721Abi,
            functionName: "approve",
            args: [addresses.mantleFracVault, BigInt(tokenId)],
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAddress(nftContract)) {
            alert("Invalid NFT contract address");
            return;
        }

        try {
            await createVault({
                nftContract: nftContract as `0x${string}`,
                tokenId: BigInt(tokenId),
                shareSymbol,
                shareName,
                maxSupply: BigInt(maxSupply) * BigInt(10 ** 18),
                policy,
            });
        } catch (err) {
            console.error("Failed to create vault:", err);
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
                <div className="max-w-xl mx-auto text-center py-12">
                    <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
                    <p className="text-neutral-400 mb-6">
                        Please connect your wallet to create a vault.
                    </p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
                <div className="max-w-xl mx-auto text-center py-12">
                    <div className="text-green-400 text-5xl mb-4">✓</div>
                    <h1 className="text-2xl font-bold mb-4">Vault Created!</h1>
                    <p className="text-neutral-400 mb-6">
                        Your NFT has been fractionalized successfully.
                    </p>
                    {hash && (
                        <p className="text-xs text-neutral-500 mb-6 break-all">
                            Tx: {hash}
                        </p>
                    )}
                    <Button asChild>
                        <Link href="/">View Your Vaults</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const isCreateLoading = isCreatePending || isCreateConfirming;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Fractionalize NFT</h1>
                <p className="text-neutral-400 mb-8">
                    Deposit your NFT to create tradable share tokens.
                </p>

                {/* Mint Test NFT Section */}
                <div className="mb-8 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                    <h2 className="text-lg font-semibold text-amber-300 mb-2">
                        🎨 Need a Test NFT?
                    </h2>
                    <p className="text-sm text-neutral-400 mb-4">
                        Mint a free test NFT. <span className="text-yellow-400">If ID doesn&apos;t auto-fill, check your wallet transaction logs.</span>
                    </p>

                    {isMintSuccess && mintHash && (
                        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                            <p className="text-green-300 text-sm">
                                ✅ NFT Minted!
                            </p>
                            {tokenId && tokenId === String(parseInt(tokenId)) /* Simple check if set */ && (
                                <p className="text-green-300 font-bold text-sm mt-1">
                                    Auto-filled Token ID: {tokenId}
                                </p>
                            )}
                        </div>
                    )}

                    <Button
                        onClick={handleMintNFT}
                        disabled={isMinting || isMintConfirming}
                        variant="secondary"
                        className="bg-amber-500 hover:bg-amber-700"
                    >
                        {isMinting
                            ? "Minting..."
                            : isMintConfirming
                                ? "Confirming..."
                                : "Mint Test NFT"}
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            NFT Contract Address
                        </label>
                        <input
                            type="text"
                            value={nftContract}
                            onChange={(e) => setNftContract(e.target.value)}
                            placeholder="0x..."
                            required
                            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Token ID
                        </label>
                        <input
                            type="number"
                            value={tokenId}
                            onChange={(e) => setTokenId(e.target.value)}
                            placeholder="Check wallet activity for ID"
                            required
                            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                        />
                        {!tokenId && isMintSuccess && (
                            <p className="text-xs text-yellow-500 mt-1">
                                Could not auto-detect ID. Please check MantleScan for your latest transaction.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Share Symbol
                            </label>
                            <input
                                type="text"
                                value={shareSymbol}
                                onChange={(e) => setShareSymbol(e.target.value.toUpperCase())}
                                placeholder="SHARES"
                                maxLength={10}
                                required
                                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Share Name
                            </label>
                            <input
                                type="text"
                                value={shareName}
                                onChange={(e) => setShareName(e.target.value)}
                                placeholder="My NFT Shares"
                                required
                                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Max Supply
                        </label>
                        <input
                            type="number"
                            value={maxSupply}
                            onChange={(e) => setMaxSupply(e.target.value)}
                            placeholder="1000000"
                            required
                            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Vault Policy (Optional)
                        </label>
                        <input
                            type="text"
                            value={policy}
                            onChange={(e) => setPolicy(e.target.value)}
                            placeholder="e.g., Redemption requires 100% shares"
                            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    {approveError && (
                        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                            Approve Failed: {approveError.message || "Unknown error"}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                            Create Failed: {error.message || "An error occurred"}
                        </div>
                    )}

                    <div className="pt-4">
                        {!isApproved && tokenId ? (
                            <Button
                                type="button"
                                onClick={handleApprove}
                                disabled={isApproving || isApproveConfirming}
                                className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700"
                            >
                                {isApproving
                                    ? "Approving..."
                                    : isApproveConfirming
                                        ? "Confirming Approval..."
                                        : "1. Approve NFT Access"}
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isCreateLoading || !isApproved}
                                className={`w-full py-4 text-lg ${!isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isCreateLoading
                                    ? "Creating Vault..."
                                    : (!tokenId ? "Enter Token ID" : "2. Create Vault")}
                            </Button>
                        )}
                        {!isApproved && tokenId && (
                            <p className="text-center text-xs text-neutral-500 mt-2">
                                You must approve the vault contract to use your NFT before creating.
                            </p>
                        )}
                    </div>
                </form>

                <div className="mt-8 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <h3 className="text-sm font-medium text-neutral-300 mb-2">
                        Connected Info
                    </h3>
                    <p className="text-xs text-neutral-500">
                        Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                    <p className="text-xs text-neutral-500">Chain ID: {chainId}</p>
                </div>
            </div>
        </div>
    );
}

