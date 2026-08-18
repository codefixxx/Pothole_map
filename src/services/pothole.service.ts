import * as potholeRepo from '@/src/repositories/pothole.repository';
import { CreatePotholeInput } from '@/src/lib/validations/pothole.schema';
import { Status } from '@prisma/client';
import { sendVerificationNotification, sendFixedNotification } from './notification.service';
import { AppError } from '../lib/errors';

export async function createPothole(data: CreatePotholeInput) {
    if (data.latitude < -90 || data.latitude > 90) {
        throw new AppError('Invalid latitude coordinate', 400);
    }
    if (data.longitude < -180 || data.longitude > 180) {
        throw new AppError('Invalid longitude coordinate', 400);
    }
    return potholeRepo.create(data);
}

export async function getAllPotholes(page = 1, limit = 20) {
    return potholeRepo.findAll(page, limit);
}

export async function getPotholeById(id: string) {
    const pothole = await potholeRepo.findById(id);
    if (!pothole) {
        throw new AppError('Pothole not found', 404);
    }
    return pothole;
}

export async function findNearbyPotholes(lat: number, lng: number, radiusInKm = 0.5) {
    return potholeRepo.findNearby(lat, lng, radiusInKm);
}

export async function updatePotholeStatus(id: string, status: 'PENDING' | 'ONGOING' | 'FIXED' | 'REJECTED') {
    const pothole = await getPotholeById(id);
    const updated = await potholeRepo.updateStatus(id, status);

    if (status === 'FIXED') {
        await potholeRepo.markFixed(id);
        // Fire notification in the background
        void sendFixedNotification(pothole.userId, pothole.id);
    }

    return updated;
}

export async function verifyPothole(id: string, adminId: string) {
    const pothole = await getPotholeById(id);
    const updated = await potholeRepo.verify(id, adminId);
    
    // Notify the reporter
    void sendVerificationNotification(pothole.userId, id);
    
    return updated;
}

export async function rejectPothole(id: string) {
    await getPotholeById(id);
    return potholeRepo.updateStatus(id, Status.REJECTED);
}

export async function deletePothole(id: string, userId: string, userRole: string) {
    const pothole = await getPotholeById(id);
    if (pothole.userId !== userId && userRole !== 'ADMIN') {
        throw new AppError('Forbidden', 403);
    }
    return potholeRepo.deletePothole(id);
}

export async function scheduleMarkerRemoval() {
    return potholeRepo.removeExpiredFixedMarkers();
}