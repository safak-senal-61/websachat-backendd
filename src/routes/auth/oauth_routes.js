// src/routes/auth/oauth_routes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const { generateTokens, sanitizeUser } = require('../../controllers/auth/utils'); // utils.js dosyasını import ediyoruz
const Response = require('../../utils/responseHandler');

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: "Kullanıcıyı Google ile giriş için yönlendirir."
 *     tags: 
 *       - Auth
 *       - OAuth
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
 *     tags: 
 *       - Auth
 *       - OAuth
 *     responses:
 *       '302':
 *         description: "Başarılı kimlik doğrulama sonrası frontend'e yönlendiriliyor."
 *       '400':
 *         description: "Kimlik doğrulama hatası"
 */
router.get(
    '/google/callback',
    // 1. Passport ile kullanıcıyı doğrula
    passport.authenticate('google', {
        session: false, // JWT kullandığımız için session'a gerek yok
        // Hata durumunda Next.js login sayfasına hata parametresiyle yönlendir
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3001'}/login?error=google_auth_failed`,
    }),
    // 2. Başarılı ise bu middleware çalışır
    async (req, res) => {
        try {
            // req.user, passport_setup.js'deki 'done(null, user)' ile gelir
            if (!req.user) {
                return Response.unauthorized(res, "Google ile kimlik doğrulama sonrası kullanıcı bilgisi alınamadı.");
            }

            // 2. Adımda güncellediğimiz utils'den token'ları üret
            const tokenPayload = await generateTokens(req.user, res);
            const userToReturn = sanitizeUser(req.user);

            // 3. Yönlendireceğimiz URL için query parametrelerini oluştur
            const queryParams = new URLSearchParams({
                accessToken: tokenPayload.accessToken,
                refreshToken: tokenPayload.refreshToken,
                user: JSON.stringify(userToReturn),
            }).toString();

            // 4. Kullanıcıyı Next.js uygulamasındaki /home sayfasına query ile yönlendir
            const redirectTo = `${process.env.CLIENT_URL}/home?${queryParams}`;
            
            console.log(`[OAuth Callback] Başarılı. Yönlendiriliyor: ${redirectTo}`);
            res.redirect(redirectTo);

        } catch (error) {
            console.error("Google callback'te token oluşturma veya yönlendirme hatası:", error);
            const errorRedirectTo = `${process.env.CLIENT_URL}/login?error=token_generation_failed`;
            res.redirect(errorRedirectTo);
        }
    }
);

module.exports = router;