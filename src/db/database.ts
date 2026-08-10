import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

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
