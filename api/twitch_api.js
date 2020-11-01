/* eslint-disable consistent-return */
const axios = require('axios');
// Начальные наработки. Пока ничего не работает.

const STARCRAFT2_GAME_ID = 490422;
const twitchAPIGetStreamsByGames = (gameId) =>
    `https://api.twitch.tv/helix/streams?game_id=${gameId}`;
const authHeaders = {
    headers: {
        // 'Client-ID': '',
    },
};
const request = async () => {
    try {
        const response = await axios.get(
            twitchAPIGetStreamsByGames(STARCRAFT2_GAME_ID),
            authHeaders
        );
        console.log('response :>> ', response);
    } catch (error) {
        console.log(error);
    }
};
request();
