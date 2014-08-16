require('fibrous/lib/jasmine_spec_helper');

var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { level: 'debug', colorize:true } );
updateLogger = winston.loggers.add('updateLogger',     { console: {label: "updater", level: 'warn', colorize:true } } );

var Updater = require("../lib/updater");
var fs = require('fs-extra');
var exec = require('child_process').exec;
var uuid = require('node-uuid');
var path = require('path');

winston.error("logger ready to run");
updateLogger.error("logger ready to run");

//var u = new Updater({source: {mac: "http://downloads.sourceforge.net/project/git-osx-installer/git-2.0.1-intel-universal-snow-leopard.dmg?r=http%3A%2F%2Fgit-scm.com%2Fdownload%2Fmac&ts=1407942206&use_mirror=freefr"} });
some_js_url = "http://ajax.googleapis.com/ajax/libs/angularjs/1.2.22/angular.min.js";
some_github_file_url = "https://raw.githubusercontent.com/Vilango/node-webkit-auto-updater/master/spec/Test.dmg";
some_win_file_url = "http://download.microsoft.com/download/9/A/8/9A8FCFAA-78A0-49F5-8C8E-4EAE185F515C/Windows6.1-KB917607-x86.msu";
some_dmg_file_url = "http://download.microsoft.com/download/9/A/8/9A8FCFAA-78A0-49F5-8C8E-4EAE185F515C/Windows6.1-KB917607-x86.msu";
huge_dmg_file_url = "http://www.greenheartgames.com/files_public/GameDevTycoonDEMO-1.3.9.dmg";


/////////////////////////////////////////
//    New call with callback
/////////////////////////////////////////


describe("updater.isFileUrl", function () {
  it("should correctly detect js file url", function () {
    var u = new Updater();
    expect(u.sync.isFileUrl(some_js_url)).toBe(false);
  });
  it("should correctly detect dmg file url", function () {
    var u = new Updater();
    expect(u.sync.isFileUrl(some_github_file_url)).toBe(true);
  });
  it("should correctly detect exe file url", function () {
    var u = new Updater();
    expect(u.sync.isFileUrl(some_win_file_url)).toBe(true);
  });

  it("should correctly detect invalid url", function(done) {
    var u = new Updater();
    u.isFileUrl("http://FAKEURL", function(error, data){
      expect(error).not.toBe(null);
      expect(error.message).toBe("Can't read the file form url");
      done();
    });
    
  });
}); 

describe("updater.existsUrlForPlatform", function () {
  it("should have url for mac", function () {
    var u = new Updater({sources: {mac: "http:\\\\sample.com"}});
    expect(u.existsUrlForPlatform("mac")).toBe(true);
  });
  it("should not have url for mac", function () {
    var u = new Updater();
    expect(u.existsUrlForPlatform("mac")).toBe(false);
  });
  it("should fail with empty url", function () {
    var u = new Updater({sources: {mac: ""}});
    expect(u.existsUrlForPlatform("mac")).toBe(false);
  });
  it("should fail with bad url", function () {
    var u = new Updater({sources: {mac: "xf"}});
    expect(u.existsUrlForPlatform("mac")).toBe(false);
  });
}); 

describe("updater.download", function () {
  it("should download a file", function () {
    var u = new Updater();
    var fileId = Math.floor((Math.random() * 10000) + 1)
    filename = "xxxx.download-"+fileId+".dmg";

    u.sync.download( some_github_file_url, filename);
    expect(fs.sync.stat(filename).size).toBe(18317);
    fs.unlink(filename);
  });
});

describe("updater.downloadAsTmpFile", function () {
  it("should download a file", function () {
    var u = new Updater();
    var tmpId = uuid.v4();
    var tmp_file = u.sync.downloadAsTmpFile( some_github_file_url, tmpId );
    expect(fs.sync.stat(tmp_file).size).toBe(18317);
    fs.unlink(tmp_file);
  });
});

