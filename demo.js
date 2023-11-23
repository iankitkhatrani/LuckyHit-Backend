const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const GameUser = mongoose.model('users');
console.log(GameUser.findOne({}, {}))
