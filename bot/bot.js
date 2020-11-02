const {
    recognizeCommandFromMessageText,
    channelFormat,
    createQueueRequest,
} = require('../utils/util');

const connectNewChannel = async (client, newChannel) => {
    const channelF = channelFormat(newChannel);

    if (client.channels.includes(channelF)) {
        console.log('Ничего не делаю. Этот', channelF, 'канал уже подключён');
        return;
    }
    client.channels.push(channelF);

    try {
        await client.join(channelF);
        console.log('Новый канал', channelF, 'подключён!');
    } catch (error) {
        client.log.error(error);
    }
};

const createRequestFn = (clientSay, _getAligulacPrediction) => async ({
    _channel,
    _username,
    name1,
    name2,
}) => {
    console.log(`${_channel} @${_username} request DOING : ${name1} vs ${name2}`);
    const predictionStr = await _getAligulacPrediction(name1, name2);
    if (!predictionStr) {
        return;
    }

    console.log(`${_channel} to @${_username} response: ${predictionStr}`);
    clientSay(_channel, `@${_username} ${predictionStr}`);
};

const botRun = async (
    client,
    getAligulacPrediction,
    COMMAND_CHECK_FN,
    isAdsBotWhenJoinChannel,
    AdsBotMessage,
    INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT
) => {
    await client.connect();
    console.log(`twitch_chat_bot_aligulac START`);

    const { queue, doRequest, isQueueRunning } = createQueueRequest(
        INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT
    );
    const requestFn = createRequestFn(client.say, getAligulacPrediction);

    client.on('join', async (channel, username, self) => {
        if (!self) {
            return;
        }
        if (isAdsBotWhenJoinChannel) {
            console.log(`JOIN #${channel}. Пишу о боте в чат`);
            client.say(channel, `${AdsBotMessage}`);
        }
    });

    client.on('message', async (channel, tags, message, self) => {
        // console.log(`${message}`);
        // Ignore echoed messages.
        if (self || !message.startsWith('!')) {
            return;
        }
        const { command, args } = recognizeCommandFromMessageText(message);

        if (COMMAND_CHECK_FN.isAligulacPrediction(command)) {
            // aligulac
            const [player1Name = null, player2Name = null] = args;

            console.log(
                `${channel} by @${tags.username} request received: ${player1Name} vs ${player2Name}`
            );
            if (player1Name === null || player2Name === null) {
                return;
            }

            queue.push({
                _channel: channel,
                _username: tags.username,
                name1: player1Name,
                name2: player2Name,
            });
            if (!isQueueRunning) {
                doRequest(requestFn);
            }
            return;
        }
        if (COMMAND_CHECK_FN.isAddChannelToBot(command, tags.username)) {
            const [newChannel = null] = args;
            if (newChannel === null) {
                return;
            }
            await connectNewChannel(client, newChannel);
        }
    });
};
module.exports = botRun;
