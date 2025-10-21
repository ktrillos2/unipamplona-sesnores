import { createClient } from "@libsql/client"

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  console.error("[db] Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment variables")
}

export const db = createClient({
  url: url || "",
  authToken: authToken || "",
})

// Inicializar tablas si no existen
export async function initializeTables() {
  try {
    

    // Tabla de sensores
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sensors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        created_at TEXT NOT NULL,
        last_seen TEXT NOT NULL
      )
    `)

    // Tabla de lecturas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id TEXT NOT NULL,
        temperature REAL NOT NULL,
        humidity REAL NOT NULL,
        pm25 REAL NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
      )
    `)

    // Índice para búsquedas rápidas por sensor y fecha
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_readings_sensor_timestamp 
      ON readings(sensor_id, timestamp)
    `)

    // Tabla de eventos de conexión
    await db.execute(`
      CREATE TABLE IF NOT EXISTS connection_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
      )
    `)

    // Índice para búsquedas rápidas por sensor y fecha
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_events_sensor_timestamp 
      ON connection_events(sensor_id, timestamp)
    `)

    
    return true
  } catch (error) {
    console.error("[v0] Error initializing tables:", error)
    return false
  }
}
