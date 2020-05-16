const WebSocket = require('ws');
const wsURL= process.env['WS_URL']
let ws = null;
const onMessageCallback = function(msg) {
    // console.log(msg);
    const {type, author, payload} = JSON.parse(msg);
    if(author === 'OBD') {
        const data = JSON.parse(payload);
        //console.log(data);
        require('./controllers/dataprocessor').handleRawData(data)
    } else if(author === 'SYNC') {
        
    } 
    else {
        console.log(`${type} | ${author}`)
    }
}
const onOpenCallback = function(){
    console.log('ws opened');
    ws.on('message', onMessageCallback);
}
const onErrorCallback = function(err) {
    console.log(err);
    // reconnect
}
const bootstrap = function() {
    if(!wsURL) {
        throw 'no socket url'
    }
    ws = new WebSocket(wsURL);
    ws.on('open' , onOpenCallback);
    ws.on('error', onErrorCallback);
}

exports.startup = function() {
    bootstrap();
}