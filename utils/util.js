const dayjs = require('dayjs');

const recognizeCommandFromMessageText = (message) => {
    const lowerCaseMessage = message.toLowerCase();
    const regex = /!(.*?)$/gm;
    const fullMessageWithCommand = regex.exec(lowerCaseMessage);

    if (fullMessageWithCommand) {
        const splittedCommand = fullMessageWithCommand[1].split(' ');
        const command = splittedCommand.shift(); // remove command from array

        return {
            command,
            args: splittedCommand,
        };
    }

    return false;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => dayjs().format('h:mm:ss');
const nowMs = () => dayjs().format('HH:mm:ss,SSS');

const createQueueRequest = (interval) => {
    const queue = [];
    let isQueueRunning = false;

    const doRequest = (requestFn) => {
        // считает интервал от поступления запроса, не дожидается выполнения,
        // так что это в большей мере на ответ в чат ограничение
        isQueueRunning = true;
        const firstRequest = queue.shift();

        if (!firstRequest) {
            isQueueRunning = false;
            return;
        }

        requestFn(firstRequest);
        sleep(interval).then(() => {
            doRequest(requestFn);
        });
    };
    return { queue, doRequest, isQueueRunning };
};
const channelFormat = (str) => {
    const channel = str.toLowerCase();
    return channel[0] === '#' ? channel : `#${channel}`;
};

module.exports = {
    recognizeCommandFromMessageText,
    channelFormat,
    sleep,
    createQueueRequest,
    now,
    nowMs,
};
