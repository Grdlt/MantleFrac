/**
 * MantleFrac EVM GraphQL API Server
 */

import Fastify from 'fastify';
import mercurius from 'mercurius';
import { Client as Cassandra } from 'cassandra-driver';
import * as promClient from 'prom-client';
import cors from '@fastify/cors';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import { ENV } from './config.js';
import typeDefs from './schema.js';
import buildResolvers from './resolvers.js';

/**
 * 下载 Astra DB Secure Connect Bundle
 */
async function downloadSecureBundle(dbId: string, token: string): Promise<string> {
  const bundlePath = path.join(os.tmpdir(), `secure-connect-${dbId}.zip`);

  // 如果已经下载过，直接返回
  if (fs.existsSync(bundlePath)) {
    console.log(`Using cached Secure Bundle: ${bundlePath}`);
    return bundlePath;
  }

  console.log('Downloading Astra DB Secure Connect Bundle...');

  // 首先获取下载 URL
  const urlResponse = await fetch(
    `https://api.astra.datastax.com/v2/databases/${dbId}/secureBundleURL`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!urlResponse.ok) {
    throw new Error(`Failed to get bundle URL: ${urlResponse.status} ${await urlResponse.text()}`);
  }

  const { downloadURL } = await urlResponse.json() as { downloadURL: string };

  // 下载 Bundle
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(bundlePath);
    https.get(downloadURL, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Secure Bundle downloaded to: ${bundlePath}`);
        resolve(bundlePath);
      });
    }).on('error', (err) => {
      fs.unlink(bundlePath, () => { });
      reject(err);
    });
  });
}

/**
 * 创建 Cassandra 客户端
 */
async function createCassandraClient(): Promise<Cassandra> {
  if (ENV.USE_ASTRA) {
    let secureConnectBundlePath = ENV.ASTRA_SECURE_BUNDLE_PATH;

    // 如果提供了 Base64 编码的 Bundle，解码并写入临时文件
    if (ENV.ASTRA_SECURE_BUNDLE_BASE64 && !secureConnectBundlePath) {
      const tempDir = os.tmpdir();
      secureConnectBundlePath = path.join(tempDir, 'secure-connect-bundle.zip');
      const bundleData = Buffer.from(ENV.ASTRA_SECURE_BUNDLE_BASE64, 'base64');
      fs.writeFileSync(secureConnectBundlePath, bundleData);
      console.log(`Secure Connect Bundle written to: ${secureConnectBundlePath}`);
    }

    // 如果提供了 DB ID，自动下载 Bundle
    if (!secureConnectBundlePath && ENV.ASTRA_DB_ID) {
      secureConnectBundlePath = await downloadSecureBundle(
        ENV.ASTRA_DB_ID,
        ENV.ASTRA_DB_APPLICATION_TOKEN
      );
    }

    if (!secureConnectBundlePath) {
      throw new Error('Astra DB requires ASTRA_DB_ID or ASTRA_SECURE_BUNDLE_PATH/BASE64');
    }

    console.log(`Connecting to Astra DB with bundle: ${secureConnectBundlePath}`);
    return new Cassandra({
      cloud: {
        secureConnectBundle: secureConnectBundlePath,
      },
      credentials: {
        username: 'token',
        password: ENV.ASTRA_DB_APPLICATION_TOKEN,
      },
      keyspace: ENV.CASSANDRA_KEYSPACE,
    });
  }

  // 本地 Cassandra/ScyllaDB
  console.log(`Connecting to local Cassandra at: ${ENV.CASSANDRA_CONTACT_POINTS.join(', ')}`);
  return new Cassandra({
    contactPoints: ENV.CASSANDRA_CONTACT_POINTS,
    localDataCenter: ENV.CASSANDRA_LOCAL_DC,
    keyspace: ENV.CASSANDRA_KEYSPACE,
    queryOptions: { consistency: 1 },
  });
}

async function buildServer() {
  const app = Fastify({ logger: false });

  // CORS configuration
  const corsOrigin =
    ENV.CORS_ORIGIN === '*'
      ? true
      : ENV.CORS_ORIGIN.split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
  });

  // Metrics
  const registry = new promClient.Registry();
  promClient.collectDefaultMetrics({ register: registry, prefix: 'mantlefrac_api_' });

  const httpReqs = new promClient.Counter({
    name: 'mantlefrac_api_http_requests_total',
    help: 'HTTP requests',
    registers: [registry],
    labelNames: ['route', 'code', 'method'],
  });

  app.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });

  app.get('/health', async () => {
    return {
      status: 'ok',
      network: ENV.NETWORK,
      chainId: ENV.CHAIN_ID,
      database: ENV.USE_ASTRA ? 'astra' : 'local',
    };
  });

  app.addHook('onResponse', async (req, reply) => {
    const route = req.url || 'unknown';
    httpReqs.inc({ route, code: String(reply.statusCode), method: req.method });
  });

  // Cassandra/Astra DB connection
  const cassandra = await createCassandraClient();

  try {
    await cassandra.connect();
    console.log(ENV.USE_ASTRA ? 'Connected to Astra DB' : 'Connected to Cassandra');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }

  // GraphQL
  await app.register(mercurius, {
    schema: typeDefs,
    resolvers: buildResolvers(cassandra),
    graphiql: ENV.NODE_ENV !== 'production',
    errorHandler: (error, _request, _reply) => {
      if (ENV.NODE_ENV !== 'production') {
        console.error('GraphQL error:', error.message || String(error));
      }
    },
  });

  // Contract addresses endpoint
  app.get('/contracts', async (_req, reply) => {
    reply.header('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
    return {
      network: ENV.NETWORK,
      chainId: ENV.CHAIN_ID,
      vault: ENV.VAULT_ADDRESS,
      marketplace: ENV.MARKETPLACE_ADDRESS,
      amm: ENV.AMM_ADDRESS,
      distributor: ENV.DISTRIBUTOR_ADDRESS,
    };
  });

  await app.listen({ host: ENV.HOST, port: ENV.PORT });
  console.log(`MantleFrac API ready on http://${ENV.HOST}:${ENV.PORT}/graphiql`);
}

buildServer().catch((e) => {
  console.error(e);
  process.exit(1);
});
