import { db } from '@/src/lib/db';
import * as jurisdictionRepo from '@/src/repositories/jurisdiction.repository';
import {
    CreateMunicipalityInput,
    CreateJurisdictionInput,
    CreateMunicipalityMemberInput,
    UpdateMunicipalityMemberInput,
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

export async function getOrCreateMunicipalityFromOSM(latitude: number, longitude: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&polygon_geojson=1&zoom=10`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let responseData: {
        address?: {
            city?: string;
            town?: string;
            village?: string;
            municipality?: string;
            district?: string;
            state_district?: string;
            county?: string;
        };
        geojson?: {
            type: string;
            coordinates: number[][][] | number[][][][];
        };
    };
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'PotholeMap-Backend/2.0 (contact@potholemap.in)',
            },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Nominatim HTTP error: ${response.status}`);
        }
        responseData = await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Failed to fetch boundary from Nominatim API:', error);
        throw new AppError('Geocoding service unavailable', 503);
    }

    const address = responseData.address || {};
    const baseName =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.district ||
        address.state_district ||
        `Region_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;

    const municipalityName =
        baseName.endsWith('Municipality') || baseName.toLowerCase().includes('municipal')
            ? baseName
            : `${baseName} Municipality`;

    // Try to find the existing municipality
    let municipality = await db.municipality.findUnique({
        where: { name: municipalityName },
    });

    if (municipality) {
        return municipality.id;
    }

    // Determine boundary polygon coordinates
    let boundaryCoordinates: number[][][];
    const geojson = responseData.geojson;

    if (geojson && geojson.type === 'Polygon') {
        boundaryCoordinates = geojson.coordinates as number[][][];
    } else if (geojson && geojson.type === 'MultiPolygon') {
        // Extract largest polygon by total point count
        let largestPolygon = geojson.coordinates[0] as number[][][];
        let maxPoints = 0;
        for (const poly of geojson.coordinates as number[][][][]) {
            const totalPoints = poly.reduce((acc: number, ring: number[][]) => acc + ring.length, 0);
            if (totalPoints > maxPoints) {
                maxPoints = totalPoints;
                largestPolygon = poly;
            }
        }
        boundaryCoordinates = largestPolygon;
    } else {
        // Fallback to a square boundary centered around coordinates (approx. 2.2km box)
        const size = 0.02;
        const half = size / 2;
        boundaryCoordinates = [
            [
                [longitude - half, latitude - half],
                [longitude + half, latitude - half],
                [longitude + half, latitude + half],
                [longitude - half, latitude + half],
                [longitude - half, latitude - half],
            ],
        ];
    }

    try {
        municipality = await db.municipality.create({
            data: { name: municipalityName },
        });

        await jurisdictionRepo.create({
            name: `${municipalityName} Jurisdiction`,
            boundary: boundaryCoordinates,
            municipalityId: municipality.id,
        });

        return municipality.id;
    } catch (e) {
        // Handle race conditions where another parallel request created the municipality first
        const retry = await db.municipality.findUnique({
            where: { name: municipalityName },
        });
        if (retry) {
            return retry.id;
        }
        throw e;
    }
}

export async function getMunicipalityMembers(municipalityId?: string) {
    return db.municipalityMember.findMany({
        where: municipalityId ? { municipalityId } : {},
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    image: true,
                },
            },
            municipality: true,
        },
    });
}

export async function updateMunicipalityMember(id: string, data: UpdateMunicipalityMemberInput) {
    const existing = await db.municipalityMember.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new AppError('Municipality member not found', 404);
    }

    if (data.municipalityId) {
        const municipalityExists = await db.municipality.findUnique({
            where: { id: data.municipalityId },
        });
        if (!municipalityExists) {
            throw new AppError('Target municipality not found', 404);
        }
    }

    return db.municipalityMember.update({
        where: { id },
        data,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            municipality: true,
        },
    });
}

export async function removeMunicipalityMember(id: string) {
    const existing = await db.municipalityMember.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new AppError('Municipality member not found', 404);
    }

    return db.municipalityMember.delete({
        where: { id },
    });
}


