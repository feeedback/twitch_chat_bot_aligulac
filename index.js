import tmiJs from 'tmi.js';
import botSettings from './bot/settings.js';
import MemoryStore from './cache/memory_cache.js';
import * as db from './cache/db.js';
import initAligulac from './api/aligulac/aligulac_api.js';
import botRun from './bot/bot.js';

const { clientTmiSettings, COMMAND_CHECK_FN, cache, botInfoMessage } = botSettings;

const getCache = (cacheLength, ttlSec, Model, recordName) => async () => {
  const oldCache = await db.ops.findOne(Model, recordName);
  if (oldCache) {
    return new MemoryStore(cacheLength, ttlSec, oldCache.data);
  }
  return new MemoryStore(cacheLength, ttlSec);
};
const getCacheNickname = getCache(
  cache.nicknames.LENGTH,
  cache.nicknames.TTL_SEC,
  db.models.Nicknames,
  'nicknames'
);
const getCachePrediction = getCache(
  cache.predictions.LENGTH,
  cache.predictions.TTL_SEC,
  db.models.Predictions,
  'predictions'
);
const getCachePlayersInfo = getCache(
  cache.predictions.LENGTH,
  cache.predictions.TTL_SEC,
  db.models.PlayersInfo,
  'players_info'
);

const getFromDBChannelsLastMessageTime = async () => {
  const channelsLastMessageTime = {};
  const records = await db.ops.findAll(db.models.ChannelsBotLastMessage);

  for (const { name, time } of records) {
    channelsLastMessageTime[name] = time;
  }
  return channelsLastMessageTime;
};
const cronSaveCacheToDB = async (intervalMs, cacheNicknames, cachePredictions, cachePlayerInfo) => {
  await db.ops.findOneAndUpdateNoWait(db.models.Nicknames, 'nicknames', cacheNicknames.store);
  await db.ops.findOneAndUpdateNoWait(db.models.Predictions, 'predictions', cachePredictions.store);
  await db.ops.findOneAndUpdateNoWait(db.models.PlayersInfo, 'players_info', cachePlayerInfo.store);

  setTimeout(() => {
    cronSaveCacheToDB(intervalMs, cacheNicknames, cachePredictions, cachePlayerInfo);
  }, intervalMs);
};

(async () => {
  const cacheNickname = await getCacheNickname();
  const cachePrediction = await getCachePrediction();
  const cachePlayerInfo = await getCachePlayersInfo();

  cronSaveCacheToDB(cache.INTERVAL_SAVE_CACHE_TO_DB, cacheNickname, cachePrediction, cachePlayerInfo);

  const apiAligulac = initAligulac(cacheNickname, cachePrediction, cachePlayerInfo);

  const client = new tmiJs.Client(clientTmiSettings);

  botInfoMessage.channelsLastMessageTime = await getFromDBChannelsLastMessageTime();
  botRun(client, apiAligulac, COMMAND_CHECK_FN, botInfoMessage, db);
})();
