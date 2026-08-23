import 'dotenv/config';
import { db } from './src/lib/db';
import {
    createMunicipality,
    addMunicipalityMember,
    getMunicipalityMembers,
    updateMunicipalityMember,
    removeMunicipalityMember,
} from './src/services/municipality.service';
import { MunicipalityRole } from '@prisma/client';

async function main() {
    console.log('=== STARTING MEMBERSHIP CRUD SERVICE TESTS ===\n');

    // 1. Setup clean testing resources
    const targetMunName = 'Test Membership City';
    const testEmail = 'member.test@pothole.in';

    console.log('Step 1: Cleaning up existing test records...');
    await db.municipalityMember.deleteMany({
        where: { user: { email: testEmail } },
    });
    await db.user.deleteMany({
        where: { email: testEmail },
    });
    const oldMun = await db.municipality.findUnique({
        where: { name: targetMunName },
    });
    if (oldMun) {
        await db.municipality.delete({ where: { id: oldMun.id } });
    }
    console.log('Cleanup completed.\n');

    // 2. Create testing municipality and user
    console.log('Step 2: Creating mock municipality and user...');
    const municipality = await createMunicipality({ name: targetMunName });
    console.log(`- Municipality created: ${municipality.name} (ID: ${municipality.id})`);

    const user = await db.user.create({
        data: {
            name: 'Test Member User',
            email: testEmail,
        },
    });
    console.log(`- User created: ${user.name} (ID: ${user.id})\n`);

    // 3. Test Create
    console.log('Step 3: Testing addMunicipalityMember (Create)...');
    const member = await addMunicipalityMember({
        userId: user.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.OFFICER,
    });
    console.log(`- Member created successfully! ID: ${member.id}, Role: ${member.role}`);
    console.log(`- Associated with Municipality ID: ${member.municipalityId}\n`);

    // 4. Test Read
    console.log('Step 4: Testing getMunicipalityMembers (Read)...');
    const members = await getMunicipalityMembers(municipality.id);
    console.log(`- Found ${members.length} member(s) in municipality "${municipality.name}":`);
    console.table(
        members.map((m: { id: string; role: MunicipalityRole; user: { name: string | null } }) => ({
            id: m.id,
            name: m.user.name,
            role: m.role,
        }))
    );

    if (members.length === 1 && members[0].id === member.id) {
        console.log('  [OK] Read verification passed!\n');
    } else {
        throw new Error('Read verification failed! Member not found or mismatched.');
    }

    // 5. Test Update
    console.log('Step 5: Testing updateMunicipalityMember (Update)...');
    const updated = await updateMunicipalityMember(member.id, {
        role: MunicipalityRole.MANAGER,
    });
    console.log(`- Member updated successfully! New Role: ${updated.role}`);

    if (updated.role === MunicipalityRole.MANAGER) {
        console.log('  [OK] Update verification passed!\n');
    } else {
        throw new Error('Update verification failed! Role was not modified.');
    }

    // 6. Test Delete
    console.log('Step 6: Testing removeMunicipalityMember (Delete)...');
    const deleted = await removeMunicipalityMember(member.id);
    console.log(`- Member deleted successfully: ${deleted.id}`);

    const remaining = await getMunicipalityMembers(municipality.id);
    console.log(`- Remaining members count: ${remaining.length}`);

    if (remaining.length === 0) {
        console.log('  [OK] Delete verification passed!\n');
    } else {
        throw new Error('Delete verification failed! Member record still exists.');
    }

    console.log('=== ALL MEMBERSHIP CRUD TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Test execution failed:', err);
    })
    .finally(async () => {
        await db.$disconnect();
    });
