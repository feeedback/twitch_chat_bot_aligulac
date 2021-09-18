/* eslint-disable consistent-return */
import _axios from 'axios';
import { URL } from 'url';
// eslint-disable-next-line import/no-extraneous-dependencies
import SocksAgent from 'axios-socks5-agent';
import { getStringFromPredictionHtml, getStringFromInfoPlayerHtml } from './parse_dom.js';
// import { getPercentInt } from '../../utils/util.js';
// TEST
let axios = _axios.create({ timeout: 6000 });

if (process.env.NODE_ENV === 'development') {
  const getAgents = (port) => new SocksAgent({ agentOptions: { keepAlive: true }, port });
  const torAxios = (port) => _axios.create({ ...getAgents(port), timeout: 6000 });
  axios = torAxios(9050);
}

const aligulacBaseUrl = 'http://aligulac.com';
const aligulacAPI = {
  getIdByQueryName: (queryName) => {
    const url = new URL('/search/json/?search_for=players', aligulacBaseUrl);
    url.searchParams.set('q', queryName);

    return url;
  },
  getPredictionByIds: (id1, id2, bestOf = 1) => {
    // browser api  @deprecated
    const url = new URL('/inference/match/', aligulacBaseUrl);
    url.searchParams.set('bo', bestOf);
    url.searchParams.set('ps', [id1, id2]);

    return url;
  },
  // getPlayerInfoByIdAndName: (id, name) => `${this.baseURL}/players/${id}-${name}`, // browser api  @deprecated
  getPlayerInfoById: (id) => new URL(`/players/${id}`, aligulacBaseUrl), // browser api  @deprecated
  // getPlayerInfoByIdAPI: (id) => new URL(`/api/v1/player/${id}`, aligulacBaseUrl),
};

// (Cascade) SKillous [P] 19 y.o. | #29 World, #12 Non-KR, #1 RU | matches 1399 | earned $19k | form vP 57% vT 55% vZ 72%
// const parsePlayerData = {
//   birthday: ({ birthday }) => birthday,
//   country: ({ country }) => country,
//   nickname: ({ tag }) => tag,
//   // name: ({ name }) => name,
//   // romanized_name: ({ romanized_name: romanizedName }) => romanizedName,
//   race: ({ race }) => race,
//   totalEarnings: ({ total_earnings: earning }) => earning,
//   teamName: ({ current_teams: [team] }) => team.name,
//   form: ({
//     form: {
//       P: [vPW = 0, vPL = 0],
//       T: [vTW = 0, vTL = 0],
//       Z: [vZW = 0, vZL = 0],
//     },
//   }) => ({
//     // race: [winCount, loseCount] // EX:   P: [38, 23], T: [21, 20], Z: [28, 11], total: [87, 54]
//     vP: !vPW && !vPL ? null : getPercentInt(vPW, vPW + vPL),
//     vT: !vTW && !vTL ? null : getPercentInt(vTW, vTW + vTL),
//     vZ: !vZW && !vZL ? null : getPercentInt(vZW, vZW + vZL),
//   }),
//   ratingId: ({ current_rating: { id } }) => id,
//   // rank ?? top World => api rating/{ratingId} => position
//   // matches playing ???
// };

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
    async (name) => axios.get(aligulacAPI.getIdByQueryName(name).toString()),
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
      async ({ id1, id2 }) => axios.get(aligulacAPI.getPredictionByIds(id1, id2).toString()),
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
    if (!p1Id) {
      return;
    }

    const str = await getFromCachePlayerInfo(
      p1Id,
      async (id1) => axios.get(aligulacAPI.getPlayerInfoById(id1).toString()),
      (responseHtml) => getStringFromInfoPlayerHtml(responseHtml.data)
    );
    return str;
  } catch (error) {
    throw new Error(error);
  }
};

export default { getPredictionGameString, getPlayerInfoString };
