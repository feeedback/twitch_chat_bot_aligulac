/* eslint-disable guard-for-in */
/* eslint-disable import/order */
/* eslint-disable import/newline-after-import */
import { promises as fsp } from 'fs';
import { Client } from 'tmi.js';
// import path from 'path';
import botSettings from './bot/settings.js';
import MemoryStore from './cache/memoryCache.js';
import Aligulac from './api/aligulac_api.js';
import botRun from './bot/bot.js';

const {
    clientTmiSettings,
    COMMAND_CHECK_FN,
    INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT,
    MEMORY_CACHE_LENGTH,
    CACHE_TTL_SEC,
    botInfoMessage,
} = botSettings;

// const cacheForNicknames = new MemoryStore(MEMORY_CACHE_LENGTH, CACHE_TTL_SEC);
const cacheForPrediction = new MemoryStore(MEMORY_CACHE_LENGTH, CACHE_TTL_SEC);
const getAligulacPrediction = Aligulac(cacheForPrediction);
const client = new Client(clientTmiSettings);

const getFromFileChannelsLastMessageTime = async () => {
    const data = JSON.parse((await fsp.readFile(botInfoMessage.filePath, 'UTF-8')) || null);
    if (data) {
        for (const channel in data) {
            botInfoMessage.channelsLastMessageTime[channel] = data[channel];
        }
    }
};
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
