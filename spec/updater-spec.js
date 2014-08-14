require('fibrous/lib/jasmine_spec_helper');

var Updater = require("../lib/updater");
var fs = require('fs-extra');
var exec = require('child_process').exec;

//var u = new Updater({source: {mac: "http://downloads.sourceforge.net/project/git-osx-installer/git-2.0.1-intel-universal-snow-leopard.dmg?r=http%3A%2F%2Fgit-scm.com%2Fdownload%2Fmac&ts=1407942206&use_mirror=freefr"} });
some_js_url = "http://ajax.googleapis.com/ajax/libs/angularjs/1.2.22/angular.min.js";
some_github_file_url = "https://raw.githubusercontent.com/Vilango/node-webkit-auto-updater/master/spec/Test.dmg";
some_win_file_url = "http://download.microsoft.com/download/9/A/8/9A8FCFAA-78A0-49F5-8C8E-4EAE185F515C/Windows6.1-KB917607-x86.msu";
some_dmg_file_url = "http://download.microsoft.com/download/9/A/8/9A8FCFAA-78A0-49F5-8C8E-4EAE185F515C/Windows6.1-KB917607-x86.msu";
huge_dmg_file_url = "http://www.greenheartgames.com/files_public/GameDevTycoonDEMO-1.3.9.dmg";

describe("updater.isFileUrl", function () {
  it("should correctly detect js file url", function () {
    var u = new Updater();
    expect(u.isFileUrl(some_js_url)).toBe(false);
  });
  it("should correctly detect dmg file url", function () {
    var u = new Updater();
    expect(u.isFileUrl(some_github_file_url)).toBe(true);
  });
  it("should correctly detect exe file url", function () {
    var u = new Updater();
    expect(u.isFileUrl(some_win_file_url)).toBe(true);
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

    u.download( some_github_file_url, filename);
    expect(fs.sync.stat(filename).size).toBe(18317);
    fs.unlink(filename);
  });
});

describe("updater.downloadAsTmpFile", function () {
  it("should download a file", function () {
    var u = new Updater();
    var tmp_file = u.downloadAsTmpFile( some_github_file_url );
    expect(fs.sync.stat(tmp_file).size).toBe(18317);
    fs.unlink(tmp_file);
  });
});

describe("updater.mount", function () {
  it("should mount a file", function () {
    var testfile = "./spec/Test.dmg"
    var mountpointId = "xxxx.mount-"+Math.floor((Math.random() * 10000) + 1);
    var u = new Updater();
    var mpoint = u.mount( testfile, mountpointId );
    expect(mpoint).toBe("/Volumes/"+mountpointId);
    u.unmount(  mpoint );

    //expect(fs.sync.stat(tmp_file).size).toBe(18317);
    //fs.sync.unlink(tmp_file);
  });
});

describe("updater.renameFile", function () {
  it("should mount a file", function () {
    var testdmg = "Test.dmg";
    var testCopy = "xxxx.renameFile-"+Math.floor((Math.random() * 10000) + 1)+".dmg";
    exec.sync('cp spec/'+testdmg+' '+testCopy);

    var u = new Updater();
    var renFile = "tmp"+testCopy;
    u.renameFile( testCopy, renFile);
     
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
    u.removeQuarantine( copyApp );
    
    var fileAttributes = exec.sync('xattr '+copyApp);
    expect(fileAttributes).toNotContain(quarantine);
    
    expect(fs.sync.stat(copyApp).size).toBe(102);
    fs.remove(copyApp);
  });
});
