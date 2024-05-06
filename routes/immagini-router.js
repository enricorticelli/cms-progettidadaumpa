const express = require("express");
const router = express.Router();
const multer = require('multer');
const { requiresAuth } = require('express-openid-connect');
const { list } = require('@vercel/blob');
const { put } = require('@vercel/blob');
const { del } = require('@vercel/blob');

const upload = multer();

router.get('/', requiresAuth(), async function (req, res, next) {
  try {
    const result = await list();
    const blobs = result.blobs.map(blob => {
      const date = new Date(blob.uploadedAt);
      const formattedDate = formatDate(date);
      return { ...blob, uploadedAt: formattedDate };
    });

    console.log(blobs)

    res.render('immagini', { blobs });
  } catch (error) {
    console.error('Errore durante il recupero dei blobs:', error);
    res.status(500).send('Errore durante il recupero dei blobs');
  }
});

router.get('/list/:prefix', requiresAuth(), async function (req, res, next) {
  const prefix = req.params.prefix;

  try {
    const result = await list({
      prefix: prefix
    });

    return res.json(result);

  } catch (error) {
    console.error('Errore durante il recupero dei blobs:', error);
    res.status(500).send('Errore durante il recupero dei blobs');
  }
});

function formatDate(date) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const formattedDate = date.toLocaleDateString('it-IT', options);
  return formattedDate.replace(',', '') // Rimuove la virgola dopo la data
}

router.post('/upload/:filename', requiresAuth(), upload.single('file'), async (req, res) => {
  const filename = req.params.filename;

  try {
    const file = req.file;

    if (!filename || !file) {
      return res.status(400).json({ error: 'Invalid request. Please provide a filename and a file.' });
    }

    const validImageTypes = ['image/jpeg', 'image/png'];
    if (!validImageTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid request. Upload a JPEG or PNG image.' });
    }

    const blob = await put(filename, file.buffer, {
      access: 'public',
    });

    return res.json(blob);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/delete', requiresAuth(), async (req, res) => {
  const blobUrl = req.body.blobUrl;

  try {
    await del(blobUrl);

    console.error("Image deleted successfully.");
    res.status(200).json({ message: 'Image deleted successfully.' });
  } catch (error) {
    // Se c'è stato un errore durante l'eliminazione, invia una risposta di errore con lo status code 500 e un messaggio di errore generico
    console.error("Error deleting image:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
