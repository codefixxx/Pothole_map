import { sendEmail } from '@/src/lib/nodemailer';
import * as userRepo from '@/src/repositories/user.repository';
import { db } from '@/src/lib/db';
import { Role } from '@prisma/client';

export async function createNotification(params: {
    userId: string;
    title: string;
    message: string;
    link?: string;
}) {
    return db.notification.create({
        data: {
            userId: params.userId,
            title: params.title,
            message: params.message,
            link: params.link || null,
        },
    });
}

export async function sendVerificationNotification(userId: string, potholeId: string) {
    const user = await userRepo.findUserById(userId);
    if (!user || !user.email) {
        console.warn(`Cannot send verification notification: User ${userId} not found or has no email.`);
        return;
    }

    const appUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const title = 'Pothole Report Verified';
    const message = 'Great news! The pothole you reported has been verified by our administrator. Work order is being prepared.';
    const link = `${appUrl}/dashboard`;

    await createNotification({ userId, title, message, link });

    void sendEmail({
        to: user.email,
        subject: title,
        meta: {
            description: message,
            link,
        },
    });
}

export async function sendFixedNotification(userId: string, potholeId: string) {
    const user = await userRepo.findUserById(userId);
    if (!user || !user.email) {
        console.warn(`Cannot send fixed notification: User ${userId} not found or has no email.`);
        return;
    }

    const appUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const title = 'Pothole Marked as Fixed!';
    const message = 'Thank you for your report! The pothole you flagged has been successfully repaired. Your contribution made the community safer.';
    const link = `${appUrl}/dashboard`;

    await createNotification({ userId, title, message, link });

    void sendEmail({
        to: user.email,
        subject: title,
        meta: {
            description: message,
            link,
        },
    });
}

export async function sendRejectedNotification(userId: string, potholeId: string, reason?: string) {
    const user = await userRepo.findUserById(userId);
    if (!user || !user.email) {
        console.warn(`Cannot send rejected notification: User ${userId} not found or has no email.`);
        return;
    }

    const appUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const title = 'Pothole Report Rejected';
    const message = `Your pothole report has been reviewed and rejected.${reason ? ` Reason: ${reason}` : ''}`;
    const link = `${appUrl}/dashboard`;

    await createNotification({ userId, title, message, link });

    void sendEmail({
        to: user.email,
        subject: title,
        meta: {
            description: message,
            link,
        },
    });
}

export async function sendOngoingNotification(userId: string, potholeId: string) {
    const user = await userRepo.findUserById(userId);
    if (!user || !user.email) {
        console.warn(`Cannot send ongoing notification: User ${userId} not found or has no email.`);
        return;
    }

    const appUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const title = 'Work Started on Pothole';
    const message = 'An officer has been assigned and repair work is ongoing for the pothole you reported.';
    const link = `${appUrl}/dashboard`;

    await createNotification({ userId, title, message, link });

    void sendEmail({
        to: user.email,
        subject: title,
        meta: {
            description: message,
            link,
        },
    });
}

export async function notifyOfficerAssignment(officerId: string, potholeId: string, potholeTitle: string) {
    const officer = await userRepo.findUserById(officerId);
    if (!officer || !officer.email) {
        console.warn(`Cannot send assignment notification: Officer ${officerId} not found or has no email.`);
        return;
    }

    const appUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const title = 'New Pothole Assigned';
    const message = `You have been assigned to handle the pothole report: "${potholeTitle}".`;
    const link = `${appUrl}/dashboard`;

    await createNotification({ userId: officerId, title, message, link });

    void sendEmail({
        to: officer.email,
        subject: title,
        meta: {
            description: message,
            link,
        },
    });
}

export async function notifyNewPotholeReport(municipalityId: string | null, potholeId: string, potholeTitle: string) {
    const appUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const title = 'New Pothole Reported';
    const message = `A new pothole report "${potholeTitle}" has been submitted and is awaiting review.`;
    const link = `${appUrl}/dashboard`;

    if (municipalityId) {
        // Notify all municipality members (officers and managers)
        const members = await db.municipalityMember.findMany({
            where: { municipalityId },
            include: { user: true },
        });

        for (const member of members) {
            if (member.user.email) {
                await createNotification({ userId: member.userId, title, message, link });
                void sendEmail({
                    to: member.user.email,
                    subject: title,
                    meta: { description: message, link },
                });
            }
        }
    } else {
        // Notify all platform admins
        const admins = await db.user.findMany({
            where: { role: Role.ADMIN },
        });

        for (const admin of admins) {
            if (admin.email) {
                await createNotification({ userId: admin.id, title, message, link });
                void sendEmail({
                    to: admin.email,
                    subject: title,
                    meta: { description: message, link },
                });
            }
        }
    }
}

export async function notifyCityAdmin(city: string, potholeId: string) {
    // Stub or log for compatibility
    console.log(`Alerting city admins of ${city} regarding new pothole report ${potholeId}`);
}

export async function notifyNearbyDrivers(latitude: number, longitude: number, potholeId: string) {
    // Stub or log for compatibility
    console.log(`Warning drivers near coordinates (${latitude}, ${longitude}) regarding pothole ${potholeId}`);
}