import { AppError } from './app-error';

export class OutOfJurisdictionError extends AppError {
    constructor(message = 'Coordinates are outside of any managed jurisdiction') {
        super(message, 400);
    }
}
