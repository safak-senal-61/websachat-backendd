// src/routes/chatRoom/room.routes.js
const express = require('express');
const router = express.Router();
const chatRoomController = require('../../controllers/chatRoom');
const { authenticateToken } = require('../../middleware/authMiddleware');

/**
 * @swagger
 * /chatrooms:
 *   post:
 *     summary: Yeni bir sohbet odası oluşturur
 *     tags: [ChatRooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRoomCreateRequest'
 *     responses:
 *       201:
 *         description: Sohbet odası başarıyla oluşturuldu.
 */
router.post('/', authenticateToken, chatRoomController.createChatRoom);

/**
 * @swagger
 * /chatrooms/public:
 *   get:
 *     summary: Herkese açık ve aktif sohbet odalarını listeler
 *     tags: [ChatRooms]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Sohbet odaları başarıyla listelendi.
 */
router.get('/public', chatRoomController.listPublicChatRooms);

/**
 * @swagger
 * /chatrooms/search:
 *   get:
 *     summary: Başlık veya açıklamaya göre sohbet odalarını arar
 *     tags: [ChatRooms]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Arama sonuçları başarıyla listelendi.
 */
router.get('/search', chatRoomController.searchChatRooms);

/**
 * @swagger
 * /chatrooms/{roomId}:
 *   get:
 *     summary: Belirli bir sohbet odasının detaylarını getirir
 *     tags: [ChatRooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Oda detayları başarıyla getirildi.
 */
router.get('/:roomId', chatRoomController.getChatRoomById);

/**
 * @swagger
 * /chatrooms/{roomId}:
 *   put:
 *     summary: Belirli bir sohbet odasını günceller (Sadece sahip/Admin)
 *     tags: [ChatRooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRoomUpdateRequest'
 *     responses:
 *       200:
 *         description: Oda başarıyla güncellendi.
 */
router.put('/:roomId', authenticateToken, chatRoomController.updateChatRoom);

/**
 * @swagger
 * /chatrooms/{roomId}:
 *   delete:
 *     summary: Belirli bir sohbet odasını siler (Sadece sahip/Admin)
 *     tags: [ChatRooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Oda başarıyla silindi.
 */
router.delete('/:roomId', authenticateToken, chatRoomController.deleteChatRoom);

module.exports = router;