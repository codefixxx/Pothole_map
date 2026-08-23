import { db } from "../lib/db";
import { deletePotholeImage } from "./upload.service";

/**
 * Cleanup service to remove orphaned ReportImage records and files from storage.
 * Orphaned images are those where `potholeId` is null (uploaded but never submitted)
 * and they are older than 2 hours.
 */
export async function cleanOrphanedImages(): Promise<number> {
    try {
        const twoHoursAgo = new Date();
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

        // Find all orphaned images older than 2 hours
        const orphanedImages = await db.reportImage.findMany({
            where: {
                potholeId: null as any,
                createdAt: {
                    lte: twoHoursAgo
                }
            }
        });

        if (orphanedImages.length === 0) {
            console.log("No orphaned images found for cleanup.");
            return 0;
        }

        console.log(`Found ${orphanedImages.length} orphaned images to clean up.`);

        let deletedCount = 0;

        for (const image of orphanedImages) {
            // Delete from storage
            const storageDeleted = await deletePotholeImage(image.storageKey);
            
            // Delete from database regardless, to avoid retrying corrupt storage files forever
            await db.reportImage.delete({
                where: { id: image.id }
            });

            if (storageDeleted) {
                deletedCount++;
            }
        }

        console.log(`Orphaned images cleanup completed. Deleted ${deletedCount} files successfully from storage.`);
        return deletedCount;
    } catch (error) {
        console.error("Error during cleanOrphanedImages execution:", error);
        return 0;
    }
}