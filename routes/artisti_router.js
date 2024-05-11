// artisti.js

const express = require("express");
const router = express.Router();
const { requiresAuth } = require("express-openid-connect");
require("dotenv").config();
const { getFilesData } = require("../services/immagini_service");
const {
  getAllArtists,
  getArtistByCode,
  getEmptyArtist,
  deleteArtist,
  toggleArtist,
  updateArtist,
  spostaSu,
  spostaGiu,
  spostaInCima,
  spostaInFondo,
} = require("../services/artisti_service");

router.get("/", requiresAuth(), async function (req, res, next) {
  try {
    var artisti = res.locals.myCache.get("artisti");
    if (artisti !== undefined) {
      console.log("Artisti found in CACHE");
    } else {
      console.log("Artisti CACHED");
      artisti = await getAllArtists();
      res.locals.myCache.set("artisti", artisti);
    }

    res.render("artisti", { artisti });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("Errore durante il recupero dei dati dalla tabella artisti");
  }
});

router.get("/nuovo", requiresAuth(), async function (req, res, next) {
  const emptyArtist = await getEmptyArtist();

  var filesData = res.locals.myCache.get("filesData");
  if (filesData !== undefined) {
    console.log("FilesData found in cache");
  } else {
    console.log("FilesData CACHED");
    filesData = await getFilesData(res.locals.bucket);
    res.locals.myCache.set("filesData", filesData);
  }

  res.render("scheda_artista", {
    editMode: false,
    artista: emptyArtist,
    files: filesData,
  });
});

router.get("/:codice", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    var artistData = res.locals.myCache.get("artistData_" + codice);
    if (artistData !== undefined) {
      console.log("ArtistData_" + codice + " found in cache");
    } else {
      console.log("ArtistData_" + codice + " CACHED");
      artistData = await getArtistByCode(codice);
      res.locals.myCache.set("artistData_" + codice, artistData);
    }

    var filesData = res.locals.myCache.get("filesData");
    if (filesData !== undefined) {
      console.log("FilesData found in cache");
    } else {
      console.log("FilesData CACHED");
      filesData = await getFilesData(res.locals.bucket);
      res.locals.myCache.set("filesData", filesData);
    }

    res.render("scheda_artista", {
      editMode: true,
      artista: artistData,
      files: filesData,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("Errore durante il recupero dei dati dalla tabella artisti");
  }
});

router.delete("/:codice", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    artisti = await deleteArtist(codice);
    res.locals.myCache.set("artisti", artisti);

    console.log("Artista eliminato con successo");
    res.sendStatus(204); // Risposta di successo senza contenuto
  } catch (err) {
    console.error("Errore durante l'eliminazione dell'artista:", err);
    res.status(500).send("Errore durante l'eliminazione dell'artista");
  }
});

router.post("/toggle/:codice", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;
  const attivo = req.body.attivo;

  try {
    artisti = await toggleArtist(codice, attivo);
    res.locals.myCache.set("artisti", artisti);

    console.log("Stato 'attivo' dell'artista aggiornato con successo");
    res.sendStatus(204); // Risposta di successo senza contenuto
  } catch (err) {
    console.error(
      "Errore durante l'aggiornamento dello stato 'attivo' dell'artista:",
      err
    );
    res
      .status(500)
      .send("Errore durante l'aggiornamento dello stato 'attivo' dell'artista");
  }
});

router.post("/:codice/up", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    artisti = await spostaSu(codice);
    res.locals.myCache.set("artisti", artisti);

    console.log("Artista spostato su");
    res.render("partials/table_artisti", { artisti }); // Send updated table partial
  } catch (err) {
    console.error(
      "Errore durante l'aggiornamento dello stato 'attivo' dell'artista:",
      err
    );
    res
      .status(500)
      .send("Errore durante l'aggiornamento dello stato 'attivo' dell'artista");
  }
});

router.post("/:codice/down", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    artisti = await spostaGiu(codice);
    res.locals.myCache.set("artisti", artisti);

    console.log("Artista spostato giù");

    res.render("partials/table_artisti", { artisti }); // Send updated table partial
  } catch (err) {
    console.error(
      "Errore durante l'aggiornamento dello stato 'attivo' dell'artista:",
      err
    );
    res
      .status(500)
      .send("Errore durante l'aggiornamento dello stato 'attivo' dell'artista");
  }
});

router.post("/:codice/top", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    artisti = await spostaInCima(codice);
    res.locals.myCache.set("artisti", artisti);

    console.log("Artista spostato su");
    res.render("partials/table_artisti", { artisti }); // Send updated table partial
  } catch (err) {
    console.error(
      "Errore durante l'aggiornamento dello stato 'attivo' dell'artista:",
      err
    );
    res
      .status(500)
      .send("Errore durante l'aggiornamento dello stato 'attivo' dell'artista");
  }
});

router.post("/:codice/bottom", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    artisti = await spostaInFondo(codice);
    res.locals.myCache.set("artisti", artisti);

    console.log("Artista spostato giù");

    res.render("partials/table_artisti", { artisti }); // Send updated table partial
  } catch (err) {
    console.error(
      "Errore durante l'aggiornamento dello stato 'attivo' dell'artista:",
      err
    );
    res
      .status(500)
      .send("Errore durante l'aggiornamento dello stato 'attivo' dell'artista");
  }
});

router.post("/:codice", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;
  const body = req.body;

  try {
    await updateArtist(codice, body);
    eliminaCacheArtisti(res.locals.myCache);
    console.log("Artisti removed from CACHE");

    res.redirect("/artisti");
  } catch (err) {
    console.error("Errore durante l'aggiornamento dell'artista:", err);
    res.status(500).send("Errore durante l'aggiornamento dell'artista");
  }
});

function eliminaCacheArtisti(myCache) {
  myCache.del("artisti");
  console.log("Removed artist from CACHE");

  const keys = myCache.keys();
  keys.forEach((key) => {
    if (key.includes("artistData_")) {
      myCache.del(key);
      console.log("Removed " + key + " from CACHE");
    }
  });
}

module.exports = router;
