import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin"

export async function GET(request: NextRequest) {
  const admin = await getAdminUser()
  return NextResponse.json({ isAdmin: admin !== null })
}
