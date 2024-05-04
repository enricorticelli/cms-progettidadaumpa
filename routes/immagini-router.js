const express = require("express");
const router = express.Router();
const multer = require('multer');
const { put } = require('@vercel/blob');

const upload = multer();

router.post('/upload/:filename', upload.single('file'), async (req, res) => {
  const filename = req.params.filename;

  try {
    const file = req.file;

    if (!filename || !file) {
      return res.status(400).json({ error: 'Invalid request. Please provide a filename and a file.' });
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

module.exports = router;
