import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Revalidate Next.js cache for dashboard routes so saved assignments appear immediately
    revalidatePath("/teacher/dashboard");
    revalidatePath("/dashboard");
    revalidatePath("/teacher");

    return NextResponse.json({
      success: true,
      message: "Assignment cache invalidated and synced successfully",
      assignmentId: body?.assignmentId || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to revalidate cache" },
      { status: 500 }
    );
  }
}
