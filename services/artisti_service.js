// utils.js

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env["POSTGRES_URL"],
});

async function getAllArtists() {
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM artisti ORDER BY ordine;`);
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

async function spostaSu(codice) {
  const client = await pool.connect();

  try {
    // Trova l'ordine dell'artista da spostare
    const currentArtist = await client.query(
      `
      SELECT id, ordine
      FROM artisti
      WHERE id = $1
      `,
      [codice]
    );

    // Sposta l'artista verso l'alto e abbassa l'ordine dell'artista sopra
    const updateResult1 = await client.query(
      `
      UPDATE artisti AS a1
      SET ordine = a1.ordine + 1
      FROM (SELECT ordine FROM artisti WHERE id = $1) AS current_artist
      WHERE a1.ordine = current_artist.ordine - 1
      AND current_artist.ordine > 1;
      `,
      [codice]
    );

    // Sposta l'artista specificato in alto di una posizione
    const updateResult2 = await client.query(
      `
      UPDATE artisti
      SET ordine = ordine - 1
      WHERE id = $1
      AND ordine > 1;
      `,
      [codice]
    );

    console.log("Spostato in alto: " + codice);
  } catch (err) {
    console.error("Error moving artist:", err);
  } finally {
    client.release();
  }
}

async function spostaGiu(codice) {
  const client = await pool.connect();

  try {
    // Trova l'ordine dell'artista da spostare
    const currentArtist = await client.query(
      `
      SELECT id, ordine
      FROM artisti
      WHERE codice = $1
      `,
      [codice]
    );

    // Sposta l'artista verso il basso e aumenta l'ordine dell'artista sotto
    const updateResult1 = await client.query(
      `
      UPDATE artisti AS a1
      SET ordine = a1.ordine - 1
      FROM (SELECT ordine FROM artisti WHERE codice = $1) AS current_artist
      WHERE a1.ordine = current_artist.ordine + 1
      AND current_artist.ordine < (SELECT MAX(ordine) FROM artisti);
      `,
      [codice]
    );

    // Sposta l'artista specificato in basso di una posizione
    const updateResult2 = await client.query(
      `
      UPDATE artisti
      SET ordine = ordine + 1
      WHERE codice = $1
      AND ordine < (SELECT MAX(ordine) FROM artisti);
      `,
      [codice]
    );

    console.log("Spostato in basso: " + codice);
  } catch (err) {
    console.error("Error moving artist:", err);
  } finally {
    client.release();
  }
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
        img4,
      ]
    );

    console.log("Artista creato con successo " + insertResult);
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
        codice,
      ]
    );

    console.log("Artista aggiornato con successo " + updateResult);
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
  spostaSu,
  spostaGiu,
};
