import { db } from '../src/lib/db';
import { randomUUID } from 'crypto';

interface CitySeedConfig {
    name: string;
    state: string;
    lat: number;
    lng: number;
    bbox: [number, number, number, number];
}

const ALL_INDIAN_MUNICIPALITIES: CitySeedConfig[] = [
    // --- DELHI NCR & UT ---
    { name: 'Municipal Corporation of Delhi (MCD)', state: 'Delhi', lat: 28.6139, lng: 77.2090, bbox: [76.84, 28.41, 77.34, 28.88] },
    { name: 'New Delhi Municipal Council (NDMC)', state: 'Delhi', lat: 28.6000, lng: 77.2100, bbox: [77.18, 28.58, 77.25, 28.64] },
    { name: 'Municipal Corporation of Gurugram (MCG)', state: 'Haryana', lat: 28.4595, lng: 77.0266, bbox: [76.95, 28.38, 77.15, 28.52] },
    { name: 'Faridabad Municipal Corporation (FMC)', state: 'Haryana', lat: 28.4089, lng: 77.3178, bbox: [77.22, 28.30, 77.38, 28.50] },
    { name: 'Noida Authority (NIDA)', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910, bbox: [77.30, 28.45, 77.45, 28.62] },
    { name: 'Greater Noida Industrial Development Authority (GNIDA)', state: 'Uttar Pradesh', lat: 28.4744, lng: 77.5040, bbox: [77.42, 28.35, 77.60, 28.58] },
    { name: 'Ghaziabad Municipal Corporation (GMC)', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538, bbox: [77.32, 28.58, 77.55, 28.75] },
    { name: 'Municipal Corporation Chandigarh (MCC)', state: 'Chandigarh', lat: 30.7333, lng: 76.7794, bbox: [76.72, 30.68, 76.84, 30.79] },
    // --- MAHARASHTRA ---
    { name: 'Brihanmumbai Municipal Corporation (BMC)', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, bbox: [72.77, 18.88, 72.99, 19.30] },
    { name: 'Navi Mumbai Municipal Corporation (NMMC)', state: 'Maharashtra', lat: 19.0330, lng: 73.0297, bbox: [72.98, 19.00, 73.12, 19.18] },
    { name: 'Thane Municipal Corporation (TMC)', state: 'Maharashtra', lat: 19.2183, lng: 72.9781, bbox: [72.93, 19.16, 73.05, 19.30] },
    { name: 'Pune Municipal Corporation (PMC)', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, bbox: [73.74, 18.42, 73.98, 18.62] },
    { name: 'Pimpri-Chinchwad Municipal Corporation (PCMC)', state: 'Maharashtra', lat: 18.6298, lng: 73.7997, bbox: [73.72, 18.58, 73.92, 18.72] },
    { name: 'Nagpur Municipal Corporation (NMC)', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, bbox: [78.98, 21.05, 79.18, 21.22] },
    { name: 'Nashik Municipal Corporation (NMC)', state: 'Maharashtra', lat: 20.0059, lng: 73.7898, bbox: [73.70, 19.92, 73.88, 20.08] },
    { name: 'Kalyan-Dombivli Municipal Corporation (KDMC)', state: 'Maharashtra', lat: 19.2403, lng: 73.1305, bbox: [73.05, 19.18, 73.20, 19.28] },
    { name: 'Vasai-Virar City Municipal Corporation (VVMC)', state: 'Maharashtra', lat: 19.3919, lng: 72.8397, bbox: [72.78, 19.30, 72.90, 19.48] },
    { name: 'Chhatrapati Sambhajinagar Municipal Corporation (ASMC)', state: 'Maharashtra', lat: 19.8762, lng: 75.3433, bbox: [75.25, 19.80, 75.42, 19.95] },
    { name: 'Solapur Municipal Corporation (SMC)', state: 'Maharashtra', lat: 17.6599, lng: 75.9064, bbox: [75.82, 17.58, 75.98, 17.72] },
    { name: 'Kolhapur Municipal Corporation (KMC)', state: 'Maharashtra', lat: 16.7050, lng: 74.2433, bbox: [74.18, 16.64, 74.30, 16.76] },
    // --- KARNATAKA ---
    { name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)', state: 'Karnataka', lat: 12.9716, lng: 77.5946, bbox: [77.45, 12.82, 77.78, 13.15] },
    { name: 'Mysuru City Corporation (MCC)', state: 'Karnataka', lat: 12.2958, lng: 76.6394, bbox: [76.58, 12.24, 76.70, 12.35] },
    { name: 'Hubballi-Dharwad Municipal Corporation (HDMC)', state: 'Karnataka', lat: 15.3647, lng: 75.1240, bbox: [75.02, 15.28, 75.22, 15.45] },
    { name: 'Mangaluru City Corporation (MCC)', state: 'Karnataka', lat: 12.9141, lng: 74.8560, bbox: [74.80, 12.84, 74.92, 12.98] },
    { name: 'Belagavi City Corporation (BCC)', state: 'Karnataka', lat: 15.8497, lng: 74.4977, bbox: [74.44, 15.80, 74.55, 15.90] },
    // --- TELANGANA & ANDHRA PRADESH ---
    { name: 'Greater Hyderabad Municipal Corporation (GHMC)', state: 'Telangana', lat: 17.3850, lng: 78.4867, bbox: [78.22, 17.22, 78.65, 17.58] },
    { name: 'Warangal Municipal Corporation (GWMC)', state: 'Telangana', lat: 17.9689, lng: 79.5941, bbox: [79.52, 17.90, 79.66, 18.04] },
    { name: 'Greater Visakhapatnam Municipal Corporation (GVMC)', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, bbox: [83.15, 17.65, 83.40, 17.85] },
    { name: 'Vijayawada Municipal Corporation (VMC)', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480, bbox: [80.58, 16.48, 80.72, 16.58] },
    { name: 'Guntur Municipal Corporation (GMC)', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365, bbox: [80.38, 16.24, 80.50, 16.36] },
    // --- TAMIL NADU ---
    { name: 'Greater Chennai Corporation (GCC)', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, bbox: [80.12, 12.90, 80.32, 13.24] },
    { name: 'Coimbatore Municipal Corporation (CMC)', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, bbox: [76.90, 10.92, 77.08, 11.08] },
    { name: 'Madurai Corporation (MMC)', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198, bbox: [78.05, 9.86, 78.18, 9.98] },
    { name: 'Tiruchirappalli City Corporation (TCC)', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047, bbox: [78.64, 10.73, 78.76, 10.85] },
    { name: 'Salem City Municipal Corporation (SMC)', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460, bbox: [78.08, 11.60, 78.20, 11.72] },
    // --- WEST BENGAL ---
    { name: 'Kolkata Municipal Corporation (KMC)', state: 'West Bengal', lat: 22.5726, lng: 88.3639, bbox: [88.26, 22.45, 88.44, 22.65] },
    { name: 'Howrah Municipal Corporation (HMC)', state: 'West Bengal', lat: 22.5958, lng: 88.2636, bbox: [88.20, 22.54, 88.32, 22.64] },
    { name: 'Siliguri Municipal Corporation (SMC)', state: 'West Bengal', lat: 26.7271, lng: 88.3953, bbox: [88.34, 26.67, 88.45, 26.78] },
    { name: 'Asansol Municipal Corporation (AMC)', state: 'West Bengal', lat: 23.6889, lng: 86.9661, bbox: [86.90, 23.62, 87.04, 23.75] },
    // --- GUJARAT ---
    { name: 'Ahmedabad Municipal Corporation (AMC)', state: 'Gujarat', lat: 23.0225, lng: 72.5714, bbox: [72.48, 22.92, 72.68, 23.12] },
    { name: 'Surat Municipal Corporation (SMC)', state: 'Gujarat', lat: 21.1702, lng: 72.8311, bbox: [72.75, 21.10, 72.92, 21.28] },
    { name: 'Vadodara Municipal Corporation (VMC)', state: 'Gujarat', lat: 22.3072, lng: 73.1812, bbox: [73.12, 22.24, 73.25, 22.37] },
    { name: 'Rajkot Municipal Corporation (RMC)', state: 'Gujarat', lat: 22.3039, lng: 70.8022, bbox: [70.74, 22.24, 70.86, 22.36] },
    // --- RAJASTHAN ---
    { name: 'Jaipur Greater Municipal Corporation (JMC)', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, bbox: [75.70, 26.80, 75.92, 27.02] },
    { name: 'Jodhpur Municipal Corporation (JMC)', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, bbox: [72.96, 26.18, 73.08, 26.30] },
    { name: 'Kota Municipal Corporation (KMC)', state: 'Rajasthan', lat: 25.2138, lng: 75.8648, bbox: [75.80, 25.14, 75.92, 25.26] },
    // --- UTTAR PRADESH ---
    { name: 'Lucknow Municipal Corporation (LMC)', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, bbox: [80.82, 26.75, 81.05, 26.98] },
    { name: 'Kanpur Municipal Corporation (KMC)', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, bbox: [80.22, 26.38, 80.45, 26.55] },
    { name: 'Varanasi Municipal Corporation (VMC)', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, bbox: [82.90, 25.25, 83.05, 25.38] },
    { name: 'Agra Municipal Corporation (AMC)', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081, bbox: [77.92, 27.10, 78.08, 27.24] },
    { name: 'Prayagraj Municipal Corporation (PMC)', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463, bbox: [81.78, 25.38, 81.92, 25.50] },
    { name: 'Meerut Municipal Corporation (MMC)', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064, bbox: [77.63, 28.92, 77.77, 29.04] },
    { name: 'Bareilly Municipal Corporation (BMC)', state: 'Uttar Pradesh', lat: 28.3670, lng: 79.4304, bbox: [79.36, 28.30, 79.48, 28.42] },
    // --- MADHYA PRADESH ---
    { name: 'Indore Municipal Corporation (IMC)', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, bbox: [75.80, 22.65, 75.95, 22.78] },
    { name: 'Bhopal Municipal Corporation (BMC)', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, bbox: [77.32, 23.15, 77.52, 23.32] },
    { name: 'Gwalior Municipal Corporation (GMC)', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828, bbox: [78.12, 26.14, 78.24, 26.28] },
    { name: 'Jabalpur Municipal Corporation (JMC)', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864, bbox: [79.90, 23.12, 80.05, 23.24] },
    // --- PUNJAB & HARYANA ---
    { name: 'Ludhiana Municipal Corporation (LMC)', state: 'Punjab', lat: 30.9010, lng: 75.8573, bbox: [75.78, 30.84, 75.92, 30.96] },
    { name: 'Amritsar Municipal Corporation (AMC)', state: 'Punjab', lat: 31.6340, lng: 74.8723, bbox: [74.80, 31.57, 74.94, 31.70] },
    { name: 'Jalandhar Municipal Corporation (JMC)', state: 'Punjab', lat: 31.3260, lng: 75.5762, bbox: [75.50, 31.26, 75.64, 31.38] },
    // --- BIHAR & JHARKHAND ---
    { name: 'Patna Municipal Corporation (PMC)', state: 'Bihar', lat: 25.5941, lng: 85.1376, bbox: [85.05, 25.55, 85.25, 25.68] },
    { name: 'Ranchi Municipal Corporation (RMC)', state: 'Jharkhand', lat: 23.3441, lng: 85.3096, bbox: [85.24, 23.28, 85.38, 23.40] },
    { name: 'Dhanbad Municipal Corporation (DMC)', state: 'Jharkhand', lat: 23.7957, lng: 86.4304, bbox: [86.35, 23.72, 86.50, 23.86] },
    // --- ODISHA, CHHATTISGARH & NORTHEAST ---
    { name: 'Bhubaneswar Municipal Corporation (BMC)', state: 'Odisha', lat: 20.2961, lng: 85.8245, bbox: [85.75, 20.20, 85.90, 20.38] },
    { name: 'Cuttack Municipal Corporation (CMC)', state: 'Odisha', lat: 20.4625, lng: 85.8828, bbox: [85.80, 20.40, 85.94, 20.52] },
    { name: 'Raipur Municipal Corporation (RMC)', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, bbox: [81.56, 21.18, 81.70, 21.32] },
    { name: 'Guwahati Municipal Corporation (GMC)', state: 'Assam', lat: 26.1445, lng: 91.7362, bbox: [91.62, 26.10, 91.82, 26.22] },
    { name: 'Srinagar Municipal Corporation (SMC)', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973, bbox: [74.72, 34.02, 74.88, 34.14] },
    { name: 'Kochi Municipal Corporation (KMC)', state: 'Kerala', lat: 9.9312, lng: 76.2673, bbox: [76.22, 9.90, 76.35, 10.08] },
    { name: 'Thiruvananthapuram Municipal Corporation (TMC)', state: 'Kerala', lat: 8.5241, lng: 76.9366, bbox: [76.85, 8.42, 77.02, 8.58] },
];

