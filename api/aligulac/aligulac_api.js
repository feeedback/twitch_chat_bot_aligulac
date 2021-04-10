/* eslint-disable consistent-return */
import axios from 'axios';
import { getStringFromPredictionHtml, getStringFromInfoPlayerHtml } from './parse_dom.js';

const apiAligulac = {
  getIdByQueryName: (queryName) => `http://aligulac.com/search/json/?search_for=players&q=${queryName}`,
  getPredictionByIds: (id1, id2) => `http://aligulac.com/inference/match/?bo=1&ps=${id1}%2C${id2}`,
  // getPlayerInfoByIdAndName: (id, name) => `http://aligulac.com/players/${id}-${name}`,
  getPlayerInfoById: (id) => `http://aligulac.com/players/${id}`,
};

const getPlayerIdFromData = (data, queryPlayerName) => {
  try {
    const { players } = data;
    if (players.length === 0) {
      return null;
    }
    const exactMatch = players.find(({ tag }) => tag.toLowerCase() === queryPlayerName);
    if (exactMatch) {
      return exactMatch.id;
    }
    return players[0].id;
  } catch (error) {
    throw new Error(`ERROR: getPlayerIdFromData`);
  }
};

const getPlayerAligulacIdByName = async (playerName, getFromCacheNicknames) => {
  const playerId = await getFromCacheNicknames(
    playerName,
    async (name) => axios.get(apiAligulac.getIdByQueryName(name)),
    (responseJson, name) => getPlayerIdFromData(responseJson.data, name)
  );

  if (playerId === null) {
    console.log(`EXIT => Не найден игрок: "${playerId}"`);
    return null;
  }
  return playerId;
};

const getPredictionGameString = async (getFromCacheNickname, getFromCachePrediction, p1Name, p2Name) => {
  try {
    const p1Id = await getPlayerAligulacIdByName(p1Name, getFromCacheNickname);
    const p2Id = await getPlayerAligulacIdByName(p2Name, getFromCacheNickname);

    if (!p1Id || !p2Id) {
      return;
    }

    const str = await getFromCachePrediction(
      { id1: p1Id, id2: p2Id },
      async ({ id1, id2 }) => axios.get(apiAligulac.getPredictionByIds(id1, id2)),
      (responseHtml) => getStringFromPredictionHtml(responseHtml.data)
    );

    return str;
  } catch (error) {
    throw new Error(error);
  }
};

const getPlayerInfoString = async (getFromCacheNickname, getFromCachePlayerInfo, p1Name) => {
  try {
    const p1Id = await getPlayerAligulacIdByName(p1Name, getFromCacheNickname);
    if (p1Id) {
      return;
    }

    const str = await getFromCachePlayerInfo(
      p1Id,
      async (id1) => axios.get(apiAligulac.getPlayerInfoById(id1)),
      (responseHtml) => getStringFromInfoPlayerHtml(responseHtml.data)
    );

    return str;
  } catch (error) {
    throw new Error(error);
  }
};

export default { getPredictionGameString, getPlayerInfoString };
