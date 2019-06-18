const orders = require('./orders');
const Redis = require('ioredis');

// Naive single server websocket implementation. Clients are ID'd by user ID.
const clients = {};

const redis = new Redis(process.env.REDIS_URL);

module.exports.initConnectionHandler = async function(request) {
    try {
        const userId = request.resourceURL.query.userId;
        const appId = request.resourceURL.query.appId;
        
        await redis.set(`courier:${userId}`, JSON.stringify({ userId, appId }));

        // add connection to pool
        const connection = request.accept(request.origin);
        clients[userId] = connection;

        // send conversartions to client
        const conversations = await orders.listConversations({ appId, userId });
        connection.sendUTF(JSON.stringify({ conversations }));

        // remove client from pool after closing
        connection.on('close', () => {
            redis.del(`courier:${userId}`);
            clients[userId] = undefined;
        });
    } catch (error) {
        console.error('ERROR initConnectionHandler', error);
    }
};

module.exports.sendNewOrderToDevice = async function(userId, convo) {
    const client = clients[userId];
    if (client) return client.sendUTF(JSON.stringify({ conversations: [convo] }));
};
