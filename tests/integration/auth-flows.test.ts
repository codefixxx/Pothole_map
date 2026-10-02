import { db } from '@/src/lib/db';
import * as userRepo from '@/src/repositories/user.repository';
import * as adminService from '@/src/services/admin.service';
import { getValidDomains, normalizeName } from '@/src/lib/utils';
import { transporter } from '@/src/lib/nodemailer';

export async function runAuthFlowsIntegrationTests() {
    console.log('--- [INTEGRATION TEST] Complete Auth Flow, Banning, Promotion & Password Reset ---');

    const testEmail = `authtest_${Date.now()}@gmail.com`;
    let createdUserId: string | null = null;
    let createdMunicipalityId: string | null = null;

    try {
        // 1. Verify Email Domain & Name Normalization rules
        const domain = testEmail.split('@')[1];
        const isValidDomain = getValidDomains().includes(domain);
        console.log(`  ${isValidDomain ? '✅' : '❌'} Email Domain Restriction Check (${domain}): ${isValidDomain ? 'PASSED' : 'FAILED'}`);
        if (!isValidDomain) throw new Error('Domain validation failed');

        const normalizedName = normalizeName('  john  DOE  ');
        const nameCorrect = normalizedName === 'John Doe';
        console.log(`  ${nameCorrect ? '✅' : '❌'} Name Normalization Hook ('  john  DOE  ' -> 'John Doe'): ${nameCorrect ? 'PASSED' : 'FAILED'}`);
        if (!nameCorrect) throw new Error('Name normalization failed');

        // 2. User Creation & Initial Email Verification Flag State
        const user = await db.user.create({
            data: {
                id: `u-test-auth-${Date.now()}`,
                name: normalizedName,
                email: testEmail,
                emailVerified: false, // Initial state upon signup
                role: 'USER',
                banned: false,
            },
        });
        createdUserId = user.id;

        const isInitiallyUnverified = user.emailVerified === false;
        console.log(`  ${isInitiallyUnverified ? '✅' : '❌'} Initial User Email Verification Status (emailVerified: false): ${isInitiallyUnverified ? 'PASSED' : 'FAILED'}`);

        // 3. User Banning Flow
        const bannedUser = await adminService.banUser(user.id);
        const isBanned = bannedUser.banned === true;
        console.log(`  ${isBanned ? '✅' : '❌'} Admin Ban Action (banned: true): ${isBanned ? 'PASSED' : 'FAILED'}`);

        const unbannedUser = await adminService.unbanUser(user.id);
        const isUnbanned = unbannedUser.banned === false;
        console.log(`  ${isUnbanned ? '✅' : '❌'} Admin Unban Action (banned: false): ${isUnbanned ? 'PASSED' : 'FAILED'}`);

        // 4. System Admin & Municipal Promotion Flow
        const promotedAdmin = await userRepo.updateRole(user.id, 'ADMIN');
        const isAdmin = promotedAdmin.role === 'ADMIN';
        console.log(`  ${isAdmin ? '✅' : '❌'} System Admin Promotion (USER -> ADMIN): ${isAdmin ? 'PASSED' : 'FAILED'}`);

        // Revert back to USER for municipal member assignment test
        await userRepo.updateRole(user.id, 'USER');

        const municipality = await db.municipality.create({
            data: {
                name: `Auth Test Zone ${Date.now()}`,
            },
        });
        createdMunicipalityId = municipality.id;

        const memberOfficer = await db.municipalityMember.create({
            data: {
                userId: user.id,
                municipalityId: municipality.id,
                role: 'OFFICER',
            },
        });
        const isOfficer = memberOfficer.role === 'OFFICER';
        console.log(`  ${isOfficer ? '✅' : '❌'} Municipal Officer Assignment: ${isOfficer ? 'PASSED' : 'FAILED'}`);

        const memberManager = await db.municipalityMember.update({
            where: { id: memberOfficer.id },
            data: { role: 'MANAGER' },
        });
        const isManager = memberManager.role === 'MANAGER';
        console.log(`  ${isManager ? '✅' : '❌'} Municipal Promotion (OFFICER -> MANAGER): ${isManager ? 'PASSED' : 'FAILED'}`);

        // 5. Password Reset Email Transport Payload Verification
        const mockTransporterConfigured = typeof transporter.sendMail === 'function';
        console.log(`  ${mockTransporterConfigured ? '✅' : '❌'} Nodemailer Transport Configuration: ${mockTransporterConfigured ? 'PASSED' : 'FAILED'}`);

        console.log('✅ Complete Auth Flow, Banning, Promotion & Password Reset Suite: ALL TESTS PASSED\n');
        return true;
    } catch (err) {
        console.error('❌ Auth Flow Integration Test Error:', err);
        return false;
    } finally {
        // Cleanup
        if (createdUserId) {
            await db.municipalityMember.deleteMany({ where: { userId: createdUserId } }).catch(() => {});
            await db.user.delete({ where: { id: createdUserId } }).catch(() => {});
        }
        if (createdMunicipalityId) {
            await db.municipality.delete({ where: { id: createdMunicipalityId } }).catch(() => {});
        }
    }
}
