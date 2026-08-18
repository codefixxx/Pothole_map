import * as userRepo from '@/src/repositories/user.repository';
import * as potholeRepo from '@/src/repositories/pothole.repository';
import { AppError } from '../lib/errors';

export async function banUser(userId: string) {
    const user = await userRepo.findUserById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    if (user.role === 'ADMIN') {
        throw new AppError('Cannot ban an administrative user', 400);
    }
    return userRepo.banUser(userId);
}

export async function unbanUser(userId: string) {
    const user = await userRepo.findUserById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return userRepo.unbanUser(userId);
}

export async function getPendingVerifications(page = 1, limit = 20) {
    return potholeRepo.findPending(page, limit);
}

export async function getAllReports(page = 1, limit = 20) {
    return potholeRepo.findAll(page, limit);
}