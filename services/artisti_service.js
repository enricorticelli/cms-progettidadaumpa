// utils.js

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env["POSTGRES_URL"],
});

async function getAllArtists() {
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM artisti ORDER BY nome;`);
    client.release();
    return result.rows;
  } catch (err) {
    console.error(
      "Errore durante il recupero dei dati dalla tabella artisti:",
      err
    );
    throw new Error(
      "Errore durante il recupero dei dati dalla tabella artisti"
    );
  }
}

async function getArtistByCode(codice) {
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM artisti WHERE codice = $1;`,
      [codice]
    );
    client.release();
    return result.rows[0];
  } catch (err) {
    console.error(
      "Errore durante il recupero dei dati dalla tabella artisti:",
      err
    );
    throw new Error(
      "Errore durante il recupero dei dati dalla tabella artisti"
    );
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
    img4: "",
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

async function updateArtist(codice, body) {
  const {
    nome,
    sito,
    descrizione,
    sezione_2,
    spettacoli,
    img1,
    img2,
    img3,
    img4,
  } = body;

  const client = await pool.connect();

  const checkArtist = await client.query(
    `
      SELECT * FROM artisti WHERE codice = $1;
    `,
    [codice]
  );

  if (checkArtist.rows.length === 0) {
    const cleanedCodice = nome
      ? nome.trim().replace(/\s+/g, "").toLowerCase()
      : null;

    const insertResult = await client.query(
      `
        INSERT INTO artisti (codice, nome, sito, descrizione, sezione_2, spettacoli, img1, img2, img3, img4, data_aggiunta, data_modifica)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW());
      `,
      [
        cleanedCodice,
        nome ? nome.trim() : null,
        sito ? sito.trim() : null,
        descrizione ? descrizione.trim() : null,
        sezione_2 ? sezione_2.trim() : null,
        spettacoli ? spettacoli.trim() : null,
        img1,
        img2,
        img3,
        img4
      ]
    );

    console.log("Artista creato con successo "+insertResult);
  } else {
    // Update existing artist
    const updateResult = await client.query(
      `
        UPDATE artisti
        SET nome = $1, sito = $2, descrizione = $3, sezione_2 = $4, spettacoli = $5, img1 = $6, img2 = $7, img3 = $8, img4 = $9, data_modifica = NOW() 
        WHERE codice = $10
      `,
      [
        nome ? nome.trim() : null,
        sito ? sito.trim() : null,
        descrizione ? descrizione.trim() : null,
        sezione_2 ? sezione_2.trim() : null,
        spettacoli ? spettacoli.trim() : null,
        img1,
        img2,
        img3,
        img4,
        codice
      ]
    );

    console.log("Artista aggiornato con successo "+updateResult);
  }

  client.release();
}

module.exports = {
  getAllArtists,
  getArtistByCode,
  getEmptyArtist,
  deleteArtist,
  toggleArtist,
  updateArtist,
};
