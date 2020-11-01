/* eslint-disable consistent-return */
const axios = require('axios');
// const dayjs = require('dayjs');
const { JSDOM } = require('jsdom');

const getDOMDocument = (data) => new JSDOM(data).window.document;
// const now = () => dayjs().format('HH:mm:ss,SSS');

const Aligulac = (cache) => {
    const getFromCache = async (key, requestFn, getDataFn, keyToCache = key) => {
        if (cache.isHas(keyToCache)) {
            const ItemValue = cache.getItem(keyToCache);
            cache.renewItem(keyToCache);
            return ItemValue;
        }

        const response = await requestFn(key);
        const ItemValue = await getDataFn(response, key);

        cache.setItem(keyToCache, ItemValue);
        return ItemValue;
    };

    const apiAligulacGetIdByName = (playerName) =>
        `http://aligulac.com/search/json/?search_for=players&q=${playerName}`;

    const apiAligulacGetPredictionByIds = (player1Id, player2Id) =>
        `http://aligulac.com/inference/match/?bo=1&ps=${player1Id}%2C${player2Id}`;

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
            console.log(`ERROR: getPlayerIdFromData => ${error}`);
            throw new Error(`ERROR: getPlayerIdFromData => ${error}`);
        }
    };
    const getRowText = (row) => {
        const td = row.querySelector('td.text-center');
        return td ? td.textContent.trim() : null;
    };

    const getRowFormOpRace = (table) =>
        [...table.rows].find((row) => getRowText(row) === 'Form vs. opposing race');
    const getRowScoreEachOther = (table) =>
        [...table.rows].find((row) => getRowText(row) === 'Score vs. each other');

    const getStringFromPredictionHtml = (document) => {
        const table = document.querySelector('table.table-striped');
        const getLeftTrPart = (el) => el.firstElementChild.textContent.trim();
        const getRightTrPart = (el) => el.lastElementChild.textContent.trim();

        const getInt = (percent) => `${Math.round(Number(percent.slice(0, -1), 10))}%`;
        const p1Name = getLeftTrPart(table.rows[0]).split(' ')[1];
        const p2Name = getRightTrPart(table.rows[0]).split(' ')[0];

        const p1Win = getInt(getLeftTrPart(table.rows[2]));
        const p2Win = getInt(getRightTrPart(table.rows[2]));

        const getFormOpRace = () => {
            const rowFormOpRace = getRowFormOpRace(table);
            if (rowFormOpRace) {
                const p1FormOpRace = getInt(getLeftTrPart(rowFormOpRace).split(/[()]/)[1]);
                const p2FormOpRace = getInt(getRightTrPart(rowFormOpRace).split(/[()]/)[1]);
                const strFormOpRace = ` | ${p1FormOpRace} form vs opp. race ${p2FormOpRace}`;
                return strFormOpRace;
            }
            return '';
        };
        const getEachOtherHistory = () => {
            const rowEachOtherHistory = getRowScoreEachOther(table);
            if (rowEachOtherHistory) {
                const p1EachOtherHistory = getInt(
                    getLeftTrPart(rowEachOtherHistory).split(/[()]/)[1]
                );
                const p2EachOtherHistory = getInt(
                    getRightTrPart(rowEachOtherHistory).split(/[()]/)[1]
                );
                const EachOtherHistory = ` | ${p1EachOtherHistory} history vs each other ${p2EachOtherHistory}`;
                return EachOtherHistory;
            }
            return '';
        };

        const str = `${p1Name} ${p1Win} vs ${p2Win} ${p2Name}${getFormOpRace()}${getEachOtherHistory()}`;
        return str;
    };

    const getPredictionGameString = async (p1Name, p2Name) => {
        try {
            const p1Id = await getFromCache(
                p1Name,
                async (nameP1) => axios.get(apiAligulacGetIdByName(nameP1)),
                (responseJson, nameP1) => getPlayerIdFromData(responseJson.data, nameP1)
            );
            if (p1Id === null) {
                console.log(`EXIT => Не найден игрок: "${p1Name}"`);
                return;
            }

            const p2Id = await getFromCache(
                p2Name,
                async (nameP2) => axios.get(apiAligulacGetIdByName(nameP2)),
                (responseJson, nameP2) => getPlayerIdFromData(responseJson.data, nameP2)
            );
            if (p2Id === null) {
                console.log(`EXIT => Не найден игрок: "${p2Name}"`);
                return;
            }

            const str = await getFromCache(
                { id1: p1Id, id2: p2Id },
                async ({ id1, id2 }) => axios.get(apiAligulacGetPredictionByIds(id1, id2)),
                (responseHtml) => getStringFromPredictionHtml(getDOMDocument(responseHtml.data)),
                `${p1Id} vs ${p2Id}`
            );
            return str;
        } catch (error) {
            console.log(`ERROR: getPredictionGameString => ${error}`);
            throw new Error(`ERROR: getPredictionGameString => ${error}`);
        }
    };

    const formatName = (name) => {
        const nameF = String(name).trim();

        return nameF;
    };

    const isGoodFormatName = (name) => {
        const regexpPattern = /[^\w-]/g;

        if (regexpPattern.test(name)) {
            console.log(
                `INFO: В имени игрока не должно быть символов кроме англ. букв, цифр, -, _: "${name}"`
            );
            return null;
        }
        if (name.length < 2) {
            console.log(`INFO: Длина имени игрока должна быть 2 и более символов: "${name}"`);
            return null;
        }
        return true;
    };

    const formatRequestAndRequest = async (p1Name, p2Name) => {
        // console.log(now(), 'request', p1Name, p2Name);
        const name1F = formatName(p1Name);
        const name2F = formatName(p2Name);
        if (isGoodFormatName(name1F) === null || isGoodFormatName(name2F) === null) {
            console.log(`EXIT => Имя игрока не соответствует требованию`);
            return null;
        }
        const resultStr = await getPredictionGameString(name1F, name2F);
        return resultStr;
    };
    return formatRequestAndRequest;
};

module.exports = Aligulac;
