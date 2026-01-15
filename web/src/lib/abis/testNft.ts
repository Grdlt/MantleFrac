// TestNFT ABI - Only the functions we need
export const TEST_NFT_ABI = [
    {
        inputs: [{ name: "to", type: "address" }],
        name: "mint",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "totalSupply",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

// TestNFT contract address on Mantle Sepolia
export const TEST_NFT_ADDRESS = "0xf67c8d183a1f450bb9e8813a3cbc1ffa485e5a53" as const;
