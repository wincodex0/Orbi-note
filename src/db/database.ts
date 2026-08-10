import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';
import { ThemeId } from '../types/entities';

const DB_NAME = 'orbinote.db';

export type Migration = {
  version: number;
  description: string;
  up: string[];
};

export type DatabaseConnection = {
  db: SQLite.WebSQLDatabase;
  runSql: (sql: string, args?: (string | number | null)[]) => Promise<SQLite.SQLResultSet>;
};

function openDatabase(): DatabaseConnection {
  const db = SQLite.openDatabase(DB_NAME);

  const runSql = (sql: string, args: (string | number | null)[] = []) => {
    return new Promise<SQLite.SQLResultSet>((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            sql,
            args,
            (_, result) => resolve(result),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        reject
      );
    });
  };

  return { db, runSql };
}

export function getDatabaseConnection(): DatabaseConnection {
  return openDatabase();
}

const initialThemes = [
  {
    id: 'stark-hologram' as ThemeId,
    name: 'Stark Hologram',
    colors: JSON.stringify({
      background: '#05060F',
      primary: '#4FD8FF',
      accent: '#FF9A3C',
      surface: '#0B0D1D',
      text: '#FFFFFF'
    }),
    glow: '#4FD8FF',
    texture: 'grid',
    particleStyle: 'sparkle',
    sound: 'ambient'
  },
  {
    id: 'minion' as ThemeId,
    name: 'Minion',
    colors: JSON.stringify({
      background: '#101820',
      primary: '#F9A826',
      accent: '#F13A59',
      surface: '#1B263B',
      text: '#F4F4F4'
    }),
    glow: '#F9A826',
    texture: 'mesh',
    particleStyle: 'pulse',
    sound: 'soft'
  },
  {
    id: 'cyberpunk' as ThemeId,
    name: 'Cyberpunk',
    colors: JSON.stringify({
      background: '#0C0C1C',
      primary: '#FF3D81',
      accent: '#32E0FF',
      surface: '#14152C',
      text: '#E5E5FF'
    }),
    glow: '#FF3D81',
    texture: 'digital',
    particleStyle: 'neon',
    sound: 'synth'
  },
  {
    id: 'pastel-galaxy' as ThemeId,
    name: 'Pastel Galaxy',
    colors: JSON.stringify({
      background: '#1B1633',
      primary: '#B89AFF',
      accent: '#9CE0D6',
      surface: '#2A2147',
      text: '#F1E8FF'
    }),
    glow: '#B89AFF',
    texture: 'haze',
    particleStyle: 'drift',
    sound: 'whisper'
  }
];

async function seedDatabase(connection: DatabaseConnection): Promise<void> {
  const countRows = await connection.runSql('SELECT COUNT(1) as count FROM universes;');
  const universeCount = countRows.rows.length > 0 ? (countRows.rows.item(0).count as number) : 0;

  if (universeCount > 0) {
    return;
  }

  const now = Date.now();
  const universeId = 'universe-orbinote-1';
  const solarSystemId = 'system-nebula-1';
  const sunId = 'sun-orbinote-1';
  const planetId = 'planet-aurora-1';

  await connection.runSql('BEGIN TRANSACTION;');
  try {
    for (const theme of initialThemes) {
      await connection.runSql(
        'INSERT OR IGNORE INTO themes (id, name, colors, glow, texture, particle_style, sound) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [theme.id, theme.name, theme.colors, theme.glow, theme.texture, theme.particleStyle, theme.sound]
      );
    }

    await connection.runSql(
      'INSERT INTO universes (id, name, theme_id, created_at) VALUES (?, ?, ?, ?);',
      [universeId, 'Orbinote Galaxy', 'stark-hologram', now]
    );

    await connection.runSql(
      'INSERT INTO solar_systems (id, universe_id, name, image_url, theme_id, note_color) VALUES (?, ?, ?, ?, ?, ?);',
      [solarSystemId, universeId, 'Nebula Notes', null, 'stark-hologram', '#4FD8FF']
    );

    await connection.runSql(
      'INSERT INTO suns (id, solar_system_id, title, description, theme_id, note_color) VALUES (?, ?, ?, ?, ?, ?);',
      [sunId, solarSystemId, 'Core Sun', 'The central anchor for your first note galaxy.', 'stark-hologram', '#FFD24D']
    );

    await connection.runSql(
      'INSERT INTO planets (id, solar_system_id, name, subject, description, theme_id, tags, orbit_index, note_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        planetId,
        solarSystemId,
        'Aurora Note',
        'First note',
        'Welcome to Orbinote! Use this planet to store a note, tag it, and explore your galaxy.',
        'stark-hologram',
        JSON.stringify(['welcome', 'getting-started']),
        1,
        '#9DF4FF'
      ]
    );

    await connection.runSql('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);', ['onboardingComplete', 'false']);
    await connection.runSql('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);', ['aiSearchEnabled', 'true']);
    await connection.runSql('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);', ['searchMode', 'keyword']);

    await connection.runSql('COMMIT;');
  } catch (error) {
    await connection.runSql('ROLLBACK;');
    throw error;
  }
}

export async function initializeDatabase(): Promise<DatabaseConnection> {
  const connection = openDatabase();

  await connection.runSql('PRAGMA journal_mode = WAL;');
  await connection.runSql('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);');

  const rows = await connection.runSql('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;');
  const currentVersion = rows.rows.length > 0 ? (rows.rows.item(0).version as number) : 0;

  for (const migration of migrations.filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version)) {
    await connection.runSql('BEGIN TRANSACTION;');
    try {
      for (const statement of migration.up) {
        await connection.runSql(statement);
      }
      await connection.runSql('INSERT INTO schema_migrations (version) VALUES (?);', [migration.version]);
      await connection.runSql('COMMIT;');
    } catch (error) {
      await connection.runSql('ROLLBACK;');
      throw error;
    }
  }

  await seedDatabase(connection);
  return connection;
}

export async function atomicWrite<T>(work: (conn: DatabaseConnection) => Promise<T>): Promise<T> {
  const connection = openDatabase();
  return new Promise<T>((resolve, reject) => {
    connection.db.transaction(
      (tx) => {
        const wrappedConn: DatabaseConnection = {
          db: connection.db,
          runSql: (sql, args = []) => {
            return new Promise<SQLite.SQLResultSet>((innerResolve, innerReject) => {
              tx.executeSql(sql, args, (_, result) => innerResolve(result), (_, error) => {
                innerReject(error);
                return false;
              });
            });
          }
        };

        work(wrappedConn)
          .then(resolve)
          .catch(reject);
      },
      reject
    );
  });
}
