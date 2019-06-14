const axios = require('axios');
const realtime = require('./realtime');

// Smooch auth token
const TOKEN = process.env.TOKEN || '';

module.exports.listConversations = listConversations;
module.exports.createOrder = createOrder;

/**
 * Get conversations from Smooch
 * @param {object} user - map containing `userId` and `appId` for customer or courier.
 * @return {string} the conversartions.
 */
async function listConversations({ appId, userId }) {
    const response = await axios(`https://api.smooch.io/v1.1/apps/${appId}/conversations?appUserId=${userId}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        method: 'get'
    });

    return response.data.conversations;
}

/**
 * Create customer and courier conversations and push new conversations to devices.
 * @param {object} customer - map containing `userId` and `appId` for customer.
 * @param {object} courier - map containing `userId` and `appId` for courier.
 * @return {object} the customer's conversation.
 */
async function createOrder(customer, courier) {
    // create conversations and attach metadata
    const courierConvoId = (await createConversation(courier))._id;

    const customerConvo = await createConversation(customer, {
        interlocutorAppUserId: courier.userId,
        interlocutorConvoId: courierConvoId,
        interlocutorAppId: courier.appId,
    });

    const courierConvo = await updateConversation(courier.appId, courierConvoId, {
        interlocutorAppUserId: customer.userId,
        interlocutorConvoId: customerConvo._id,
        interlocutorAppId: customer.appId,
    });

    // push new conversation to courier client
    realtime.sendNewOrderToDevice(courier.userId, courierConvo);

    // return new conversation to courier client
    return customerConvo;
};

/**
* Create a conversation on Smooch
* @param {object} user - map containing `userId` and `appId` for customer or courier.
* @param {object} metadata = Meatadata contsaining information about the interlocutor.
* @return {object} the new conversartion.
*/
async function createConversation({ appId, userId }, metadata) {
    const data = { participants: [{ appUserId: userId }] };
    if (metadata) data.metadata = metadata;

    const response = await axios(`https://api.smooch.io/v1.1/apps/${appId}/conversations`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        method: 'post',
        data
    });
    console.log('CREATE', JSON.stringify(response.data.conversation, null, 4));
    return response.data.conversation;
}

/**
 * Update metadata on a conversation on Smooch
 * @param {string} appId - ID for the app the conversation belongs to.
 * @param {string} convoId - ID of the conversation..
 * @param {object} metadata = Meatadata contsaining information about the interlocutor.
 * @return {object} the updated conversartion.
 */
async function updateConversation(appId, convoId, metadata={}) {
    const response = await axios(`https://api.smooch.io/v1.1/apps/${appId}/conversations/${convoId}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        method: 'put',
        data: { metadata }
    });
    console.log('UPDATE', JSON.stringify(response.data.conversation, null, 4));
    return response.data.conversation;
}
