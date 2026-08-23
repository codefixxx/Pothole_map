import { db } from '@/src/lib/db';
import * as jurisdictionRepo from '@/src/repositories/jurisdiction.repository';
import {
    CreateMunicipalityInput,
    CreateJurisdictionInput,
    CreateMunicipalityMemberInput,
} from '@/src/lib/validations/municipality.schema';
import { AppError } from '@/src/lib/errors';

export async function createMunicipality(data: CreateMunicipalityInput) {
    const existing = await db.municipality.findUnique({
        where: { name: data.name },
    });
    if (existing) {
        throw new AppError('Municipality name already exists', 400);
    }
    return db.municipality.create({
        data,
    });
}

export async function createJurisdiction(data: CreateJurisdictionInput) {
    const municipality = await db.municipality.findUnique({
        where: { id: data.municipalityId },
    });
    if (!municipality) {
        throw new AppError('Municipality not found', 404);
    }

    const existingJur = await db.jurisdiction.findUnique({
        where: { municipalityId: data.municipalityId },
    });
    if (existingJur) {
        throw new AppError('Municipality already has an assigned jurisdiction', 400);
    }

    return jurisdictionRepo.create(data);
}

export async function addMunicipalityMember(data: CreateMunicipalityMemberInput) {
    const user = await db.user.findUnique({
        where: { id: data.userId },
    });
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const municipality = await db.municipality.findUnique({
        where: { id: data.municipalityId },
    });
    if (!municipality) {
        throw new AppError('Municipality not found', 404);
    }

    const existingMember = await db.municipalityMember.findUnique({
        where: { userId: data.userId },
    });
    if (existingMember) {
        throw new AppError('User is already a member of a municipality', 400);
    }

    return db.municipalityMember.create({
        data,
    });
}
