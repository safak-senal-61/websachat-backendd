// src/routes/transaction/payment_gateway_routes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/transaction');
const { authenticateToken } = require('../../middleware/authMiddleware');

/**
 * @swagger
 * /transactions/purchase/coins:
 *   post:
 *     summary: "Jeton satın alma işlemini başlatır"
 *     tags: 
 *       - Transactions
 *       - Payments
 *     security: 
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/InitiateCoinPurchaseRequest"
 *     responses:
 *       200:
 *         description: "Jeton satın alma işlemi başarıyla başlatıldı."
 */
router.post('/purchase/coins', authenticateToken, transactionController.initiateCoinPurchase);

/**
 * @swagger
 * /transactions/webhooks/payment:
 *   post:
 *     summary: "Ödeme ağ geçidinden gelen webhook bildirimlerini işler"
 *     tags: 
 *       - Transactions
 *       - Payments
 *       - Webhooks
 *     description: "Bu endpoint, ödeme ağ geçidi tarafından çağrılır ve güvenliği çok önemlidir."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: "Webhook başarıyla alındı."
 */
// Stripe gibi bazıları raw body istediği için bu middleware gereklidir.
router.post('/webhooks/payment', express.raw({type: 'application/json'}), transactionController.handlePaymentWebhook);

module.exports = router;