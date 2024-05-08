// artisti.js

const express = require("express");
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
require("dotenv").config();
const { getFilesData } = require("../services/immagini_service");
const { getAllArtists, getArtistByCode, getEmptyArtist, deleteArtist, toggleArtist, updateArtist } = require("../services/artisti_service");

router.get('/', requiresAuth(), async function (req, res, next) {
  try {
    const artisti = await getAllArtists();
    res.render('artisti', { artisti });
  } catch (err) {
    console.error(err);
    res.status(500).send('Errore durante il recupero dei dati dalla tabella artisti');
  }
});

router.get("/nuovo", requiresAuth(), async function (req, res, next) {
  const emptyArtist = await getEmptyArtist();

  res.render("scheda_artista", { editMode: false, artista: emptyArtist });
});

router.get('/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    const artistData = await getArtistByCode(codice);
    const filesData = await getFilesData(res.locals.bucket);
    res.render('scheda_artista', { editMode: true, artista: artistData, files: filesData });
  } catch (err) {
    console.error(err);
    res.status(500).send('Errore durante il recupero dei dati dalla tabella artisti');
  }
});


router.delete('/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    await deleteArtist(codice);

    console.log("Artista eliminato con successo");
    res.sendStatus(204); // Risposta di successo senza contenuto

  } catch (err) {
    console.error('Errore durante l\'eliminazione dell\'artista:', err);
    res.status(500).send('Errore durante l\'eliminazione dell\'artista');
  }
});

router.post('/toggle/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;
  const attivo = req.body.attivo;

  try {
    await toggleArtist(codice, attivo)

    console.log("Stato 'attivo' dell'artista aggiornato con successo");
    res.sendStatus(204); // Risposta di successo senza contenuto

  } catch (err) {
    console.error('Errore durante l\'aggiornamento dello stato \'attivo\' dell\'artista:', err);
    res.status(500).send('Errore durante l\'aggiornamento dello stato \'attivo\' dell\'artista');
  }
});

router.post('/:codice', requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;
  const body = req.body;

  try {
    await updateArtist(codice, body)
    
    res.redirect('/artisti');
  } catch (err) {
    console.error('Errore durante l\'aggiornamento dell\'artista:', err);
    res.status(500).send('Errore durante l\'aggiornamento dell\'artista');
  }
});

module.exports = router;
