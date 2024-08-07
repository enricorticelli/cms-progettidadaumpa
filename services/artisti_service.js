const { Pool } = require("pg");
const slugify = require("slugify"); // Assicurati di avere il pacchetto slugify installato

const pool = new Pool({
  connectionString: process.env["POSTGRES_URL"],
});

async function getAllArtists() {
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT * FROM artisti ORDER BY ordine;`);
    return result.rows;
  } catch (err) {
    console.error("Error getting artists:", err);
  } finally {
    client.release();
  }
}

async function getArtistByCode(codice) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM artisti WHERE codice = $1;`,
      [codice]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error getting artist " + codice + "+:", err);
  } finally {
    client.release();
  }
}

async function createArtist(body) {
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

  try {
    // Genera lo slug dal nome dell'artista
    const slug = slugify(nome, { lower: true, strict: true });

    // Controlla la unicità dello slug e aggiungi un suffisso se necessario
    let uniqueSlug = slug;
    let suffix = 1;
    let exists = true;

    while (exists) {
      const checkSlugRes = await client.query(
        `SELECT COUNT(*) FROM artisti WHERE codice = $1`,
        [uniqueSlug]
      );
      exists = parseInt(checkSlugRes.rows[0].count) > 0;

      if (exists) {
        uniqueSlug = `${slug}-${suffix}`;
        suffix++;
      }
    }

    const maxRes = await client.query(
      `SELECT MAX(ordine) as maxOrdine FROM artisti`
    );
    const maxOrder = maxRes.rows[0].maxordine + 1;

    const insertResult = await client.query(
      `
        INSERT INTO artisti (codice, nome, sito, descrizione, sezione_2, spettacoli, img1, img2, img3, img4, ordine, data_aggiunta, data_modifica)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *;
      `,
      [
        uniqueSlug,
        nome ? nome.trim() : null,
        sito ? sito.trim() : null,
        descrizione ? descrizione.trim() : null,
        sezione_2 ? sezione_2.trim() : null,
        spettacoli ? spettacoli.trim() : null,
        img1,
        img2,
        img3,
        img4,
        maxOrder,
      ]
    );

    console.log("Artista creato con successo " + insertResult.rows[0]);
    return insertResult.rows[0];
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

  try {
    const updateResult = await client.query(
      `
        UPDATE artisti
        SET nome = $1, sito = $2, descrizione = $3, sezione_2 = $4, spettacoli = $5, img1 = $6, img2 = $7, img3 = $8, img4 = $9, data_modifica = NOW() 
        WHERE codice = $10
        RETURNING *;
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

    console.log("Artista aggiornato con successo " + updateResult.rows[0]);
    return updateResult.rows[0];
  } finally {
    client.release();
  }
}

async function deleteArtist(codice) {
  const client = await pool.connect();

  try {
    const deleteResult = await client.query(
      `
    DELETE FROM artisti WHERE codice = $1;
  `,
      [codice]
    );

    console.log("Deleted: " + deleteResult);
  } catch (err) {
    console.error("Error deleting artist:", err);
  } finally {
    client.release();
  }
}

async function toggleArtist(codice, attivo) {
  const client = await pool.connect();

  try {
    const updateResult = await client.query(
      `
      UPDATE artisti 
      SET attivo = $1 
      WHERE codice = $2
      RETURNING *;
    `,
      [attivo, codice]
    );

    console.log("Toggled: " + updateResult);

    return updateResult.rows[0];
  } catch (err) {
    console.error("Error toggling artist:", err);
  } finally {
    client.release();
  }
}

async function spostaInCima(codice) {
  const client = await pool.connect();

  try {
    // Get current order of the specified artist
    const { rows } = await client.query(
      `SELECT ordine FROM artisti WHERE codice = $1`,
      [codice]
    );
    const currentOrder = rows[0].ordine;

    // Increment the order of all artists that were ahead of the specified artist
    await client.query(
      `
      UPDATE artisti
      SET ordine = ordine + 1
      WHERE ordine < $1
      RETURNING *;
      `,
      [currentOrder]
    );

    // Set the specified artist's order to 1
    await client.query(
      `
      UPDATE artisti
      SET ordine = 1
      WHERE codice = $1
      RETURNING *;
      `,
      [codice]
    );

    console.log("Artista spostato in cima: " + codice);
  } catch (err) {
    console.error("Error moving artist to top:", err);
  } finally {
    client.release();
  }
}

async function spostaInFondo(codice) {
  const client = await pool.connect();

  try {
    // Get current order of the specified artist and the maximum order
    const { rows: currentRows } = await client.query(
      `SELECT ordine FROM artisti WHERE codice = $1`,
      [codice]
    );
    const currentOrder = currentRows[0].ordine;

    const { rows: maxRows } = await client.query(
      `SELECT MAX(ordine) as maxOrdine FROM artisti`
    );
    const maxOrder = maxRows[0].maxordine;

    // Decrement the order of all artists that were behind the specified artist
    await client.query(
      `
      UPDATE artisti
      SET ordine = ordine - 1
      WHERE ordine > $1;
      `,
      [currentOrder]
    );

    // Set the specified artist's order to the maximum order value plus one
    await client.query(
      `
      UPDATE artisti
      SET ordine = $1
      WHERE codice = $2
      RETURNING *;
      `,
      [maxOrder, codice]
    );

    console.log("Artista spostato in fondo: " + codice);
  } catch (err) {
    console.error("Error moving artist to bottom:", err);
  } finally {
    client.release();
  }
}

async function spostaSu(codice) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current artist's order
    const res = await client.query(
      `SELECT ordine FROM artisti WHERE codice = $1`,
      [codice]
    );
    const currentOrder = res.rows[0].ordine;

    if (currentOrder > 1) {
      // Increment order of the artist currently above
      await client.query(
        `
        UPDATE artisti
        SET ordine = ordine + 1
        WHERE ordine = $1 - 1;
        `,
        [currentOrder]
      );

      // Decrement order of the specified artist
      await client.query(
        `
        UPDATE artisti
        SET ordine = ordine - 1
        WHERE codice = $1
        RETURNING *;
        `,
        [codice]
      );

      console.log("Artista spostato in alto: " + codice);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error moving artist up:", err);
  } finally {
    client.release();
  }
}

async function spostaGiu(codice) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current artist's order and maximum order
    const res = await client.query(
      `SELECT ordine FROM artisti WHERE codice = $1`,
      [codice]
    );
    const currentOrder = res.rows[0].ordine;

    const maxRes = await client.query(
      `SELECT MAX(ordine) as maxOrdine FROM artisti`
    );
    const maxOrder = maxRes.rows[0].maxordine;

    if (currentOrder < maxOrder) {
      // Decrement order of the artist currently below
      await client.query(
        `
        UPDATE artisti
        SET ordine = ordine - 1
        WHERE ordine = $1 + 1;
        `,
        [currentOrder]
      );

      // Increment order of the specified artist
      await client.query(
        `
        UPDATE artisti
        SET ordine = ordine + 1
        WHERE codice = $1
        RETURNING *;
        `,
        [codice]
      );

      console.log("Artista spostato in basso: " + codice);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error moving artist down:", err);
  } finally {
    client.release();
  }
}

module.exports = {
  getAllArtists,
  getArtistByCode,
  deleteArtist,
  toggleArtist,
  createArtist,
  updateArtist,
  spostaInCima,
  spostaInFondo,
  spostaGiu,
  spostaSu,
};
