const express = require("express");
const router = express.Router();
const { requiresAuth } = require("express-openid-connect");
require("dotenv").config();
const { getFilesData } = require("../services/immagini_service");
const {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
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
  const { titolo, sottotitolo, contenuto, autore, imgArticolo } = req.body;
  try {
    const newArticle = await createArticle(
      titolo,
      sottotitolo,
      contenuto,
      autore,
      imgArticolo
    );
    res.redirect(`/articles/${newArticle.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la creazione del nuovo articolo");
  }
});

router.get("/:id", requiresAuth(), async function (req, res, next) {
  const articleId = req.params.id;
  try {
    const article = await getArticleById(articleId);
    res.render("dettaglio_articolo", { article });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante il recupero dell'articolo");
  }
});

router.get("/:id/modifica", requiresAuth(), async function (req, res, next) {
  const articleId = req.params.id;
  try {
    const article = await getArticleById(articleId);
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
      article,
      files: filesData,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("Errore durante il recupero dell'articolo da modificare");
  }
});

router.post("/:id/modifica", requiresAuth(), async function (req, res, next) {
  const articleId = req.params.id;
  const { titolo, sottotitolo, contenuto, autore, imgArticolo } = req.body;
  try {
    await updateArticle(
      articleId,
      titolo,
      sottotitolo,
      contenuto,
      autore,
      imgArticolo
    );
    res.redirect(`/news/${articleId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la modifica dell'articolo");
  }
});

router.post("/:id/elimina", requiresAuth(), async function (req, res, next) {
  const articleId = req.params.id;
  try {
    await deleteArticle(articleId);
    res.redirect("/news");
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante l'eliminazione dell'articolo");
  }
});

module.exports = router;
