# MantleFrac API

MantleFrac GraphQL API for Mantle Network.

## Quick Start

### Local Development (with local Cassandra/ScyllaDB)

```bash
npm install
npm run dev
```

### With Astra DB (Cloud)

1. Create an Astra DB account at https://astra.datastax.com/
2. Create a database with keyspace `fractional`
3. Download the Secure Connect Bundle
4. Set environment variables:

```bash
export ASTRA_DB_APPLICATION_TOKEN="AstraCS:xxx..."
export ASTRA_SECURE_BUNDLE_PATH="/path/to/secure-connect-bundle.zip"
export CASSANDRA_KEYSPACE="fractional"
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `HOST` | Server host | `0.0.0.0` |
| `CORS_ORIGIN` | CORS origins (comma-separated or `*`) | `*` |
| `NETWORK` | Network name | `mantle-sepolia` |
| `RPC_URL` | Mantle RPC URL | `https://rpc.sepolia.mantle.xyz` |
| `CHAIN_ID` | Chain ID | `5003` |
| `CASSANDRA_CONTACT_POINTS` | Local Cassandra hosts | `localhost` |
| `CASSANDRA_KEYSPACE` | Database keyspace | `fractional` |
| `CASSANDRA_LOCAL_DC` | Local datacenter | `datacenter1` |
| `ASTRA_DB_APPLICATION_TOKEN` | Astra DB token (enables Astra mode) | - |
| `ASTRA_SECURE_BUNDLE_PATH` | Path to Secure Connect Bundle | - |
| `ASTRA_SECURE_BUNDLE_BASE64` | Base64 encoded bundle (for serverless) | - |

## Deploy to Railway

1. Connect GitHub repo to Railway
2. Set Root Directory to `services/api-evm`
3. Add environment variables:
   - `ASTRA_DB_APPLICATION_TOKEN`
   - `ASTRA_SECURE_BUNDLE_BASE64` (base64 encode the bundle file)
   - `CASSANDRA_KEYSPACE=fractional`
4. Deploy

## API Endpoints

- `GET /health` - Health check
- `GET /contracts` - Contract addresses
- `GET /metrics` - Prometheus metrics
- `GET /graphiql` - GraphQL playground (dev only)
- `POST /graphql` - GraphQL endpoint
