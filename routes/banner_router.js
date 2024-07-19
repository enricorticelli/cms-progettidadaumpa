const express = require("express");
const router = express.Router();
const { requiresAuth } = require("express-openid-connect");
require("dotenv").config();
const { getFilesData } = require("../services/immagini_service");

//INDEX
router.get("/", requiresAuth(), async function (req, res, next) {
  try {
    var filesData = res.locals.myCache.get("filesData");
    if (filesData !== undefined) {
      console.log("FilesData found in cache");
    } else {
      console.log("FilesData CACHED");
      filesData = await getFilesData(res.locals.bucket);
      res.locals.myCache.set("filesData", filesData);
    }

    res.render("banner", {
      files: filesData,
      banner: {
        img1: "",
        img2: "",
        img3: "",
        img4: "",
        img5: "",
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("Errore durante il recupero dei dati dalla tabella artisti");
  }
});

module.exports = router;
