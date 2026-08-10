export const v1Initial = {
  version: 1,
  description: 'Initial schema for Orbinote',
  up: [
    `CREATE TABLE IF NOT EXISTS universes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
      theme_id TEXT NOT NULL DEFAULT 'stark-hologram',
      created_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS solar_systems (
      id TEXT PRIMARY KEY,
      universe_id TEXT NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
      name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
      image_url TEXT,
      theme_id TEXT NOT NULL DEFAULT 'stark-hologram',
      note_color TEXT CHECK(note_color IS NULL OR (length(note_color) = 7 AND note_color LIKE '#%'))
    );`,
    `CREATE TABLE IF NOT EXISTS suns (
      id TEXT PRIMARY KEY,
      solar_system_id TEXT NOT NULL UNIQUE REFERENCES solar_systems(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '' CHECK(length(title) <= 200),
      description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 10000),
      theme_id TEXT NOT NULL DEFAULT 'stark-hologram',
      note_color TEXT CHECK(note_color IS NULL OR (length(note_color) = 7 AND note_color LIKE '#%'))
    );`,
    `CREATE TABLE IF NOT EXISTS planets (
      id TEXT PRIMARY KEY,
      solar_system_id TEXT NOT NULL REFERENCES solar_systems(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 10000),
      theme_id TEXT NOT NULL DEFAULT 'stark-hologram',
      tags TEXT NOT NULL DEFAULT '[]',
      orbit_index INTEGER NOT NULL,
      note_color TEXT CHECK(note_color IS NULL OR (length(note_color) = 7 AND note_color LIKE '#%'))
    );`,
    `CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      colors TEXT NOT NULL,
      glow TEXT NOT NULL,
      texture TEXT,
      particle_style TEXT,
      sound TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS embeddings (
      planet_id TEXT PRIMARY KEY REFERENCES planets(id) ON DELETE CASCADE,
      vector BLOB NOT NULL,
      created_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_solar_systems_universe_id ON solar_systems(universe_id);`,
    `CREATE INDEX IF NOT EXISTS idx_planets_solar_system_id ON planets(solar_system_id);`
  ]
};
