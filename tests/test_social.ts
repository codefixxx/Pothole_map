import 'dotenv/config';
import { db } from '../src/lib/db';
import { createMunicipality, addMunicipalityMember } from '../src/services/municipality.service';
import { createPothole, transitionPotholeStatus, assignPothole } from '../src/services/pothole.service';
import { votePothole, unvotePothole, addComment, getPotholeComments, followPothole, unfollowPothole, isFollowingPothole } from '../src/services/social.service';
import { MunicipalityRole, Status, Role } from '@prisma/client';

// Mock BullMQ Queue to avoid requiring Redis connection during tests
(global as any).potholeQueue = {
    add: async (name: string, data: any) => {
        console.log(`[Mock Queue] Enqueued background job: ${name}`, data);
        return { id: 'mock-job-id' };
    },
    close: async () => {},
};

async function main() {
    console.log('=== STARTING SOCIAL INTERACTION AND FOLLOWERS TESTS ===\n');

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const citizen1Email = 'ayushkmishra332+soccit1@gmail.com';
    const citizen2Email = 'ayushkmishra332+soccit2@gmail.com';
    const officerEmail = 'ayushkmishra332+socofficer@gmail.com';
    const managerEmail = 'ayushkmishra332+socmanager@gmail.com';
    const munName = 'Social Test City';

    // 1. Cleanup old records
    console.log('Step 1: Cleaning up existing test records...');
    await db.notification.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.reportStatusHistory.deleteMany({
        where: { actor: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.reportAssignment.deleteMany({
        where: { officer: { email: { in: [officerEmail] } } },
    });
    await db.reportFollower.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.comment.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.vote.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.municipalityMember.deleteMany({
        where: { user: { email: { in: [officerEmail, managerEmail] } } },
    });
    await db.user.deleteMany({
        where: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } },
    });
    const oldMun = await db.municipality.findUnique({
        where: { name: munName },
    });
    if (oldMun) {
        await db.municipality.delete({ where: { id: oldMun.id } });
    }
    console.log('Cleanup completed.\n');

    // 2. Create users and municipality
    console.log('Step 2: Creating mock municipality and users...');
    const municipality = await createMunicipality({ name: munName });

    // Citizens
    const citizen1 = await db.user.create({
        data: { name: 'Social Citizen 1', email: citizen1Email, emailVerified: true, role: Role.USER },
    });
    const citizen2 = await db.user.create({
        data: { name: 'Social Citizen 2', email: citizen2Email, emailVerified: true, role: Role.USER },
    });

    // Officer
    const officer = await db.user.create({
        data: { name: 'Social Officer', email: officerEmail, emailVerified: true, role: Role.USER },
    });
    await addMunicipalityMember({
        userId: officer.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.OFFICER,
    });

    // Manager
    const manager = await db.user.create({
        data: { name: 'Social Manager', email: managerEmail, emailVerified: true, role: Role.USER },
    });
    await addMunicipalityMember({
        userId: manager.id,
        municipalityId: municipality.id,
        role: MunicipalityRole.MANAGER,
    });

    // Create a pothole reported by citizen 1
    const pothole = await createPothole({
        title: 'Social Test Pothole',
        description: 'Testing comments, votes and following',
        severity: 4,
        latitude: 13.0827,
        longitude: 80.2707,
        locationSource: 'GPS',
        userId: citizen1.id,
    });
    // Link it to the municipality
    await db.pothole.update({
        where: { id: pothole.id },
        data: { municipalityId: municipality.id },
    });

    console.log(`- Created Pothole ID: ${pothole.id}`);
    console.log(`- Citizen 1: ${citizen1.id}`);
    console.log(`- Citizen 2: ${citizen2.id}\n`);

    // 3. Test Voting and Confirmation
    console.log('Step 3: Testing voting and unique confirmation constraints...');
    
    // Cast first vote
    await votePothole(citizen1.id, pothole.id);
    console.log('  [OK] Citizen 1 successfully voted/confirmed.');

    // Try voting again (should fail)
    try {
        await votePothole(citizen1.id, pothole.id);
        throw new Error('Voting unique constraint failed: allowed duplicate votes!');
    } catch (err: any) {
        if (err.message && err.message.includes('already confirmed/voted')) {
            console.log('  [OK] Prevented duplicate vote by Citizen 1 (Expected Error caught).');
        } else {
            throw err;
        }
    }

    // Citizen 2 votes
    await votePothole(citizen2.id, pothole.id);
    const votesCount = await db.vote.count({ where: { potholeId: pothole.id } });
    if (votesCount !== 2) {
        throw new Error(`Expected 2 votes, but found ${votesCount}`);
    }
    console.log('  [OK] Citizen 2 successfully voted. Vote count verified.');

    // Unvote
    await unvotePothole(citizen1.id, pothole.id);
    const finalVotesCount = await db.vote.count({ where: { potholeId: pothole.id } });
    if (finalVotesCount !== 1) {
        throw new Error(`Expected 1 vote after unvote, but found ${finalVotesCount}`);
    }
    console.log('  [OK] Citizen 1 successfully removed vote. Vote count updated.\n');

    // 4. Test Report Following
    console.log('Step 4: Testing report following capability...');
    
    // Start following
    await followPothole(citizen2.id, pothole.id);
    let isFollowing = await isFollowingPothole(citizen2.id, pothole.id);
    if (!isFollowing) {
        throw new Error('Citizen 2 following flag not set after followPothole');
    }
    console.log('  [OK] Citizen 2 is now following the report.');

    // Unfollow
    await unfollowPothole(citizen2.id, pothole.id);
    isFollowing = await isFollowingPothole(citizen2.id, pothole.id);
    if (isFollowing) {
        throw new Error('Citizen 2 following flag still true after unfollowPothole');
    }
    console.log('  [OK] Citizen 2 successfully unfollowed the report.');

    // Re-follow for notifications tests
    await followPothole(citizen2.id, pothole.id);
    console.log('  [OK] Citizen 2 re-followed report for notifications test.\n');

    // 5. Test Comments and Comment Notifications
    console.log('Step 5: Testing comment threads and notification dispatch...');
    
    // Citizen 2 comments (should notify reporter Citizen 1)
    await addComment(citizen2.id, pothole.id, 'I also see this pothole every day, please fix!');
    await delay(3000);

    const reporterNotification = await db.notification.findFirst({
        where: { userId: citizen1.id, title: 'New Comment on your Pothole Report' },
    });
    if (!reporterNotification) {
        throw new Error('Reporter (Citizen 1) did not receive a notification when Citizen 2 commented');
    }
    console.log('  [OK] Reporter notified when another user commented.');

    // Officer comments (should notify reporter AND follower Citizen 2)
    await addComment(officer.id, pothole.id, 'Inspection team is assigned for today.');
    await delay(3000);

    const followerNotification = await db.notification.findFirst({
        where: { userId: citizen2.id, title: 'New Comment on Followed Pothole' },
    });
    if (!followerNotification) {
        throw new Error('Follower (Citizen 2) did not receive a notification when Officer commented');
    }
    console.log('  [OK] Follower notified when municipal officer commented.');

    const commentsList = await getPotholeComments(pothole.id);
    if (commentsList.length !== 2) {
        throw new Error(`Expected 2 comments, found ${commentsList.length}`);
    }
    console.log(`  [OK] Successfully retrieved all comments (count: ${commentsList.length}).\n`);

    // 6. Test Follower Status Transition Notifications
    console.log('Step 6: Testing status transitions & follower notifications...');
    
    // A. Transition PENDING -> VERIFIED
    await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.VERIFIED,
        actorId: officer.id,
        reason: 'Pothole confirmed by inspector.',
    });
    await delay(3000);

    const followerVerifiedNotif = await db.notification.findFirst({
        where: { userId: citizen2.id, title: 'Followed Pothole Verified' },
    });
    if (!followerVerifiedNotif) {
        throw new Error('Follower (Citizen 2) was not notified when report transitioned to VERIFIED');
    }
    console.log('  [OK] Follower successfully notified of VERIFIED status transition.');

    // B. Assign to Officer (ONGOING status transition)
    await assignPothole({
        potholeId: pothole.id,
        officerId: officer.id,
        actorId: manager.id,
        actorRole: 'USER',
    });
    await delay(3000);

    const followerOngoingNotif = await db.notification.findFirst({
        where: { userId: citizen2.id, title: 'Work Started on Followed Pothole' },
    });
    if (!followerOngoingNotif) {
        throw new Error('Follower (Citizen 2) was not notified when report transitioned to ONGOING');
    }
    console.log('  [OK] Follower successfully notified of ONGOING status transition.');

    // C. Transition ONGOING -> FIXED
    await transitionPotholeStatus({
        potholeId: pothole.id,
        newStatus: Status.FIXED,
        actorId: officer.id,
        reason: 'Pothole patched.',
    });
    await delay(3000);

    const followerFixedNotif = await db.notification.findFirst({
        where: { userId: citizen2.id, title: 'Followed Pothole Fixed' },
    });
    if (!followerFixedNotif) {
        throw new Error('Follower (Citizen 2) was not notified when report transitioned to FIXED');
    }
    console.log('  [OK] Follower successfully notified of FIXED status transition.\n');

    // 7. Clean up database
    console.log('Step 7: Cleaning up mock test records...');
    await db.notification.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.reportStatusHistory.deleteMany({
        where: { actor: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.reportAssignment.deleteMany({
        where: { officer: { email: { in: [officerEmail] } } },
    });
    await db.reportFollower.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.comment.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.vote.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.pothole.deleteMany({
        where: { user: { email: { in: [citizen1Email, citizen2Email, officerEmail, managerEmail] } } },
    });
    await db.municipalityMember.deleteMany({
        where: { userId: { in: [officer.id, manager.id] } },
    });
    await db.user.deleteMany({
        where: { id: { in: [citizen1.id, citizen2.id, officer.id, manager.id] } },
    });
    await db.municipality.delete({ where: { id: municipality.id } });
    console.log('Cleanup completed.\n');

    console.log('=== ALL SOCIAL INTERACTION AND FOLLOWERS TESTS PASSED SUCCESSFULLY ===');
}

main()
    .catch((err) => {
        console.error('Test execution failed:', err);
    })
    .finally(async () => {
        await db.$disconnect();
    });
