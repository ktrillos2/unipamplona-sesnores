// In-memory data store for sensor data
import type { Sensor, SensorReading, ConnectionEvent } from "./types"

class DataStore {
  private sensors: Map<string, Sensor> = new Map()
  private readings: SensorReading[] = []
  private connectionEvents: ConnectionEvent[] = []
  private maxReadings = 10000 // Limit to prevent memory issues

  // Sensor management
  registerSensor(sensor: Omit<Sensor, "isConnected" | "lastConnection" | "lastDisconnection">): Sensor {
    const existingSensor = this.sensors.get(sensor.id)

    if (existingSensor) {
      return existingSensor
    }

    const newSensor: Sensor = {
      ...sensor,
      isConnected: false,
      lastConnection: new Date(),
      lastDisconnection: null,
    }

    this.sensors.set(sensor.id, newSensor)
    return newSensor
  }

  getSensor(id: string): Sensor | undefined {
    return this.sensors.get(id)
  }

  getAllSensors(): Sensor[] {
    return Array.from(this.sensors.values())
  }

  updateSensorConnection(sensorId: string, isConnected: boolean): void {
    const sensor = this.sensors.get(sensorId)
    if (sensor) {
      sensor.isConnected = isConnected
      if (isConnected) {
        sensor.lastConnection = new Date()
      } else {
        sensor.lastDisconnection = new Date()
      }
      this.sensors.set(sensorId, sensor)

      // Log connection event
      this.addConnectionEvent({
        id: `${sensorId}-${Date.now()}`,
        sensorId,
        timestamp: new Date(),
        eventType: isConnected ? "connect" : "disconnect",
      })
    }
  }

  // Reading management
  addReading(reading: SensorReading): void {
    this.readings.push(reading)

    // Keep only the most recent readings
    if (this.readings.length > this.maxReadings) {
      this.readings = this.readings.slice(-this.maxReadings)
    }

    // Update sensor connection status
    this.updateSensorConnection(reading.sensorId, true)
  }

  getReadingsBySensor(sensorId: string, limit?: number): SensorReading[] {
    const sensorReadings = this.readings
      .filter((r) => r.sensorId === sensorId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return limit ? sensorReadings.slice(0, limit) : sensorReadings
  }

  getReadingsByDateRange(sensorId: string, startDate: Date, endDate: Date): SensorReading[] {
    return this.readings
      .filter((r) => r.sensorId === sensorId && r.timestamp >= startDate && r.timestamp <= endDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getAllReadings(limit?: number): SensorReading[] {
    const sorted = [...this.readings].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return limit ? sorted.slice(0, limit) : sorted
  }

  // Connection events
  addConnectionEvent(event: ConnectionEvent): void {
    this.connectionEvents.push(event)
  }

  getConnectionEvents(sensorId?: string, startDate?: Date, endDate?: Date): ConnectionEvent[] {
    let events = this.connectionEvents

    if (sensorId) {
      events = events.filter((e) => e.sensorId === sensorId)
    }

    if (startDate && endDate) {
      events = events.filter((e) => e.timestamp >= startDate && e.timestamp <= endDate)
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Clear old data
  clearOldData(daysToKeep = 30): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    this.readings = this.readings.filter((r) => r.timestamp >= cutoffDate)
    this.connectionEvents = this.connectionEvents.filter((e) => e.timestamp >= cutoffDate)
  }
}

// Singleton instance
export const dataStore = new DataStore()

function initializeTestData() {
  const now = new Date()

  const testSensors = [
    {
      id: "SENSOR_001",
      name: "Campus Principal - Entrada",
      latitude: 7.3797,
      longitude: -72.6517,
    },
    {
      id: "SENSOR_002",
      name: "Centro Histórico",
      latitude: 7.3789,
      longitude: -72.6489,
    },
    {
      id: "SENSOR_003",
      name: "Parque Águeda Gallardo",
      latitude: 7.3825,
      longitude: -72.6545,
    },
    {
      id: "SENSOR_004",
      name: "Terminal de Transportes",
      latitude: 7.3765,
      longitude: -72.6478,
    },
  ]

  // Register sensors
  testSensors.forEach((sensor) => {
    dataStore.registerSensor(sensor)
  })

  // Generate historical readings for the past 24 hours
  const hoursToGenerate = 24
  testSensors.forEach((sensor, sensorIndex) => {
    for (let i = hoursToGenerate; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)

      // Generate realistic sensor data with some variation
      const baseTemp = 22 + sensorIndex * 2
      const baseHumidity = 60 + sensorIndex * 5
      const basePM25 = 10 + sensorIndex * 5

      dataStore.addReading({
        id: `${sensor.id}-${timestamp.getTime()}`,
        sensorId: sensor.id,
        timestamp,
        temperature: baseTemp + Math.random() * 6 - 3,
        humidity: baseHumidity + Math.random() * 10 - 5,
        pm25: Math.max(0, basePM25 + Math.random() * 20 - 10),
      })
    }
  })

  // Generate connection/disconnection events
  testSensors.forEach((sensor, index) => {
    // Add some historical connection events
    for (let i = 5; i > 0; i--) {
      const connectTime = new Date(now.getTime() - i * 4 * 60 * 60 * 1000)
      const disconnectTime = new Date(connectTime.getTime() + 2 * 60 * 60 * 1000)

      dataStore.addConnectionEvent({
        id: `${sensor.id}-connect-${connectTime.getTime()}`,
        sensorId: sensor.id,
        timestamp: connectTime,
        eventType: "connect",
      })

      dataStore.addConnectionEvent({
        id: `${sensor.id}-disconnect-${disconnectTime.getTime()}`,
        sensorId: sensor.id,
        timestamp: disconnectTime,
        eventType: "disconnect",
      })
    }

    // Set current connection status (alternate between connected/disconnected)
    const isConnected = index % 2 === 0
    dataStore.updateSensorConnection(sensor.id, isConnected)
  })
}

// Initialize test data on startup
initializeTestData()
