import mysql from 'mysql2/promise';

// Creamos un conjunto de conexiones reutilizables para consultar MySQL.
const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST || 'localhost',
  user: process.env.MYSQL_ADDON_USER || 'root',
  password: process.env.MYSQL_ADDON_PASSWORD || '',
  database: process.env.MYSQL_ADDON_DB || 'crudo_juegos',
  connectionLimit: 5,
});
// Comprobamos al iniciar que se pueda establecer conexión con la base de datos.
pool.getConnection()
  .then((connection) => {
    console.log('Conexión a la base de datos establecida :3');
    connection.release(); // Liberar la conexión después de usarla
  })
  .catch((error) => {
    console.error('Error al conectar a la base de datos:', error);
  });

export default pool;