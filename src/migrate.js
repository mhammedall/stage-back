require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log('Connected to database. Running migrations...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        capacity INT NOT NULL,
        floor INT NOT NULL,
        room_type ENUM('meeting', 'conference', 'training', 'office', 'break_room') NOT NULL DEFAULT 'meeting',
        location VARCHAR(255) DEFAULT '',
        amenities TEXT DEFAULT '',
        image VARCHAR(255) DEFAULT '',
        availability BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [oldColumns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME IN ('size', 'equipments', 'description')
    `, [process.env.DB_NAME]);

    if (oldColumns.length > 0) {
      console.log('Migrating rooms table to new structure...');

      const [capacityCol] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'capacity'
      `, [process.env.DB_NAME]);

      if (capacityCol.length === 0) {
        await connection.query('ALTER TABLE rooms ADD COLUMN capacity INT DEFAULT 8');
        const [sizeCol] = await connection.query(`
          SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'size'
        `, [process.env.DB_NAME]);
        if (sizeCol.length > 0) {
          await connection.query('UPDATE rooms SET capacity = size WHERE capacity IS NULL');
        }
      }

      const [floorCol] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'floor'
      `, [process.env.DB_NAME]);

      if (floorCol.length === 0) {
        await connection.query('ALTER TABLE rooms ADD COLUMN floor INT DEFAULT 1');
      }

      const [typeCol] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'room_type'
      `, [process.env.DB_NAME]);

      if (typeCol.length === 0) {
        await connection.query(`ALTER TABLE rooms ADD COLUMN room_type ENUM('meeting', 'conference', 'training', 'office', 'break_room') DEFAULT 'meeting'`);
      }

      const [amenitiesCol] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'amenities'
      `, [process.env.DB_NAME]);

      if (amenitiesCol.length === 0) {
        await connection.query('ALTER TABLE rooms ADD COLUMN amenities TEXT DEFAULT ""');
        const [equipCol] = await connection.query(`
          SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'equipments'
        `, [process.env.DB_NAME]);
        if (equipCol.length > 0) {
          await connection.query('UPDATE rooms SET amenities = equipments WHERE amenities = ""');
        }
      }

      const [imageCol] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'image'
      `, [process.env.DB_NAME]);

      if (imageCol.length === 0) {
        await connection.query('ALTER TABLE rooms ADD COLUMN image VARCHAR(255) DEFAULT ""');
      }

      const [createdCol] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'created_at'
      `, [process.env.DB_NAME]);

      if (createdCol.length === 0) {
        await connection.query('ALTER TABLE rooms ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      }

      const [updatedCol] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'updated_at'
      `, [process.env.DB_NAME]);

      if (updatedCol.length === 0) {
        await connection.query('ALTER TABLE rooms ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      }

      console.log('Removing old columns...');

      const [sizeExists] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'size'
      `, [process.env.DB_NAME]);
      if (sizeExists.length > 0) {
        await connection.query('ALTER TABLE rooms DROP COLUMN size');
      }

      const [equipExists] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'equipments'
      `, [process.env.DB_NAME]);
      if (equipExists.length > 0) {
        await connection.query('ALTER TABLE rooms DROP COLUMN equipments');
      }

      const [descExists] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'description'
      `, [process.env.DB_NAME]);
      if (descExists.length > 0) {
        await connection.query('ALTER TABLE rooms DROP COLUMN description');
      }

      console.log('Rooms table migration completed!');
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        purpose VARCHAR(255),
        status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_room_time (room_id, start_time, end_time),
        INDEX idx_user_reservations (user_id)
      )
    `);

    console.log('Migration completed successfully!');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
