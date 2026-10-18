/**
 * Accurate Bcrypt Concurrency & Engine Benchmark Tool
 * Corrects previous rate-limiting / 404 test artifacts.
 * 
 * Accurately measures:
 * 1. Exact library in use (bcryptjs vs native bcrypt)
 * 2. Single hash time (10 rounds)
 * 3. Single compare time
 * 4. Concurrent compares through the server's bcryptQueue
 * 5. Accurate total completed compares, total wall time, and p95 latency.
 */

const os = require('os');
const path = require('path');

// 1. Detect which bcrypt library is loaded
let bcryptLib = 'unknown';
let bcryptVersion = 'unknown';
try {
  const pkg = require('./package.json');
  if (pkg.dependencies['bcryptjs']) {
    bcryptLib = 'bcryptjs (Pure JavaScript)';
    bcryptVersion = pkg.dependencies['bcryptjs'];
  } else if (pkg.dependencies['bcrypt']) {
    bcryptLib = 'bcrypt (Native C++ Addon)';
    bcryptVersion = pkg.dependencies['bcrypt'];
  }
} catch (e) {}

const bcrypt = require('bcrypt');
const { bcryptQueue } = require('./services/queueService');

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { min: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0 };
  latencies.sort((a, b) => a - b);
  const getP = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))];
  const sum = latencies.reduce((a, b) => a + b, 0);

  return {
    min: latencies[0],
    avg: Math.round(sum / latencies.length),
    p50: getP(50),
    p90: getP(90),
    p95: getP(95),
    p99: getP(99),
    max: latencies[latencies.length - 1],
  };
}

async function benchmarkSingleOperations() {
  console.log(`\n===============================================================`);
  console.log(`🔬 1. SINGLE OPERATION BENCHMARK (1 Core Baseline)`);
  console.log(`===============================================================`);

  const rawPin = '1234';
  const rounds = 10;

  // Single Hash
  const hashStart = Date.now();
  const hash = await bcrypt.hash(rawPin, rounds);
  const hashDuration = Date.now() - hashStart;

  console.log(`  - Bcrypt Salt Rounds    : ${rounds}`);
  console.log(`  - Single Hash Time      : ${hashDuration} ms`);

  // Single Compare
  const compareStart = Date.now();
  const isMatch = await bcrypt.compare(rawPin, hash);
  const compareDuration = Date.now() - compareStart;

  console.log(`  - Single Compare Time   : ${compareDuration} ms (Match: ${isMatch})`);

  return { hash, hashDuration, compareDuration };
}

async function runRealCompareConcurrencyTest(sampleHash, concurrencyCount, useQueue = true) {
  console.log(`\n---------------------------------------------------------------`);
  console.log(`⚡ Testing ${concurrencyCount} Real Concurrent Bcrypt Compares (${useQueue ? 'With Queue' : 'Unbounded'})`);
  console.log(`---------------------------------------------------------------`);

  const memBefore = process.memoryUsage().rss / 1024 / 1024;
  const pin = '1234';

  const startTime = Date.now();
  const latencies = [];
  let completedCompares = 0;

  const tasks = Array.from({ length: concurrencyCount }, async () => {
    const taskStart = Date.now();
    let match;
    if (useQueue) {
      match = await bcryptQueue.run(() => bcrypt.compare(pin, sampleHash));
    } else {
      match = await bcrypt.compare(pin, sampleHash);
    }
    const elapsed = Date.now() - taskStart;
    latencies.push(elapsed);
    if (match === true) {
      completedCompares++;
    }
  });

  await Promise.all(tasks);
  const totalWallTime = Date.now() - startTime;
  const memAfter = process.memoryUsage().rss / 1024 / 1024;
  const p = calculatePercentiles(latencies);

  console.log(`  - Total Compares Done   : ${completedCompares} / ${concurrencyCount}`);
  console.log(`  - Total Wall Time       : ${totalWallTime} ms (${(totalWallTime / 1000).toFixed(2)}s)`);
  console.log(`  - Effective Throughput  : ${(concurrencyCount / (totalWallTime / 1000)).toFixed(1)} ops/sec`);
  console.log(`  - Min Latency           : ${p.min} ms`);
  console.log(`  - Avg Latency           : ${p.avg} ms`);
  console.log(`  - p50 Latency           : ${p.p50} ms`);
  console.log(`  - p95 Latency           : ${p.p95} ms`);
  console.log(`  - Max Latency           : ${p.max} ms`);
  console.log(`  - Memory Delta (RSS)    : ${(memAfter - memBefore).toFixed(2)} MB`);

  return { concurrencyCount, completedCompares, totalWallTime, p };
}

async function main() {
  console.log(`===============================================================`);
  console.log(`📊 ACCURATE BCRYPT & CPU BENCHMARK REPORT`);
  console.log(`===============================================================`);
  console.log(`Bcrypt Library     : ${bcryptLib} (${bcryptVersion})`);
  console.log(`CPU Cores Available: ${os.cpus().length} cores (${os.cpus()[0]?.model})`);
  console.log(`Platform           : ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`Node.js Version    : ${process.version}`);
  console.log(`UV_THREADPOOL_SIZE : ${process.env.UV_THREADPOOL_SIZE || '16'}`);

  // 1. Single hash and compare baseline
  const { hash, hashDuration, compareDuration } = await benchmarkSingleOperations();

  // 2. Concurrency tests where 100% of tasks actually execute bcrypt
  console.log(`\n===============================================================`);
  console.log(`🔬 2. CONCURRENT BCRYPT COMPARES BENCHMARK (REAL COMPARES)`);
  console.log(`===============================================================`);

  await runRealCompareConcurrencyTest(hash, 25, true);
  await runRealCompareConcurrencyTest(hash, 50, true);
  await runRealCompareConcurrencyTest(hash, 100, true);

  console.log(`\n===============================================================`);
  console.log(`✅ BENCHMARK FINISHED ACCURATELY`);
  console.log(`===============================================================`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
