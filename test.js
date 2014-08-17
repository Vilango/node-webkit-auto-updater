var Updater = require("./lib/updater");
var UpdaterError = require('./lib/updaterError');
var uuid = require('node-uuid');
var path = require('path');

var winston = require('winston');
var logger = winston.loggers.get('updateLogger') || winston.loggers.add('updateLogger', {console: {label: "xxx"}, file: {name: "test.log"}});

logger.info("logger initialized");


var u = new Updater();
var tmpId = uuid.v4();


var tmp_file = u.isFileUrl( "http://localhost:3006/TestApp/osx/TestApp.dmg" , function(err, data){
  console.log("Return:",err,data);
});


// var tmp_file = u.downloadAsTmpFile( "http://FAKEURL", tmpId , function(err, data){
//   console.log("Return:",err,data);
// });

// args = [1,2,3, {"a":1, "b":2},"ABC"];


// util = require('util');
// string = util.format.apply(null, args);
// console.log(string);

// ue = new UpdaterError("hello", {"xxx":24,}, "123", 4, path);
// console.log(ue);
