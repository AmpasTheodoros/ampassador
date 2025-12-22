import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Clerk Webhook Handler
 * 
 * Syncs Clerk Organizations and Users with our database
 * 
 * Setup in Clerk Dashboard:
 * 1. Go to Webhooks section
 * 2. Add endpoint: https://yourdomain.com/api/webhooks/clerk
 * 3. Subscribe to: organization.created, organization.updated, organizationMembership.created
 * 4. Copy the webhook secret to CLERK_WEBHOOK_SECRET env var
 */
export async function POST(req: Request) {
  // Get the Svix headers for verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Get webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    if (eventType === "organization.created" || eventType === "organization.updated") {
      const { id, name } = evt.data;

      // Sync firm from Clerk organization
      const existingFirm = await prisma.firm.findUnique({
        where: { clerkOrgId: id },
      });

      if (existingFirm) {
        // Update if name changed
        if (name && existingFirm.name !== name) {
          await prisma.firm.update({
            where: { clerkOrgId: id },
            data: { name },
          });
        }
      } else {
        // Create new firm
        await prisma.firm.create({
          data: {
            clerkOrgId: id,
            name: name || "Untitled Firm",
          },
        });
      }
    }

    if (eventType === "organizationMembership.created") {
      const { organization, public_user_data } = evt.data;

      if (public_user_data?.user_id && organization?.id) {
        // Sync user when they join an organization
        const existingUser = await prisma.user.findUnique({
          where: { clerkUserId: public_user_data.user_id },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              clerkUserId: public_user_data.user_id,
              clerkOrgId: organization.id,
              email: public_user_data.identifier || "",
              name: public_user_data.first_name
                ? `${public_user_data.first_name} ${public_user_data.last_name || ""}`.trim()
                : null,
            },
          });
        } else if (existingUser.clerkOrgId !== organization.id) {
          // Update org if user switched organizations
          await prisma.user.update({
            where: { clerkUserId: public_user_data.user_id },
            data: { clerkOrgId: organization.id },
          });
        }
      }
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Error processing webhook", { status: 500 });
  }
}

