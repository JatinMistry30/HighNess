import mysql from 'mysql2/promise';
import dotenv from "dotenv";
dotenv.config();

const sqlPool = mysql.createPool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DBNAME,
});

// Test connection
(async () => {
  try {
    const connection = await sqlPool.getConnection();
    console.log('The SQL database is connected');
    connection.release();
  } catch (err) {
    console.error('Failed to connect to SQL DB:', err.message);
  }
})();

export default sqlPool;
