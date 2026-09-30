import { db } from '../src/lib/db';

async function main() {
    const potholes = await db.pothole.findMany({
        select: {
            id: true,
            title: true,
            latitude: true,
            longitude: true,
            status: true,
            city: true,
        },
    });

    console.log(`TOTAL POTHOLES IN DB: ${potholes.length}\n`);

    const clusters: Record<string, { count: number; ids: string[]; city: string }> = {};

    potholes.forEach((p) => {
        const key = `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`;
        if (!clusters[key]) {
            clusters[key] = { count: 0, ids: [], city: p.city || 'Unknown' };
        }
        clusters[key].count += 1;
        clusters[key].ids.push(p.id.slice(0, 6));
    });

    console.log('--- COORDINATE CLUSTER SUMMARY ---');
    Object.entries(clusters).forEach(([coord, data]) => {
        console.log(`Location [${coord}] (${data.city}): ${data.count} report(s)`);
    });

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
