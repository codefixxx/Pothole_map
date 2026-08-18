import { db } from '@/src/lib/db';
import { asyncHandler } from '@/src/lib/handlers/async-handler'; 
import { AppError } from '@/src/lib/errors';

export const GET = asyncHandler(async (req: Request) => {
    const { searchParams } = new URL(req.url);

    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));

    if (isNaN(lat) || isNaN(lng)) {
        throw new AppError('Invalid coordinates', 400);
    }

    const potholes = await db.pothole.findMany({
        where: {
            latitude: { gte: lat - 0.01, lte: lat + 0.01 },
            longitude: { gte: lng - 0.01, lte: lng + 0.01 },
        },
    });

    return Response.json({
        success: true,
        data: potholes,
    });
});
