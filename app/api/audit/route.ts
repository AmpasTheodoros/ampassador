import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditFormSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = auditFormSchema.parse(body);

    const auditRequest = await prisma.auditRequest.create({
      data: {
        website: validatedData.website,
        name: validatedData.name,
        email: validatedData.email,
      },
    });

    return NextResponse.json(
      { success: true, data: auditRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating audit request:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create audit request" },
      { status: 500 }
    );
  }
}

