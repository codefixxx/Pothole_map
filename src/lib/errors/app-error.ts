export class AppError extends Error {
    public readonly statusCode: number;
    public readonly success: boolean;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode = 500,
    ) {
        super(message);

        this.statusCode = statusCode;
        this.success = false;
        this.isOperational = true;

        Object.setPrototypeOf(
            this,
            new.target.prototype,
        );

        Error.captureStackTrace(
            this,
            this.constructor,
        );
    }
}