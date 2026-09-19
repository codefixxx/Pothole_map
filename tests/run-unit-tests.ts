import { runStateMachineUnitTests } from './unit/state-machine.test';
import { runRateLimitUnitTests } from './unit/rate-limit.test';
import { runValidationsUnitTests } from './unit/validations.test';
import { runAuthHelpersUnitTests } from './unit/auth-helpers.test';
import { runMunicipalitySchemaUnitTests } from './unit/municipality-schema.test';
import { runUtilsUnitTests } from './unit/utils.test';
import { runMapConfigUnitTests } from './unit/map-config.test';

async function testAllType1UnitTests() {
    console.log('================================================================');
    console.log('🧪 TYPE 1 UNIT TESTS SUITE EXECUTION 🧪');
    console.log('================================================================\n');

    const results = await Promise.all([
        runStateMachineUnitTests(),
        runRateLimitUnitTests(),
        runValidationsUnitTests(),
        runAuthHelpersUnitTests(),
        runMunicipalitySchemaUnitTests(),
        runUtilsUnitTests(),
        runMapConfigUnitTests(),
    ]);

    const allPassed = results.every(Boolean);

    console.log('================================================================');
    if (allPassed) {
        console.log('🎉 ALL TYPE 1 UNIT TESTS PASSED 100% CLEANLY! 🎉');
        console.log('================================================================');
        process.exit(0);
    } else {
        console.error('❌ TYPE 1 UNIT TESTS FAILED.');
        process.exit(1);
    }
}

testAllType1UnitTests().catch(console.error);
