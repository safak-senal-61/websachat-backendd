// src/routes/auth/oauth_routes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../../controllers/auth');

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: "Kullanıcıyı Google ile giriş için yönlendirir."
 *     tags: [Auth, OAuth]
 *     responses:
 *       '302':
 *         description: "Google kimlik doğrulama sayfasına yönlendiriliyor."
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: "Google kimlik doğrulama sonrası callback URL'i."
 *     tags: [Auth, OAuth]
 *     responses:
 *       '302':
 *         description: "Başarılı kimlik doğrulama sonrası frontend'e yönlendiriliyor."
 */
router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001'}/login?error=google_auth_failed`,
    }),
    async (req, res) => {
        try {
            const tokenPayload = await authController.generateTokens(req.user, res);
            const userToReturn = authController.sanitizeUser(req.user);
            const queryParams = new URLSearchParams({
                accessToken: tokenPayload.accessToken,
                user: JSON.stringify(userToReturn),
            }).toString();
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3001'}/oauth-callback?${queryParams}`);
        } catch (error) {
            console.error("Google callback'te token oluşturma hatası:", error);
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3001'}/login?error=token_generation_failed`);
        }
    }
);

module.exports = router;

// =====================================