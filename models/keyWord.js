const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const keyword = new Schema({
    name: String,
    type:String
});

module.exports = mongoose.model('Keyword', keyword, "keyword_eComm");


