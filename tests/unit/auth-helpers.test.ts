import { isSuperAdmin, isMunicipalityOfficer, isMunicipalityManager } from '../../src/lib/auth-helpers';

export async function runAuthHelpersUnitTests() {
    console.log('--- [UNIT TEST] Authorization & Role Security Helpers ---');

    // 1. Super Admin Role Check
    const adminCheckTrue = isSuperAdmin({ role: 'ADMIN' });
    const adminCheckFalse = isSuperAdmin({ role: 'USER' });
    const adminCheckNull = isSuperAdmin(null);

    if (adminCheckTrue === true && adminCheckFalse === false && adminCheckNull === false) {
        console.log('  ✅ Super Admin Role Checker (ADMIN vs USER vs null): PASSED');
    } else {
        console.error('❌ Super Admin Role Checker: FAILED', { adminCheckTrue, adminCheckFalse });
        return false;
    }

    // 2. Municipality Officer Role Check
    const officerCheck = isMunicipalityOfficer({ role: 'OFFICER' });
    const managerCheckOfficer = isMunicipalityOfficer({ role: 'MANAGER' });
    const userCheckOfficer = isMunicipalityOfficer({ role: 'USER' });
    const nullCheckOfficer = isMunicipalityOfficer(null);

    if (officerCheck === true && managerCheckOfficer === true && userCheckOfficer === false && nullCheckOfficer === false) {
        console.log('  ✅ Municipality Officer Role Checker: PASSED');
    } else {
        console.error('❌ Municipality Officer Role Checker: FAILED');
        return false;
    }

    // 3. Municipality Manager Role Check
    const managerCheck = isMunicipalityManager({ role: 'MANAGER' });
    const officerCheckManager = isMunicipalityManager({ role: 'OFFICER' });

    if (managerCheck === true && officerCheckManager === false) {
        console.log('  ✅ Municipality Manager Role Checker: PASSED');
    } else {
        console.error('❌ Municipality Manager Role Checker: FAILED');
        return false;
    }

    console.log('✅ Auth Helpers Unit Suite: ALL TESTS PASSED');
    return true;
}

