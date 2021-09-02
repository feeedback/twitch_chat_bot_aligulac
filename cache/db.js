// ### DB ###
import mongoose from 'mongoose';

import { cacheSchema, channelsBotLastMessageSchema } from './db_schemes.js';
import * as ops from './db_operations.js';

mongoose.connect(process.env.MD_URI, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

mongoose.pluralize(null); // отключаю чертово добавление s в конце имени коллекций

const models = {
  Nicknames: mongoose.model('progamers_nicknames', cacheSchema),
  Predictions: mongoose.model('games_predictions', cacheSchema),
  PlayersInfo: mongoose.model('info_about_players', cacheSchema),
  ChannelsBotLastMessage: mongoose.model('bot_info_last_messages_times', channelsBotLastMessageSchema),
};
export { ops, models };
// export default { dbOperations as ops, dbModels as models };
