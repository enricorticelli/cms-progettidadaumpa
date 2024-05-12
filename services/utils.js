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

module.exports = {
  formatDate,
};
