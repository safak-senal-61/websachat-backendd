// src/controllers/stream/webrtc_controller.js
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();
const Response = require('../../utils/responseHandler');

const STREAM_STATUS = { LIVE: 'LIVE' };

const ICE_SERVERS = [
    { urls: process.env.STUN_URLS ? process.env.STUN_URLS.split(',') : ['stun:stun.l.google.com:19302'] },
];
if (process.env.TURN_URLS) {
    ICE_SERVERS.push({
        urls: process.env.TURN_URLS.split(','),
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_PASSWORD,
    });
}

exports.getIceServers = (req, res) => {
    return Response.ok(res, "ICE sunucu bilgileri alındı.", { iceServers: ICE_SERVERS });
};

// Bu HTTP endpoint'leri, asıl yönetimin WebSocket sunucusunda olduğu varsayılarak basitleştirilmiştir.
// Sadece bir loglama veya basit bir metrik güncellemesi için kullanılabilirler.
exports.viewerJoined = async (req, res) => {
    const { streamId } = req.params;
    try {
        // Yayının varlığını kontrol et.
        const stream = await prisma.stream.findUnique({ where: { id: streamId }, select: { id: true } });
        if (!stream) return Response.notFound(res, "Yayın bulunamadı.");
        
        console.log(`HTTP Log: User ${req.user.userId} requested to join stream ${streamId}`);
        return Response.ok(res, "Yayın izleme isteği alındı. Gerçek katılım WebSockets ile yönetilir.");
    } catch (error) {
        console.error("İzleyici katılma (HTTP) hatası:", error);
        return Response.internalServerError(res, "Bir hata oluştu.");
    }
};

exports.viewerLeft = async (req, res) => {
    const { streamId } = req.params;
     try {
        const stream = await prisma.stream.findUnique({ where: { id: streamId }, select: { id: true } });
        if (!stream) return Response.notFound(res, "Yayın bulunamadı.");

        console.log(`HTTP Log: User ${req.user.userId} requested to leave stream ${streamId}`);
        return Response.ok(res, "Yayından ayrılma isteği alındı. Gerçek ayrılma WebSockets ile yönetilir.");
    } catch (error) {
        console.error("İzleyici ayrılma (HTTP) hatası:", error);
        return Response.internalServerError(res, "Bir hata oluştu.");
    }
};
