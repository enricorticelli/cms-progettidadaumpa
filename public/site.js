function salvaArtistaDaEliminare(value) {
  document.getElementById("codiceArtista").value = value;
  apriModal("artisti");
}

function salvaUrlImmagineDaEliminare(value) {
  document.getElementById("filename").value = value;
  apriModal("immagini");
}

function salvaArticoloDaEliminare(value) {
  document.getElementById("articolo").value = value;
  apriModal("news");
}

function salvaIdImmagine(value) {
  document.getElementById("idImmagine").value = value;
}

function selezionaImmagine(url) {
  var idImmagine = document.getElementById("idImmagine").value;
  document.getElementById("img" + idImmagine).value = url;
  document.getElementById("imgPreview" + idImmagine).src = url;
}

function showLoading() {
  document.getElementById("load2").style.display = "flex";
}

function hideLoading() {
  document.getElementById("load2").style.display = "none";
}

function deleteArtista() {
  var codiceArtista = document.getElementById("codiceArtista").value;

  fetch("/artisti/" + codiceArtista, {
    method: "DELETE",
  })
    .then((response) => response.text())
    .then((data) => aggiornaTabella(data, "tabella_artisti", true))
    .catch((error) => console.error("Error:", error));

  chiudiModal("artisti");
}

// Delete Image
function deleteImmagine() {
  const name = document.getElementById("filename").value;

  const data = {
    filename: name,
  };

  fetch("./delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.text())
    .then((data) => aggiornaTabella(data, "tabella_immagini", true))
    .catch((error) => console.error("Error:", error));

  chiudiModal("immagini");
}

function deleteArticolo() {
  var idArticolo = document.getElementById("articolo").value;

  fetch("/news/" + idArticolo, {
    method: "DELETE",
  })
    .then((response) => response.text())
    .then((data) => aggiornaTabella(data, "tabella_articoli", true))
    .catch((error) => console.error("Error:", error));

  chiudiModal("news");
}

document.addEventListener("DOMContentLoaded", function () {
  const dropzoneFileInput = document.getElementById("dropzone-file");
  const previewImage = document.getElementById("preview-image");
  const uploadButton = document.getElementById("upload-button");

  if (dropzoneFileInput && previewImage && uploadButton) {
    initializeDropzone(dropzoneFileInput, previewImage, uploadButton);
    initializeUploadButton(uploadButton, dropzoneFileInput, previewImage);
  }
});

function initializeDropzone(dropzoneFileInput, previewImage, uploadButton) {
  dropzoneFileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      previewImage.src = event.target.result;
      previewImage.classList.remove("hidden");
      document
        .querySelector(".flex.flex-col.items-center.justify-center.pt-5.pb-6")
        .classList.add("hidden");
      uploadButton.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

// Initialize Upload Button
function initializeUploadButton(uploadButton, dropzoneFileInput, previewImage) {
  uploadButton.addEventListener("click", async function () {
    // Mostra la schermata di caricamento
    showLoading();

    // Nasconde il pulsante di caricamento
    uploadButton.classList.add("hidden");

    const file = dropzoneFileInput.files[0];
    if (!file) {
      // Nasconde la schermata di caricamento se non viene selezionato nessun file
      hideLoading();
      return;
    }

    if (!isImageFile(file)) {
      showErrorMessage("Il file caricato non è un'immagine.");
      resetDropzone(dropzoneFileInput, previewImage, uploadButton);
      // Nasconde la schermata di caricamento in caso di errore
      hideLoading();
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      fetch("./upload/" + encodeURIComponent(file.name.trim()), {
        method: "POST",
        body: formData,
      })
        .then((response) => response.text())
        .then((data) => {
          aggiornaTabella(data, "tabella_immagini", true);
          resetDropzone(dropzoneFileInput, previewImage, uploadButton);
          // Nasconde la schermata di caricamento dopo il completamento del caricamento
          hideLoading();
        })
        .catch((error) => {
          console.error("Error:", error);
          // Nasconde la schermata di caricamento in caso di errore
          hideLoading();
        });
    } catch (error) {
      console.error("Error during upload:", error);
      showErrorMessage("Errore durante il caricamento del file.");
      // Nasconde la schermata di caricamento in caso di errore
      hideLoading();
    }
  });
}

function isImageFile(file) {
  const acceptedImageTypes = [
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];
  return acceptedImageTypes.includes(file.type);
}

if (document.getElementById("search-form")) {
  document
    .getElementById("search-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(this);

      // Convert FormData to JSON object
      const formDataObj = {};
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });

      // Debug: Log the JSON object
      console.log("FormData as JSON:", formDataObj);

      fetch("../immagini/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formDataObj), // Send as JSON
      })
        .then((response) => response.text()) // Assuming the response is HTML
        .then((data) => {
          aggiornaTabella(data, "tabella_immagini", false);
        })
        .catch((error) => console.error("Error:", error));
    });
}

