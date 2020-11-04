/* eslint-disable guard-for-in */
// import { promises as fsp } from 'fs';
import tmiJs from 'tmi.js';
// import path from 'path';
import botSettings from './bot/settings.js';
import MemoryStore from './cache/memoryCache.js';
import db from './cache/db.js';
import Aligulac from './api/aligulac_api.js';
import botRun from './bot/bot.js';

const {
    clientTmiSettings,
    COMMAND_CHECK_FN,
    INTERVAL_SAVE_CACHE_TO_DB,
    INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT,
    CACHE_LENGTH_NICKNAMES,
    CACHE_LENGTH_PREDICTIONS,
    CACHE_TTL_SEC_NICKNAMES,
    CACHE_TTL_SEC_PREDICTIONS,
    botInfoMessage,
} = botSettings;

const getCache = (cacheLength, ttlSec, Model, recordName) => async () => {
    const oldCache = await db.ops.findOne(Model, recordName);
    console.log('oldCache :>> ', oldCache);
    if (oldCache) {
        return new MemoryStore(cacheLength, ttlSec, oldCache.data);
    }
    return new MemoryStore(cacheLength, ttlSec);
};
const getCacheNicknames = getCache(
    CACHE_LENGTH_NICKNAMES,
    CACHE_TTL_SEC_NICKNAMES,
    db.models.Nicknames,
    'nicknames'
);
const getCachePredictions = getCache(
    CACHE_LENGTH_PREDICTIONS,
    CACHE_TTL_SEC_PREDICTIONS,
    db.models.Predictions,
    'predictions'
);

const getFromDBChannelsLastMessageTime = async () => {
    const channelsLastMessageTime = {};
    const records = await db.ops.findAll(db.models.ChannelsBotLastMessage);
    console.log('channelsLastMessageTime :>> ', records);
    // const data = JSON.parse((await fsp.readFile(botInfoMessage.filePath, 'UTF-8')) || null);

    for (const { name, time } of records) {
        channelsLastMessageTime[name] = time;
    }
    return channelsLastMessageTime;
};
const cronSaveCacheToDB = async (intervalMs, cacheNicknames, cachePredictions) => {
    await db.ops.findOneAndUpdate2(db.models.Nicknames, 'nicknames', cacheNicknames.store);
    await db.ops.findOneAndUpdate2(db.models.Predictions, 'predictions', cachePredictions.store);

    setTimeout(() => {
        cronSaveCacheToDB(intervalMs, cacheNicknames, cachePredictions);
    }, intervalMs);
};

(async () => {
    const cacheNicknames = await getCacheNicknames();
    const cachePredictions = await getCachePredictions();

    cronSaveCacheToDB(INTERVAL_SAVE_CACHE_TO_DB, cacheNicknames, cachePredictions);

    const getAligulacPrediction = Aligulac(cacheNicknames, cachePredictions);

    const client = new tmiJs.Client(clientTmiSettings);

    botInfoMessage.channelsLastMessageTime = await getFromDBChannelsLastMessageTime();
    botRun(
        client,
        getAligulacPrediction,
        COMMAND_CHECK_FN,
        botInfoMessage,
        INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT,
        db,
        cronSaveCacheToDB
    );
})();
