import { db } from '../src/lib/db';
import { auth } from '../src/lib/auth';
import { randomUUID } from 'crypto';
import { MunicipalityRole } from '@prisma/client';

interface MunicipalitySeedData {
    name: string;
    jurisdictionName: string;
    bounds: [number, number, number, number];
}

const INDIAN_MUNICIPALITIES: MunicipalitySeedData[] = [
    {
        name: 'Municipal Corporation of Delhi (MCD)',
        jurisdictionName: 'Delhi NCT Municipal Zone',
        bounds: [76.84, 28.41, 77.34, 28.88],
    },
    {
        name: 'New Delhi Municipal Council (NDMC)',
        jurisdictionName: 'New Delhi Capital Zone',
        bounds: [77.18, 28.58, 77.25, 28.64],
    },
    {
        name: 'Brihanmumbai Municipal Corporation (BMC)',
        jurisdictionName: 'Greater Mumbai Municipal Zone',
        bounds: [72.77, 18.88, 72.99, 19.30],
    },
    {
        name: 'Navi Mumbai Municipal Corporation (NMMC)',
        jurisdictionName: 'Navi Mumbai Zone',
        bounds: [72.98, 19.00, 73.12, 19.18],
    },
    {
        name: 'Thane Municipal Corporation (TMC)',
        jurisdictionName: 'Thane City Zone',
        bounds: [72.93, 19.16, 73.05, 19.30],
    },
    {
        name: 'Pune Municipal Corporation (PMC)',
        jurisdictionName: 'Pune City Municipal Zone',
        bounds: [73.74, 18.42, 73.98, 18.62],
    },
    {
        name: 'Pimpri-Chinchwad Municipal Corporation (PCMC)',
        jurisdictionName: 'Pimpri-Chinchwad Industrial Zone',
        bounds: [73.72, 18.58, 73.92, 18.72],
    },
    {
        name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
        jurisdictionName: 'Greater Bengaluru Mahanagara Zone',
        bounds: [77.45, 12.82, 77.78, 13.15],
    },
    {
        name: 'Greater Hyderabad Municipal Corporation (GHMC)',
        jurisdictionName: 'Greater Hyderabad Zone',
        bounds: [78.22, 17.22, 78.65, 17.58],
    },
    {
        name: 'Greater Chennai Corporation (GCC)',
        jurisdictionName: 'Greater Chennai Metropolitan Zone',
        bounds: [80.12, 12.90, 80.32, 13.24],
    },
    {
        name: 'Kolkata Municipal Corporation (KMC)',
        jurisdictionName: 'Kolkata Metropolitan Zone',
        bounds: [88.26, 22.45, 88.44, 22.65],
    },
    {
        name: 'Ahmedabad Municipal Corporation (AMC)',
        jurisdictionName: 'Ahmedabad City Zone',
        bounds: [72.48, 22.92, 72.68, 23.12],
    },
    {
        name: 'Surat Municipal Corporation (SMC)',
        jurisdictionName: 'Surat Diamond City Zone',
        bounds: [72.75, 21.10, 72.92, 21.28],
    },
    {
        name: 'Jaipur Municipal Corporation (JMC)',
        jurisdictionName: 'Jaipur Heritage & Greater Zone',
        bounds: [75.70, 26.80, 75.92, 27.02],
    },
    {
        name: 'Lucknow Municipal Corporation (LMC)',
        jurisdictionName: 'Lucknow Nagar Nigam Zone',
        bounds: [80.82, 26.75, 81.05, 26.98],
    },
    {
        name: 'Kanpur Municipal Corporation (KMC)',
        jurisdictionName: 'Kanpur Nagar Nigam Zone',
        bounds: [80.22, 26.38, 80.45, 26.55],
    },
    {
        name: 'Municipal Corporation Chandigarh (MCC)',
        jurisdictionName: 'Chandigarh Union Territory Zone',
        bounds: [76.72, 30.68, 76.84, 30.79],
    },
    {
        name: 'Indore Municipal Corporation (IMC)',
        jurisdictionName: 'Indore Swachh City Zone',
        bounds: [75.80, 22.65, 75.95, 22.78],
    },
    {
        name: 'Bhopal Municipal Corporation (BMC-MP)',
        jurisdictionName: 'Bhopal City of Lakes Zone',
        bounds: [77.32, 23.15, 77.52, 23.32],
    },
    {
        name: 'Patna Municipal Corporation (PMC)',
        jurisdictionName: 'Patna Capital Zone',
        bounds: [85.05, 25.55, 85.25, 25.68],
    },
    {
        name: 'Bhubaneswar Municipal Corporation (BMC-OR)',
        jurisdictionName: 'Bhubaneswar Smart City Zone',
        bounds: [85.75, 20.20, 85.90, 20.38],
    },
    {
        name: 'Kochi Municipal Corporation (KMC-KL)',
        jurisdictionName: 'Kochi Commercial Coast Zone',
        bounds: [76.22, 9.90, 76.35, 10.08],
    },
    {
        name: 'Thiruvananthapuram Municipal Corporation (TMC-KL)',
        jurisdictionName: 'Thiruvananthapuram Capital Zone',
        bounds: [76.85, 8.42, 77.02, 8.58],
    },
    {
        name: 'Guwahati Municipal Corporation (GMC)',
        jurisdictionName: 'Guwahati Metropolitan Zone',
        bounds: [91.62, 26.10, 91.82, 26.22],
    },
    {
        name: 'Nagpur Municipal Corporation (NMC)',
        jurisdictionName: 'Nagpur Orange City Zone',
        bounds: [78.98, 21.05, 79.18, 21.22],
    },
    {
        name: 'Coimbatore Municipal Corporation (CMC)',
        jurisdictionName: 'Coimbatore Industrial Zone',
        bounds: [76.90, 10.92, 77.08, 11.08],
    },
    {
        name: 'Great Visakhapatnam Municipal Corporation (GVMC)',
        jurisdictionName: 'Visakhapatnam Steel & Port Zone',
        bounds: [83.15, 17.65, 83.40, 17.85],
    },
    {
        name: 'Vijayawada Municipal Corporation (VMC)',
        jurisdictionName: 'Vijayawada Amaravati Zone',
        bounds: [80.58, 16.48, 80.72, 16.58],
    },
    {
        name: 'Municipal Corporation of Gurugram (MCG)',
        jurisdictionName: 'Gurugram Millennium City Zone',
        bounds: [76.95, 28.38, 77.15, 28.52],
    },
    {
        name: 'Noida & Greater Noida Industrial Authority',
        jurisdictionName: 'Noida Expressway Development Zone',
        bounds: [77.30, 28.42, 77.58, 28.62],
    },
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

async function masterSeed() {
    console.log('🚀 Starting Complete Database Reset & Master India Seed...\n');

    // 1. Clear Database Tables safely using Prisma deleteMany
    console.log('🧹 [1/3] Clearing all existing database records...');
    
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
    await db.session.deleteMany({});
    await db.account.deleteMany({});
    await db.verification.deleteMany({});
    await db.user.deleteMany({});

    console.log('✅ All database tables cleared successfully!\n');

    // 2. Create Super Admin User
    console.log('👑 [2/3] Creating Super Admin user...');
    const adminEmail = 'ayushkmishra332@gmail.com';
    const adminPassword = '@Dafuck123';
    const adminName = 'Ayush Mishra (Super Admin)';

    try {
        await auth.api.signUpEmail({
            body: {
                email: adminEmail,
                password: adminPassword,
                name: adminName,
            },
        });
    } catch (err: any) {
        console.warn('Note on sign up:', err?.message || err);
    }

    const superAdmin = await db.user.update({
        where: { email: adminEmail },
        data: {
            role: 'ADMIN',
            emailVerified: true,
        },
    });

    console.log(`✅ Super Admin created successfully!`);
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.role}\n`);

    // 3. Seed all 30 Indian Municipalities & PostGIS Jurisdictions
    console.log(`🏙️ [3/3] Seeding ${INDIAN_MUNICIPALITIES.length} Indian Municipalities & PostGIS Boundaries...`);
    let seededCount = 0;

    for (const item of INDIAN_MUNICIPALITIES) {
        const municipality = await db.municipality.create({
            data: {
                name: item.name,
            },
        });

        const jurId = `jur_${randomUUID().replace(/-/g, '')}`;
        const polygonCoords = bboxToPolygon(item.bounds);
        const geoJson = JSON.stringify({
            type: 'Polygon',
            coordinates: polygonCoords,
        });

        await db.$executeRaw`
            INSERT INTO "jurisdiction" ("id", "name", "boundary", "municipalityId", "createdAt", "updatedAt")
            VALUES (
                ${jurId},
                ${item.jurisdictionName},
                ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326),
                ${municipality.id},
                NOW(),
                NOW()
            )
        `;

        if (item.name === 'Municipal Corporation of Delhi (MCD)') {
            await db.municipalityMember.create({
                data: {
                    userId: superAdmin.id,
                    municipalityId: municipality.id,
                    role: MunicipalityRole.MANAGER,
                },
            }).catch(() => {});
        }

        seededCount++;
        console.log(`   [${seededCount}/${INDIAN_MUNICIPALITIES.length}] Seeded: ${item.name}`);
    }

    console.log(`\n🎉 MASTER SEED COMPLETE!`);
    console.log(`--------------------------------------------------`);
    console.log(`Super Admin Credentials:`);
    console.log(`  Email:    ayushkmishra332@gmail.com`);
    console.log(`  Password: @Dafuck123`);
    console.log(`Total Municipalities Seeded: ${seededCount}`);
    console.log(`--------------------------------------------------\n`);

    process.exit(0);
}

masterSeed().catch((error) => {
    console.error('❌ Master seed failed:', error);
    process.exit(1);
});
