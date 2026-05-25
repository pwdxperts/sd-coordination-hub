import { NextRequest, NextResponse } from "next/server";
import { verifyLogin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await verifyLogin(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // In production, use a proper JWT/session mechanism
    // For this prototype, we set user info in a cookie
    const response = NextResponse.json({
      success: true,
      user,
    });

    // Set a simple session cookie (in production, use proper JWT)
    const sessionData = Buffer.from(
      JSON.stringify({ userId: user.id, role: user.role })
    ).toString("base64");

    response.cookies.set("session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
