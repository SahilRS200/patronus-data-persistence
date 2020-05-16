var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var longtermdataSchema = new Schema({
    tripid: Number,
    email: String,
    nSample: Number,
    date: Date,
    first: Number,
    last: Number,
    stamps: Array,
    payloads: Array,
})

var LongtermData = mongoose.model('longtermdata', longtermdataSchema);

module.exports = LongtermData;