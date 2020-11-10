/* eslint-disable consistent-return */
import axios from 'axios';
import jsdom from 'jsdom';
import dayjs from 'dayjs';
import isoCountries from '../utils/county_code.js';

const getDOMDocument = (data) => new jsdom.JSDOM(data).window.document;

const apiAligulac = {
  getIdByQueryName: (queryName) => `http://aligulac.com/search/json/?search_for=players&q=${queryName}`,
  getPredictionByIds: (id1, id2) => `http://aligulac.com/inference/match/?bo=1&ps=${id1}%2C${id2}`,
  // getPlayerInfoByIdAndName: (id, name) => `http://aligulac.com/players/${id}-${name}`,
  getPlayerInfoById: (id) => `http://aligulac.com/players/${id}`,
};

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
      // console.log('Есть зеркальный запрос в кеше :');
      // console.log('keyToCache', keyToCache);
      // console.log('swapArgumentsKey', swapArgumentsKey);
      return itemValueSwap;
    }
  }

  try {
    const response = await requestFn(key);
    if (!response || response.status !== 200) {
      console.log('Aligulac server error');
    }
    const ItemValue = await getDataFn(response, key);
    cache.setItem(keyToCache, ItemValue);
    return ItemValue;
  } catch (error) {
    const errorMsg = `ERROR: Aligulac server: ${error?.response?.status} ${error?.response?.statusText}`;
    throw new Error(errorMsg);
  }
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

const getRowText = (row) => {
  const td = row.querySelector('td.text-center');
  return td ? td.textContent.trim() : null;
};
const getLeftTrPart = (el) => el.firstElementChild.textContent.trim();
const getText = (td) => td.textContent.trim();
const getRightTrPart = (el) => el.lastElementChild.textContent.trim();
const getOnlyIntPercent = (percent) => `${Math.round(Number(percent.slice(0, -1), 10))}%`;
const formatName = (name) => {
  const nameF = String(name).trim();

  return nameF;
};

const isGoodFormatName = (name) => {
  const regexpPattern = /[^\w-]/g;

  if (regexpPattern.test(name)) {
    console.log(`INFO: В имени игрока не должно быть символов кроме англ. букв, цифр, -, _: "${name}"`);
    return null;
  }
  if (name.length < 2) {
    console.log(`INFO: Длина имени игрока должна быть 2 и более символов: "${name}"`);
    return null;
  }
  return true;
};

const getStringFromPredictionHtml = (document) => {
  const getRowFormOpRace = (table) =>
    [...table.rows].find((row) => getRowText(row) === 'Form vs. opposing race');
  const getRowScoreEachOther = (table) =>
    [...table.rows].find((row) => getRowText(row) === 'Score vs. each other');

  const table = document.querySelector('table.table-striped');

  const p1Name = getLeftTrPart(table.rows[0]).split(' ')[1];
  const p2Name = getRightTrPart(table.rows[0]).split(' ')[0];

  const p1Win = getOnlyIntPercent(getLeftTrPart(table.rows[2]));
  const p2Win = getOnlyIntPercent(getRightTrPart(table.rows[2]));

  const getFormOpRace = () => {
    const rowFormOpRace = getRowFormOpRace(table);
    if (rowFormOpRace) {
      const p1FormOpRace = getOnlyIntPercent(getLeftTrPart(rowFormOpRace).split(/[()]/)[1]);
      const p2FormOpRace = getOnlyIntPercent(getRightTrPart(rowFormOpRace).split(/[()]/)[1]);
      const strFormOpRace = ` | ${p1FormOpRace} form vs opp. race ${p2FormOpRace}`;
      return strFormOpRace;
    }
    return '';
  };

  const getEachOtherHistory = () => {
    const rowEachOtherHistory = getRowScoreEachOther(table);
    if (rowEachOtherHistory) {
      const p1EachOtherHistory = getOnlyIntPercent(getLeftTrPart(rowEachOtherHistory).split(/[()]/)[1]);
      const p2EachOtherHistory = getOnlyIntPercent(getRightTrPart(rowEachOtherHistory).split(/[()]/)[1]);
      const EachOtherHistory = ` | ${p1EachOtherHistory} history vs each other ${p2EachOtherHistory}`;
      return EachOtherHistory;
    }
    return '';
  };

  const str = `${p1Name} ${p1Win} vs ${p2Win} ${p2Name}${getFormOpRace()}${getEachOtherHistory()}`;
  return str;
};

