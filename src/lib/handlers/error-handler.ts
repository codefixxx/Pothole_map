import { APIError } from 'better-auth/api';
import { ZodError } from 'zod';

import { AppError } from '../errors';

const APP_DEBUG = process.env.APP_DEBUG === 'true';

export function handleError(error: unknown): Response {
    console.error(error);

    if (error instanceof APIError) {
        return Response.json(
            {
                success: false,
                message: error.message,

                ...(APP_DEBUG && {
                    stack: error.stack,
                    status: error.status,
                }),
            },
            {
                status: error.statusCode || 400,
            },
        );
    }

    if (error instanceof AppError) {
        return Response.json(
            {
                success: false,
                message: error.message,

                ...(APP_DEBUG && {
                    stack: error.stack,
                    statusCode: error.statusCode,
                }),
            },
            {
                status: error.statusCode,
            },
        );
    }

    if (error instanceof ZodError) {
        return Response.json(
            {
                success: false,
                message: 'Validation failed',
                errors: error.flatten(),

                ...(APP_DEBUG && {
                    stack: error.stack,
                }),
            },
            {
                status: 400,
            },
        );
    }

    if (error instanceof Error) {
        return Response.json(
            {
                success: false,
                message: 'Internal Server Error',

                ...(APP_DEBUG && {
                    stack: error.stack,
                    error: error.message,
                }),
            },
            {
                status: 500,
            },
        );
    }

    return Response.json(
        {
            success: false,
            message: 'Unknown Error',

            ...(APP_DEBUG && {
                error,
            }),
        },
        {
            status: 500,
        },
    );
}
