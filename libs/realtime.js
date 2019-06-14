const orderLib = require('./orders');

// Naive single server websocket implementation. Clients are ID'd by user ID.
const clients = {};

module.exports.initConnectionHandler = db => async function(request) {
    try {
        const connection = request.accept(request.origin);
        const userId = request.resourceURL.query.userId;
        clients[userId] = connection;

        const orders = await orderLib.configure(db).listOrders(userId);
        connection.sendUTF(JSON.stringify({ orders }));

        connection.on('close', function(reasonCode, description) {
            clients[userId] = undefined;
        });
    } catch (error) {
        console.error('ERROR initConnectionHandler', error);
    }
};

module.exports.sendNewOrderToDevice = async function(order) {
    const client = clients[order.owner.userId];
    if (client) return client.sendUTF(JSON.stringify({ orders: [order] }));
};
