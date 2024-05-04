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
    console.log(td)
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

// Aggiungi un event listener per chiamare la funzione di filtro quando si digita nella barra di ricerca
document
  .getElementById("simple-search")
  .addEventListener("keyup", filterArtists);
