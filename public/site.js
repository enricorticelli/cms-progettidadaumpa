function salvaArtistaDaEliminare(value) {
  document.getElementById("codiceArtista").value = value;
}

function salvaUrlImmagineDaEliminare(value) {
  document.getElementById("filename").value = value;
}

function salvaIdImmagine(value) {
  document.getElementById("idImmagine").value = value;
}

function selezionaImmagine(url) {
  var idImmagine = document.getElementById("idImmagine").value;
  document.getElementById("img"+idImmagine).value = url;
  document.getElementById("imgPreview"+idImmagine).src = url;
}

function deleteArtista() {
  var codiceArtista = document.getElementById("codiceArtista").value;

  fetch("/artisti/" + codiceArtista, {
    method: "DELETE",
  })
    .then((response) => {
      if (response.ok) {
        showSuccessMessage("Operazione di eliminazione completata con successo!");
      } else {
        alert("Errore durante l'eliminazione dell'artista: " + error);
      }
    })
    .catch((error) => {
      alert("Errore durante l'eliminazione dell'artista: " + error);
      console.error("Errore durante l'eliminazione dell'artista:", error);
    });
}

function toggleAttivo(codiceArtista, isChecked) {
  console.log(codiceArtista, isChecked);
  fetch("/artisti/toggle/" + codiceArtista, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      attivo: isChecked,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        alert("Errore: " + response.error);
      } else {
        showSuccessMessage("Modifica all'artista avvenuta con successo!");
      }
    })
    .then((data) => {
      console.log("Artist attivo status updated successfully");
    })
    .catch((error) => {
      alert("Errore: " + error);
      console.error("There was a problem with the fetch operation:", error);
    });
}

// Aggiungi questo script alla fine della tua pagina o al suo interno

// Funzione per filtrare la tabella in base al nome artista
function filterArtists() {
  // Prendi il valore dalla barra di ricerca
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("simple-search");
  filter = input.value.toUpperCase();
  table = document.querySelector("table");
  tr = table.getElementsByTagName("tr");

  // Per ogni riga della tabella, controlla se il nome artista corrisponde alla ricerca
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0]; // La prima cella contiene il nome artista
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

function filterImages() {
  // Prendi il valore dalla barra di ricerca
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("simple-search-img");
  filter = input.value.toUpperCase();
  table = document.querySelector("table");
  tr = table.getElementsByTagName("tr");

  // Per ogni riga della tabella, controlla se il nome artista corrisponde alla ricerca
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0]; // La prima cella contiene il nome artista
    console.log(td);
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Verifica se siamo sulla pagina corretta prima di associare l'evento
  if (document.getElementById("simple-search")) {
    document
      .getElementById("simple-search")
      .addEventListener("keyup", filterArtists);
  }

  if (document.getElementById("simple-search-img")) {
    document
      .getElementById("simple-search-img")
      .addEventListener("keyup", filterImages);
  }

  const dropzoneFileInput = document.getElementById("dropzone-file");
  const previewImage = document.getElementById("preview-image");
  const uploadButton = document.getElementById("upload-button");
  const successMessage = document.getElementById("success-message");

  if (dropzoneFileInput && previewImage && uploadButton && successMessage) {
    initializeDropzone(dropzoneFileInput, previewImage, uploadButton);
    initializeUploadButton(uploadButton, dropzoneFileInput, successMessage);
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

function initializeUploadButton(
  uploadButton,
  dropzoneFileInput
) {
  uploadButton.addEventListener("click", async function () {
    const file = dropzoneFileInput.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "./upload/" + encodeURIComponent(file.name.trim()),
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      console.log("Upload result:", result);

      if (response.ok) {
        showSuccessMessage("Caricamento avvenuto con successo!");
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error during upload:", error);
    }
  });
}

function deleteImmagine() {
  var name = document.getElementById("filename").value;

  // Costruisci l'oggetto con i dati da inviare nel corpo della richiesta DELETE
  const data = {
    filename: name,
  };

  // Opzioni della richiesta
  const options = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  // Effettua la richiesta DELETE
  fetch("./delete", options)
    .then((response) => {
      if (response.ok) {
        showSuccessMessage("Immagine eliminata con successo!")
      } else {
        // Se la richiesta ha fallito, gestisci l'errore
        console.error("Error deleting image:", response.statusText);
        alert("Errore durante l'eliminazione dell'immagine.");
      }
    })
    .catch((error) => {
      // Se c'è stato un errore durante l'esecuzione della richiesta, gestiscilo
      console.error("Error deleting image:", error);
      alert("Errore durante l'eliminazione dell'immagine.");
    });
}

function showSuccessMessage(messageText) {
  const successMessage = document.getElementById("success-message");

  successMessage.textContent = messageText;
  successMessage.classList.remove("hidden");

  setTimeout(() => {
    window.location.reload();
  }, 2000); // Nascondere la notifica dopo 3 secondi
}

async function downloadImage(url) {
  try {
    const response = await fetch('./download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to download image: ${errorMessage}`);
    }

    // Creating a Blob object from the response data
    const blob = await response.blob();

    // Creating a temporary anchor element
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'downloaded_image.jpg';

    // Programmatically clicking the anchor to trigger download
    link.click();

    // Cleaning up the anchor element
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error downloading image:', error);
  }
}

document.onreadystatechange = function () {
  var state = document.readyState
  if (state == 'interactive') {
       document.getElementById('contents').style.visibility="hidden";
  } else if (state == 'complete') {
      setTimeout(function(){
         document.getElementById('interactive');
         document.getElementById('load').style.visibility="hidden";
         document.getElementById('contents').style.visibility="visible";
      },1000);
  }
}

