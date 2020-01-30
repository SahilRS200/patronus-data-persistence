var Cachedflight = require('../models/cachedflight');
const devSession = 12345678;
let freq = process.env['FREQUENCY'] || -20;
freq = freq === 0 ? -20 : freq > 0 ? 0-freq : freq; 
console.log(`setting frequency at ${freq}`)
exports.handleRawData = function (data) {
    const { eml='dummy@dummy.com', v=2, session=12345678, id=0, time, ...rest } = data;
    // Chunk by hour
    var nowDate = new Date();
    nowDate = new Date()
    nowDate.setMinutes(00)
    nowDate.setSeconds(00)
    nowDate.setMilliseconds(00)

    // identifiers
    const email = eml;
    const tripid = session;
    // upsert
    const timestamp = time || `${new Date().getTime()}`;
    const payload = {
        time,
        ...rest
    }
    var promise = Cachedflight.updateOne({ email, tripid, date: nowDate },
        {
            // $push: { stamps: timestamp, payloads: payload },
            $push: {
                stamps: {
                    $each: [timestamp],
                    $slice: freq
                },
                payloads: {
                    $each: [payload],
                    $slice: freq
                }
            },
          //  first: {$arrayElemAt: [ 'stamps', 0 ]} ,
          //  $max: { last: timestamp },
        },
        { upsert: true }
    ).exec()

    promise
        .then(function (obj) {
            console.log(obj)
        })
        .catch(function(err) {
            console.log(err)
        })

}