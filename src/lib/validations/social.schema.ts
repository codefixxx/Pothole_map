import { z } from 'zod';

export const commentSchema = z.object({
    content: z.string()
        .trim()
        .min(1, 'Comment cannot be empty')
        .max(1000, 'Comment cannot exceed 1000 characters'),
});

export type CommentInput = z.infer<typeof commentSchema>;
