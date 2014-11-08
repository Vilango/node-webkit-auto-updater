require('fibrous/lib/jasmine_spec_helper');
jasmine.DEFAULT_TIMEOUT_INTERVAL = (1000*10); // 10 Sekunden

var fs = require('fs-extra');

var bunyan = require('bunyan');
var logger = bunyan.createLogger({name: "updateLogger"});

// var winston = require('winston');
// winston.remove(winston.transports.Console);
// winston.add(winston.transports.Console, { level: 'debug', colorize:true } );
// updateLogger = winston.loggers.add('updateLogger',     { console: {label: "updater", level: 'warn', colorize:true } } );

var Updater = require("../lib/updater");
var exec = require('child_process').exec;
var uuid = require('node-uuid');
var path = require('path');
var uuid = require('node-uuid');

// winston.error("logger ready to run");
// updateLogger.error("logger ready to run");

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
    var fileId = uuid.v4()
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

describe("updater.findMountPoint", function () {
  it("should find mount point", function () {
    var testdmg = "Test.dmg";
    var mountpointId = "xxxx.findMountPoint-"+uuid.v4();
    var mountCopy = mountpointId+".dmg";
    exec.sync('cp spec/'+testdmg+' '+mountCopy);

    var u = new Updater();
    var mpoint = u.sync.mount( mountCopy, mountpointId );
    expect(mpoint).toBe("/Volumes/"+mountpointId);

    var foundMountpoint = u.sync.findMountPoint(mountCopy);
    expect(foundMountpoint).toBe("/Volumes/"+mountpointId);

    u.sync.unmount( mpoint );
    expect(fs.sync.stat(mountCopy).size).toBe(18317);
    fs.sync.unlink(mountCopy);
  });
  it("should not find a mount point", function() {
    var u = new Updater();
    var foundMountpoint = u.sync.findMountPoint("/Anypath/FAKEDMGNAME.dmg");
    expect(foundMountpoint).toBe(null);
  });
});


describe("updater.mount", function () {
  it("should mount a file", function () {
    var testdmg = "Test.dmg";
    var mountCopy = "xxxx.mount-"+uuid.v4()+".dmg";
    exec.sync('cp spec/'+testdmg+' '+mountCopy);

    var mountpointId = "xxxx.mount-"+uuid.v4();
    var u = new Updater();
    var mpoint = u.sync.mount( mountCopy, mountpointId );
    expect(mpoint).toBe("/Volumes/"+mountpointId);
    u.sync.unmount( mpoint );
    expect(fs.sync.stat(mountCopy).size).toBe(18317);
    fs.sync.unlink(mountCopy);
  });
  it("should fail to mount fake file", function(done) {
    var mountpointId = "xxxx.mount-"+uuid.v4();
    var u = new Updater();
    u.mount( "FakeFile", mountpointId, function(error){
      expect(error).not.toBe(null);
      expect(error.message).toBe("Can't mount file: FakeFile at /Volumes/"+mountpointId);
      done();
    });
  });
  it("should mount the same file twice without error", function() {
    var testdmg = "Test.dmg";
    var mountCopy = "xxxx.mount-"+uuid.v4()+".dmg";
    exec.sync('cp spec/'+testdmg+' '+mountCopy);

    var mountpointId = "xxxx.mount-"+uuid.v4();
    var u = new Updater();

    var mpoint = u.sync.mount( mountCopy, mountpointId );
    expect(mpoint).toBe("/Volumes/"+mountpointId);

    var mpoint2 = u.sync.mount( mountCopy, "othermountpoint" );
    expect(mpoint).toBe(mpoint2);
    
    u.sync.unmount( mpoint );
    expect(fs.sync.stat(mountCopy).size).toBe(18317);
    fs.sync.unlink(mountCopy);
  });
});

describe("updater.renameFile", function () {
  it("should mount a file", function () {
    var testdmg = "Test.dmg";
    var testCopy = "xxxx.renameFile-"+uuid.v4()+".dmg";
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
    var copyApp = "xxxx.removeQuarantine-"+uuid.v4()+".app";
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

describe("updater.checkExists", function () {
  it("should check if there is an app in the dmg", function () {
    var testdmg = "Test.dmg";
    var dmgCopy = "xxxx.renameFile-"+uuid.v4()+".dmg";
    exec.sync('cp spec/'+testdmg+' '+dmgCopy);

    var u = new Updater();

    var mountpointId = "xxxx.mount-"+uuid.v4();
    var mpoint = u.sync.mount( dmgCopy, mountpointId );

    var isAppBad = u.sync.checkExists( path.join(mpoint, "MissingFile.file") );
    expect(isAppBad).toBe(false);

    var isAppOK = u.sync.checkExists( path.join(mpoint, "Readme.txt") );
    expect(isAppOK).toBe(true);

    u.sync.unmount( mpoint );
    fs.remove(dmgCopy);
  });
});

describe("updater.remove", function () {
  it("should remove file", function () {
    var testdmg = "Test.dmg";
    var testCopy = "xxxx.renameFile-"+uuid.v4()+".dmg";
    exec.sync('cp spec/'+testdmg+' '+testCopy);

    var u = new Updater();
    expect( u.sync.checkExists(testCopy) ).toBe(true);

    u.sync.remove(testCopy);
     
    expect( u.sync.checkExists(testCopy)).toBe(false);
  });
  it("should fail removing none existing file", function () {
    var fakeFileName = "FakeFileName.xxx";
    var u = new Updater();
    expect( u.sync.checkExists(fakeFileName) ).toBe(false);

    u.sync.remove(fakeFileName);

    expect( u.sync.checkExists(fakeFileName) ).toBe(false);
    // it does not fail if folder does not exist!!!!
  });

  it("should remove an appdir", function () {
    var specApp= "unsecure.app";
    var copyApp = "xxxx.remove-"+uuid.v4()+".app";
    exec.sync('cp -R spec/'+specApp+' '+copyApp);

    var u = new Updater();
    expect(u.sync.checkExists(copyApp)).toBe(true);
    
    u.sync.remove(copyApp);
    expect(u.sync.checkExists(copyApp)).toBe(false);
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
