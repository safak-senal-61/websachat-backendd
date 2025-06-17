// src/routes/index.js
// Bu dosya, uygulamanın tüm ana rota modüllerini birleştirir.

const express = require('express');
const router = express.Router();

// Tüm modüler rota birleştiricilerini import et
// Node.js, './auth' yazdığımızda otomatik olarak './auth/index.js' dosyasını arayacaktır.
const authRouter = require('./auth');
const chatRoomRouter = require('./chatRoom');
const followRouter = require('./follow');
const gameRouter = require('./game');
const gameSessionRouter = require('./gameSession');
const giftRouter = require('./gift');
const messageRouter = require('./message');
const notificationRouter = require('./notification');
const reportRouter = require('./report');
const twoFactorRouter = require('./twoFactor');
const userPreferencesRouter = require('./userPreferences');
const userSettingsRouter = require('./userSettings');
const agoraRouter = require('./agora');
const userRouter = require('./user_routes.js'); // Yeni eklenen kullanıcı rotaları
const streamRouter = require('./stream');
console.log('✅ Tüm rota modülleri ana birleştiriciye yükleniyor...');

// Her modülü kendi ana yolu (prefix) ile kullanıma al
router.use('/auth', authRouter);
router.use('/chatrooms', chatRoomRouter);
router.use('/follows', followRouter);
router.use('/games', gameRouter);
router.use('/game-sessions', gameSessionRouter);
router.use('/gifts', giftRouter);
router.use('/messages', messageRouter);
router.use('/notifications', notificationRouter);
router.use('/reports', reportRouter);
router.use('/2fa', twoFactorRouter);
router.use('/preferences', userPreferencesRouter);
router.use('/settings', userSettingsRouter);
router.use('/agora', agoraRouter);
router.use('/users', userRouter); // /users yolunu yeni router'a bağla
router.use('/streams', streamRouter);
console.log('✅ Ana rota yapılandırması tamamlandı.');

module.exports = router;
