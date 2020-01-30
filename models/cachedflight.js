var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cachedflightSchema = new Schema({
    tripid : Number,
    email: String,
    nSample: Number,
    date: Date,
    first: Number,
    last: Number,
    stamps: Array,
    payloads: Array,
}, {collection: "cachedflight"});

var Cachedflight = mongoose.model('cachedflight', cachedflightSchema);

module.exports = Cachedflight;