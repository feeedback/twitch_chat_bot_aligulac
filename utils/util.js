import dayjs from 'dayjs';

export const now = () => dayjs().format('h:mm:ss');
export const nowMs = () => dayjs().format('HH:mm:ss,SSS');

export const recognizeCommandFromMessageText = (message) => {
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

export const channelFormat = (str) => {
  const channel = str.toLowerCase();
  return channel[0] === '#' ? channel : `#${channel}`;
};

export const formatName = (name) => String(name).trim();

export const isGoodFormatPlayerName = (name) => {
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

export const getPercentInt = (a, b) => Math.floor((a / b) * 100);
