// ### DB ###
import { nanoid } from 'nanoid';

import mongo from 'mongodb';
import mongoose, { connect, model } from 'mongoose';

const { Schema } = mongoose;
connect(process.env.MLAB_URI);

const taskSchema = new Schema({
    _id: false,
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        default: () => nanoid(),
    },
    count: { type: Number, required: true },
    log: [taskSchema],
});

const User = model('user-exercises', userSchema);

const createAndSaveUser = (username, done) => {
    new User({ username, count: 0, log: [] }).save(function(err, data) {
        if (err || !data) {
            done(err);
        } else {
            done(null, data);
        }
    });
};
const findUserAndAddTask = (_id, newTask, done) => {
    User.findOneAndUpdate(
        { _id },
        { $push: { log: newTask }, $inc: { count: 1 } },
        { new: true },
        (err, updatedRecord) => {
            if (err || !updatedRecord) {
                done(err);
            } else {
                done(null, {
                    task: updatedRecord.log[updatedRecord.log.length - 1],
                    user: { userid: updatedRecord._id, username: updatedRecord.username },
                });
            }
        }
    );
};
const getAllUsers = (done) => {
    User.find()
        .select({ count: 0, log: 0 })
        .exec((err, usersFound) => {
            if (err || !usersFound) {
                done(err);
            } else {
                done(null, usersFound);
            }
        });
};
const getUserData = (_id, done) => {
    User.findById(_id, (err, usersFound) => {
        if (err || !usersFound) {
            done(err);
        } else {
            done(null, usersFound);
        }
    });
};

// const getUserDataFilterDB = ({_id, limit = 10, from, to}, done) => {
//   User.findById(_id)
//     .limit(limit)
//     .select({ age: 0 })
//     .exec((err, personFound) => {
//       if (err) return console.log(err);
//       done(null, personFound);
//     });
// };

export { createAndSaveUser, findUserAndAddTask, getAllUsers, getUserData };
