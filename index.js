import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './config/conexion.js';

// Creamos el servidor web que recibe las peticiones del frontend.
const app = express();
const PORT = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Permite leer los datos JSON que envían los formularios desde el navegador.
app.use(express.json());
// Publicamos HTML, CSS y JavaScript de la carpeta Public.
app.use(express.static(path.join(__dirname, 'Public')));

app.get('/api/estado', (req, res) => res.json({ mensaje: 'API de Kuekos conectada a MySQL' }));

// READ (lista): devuelve todos los juegos guardados en la tabla MySQL.
app.get('/juegos', async (req, res) => {
  try {
    const [juegos] = await pool.query('SELECT * FROM juegos ORDER BY id DESC');
    res.json(juegos);
  } catch (error) {
    console.error('Error al listar juegos:', error);
    res.status(500).json({ error: 'No se pudieron consultar los juegos' });
  }
});

// READ (uno): busca un juego usando su ID. El signo : indica un parámetro de ruta.
app.get('/juegos/:id', async (req, res) => {
  try {
    const [juegos] = await pool.query('SELECT * FROM juegos WHERE id = ?', [Number(req.params.id)]);
    if (!juegos.length) return res.status(404).json({ error: 'Juego no encontrado' });
    res.json(juegos[0]);
  } catch (error) {
    console.error('Error al buscar juego:', error);
    res.status(500).json({ error: 'No se pudo consultar el juego' });
  }
});

// CREATE: recibe los campos del formulario y crea un registro en MySQL.
app.post('/juegos', async (req, res) => {
  const { titulo, genero, consola } = req.body;
  if (![titulo, genero, consola].every(v => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'Título, género y consola son obligatorios' });
  }
  try {
    const [resultado] = await pool.query(
      'INSERT INTO juegos (titulo, genero, consola) VALUES (?, ?, ?)',
      [titulo.trim(), genero.trim(), consola.trim()]
    );
    const [juegos] = await pool.query('SELECT * FROM juegos WHERE id = ?', [resultado.insertId]);
    res.status(201).json(juegos[0]);
  } catch (error) {
    console.error('Error al crear juego:', error);
    res.status(500).json({ error: 'No se pudo guardar el juego' });
  }
});

// UPDATE: modifica título, género y consola del juego indicado por su ID.
app.put('/juegos/:id', async (req, res) => {
  const { titulo, genero, consola } = req.body;
  if (![titulo, genero, consola].every(v => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'Título, género y consola son obligatorios' });
  }
  try {
    const [resultado] = await pool.query(
      'UPDATE juegos SET titulo = ?, genero = ?, consola = ? WHERE id = ?',
      [titulo.trim(), genero.trim(), consola.trim(), Number(req.params.id)]
    );
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Juego no encontrado' });
    const [juegos] = await pool.query('SELECT * FROM juegos WHERE id = ?', [Number(req.params.id)]);
    res.json(juegos[0]);
  } catch (error) {
    console.error('Error al actualizar juego:', error);
    res.status(500).json({ error: 'No se pudo actualizar el juego' });
  }
});

// DELETE: elimina de MySQL el juego indicado por su ID.
app.delete('/juegos/:id', async (req, res) => {
  try {
    const [resultado] = await pool.query('DELETE FROM juegos WHERE id = ?', [Number(req.params.id)]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Juego no encontrado' });
    res.json({ mensaje: 'Juego eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar juego:', error);
    res.status(500).json({ error: 'No se pudo eliminar el juego' });
  }
});

// Iniciamos el servidor local para que el frontend pueda comunicarse con MySQL.
app.listen(PORT, () => console.log(`Servidor listo en http://localhost:${PORT}`));
