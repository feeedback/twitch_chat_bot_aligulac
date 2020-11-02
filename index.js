/* eslint-disable import/order */
/* eslint-disable import/newline-after-import */
const {
    clientTmiSettings,
    COMMAND_CHECK_FN,
    INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT,
    MEMORY_CACHE_LENGTH,
    isAdsBotWhenJoinChannel,
    AdsBotMessage,
} = require('./bot/settings');

const MemoryStore = require('./cache/memoryCache');
const cache = new MemoryStore(MEMORY_CACHE_LENGTH);

const Aligulac = require('./api/aligulac_api');
const getAligulacPrediction = Aligulac(cache);

const tmi = require('tmi.js');
const client = new tmi.Client(clientTmiSettings);

const botRun = require('./bot/bot');
botRun(
    client,
    getAligulacPrediction,
    COMMAND_CHECK_FN,
    isAdsBotWhenJoinChannel,
    AdsBotMessage,
    INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT
);
