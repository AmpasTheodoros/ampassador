import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consultationFormSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = consultationFormSchema.parse(body);

    const consultationRequest = await prisma.consultationRequest.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        company: validatedData.company,
        phone: validatedData.phone || null,
      },
    });

    return NextResponse.json(
      { success: true, data: consultationRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating consultation request:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create consultation request" },
      { status: 500 }
    );
  }
}

