import { validateStatusTransition, TransitionContext } from '../../src/lib/state-machine';
import { Status, MunicipalityRole } from '@prisma/client';

export async function runStateMachineUnitTests() {
    console.log('--- [UNIT TEST] State Machine Transition Policy Matrix ---');

    // 1. No-op test (same status)
    try {
        validateStatusTransition(Status.PENDING, {
            actorRole: 'USER',
            actorMember: null,
            pothole: { id: 'p1', status: Status.PENDING, municipalityId: 'm1' },
        });
        console.error('❌ State Machine No-op Test: FAILED (Should throw AppError)');
        return false;
    } catch (err: any) {
        if (err.message.includes('already in PENDING status')) {
            console.log('  ✅ No-op same status rejection: PASSED');
        } else {
            console.error('❌ State Machine No-op Test: FAILED', err);
            return false;
        }
    }

    // 2. Invalid structural lifecycle transition (PENDING -> FIXED directly)
    try {
        validateStatusTransition(Status.FIXED, {
            actorRole: 'USER',
            actorMember: { municipalityId: 'm1', role: MunicipalityRole.OFFICER },
            pothole: { id: 'p1', status: Status.PENDING, municipalityId: 'm1' },
        });
        console.error('❌ State Machine Invalid Jump Test: FAILED (Should throw AppError)');
        return false;
    } catch (err: any) {
        if (err.message.includes('Invalid lifecycle transition')) {
            console.log('  ✅ Invalid direct state jump rejection (PENDING -> FIXED): PASSED');
        } else {
            console.error('❌ Invalid Jump Test: FAILED', err);
            return false;
        }
    }

    // 3. Citizen (no municipal role) trying to set VERIFIED status
    try {
        validateStatusTransition(Status.VERIFIED, {
            actorRole: 'USER',
            actorMember: null,
            pothole: { id: 'p1', status: Status.PENDING, municipalityId: 'm1' },
        });
        console.error('❌ Citizen Role Restriction: FAILED (Should throw 403 AppError)');
        return false;
    } catch (err: any) {
        if (err.statusCode === 403 || err.message.includes('do not have the required municipal permissions')) {
            console.log('  ✅ Citizen role restriction check: PASSED');
        } else {
            console.error('❌ Citizen Role Restriction: FAILED', err);
            return false;
        }
    }

    // 4. Valid Officer Transition (PENDING -> VERIFIED in same municipality)
    try {
        validateStatusTransition(Status.VERIFIED, {
            actorRole: 'USER',
            actorMember: { municipalityId: 'm1', role: MunicipalityRole.OFFICER },
            pothole: { id: 'p1', status: Status.PENDING, municipalityId: 'm1' },
        });
        console.log('  ✅ Authorized Officer transition (PENDING -> VERIFIED): PASSED');
    } catch (err) {
        console.error('❌ Valid Officer Transition: FAILED', err);
        return false;
    }

    // 5. Officer trying to edit report in different municipality
    try {
        validateStatusTransition(Status.VERIFIED, {
            actorRole: 'USER',
            actorMember: { municipalityId: 'm1', role: MunicipalityRole.OFFICER },
            pothole: { id: 'p1', status: Status.PENDING, municipalityId: 'm2_different' },
        });
        console.error('❌ Cross-Jurisdiction Restriction: FAILED (Should throw 403 AppError)');
        return false;
    } catch (err: any) {
        if (err.statusCode === 403 || err.message.includes('outside of your municipality')) {
            console.log('  ✅ Cross-jurisdiction containment restriction: PASSED');
        } else {
            console.error('❌ Cross-Jurisdiction Restriction: FAILED', err);
            return false;
        }
    }

    // 6. Super Admin bypass check
    try {
        validateStatusTransition(Status.VERIFIED, {
            actorRole: 'ADMIN',
            actorMember: null,
            pothole: { id: 'p1', status: Status.PENDING, municipalityId: null },
        });
        console.log('  ✅ Super Admin transition policy bypass: PASSED');
    } catch (err) {
        console.error('❌ Super Admin Bypass: FAILED', err);
        return false;
    }

    console.log('✅ State Machine Unit Suite: ALL 6 TESTS PASSED');
    return true;
}
