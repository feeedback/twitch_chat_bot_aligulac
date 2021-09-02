// import { promises as fsp } from 'fs';
import { recognizeCommandFromMessageText, channelFormat } from '../utils/util.js';
import settings from './settings.js';

const { INTERVAL_REQUEST_API_ALIGULAC, INTERVAL_RESPONSE_IN_CHAT } = settings;

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

const leaveFromChannel = async (client, channel) => {
  const channelF = channelFormat(channel);

  if (!client.channels.includes(channelF)) {
    console.log('Ничего не делаю. К этому', channelF, 'каналу итак НЕ подключён');
    return;
  }
  // eslint-disable-next-line no-param-reassign
  client.channels = client.channels.filter((ch) => ch !== channelF);

  try {
    await client.part(channelF);
    console.log('Ушли с канала', channelF, '!');
  } catch (error) {
    client.log.error(error);
  }
};

const createRequestFnChat = (client) => async ({ channel, username, name1, name2 = null, resStr }) => {
  try {
    const interval = Math.round(INTERVAL_RESPONSE_IN_CHAT / 1000);

    let logStr = `${channel} — @${username} — (${name1} vs ${name2}) — |1 per ${interval}s| ответ возвращён в чат`;
    if (name2 === null) {
      logStr = `${channel} — @${username} — "${name1}" — |1 per ${interval}s| ответ возвращён в чат`;
    }

    console.log(logStr);
    client.say(channel, `@${username} ${resStr}`);
  } catch (error) {
    console.log('createRequestFnChat error');
  }
};

const createRequestFnAligulacPrediction = (_getAligulacPrediction) => async ({
  channel,
  username,
  name1,
  name2,
}) => {
  console.log(
    `${channel} — @${username} — (${name1} vs ${name2}) — |1 per ${Math.round(
      INTERVAL_REQUEST_API_ALIGULAC / 1000
    )}s| выполняется запрос к Алигулак`
  );
  try {
    const predictionStr = await _getAligulacPrediction(name1, name2);
    console.log(
      `${channel} — @${username} — (${name1} vs ${name2}) — ответ получен от Алигулак: ${predictionStr}`
    );
    return predictionStr;
  } catch (error) {
    throw new Error(error);
  }
};
const createRequestFnAligulacPlayer = (_getAligulacPlayer) => async ({ channel, username, name1 }) => {
  console.log(
    `${channel} — @${username} — "${name1}" — |1 per ${Math.round(
      INTERVAL_REQUEST_API_ALIGULAC / 1000
    )}s| выполняется запрос к Алигулак`
  );
  try {
    const playerInfoStr = await _getAligulacPlayer(name1);
    console.log(`${channel} — @${username} — "${name1}" — ответ получен от Алигулак: ${playerInfoStr}`);
    return playerInfoStr;
  } catch (error) {
    throw new Error(error);
  }
};

const queueAligulac = [];
const queueChat = {};
let isQueueRunningAligulac = false;
const isQueueRunningChat = {};

const doRequestChat = (channel, requestFn) => {
  const firstRequest = queueChat[channel].shift();
  if (!firstRequest) {
    isQueueRunningChat[channel] = false;
    return;
  }

  requestFn(firstRequest);
  setTimeout(doRequestChat, INTERVAL_RESPONSE_IN_CHAT, channel, requestFn);
  isQueueRunningChat[channel] = true;
};
const doRequestAligulac = (requestFnPrediction, requestFnPlayer, requestFnChat) => {
  const firstRequest = queueAligulac.shift();

  if (!firstRequest) {
    isQueueRunningAligulac = false;
    return;
  }

  const { channel, name2 = null } = firstRequest;

  let requestAligulac = requestFnPrediction;
  if (name2 === null) {
    requestAligulac = requestFnPlayer;
  }
  requestAligulac(firstRequest)
    .then((resStr) => {
      if (!resStr) {
        return;
      }
      if (!Array.isArray(queueChat[channel])) {
        queueChat[channel] = [];
      }
      queueChat[channel].push({ ...firstRequest, resStr });
      if (isQueueRunningChat[channel] !== true) {
        doRequestChat(channel, requestFnChat);
      }
    })
    .catch(() => {});

  setTimeout(
    doRequestAligulac,
    INTERVAL_REQUEST_API_ALIGULAC,
    requestFnPrediction,
    requestFnPlayer,
    requestFnChat
  );
  isQueueRunningAligulac = true;
};

const botRun = async (client, apiAligulac, COMMAND_CHECK_FN, botInfoMessage, db) => {
  await client.connect();
  console.log(`Бот запущен`);

  const requestFnChat = createRequestFnChat(client);
  const requestFnAligulacPrediction = createRequestFnAligulacPrediction(apiAligulac.requestPrediction);
  const requestFnAligulacPlayer = createRequestFnAligulacPlayer(apiAligulac.requestPlayerInfo);

  client.on('join', async (channel, username, self) => {
    if (!self) {
      // если присоединяюсь не я - выхожу
      return;
    }
    if (botInfoMessage.isShow) {
      const time = botInfoMessage.channelsLastMessageTime[channel];

      if (!time || Date.now() > new Date(time).getTime() + botInfoMessage.intervalMs) {
        // eslint-disable-next-line no-param-reassign
        botInfoMessage.channelsLastMessageTime[channel] = new Date().toISOString();
        console.log(`${channel} — JOIN — Пишу о боте в чат`);
        try {
          client.say(channel, `${botInfoMessage.textMessage}`);
        } catch (error) {
          console.log(`${channel} — Не вышло написать о боте — ${error}`);
        }

        await db.ops.findOneAndUpdate(db.models.ChannelsBotLastMessage, channel);
      }
    }
  });

  client.on('message', async (channel, tags, message, self) => {
    // Ignore echoed messages.
    if (self || tags.username === client.opts.identity.username) {
      return;
    }

    if (message.indexOf('!') === -1) {
      return;
    }
    const { command, args } = recognizeCommandFromMessageText(message);

    if (COMMAND_CHECK_FN.isAligulacPrediction(command)) {
      // aligulac
      const [player1Name = null, player2Name = null] = args;

      if (player1Name !== null) {
        let logStr = `${channel} — @${tags.username} — "${player1Name}" — получена команда`;
        if (player2Name !== null) {
          logStr = `${channel} — @${tags.username} — (${player1Name} vs ${player2Name}) — получена команда`;
        }
        console.log(logStr);

        queueAligulac.push({
          channel,
          username: tags.username,
          name1: player1Name,
          name2: player2Name,
        });
        if (!isQueueRunningAligulac) {
          doRequestAligulac(requestFnAligulacPrediction, requestFnAligulacPlayer, requestFnChat);
        }
        return;
      }
      return;
    }

    if (COMMAND_CHECK_FN.isAddChannelToBot(command, tags.username)) {
      const [newChannel = null] = args;
      if (newChannel === null) {
        return;
      }
      await connectNewChannel(client, newChannel);
      return;
    }

    if (COMMAND_CHECK_FN.isRemoveChannelFromBot(command, tags.username)) {
      const [channelToRemove = null] = args;
      if (channelToRemove === null) {
        return;
      }
      await leaveFromChannel(client, channelToRemove);
    }
  });
};
export default botRun;
