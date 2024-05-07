/**
 * @swagger
 * tags:
 *   name: Artisti
 *   description: API per la gestione degli artisti
 */
require("dotenv").config();

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require('uuid')
const axios = require('axios');
const { requiresAuth } = require("express-openid-connect");

const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": privateKey, // Use the processed private key
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN
};

var admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.BUCKET_URL,
});

var bucket = admin.storage().bucket();

const upload = multer({ storage: multer.memoryStorage() });
router.get("/", requiresAuth(), async (req, res) => {
  try {
    const [files] = await bucket.getFiles();

    if (!files || files.length === 0) {
      return res.status(404).send("No files found");
    }

    const filesData = files.map((file) => {
      const uploadDate = new Date(file.metadata.timeCreated);
      const formattedDate = formatDate(uploadDate);

      return {
        filename: file.name,
        uploadedAt: formattedDate,
        url: "https://firebasestorage.googleapis.com/v0/b/"+file.metadata.bucket+"/o/"+file.name+"?alt=media",
        downloadUrl: "https://firebasestorage.googleapis.com/v0/b/"+file.metadata.bucket+"/o/"+file.name+"?alt=media",
      };
    });

    res.render("immagini", { files: filesData });
  } catch (error) {
    console.error("Error downloading all files:", error);
    res.status(500).send("Internal Server Error");
  }
});

function formatDate(date) {
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  const formattedDate = date.toLocaleDateString("it-IT", options);
  return formattedDate.replace(",", ""); // Rimuove la virgola dopo la data
}

router.post("/upload/:filename", requiresAuth(), upload.single("file"), async (req, res) => {
  const fileName = req.file.originalname;
  try {
      const file = bucket.file(fileName);
      const uploadStream = file.createWriteStream({
          metadata: {
              metadata: {
                  firebaseStorageDownloadTokens: uuidv4()
              }
          }
      });

      uploadStream.on('error', (err) => {
          console.error('Error uploading file:', err);
          res.status(500).json({ error: "Internal server error." });
      });

      uploadStream.on('finish', () => {
          console.log('File uploaded successfully.');
          res.status(200).json("done");
      });

      uploadStream.end(req.file.buffer);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error." });
  }
});


router.post('/download', async (req, res) => {
  try {
    const { url } = req.body;

    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream' // Setting responseType to 'stream' for handling large files
    });

    // Setting response headers for file download
    res.setHeader('Content-disposition', 'attachment; filename=downloaded_image.jpg');
    res.setHeader('Content-type', 'image/jpeg');

    // Piping the response data to the response stream
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading image:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
