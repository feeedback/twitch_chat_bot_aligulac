// import dayjs from 'dayjs';
// const nowMs = () => dayjs().format('HH:mm:ss,SSS');

const recognizeCommandFromMessageText = (message) => {
    const lowerCaseMessage = message.trim().toLowerCase();
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

// const now = () => dayjs().format('h:mm:ss');

const channelFormat = (str) => {
    const channel = str.toLowerCase();
    return channel[0] === '#' ? channel : `#${channel}`;
};

export {
    recognizeCommandFromMessageText,
    channelFormat,
    // now,
    // nowMs,
};
