import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/src/lib/auth"; 
import { headers } from "next/headers";

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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
