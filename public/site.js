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

function toggleAttivo(codiceArtista, isChecked) {
    console.log(codiceArtista, isChecked)
    fetch('/artisti/toggle/'+codiceArtista, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        attivo: isChecked
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
    })
    .then(data => {
      // Handle response data if needed
      console.log('Artist attivo status updated successfully');
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
  }
  
  
