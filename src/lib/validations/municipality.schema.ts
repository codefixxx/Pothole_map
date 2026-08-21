import { z } from 'zod';

export const createMunicipalitySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const createJurisdictionSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    // Coordinates format for a GeoJSON Polygon: [ [ [lng, lat], [lng, lat], ... ] ] (number[][][])
    boundary: z.array(
        z.array(
            z.array(z.number()).length(2, 'Coordinate must be a [longitude, latitude] pair')
        )
    ).min(1, 'Boundary must have at least one ring'),
    municipalityId: z.string(),
});

export const createMunicipalityMemberSchema = z.object({
    userId: z.string(),
    municipalityId: z.string(),
    role: z.enum(['OFFICER', 'MANAGER']),
});

export type CreateMunicipalityInput = z.infer<typeof createMunicipalitySchema>;
export type CreateJurisdictionInput = z.infer<typeof createJurisdictionSchema>;
export type CreateMunicipalityMemberInput = z.infer<typeof createMunicipalityMemberSchema>;
