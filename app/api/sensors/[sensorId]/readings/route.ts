import { type NextRequest, NextResponse } from "next/server"
import { dbOperations } from "@/lib/db-operations"

export async function GET(request: NextRequest, { params }: { params: Promise<{ sensorId: string }> }) {
  try {
    const { sensorId } = await params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let readings

    if (startDate && endDate) {
      readings = await dbOperations.getReadingsByDateRange(sensorId, new Date(startDate), new Date(endDate))
    } else {
      readings = await dbOperations.getReadingsBySensor(sensorId, limit ? Number.parseInt(limit) : undefined)
    }

    return NextResponse.json({ readings })
  } catch (error) {
    console.error("[v0] Error fetching readings:", error)
    return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 })
  }
}
