const cacheService = require('./services/cacheService');

async function runSingleFlightTest() {
  console.log('================================================================');
  console.log('🧪 TEST: Single-Flight Cache-or-Fetch (200 Parallel Requests)');
  console.log('================================================================');

  cacheService.flush();

  let dbQueryCount = 0;
  const mockDbFetch = async () => {
    dbQueryCount++;
    // Simulate real database I/O latency (50ms)
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      quizId: 'quiz_6aa27e8b9ed8c0b21b05bb90',
      title: 'General Knowledge Olympiad',
      questionsCount: 15,
      timestamp: Date.now(),
    };
  };

  const key = 'quiz_meta_cold_cache_test';

  console.log('Firing 200 concurrent requests on cold cache key:', key);
  const startTime = Date.now();

  const requests = Array.from({ length: 200 }).map((_, idx) => {
    return cacheService.getOrSet(key, mockDbFetch, 60);
  });

  const results = await Promise.all(requests);
  const durationMs = Date.now() - startTime;

  console.log(`\nResults:`);
  console.log(`- Total Parallel Requests Processed : ${results.length}`);
  console.log(`- Total Wall Time                   : ${durationMs} ms`);
  console.log(`- Measured DB Query Count           : ${dbQueryCount} (Expected: 1)`);

  const allEqual = results.every(
    (res) =>
      res &&
      res.quizId === 'quiz_6aa27e8b9ed8c0b21b05bb90' &&
      res.timestamp === results[0].timestamp
  );
  console.log(`- All 200 Received Identical Data   : ${allEqual}`);

  if (dbQueryCount === 1 && allEqual) {
    console.log('\n✅ PASS: Single-flight memoization successfully collapsed 200 requests into exactly 1 DB query!');
  } else {
    console.error(`\n❌ FAIL: Expected 1 DB query, but got ${dbQueryCount}`);
    process.exit(1);
  }
}

runSingleFlightTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
