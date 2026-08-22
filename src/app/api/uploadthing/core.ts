import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/src/lib/auth"; 
import { headers } from "next/headers";
import { db } from "@/src/lib/db";

const f = createUploadthing();

export const ourFileRouter = {
  // Route 1: Avatar upload — single image, small size limit
  imageUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar uploaded for userId:", metadata.userId);
      console.log("Avatar URL:", file.ufsUrl);

      // TODO: update user.image in DB with file.ufsUrl

      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Route 2: Pothole image upload — direct client upload, larger size limit
  potholeImageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Pothole image uploaded by userId:", metadata.userId);
      console.log("File key:", file.key);

      // Pre-register ReportImage in the database
      const reportImage = await db.reportImage.create({
        data: {
          storageKey: file.key,
          processingState: "PENDING",
          metadata: {
            name: file.name,
            size: file.size,
            url: file.ufsUrl,
            uploadedBy: metadata.userId,
          },
        },
      });

      return { 
        uploadedBy: metadata.userId, 
        key: file.key, 
        url: file.ufsUrl,
        reportImageId: reportImage.id 
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

