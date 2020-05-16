var Cachedflight = require('../models/cachedflight');
var LongtermData = require('../models/longtermdata');
// var beep = require('beepbeep')
let freq = process.env['FREQUENCY'] || -3600;
let chunk = process.env['CHUNK'] || 60;
let isLocked = false;
let failedDeleteQueue = new Set()

const chunkAsset = (asset) => {
    let index = 59;
    const limit = asset.length;
    const ret = []
  //  ret.push(asset[0]);
  if(asset.length < 59) {
      return asset;
  }
    for(index; index<=limit; index+=60) {
        if(index<asset.length)
        {ret.push(asset[index]);}
      //  console.log(`chunked at ${index} | length : ${ret.length}`);
    }

    return ret;
}
const purgeAndPersistArchive = function(inflightid, payload) {
    console.log(`in purge and persist ${inflightid} : tripid : ${payload.tripid}`);
    // Persist then on success purge
    const { tripid, email, first, last } = payload;
    LongtermData.updateOne(
        { tripid, email, first, last},
        payload,
        {upsert: true, new: true},
        function(err, data) {
            if(err) {
                console.log(`Failed | tripid: ${tripid} | email : ${email} | first : ${first}`)
                console.log(err);
                // purge at next pass
                setTimeout(startArchival, 15*60*1000);
                return;
            }
            console.log(`updated | tripid: ${data.tripid} | email : ${data.email} | first : ${data.first}`);
            console.log(`DELETE SEQUENCE ${inflightid}`)
            // delete old id
            Cachedflight.findByIdAndDelete(inflightid, function(err, data) {
                if(err) {
                    failedDeleteQueue.add(inflightid);
                    console.log(err);
                    alert(3);
                  //  isLocked = false;
                  //  return;
                }
                isLocked = false;
                ;
                !err && console.log(`DELETED ${data.id}`);
                startArchival()
            } )
        }
    )
}

const handleSaturatedDoc = (e, i) => {
    try { 
        const {id, date, payloads, stamps, email, tripid } = e;
        const [first, ...restStamps] = stamps;
        const last = restStamps.slice(-1)[0];
        const archStamps = chunkAsset(stamps);
        const archPayloads = chunkAsset(payloads);
        let archFirst = null; 
        let archLast = null;
        archFirst = Number(archStamps[0]);
        archLast = Number(archStamps[archStamps.length - 1]);
        if(Number.isNaN(first) || Number.isNaN(last))
        {
            console.log(archStamps);
            throw new Error("Error in number wrap")
        }
        const payload = {
            tripid,
            email,
            nSample: archStamps.length,
            date,
            first: archFirst,
            last: archLast,
            stamps:archStamps,
            payloads:archPayloads
        }
        console.log(`Current Length : ${payloads.length} | Updating long archive ${payload.nSample}`);
        purgeAndPersistArchive(id, payload);

    } catch(e) {
        console.log(e);
    }
}
const handleSaturatedDocs = function(err, data) {
    if(err) {
        console.log(err)
        isLocked = false;
        return;
    }
    console.log(`Received full in flight records :  ${ new Date().toISOString()}`)
    if(!data || data.length === 0) {
        console.log('data returned empty');
        console.log(`next check at ${new Date(new Date().getTime() + 15*60*1000)}`)
        setTimeout(startArchival, 15*60*1000);
        return;
    }
    console.log(`Count of full in flight records :  ${ data.length }`)
    data.forEach(handleSaturatedDoc)
}
const handleGranularDocs = () => {
    isLocked = true;
    const stampLimit = `stamps.241`;
    var promise = Cachedflight.find({[stampLimit]: {$exists: false}}).limit(1).exec();
    console.log(`Requested granular in flight records :  ${ new Date().toISOString()}`)
    promise
     .then(data => {
        if(!data || data.length === 0) {
            console.log('Granular data returned empty');
            // setTimeout(startArchival, 15*60*1000);
            return;
        }
        data.forEach((e,i) => {
            const { stamps } = e;
            const lastTimeStamp = Number(stamps[stamps.length - 1]) || 0;
            const currTimeStamp = new Date().getTime();
            const diff = currTimeStamp - lastTimeStamp;
            console.log(`Last Time Stamp : ${new Date(lastTimeStamp)} | Current Time Stamp : ${new Date(currTimeStamp)} | Will archive ? ${diff > 6*60*60*1000}`)
            if(diff > 6*60*60*1000) {
                handleSaturatedDoc(e)
            }
        }) 
     //   handleSaturatedDocs(null, data)
    })
     .catch(err => (handleSaturatedDocs(err, null)));
}
const findAllSaturatedDocs = () => {
    isLocked = true;
    const stampLimit = `stamps.240`;
    var promise = Cachedflight.find({[stampLimit]: {$exists: true}}).limit(1).exec();
    console.log(`Requested full in flight records :  ${ new Date().toISOString()}`)
    promise
     .then(data => (handleSaturatedDocs(null, data)))
     .catch(err => (handleSaturatedDocs(err, null)));
    
}
const startArchival = () => {
    findAllSaturatedDocs();
    handleGranularDocs();
 //   setInterval(findAllSaturatedDocs, 30*60*1000)
}
module.exports = {
    startArchival,
}