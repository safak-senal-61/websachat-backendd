// src/routes/auth/index.js
// Bu dosya, sadece auth ile ilgili tüm alt rota dosyalarını birleştirir.

const express = require('express');
const router = express.Router();

// Hatalı olan yollar, dosya adlarıyla eşleşmesi için alt çizgi (_) kullanılarak düzeltildi.
const standardAuthRoutes = require('./standard_routes.js');
const registerRoutes = require('./register_routes.js');
const emailRoutes = require('./email_routes.js');
const passwordRoutes = require('./password_routes.js');
const oauthRoutes = require('./oauth_routes.js');
const userRoutes = require('./user_routes.js');

// Rotaları birleştir
router.use(standardAuthRoutes);
router.use(registerRoutes);
router.use(emailRoutes);
router.use(passwordRoutes);
router.use(oauthRoutes);
router.use(userRoutes);

module.exports = router;
