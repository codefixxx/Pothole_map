import { asyncHandler } from '@/src/lib/handlers/async-handler';
import { AppError } from '@/src/lib/errors';
import * as duplicateService from '@/src/services/duplicate.service';

export const GET = asyncHandler(async (req: Request) => {
    const { searchParams } = new URL(req.url);

    const potholeId = searchParams.get('potholeId');
    const radiusParam = searchParams.get('radius');
    const radius = radiusParam ? Number(radiusParam) : 100;

    if (isNaN(radius) || radius <= 0) {
        throw new AppError('Invalid radius parameter', 400);
    }

    let results;

    if (potholeId) {
        results = await duplicateService.findDuplicatesForExistingPothole(potholeId, radius);
    } else {
        const latParam = searchParams.get('lat');
        const lngParam = searchParams.get('lng');

        if (!latParam || !lngParam) {
            throw new AppError('Missing required coordinates (lat, lng) or potholeId', 400);
        }

        const lat = Number(latParam);
        const lng = Number(lngParam);

        if (isNaN(lat) || isNaN(lng)) {
            throw new AppError('Invalid coordinates format', 400);
        }

        results = await duplicateService.detectNearbyDuplicates(lat, lng, radius);
    }

    return Response.json({
        success: true,
        data: results,
    });
});
