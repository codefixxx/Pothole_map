// createPotholeSchema

// updatePotholeStatusSchema

// nearbyPotholeSchema

import { z } from 'zod';

export const createPotholeSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),

    description: z.string().min(5, 'Description is too short'),

    severity: z.number().int().min(1).max(10).default(3),

    latitude: z.number(),

    longitude: z.number(),

    imageUrl: z.string().url().optional().nullable(),

    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional().nullable().default("India"),

    userId: z.string(),
});

export const updatePotholeStatusSchema = z.object({
    status: z.enum(['PENDING', 'ONGOING', 'FIXED', 'REJECTED']),
});

export type CreatePotholeInput = z.infer<typeof createPotholeSchema>;

export type UpdatePotholeStatusInput = z.infer<
    typeof updatePotholeStatusSchema
>;
