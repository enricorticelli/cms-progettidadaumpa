const express = require("express");
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
require("dotenv").config();

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

module.exports = router;
