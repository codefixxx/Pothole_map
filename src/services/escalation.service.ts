import { db } from '@/src/lib/db';
import { Status, Role, MunicipalityRole } from '@prisma/client';
import { createNotification } from './notification.service';
import { sendEmail } from '@/src/lib/nodemailer';

/**
 * Checks for PENDING potholes that have been open for longer than the threshold in hours,
 * marks them as escalated, and notifies managers (or admins if unassigned).
 * 
 * @param thresholdHours Number of hours before a pending report is considered stale (default: 48)
 * @returns Number of escalated reports
 */
export async function escalateStaleReports(thresholdHours = 48): Promise<number> {
    const cutOffTime = new Date();
    cutOffTime.setHours(cutOffTime.getHours() - thresholdHours);

    // 1. Query stale, unescalated reports
    const stalePotholes = await db.pothole.findMany({
        where: {
            status: Status.PENDING,
            createdAt: {
                lte: cutOffTime,
            },
            escalated: false,
        },
    });

    if (stalePotholes.length === 0) {
        return 0;
    }

    const appUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';

    // 2. Escalate each report
    for (const pothole of stalePotholes) {
        await db.pothole.update({
            where: { id: pothole.id },
            data: {
                escalated: true,
                escalatedAt: new Date(),
            },
        });

        const title = 'Escalation: Stale Pothole Report';
        const message = `Pothole report "${pothole.title}" has been pending review for over ${thresholdHours} hours.`;
        const link = `${appUrl}/dashboard`;

        if (pothole.municipalityId) {
            // Find all managers of this municipality
            const managers = await db.municipalityMember.findMany({
                where: {
                    municipalityId: pothole.municipalityId,
                    role: MunicipalityRole.MANAGER,
                },
                include: { user: true },
            });

            for (const manager of managers) {
                await createNotification({
                    userId: manager.userId,
                    title,
                    message,
                    link,
                });

                if (manager.user.email) {
                    void sendEmail({
                        to: manager.user.email,
                        subject: title,
                        meta: {
                            description: message,
                            link,
                        },
                    });
                }
            }
        } else {
            // Unassigned: Find all platform admins
            const admins = await db.user.findMany({
                where: { role: Role.ADMIN },
            });

            for (const admin of admins) {
                await createNotification({
                    userId: admin.id,
                    title,
                    message,
                    link,
                });

                if (admin.email) {
                    void sendEmail({
                        to: admin.email,
                        subject: title,
                        meta: {
                            description: message,
                            link,
                        },
                    });
                }
            }
        }
    }

    return stalePotholes.length;
}
