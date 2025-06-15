 // src/routes/auth/user_routes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth');
const { authenticateToken } = require('../../middleware/authMiddleware');

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: "Giriş yapmış kullanıcının kendi profil bilgilerini getirir."
 *     tags: [Auth, User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: "Kullanıcı bilgileri başarıyla getirildi."
 *       '401':
 *         description: "Yetkisiz erişim."
 */
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;