// import { promises as fsp } from 'fs';
import {
    recognizeCommandFromMessageText,
    channelFormat,
    createQueueRequest,
} from '../utils/util.js';

const connectNewChannel = async (client, newChannel) => {
    const channelF = channelFormat(newChannel);

    if (client.channels.includes(channelF)) {
        console.log('Ничего не делаю. Этот', channelF, 'канал уже подключён');
        return;
    }
    client.channels.push(channelF);

    try {
        await client.join(channelF);
        // console.log('Новый канал', channelF, 'подключён!');
    } catch (error) {
        client.log.error(error);
    }
};

const createRequestFn = (client, _getAligulacPrediction) => async ({
    _channel,
    _username,
    name1,
    name2,
}) => {
    // console.log(`${_channel} @${_username} request DOING : ${name1} vs ${name2}`);
    console.log(`${_channel} — @${_username} — (${name1} vs ${name2}) — выполняется запрос`);
    try {
        const predictionStr = await _getAligulacPrediction(name1, name2);
        if (!predictionStr) {
            return;
        }

        // console.log(`${_channel} to @${_username} response: ${predictionStr}`);
        console.log(
            `${_channel} — @${_username} — (${name1} vs ${name2}) — ответ получен: ${predictionStr}`
        );
        client.say(_channel, `@${_username} ${predictionStr}`);
    } catch (error) {
        console.log(error);
    }
};

const botRun = async (
    client,
    getAligulacPrediction,
    COMMAND_CHECK_FN,
    botInfoMessage,
    INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT,
    db
) => {
    await client.connect();
    console.log(`twitch_chat_bot_aligulac бот запущен`);

    const { queue, doRequest, isQueueRunning } = createQueueRequest(
        INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT
    );
    const requestFn = createRequestFn(client, getAligulacPrediction);

    client.on('join', async (channel, username, self) => {
        if (!self) {
            // если присоединяюсь не я - выхожу
            return;
        }
        if (botInfoMessage.isShow) {
            const time = botInfoMessage.channelsLastMessageTime[channel];

            // if (time && typeof time !== 'number') {
            //     time = new Date(time).getTime();
            // }
            if (!time || Date.now() > time + botInfoMessage.intervalMs) {
                console.log(`${channel} — JOIN — Пишу о боте в чат`);
                client.say(channel, `${botInfoMessage.textMessage}`);

                // eslint-disable-next-line no-param-reassign
                botInfoMessage.channelsLastMessageTime[channel] = Date.now();
                await db.ops.findOneAndReplace(db.models.ChannelsBotLastMessage, channel);
            }
        }
    });

    client.on('message', async (channel, tags, message, self) => {
        // Ignore echoed messages.
        if (self) {
            return;
        }

        if (message.indexOf('!') === -1) {
            return;
        }
        const { command, args } = recognizeCommandFromMessageText(message);

        if (COMMAND_CHECK_FN.isAligulacPrediction(command)) {
            // aligulac
            const [player1Name = null, player2Name = null] = args;

            console.log(
                `${channel} — @${tags.username} — (${player1Name} vs ${player2Name}) — получена команда`
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
export default botRun;
