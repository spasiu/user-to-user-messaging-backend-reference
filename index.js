const http = require('http');
const express = require('express');
const websocket = require('websocket');
const bodyParser = require('body-parser');
const realtime = require('./libs/realtime');
const api = require('./libs/api');

const PORT = process.env.PORT || 8888;

const app = express();
const server = http.createServer(app);
const wsServer = new websocket.server({ httpServer: server });

app.post('/orders', bodyParser.json(), api.createNewOrderHandler);
wsServer.on('request', realtime.initConnectionHandler);

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
