const orders = require('./orders');

// hardcode list of couriers
const availableCouriers = [{
    appId: '5ceff31f95046400102e935d',
    userId: 'ca6d3ab561cb9d821a7a582f'
}, {
    appId: '5ceff31f95046400102e935d',
    userId: '681bd813a45cb9a6cdc4ec95'
}];

module.exports.createNewOrderHandler = async function(req, res) {
    try {
        const customer = req.body.customer;

        // randomly assign courier to order
        const randomIndex = Math.floor(Math.random() * availableCouriers.length);
        const courier = availableCouriers[randomIndex];

        // respond with new conversation
        const convo = await orders.createOrder(customer, courier);
        res.status(200).json({ conversations: [convo] });
    } catch (error) {
        console.error('ERROR createNewOrderHandler', error);
        res.status(500).json({ error: error.message });
    }
};
