var mongoose = require("mongoose");
// const uriOptions = {
//     username: "mongo",
//     password: "mongo",
//     host: "localhost",
//     port: 27017,
//     database: "obd",
//     authSource: "admin",
//     useNewUrlParser: true
// }
//const { username, password, host, port, database, useNewUrlParser, authSource } = uriOptions;
const mongooseConnectURI = process.env['MONGO_URL'];
console.log(mongooseConnectURI)

const startup = function (resolve, reject) {
    if(!mongooseConnectURI) {
        reject('no mongo url')
    }
    mongoose.connect(mongooseConnectURI, {
        useNewUrlParser:true
    }, function (error) {
        console.log(error);
        if (error) {
            console.log('CONN ERROR')
            reject(error)
        } else {
            //test connection
            console.log('running MONGO RW tests')
            var Test = require('./models/test');
            var readtestcallback;
            const sampleData = new Date().getTime()
            var test = new Test({
                timestamp: `${sampleData}`
            })
            readtestcallback = function (err) {
                if (err) {
                    console.log('ERR at write callback . Rejecting')
                    reject(err)
                } else {
                    Test.findOne({ timestamp: `${sampleData}` }, function (err, test) {
                        if (err || !test) {
                            console.log('ERR at read callback . Rejecting')
                            const errString = `No records found after insert`
                            reject(err || errString)
                        } else {
                            console.log(test);
                            const {timestamp} = test;
                            Test.remove({timestamp}, function(err) {
                                if (err) {
                                    console.log('ERR at delete . Rejecting')
                                    reject(err)
                                } else {
                                    console.log('RW OK. Continue to boot')
                                    resolve();
                                }
                            })
                                    // console.log('RW OK. Continue to boot')
                                    // resolve();
                           
                        }
                    })
                }
            }
            test.save(readtestcallback);
        }
    });


}

exports.start = function () {
    return new Promise(startup)
}