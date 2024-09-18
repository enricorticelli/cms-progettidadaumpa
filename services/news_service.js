const { Pool } = require("pg");
const { formatDate } = require("../services/utils");
const slugify = require("slugify"); // Assicurati di avere il pacchetto slugify installato

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

async function getArticleByCode(articleCode) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM articoli WHERE codice = $1;`,
      [articleCode]
    );

    const article = result.rows[0];
    article.data_pubblicazione = formatDate(
      new Date(article.data_pubblicazione)
    );

    console.log("Get: ", article);

    return article;
  } catch (err) {
    console.error("Error getting article with Code " + articleCode + ":", err);
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
    const slug = slugify(titolo, { lower: true, strict: true });

    // Controlla la unicità dello slug e aggiungi un suffisso se necessario
    let uniqueSlug = slug;
    let suffix = 1;
    let exists = true;

    while (exists) {
      const checkSlugRes = await client.query(
        `SELECT COUNT(*) FROM articoli WHERE codice = $1`,
        [uniqueSlug]
      );
      exists = parseInt(checkSlugRes.rows[0].count) > 0;

      if (exists) {
        uniqueSlug = `${slug}-${suffix}`;
        suffix++;
      }
    }

    const result = await client.query(
      `INSERT INTO articoli (codice, titolo, sottotitolo, contenuto, autore, immagine_url, data_pubblicazione) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
      [
        uniqueSlug,
        titolo,
        sottotitolo,
        contenuto,
        autore,
        immagine_url,
        new Date(),
      ]
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
  articleCode,
  titolo,
  sottotitolo,
  contenuto,
  autore,
  immagine_url
) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE articoli SET titolo = $1, sottotitolo = $2, contenuto = $3, autore = $4, immagine_url = $5 WHERE codice = $6 RETURNING *;`,
      [titolo, sottotitolo, contenuto, autore, immagine_url, articleCode]
    );

    const article = result.rows[0];
    article.data_pubblicazione = formatDate(
      new Date(article.data_pubblicazione)
    );

    console.log("Updated: ", article);

    return article;
  } catch (err) {
    console.error("Error updating article with Code " + articleCode + ":", err);
  } finally {
    client.release();
  }
}

async function deleteArticle(articleCode) {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM articoli WHERE code = $1;`, [articleCode]);
  } catch (err) {
    console.error("Error deleting article with Code " + articleCode + ":", err);
  } finally {
    client.release();
  }
}

async function toggleArticle(codice, attivo) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      UPDATE articoli 
      SET attivo = $1 
      WHERE codice = $2
      RETURNING *;
    `,
      [attivo, codice]
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
  getArticleById: getArticleByCode,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleArticle,
};
