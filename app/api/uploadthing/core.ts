import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    text: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // Verify user is authenticated and has organization
      const { orgId, userId } = await auth();
      
      if (!userId) {
        throw new Error("Unauthorized: User not authenticated");
      }
      
      if (!orgId) {
        throw new Error("Unauthorized: User must be in an organization");
      }
      
      return { clerkOrgId: orgId, userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // File is uploaded, metadata contains clerkOrgId
      console.log("Upload complete for orgId:", metadata.clerkOrgId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.clerkOrgId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

