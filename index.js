/* eslint-disable guard-for-in */
/* eslint-disable import/order */
/* eslint-disable import/newline-after-import */
const { promises: fsp } = require('fs');
// const path = require('path');
const {
    clientTmiSettings,
    COMMAND_CHECK_FN,
    INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT,
    MEMORY_CACHE_LENGTH,
    TTL_SEC,
    botInfoMessage,
} = require('./bot/settings');

const MemoryStore = require('./cache/memoryCache');
const cache = new MemoryStore(MEMORY_CACHE_LENGTH, TTL_SEC);

const Aligulac = require('./api/aligulac_api');
const getAligulacPrediction = Aligulac(cache);

const tmi = require('tmi.js');
const client = new tmi.Client(clientTmiSettings);

const getFromFileChannelsLastMessageTime = async () => {
    const data = JSON.parse((await fsp.readFile(botInfoMessage.filePath, 'UTF-8')) || null);
    if (data) {
        for (const channel in data) {
            botInfoMessage.channelsLastMessageTime[channel] = data[channel];
        }
    }
};

const botRun = require('./bot/bot');
(async () => {
    await getFromFileChannelsLastMessageTime();
    botRun(
        client,
        getAligulacPrediction,
        COMMAND_CHECK_FN,
        botInfoMessage,
        INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT
    );
})();
