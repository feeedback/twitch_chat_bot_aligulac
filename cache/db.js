// ### DB ###
// import mongo from 'mongodb';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const { Types } = mongoose.Schema;

const cacheSchema = new mongoose.Schema({
  _id: {
    type: Types.String,
    default: () => nanoid(),
  },
  time: {
    type: Types.Date,
    required: true,
    default: () => new Date().toISOString(),
  },
  name: {
    type: Types.String,
    required: true,
    unique: true,
  },
  data: {
    type: Types.Map,
    required: true,
    default: null,
  },
});
const channelsBotLastMessageSchema = new mongoose.Schema({
  _id: {
    type: Types.String,
    default: () => nanoid(),
  },
  time: {
    type: Types.Date,
    required: true,
    default: () => new Date().toISOString(),
  },
  name: {
    type: Types.String,
    required: true,
    unique: true,
  },
});

mongoose.connect(process.env.MD_URI, { useNewUrlParser: true, useFindAndModify: false });
const Nicknames = mongoose.model('progamers_nickname', cacheSchema);
const Predictions = mongoose.model('games_predictions', cacheSchema);
const ChannelsBotLastMessage = mongoose.model('bot_info_last_messages_time', channelsBotLastMessageSchema);

const dbModels = { Nicknames, Predictions, ChannelsBotLastMessage };

const createOne = async (Model, name, data = null) => {
  const newRecord = data === null ? { name } : { name, data };
  await new Model(newRecord);
};

const getQuantity = async (Model) => {
  const recordsCount = await Model.estimatedDocumentCount();
  return recordsCount;
};

const findOne = async (Model, name) => {
  const filter = { name };
  const record = await Model.findOne(filter);
  return record;
};

const findOneAndUpdate = async (Model, name, data = null) => {
  const filter = { name };
  const update = data === null ? { name } : { name, data };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  await Model.findOneAndUpdate(filter, update, options);
  // console.log('findOneAndUpdate newRecord :>> ', newRecord);
};

const findOneAndUpdateNoWait = async (Model, name, data = null) => {
  const filter = { name };
  const update = data === null ? { name } : { name, data };
  const options = { upsert: true, setDefaultsOnInsert: true };
  await Model.findOneAndUpdate(filter, update, options);
};

/**
 *
 *
 * @param {mongoose.Model} Model
 * @return {[mongoose.Document]} of records
 */
const findAll = async (Model) => {
  const allRecords = await Model.find({});
  return allRecords;
};

const deleteAll = async (Model) => {
  await Model.deleteMany({});
};

const dbOperations = {
  createOne,
  deleteAll,
  findAll,
  getQuantity,
  findOne,
  findOneAndUpdate,
  findOneAndUpdate2: findOneAndUpdateNoWait,
};
export default { ops: dbOperations, models: dbModels };
// export { dbOperations as dbOps, dbModels };
