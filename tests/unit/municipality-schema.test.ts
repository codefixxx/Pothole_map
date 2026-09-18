import { createMunicipalitySchema, addMemberSchema } from '../../src/lib/validations/municipality.schema';

export async function runMunicipalitySchemaUnitTests() {
    console.log('--- [UNIT TEST] Municipality & Member Validation Schemas ---');

    // 1. Valid Municipality Creation Input
    const validMuni = {
        name: 'New Delhi Municipal Council',
        code: 'NDMC',
        contactEmail: 'contact@ndmc.gov.in',
        contactPhone: '+91-11-23365555',
    };

    const parsedMuni = createMunicipalitySchema.safeParse(validMuni);
    if (parsedMuni.success) {
        console.log('  ✅ Valid Municipality Schema Parsing: PASSED');
    } else {
        console.error('❌ Valid Municipality Schema: FAILED', parsedMuni.error);
        return false;
    }

    // 2. Invalid Email Format Rejection
    const invalidEmailMuni = {
        ...validMuni,
        contactEmail: 'invalid-email-string',
    };

    const parsedInvalidEmail = createMunicipalitySchema.safeParse(invalidEmailMuni);
    if (!parsedInvalidEmail.success) {
        console.log('  ✅ Invalid Email Format Rejection: PASSED');
    } else {
        console.error('❌ Invalid Email Format Rejection: FAILED');
        return false;
    }

    // 3. Member Role Validation (OFFICER vs MANAGER)
    const validMember = {
        userId: 'user-id-123',
        municipalityId: 'muni-id-456',
        role: 'OFFICER',
    };

    const parsedMember = addMemberSchema.safeParse(validMember);
    if (parsedMember.success) {
        console.log('  ✅ Member Role Validation (OFFICER): PASSED');
    } else {
        console.error('❌ Member Role Validation: FAILED', parsedMember.error);
        return false;
    }

    console.log('✅ Municipality Schemas Unit Suite: ALL 3 TESTS PASSED');
    return true;
}
