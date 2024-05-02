const express = require("express");
const router = express.Router();
const { Pool } = require('pg');
const { requiresAuth } = require('express-openid-connect');
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env['POSTGRES_URL'],
});

router.get('/', requiresAuth(), function (req, res, next) {
  res.render('index', {
    isAuthenticated: req.oidc.isAuthenticated()
  });
});

router.get('/profile', requiresAuth(), function (req, res, next) {
  console.log(JSON.stringify(req.oidc.user, null, 2))

  res.render('profile', {
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    title: 'Profile page'
  });
});

router.get('/artisti', requiresAuth(), async function (req, res, next) {

  try {
    const client = await pool.connect();
    
    const result = await client.query(`SELECT * FROM artisti;`);

    const artistData = result.rows;

    console.log(artistData)

    res.render('artisti', {
      artisti: artistData
    });

    client.release();
  } catch (err) {
    console.error('Errore durante il recupero dei dati dalla tabella artisti:', err);
    res.status(500).send('Errore durante il recupero dei dati dalla tabella artisti');
  }
});

router.get('/artisti/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    const client = await pool.connect();

    const result = await client.query(`
      SELECT * FROM artisti WHERE codice = $1 ORDER BY data_modifica DESC;
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

router.post('/artisti/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  console.log(req.body)
  const { nome, sito, descrizione, sezione_2, spettacoli, img1, img2, img3, img4 } = req.body;

  try {
    const client = await pool.connect();

    const result = await client.query(`
      UPDATE artisti
      SET nome = $1, sito = $2, descrizione = $3, sezione_2 = $4, spettacoli = $5, img1 = $6, img2 = $7, img3 = $8, img4 = $9, data_modifica = NOW() 
      WHERE codice = $10
    `, [nome.trim(), sito.trim(), descrizione.trim(), sezione_2.trim(), spettacoli.trim(), img1.trim(), img2.trim(), img3.trim(), img4.trim(), codice]);

    console.log("Artista aggiornato con successo");

    res.redirect('/artisti');

    client.release();
  } catch (err) {
    console.error('Errore durante l\'aggiornamento dell\'artista:', err);
    res.status(500).send('Errore durante l\'aggiornamento dell\'artista');
  }
});




module.exports = router;
