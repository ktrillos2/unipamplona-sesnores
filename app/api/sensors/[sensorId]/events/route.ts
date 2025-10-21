import { type NextRequest, NextResponse } from "next/server"
import { dbOperations } from "@/lib/db-operations"

export async function GET(request: NextRequest, { params }: { params: Promise<{ sensorId: string }> }) {
  try {
    const { sensorId } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const events = await dbOperations.getConnectionEvents(
      sensorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    )

    return NextResponse.json({ events })
  } catch (error) {
    console.error("[v0] Error fetching connection events:", error)
    return NextResponse.json({ error: "Failed to fetch connection events" }, { status: 500 })
  }
}
