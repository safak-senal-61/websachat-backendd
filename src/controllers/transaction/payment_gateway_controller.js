// src/controllers/transaction/payment_gateway_controller.js
const { PrismaClient, TransactionType, TransactionStatus } = require('../../generated/prisma');
const prisma = new PrismaClient();
const Response = require('../../utils/responseHandler');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Currency enum'u Prisma tarafından generate edilmediği için manuel olarak tanımlandı.
const Currency = {
    USD: 'USD',
    DIAMOND: 'DIAMOND',
    COIN: 'COIN'
};

exports.initiateCoinPurchase = async (req, res) => {
    const { amount, currency = Currency.USD, coinPackageId } = req.body;
    const userId = req.user.userId;

    if (!amount || amount <= 0) {
        return Response.badRequest(res, "Geçerli bir miktar belirtilmelidir.");
    }

    try {
        // Stripe veya başka bir ödeme sağlayıcı entegrasyonu...
        // Örnek olarak, sadece PENDING bir işlem oluşturuyoruz.
        const pendingTransaction = await prisma.transaction.create({
            data: {
                userId,
                transactionType: TransactionType.COIN_PURCHASE,
                amount: parseFloat(amount),
                currency: currency,
                relatedEntityId: coinPackageId,
                relatedEntityType: 'COIN_PACKAGE',
                status: TransactionStatus.PENDING,
                platform: 'STRIPE_EXAMPLE',
            }
        });

        return Response.ok(res, "Jeton satın alma işlemi başlatıldı.", {
            // clientSecret: paymentIntent.client_secret,
            transactionId: pendingTransaction.id,
        });
    } catch (error) {
        console.error("Jeton satın alma başlatma hatası:", error);
        return Response.internalServerError(res, "Satın alma işlemi başlatılırken hata oluştu.");
    }
};

exports.handlePaymentWebhook = async (req, res) => {
    // Bu endpoint, Stripe gibi ödeme sağlayıcılardan gelen webhook'ları dinler.
    // Gelen isteğin doğrulanması ve işlenmesi kritik öneme sahiptir.
    // Bu, sadece bir konsepttir ve üretim için güvenli hale getirilmelidir.

    // const event = req.body;
    // switch (event.type) {
    //     case 'payment_intent.succeeded':
    //         // İşlemi 'COMPLETED' yap ve kullanıcıya jetonları ekle.
    //         break;
    //     case 'payment_intent.payment_failed':
    //         // İşlemi 'FAILED' yap.
    //         break;
// }

    console.warn("handlePaymentWebhook endpoint'i çağrıldı ancak tam olarak implemente edilmedi.");
    return Response.ok(res, "Webhook alındı.");
};