var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var testSchema = new Schema({
    timestamp : String
}, {collection: "test"});

var Test = mongoose.model('test', testSchema);

module.exports = Test;