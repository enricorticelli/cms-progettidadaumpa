const express = require("express");
const router = express.Router();
const { Pool } = require('pg');
const { requiresAuth } = require('express-openid-connect');
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env['POSTGRES_URL'],
});

router.get('/', requiresAuth(), async function (req, res, next) {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`SELECT * FROM artisti;`);

    const sortedArtistData = result.rows.sort((a, b) => new Date(b.data_modifica) - new Date(a.data_modifica));

    res.render('artisti', {
      artisti: sortedArtistData
    });

    client.release();
  } catch (err) {
    console.error('Errore durante il recupero dei dati dalla tabella artisti:', err);
    res.status(500).send('Errore durante il recupero dei dati dalla tabella artisti');
  }
});

router.get("/nuovo", requiresAuth(), async function (req, res, next) {
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

  res.render("scheda_artista", {
    editMode: false,
    artista: emptyArtist
  });
});


router.get('/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    const client = await pool.connect();

    const result = await client.query(`
      SELECT * FROM artisti WHERE codice = $1;
    `, [codice]);

    const artistData = result.rows[0];

    const trimmedArtistData = {
      id: artistData.id,
      codice: artistData.codice.trim(),
      nome: artistData.nome.trim(),
      sito: artistData.sito.trim().replace(/\s+/g, ' '),
      descrizione: artistData.descrizione.trim().replace(/\s+/g, ' '),
      sezione_2: artistData.sezione_2.trim().replace(/\s+/g, ' '),
      spettacoli: artistData.spettacoli.trim().replace(/\s+/g, ' '),
      img1: artistData.img1.trim(),
      img2: artistData.img2.trim(),
      img3: artistData.img3.trim(),
      img4: artistData.img4.trim(),
      data_aggiunta: artistData.data_aggiunta,
      data_modifica: artistData.data_modifica
    };

    console.log(trimmedArtistData)

    res.render('scheda_artista', {
      editMode: true,
      artista: trimmedArtistData
    });

    client.release();
  } catch (err) {
    console.error('Errore durante il recupero dei dati dalla tabella artisti:', err);
    res.status(500).send('Errore durante il recupero dei dati dalla tabella artisti');
  }
});

router.post('/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;
  const { nome, sito, descrizione, sezione_2, spettacoli, img1, img2, img3, img4 } = req.body;

  try {
    const client = await pool.connect();

    const checkArtist = await client.query(`
      SELECT * FROM artisti WHERE codice = $1;
    `, [codice]);

    if (checkArtist.rows.length === 0) {
      const cleanedCodice = nome.trim().replace(/\s+/g, '').toLowerCase();

      const insertResult = await client.query(`
        INSERT INTO artisti (codice, nome, sito, descrizione, sezione_2, spettacoli, img1, img2, img3, img4, data_aggiunta, data_modifica)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW());
      `, [cleanedCodice, nome.trim(), sito.trim(), descrizione.trim(), sezione_2.trim(), spettacoli.trim(), img1.trim(), img2.trim(), img3.trim(), img4.trim()]);
    
      console.log("Artista creato con successo");
    } else {
      // Update existing artist
      const updateResult = await client.query(`
        UPDATE artisti
        SET nome = $1, sito = $2, descrizione = $3, sezione_2 = $4, spettacoli = $5, img1 = $6, img2 = $7, img3 = $8, img4 = $9, data_modifica = NOW() 
        WHERE codice = $10
      `, [nome.trim(), sito.trim(), descrizione.trim(), sezione_2.trim(), spettacoli.trim(), img1.trim(), img2.trim(), img3.trim(), img4.trim(), codice]);
    
      console.log("Artista aggiornato con successo");
    }

    res.redirect('/artisti');

    client.release();
  } catch (err) {
    console.error('Errore durante l\'aggiornamento dell\'artista:', err);
    res.status(500).send('Errore durante l\'aggiornamento dell\'artista');
  }
});

router.delete('/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    const client = await pool.connect();

    const deleteResult = await client.query(`
      DELETE FROM artisti WHERE codice = $1;
    `, [codice]);

    console.log("Artista eliminato con successo");

    res.sendStatus(204); // Risposta di successo senza contenuto

    client.release();
  } catch (err) {
    console.error('Errore durante l\'eliminazione dell\'artista:', err);
    res.status(500).send('Errore durante l\'eliminazione dell\'artista');
  }
});

router.post('/toggle/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;
  const attivo = req.body.attivo;

  try {
    const client = await pool.connect();

    const updateResult = await client.query(`
      UPDATE artisti 
      SET attivo = $1 
      WHERE codice = $2;
    `, [attivo, codice]);

    console.log("Stato 'attivo' dell'artista aggiornato con successo");

    res.sendStatus(204); // Risposta di successo senza contenuto

    client.release();
  } catch (err) {
    console.error('Errore durante l\'aggiornamento dello stato \'attivo\' dell\'artista:', err);
    res.status(500).send('Errore durante l\'aggiornamento dello stato \'attivo\' dell\'artista');
  }
});

module.exports = router;
