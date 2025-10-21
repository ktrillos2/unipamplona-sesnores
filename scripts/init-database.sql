-- Crear tabla de sensores
CREATE TABLE IF NOT EXISTS sensors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  created_at TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

-- Crear tabla de lecturas
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  temperature REAL NOT NULL,
  humidity REAL NOT NULL,
  pm25 REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
);

-- Índice para búsquedas rápidas por sensor y fecha
CREATE INDEX IF NOT EXISTS idx_readings_sensor_timestamp 
ON readings(sensor_id, timestamp);

-- Crear tabla de eventos de conexión
CREATE TABLE IF NOT EXISTS connection_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
);

-- Índice para búsquedas rápidas por sensor y fecha
CREATE INDEX IF NOT EXISTS idx_events_sensor_timestamp 
ON connection_events(sensor_id, timestamp);
