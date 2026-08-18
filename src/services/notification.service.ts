import { sendEmail } from '@/src/lib/nodemailer';
import * as userRepo from '@/src/repositories/user.repository';
import { AppError } from '../lib/errors';

export async function sendVerificationNotification(userId: string, potholeId: string) {
    const user = await userRepo.findUserById(userId);
    if (!user || !user.email) {
        console.warn(`Cannot send verification notification: User ${userId} not found or has no email.`);
        return;
    }

    const appUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';

    return sendEmail({
        to: user.email,
        subject: 'Pothole Report Verified',
        meta: {
            description: `Great news! The pothole you reported has been verified by our administrator. Work order is being prepared.`,
            link: `${appUrl}/dashboard`,
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

    return sendEmail({
        to: user.email,
        subject: 'Pothole Marked as Fixed!',
        meta: {
            description: `Thank you for your report! The pothole you flagged has been successfully repaired. Your contribution made the community safer.`,
            link: `${appUrl}/dashboard`,
        },
    });
}

export async function notifyCityAdmin(city: string, potholeId: string) {
    // Stub for alerting admin users of that city when a pothole is reported.
    console.log(`Alerting city admins of ${city} regarding new pothole report ${potholeId}`);
}

export async function notifyNearbyDrivers(latitude: number, longitude: number, potholeId: string) {
    // Stub for warning nearby mobile apps or systems.
    console.log(`Warning drivers near coordinates (${latitude}, ${longitude}) regarding pothole ${potholeId}`);
}