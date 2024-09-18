const express = require("express");
const router = express.Router();
const { requiresAuth } = require("express-openid-connect");
require("dotenv").config();
const { getFilesData } = require("../services/immagini_service");
const {
  getAllArticles,
  getArticleById: getArticleByCode,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleArticle,
} = require("../services/news_service");

router.get("/", requiresAuth(), async function (req, res, next) {
  try {
    var articles = res.locals.myCache.get("articles");
    if (articles !== undefined) {
      console.log("Articles found in CACHE");
    } else {
      console.log("Articles CACHED");
      articles = await getAllArticles();
      res.locals.myCache.set("articles", articles);
    }

    res.render("news", { articles });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("Errore durante il recupero dei dati dalla tabella articoli");
  }
});

router.get("/nuovo", requiresAuth(), async function (req, res, next) {
  const userName = req.oidc.user.name;

  const emptyArticle = {
    codice: "nuovo",
    titolo: "",
    sottotitolo: "",
    contenuto: "",
    autore: userName,
    immagine_url: "",
  };

  var filesData = res.locals.myCache.get("filesData");
  if (filesData !== undefined) {
    console.log("FilesData found in cache");
  } else {
    console.log("FilesData CACHED");
    filesData = await getFilesData(res.locals.bucket);
    res.locals.myCache.set("filesData", filesData);
  }

  res.render("scheda_articolo", {
    editMode: false,
    articolo: emptyArticle,
    files: filesData,
  });
});

router.post("/nuovo", requiresAuth(), async function (req, res, next) {
  const { titolo, sottotitolo, contenuto, autore, immagine_url } = req.body;
  try {
    const newArticle = await createArticle(
      titolo,
      sottotitolo,
      contenuto,
      autore,
      immagine_url
    );

    var articles = res.locals.myCache.get("articles");
    if (articles !== undefined) {
      console.log("New article added to CACHE");
      articles.push(newArticle);
    } else {
      console.log("Articles CACHED");
      articles = await getAllArticles();
    }
    res.locals.myCache.set("articles", articles);

    res.redirect(`/news`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la creazione del nuovo articolo");
  }
});

router.get("/:code", requiresAuth(), async function (req, res, next) {
  const articleCode = req.params.code;
  try {
    const article = await getArticleByCode(articleCode);

    var filesData = res.locals.myCache.get("filesData");
    if (filesData !== undefined) {
      console.log("FilesData found in cache");
    } else {
      console.log("FilesData CACHED");
      filesData = await getFilesData(res.locals.bucket);
      res.locals.myCache.set("filesData", filesData);
    }

    res.render("scheda_articolo", {
      editMode: true,
      articolo: article,
      files: filesData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante il recupero dell'articolo");
  }
});

router.post("/:code", requiresAuth(), async function (req, res, next) {
  const articleCode = req.params.code;
  const { titolo, sottotitolo, contenuto, autore, immagine_url } = req.body;
  try {
    const article = await updateArticle(
      articleCode,
      titolo,
      sottotitolo,
      contenuto,
      autore,
      immagine_url
    );

    var articles = res.locals.myCache.get("articles");
    if (articles !== undefined) {
      const index = articles.findIndex((a) => a.codice === articleCode);
      if (index !== -1) {
        console.log("Article updated in CACHE");
        articles[index] = article;
      }
    } else {
      console.log("Articles CACHED");
      articles = await getAllArticles();
    }
    res.locals.myCache.set("articles", articles);

    res.redirect(`/news`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la modifica dell'articolo");
  }
});

router.delete("/:code", requiresAuth(), async function (req, res, next) {
  const articleCode = req.params.code;
  try {
    await deleteArticle(articleCode);

    var articles = res.locals.myCache.get("articles");
    if (articles !== undefined) {
      const index = articles.findIndex((a) => a.codice === articleCode);
      if (index !== -1) {
        console.log("Artist removed from CACHE");
        articles.splice(index, 1);
      }
    } else {
      console.log("Articles CACHED");
      articles = await getAllArticles();
    }
    res.locals.myCache.set("articles", articles);

    res.render("partials/table_news", { articles });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante l'eliminazione dell'articolo");
  }
});

router.post("/:code/toggle", requiresAuth(), async function (req, res, next) {
  const codice = req.params.code;
  const attivo = req.body.attivo;

  try {
    const updatedArticle = await toggleArticle(codice, attivo);

    var articles = res.locals.myCache.get("articles");
    if (articles === undefined) {
      articles = await getAllArticles();
    } else {
      const index = articles.findIndex((article) => article.codice === codice);
      if (index !== -1) {
        console.log("Artist updated in CACHE");
        articles[index] = updatedArticle;
      }
    }
    res.locals.myCache.set("articles", articles);

    console.log("Stato pubblicazione aggiornata con successo");
    res.render("partials/table_news", { articles }); // Send updated table partial
  } catch (err) {
    console.error(
      "Errore durante l'aggiornamento dello stato 'attivo' dell'articolo:",
      err
    );
    res
      .status(500)
      .send(
        "Errore durante l'aggiornamento dello stato 'attivo' dell'articolo"
      );
  }
});

module.exports = router;
