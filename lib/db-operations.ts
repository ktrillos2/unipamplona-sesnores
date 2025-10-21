import { db, initializeTables } from "./db"
import type { Sensor, SensorReading, ConnectionEvent } from "./types"

// Datos de prueba para cuando la base de datos no esté disponible
const mockSensors: Sensor[] = [
  {
    id: "ESP32_CAMPUS",
    name: "Sensor Campus Principal",
    latitude: 7.3797,
    longitude: -72.6503,
    isConnected: true,
    lastConnection: new Date(),
    lastDisconnection: null,
  },
  {
    id: "ESP32_CENTRO",
    name: "Sensor Centro Histórico",
    latitude: 7.3789,
    longitude: -72.6489,
    isConnected: true,
    lastConnection: new Date(Date.now() - 2 * 60 * 1000),
    lastDisconnection: null,
  },
  {
    id: "ESP32_PARQUE",
    name: "Sensor Parque Águeda Gallardo",
    latitude: 7.3812,
    longitude: -72.6521,
    isConnected: false,
    lastConnection: new Date(Date.now() - 15 * 60 * 1000),
    lastDisconnection: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: "ESP32_TERMINAL",
    name: "Sensor Terminal de Transportes",
    latitude: 7.3765,
    longitude: -72.6478,
    isConnected: true,
    lastConnection: new Date(Date.now() - 1 * 60 * 1000),
    lastDisconnection: null,
  },
]

let dbAvailable = true
// Umbral de conexión: 1 minuto sin datos => desconectado
const CONNECTION_STALE_MS = 60 * 1000

// Inicializar tablas al cargar el módulo
initializeTables()
  .then(() => {
    
    dbAvailable = true
  })
  .catch((error) => {
    console.error("[v0] Database initialization failed, using mock data:", error)
    dbAvailable = false
  })
