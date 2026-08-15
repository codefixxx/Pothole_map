import { AppError } from './app-error';

export class GeoCodingError extends AppError {
    constructor(
        message = 'Unable to determine location',
    ) {
        super(message, 500);
    }
}