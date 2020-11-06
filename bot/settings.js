import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const clientTmiSettings = {
    options: {
        debug: process.env.DEBUG_TMI,
        // level: 'info'
    },
    connection: {
        secure: true,
        reconnect: true,
    },
    identity: {
        username: 'aligulac_bot',
        password: process.env.CHAT_OAUTH, // установите CHAT_OAUTH в .env (получение https://twitchapps.com/tmi)
    },
    channels: [
        // my
        'risok',
        'aligulac_bot',
        // // ru
        'sc2mc_ru',
        // // // ru community
        '3dclanru',
        // // 'alex007sc2',
        // // // 'starladder_sc2_ru', // inactive stream
        // // // ru speaking progamers
        // // 'dimaga',
        // // 'kasmatuy',
        // // 'pavelbratok',
        // // 'blyonfire',
        // // 'BassetSC',
        // // 'skilloussc2',
        // // 'zippzipper',
        // // // 'sc2vanya', // inactive stream
        // // 'fallengersc2',
        // // // en
        // // 'starcraft',
        // // 'esl_sc2', // БАН
        // 'esl_sc2b',
        // // // 'wesg_sc2', // inactive stream
        // // // en & other community
        // // 'wardiii', // БАН
        'indystarcraft',
        // // 'taketv', // БАН
        'ogamingsc2',
        // 'twitchplayssc',
        // 'wintergaming',
        // // en & other progamers
        // // 'special_',
        // // 'harstem',
        // // 'heromarine',
        // // 'ninasc2',
    ],
};

const ADMIN_USERNAME = 'risok';

const settings = {
    clientTmiSettings,
    COMMAND_CHECK_FN: {
        isAligulacPrediction: (commandStr) =>
            commandStr.startsWith('alig') || commandStr.startsWith('алиг'),

        isAddChannelToBot: (commandStr, username) =>
            commandStr === 'add_channel_to_bot' && username === ADMIN_USERNAME,
    },
    INTERVAL_SAVE_CACHE_TO_DB: 1000 * 60 * 5, // раз в 5 минут
    INTERVAL_REQUEST_API_ALIGULAC: 1000,
    INTERVAL_RESPONSE_IN_CHAT: 5000,
    CACHE_LENGTH_NICKNAMES: 10000,
    CACHE_LENGTH_PREDICTIONS: 3000,
    CACHE_TTL_SEC_NICKNAMES: 60 * 60 * 24 * 60, // 60 суток
    // (если вдруг появиться новый игрок, или в алигулаке что-то смениться)
    CACHE_TTL_SEC_PREDICTIONS: 60 * 60 * 24 * 3, // 2 суток
    botInfoMessage: {
        isShow: true,
        textMessage: `Hi, I'm doing prediction. Use me: !alig[ulac] name1 name2`,
        //  `Hi, I'm doing prediction. Use me: !alig[ulac] name1 name2 (only progamers)`,
        intervalMs: 1000 * 60 * 60 * 24 * 7, // 7 суток
        filePath: path.join(process.cwd(), './cache/last_bot_info_message.json'),
    },
};

export default settings;
