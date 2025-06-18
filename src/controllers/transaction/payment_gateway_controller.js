// src/controllers/transaction/payment_gateway_controller.js
const { PrismaClient, TransactionType, TransactionStatus } = require('../../generated/prisma'); // Currency buradan kaldırıldı
const prisma = new PrismaClient();
const Response = require('../../utils/responseHandler');
const iyzico = require('../../services/iyzico_service');
const Iyzipay = require('iyzipay');

// HATA DÜZELTME: Currency sabiti manuel olarak burada tanımlanmalı ve 'TRY' eklenmeli.
const Currency = {
    USD: 'USD',
    TRY: 'TRY',
    DIAMOND: 'DIAMOND',
    COIN: 'COIN'
};

// Örnek Jeton Paketleri (Normalde veritabanından gelmeli)
const coinPackages = {
    'PKG100': { id: 'PKG100', name: '100 Jeton Paketi', price: '10.00', coins: 100 },
    'PKG500': { id: 'PKG500', name: '500 Jeton Paketi', price: '45.00', coins: 500 },
    'PKG1000': { id: 'PKG1000', name: '1000 Jeton Paketi', price: '80.00', coins: 1000 },
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

        // 1. Ödeme başlamadan önce "PENDING" durumunda bir işlem kaydı oluştur.
        const pendingTransaction = await prisma.transaction.create({
            data: {
                userId,
                transactionType: TransactionType.COIN_PURCHASE,
                amount: parseFloat(selectedPackage.price),
                currency: Currency.TRY, // Düzeltme sonrası burası artık hata vermeyecek.
                relatedEntityId: coinPackageId,
                relatedEntityType: 'COIN_PACKAGE',
                status: TransactionStatus.PENDING,
                platform: 'IYZICO',
            }
        });

        // 2. Iyzico'ya gönderilecek isteği hazırla.
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
                country: user.country || 'Turkey',
                address: 'N/A',
                zipCode: '34000',
            },
            billingAddress: {
                contactName: user.nickname || user.username,
                city: 'N/A',
                country: user.country || 'Turkey',
                address: 'N/A',
                zipCode: '34000',
            },
            basketItems: [
                {
                    id: selectedPackage.id,
                    name: selectedPackage.name,
                    category1: 'Digital Goods',
                    itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                    price: selectedPackage.price,
                }
            ]
        };

        // 3. Iyzico'dan ödeme formunu al.
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
    const { token, conversationId } = req.body;
    if (!token) {
        console.warn("Iyzico callback'i token olmadan geldi.");
        return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=invalid_callback`);
    }

    try {
        iyzico.checkoutForm.retrieve({
            locale: Iyzipay.LOCALE.TR,
            conversationId: conversationId,
            token: token,
        }, async (err, result) => {
            if (err || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
                console.error("Iyzico ödeme sonucu doğrulama hatası:", err || result.errorMessage);
                await prisma.transaction.update({
                    where: { id: conversationId },
                    data: { status: TransactionStatus.FAILED, description: err?.message || result?.errorMessage }
                }).catch(e => console.error("Başarısız işlem güncellenirken hata:", e));
                return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=${result.errorCode || 'verification_failed'}`);
            }

            const transactionId = result.basketId;
            const purchasedItem = result.basketItems[0];
            const selectedPackage = coinPackages[purchasedItem.id];

            if (!selectedPackage) {
                console.error(`Callback'te geçersiz paket ID'si geldi: ${purchasedItem.id}`);
                return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=invalid_package`);
            }

            try {
                await prisma.$transaction(async (tx) => {
                    const transaction = await tx.transaction.findUnique({where: {id: transactionId}});
                    if(transaction.status === TransactionStatus.COMPLETED) {
                         console.warn(`Bu işlem zaten tamamlanmış: ${transactionId}`);
                         return;
                    }
                
                    await tx.transaction.update({
                        where: { id: transactionId },
                        data: {
                            status: TransactionStatus.COMPLETED,
                            platformTransactionId: result.paymentId,
                        },
                    });

                    await tx.user.update({
                        where: { id: transaction.userId },
                        data: { coins: { increment: BigInt(selectedPackage.coins) } },
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

/**
 * Stripe gibi diğer sağlayıcılar için webhook. Şimdilik boş bırakıldı.
 */
exports.handlePaymentWebhook = async (req, res) => {
    console.warn("handlePaymentWebhook endpoint'i çağrıldı ancak bu senaryoda kullanılmıyor.");
    return Response.ok(res, "Webhook alındı.");
};