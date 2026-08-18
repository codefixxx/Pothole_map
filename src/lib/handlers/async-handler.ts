import { NextRequest } from 'next/server';

import { handleError } from './error-handler';

type AsyncRouteHandler = (
    req: NextRequest,
    context: any,
) => Promise<Response>;

export function asyncHandler(
    handler: AsyncRouteHandler,
) {
    return async (
        req: NextRequest,
        context: any,
    ): Promise<Response> => {
        try {
            return await handler(
                req,
                context,
            );
        } catch (error) {
            return handleError(error);
        }
    };
}