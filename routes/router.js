const express = require("express");
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');

router.get('/', requiresAuth(), function (req, res, next) {
  res.render('index', {
    isAuthenticated: req.oidc.isAuthenticated()
  });
});

router.get('/profile', requiresAuth(), function (req, res, next) {
  console.log(JSON.stringify(req.oidc.user, null, 2))

  res.render('profile', {
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    title: 'Profile page'
  });
});

router.get('/artisti', requiresAuth(), function (req, res, next) {
  const artistiJson =  [
      {
        nome: "Nome Artista 1",
        descrizione: "Descrizione Artista 1",
        dataCreazione: "2024-04-30",
        dataUltimaModifica: "2024-05-01",
      },
      {
        nome: "Nome Artista 2",
        descrizione: "Descrizione Artista 2",
        dataCreazione: "2024-04-25",
        dataUltimaModifica: "2024-04-30",
      },
    ];

  res.render('artisti', {
    artisti: artistiJson
  });
});

module.exports = router;
