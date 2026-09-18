import { db } from '../../src/lib/db';

export async function runDbPoolLoadTests() {
    console.log('--- [LOAD SPIKE TEST] Neon PostgreSQL Database Connection Pool Stress ---');

    const totalQueries = 50;
    const startTime = Date.now();

    try {
        const queryPromises = Array.from({ length: totalQueries }).map(async (_, idx) => {
            return db.user.findFirst({
                select: { id: true, email: true },
            });
        });

        const results = await Promise.all(queryPromises);
        const elapsedMs = Date.now() - startTime;

        const validResults = results.filter(Boolean);

        console.log(`  📊 ${totalQueries} Concurrent DB Pool Queries executed in ${elapsedMs} ms`);
        console.log(`  📊 Successful Query Responses: ${validResults.length} / ${totalQueries}`);

        if (validResults.length === totalQueries) {
            console.log('  ✅ DB Connection Pool High Concurrency Stress: PASSED');
        } else {
            console.error('❌ DB Pool Stress Test: FAILED (Some queries returned null)');
            return false;
        }
    } catch (err) {
        console.error('❌ DB Pool Stress Test: FAILED with error', err);
        return false;
    }

    console.log('✅ DB Pool Concurrency Suite: ALL BENCHMARKS PASSED');
    return true;
}
