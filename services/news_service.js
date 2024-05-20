const { Pool } = require("pg");
const { formatDate } = require("../services/utils");

const pool = new Pool({
  connectionString: process.env["POSTGRES_URL"],
});

async function getAllArticles() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM articoli ORDER BY data_pubblicazione DESC;`
    );
    return result.rows.map((row) => {
      return {
        ...row,
        data_pubblicazione: formatDate(new Date(row.data_pubblicazione)),
      };
    });
  } catch (err) {
    console.error("Error getting articles:", err);
  } finally {
    client.release();
  }
}

async function getArticleById(articleId) {
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT * FROM articoli WHERE id = $1;`, [
      articleId,
    ]);

    const article = result.rows[0];
    article.data_pubblicazione = formatDate(
      new Date(article.data_pubblicazione)
    );

    console.log("Get: ", article);

    return article;
  } catch (err) {
    console.error("Error getting article with ID " + articleId + ":", err);
  } finally {
    client.release();
  }
}

async function createArticle(
  titolo,
  sottotitolo,
  contenuto,
  autore,
  immagine_url
) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO articoli (titolo, sottotitolo, contenuto, autore, immagine_url) VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
      [titolo, sottotitolo, contenuto, autore, immagine_url]
    );

    const article = result.rows[0];
    article.data_pubblicazione = formatDate(
      new Date(article.data_pubblicazione)
    );

    console.log("Created: ", article);

    return article;
  } catch (err) {
    console.error("Error creating article:", err);
  } finally {
    client.release();
  }
}

async function updateArticle(
  id,
  titolo,
  sottotitolo,
  contenuto,
  autore,
  immagine_url
) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE articoli SET titolo = $1, sottotitolo = $2, contenuto = $3, autore = $4, immagine_url = $5 WHERE id = $6 RETURNING *;`,
      [titolo, sottotitolo, contenuto, autore, immagine_url, id]
    );

    const article = result.rows[0];
    article.data_pubblicazione = formatDate(
      new Date(article.data_pubblicazione)
    );

    console.log("Updated: ", article);

    return article;
  } catch (err) {
    console.error("Error updating article with ID " + id + ":", err);
  } finally {
    client.release();
  }
}

async function deleteArticle(articleId) {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM articoli WHERE id = $1;`, [articleId]);
  } catch (err) {
    console.error("Error deleting article with ID " + articleId + ":", err);
  } finally {
    client.release();
  }
}

async function toggleArticle(id, attivo) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      UPDATE articoli 
      SET attivo = $1 
      WHERE id = $2
      RETURNING *;
    `,
      [attivo, id]
    );

    console.log("Toggled: " + result);

    const article = result.rows[0];
    article.data_pubblicazione = formatDate(
      new Date(article.data_pubblicazione)
    );

    console.log("Toggled: ", article);

    return article;
  } catch (err) {
    console.error("Error toggling article:", err);
  } finally {
    client.release();
  }
}

module.exports = {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleArticle,
};
