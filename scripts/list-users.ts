import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("📋 Listing all users in database...\n");

  const users = await prisma.user.findMany({
    include: {
      firm: {
        select: {
          name: true,
          clerkOrgId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (users.length === 0) {
    console.log("No users found in database.");
    console.log("Run 'npm run db:seed' to seed the database.");
    return;
  }

  console.log(`Found ${users.length} users:\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name || "No name"}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Firm: ${user.firm?.name || "No firm"}`);
    console.log(`   Clerk User ID: ${user.clerkUserId}`);
    console.log(`   Clerk Org ID: ${user.clerkOrgId}`);
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    console.log("");
  });

  console.log("\n⚠️  Note: These are database records only.");
  console.log("   To log in, you need to create a Clerk account at:");
  console.log("   https://dashboard.clerk.com");
  console.log("\n   Or sign up through the app at:");
  console.log("   http://localhost:3000/en/sign-in");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