function bboxToPolygon(bounds: [number, number, number, number]): number[][][] {
    const [minLng, minLat, maxLng, maxLat] = bounds;
    return [[
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
    ]];
}

async function fetchOsmPolygon(lat: number, lng: number): Promise<number[][][] | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&polygon_geojson=1&zoom=10`;
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'PotholeMap-Backend/2.0',
            },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const geojson = data?.geojson;
        if (geojson && geojson.type === 'Polygon') {
            return geojson.coordinates as number[][][];
        } else if (geojson && geojson.type === 'MultiPolygon') {
            // Find largest ring
            let largest = geojson.coordinates[0] as number[][][];
            let maxPoints = 0;
            for (const poly of geojson.coordinates as number[][][][]) {
                const count = poly.reduce((acc: number, ring: number[][]) => acc + ring.length, 0);
                if (count > maxPoints) {
                    maxPoints = count;
                    largest = poly;
                }
            }
            return largest;
        }
        return null;
    } catch {
        return null;
    }
}

async function seedAllIndia() {
    console.log('Starting Nationwide All-India Municipalities Master Reset & Seed...\n');

    // 1. Wipe Database Tables
    console.log('[1/2] Clearing existing database records...');
    await db.reportAssignment.deleteMany({});
    await db.reportStatusHistory.deleteMany({});
    await db.reportFollower.deleteMany({});
    await db.duplicateCandidate.deleteMany({});
    await db.comment.deleteMany({});
    await db.vote.deleteMany({});
    await db.notification.deleteMany({});
    await db.auditLog.deleteMany({});
    await db.reportImage.deleteMany({});
    await db.pothole.deleteMany({});
    await db.municipalityMember.deleteMany({});
    await db.$executeRawUnsafe('DELETE FROM "jurisdiction";');
    await db.municipality.deleteMany({});
    console.log('All database tables cleared successfully!\n');

    // 2. Seed ALL Municipalities across India with Real OSM Geometry or Bounding Box fallback
    console.log(`[2/2] Seeding ${ALL_INDIAN_MUNICIPALITIES.length} Indian Municipalities across 28 States & UTs...`);
    let seededCount = 0;
    let osmCount = 0;

    for (const city of ALL_INDIAN_MUNICIPALITIES) {
        const municipality = await db.municipality.create({
            data: {
                name: `${city.name} (${city.state})`,
            },
        });

        // Attempt to fetch exact real polygon from OpenStreetMap
        let polygonCoords = await fetchOsmPolygon(city.lat, city.lng);
        let geomType = 'Real OpenStreetMap MultiPolygon';
        if (!polygonCoords) {
            polygonCoords = bboxToPolygon(city.bbox);
            geomType = 'Bounding Box Envelope';
        } else {
            osmCount++;
        }

        const jurId = `jur_${randomUUID().replace(/-/g, '')}`;
        const geoJson = JSON.stringify({
            type: 'Polygon',
            coordinates: polygonCoords,
        });

        await db.$executeRaw`
            INSERT INTO "jurisdiction" ("id", "name", "boundary", "municipalityId", "createdAt", "updatedAt")
            VALUES (
                ${jurId},
                ${`${city.name} Jurisdiction`},
                ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326),
                ${municipality.id},
                NOW(),
                NOW()
            )
        `;

        seededCount++;
        console.log(`   [${seededCount}/${ALL_INDIAN_MUNICIPALITIES.length}] Seeded ${city.name} (${city.state}) - [Geom: ${geomType}]`);

        // Respect OSM rate limiting (short delay)
        await new Promise(res => setTimeout(res, 400));
    }

    console.log(`\nNATIONWIDE INDIA MUNICIPALITIES SEED COMPLETE!`);
    console.log(`--------------------------------------------------`);
    console.log(`Total Municipalities Mapped: ${seededCount}`);
    console.log(`Real OSM Polygons Fetched: ${osmCount}`);
    console.log(`--------------------------------------------------\n`);
    process.exit(0);
}

seedAllIndia().catch((err) => {
    console.error('Nationwide seed failed:', err);
    process.exit(1);
});
