import { db } from '@/src/lib/db';
import { AppError } from '@/src/lib/errors';
import * as userRepo from '@/src/repositories/user.repository';
import { createNotification } from './notification.service';
import { sendEmail } from '@/src/lib/nodemailer';

/**
 * Casts a vote/confirmation for a pothole report.
 * Enforces exactly one vote per user per report via DB unique constraints.
 */
export async function votePothole(userId: string, potholeId: string) {
    const pothole = await db.pothole.findUnique({
        where: { id: potholeId },
    });
    if (!pothole) {
        throw new AppError('Pothole report not found', 404);
    }

    try {
        const newVote = await db.vote.create({
            data: {
                userId,
                potholeId,
            },
        });
        return newVote;
    } catch (error: any) {
        // Prisma unique constraint violation code
        if (error.code === 'P2002') {
            throw new AppError('You have already confirmed/voted on this report.', 400);
        }
        throw error;
    }
}

/**
 * Removes a vote/confirmation.
 */
export async function unvotePothole(userId: string, potholeId: string) {
    const vote = await db.vote.findUnique({
        where: {
            potholeId_userId: {
                potholeId,
                userId,
            },
        },
    });
    if (!vote) {
        throw new AppError('Vote not found.', 404);
    }

    return db.vote.delete({
        where: {
            potholeId_userId: {
                potholeId,
                userId,
            },
        },
    });
}

/**
 * Adds a citizen comment/update to a pothole report.
 * Notifies the report creator and other followers.
 */
export async function addComment(userId: string, potholeId: string, content: string) {
    const pothole = await db.pothole.findUnique({
        where: { id: potholeId },
    });
    if (!pothole) {
        throw new AppError('Pothole report not found', 404);
    }

    const comment = await db.comment.create({
        data: {
            userId,
            potholeId,
            content,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    // Notify original reporter (if not the commenter)
    const commenterName = comment.user.name || 'A user';
    const appUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000';
    const link = `${appUrl}/dashboard`;

    if (pothole.userId !== userId) {
        const creator = await userRepo.findUserById(pothole.userId);
        if (creator && creator.email) {
            const title = `New Comment on your Pothole Report`;
            const msg = `"${commenterName}" commented on your report "${pothole.title}": "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
            
            await createNotification({
                userId: creator.id,
                title,
                message: msg,
                link,
            });

            void sendEmail({
                to: creator.email,
                subject: title,
                meta: {
                    description: msg,
                    link,
                },
            });
        }
    }

    // Notify report followers (except the commenter and the reporter, who was already notified above)
    const followers = await db.reportFollower.findMany({
        where: {
            potholeId,
            userId: {
                notIn: [userId, pothole.userId],
            },
        },
        include: {
            user: true,
        },
    });

    for (const follower of followers) {
        if (follower.user.email) {
            const title = `New Comment on Followed Pothole`;
            const msg = `"${commenterName}" commented on a report you follow "${pothole.title}": "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
            
            await createNotification({
                userId: follower.userId,
                title,
                message: msg,
                link,
            });

            void sendEmail({
                to: follower.user.email,
                subject: title,
                meta: {
                    description: msg,
                    link,
                },
            });
        }
    }

    return comment;
}

/**
 * Retrieves all comments on a pothole report.
 */
export async function getPotholeComments(potholeId: string) {
    const pothole = await db.pothole.findUnique({
        where: { id: potholeId },
    });
    if (!pothole) {
        throw new AppError('Pothole report not found', 404);
    }

    return db.comment.findMany({
        where: { potholeId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    });
}

/**
 * Follows a pothole report to receive status/comment updates.
 */
export async function followPothole(userId: string, potholeId: string) {
    const pothole = await db.pothole.findUnique({
        where: { id: potholeId },
    });
    if (!pothole) {
        throw new AppError('Pothole report not found', 404);
    }

    try {
        const follow = await db.reportFollower.create({
            data: {
                userId,
                potholeId,
            },
        });
        return follow;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // User is already following, return existing follow
            return db.reportFollower.findUnique({
                where: {
                    potholeId_userId: {
                        potholeId,
                        userId,
                    },
                },
            });
        }
        throw error;
    }
}

/**
 * Stops following a pothole report.
 */
export async function unfollowPothole(userId: string, potholeId: string) {
    const follow = await db.reportFollower.findUnique({
        where: {
            potholeId_userId: {
                potholeId,
                userId,
            },
        },
    });
    if (!follow) {
        throw new AppError('You are not following this report.', 404);
    }

    return db.reportFollower.delete({
        where: {
            potholeId_userId: {
                potholeId,
                userId,
            },
        },
    });
}

/**
 * Checks if a user is following a pothole report.
 */
export async function isFollowingPothole(userId: string, potholeId: string): Promise<boolean> {
    const follow = await db.reportFollower.findUnique({
        where: {
            potholeId_userId: {
                potholeId,
                userId,
            },
        },
    });
    return !!follow;
}

/**
 * Fetches all users following a pothole report.
 */
export async function getFollowers(potholeId: string) {
    return db.reportFollower.findMany({
        where: { potholeId },
        include: {
            user: true,
        },
    });
}
