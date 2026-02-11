const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const migrationsDir = path.join(__dirname, '..', 'migrations');

const getMigrationFiles = () => {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
};

const main = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await connection.execute(
      'SELECT filename FROM schema_migrations'
    );
    const applied = new Set(rows.map((row) => row.filename));

    const files = getMigrationFiles();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Applying ${file}...`);

      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.execute(
          'INSERT INTO schema_migrations (filename) VALUES (?)',
          [file]
        );
        await connection.commit();
        console.log(`Applied ${file}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    console.log('Migration run complete');
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
