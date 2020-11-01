const { recognizeCommandFromMessageText, channelFormat, nowMs } = require('../utils/util');

const connectNewChannel = async (client, channel) => {
    const channelF = channelFormat(channel);

    if (client.channels.includes(channelF)) {
        console.log(nowMs, 'Ничего не делаю. Этот', channelF, 'канал уже подключён');
        return;
    }
    client.channels.push(channelF);

    try {
        await client.join(channelF);
        console.log(nowMs, 'Новый канал', channelF, 'подключён!');
    } catch (error) {
        client.log.error(error);
    }
};

const botRun = async (
    client,
    getAligulacPrediction,
    COMMAND_CHECK_FN,
    queue,
    doRequest,
    isQueueRunning
) => {
    await client.connect();
    console.log(`${nowMs()} twitch_chat_bot_aligulac START`);

    client.on('message', async (channel, tags, message, self) => {
        // console.log(`${nowMs()} ${message}`);
        // Ignore echoed messages.
        if (self || !message.startsWith('!')) {
            return;
        }
        const { command, args } = recognizeCommandFromMessageText(message);

        if (COMMAND_CHECK_FN.isAligulacPrediction(command)) {
            // aligulac
            const [player1Name = null, player2Name = null] = args;

            console.log(
                `${nowMs()} request received by @${tags.username}: ${player1Name} vs ${player2Name}`
            );
            if (player1Name === null || player2Name === null) {
                return;
            }

            queue.push({ name1: player1Name, name2: player2Name });

            const requestFn = async ({ name1, name2 }) => {
                console.log(`${nowMs()} request DOING by @${tags.username}: ${name1} vs ${name2}`);
                const predictionStr = await getAligulacPrediction(name1, name2);
                if (!predictionStr) {
                    return;
                }

                console.log(`${nowMs()} response TO by @${tags.username}: ${predictionStr}`);
                client.say(channel, `@${tags.username} ${predictionStr}`);
            };

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
            await connectNewChannel(newChannel);
        }
    });
};
module.exports = botRun;
