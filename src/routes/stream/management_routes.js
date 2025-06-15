// src/routes/stream/management_routes.js
const express = require('express');
const router = express.Router();
const streamController = require('../../controllers/stream');
const { authenticateToken } = require('../../middleware/authMiddleware');

/**
 * @swagger
 * /streams:
 *   post:
 *     summary: Yeni bir canlı yayın başlatır veya planlar
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StreamCreateRequest'
 *     responses:
 *       201:
 *         description: "Yayın başarıyla oluşturuldu/başlatıldı."
 */
router.post('/', authenticateToken, streamController.createOrUpdateStream);

/**
 * @swagger
 * /streams/{streamId}:
 *   put:
 *     summary: Devam eden veya planlanmış bir yayının detaylarını günceller
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/StreamIdPathParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StreamUpdateRequest'
 *     responses:
 *       200:
 *         description: "Yayın detayları güncellendi."
 */
router.put('/:streamId', authenticateToken, streamController.updateStreamDetails);

/**
 * @swagger
 * /streams/{streamId}/end:
 *   post:
 *     summary: Bir canlı yayını sonlandırır
 *     tags: [Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/StreamIdPathParam'
 *     responses:
 *       200:
 *         description: "Yayın başarıyla sonlandırıldı."
 */
router.post('/:streamId/end', authenticateToken, streamController.endStream);

module.exports = router;