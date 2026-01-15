import Fastify from 'fastify';
import cors from '@fastify/cors';
import mercurius from 'mercurius';
import { typeDefs as schema } from './schema.js';
import { resolvers } from './resolvers.js';
import { ENV } from './config.js';
import { initDB } from './db/sqlite.js';
import { startSync } from './indexer/sync.js';

const app = Fastify({ logger: true });

app.register(cors, {
    origin: ENV.CORS_ORIGIN,
});

app.register(mercurius, {
    schema,
    resolvers,
    graphiql: true, // Enable GraphiQL at /graphiql
});

// Health check
app.get('/health', async () => {
    return { status: 'ok' };
});

const start = async () => {
    try {
        // 1. Initialize DB
        initDB();

        // 2. Start API Server
        await app.listen({ port: ENV.PORT, host: ENV.HOST });
        console.log(`Server listening on http://${ENV.HOST}:${ENV.PORT}`);
        console.log(`GraphiQL available at http://${ENV.HOST}:${ENV.PORT}/graphiql`);

        // 3. Start Indexer Sync (in background)
        startSync();

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
