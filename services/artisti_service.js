// utils.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env['POSTGRES_URL'],
});

async function getAllArtists() {
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM artisti ORDER BY nome;`);
    client.release();
    return result.rows;
  } catch (err) {
    console.error('Errore durante il recupero dei dati dalla tabella artisti:', err);
    throw new Error('Errore durante il recupero dei dati dalla tabella artisti');
  }
}

async function getArtistByCode(codice) {
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM artisti WHERE codice = $1;`, [codice]);
    client.release();
    return result.rows[0];
  } catch (err) {
    console.error('Errore durante il recupero dei dati dalla tabella artisti:', err);
    throw new Error('Errore durante il recupero dei dati dalla tabella artisti');
  }
}

async function getEmptyArtist() {
  const emptyArtist = {
    id: null,
    codice: "nuovo",
    nome: "",
    sito: "",
    descrizione: "",
    sezione_2: "",
    spettacoli: "",
    img1: "",
    img2: "",
    img3: "",
    img4: ""
  };
  return emptyArtist;
}

async function deleteArtist(codice) {
  const client = await pool.connect();

  const deleteResult = await client.query(
    `
    DELETE FROM artisti WHERE codice = $1;
  `,
    [codice]
  );

  console.log("Deleted: " + deleteResult);
  client.release();
}

async function toggleArtist(codice, attivo) {
  const client = await pool.connect();

  const updateResult = await client.query(
    `
      UPDATE artisti 
      SET attivo = $1 
      WHERE codice = $2;
    `,
    [attivo, codice]
  );

  console.log("Toggled: " + updateResult);
  client.release();
}

module.exports = {
  getAllArtists,
  getArtistByCode,
  getEmptyArtist,
  deleteArtist,
  toggleArtist
};
