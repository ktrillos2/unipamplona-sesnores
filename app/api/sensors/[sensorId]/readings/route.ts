import { type NextRequest, NextResponse } from "next/server"
import { dbOperations } from "@/lib/db-operations"

export async function GET(request: NextRequest, { params }: { params: Promise<{ sensorId: string }> }) {
  try {
    const { sensorId } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = Number.parseInt(searchParams.get("page") || "1") || 1
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10") || 10

    const { items, total } = await dbOperations.getReadingsBySensorPaginated(
      sensorId,
      page,
      pageSize,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    )

    return NextResponse.json({ readings: items, total, page, pageSize })
  } catch (error) {
    console.error("[v0] Error fetching readings:", error)
    return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 })
  }
}
