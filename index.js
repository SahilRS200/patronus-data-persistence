var mongooseBootstrap = require('./mongooseBootstrap');

mongooseBootstrap.start()
    .then(function () {
        // STAGE 1 : write latest 300
        var websocketAgent = require('./websocketClient').startup()
    })
    .catch(function(err) {
        console.log('MONGO BOOT REJECTED');
        console.log(err);
    })