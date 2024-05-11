// utils.js

const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

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
    uploadStream.end(buffer);
  });
}

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

module.exports = {
  downloadFile,
  uploadFile,
  getFilesData,
};
