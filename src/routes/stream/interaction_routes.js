// src/routes/stream/interaction_routes.js
const express = require('express');
const router = express.Router();
const streamController = require('../../controllers/stream');
const { authenticateToken } = require('../../middleware/authMiddleware');

/**
 * @swagger
 * /streams/{streamId}/viewer-joined:
 *   post:
 *     summary: Bir kullanıcının yayına katıldığını bildirir (Yardımcı Endpoint)
 *     tags: [Streams, UserActions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/StreamIdPathParam'
 *     responses:
 *       200:
 *         description: "İzleyici katılım isteği alındı."
 */
router.post('/:streamId/viewer-joined', authenticateToken, streamController.viewerJoined);

/**
 * @swagger
 * /streams/{streamId}/viewer-left:
 *   post:
 *     summary: Bir kullanıcının yayından ayrıldığını bildirir (Yardımcı Endpoint)
 *     tags: [Streams, UserActions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/StreamIdPathParam'
 *     responses:
 *       200:
 *         description: "İzleyici ayrılış isteği alındı."
 */
router.post('/:streamId/viewer-left', authenticateToken, streamController.viewerLeft);

/**
 * @swagger
 * /streams/webrtc/ice-servers:
 *   get:
 *     summary: WebRTC bağlantısı için STUN/TURN sunucu listesini alır
 *     tags: [Streams, WebRTC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "ICE sunucu bilgileri alındı."
 */
router.get('/webrtc/ice-servers', authenticateToken, streamController.getIceServers);

module.exports = router;