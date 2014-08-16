var Updater = require("./lib/updater");
var uuid = require('node-uuid');
var path = require('path');


var u = new Updater();
var tmpId = uuid.v4();
var tmp_file = u.downloadAsTmpFile( "http://FAKEURL", tmpId , function(err, data){
  console.log("Return:",err,data);
});