export const dbOperations = {
  // Registrar o actualizar un sensor
  async registerSensor(data: { id: string; name: string; latitude: number; longitude: number }): Promise<Sensor> {
    if (!dbAvailable) {
      const sensor: Sensor = {
        id: data.id,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        isConnected: true,
        lastConnection: new Date(),
        lastDisconnection: null,
      }
      const idx = mockSensors.findIndex((s) => s.id === data.id)
      if (idx >= 0) mockSensors[idx] = sensor
      else mockSensors.push(sensor)
      return sensor
    }

    try {
      const now = new Date().toISOString()

      await db.execute({
        sql: `INSERT INTO sensors (sensor_id, name, latitude, longitude, created_at, last_seen)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(sensor_id) DO UPDATE SET
                name = excluded.name,
                latitude = excluded.latitude,
                longitude = excluded.longitude,
                last_seen = excluded.last_seen`,
        args: [data.id, data.name, data.latitude, data.longitude, now, now],
      })

      await db.execute({
        sql: "INSERT INTO connection_events (sensor_id, event_type, timestamp) VALUES (?, ?, ?)",
        args: [data.id, "connect", now],
      })

      return {
        id: data.id,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        isConnected: true,
        lastConnection: new Date(now),
        lastDisconnection: null,
      }
    } catch (error) {
      console.error("[v0] Database error in registerSensor, falling back to mock:", error)
      dbAvailable = false
      return this.registerSensor(data)
    }
  },

  // Obtener un sensor por ID
  async getSensor(sensorId: string): Promise<Sensor | null> {
    if (!dbAvailable) {
      return mockSensors.find((s) => s.id === sensorId) || null
    }

    try {
      const result = await db.execute({
        sql: "SELECT * FROM sensors WHERE sensor_id = ?",
        args: [sensorId],
      })

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      const lastSeen = new Date(row.last_seen as string)
      const isConnected = Date.now() - lastSeen.getTime() < CONNECTION_STALE_MS

      const sensor: Sensor = {
        id: row.sensor_id as string,
        name: row.name as string,
        latitude: row.latitude as number,
        longitude: row.longitude as number,
        isConnected,
        lastConnection: lastSeen,
        lastDisconnection: null,
      }
      return sensor
    } catch (error) {
      console.error("[v0] Database error in getSensor, falling back to mock:", error)
      dbAvailable = false
      return this.getSensor(sensorId)
    }
  },

  // Obtener todos los sensores
  async getAllSensors(): Promise<Sensor[]> {
    if (!dbAvailable) {
      
      return mockSensors
    }

    try {
      const result = await db.execute("SELECT * FROM sensors ORDER BY name")

      return result.rows.map((row) => {
        const lastSeen = new Date(row.last_seen as string)
        const isConnected = Date.now() - lastSeen.getTime() < CONNECTION_STALE_MS

        const sensor: Sensor = {
          id: row.sensor_id as string,
          name: row.name as string,
          latitude: row.latitude as number,
          longitude: row.longitude as number,
          isConnected,
          lastConnection: lastSeen,
          lastDisconnection: null,
        }
        return sensor
      })
    } catch (error) {
      console.error("[v0] Database error in getAllSensors, falling back to mock:", error)
      dbAvailable = false
      return this.getAllSensors()
    }
  },

  // Agregar una lectura
  async addReading(reading: SensorReading): Promise<void> {
    if (!dbAvailable) {
      
      return
    }

    try {
      await db.execute({
        sql: `INSERT INTO readings (sensor_id, temperature, humidity, pm25, timestamp)
              VALUES (?, ?, ?, ?, ?)`,
        args: [reading.sensorId, reading.temperature, reading.humidity, reading.pm25, reading.timestamp],
      })

      // Actualiza last_seen y registra evento de conexión sólo si venía de estar inactivo (≥ umbral)
      await this.updateSensorConnection(reading.sensorId, true)
    } catch (error) {
      console.error("[v0] Database error in addReading:", error)
      dbAvailable = false
    }
  },

  // Obtener lecturas por sensor
  async getReadingsBySensor(sensorId: string, limit?: number): Promise<SensorReading[]> {
    if (!dbAvailable) {
      const mockReadings: SensorReading[] = []
      const count = limit || 10
      for (let i = 0; i < count; i++) {
        mockReadings.push({
          id: `${sensorId}-${i}`,
          sensorId,
          temperature: 20 + Math.random() * 10,
          humidity: 50 + Math.random() * 30,
          pm25: 10 + Math.random() * 20,
          timestamp: new Date(Date.now() - i * 5 * 60 * 1000),
        })
      }
      return mockReadings
    }

    try {
      const sql = limit
        ? "SELECT * FROM readings WHERE sensor_id = ? ORDER BY timestamp DESC LIMIT ?"
        : "SELECT * FROM readings WHERE sensor_id = ? ORDER BY timestamp DESC"

      const args = limit ? [sensorId, limit] : [sensorId]

      const result = await db.execute({ sql, args })

      return result.rows.map((row) => ({
        id: String(row.id),
        sensorId: row.sensor_id as string,
        temperature: row.temperature as number,
        humidity: row.humidity as number,
        pm25: row.pm25 as number,
        timestamp: new Date(row.timestamp as string),
      }))
    } catch (error) {
      console.error("[v0] Database error in getReadingsBySensor, falling back to mock:", error)
      dbAvailable = false
      return this.getReadingsBySensor(sensorId, limit)
    }
  },

  // Obtener lecturas por rango de fechas
  async getReadingsByDateRange(sensorId: string, startDate: Date, endDate: Date): Promise<SensorReading[]> {
    if (!dbAvailable) {
      return []
    }

    try {
      const result = await db.execute({
        sql: `SELECT * FROM readings 
              WHERE sensor_id = ? AND timestamp BETWEEN ? AND ?
              ORDER BY timestamp DESC`,
        args: [sensorId, startDate.toISOString(), endDate.toISOString()],
      })

      return result.rows.map((row) => ({
        id: String(row.id),
        sensorId: row.sensor_id as string,
        temperature: row.temperature as number,
        humidity: row.humidity as number,
        pm25: row.pm25 as number,
        timestamp: new Date(row.timestamp as string),
      }))
    } catch (error) {
      console.error("[v0] Database error in getReadingsByDateRange:", error)
      dbAvailable = false
      return []
    }
  },

  // Actualizar estado de conexión del sensor
  async updateSensorConnection(sensorId: string, isConnected: boolean): Promise<void> {
    if (!dbAvailable) {
      
      return
    }

    try {
      // Obtener last_seen actual
      const res = await db.execute({
        sql: "SELECT last_seen FROM sensors WHERE sensor_id = ?",
        args: [sensorId],
      })

      const now = new Date()
      const nowIso = now.toISOString()

      let lastSeen: Date | null = null
      if (res.rows.length > 0 && res.rows[0].last_seen) {
        lastSeen = new Date(res.rows[0].last_seen as string)
      }

      if (isConnected) {
        const wasStale = !lastSeen || now.getTime() - lastSeen.getTime() >= CONNECTION_STALE_MS

        // Actualiza last_seen al momento actual
        await db.execute({
          sql: "UPDATE sensors SET last_seen = ? WHERE sensor_id = ?",
          args: [nowIso, sensorId],
        })

        // Registrar evento "connect" sólo si venía inactivo
        if (wasStale) {
          await db.execute({
            sql: "INSERT INTO connection_events (sensor_id, event_type, timestamp) VALUES (?, ?, ?)",
            args: [sensorId, "connect", nowIso],
          })
        }
      } else {
        // Registrar evento de desconexión explícito
        await db.execute({
          sql: "INSERT INTO connection_events (sensor_id, event_type, timestamp) VALUES (?, ?, ?)",
          args: [sensorId, "disconnect", nowIso],
        })
      }
    } catch (error) {
      console.error("[v0] Database error in updateSensorConnection:", error)
      dbAvailable = false
    }
  },

  // Obtener eventos de conexión
  async getConnectionEvents(sensorId: string, startDate?: Date, endDate?: Date): Promise<ConnectionEvent[]> {
    if (!dbAvailable) {
      return [
        {
          id: `${sensorId}-connect`,
          sensorId,
          eventType: "connect",
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
        },
        {
          id: `${sensorId}-disconnect`,
          sensorId,
          eventType: "disconnect",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
      ]
    }

    try {
      let sql = "SELECT * FROM connection_events WHERE sensor_id = ?"
      const args: any[] = [sensorId]

      if (startDate && endDate) {
        sql += " AND timestamp BETWEEN ? AND ?"
        args.push(startDate.toISOString(), endDate.toISOString())
      }

      sql += " ORDER BY timestamp DESC"

      const result = await db.execute({ sql, args })

      return result.rows.map((row) => ({
        id: String(row.id),
        sensorId: row.sensor_id as string,
        eventType: (row.event_type as string) === "disconnect" ? "disconnect" : "connect",
        timestamp: new Date(row.timestamp as string),
      }))
    } catch (error) {
      console.error("[v0] Database error in getConnectionEvents, falling back to mock:", error)
      dbAvailable = false
      return this.getConnectionEvents(sensorId, startDate, endDate)
    }
  },
}
