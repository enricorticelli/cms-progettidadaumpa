function salvaArtistaDaEliminare(value) {
  document.getElementById("codiceArtista").value = value;
}

function deleteArtista() {
  var codiceArtista = document.getElementById("codiceArtista").value;

  fetch("/artisti/"+codiceArtista, {
    method: "DELETE",
  })
  .then(response => {
    if (response.ok) {
      // Operazione di eliminazione completata con successo
      window.location.reload(); // Ricarica la pagina o esegui altre azioni necessarie
    }
  })
  .catch(error => {
    console.error('Errore durante l\'eliminazione dell\'artista:', error);
  });
}
