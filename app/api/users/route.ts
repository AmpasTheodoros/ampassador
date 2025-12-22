import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { syncUserFromClerk, syncFirmFromClerkOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * User Sync API
 * 
 * POST /api/users
 * 
 * Syncs the current Clerk user with the database
 * Creates or updates user record based on Clerk authentication
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the primary organization ID (if user is in an org)
    const { orgId } = await auth();
    
    if (!orgId) {
      // User is not in an organization yet
      // Return user info but note that they need to join/create an org
      return NextResponse.json({
        user: null,
        message: "User needs to join or create an organization",
      });
    }

    // IMPORTANT: Sync Firm first before syncing User
    // This ensures the foreign key constraint is satisfied
    try {
      const client = await clerkClient();
      const organization = await client.organizations.getOrganization({
        organizationId: orgId,
      });
      
      // Sync or create Firm in database
      await syncFirmFromClerkOrg(orgId, organization.name);
    } catch (orgError) {
      console.error("Error syncing organization:", orgError);
      // Check if firm already exists - if not, we can't proceed
      const existingFirm = await prisma.firm.findUnique({
        where: { clerkOrgId: orgId },
      });
      
      if (!existingFirm) {
        return NextResponse.json(
          {
            error: "Organization not found in database. Please ensure the organization is created first.",
          },
          { status: 404 }
        );
      }
      // Firm exists, continue with user sync
    }

    // Get user's primary email
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || "";

    if (!primaryEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get user's full name
    const fullName = clerkUser.fullName || 
                     `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || 
                     null;

    // Sync user with database (Firm must exist at this point)
    const user = await syncUserFromClerk(
      userId,
      orgId,
      primaryEmail,
      fullName || undefined
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerkUserId: user.clerkUserId,
        clerkOrgId: user.clerkOrgId,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      message: "User synced successfully",
    });
  } catch (error) {
    console.error("User Sync Error:", error);

    return NextResponse.json(
      {
        error: "Failed to sync user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users
 * 
 * Get current user information
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        clerkUserId: true,
        clerkOrgId: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          user: null,
          message: "User not found in database. Please sync first." 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