const getStringFromInfoPlayerHtml = (document) => {
  // (Cascade) SKillous [P] 19 y.o. | #29 World, #12 Non-KR, #1 RU | matches 1399 | earned $19k | form vP 57% vT 55% vZ 72%

  const tableBio = [...document.querySelectorAll('table')].find((tableEl) =>
    tableEl.querySelector('th.ibox-header')
  );

  const name = getText(tableBio.rows[0]);
  const inactive = document.querySelector('.pull-left ~ * strong');

  const trNames = {
    Race: (str) => str[0],
    'Last match': (str) => str,
    Rank: (str) => {
      const ranks = str
        .replace(/\n/g, '')
        .replace(/\s{2,}/g, ',')
        .split(',');

      return ranks
        .map((areaStr) => {
          const [sign, ...areaArr] = areaStr.split(' ');
          const area = areaArr.join(' ');
          if (area === 'Non-Korean') {
            return `${sign} Non-KR`;
          }
          if (area === 'World') {
            return `${sign} ${area}`;
          }
          return `${sign} ${isoCountries[area.toLowerCase()]}`;
        })
        .join(', ');
    },
    Team: (str) => `(${str}) `,
    // Birthday: (str) => `${Math.floor((new Date() - new Date(str)) / (1000 * 60 * 60 * 24 * 365))} y.o. `,
    Birthday: (born) => `${dayjs().diff(born, 'years')} y.o. `,
    'Total earnings': (str) => {
      const dollars = Number(str.slice(1).replace(/,/g, ''));
      if (!dollars) {
        return `$0`;
      }
      const thousand =
        dollars < 1000 ? `$${(dollars / 1000).toFixed(1)}k` : `$${Math.round(dollars / 1000)}k`;
      return thousand;
    },
    'Matches played': (str) => str.split(' ')[0],
  };
  const rows = [...tableBio.rows].slice(1);

  const info = Object.fromEntries(
    Object.entries(trNames).map(([trLabel, fnFormat]) => {
      const row = rows.find((tr) => getText(tr.cells[0]) === trLabel);
      if (!row) {
        return [trLabel, ''];
      }
      const value = fnFormat(getText(row.cells[1]));
      return [trLabel, value];
    })
  );

  const tableForm = document.querySelector('#form table');
  const formRows = [...tableForm.rows].slice(1);
  const form = formRows
    .map((row) => [getText(row.cells[0]), getOnlyIntPercent(getText(row.cells[1]).split(' ')[0])])
    .filter(([, percent]) => percent !== '0%');
  const formStr = form.map(([title, percent]) => `${title}·${percent}`).join(' ');

  const rankOrInactive = inactive ? `Inactive since ${info['Last match']}` : info['Rank'];
  const formOrInactive = (inactive || !formStr) ? `` : ` | form ${formStr}`;
  const earnedStr = info['Total earnings'] ? ` | earned ${info['Total earnings']}` : '';
  const matchesStr = info['Matches played'] ? ` | matches ${info['Matches played']}` : '';
  const str = `${info['Team']}${name} [${info['Race']}] ${info['Birthday']}| ${rankOrInactive}${matchesStr}${earnedStr}${formOrInactive}`;
  return str;
};

const getPredictionGameString = async (getFromCacheNickname, getFromCachePrediction, p1Name, p2Name) => {
  try {
    const p1Id = await getFromCacheNickname(
      p1Name,
      async (nameP1) => axios.get(apiAligulac.getIdByQueryName(nameP1)),
      (responseJson, nameP1) => getPlayerIdFromData(responseJson.data, nameP1)
    );
    if (p1Id === null) {
      console.log(`EXIT => Не найден игрок: "${p1Name}"`);
      return;
    }

    const p2Id = await getFromCacheNickname(
      p2Name,
      async (nameP2) => axios.get(apiAligulac.getIdByQueryName(nameP2)),
      (responseJson, nameP2) => getPlayerIdFromData(responseJson.data, nameP2)
    );
    if (p2Id === null) {
      console.log(`EXIT => Не найден игрок: "${p2Name}"`);
      return;
    }

    const str = await getFromCachePrediction(
      { id1: p1Id, id2: p2Id },
      async ({ id1, id2 }) => axios.get(apiAligulac.getPredictionByIds(id1, id2)),
      (responseHtml) => getStringFromPredictionHtml(getDOMDocument(responseHtml.data))
    );
    return str;
  } catch (error) {
    throw new Error(error);
  }
};
const getPlayerInfoString = async (getFromCacheNicknames, getFromCachePlayerInfo, p1Name) => {
  try {
    const p1Id = await getFromCacheNicknames(
      p1Name,
      async (nameP1) => axios.get(apiAligulac.getIdByQueryName(nameP1)),
      (responseJson, nameP1) => getPlayerIdFromData(responseJson.data, nameP1)
    );
    if (p1Id === null) {
      console.log(`EXIT => Не найден игрок: "${p1Name}"`);
      return;
    }

    const str = await getFromCachePlayerInfo(
      p1Id,
      async (id1) => axios.get(apiAligulac.getPlayerInfoById(id1)),
      (responseHtml) => getStringFromInfoPlayerHtml(getDOMDocument(responseHtml.data))
    );
    return str;
  } catch (error) {
    throw new Error(error);
  }
};

const initAligulac = (_cacheNickname, _cachePrediction, _cachePlayerInfo) => {
  const getFromCacheNickname = getFromCache(_cacheNickname);
  const getFromCachePrediction = getFromCache(_cachePrediction, true);
  const getFromCachePlayerInfo = getFromCache(_cachePlayerInfo);

  const requestPrediction = async (p1Name, p2Name) => {
    const name1F = formatName(p1Name);
    const name2F = formatName(p2Name);
    if (name1F === name2F) {
      console.log(`EXIT => Имена игроков совпадают`);
      return null;
    }
    if (isGoodFormatName(name1F) === null || isGoodFormatName(name2F) === null) {
      console.log(`EXIT => Имя игрока не соответствует требованию`);
      return null;
    }
    try {
      const resultStr = await getPredictionGameString(
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

  const requestPlayerInfo = async (p1Name) => {
    const name1F = formatName(p1Name);
    if (isGoodFormatName(name1F) === null) {
      console.log(`EXIT => Имя игрока не соответствует требованию`);
      return null;
    }
    try {
      const resultStr = await getPlayerInfoString(getFromCacheNickname, getFromCachePlayerInfo, name1F);
      return resultStr;
    } catch (error) {
      throw new Error(error);
    }
  };

  return { requestPrediction, requestPlayerInfo };
};
export default initAligulac;
