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
    id: "nuovo",
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

router.get("/:id", requiresAuth(), async function (req, res, next) {
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
      articolo: article,
      files: filesData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante il recupero dell'articolo");
  }
});

router.post("/:id", requiresAuth(), async function (req, res, next) {
  const articleId = req.params.id;
  const { titolo, sottotitolo, contenuto, autore, immagine_url } = req.body;
  try {
    const article = await updateArticle(
      articleId,
      titolo,
      sottotitolo,
      contenuto,
      autore,
      immagine_url
    );

    var articles = res.locals.myCache.get("articles");
    if (articles !== undefined) {
      const index = articles.findIndex((a) => a.id === article.id);
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

router.post("/:id/elimina", requiresAuth(), async function (req, res, next) {
  const articleId = req.params.id;
  try {
    await deleteArticle(articleId);

    var artists = res.locals.myCache.get("articles");
    if (artists !== undefined) {
      const index = articles.findIndex((a) => a.id === parseInt(articleId));
      if (index !== -1) {
        console.log("Artist removed from CACHE");
        artists.splice(index, 1);
        res.locals.myCache.set("articles", artists);
      }
    }

    res.redirect("/news");
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante l'eliminazione dell'articolo");
  }
});

module.exports = router;