function resetDropzone(dropzoneFileInput, previewImage, uploadButton) {
  dropzoneFileInput.value = ""; // Clear the file input
  previewImage.src = ""; // Clear the preview image
  previewImage.classList.add("hidden"); // Hide the preview image
  document
    .querySelector(".flex.flex-col.items-center.justify-center.pt-5.pb-6")
    .classList.remove("hidden"); // Show the initial dropzone text
  uploadButton.classList.add("hidden"); // Hide the upload button again

  // Re-initialize the dropzone
  initializeDropzone(dropzoneFileInput, previewImage, uploadButton);
}

function showSuccessMessage(messageText) {
  Toastify({
    text: messageText,
    duration: 3000,
    close: true,
    backgroundColor: "green",
    position: "center",
  }).showToast();
}

function showErrorMessage(messageText) {
  Toastify({
    text: messageText,
    duration: 3000,
    close: true,
    backgroundColor: "red",
    position: "center",
  }).showToast();
}

async function downloadImage(url) {
  try {
    const response = await fetch("./download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to download image: ${errorMessage}`);
    }

    // Creating a Blob object from the response data
    const blob = await response.blob();

    // Creating a temporary anchor element
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "downloaded_image.jpg";

    // Programmatically clicking the anchor to trigger download
    link.click();

    // Cleaning up the anchor element
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error downloading image:", error);
  }
}

async function downloadZip() {
  try {
    const response = await fetch("./download-zip", {
      method: "GET",
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to download ZIP file: ${errorMessage}`);
    }

    // Creating a Blob object from the response data
    const blob = await response.blob();

    // Creating a temporary anchor element
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "files.zip";

    // Programmatically clicking the anchor to trigger download
    link.click();

    // Cleaning up the anchor element
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error downloading ZIP file:", error);
  }
}

document.onreadystatechange = function () {
  var state = document.readyState;
  document.getElementById("contents").style.visibility = "hidden";
  if (state == "complete") {
    document.getElementById("load").style.visibility = "hidden";
    document.getElementById("contents").style.visibility = "visible";
    document.onreadystatechange = null; // Rimuove il listener per evitare ulteriori chiamate
  }
};

function aggiornaTabella(response, nomeTabella, notify) {
  const tabella = document.getElementById(nomeTabella);
  tabella.innerHTML = response;
  if (notify) {
    showSuccessMessage("Tabella aggiornata con successo!");
  }
}

// Toggle function
function toggleAttivo(codice, attivo) {
  fetch(`/artisti/${codice}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attivo }),
  })
    .then((response) => response.text())
    .then((data) => aggiornaTabella(data, "tabella_artisti", true))
    .catch((error) => console.error("Error:", error));
}

function pubblicaArticolo(id, attivo) {
  fetch(`/news/${id}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attivo }),
  })
    .then((response) => response.text())
    .then((data) => aggiornaTabella(data, "tabella_articoli", true))
    .catch((error) => console.error("Error:", error));
}

// Move up function
async function spostaSu(codice) {
  await fetch(`/artisti/${codice}/up`, {
    method: "POST",
  })
    .then((response) => response.text())
    .then((data) => aggiornaTabella(data, "tabella_artisti", true))
    .catch((error) => console.error("Error:", error));
}

// Move down function
async function spostaGiu(codice) {
  await fetch(`/artisti/${codice}/down`, {
    method: "POST",
  })
    .then((response) => response.text())
    .then((data) => aggiornaTabella(data, "tabella_artisti", true))
    .catch((error) => console.error("Error:", error));
}

async function spostaInCima(codice) {
  await fetch(`/artisti/${codice}/top`, {
    method: "POST",
  })
    .then((response) => response.text())
    .then((data) => aggiornaTabella(data, "tabella_artisti", true))
    .catch((error) => console.error("Error:", error));
}

// Move down function
async function spostaInFondo(codice) {
  await fetch(`/artisti/${codice}/bottom`, {
    method: "POST",
  })
    .then((response) => response.text())
    .then((data) => aggiornaTabella(data, "tabella_artisti", true))
    .catch((error) => console.error("Error:", error));
}

function apriModal(tipo) {
  var modal = document.getElementById("popup-modal-" + tipo);
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Aggiungi lo sfondo opaco
  var overlay = document.createElement("div");
  overlay.id = "modal-overlay";
  overlay.className = "fixed inset-0 bg-black bg-opacity-50 z-40";
  document.body.appendChild(overlay);
}

function chiudiModal(tipo) {
  var modal = document.getElementById("popup-modal-" + tipo);
  modal.classList.add("hidden");
  modal.classList.remove("flex");

  // Rimuovi lo sfondo opaco
  var overlay = document.getElementById("modal-overlay");
  if (overlay) {
    overlay.remove();
  }
}
