// create()

// findAll()

// findById()

// findNearby()

// updateStatus()

// verify()

// markFixed()

// delete()

// removeExpiredFixedMarkers()

// findPending()

// findByCity()

import { db } from '@/src/lib/db';

import { Status } from '@prisma/client';

import { CreatePotholeInput } from '@/src/lib/validations/pothole.schema';

type PotholeStatus = 'PENDING' | 'ONGOING' | 'FIXED' | 'REJECTED';

export async function create(data: CreatePotholeInput) {
    const { image, ...rest } = data;

    return db.$transaction(async (tx) => {
        const pothole = await tx.pothole.create({
            data: rest,
        });

        if (image) {
            await tx.reportImage.upsert({
                where: { storageKey: image.storageKey },
                update: {
                    potholeId: pothole.id,
                    metadata: image.metadata ?? undefined,
                },
                create: {
                    storageKey: image.storageKey,
                    potholeId: pothole.id,
                    metadata: image.metadata ?? undefined,
                },
            });
        }

        return tx.pothole.findUnique({
            where: { id: pothole.id },
            include: {
                reportImage: true,
                votes: true,
                comments: true,
            },
        });
    }) as any; // Cast to bypass strict type inference variance in transaction wrapper
}

export async function findAll(
    page = 1,
    limit = 20,
) {

    limit = Math.min(limit, 50);

    const skip =
        (page - 1) * limit;

    return db.pothole.findMany({
        skip,
        take: limit,

        orderBy: {
            createdAt: 'desc',
        },

        include: {
            reportImage: true,
            votes: true,
            comments: true,
        },
    });
}

export async function findById(id: string) {
    return db.pothole.findUnique({
        where: {
            id,
        },
        include: {
            reportImage: true,
            votes: true,
            comments: true,
        },
    });
}

export async function findNearby(
    latitude: number,
    longitude: number,
    radiusInKm = 0.5,
) {
    const potholes = await db.pothole.findMany({
        where: {
            status: {
                not: Status.REJECTED,
            },

            latitude: {
                gte: latitude - 0.01,
                lte: latitude + 0.01,
            },

            longitude: {
                gte: longitude - 0.01,
                lte: longitude + 0.01,
            },
        },

        take: 100,
    });

    return potholes.filter((pothole) => {
        const distance = calculateDistance(
            latitude,
            longitude,
            pothole.latitude,
            pothole.longitude,
        );

        return distance <= radiusInKm;
    });
}

export async function updateStatus(id: string, status: PotholeStatus) {
    return db.pothole.update({
        where: {
            id,
        },

        data: {
            status,
        },
    });
}

export async function verify(id: string, verifiedBy: string) {
    return db.pothole.update({
        where: {
            id,
        },

        data: {
            status: Status.VERIFIED,
            verifiedById: verifiedBy,
            verifiedAt: new Date(),
        },
    });
}

export async function markFixed(id: string) {
    return db.pothole.update({
        where: {
            id,
        },

        data: {
            status: 'FIXED',
            fixedAt: new Date(),
        },
    });
}

export async function deletePothole(id: string) {
    return db.pothole.delete({
        where: {
            id,
        },
    });
}

export async function removeExpiredFixedMarkers() {
    const daysAgo = new Date();

    daysAgo.setDate(daysAgo.getDate() - 7);

    return db.pothole.deleteMany({
        where: {
            status: 'FIXED',

            fixedAt: {
                lte: daysAgo,
            },
        },
    });
}

export async function findPending(
    page = 1,
    limit = 20,
) {

    limit = Math.min(limit, 50);

    const skip =
        (page - 1) * limit;

    return db.pothole.findMany({
        where: {
            status: Status.PENDING,
        },

        skip,
        take: limit,

        orderBy: {
            createdAt: 'desc',
        },

        include: {
            reportImage: true,
        },
    });
}

export async function findByCity(
  city: string,
  page = 1,
  limit = 20
) {

  const skip =
    (page - 1) * limit;

  return db.pothole.findMany({
    where: {
      city: {
        equals: city,
        mode: "insensitive",
      },
    },

    skip,
    take: limit,

    orderBy: {
      createdAt: "desc",
    },
  });
}

function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
) {
    const R = 6371;

    const dLat = degreesToRadians(lat2 - lat1);

    const dLon = degreesToRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) *
            Math.cos(degreesToRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
}
