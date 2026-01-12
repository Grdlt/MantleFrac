export default function PoolsPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <h1 className="text-3xl font-bold mb-6">Liquidity Pools</h1>
            <p className="text-neutral-400">
                Explore and provide liquidity to MantleFrac pools.
            </p>
            <div className="mt-8 p-6 border border-neutral-800 rounded-lg bg-neutral-900 text-center">
                <p className="text-neutral-500">No pools available yet.</p>
            </div>
        </div>
    );
}
