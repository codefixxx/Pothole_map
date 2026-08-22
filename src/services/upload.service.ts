import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * Deletes a file from Uploadthing storage using its storage key.
 */
export async function deletePotholeImage(storageKey: string): Promise<boolean> {
    try {
        const result = await utapi.deleteFiles(storageKey);
        return result.success;
    } catch (error) {
        console.error(`Failed to delete image with key ${storageKey} from Uploadthing:`, error);
        return false;
    }
}