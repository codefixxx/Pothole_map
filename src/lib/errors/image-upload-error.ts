import { AppError } from './app-error';

export class ImageUploadError extends AppError {
    constructor(message = 'Image upload failed') {
        super(message, 500);
    }
}