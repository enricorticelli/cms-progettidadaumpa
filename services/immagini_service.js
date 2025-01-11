const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const sharp = require("sharp");
const { formatDate } = require("../services/utils");
const archiver = require("archiver");
const fs = require("fs");
const { PassThrough } = require("stream");

async function getFilesData(bucket, options = {}) {
  const { prefix, ...restOptions } = options; // Extract prefix and other options
  const [files] = await bucket.getFiles({
    ...restOptions,
    prefix, // Use prefix option in getFiles
  });

  if (!files || files.length === 0) {
    return [];
  }

  files.sort((a, b) =>
    b.metadata.timeCreated.localeCompare(a.metadata.timeCreated)
  );

  return files.map((file) => {
    const uploadDate = new Date(file.metadata.timeCreated);
    const formattedDate = formatDate(uploadDate);
    return {
      filename: file.name,
      uploadedAt: formattedDate,
      url: `https://firebasestorage.googleapis.com/v0/b/${file.metadata.bucket}/o/${file.name}?alt=media`,
      downloadUrl: `https://firebasestorage.googleapis.com/v0/b/${file.metadata.bucket}/o/${file.name}?alt=media`,
    };
  });
}

async function downloadFile(url, res) {
  try {
    const response = await axios({
      url: url,
      method: "GET",
      responseType: "stream",
    });
    setResponseHeadersForDownload(res);
    response.data.pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).send("Internal Server Error");
  }
}

function setResponseHeadersForDownload(res) {
  res.setHeader("Content-disposition", "attachment; filename=downloaded_file");
}

async function uploadFile(bucket, fileName, buffer) {
  const webPBuffer = await convertToWebP(buffer);
  const file = bucket.file(fileName);
  const uploadStream = file.createWriteStream({
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: uuidv4(),
      },
    },
  });

  uploadStream.on("error", (err) => {
    console.error("Error uploading file:", err);
    throw new Error("Internal server error.");
  });

  return new Promise((resolve, reject) => {
    uploadStream.on("finish", () => {
      console.log("File uploaded successfully.");
      resolve();
    });
    uploadStream.end(webPBuffer);
  });
}

async function convertToWebP(buffer) {
  return sharp(buffer).webp().toBuffer();
}

async function downloadFilesAsZip(res) {
  const zipFileName = "files.zip";

  // Set response headers for file download
  res.setHeader("Content-Disposition", `attachment; filename=${zipFileName}`);
  res.setHeader("Content-Type", "application/zip");

  const archive = archiver("zip", {
    zlib: { level: 9 }, // Set compression level
  });

  // Stream the ZIP archive to the response
  const passThrough = new PassThrough();
  archive.pipe(passThrough);
  passThrough.pipe(res);

  // Progress bar
  let totalSize = 0;
  let processedSize = 0;

  // Listen for the archive's `progress` event
  archive.on("progress", (data) => {
    processedSize = data.fs.processedBytes;
    if (totalSize > 0) {
      const progress = Math.round((processedSize / totalSize) * 100);
      console.log(`Progress: ${progress}%`);
      res.write(`Progress: ${progress}%\n`);
    }
  });

  // Error handling
  archive.on("error", (err) => {
    console.error("Error creating ZIP archive:", err);
    res.status(500).send("Internal Server Error");
  });

  try {
    const bucket = res.locals.bucket;

    // Retrieve files and calculate total size
    const filesData = await getFilesData(bucket);
    for (const fileData of filesData) {
      totalSize += fileData.size; // Assuming `fileData.size` provides file size
    }

    for (const fileData of filesData) {
      const file = bucket.file(fileData.filename);
      const downloadStream = file.createReadStream();

      // Append the file to the archive
      archive.append(downloadStream, { name: fileData.filename });
    }

    // Finalize the archive (writes the ZIP file)
    await archive.finalize();
  } catch (err) {
    console.error("Error processing files:", err);
    res.status(500).send("Internal Server Error");
  }
}

function setResponseHeadersForDownload(res, filename) {
  res.setHeader("Content-disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-Type", "application/zip");
}

module.exports = {
  downloadFile,
  uploadFile,
  getFilesData,
  downloadFilesAsZip,
};
