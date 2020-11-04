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
        default: () => Date.now(),
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
        default: () => Date.now(),
    },
    name: {
        type: Types.String,
        required: true,
        unique: true,
    },
});

mongoose.connect(process.env.MD_URI);
const Nicknames = mongoose.model('progamers_nickname', cacheSchema);
const Predictions = mongoose.model('games_predictions', cacheSchema);
const ChannelsBotLastMessage = mongoose.model(
    'bot_info_last_messages_time',
    channelsBotLastMessageSchema
);

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

const findOneAndReplace = async (Model, name, data = null) => {
    const filter = { name };
    const replacement = data === null ? { name } : { name, data };
    await Model.findOneAndReplace(filter, replacement);
};

const findAll = async (Model) => {
    const allRecords = await Model.find({});
    return allRecords;
};

const deleteAll = async (Model) => {
    await Model.deleteMany({});
};

const dbOperations = { createOne, deleteAll, findAll, getQuantity, findOne, findOneAndReplace };
export { dbOperations, dbModels };

// const findAndUpdate = async (Model, name, data = null) => {
//     // так не будет обновляться поле времени - лучше не юзать
//     const filter = { name };
//     const update = data === null ? { name } : { name, data };
//     await Model.findOneAndUpdate(filter, update);
// };
