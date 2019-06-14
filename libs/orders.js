const axios = require('axios');
const realtime = require('./realtime');

// Smooch auth token
const TOKEN = process.env.TOKEN || '';

/**
 * Apply auth and DB configuration to orders methods.
 * @param {object} db - MongoDB DB instance.
 * @return {object} a map containing the order `id` and customer and courier objects each with appended `convoId`.
 */

module.exports.appendUserInfoToOrder = appendUserInfoToOrder;
module.exports.configure = db => ({
    /**
     * Create customer and courier conversations, create an entry in the DB and push neew order to devices.
     * @param {object} customer - map containing `userId` and `appId` for customer.
     * @param {object} courier - map containing `userId` and `appId` for courier.
     * @return {object} a map containing the order `id` and customer and courier objects each with appended `convoId`.
     */
    createOrder: async function(customer, courier) {
        // create conversations
        const convoIds = await Promise.all([
            this.createConversation(customer),
            this.createConversation(courier)
        ]);

        const conversations = {
            customer: Object.assign(customer, {
                convoId: convoIds[0]
            }),
            courier: Object.assign(courier, {
                convoId: convoIds[1]
            })
        };

        // insert order into DB to serve to new clients as they come online
        const record = await db.collection('Orders').insertOne(conversations);
        const order = Object.assign(conversations, { id: record.insertedId });
        const orderForCustomer = appendUserInfoToOrder(customer.userId, order);
        const orderForCourier = appendUserInfoToOrder(courier.userId, order);

        // push update to courier client
        realtime.sendNewOrderToDevice(orderForCourier);

        return orderForCustomer;
    },

    /**
     * Create a conversation on Smooch
     * @param {object} user - map containing `userId` and `appId` for customer or courier.
     * @return {string} the new conversartion ID.
     */
    createConversation: async function({ appId, userId }) {
        console.log('createConversation', appId, userId, `https://api.smooch.io/v1.1/apps/${appId}/conversations`, { participants: [{ appUserId: userId }] });

        const response = await axios(`https://api.smooch.io/v1.1/apps/${appId}/conversations`, {
          method: 'post',
          data: { participants: [{ appUserId: userId }] },
          headers: { Authorization: `Bearer ${TOKEN}` }
        });

        return response.data.conversation._id;
    },

    /**
     * Get orders for user
     * @param {string} userId - the ID of the user you wish to retrieve orders for.
     * @return {array} an array of `order` records.
     */
    listOrders: async function(userId) {
        const orders = await db.collection('Orders').find({
            '$or': [{ 'courier.userId': userId }, { 'customer.userId': userId }]
        })
            .toArray()
            .map(order => appendUserInfoToOrder(userId, order));

        return orders;
    },

    /**
     * Get conversations from Smooch
     * @param {object} user - map containing `userId` and `appId` for customer or courier.
     * @return {string} the new conversartion ID.
     */
    listConversations: async function({ appId, userId }) {
        const response = await axios(`https://api.smooch.io/v1.1/apps/${appId}/conversations?appUserId=${userId}`, {
            method: 'get',
            headers: {
                Authorization: `Bearer ${TOKEN}`
            }
        });

        return response.data.conversations;
    }
});


/**
 * Append interlocutor and owner objects to order.
 * @param {string} userId - the ID of the owner.
 * @param {object} order - map containing customer and courier info and order ID.
 * @return {object} new order object with owner and interlocutor objects.
 */
function appendUserInfoToOrder (userId, order) {
    const isCustomer = order.customer.userId === userId;
    const interlocutor = isCustomer ? order.courier : order.customer;
    const owner = isCustomer ? order.customer : order.courier;
    return Object.assign(order, { interlocutor, owner });
}
