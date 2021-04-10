import { formatName, isGoodFormatPlayerName } from '../utils/util.js';
import aligulacAPI from '../api/aligulac/aligulac_api.js';

const getFromCache = (cache, twoKey = false) => async (key, requestFn, getDataFn) => {
  const keyToCache = typeof key !== 'string' ? JSON.stringify(key) : key;
  const itemValue = cache.smartGetItem(keyToCache); // check, check ttl, renew, return
  if (itemValue) {
    return itemValue;
  }
  if (twoKey) {
    // Если в кэше есть результат с другим порядком игроков - отдаём его
    const swapArgumentsKey = JSON.stringify({ id1: key.id2, id2: key.id1 });
    const itemValueSwap = cache.smartGetItem(swapArgumentsKey);
    if (itemValueSwap) {
      return itemValueSwap;
    }
  }

  try {
    const response = await requestFn(key);
    if (!response || response.status !== 200) {
      console.log('Aligulac server error');
      return 'Aligulac server error';
    }
    const ItemValue = await getDataFn(response, key);
    cache.setItem(keyToCache, ItemValue);
    return ItemValue;
  } catch (error) {
    const errorMsg = `ERROR: Aligulac server: ${error?.response?.status} ${error?.response?.statusText}`;
    throw new Error(errorMsg);
  }
};

const requestPrediction = (getFromCacheNickname, getFromCachePrediction) => async (p1Name, p2Name) => {
  const name1F = formatName(p1Name);
  const name2F = formatName(p2Name);
  if (name1F === name2F) {
    console.log(`EXIT => Имена игроков совпадают`);
    return null;
  }
  if (isGoodFormatPlayerName(name1F) === null || isGoodFormatPlayerName(name2F) === null) {
    console.log(`EXIT => Имя игрока не соответствует требованию`);
    return null;
  }
  try {
    const resultStr = await aligulacAPI.getPredictionGameString(
      getFromCacheNickname,
      getFromCachePrediction,
      name1F,
      name2F
    );
    return resultStr;
  } catch (error) {
    throw new Error(error);
  }
};

const requestPlayerInfo = (getFromCacheNickname, getFromCachePlayerInfo) => async (p1Name) => {
  const name1F = formatName(p1Name);
  if (isGoodFormatPlayerName(name1F) === null) {
    console.log(`EXIT => Имя игрока не соответствует требованию`);
    return null;
  }
  try {
    const resultStr = await aligulacAPI.getPlayerInfoString(
      getFromCacheNickname,
      getFromCachePlayerInfo,
      name1F
    );
    return resultStr;
  } catch (error) {
    throw new Error(error);
  }
};

export default (_cacheNickname, _cachePrediction, _cachePlayerInfo) => {
  const getFromCacheNickname = getFromCache(_cacheNickname);
  const getFromCachePrediction = getFromCache(_cachePrediction, true);
  const getFromCachePlayerInfo = getFromCache(_cachePlayerInfo);

  return {
    requestPlayerInfo: requestPlayerInfo(getFromCacheNickname, getFromCachePlayerInfo),
    requestPrediction: requestPrediction(getFromCacheNickname, getFromCachePrediction),
  };
};
