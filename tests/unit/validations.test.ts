import { createPotholeSchema } from '../../src/lib/validations/pothole.schema';

export async function runValidationsUnitTests() {
    console.log('--- [UNIT TEST] Zod Validation Schema Parsers ---');

    // 1. Valid Pothole Input
    const validData = {
        title: 'Deep pothole on Main Street',
        description: 'Dangerous 30cm crater near traffic intersection',
        latitude: 28.6139,
        longitude: 77.209,
        severity: 4,
        userId: 'user-cuid-123',
        image: {
            storageKey: 'uploads/test-img.jpg',
            metadata: { width: 1200, height: 800 },
        },
    };

    const parsedValid = createPotholeSchema.safeParse(validData);
    if (parsedValid.success) {
        console.log('  ✅ Valid Pothole Schema Parsing: PASSED');
    } else {
        console.error('❌ Valid Pothole Schema Parsing: FAILED', parsedValid.error);
        return false;
    }

    // 2. Invalid Latitude (> 90)
    const invalidLat = {
        ...validData,
        latitude: 195.0, // Invalid coordinate
    };

    const parsedLat = createPotholeSchema.safeParse(invalidLat);
    if (!parsedLat.success) {
        console.log('  ✅ Invalid Latitude Rejection (> 90): PASSED');
    } else {
        console.error('❌ Invalid Latitude Rejection: FAILED (Accepted 195.0)');
        return false;
    }

    // 3. Short description rejection (< 5 characters)
    const shortDesc = {
        ...validData,
        description: 'Tiny', // Invalid description length
    };

    const parsedDesc = createPotholeSchema.safeParse(shortDesc);
    if (!parsedDesc.success) {
        console.log('  ✅ Short Description Rejection (< 5 chars): PASSED');
    } else {
        console.error('❌ Short Description Rejection: FAILED');
        return false;
    }

    console.log('✅ Validation Schemas Unit Suite: ALL 3 TESTS PASSED');
    return true;
}
