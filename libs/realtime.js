const orders = require('./orders');

// Naive single server websocket implementation. Clients are ID'd by user ID.
const clients = {};

module.exports.initConnectionHandler = async function(request) {
    try {
        const userId = request.resourceURL.query.appUserId;
        const appId = request.resourceURL.query.appId;

        // add connection to pool
        const connection = request.accept(request.origin);
        clients[userId] = connection;

        // send conversartions to client
        const conversations = await orders.listConversations({ appId, userId });
        connection.sendUTF(JSON.stringify({ conversations }));

        // remove client from pool after closing
        connection.on('close', () => clients[userId] = undefined);
    } catch (error) {
        console.error('ERROR initConnectionHandler', error);
    }
};

module.exports.sendNewOrderToDevice = async function(userId, convo) {
    const client = clients[userId];
    if (client) return client.sendUTF(JSON.stringify({ conversations: [convo] }));
};
