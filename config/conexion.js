
import mysql from 'mysql2/promise';

// Creamos un conjunto de conexiones reutilizables para MySQL.
const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST || 'localhost',
  port: Number(process.env.MYSQL_ADDON_PORT) || 3306,
  user: process.env.MYSQL_ADDON_USER || 'root',
  password: process.env.MYSQL_ADDON_PASSWORD || '',
  database: process.env.MYSQL_ADDON_DB || 'juegos',

  // Limitamos las conexiones para no superar el máximo de Clever Cloud.
  waitForConnections: true,
  connectionLimit: 2,
  maxIdle: 2,
  idleTimeout: 10000,
  queueLimit: 0,
  enableKeepAlive: true
});

// Comprobamos la conexión al iniciar el servidor.
pool.getConnection()
  .then((connection) => {
    console.log('Conexión a la base de datos establecida :3');
    connection.release();
  })
  .catch((error) => {
    console.error('Error al conectar a la base de datos:', error);
  });

// Exportamos el conjunto de conexiones para utilizarlo en las consultas.
export default pool;