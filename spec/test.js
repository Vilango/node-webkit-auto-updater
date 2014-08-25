var Updater = require("./../lib/updater");
var UpdaterError = require('./../lib/updaterError');
var uuid = require('node-uuid');
var path = require('path');

var winston = require('winston');
var logger = winston.loggers.get('updateLogger') || winston.loggers.add('updateLogger', {console: {label: "xxx"}, file: {name: "test.log"}});

var ncp = require('ncp').ncp;
ncp.limit = 16


logger.info("logger initialized");


var u = new Updater();
var tmpId = uuid.v4();


// var tmp_file = u.isFileUrl( "http://localhost:3006/TestApp/osx/TestApp.dmg" , function(err, data){
//   console.log("Return:",err,data);
// });

ncp("/Volumes/6148b320-ed75-4d39-ba7e-d55fe7f5eac0/TestApp.app", "/var/folders/fp/rt5y2x2x7qvghvsrf03jr6jh0000gn/T/xxxx2.TestApp.app", function(err){
  console.log("copied files", err);
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
