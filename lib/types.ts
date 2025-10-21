// Types for sensor data and system
export interface SensorReading {
  id: string
  sensorId: string
  timestamp: Date
  temperature: number
  humidity: number
  pm25: number // Material particulado PM2.5
}

export interface Sensor {
  id: string
  name: string
  latitude: number
  longitude: number
  isConnected: boolean
  lastConnection: Date
  lastDisconnection: Date | null
}

export interface ConnectionEvent {
  id: string
  sensorId: string
  timestamp: Date
  eventType: "connect" | "disconnect"
}

export interface SensorWithLastReading extends Sensor {
  lastReading?: SensorReading
}
