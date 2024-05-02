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
      SELECT * FROM artisti WHERE codice = $1;
    `, [codice]);

    const artistData = result.rows[0];

    console.log(artistData)

    res.render('scheda_artista', {
      editMode: true,
      artista: artistData
    });

    client.release();
  } catch (err) {
    console.error('Errore durante il recupero dei dati dalla tabella artisti:', err);
    res.status(500).send('Errore durante il recupero dei dati dalla tabella artisti');
  }
});

module.exports = router;
