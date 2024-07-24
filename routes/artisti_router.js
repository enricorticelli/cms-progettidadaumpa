const express = require("express");
const router = express.Router();
const { requiresAuth } = require("express-openid-connect");
require("dotenv").config();
const { getFilesData } = require("../services/immagini_service");
const {
  getAllArtists,
  getArtistByCode,
  deleteArtist,
  toggleArtist,
  createArtist,
  updateArtist,
  spostaSu,
  spostaGiu,
  spostaInCima,
  spostaInFondo,
} = require("../services/artisti_service");

//INDEX
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
  const userName = req.oidc.user.name;

  const emptyArtist = {
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

router.post("/nuovo", requiresAuth(), async function (req, res, next) {
  const body = req.body;
  try {
    const newArtist = await createArtist(body);

    var artisti = res.locals.myCache.get("artisti");
    if (artisti === undefined) {
      artisti = await getAllArtists();
    } else {
      console.log("New artist added to CACHE");
      artisti.push(newArtist);
      res.locals.myCache.set("artisti", artisti);
    }

    res.redirect(`/artisti`);
  } catch (err) {
    console.error(err);
    //res.status(500).send("Errore durante la creazione del nuovo artista");
  }
});

router.get("/:codice", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;
  try {
    const artist = await getArtistByCode(codice);

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
      artista: artist,
      files: filesData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante il recupero dell'artista");
  }
});

router.post("/:codice", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;
  const body = req.body;
  try {
    const updatedArtist = await updateArtist(codice, body);

    var artisti = res.locals.myCache.get("artisti");
    if (artisti === undefined) {
      artisti = await getAllArtists();
    } else {
      const index = artisti.findIndex((artist) => artist.codice === codice);
      if (index !== -1) {
        console.log("Artist updated in CACHE");
        artisti[index] = updatedArtist;
      }
    }

    res.locals.myCache.set("artisti", artisti);

    res.redirect(`/artisti`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la modifica dell'artista");
  }
});

//DELETE
router.delete("/:codice", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    await deleteArtist(codice);

    // Remove artist from cache
    var artisti = res.locals.myCache.get("artisti");
    if (artisti !== undefined) {
      const index = artisti.findIndex((artist) => artist.codice === codice);
      if (index !== -1) {
        console.log("Artist removed from CACHE");
        artisti.splice(index, 1);
        res.locals.myCache.set("artisti", artisti);
      }
    }

    console.log("Artista eliminato con successo");
    res.render("partials/table_artisti", { artisti });
  } catch (err) {
    console.error("Errore durante l'eliminazione dell'artista:", err);
    res.status(500).send("Errore durante l'eliminazione dell'artista");
  }
});

//TOGGLE
router.post("/:codice/toggle", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;
  const attivo = req.body.attivo;

  try {
    const updatedArtist = await toggleArtist(codice, attivo);

    var artisti = res.locals.myCache.get("artisti");
    if (artisti === undefined) {
      artisti = await getAllArtists();
    } else {
      const index = artisti.findIndex((artist) => artist.codice === codice);
      if (index !== -1) {
        console.log("Artist updated in CACHE");
        artisti[index] = updatedArtist;
      }
    }
    res.locals.myCache.set("artisti", artisti);

    console.log("Stato 'attivo' dell'artista aggiornato con successo");
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

//SPOSTAMENTI
router.post("/:codice/up", requiresAuth(), async function (req, res, next) {
  const codice = req.params.codice;

  try {
    await spostaSu(codice);

    artisti = await getAllArtists();
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
    await spostaGiu(codice);

    artisti = await getAllArtists();
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
    await spostaInCima(codice);

    artisti = await getAllArtists();
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
    await spostaInFondo(codice);

    artisti = await getAllArtists();
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

module.exports = router;
