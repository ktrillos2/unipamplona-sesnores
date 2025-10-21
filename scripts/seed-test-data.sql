-- Insertar sensores de prueba
INSERT OR IGNORE INTO sensors (sensor_id, name, latitude, longitude, created_at, last_seen)
VALUES 
  ('ESP32_CAMPUS', 'Sensor Campus Principal', 7.3797, -72.6503, datetime('now'), datetime('now')),
  ('ESP32_CENTRO', 'Sensor Centro Histórico', 7.3789, -72.6489, datetime('now'), datetime('now')),
  ('ESP32_PARQUE', 'Sensor Parque Águeda Gallardo', 7.3812, -72.6521, datetime('now'), datetime('now')),
  ('ESP32_TERMINAL', 'Sensor Terminal de Transportes', 7.3765, -72.6478, datetime('now'), datetime('now'));

-- Insertar lecturas de prueba (últimas 24 horas)
INSERT INTO readings (sensor_id, temperature, humidity, pm25, timestamp)
SELECT 
  sensor_id,
  20 + (RANDOM() % 10),
  50 + (RANDOM() % 30),
  5 + (RANDOM() % 30),
  datetime('now', '-' || (RANDOM() % 1440) || ' minutes')
FROM sensors
CROSS JOIN (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5);

-- Insertar eventos de conexión
INSERT INTO connection_events (sensor_id, event_type, timestamp)
SELECT sensor_id, 'connected', datetime('now', '-24 hours')
FROM sensors;

INSERT INTO connection_events (sensor_id, event_type, timestamp)
SELECT sensor_id, 'disconnected', datetime('now', '-12 hours')
FROM sensors
WHERE sensor_id IN ('ESP32_CENTRO', 'ESP32_TERMINAL');

INSERT INTO connection_events (sensor_id, event_type, timestamp)
SELECT sensor_id, 'connected', datetime('now', '-6 hours')
FROM sensors
WHERE sensor_id IN ('ESP32_CENTRO', 'ESP32_TERMINAL');
