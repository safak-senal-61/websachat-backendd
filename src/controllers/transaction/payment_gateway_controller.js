// src/controllers/transaction/payment_gateway_controller.js

const { PrismaClient, TransactionType, TransactionStatus } = require('../../generated/prisma');
const prisma = new PrismaClient();
const Response = require('../../utils/responseHandler');
const iyzico = require('../../services/iyzico_service');
const Iyzipay = require('iyzipay');

const Currency = {
    USD: 'USD',
    TRY: 'TRY',
    DIAMOND: 'DIAMOND',
    COIN: 'COIN'
};

// Bu verilerin veritabanında bir "CoinPackages" tablosunda tutulması en iyisidir.
const coinPackages = {
    'PKG100': { id: 'PKG100', name: 'Başlangıç Paketi', price: '10.00', coins: 1000, bonusCoins: 50 },
    'PKG500': { id: 'PKG500', name: 'Fenomen Paketi', price: '45.00', coins: 5500, bonusCoins: 500 },
    'PKG1000': { id: 'PKG1000', name: 'Kral Paketi', price: '80.00', coins: 12000, bonusCoins: 2000 },
    'PKG5000': { id: 'PKG5000', name: 'İmparator Paketi', price: '500.00', coins: 65000, bonusCoins: 15000 },
};

/**
 * Iyzico ödeme formunu başlatır.
 */
exports.initiateCoinPurchase = async (req, res) => {
    const { coinPackageId } = req.body;
    const userId = req.user.userId;

    const selectedPackage = coinPackages[coinPackageId];
    if (!selectedPackage) {
        return Response.badRequest(res, "Geçerli bir jeton paketi seçilmelidir.");
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return Response.notFound(res, "Kullanıcı bulunamadı.");
        }

        const pendingTransaction = await prisma.transaction.create({
            data: {
                userId,
                transactionType: TransactionType.COIN_PURCHASE,
                amount: parseFloat(selectedPackage.price),
                currency: Currency.TRY,
                relatedEntityId: coinPackageId,
                relatedEntityType: 'COIN_PACKAGE',
                status: TransactionStatus.PENDING,
                platform: 'IYZICO',
            }
        });

        const request = {
            locale: Iyzipay.LOCALE.TR,
            conversationId: pendingTransaction.id,
            price: selectedPackage.price,
            paidPrice: selectedPackage.price,
            currency: Iyzipay.CURRENCY.TRY,
            basketId: pendingTransaction.id,
            paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
            callbackUrl: `${process.env.BASE_URL}/transactions/callback/iyzico`,
            buyer: {
                id: user.id,
                name: user.nickname || user.username,
                surname: 'User',
                gsmNumber: '+905555555555',
                email: user.email,
                identityNumber: '11111111111',
                lastLoginDate: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString().replace(/T/, ' ').replace(/\..+/, '') : new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                registrationDate: new Date(user.createdAt).toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                registrationAddress: 'N/A',
                ip: req.ip,
                city: 'N/A',
                country: user.country || 'Turkey',
                zipCode: '34000',
            },
            shippingAddress: {
                contactName: user.nickname || user.username,
                city: 'N/A',
                country: 'Turkey',
                address: 'N/A',
                zipCode: '34000',
            },
            billingAddress: {
                contactName: user.nickname || user.username,
                city: 'N/A',
                country: 'Turkey',
                address: 'N/A',
                zipCode: '34000',
            },
            basketItems: [{
                id: selectedPackage.id,
                name: selectedPackage.name,
                category1: 'Digital Goods',
                itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                price: selectedPackage.price,
            }]
        };

        iyzico.checkoutFormInitialize.create(request, (err, result) => {
            if (err) {
                console.error("Iyzico ödeme formu oluşturma hatası:", err);
                return Response.internalServerError(res, "Ödeme formu oluşturulamadı.", err);
            }
            if (result.status === 'success') {
                return Response.ok(res, "Ödeme formu başarıyla oluşturuldu.", {
                    paymentPageContent: result.checkoutFormContent
                });
            } else {
                return Response.badRequest(res, `Iyzico Hatası: ${result.errorMessage}`, {
                    errorCode: result.errorCode,
                });
            }
        });

    } catch (error) {
        console.error("Jeton satın alma başlatma hatası:", error);
        return Response.internalServerError(res, "Satın alma işlemi başlatılırken hata oluştu.");
    }
};

