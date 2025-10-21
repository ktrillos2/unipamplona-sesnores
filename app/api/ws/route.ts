/// <reference lib="webworker" />
export const runtime = "edge"

import { NextResponse } from "next/server"
import { dbOperations } from "@/lib/db-operations"

// Simple in-memory registry of active connections (per server instance)
const connections = new Map<string, WebSocket>()

type IncomingMessage =
  | { type: "reading"; sensorId: string; temperature: number; humidity: number; pm25: number; timestamp?: string }
  | { type: "ping" }
  | { type: "disconnect" }

export async function GET(request: Request) {
  if (request.headers.get("upgrade") !== "websocket") {
    return NextResponse.json({ error: "Expected a WebSocket upgrade request" }, { status: 400 })
  }

  // Parse query params for sensor identification/registration
  const { searchParams } = new URL(request.url)
  const sensorId = searchParams.get("sensorId") || undefined
  const name = searchParams.get("name") || undefined
  const latitude = searchParams.get("latitude") ? Number(searchParams.get("latitude")) : undefined
  const longitude = searchParams.get("longitude") ? Number(searchParams.get("longitude")) : undefined

  const pair = new (globalThis as any).WebSocketPair()
  const client: WebSocket = pair[0]
  const server: WebSocket = pair[1]

  ;(server as any).accept()

  // On connect: ensure sensor exists and mark as connected
  if (sensorId && name && typeof latitude === "number" && typeof longitude === "number") {
    // Try to register/update sensor data on first connection
    dbOperations
      .registerSensor({ id: sensorId, name, latitude, longitude })
      .catch(() => {})
  }
  if (sensorId) {
    connections.set(sensorId, server)
    dbOperations.updateSensorConnection(sensorId, true).catch(() => {})
  }

  server.addEventListener("message", (event: any) => {
    try {
      const text = typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data as ArrayBuffer)
      const msg = JSON.parse(text) as IncomingMessage

      if (msg.type === "ping") {
        server.send(JSON.stringify({ type: "pong", ts: Date.now() }))
        return
      }

      if (msg.type === "disconnect" && sensorId) {
        dbOperations.updateSensorConnection(sensorId, false).catch(() => {})
        try {
          server.close(1000, "disconnect")
        } catch {}
        return
      }

      if (msg.type === "reading") {
        const sid = msg.sensorId || sensorId
        if (!sid) return
        const reading: any = {
          sensorId: sid,
          temperature: Number(msg.temperature),
          humidity: Number(msg.humidity),
          pm25: Number(msg.pm25),
          timestamp: msg.timestamp || new Date().toISOString(),
        }
        dbOperations.addReading(reading as any).catch(() => {})
        // optional echo/ack
        server.send(JSON.stringify({ type: "ack", ts: Date.now() }))
        // optional broadcast to dashboard clients
        try {
          const target = connections.get(sid)
          if (target && target !== server) {
            target.send(
              JSON.stringify({
                type: "reading:update",
                sensorId: sid,
                temperature: reading.temperature,
                humidity: reading.humidity,
                pm25: reading.pm25,
              }),
            )
          }
        } catch {}
      }
    } catch {
      // ignore malformed messages
    }
  })

  server.addEventListener("close", () => {
    if (sensorId) {
      connections.delete(sensorId)
      dbOperations.updateSensorConnection(sensorId, false).catch(() => {})
    }
  })

  return new Response(null, { status: 101, webSocket: client } as any)
}
