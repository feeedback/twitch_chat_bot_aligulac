// ### DB Schemes ###
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

export { cacheSchema, channelsBotLastMessageSchema };
