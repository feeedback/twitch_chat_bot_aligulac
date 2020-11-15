// ### DB operations ###
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

export { createOne, deleteAll, findAll, getQuantity, findOne, findOneAndUpdate, findOneAndUpdateNoWait };