describe("updater.downloadAsTmpFile", function () {
  it("should download a file", function (done) {
    var u = new Updater();
    var tmpId = uuid.v4();

    u.downloadAsTmpFile( "http://FAKEURL", tmpId, function(error, data){
      expect(error.message).toBe("Can't download temp file from:http://FAKEURL");
      done();
    })
  });
});


describe("updater.mount", function () {
  it("should mount a file", function () {
    var testdmg = "Test.dmg";
    var mountCopy = "xxxx.mount-"+Math.floor((Math.random() * 10000) + 1)+".dmg";
    exec.sync('cp spec/'+testdmg+' '+mountCopy);

    var mountpointId = "xxxx.mount-"+Math.floor((Math.random() * 10000) + 1);
    var u = new Updater();
    var mpoint = u.sync.mount( mountCopy, mountpointId );
    expect(mpoint).toBe("/Volumes/"+mountpointId);
    u.sync.unmount( mpoint );
    expect(fs.sync.stat(mountCopy).size).toBe(18317);
    fs.sync.unlink(mountCopy);
  });
  it("should fail to mount fake file", function(done) {
    var mountpointId = "xxxx.mount-"+Math.floor((Math.random() * 10000) + 1);
    var u = new Updater();
    u.mount( "FakeFile", mountpointId, function(error){
      expect(error).not.toBe(null);
      expect(error.message).toBe("Can't mount file: FakeFile at /Volumes/"+mountpointId);
      done();
    });
  });
});

describe("updater.renameFile", function () {
  it("should mount a file", function () {
    var testdmg = "Test.dmg";
    var testCopy = "xxxx.renameFile-"+Math.floor((Math.random() * 10000) + 1)+".dmg";
    exec.sync('cp spec/'+testdmg+' '+testCopy);

    var u = new Updater();
    var renFile = "xxxx."+testCopy;
    u.sync.renameFile( testCopy, renFile);
     
    expect(fs.sync.stat(renFile).size).toBe(18317);
    fs.unlink(renFile);
  });
});

describe("updater.removeQuarantine", function () {
  it("should mount a file", function () {
    var quarantine = "com.apple.quarantine";

    var specApp= "unsecure.app";
    var copyApp = "xxxx.removeQuarantine-"+Math.floor((Math.random() * 10000) + 1)+".app";
    exec.sync('cp -R spec/'+specApp+' '+copyApp);

    var fileAttributes = exec.sync('xattr '+copyApp);
    expect(fileAttributes).toContain(quarantine);

    var u = new Updater();
    u.sync.removeQuarantine( copyApp );
    
    var fileAttributes = exec.sync('xattr '+copyApp);
    expect(fileAttributes).toNotContain(quarantine);
    
    expect(fs.sync.stat(copyApp).size).toBe(102);
    fs.remove(copyApp);
  });
});

describe("updater.checkNewApp", function () {
  it("should check if there is an app in the dmg", function () {
    var testdmg = "Test.dmg";
    var dmgCopy = "xxxx.renameFile-"+Math.floor((Math.random() * 10000) + 1)+".dmg";
    exec.sync('cp spec/'+testdmg+' '+dmgCopy);

    var u = new Updater();

    var mountpointId = "xxxx.mount-"+Math.floor((Math.random() * 10000) + 1);
    var mpoint = u.sync.mount( dmgCopy, mountpointId );

    var isAppBad = u.sync.checkNewApp( path.join(mpoint, "MissingFile.file") );
    expect(isAppBad).toBe(false);

    var isAppOK = u.sync.checkNewApp( path.join(mpoint, "Readme.txt") );
    expect(isAppOK).toBe(true);

    u.sync.unmount( mpoint );
    fs.remove(dmgCopy);
  });
});



// describe("updater.update", function () {
//   it("should update", function () {
//     var u = new Updater();
//     u.update( function(err, data){
//       console.log("Hurray:",err, data);
//     });
//   });
// });
