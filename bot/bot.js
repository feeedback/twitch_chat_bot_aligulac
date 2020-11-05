// import { promises as fsp } from 'fs';
// import dayjs from 'dayjs';
import { recognizeCommandFromMessageText, channelFormat } from '../utils/util.js';
import settings from './settings.js';

const { INTERVAL_REQUEST_API_ALIGULAC, INTERVAL_RESPONSE_IN_CHAT } = settings;
// const nowMs = () => dayjs().format('HH:mm:ss,SSS');

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

const createRequestFnChat = (client) => async ({
    _channel,
    _username,
    name1,
    name2,
    predictionStr,
}) => {
    try {
        console.log(
            `${_channel} — @${_username} — (${name1} vs ${name2}) — ответ возвращён в чат: ${predictionStr}`
        );
        client.say(_channel, `@${_username} ${predictionStr}`);
    } catch (error) {
        console.log('createRequestFnChat error');
    }
};

const createRequestFnAligulac = (_getAligulacPrediction) => async ({
    _channel,
    _username,
    name1,
    name2,
}) => {
    console.log(
        `${_channel} — @${_username} — (${name1} vs ${name2}) — выполняется запрос к Алигулак`
    );
    try {
        const predictionStr = await _getAligulacPrediction(name1, name2);
        console.log(
            `${_channel} — @${_username} — (${name1} vs ${name2}) — ответ получен от Алигулак: ${predictionStr}`
        );
        return predictionStr;
    } catch (error) {
        // console.log(error);
        throw new Error(error);
    }
};
const queueAligulac = [];
const queueChat = [];
let isQueueRunningAligulac = false;
let isQueueRunningChat = false;

const doRequestChat = (requestFn) => {
    const firstRequest = queueChat.shift();

    if (!firstRequest) {
        isQueueRunningChat = false;
        return;
    }

    requestFn(firstRequest);
    setTimeout(doRequestChat, INTERVAL_RESPONSE_IN_CHAT, requestFn);
    isQueueRunningChat = true;
};
const doRequestAligulac = (requestFn, requestFnChat) => {
    const firstRequest = queueAligulac.shift();

    if (!firstRequest) {
        isQueueRunningAligulac = false;
        return;
    }

    requestFn(firstRequest).then((predictionStr) => {
        if (!predictionStr) {
            return;
        }
        queueChat.push({ ...firstRequest, predictionStr });
        if (!isQueueRunningChat) {
            doRequestChat(requestFnChat);
        }
    });
    setTimeout(doRequestAligulac, INTERVAL_REQUEST_API_ALIGULAC, requestFn);
    isQueueRunningAligulac = true;
};
const botRun = async (client, getAligulacPrediction, COMMAND_CHECK_FN, botInfoMessage, db) => {
    await client.connect();
    console.log(`twitch_chat_bot_aligulac бот запущен`);

    const requestFnChat = createRequestFnChat(client);
    const requestFnAligulac = createRequestFnAligulac(getAligulacPrediction);

    client.on('join', async (channel, username, self) => {
        if (!self) {
            // если присоединяюсь не я - выхожу
            return;
        }
        if (botInfoMessage.isShow) {
            const time = botInfoMessage.channelsLastMessageTime[channel];

            if (!time || Date.now() > new Date(time).getTime() + botInfoMessage.intervalMs) {
                console.log(`${channel} — JOIN — Пишу о боте в чат`);
                client.say(channel, `${botInfoMessage.textMessage}`);

                // eslint-disable-next-line no-param-reassign
                botInfoMessage.channelsLastMessageTime[channel] = new Date().toISOString();
                await db.ops.findOneAndUpdate(db.models.ChannelsBotLastMessage, channel);
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

            if (player1Name === null || player2Name === null) {
                return;
            }
            console.log(
                `${channel} — @${tags.username} — (${player1Name} vs ${player2Name}) — получена команда`
            );

            queueAligulac.push({
                _channel: channel,
                _username: tags.username,
                name1: player1Name,
                name2: player2Name,
            });

            if (!isQueueRunningAligulac) {
                doRequestAligulac(requestFnAligulac, requestFnChat);
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
