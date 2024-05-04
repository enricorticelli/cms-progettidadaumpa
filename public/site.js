function salvaArtistaDaEliminare(value) {
  document.getElementById("codiceArtista").value = value;
}

function deleteArtista() {
  var codiceArtista = document.getElementById("codiceArtista").value;

  fetch("/artisti/" + codiceArtista, {
    method: "DELETE",
  })
    .then((response) => {
      if (response.ok) {
        // Operazione di eliminazione completata con successo
        window.location.reload(); // Ricarica la pagina o esegui altre azioni necessarie
      }
    })
    .catch((error) => {
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
        throw new Error("Network response was not ok");
      }
    })
    .then((data) => {
      // Handle response data if needed
      console.log("Artist attivo status updated successfully");
    })
    .catch((error) => {
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
    document.getElementById("simple-search").addEventListener("keyup", filterArtists);
  }

  initializeDropzone();
  initializeUploadButton();
});

function initializeDropzone() {
  const dropzoneFileInput = document.getElementById("dropzone-file");
  const previewImage = document.getElementById("preview-image");

  dropzoneFileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      previewImage.src = event.target.result;
      previewImage.classList.remove("hidden");
      document.querySelector(".flex.flex-col.items-center.justify-center.pt-5.pb-6").classList.add("hidden");
      document.getElementById("upload-button").classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

function initializeUploadButton() {
  const uploadButton = document.getElementById("upload-button");
  const dropzoneFileInput = document.getElementById("dropzone-file");

  uploadButton.addEventListener("click", async function () {
    const file = dropzoneFileInput.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("./upload/" + encodeURIComponent(file.name.trim()), {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Upload result:", result);

      // Puoi gestire ulteriori azioni dopo l'upload, ad esempio mostrare un messaggio di successo
    } catch (error) {
      console.error("Error during upload:", error);
    }
  });
}