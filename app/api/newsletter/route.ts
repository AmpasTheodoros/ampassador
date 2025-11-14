import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailCaptureSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = emailCaptureSchema.parse(body);

    const newsletterSignup = await prisma.newsletterSignup.create({
      data: {
        email: validatedData.email,
      },
    });

    return NextResponse.json(
      { success: true, data: newsletterSignup },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating newsletter signup:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 }
      );
    }

    // Handle unique constraint violation (duplicate email)
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create newsletter signup" },
      { status: 500 }
    );
  }
}

