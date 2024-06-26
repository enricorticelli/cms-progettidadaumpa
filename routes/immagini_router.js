const express = require("express");
const router = express.Router();
const multer = require("multer");
const { requiresAuth } = require("express-openid-connect");
const {
  downloadFile,
  uploadFile,
  getFilesData,
  downloadFilesAsZip,
} = require("../services/immagini_service");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", requiresAuth(), async (req, res) => {
  try {
    const { prefix = "" } = req.body; // Added prefix to the request body
    const options = {
      prefix, // Include prefix in the options
    };
    var filesData = res.locals.myCache.get("filesData");
    if (filesData !== undefined) {
      console.log("FilesData found in CACHE");
    } else {
      console.log("FilesData CACHED");
      filesData = await getFilesData(res.locals.bucket, options);
      res.locals.myCache.set("filesData", filesData);
    }

    const firstTenFiles = filesData.slice(0, 10);

    res.render("immagini", { files: firstTenFiles });
  } catch (error) {
    console.error("Error downloading all files:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/search", requiresAuth(), async (req, res) => {
  try {
    const { prefix = "" } = req.body; // Added prefix to the request body
    const options = {
      prefix, // Include prefix in the options
    };
    var filesData = res.locals.myCache.get("filesData" + prefix);
    if (filesData !== undefined) {
      console.log("filesData" + prefix + " found in CACHE");
    } else {
      console.log("filesData" + prefix + " CACHED");
      filesData = await getFilesData(res.locals.bucket, options);
      res.locals.myCache.set("filesData" + prefix, filesData);
    }
    console.log(filesData);
    const firstTenFiles = filesData.slice(0, 10);

    res.render("partials/table_immagini", { files: firstTenFiles }); // Send updated table partial
  } catch (error) {
    console.error("Error downloading all files:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/upload/:filename",
  requiresAuth(),
  upload.single("file"),
  async (req, res) => {
    const fileName = req.file.originalname;
    try {
      await uploadFile(res.locals.bucket, fileName, req.file.buffer);

      const filesData = await getFilesData(res.locals.bucket);
      res.locals.myCache.set("filesData", filesData);

      const firstTenFiles = filesData.slice(0, 10);

      res.render("partials/table_immagini", { files: firstTenFiles }); // Send updated table partial
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

router.post("/download", async (req, res) => {
  const { url } = req.body;
  await downloadFile(url, res);
});

router.get("/download-zip", async (req, res) => {
  await downloadFilesAsZip(res);
});

router.delete("/delete", requiresAuth(), async (req, res) => {
  const fileName = req.body.filename;
  try {
    await res.locals.bucket.file(fileName).delete();

    const filesData = await getFilesData(res.locals.bucket);
    res.locals.myCache.set("filesData", filesData);

    const firstTenFiles = filesData.slice(0, 10);

    res.render("partials/table_immagini", { files: firstTenFiles }); // Send updated table partial
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