/**
 * Iyzico'dan gelen callback'i işler, ödemeyi doğrular ve işlemi tamamlar.
 */
exports.handleIyzicoCallback = async (req, res) => {
    // --- DEBUG İÇİN EKLENEN LOG'LAR ---
    // Sorunu anlamak için Iyzico'dan gelen isteğin içeriğini loglayalım.
    console.log("--- IYZICO CALLBACK ALINDI ---");
    console.log("Request Body:", req.body);
    console.log("Request Query:", req.query);
    // --- DEBUG SONU ---

    // --- GÜNCELLENMİŞ KOD ---
    // Token ve conversationId'yi hem body'den hem de query'den almayı dene.
    // Iyzico'nun veriyi hangi yöntemle gönderdiğinden emin olmak için en güvenli yoldur.
    const token = req.body.token || req.query.token;
    const conversationId = req.body.conversationId || req.query.conversationId;
    
    // --- KONTROL ---
    if (!token || !conversationId) {
        console.warn("Iyzico callback'i 'token' veya 'conversationId' olmadan geldi.");
        return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=invalid_callback_parameters`);
    }

    try {
        iyzico.checkoutForm.retrieve({
            locale: Iyzipay.LOCALE.TR,
            conversationId: conversationId,
            token: token,
        }, async (err, result) => {
            if (err || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
                console.error(`Iyzico doğrulama hatası (conversationId: ${conversationId}):`, err || result.errorMessage);
                await prisma.transaction.update({
                    where: { id: conversationId },
                    data: { status: TransactionStatus.FAILED, description: err?.message || result?.errorMessage }
                }).catch(e => console.error("Başarısız işlem güncellenirken hata:", e));
                return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=${result.errorCode || 'verification_failed'}`);
            }

            const transactionId = conversationId;

            try {
                await prisma.$transaction(async (tx) => {
                    const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
                    if (!transaction) {
                        throw new Error(`İşlem bulunamadı: ${transactionId}`);
                    }
                    if (transaction.status !== TransactionStatus.PENDING) {
                        console.warn(`Bu işlem daha önce işlenmiş olabilir: ${transactionId}, Durum: ${transaction.status}`);
                        return;
                    }

                    const selectedPackage = coinPackages[transaction.relatedEntityId];
                    if (!selectedPackage) {
                        throw new Error(`Geçersiz paket ID'si: ${transaction.relatedEntityId}`);
                    }

                    await tx.transaction.update({
                        where: { id: transactionId },
                        data: {
                            status: TransactionStatus.COMPLETED,
                            platformTransactionId: result.paymentId,
                        },
                    });

                    const totalCoinsToAdd = BigInt(selectedPackage.coins) + BigInt(selectedPackage.bonusCoins || 0);
                    await tx.user.update({
                        where: { id: transaction.userId },
                        data: { coins: { increment: totalCoinsToAdd } },
                    });
                });

                console.log(`Iyzico ödemesi başarıyla tamamlandı. Transaction ID: ${transactionId}`);
                return res.redirect(`${process.env.CLIENT_URL}/payment/success`);

            } catch (dbError) {
                console.error(`Iyzico callback DB hatası (Transaction ID: ${transactionId}):`, dbError);
                return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=database_error`);
            }
        });
    } catch (error) {
        console.error("Iyzico callback genel hata:", error);
        return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=internal_error`);
    }
};


exports.handlePaymentWebhook = async (req, res) => {
    console.warn("handlePaymentWebhook endpoint'i çağrıldı ancak bu senaryoda kullanılmıyor.");
    return Response.ok(res, "Webhook alındı.");
};