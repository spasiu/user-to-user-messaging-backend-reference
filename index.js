const http = require('http');
const mongodb = require('mongodb');
const express = require('express');
const websocket = require('websocket');
const bodyParser = require('body-parser');
const realtime = require('./libs/realtime');
const api = require('./libs/api');

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/local';
const PORT = process.env.PORT || 8888;

mongodb.MongoClient.connect(DATABASE_URL, (error, client) => {
    if (error) throw error;

    const db = client.db('order-backend');
    const app = express();
    const server = http.createServer(app);
    const wsServer = new websocket.server({ httpServer: server });
    wsServer.on('request', realtime.initConnectionHandler(db));
    app.use(bodyParser.json());
    app.post('/orders', api.createNewOrderHandler(db));
    server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
});
