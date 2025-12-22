import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * Get the current authenticated organization ID from Clerk
 * Returns null if user is not authenticated or not in an organization
 */
export async function getOrgId(): Promise<string | null> {
  const { orgId } = await auth();
  return orgId || null;
}

/**
 * Get the current authenticated user ID from Clerk
 */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId || null;
}

/**
 * Get the current authenticated user with organization context
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const { userId, orgId } = await auth();
  const user = await currentUser();

  if (!userId) {
    throw new Error("Unauthorized: User not authenticated");
  }

  if (!orgId) {
    throw new Error("Unauthorized: User must be in an organization");
  }

  return {
    userId,
    orgId,
    user,
  };
}

/**
 * Ensure user is authenticated and in an organization
 * Returns the orgId for use in database queries
 */
export async function requireOrgId(): Promise<string> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Unauthorized: User must be in an organization");
  }

  return orgId;
}

/**
 * Sync or create Firm record from Clerk Organization
 * Call this when a new organization is created in Clerk
 */
export async function syncFirmFromClerkOrg(
  clerkOrgId: string,
  organizationName: string
) {
  // Check if firm already exists
  const existingFirm = await prisma.firm.findUnique({
    where: { clerkOrgId },
  });

  if (existingFirm) {
    // Update name if it changed in Clerk
    if (existingFirm.name !== organizationName) {
      return await prisma.firm.update({
        where: { clerkOrgId },
        data: { name: organizationName },
      });
    }
    return existingFirm;
  }

  // Create new firm
  return await prisma.firm.create({
    data: {
      clerkOrgId,
      name: organizationName,
    },
  });
}

/**
 * Sync or create User record from Clerk User
 * Call this when a new user joins an organization
 */
export async function syncUserFromClerk(
  clerkUserId: string,
  clerkOrgId: string,
  email: string,
  name?: string
) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (existingUser) {
    // Update if org changed or info changed
    const needsUpdate =
      existingUser.clerkOrgId !== clerkOrgId ||
      existingUser.email !== email ||
      (name && existingUser.name !== name);

    if (needsUpdate) {
      return await prisma.user.update({
        where: { clerkUserId },
        data: {
          clerkOrgId,
          email,
          name: name || existingUser.name,
        },
      });
    }
    return existingUser;
  }

  // Create new user
  return await prisma.user.create({
    data: {
      clerkUserId,
      clerkOrgId,
      email,
      name: name || null,
    },
  });
}

