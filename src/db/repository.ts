import * as SQLite from 'expo-sqlite';
import { getDatabaseConnection } from './database';
import { Planet, SearchResult, SolarSystem, Sun, Universe } from '../types/entities';

function mapRows<T>(result: SQLite.SQLResultSet): T[] {
  const items: T[] = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    items.push(result.rows.item(i) as T);
  }
  return items;
}

export async function getUniverses(): Promise<Universe[]> {
  const db = getDatabaseConnection();
  const result = await db.runSql(
    'SELECT id, name, theme_id AS themeId, created_at AS createdAt FROM universes ORDER BY created_at DESC;'
  );
  return mapRows<Universe>(result);
}

export async function getSolarSystemsByUniverse(universeId: string): Promise<SolarSystem[]> {
  const db = getDatabaseConnection();
  const result = await db.runSql(
    'SELECT id, universe_id AS universeId, name, image_url AS imageUrl, theme_id AS themeId, note_color AS noteColor FROM solar_systems WHERE universe_id = ? ORDER BY name;',
    [universeId]
  );
  return mapRows<SolarSystem>(result);
}

export async function getSolarSystemById(solarSystemId: string): Promise<SolarSystem | null> {
  const db = getDatabaseConnection();
  const result = await db.runSql(
    'SELECT id, universe_id AS universeId, name, image_url AS imageUrl, theme_id AS themeId, note_color AS noteColor FROM solar_systems WHERE id = ? LIMIT 1;',
    [solarSystemId]
  );
  const rows = mapRows<SolarSystem>(result);
  return rows[0] ?? null;
}

export async function getSunBySolarSystemId(solarSystemId: string): Promise<Sun | null> {
  const db = getDatabaseConnection();
  const result = await db.runSql(
    'SELECT id, solar_system_id AS solarSystemId, title, description, theme_id AS themeId, note_color AS noteColor FROM suns WHERE solar_system_id = ? LIMIT 1;',
    [solarSystemId]
  );
  const rows = mapRows<Sun>(result);
  return rows[0] ?? null;
}

export async function getPlanetsBySolarSystemId(solarSystemId: string): Promise<Planet[]> {
  const db = getDatabaseConnection();
  const result = await db.runSql(
    'SELECT id, solar_system_id AS solarSystemId, name, subject, description, theme_id AS themeId, tags, orbit_index AS orbitIndex, note_color AS noteColor FROM planets WHERE solar_system_id = ? ORDER BY orbit_index ASC;',
    [solarSystemId]
  );

  return mapRows<Planet & { tags: string }>(result).map((row) => ({
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : []
  }));
}

export async function getPlanetById(planetId: string): Promise<Planet | null> {
  const db = getDatabaseConnection();
  const result = await db.runSql(
    'SELECT id, solar_system_id AS solarSystemId, name, subject, description, theme_id AS themeId, tags, orbit_index AS orbitIndex, note_color AS noteColor FROM planets WHERE id = ? LIMIT 1;',
    [planetId]
  );

  const rows = mapRows<Planet & { tags: string }>(result);
  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : []
  };
}

export async function searchPlanets(query: string): Promise<SearchResult[]> {
  const db = getDatabaseConnection();
  const searchValue = `%${query}%`;
  const result = await db.runSql(
    `SELECT
      p.id,
      p.name,
      p.subject,
      p.description,
      p.solar_system_id AS solarSystemId,
      s.universe_id AS universeId
    FROM planets p
    JOIN solar_systems s ON s.id = p.solar_system_id
    WHERE p.name LIKE ? OR p.subject LIKE ? OR p.description LIKE ?
    ORDER BY p.name
    LIMIT 20;`,
    [searchValue, searchValue, searchValue]
  );

  return mapRows<SearchResult & { subject?: string; description: string }>(result).map((item) => ({
    id: item.id,
    type: 'planet',
    name: item.name,
    subject: item.subject || undefined,
    snippet: (item.description || item.subject || item.name).slice(0, 120),
    solarSystemId: item.solarSystemId,
    universeId: item.universeId,
    matchType: 'keyword'
  }));
}

export async function savePlanetNote(planet: Planet): Promise<void> {
  const db = getDatabaseConnection();
  await db.runSql(
    'UPDATE planets SET name = ?, subject = ?, description = ?, tags = ?, note_color = ? WHERE id = ?;',
    [planet.name, planet.subject, planet.description, JSON.stringify(planet.tags), planet.noteColor ?? null, planet.id]
  );
}
