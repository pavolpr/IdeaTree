// var nodeCrypto = require('crypto');
// global.crypto = {
//     getRandomValues: function(buffer) { return nodeCrypto.randomFillSync(buffer);}
// };

var nodeCrypto = require('crypto');
global.msCrypto = global.crypto = {
    getRandomValues: function(buffer) { return nodeCrypto.randomFillSync(buffer);}
};
//console.log("hum");

//global.hej = "huhu";
//hej = "mu mu";
//self.hej = " ko ko";

// const jsdom = require("jsdom");
// jsdom.window.hej = " json";
