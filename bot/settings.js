require('dotenv').config();

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
        // ru
        'sc2mc_ru',
        // // ru community
        '3dclanru',
        // 'alex007sc2',
        // // 'starladder_sc2_ru', // inactive stream
        // // ru speaking progamers
        // 'dimaga',
        // 'kasmatuy',
        // 'pavelbratok',
        // 'blyonfire',
        // 'BassetSC',
        // 'skilloussc2',
        // 'zippzipper',
        // // 'sc2vanya', // inactive stream
        // 'fallengersc2',
        // // en
        // 'starcraft',
        'esl_sc2',
        'esl_sc2b',
        // // 'wesg_sc2', // inactive stream
        // // en & other community
        // 'wardiii',
        'indystarcraft',
        'taketv',
        // 'ogamingsc2',
        // 'twitchplayssc',
        // 'wintergaming',
        // // en & other progamers
        // 'special_',
        // 'harstem',
        // 'heromarine',
        // 'ninasc2',
    ],
};

const ADMIN_USERNAME = 'risok';
const settings = {
    clientTmiSettings,
    ADMIN_USERNAME,
    COMMAND_CHECK_FN: {
        isAligulacPrediction: (commandStr) =>
            commandStr.startsWith('alig') || commandStr.startsWith('алиг'),

        isAddChannelToBot: (commandStr, username) =>
            commandStr === 'add_channel_to_bot' && username === ADMIN_USERNAME,
    },
    INTERVAL_REQUEST_API_AND_ANSWER_IN_CHAT: 5010,
    MEMORY_CACHE_LENGTH: 10000,
    TTL_SEC: 60 * 60 * 24, // сутки
    isAdsBotWhenJoinChannel: true,
    AdsBotMessage: `Hi, I'm prediction bot. Use me: !alig[ulac] name1 name2 (only progamers)`,
};
module.exports = settings;
