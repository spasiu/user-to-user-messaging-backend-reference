const orderLib = require('./orders');

// hardcode list of couriers
const availableCouriers = [{
    appId: '5ceff31f95046400102e935d',
    userId: 'ca6d3ab561cb9d821a7a582f'
}, {
    appId: '5ceff31f95046400102e935d',
    userId: '681bd813a45cb9a6cdc4ec95'
}];

module.exports.createNewOrderHandler = db => async function(req, res) {
    try {
        // randomly assign courier to order
        const randomIndex = Math.floor(Math.random() * availableCouriers.length);
        const courier = availableCouriers[randomIndex];
        const customer = req.body.customer;
        const order = await orderLib.configure(db).createOrder(customer, courier);
        res.status(200).json({ orders: [order] });
    } catch (error) {
        console.error('ERROR createNewOrderHandler', error);
        res.status(500).json({ error: error.message });
    }
};

// hypothesis: users created before an app is switched to multi-conversation can't use multi-convo
// experiment: create new users and test them
// outcome: new users are still 404

// hypothesis: conversation start must be called before a conversation can be created
// experiment: take previously not working user and call conversation start
// outcome: pre-existing users are still 404

// hypothesis: the userId is not suffecient and we must use the appUser ID
// experiment: use appUser ID
// outcome:
