const orders = require('./orders');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

module.exports.createNewOrderHandler = async function(req, res) {
    try {
        const customer = req.body.customer;

        // randomly assign another user to order
        const redisResponse = await redis.scan(0, 'match', 'courier:*');
        const courierKeys = redisResponse[1].filter(key => key !== `courier:${customer.userId}`);
        const randomIndex = Math.floor(Math.random() * courierKeys.length);
        const key = courierKeys[randomIndex];
        const result = await redis.get(key);
        const courier = JSON.parse(result);

        // respond with new conversation
        const convo = await orders.createOrder(customer, courier);
        res.status(200).json({ conversation: convo });
    } catch (error) {
        console.error('ERROR createNewOrderHandler', error);
        res.status(500).json({ error: error.message });
    }
};
