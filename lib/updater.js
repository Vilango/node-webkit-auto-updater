var UpdaterError = require('./updaterError');

var _ = require('underscore');
var _str = require('underscore.string');
var uuid = require('node-uuid');

var path = require('path');
var fs = require('fs-extra');
var request = require('request');
var Plist = require('plist');




// OS Detection
var isWin = /^win/.test(process.platform);
var isMac = /^darwin/.test(process.platform);
var isLinux = /^linux/.test(process.platform);
var is32 = process.arch == 'ia32';
var is64 = process.arch == 'x64';
// var isLinux32 = isLinux && is32,
// var isLinux64 = isLinux && is64

var platform = isWin ? 'win' :  isMac ? 'mac' :  is32 ? 'linux32' : 'linux64';

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var os = require('os');

// Logger

var winston = require('winston');
var logger = winston.loggers.get('updateLogger') || winston.loggers.add('updateLogger', {console: {label: "xxx"}});

logger.info("logger initialized", "xxx", "yyy",{"a":1, "b":3});

//var execPath = process.execPath;
//var appPath = path.normalize(execPath + "/../../../../../../..");


// var escapeshell = function(cmd) {
//   return '"'+cmd.replace(/(["'$`\\])/g,'\\$1')+'"';
// };


function Updater(config) {
  logger.info("Constructer called",config);
  this.config = config || {sources: {}}; 
}


var start = {
  mac: function(apppath, args, options){
    logger.info("start[mac]:", apppath, args, options);
    //spawn
    if(args && args.length) {
      args = [apppath].concat('--args', args);
    } else {
      args = [apppath];
    }
    return run('open', args, options);
  },
  win: function(apppath, args, options, cb){
    logger.info("start[win]:", apppath, args, options);
    return run(apppath, args, options, cb);
  },
  linux32: function(apppath, args, options, cb){
    logger.info("start[linux]:", apppath, args, options);
    fs.chmodSync(apppath, 0755);
    if(!options) options = {};
    options.cwd = path.dirname(apppath);
    return run(apppath, args, options, cb);
  }
}

start.linux64 = start.linux32;

function run(path, args, options, cb){
  logger.info("run:", path, args, options);
  var opts = {
    detached: true
  }
  for(var key in options){
    opts[key] = options[key];
  }
  var sp = spawn(path, args, opts);
  sp.unref();
  return sp;
}

// prepareVersionUpdate
// This is run by the original app

// applyVersionUpdate
// This is run in the new version of the app and does the app swap / replacement

// runNewVersion



Updater.prototype = {
    getAppPath: function(){
      var appPath = {
        mac: path.join(process.cwd(),'../../..'),
        win: path.dirname(process.execPath)
      }
      appPath.linux32 = appPath.win;
      appPath.linux64 = appPath.win;
      return appPath[platform];
    },
    getAppExec: function(){
      var execFolder = this.getAppPath();
      var exec = {
        mac: path.basename(execFolder),
        win: path.basename(execFolder) + '.exe',
        linux32: path.basename(execFolder),
        linux64: path.basename(execFolder)
      }
      return path.join(execFolder, exec[platform]);
    },

    runApplyVersionUpdate: function(){
      return start[platform].apply(this, arguments);
    },

    run: function(){
      start[platform].apply(this, arguments);
    },
    isFileUrl: function(url, callback){
      logger.info("isFileUrl", url);
      request.head(url, function(error, response, body){
        if (!error) {
          var fileUrl = false;
          if ( (response.headers['content-type'] == 'application/octet-stream') ||
               (response.headers['content-type'] == 'application/x-apple-diskimage') 
             ){
            fileUrl = true;
          }    
          
          callback(null, fileUrl);
        } else {
          callback(new UpdaterError("Can't read the file form url", {"url": url, "error": error} ));
        }
      });
    },
    existsUrlForPlatform: function(myPlatform) {
        logger.info("existsUrlForPlatform", myPlatform);
        if (this.getUrlForPlatfrom(myPlatform))
            return true;
        else
            return false;
    },
    getUrlForPlatfrom: function(myPlatform){
        var purl = this.config.sources[myPlatform];
        if ( purl && _.isString(purl) && _str.startsWith(purl, "http") )
            return purl;
        else
            return "";
    },
    download: function(url, filepath, callback) {
        logger.info("download", url, filepath);
        var pkg = request(url, function(error, response, body){
          if (error) {
            callback(new UpdaterError("Download failed", filepath, url, error));
          }
        });
        var fstr = fs.createWriteStream(filepath);
        pkg.pipe(fstr);

        fstr.on('close', function(error){
          if (!error) {
            callback();
          } else {
            callback(new UpdaterError("Can't download file "+filepath+" from "+url, error));
          }
        });
        return null;
    },
    downloadAsTmpFile: function(url, tempId, callback) {
        var tmpfilepath =path.join(os.tmpdir(), "updater."+tempId+".dmg");
        this.download(url, tmpfilepath, function(error){
          if (!error) {
            callback(null, tmpfilepath);
          } else {
            callback(new UpdaterError("Can't download temp file from:"+url, error));
          }
        });
        return null;
    },

    findMountPoint: function(dmg, callback) {
        exec('hdiutil info -plist', function(error, stdout, stderr){
          if (!error) {
              var mount_point = null;
              var hdi = Plist.parse(stdout);
              _.find(hdi.images, function(img){
                  if (_str.endsWith(img["image-path"], dmg)) {
                      _.find(img['system-entities'], function(sysent){
                          if (sysent['mount-point']) {
                              mount_point = sysent['mount-point'];
                          };
                      });
                  }
              });
              callback(null, mount_point);
          } else {
            callback(new UpdaterError("Error getting hdiutil info for", dmg, error));
          }
        });
    },
    mount: function(dmg, mountpointId, callback) {
        var mpoint = '/Volumes/'+mountpointId;
        exec('hdiutil attach ' + dmg + ' -nobrowse -mountpoint '+mpoint, function(error, stdout, stderr){
          if (!error) {
            callback(null, mpoint);
          } else {
            callback(new UpdaterError("Can't mount file: "+dmg+" at "+mpoint, error));
          }
        });
        return null;
    },
    unmount: function(mount_point, callback) {
        exec('hdiutil detach ' + mount_point, function(error, stdout, stderr){
          if (!error) {
            callback(null, stdout, stderr);
          } else {
            callback(new UpdaterError("Can't unmount: "+mount_point, error));
          }
        });
    },
    renameFile: function(origFilename, newFilename, callback) {
      fs.rename(origFilename, newFilename, function(error){
        if (!error) {
          callback(null, true);
        } else {
          callback(new UpdaterError("Can't rename "+origFilename+" to "+newFilename, error));
        }
      });
    },
    remove: function(filepath, callback) {
      fs.remove(filepath, function(error){
        if (!error) {
          if (callback) { callback(null, true); } 
        } else {
          if (callback) { callback(new UpdaterError("Can't remve ", filepath, error)); }
        }
      });
    },
    removeQuarantine: function(filename, callback) {
      exec('xattr -rd com.apple.quarantine ' + filename, function(error, stdout, stderr){
        if (!error) {
          callback(null, stdout);
        } else {
          callback(new UpdaterError("Can't remove quarantine from "+filename, error));
        }
      });
    },

    checkNewApp: function(filepath, callback) {
      fs.exists(filepath,  function(exists){
        if (exists) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      });
    },

    prepareVersionUpdate: function(callback) {
        var self = this;

        var updateReady = false;
        var errors = [];

        if (self.existsUrlForPlatform(platform)) {

          var curUrl = self.getUrlForPlatfrom(platform);
          var tmpId = uuid.v4();

          self.isFileUrl( curUrl, function(err, isFile){
            logger.info("self.isFileUrl - return: ", err, isFile);
            if (isFile) {
              // we got something to download
              self.downloadAsTmpFile( curUrl, tmpId, function(err, tmpfilepath){
                if (!err) {
                    logger.info("self.downloadAsTmpFile - return: ", err, tmpfilepath);

                    // we got a file now - let's mount it
                    logger.info("tmpfilepath:"+tmpfilepath);
                    self.mount(tmpfilepath, tmpId, function(err, mpoint) {
                      logger.info("self.mount - return: ", err, mpoint);

                      if (!err) {                    
                          // Check if the app file is really there !
                          var AppFileName = path.basename(self.getAppExec());
                          var newAppPath = path.join(mpoint, AppFileName);
                          self.checkNewApp( newAppPath, function(error, exists){
                            logger.info("self.checkNewApp - return: ", error, exists);
                            if (exists) {
                              self.unmount(mpoint, function(err, stdout, stderr){
                                // Ready for restarting and calling applyVersionUpdate
                                logger.info("We are all set and ready for the update");
                                updateReady = true;
                                callback(null, {"downloadPath": tmpfilepath});  
                              }); 
                            } else {
                              // unmount and report error
                              self.unmount(mpoint, function(error){
                                if (!error) {
                                  self.remove(tmpfilepath);
                                }
                              }); 
                              callback(new UpdaterError("App is not in the downloaded file", mpoint, error));
                            }
                          });
                      } else {
                        // clean up the file and report error
                        self.remove(tmpfilepath);
                        callback(new UpdaterError("Was not able to mount file", tmpfilepath, err));
                      }
                    // End of mount
                    });
                } else {
                  callback(err);
                }
              // End of download
              });

            } else {
              callback(new UpdaterError("Url is not a file URL",curUrl));
            }
          });
        } else {
          logger.info("We do not have a download link for the current platform", platform, this.config.sources);
          callback(new UpdaterError("No update url found for platform", platform));
        }
    },

    // This is run in the new version of the app and does the app swap / replacement
    applyVersionUpdate: function(downloadPath, callback){
      var self = this;
      var appPath = this.getAppPath();
      var appExec = this.getAppExec();
      var mountId = uuid.v4();
      logger.info("applyVersionUpdate", downloadPath, appPath, appExec, mountId);

      self.mount(downloadPath, mountId, function(err, mpoint) {
        logger.info("self.mount - return: ", err, mpoint);
        if (!err) {                    
            // Check if the app file is really there !
            var AppFileName = path.basename(self.getAppExec());
            var newAppPath = path.join(mpoint, AppFileName);
            self.checkNewApp( newAppPath, function(error, exists){
              logger.info("self.checkNewApp - return: ", error, exists);
              if (exists) {
                logger.info("applyVersionUpdate - runApplyVersionUpdate",newAppPath, self.getAppPath(), self.getAppExec());
                var runner = self.runApplyVersionUpdate(newAppPath, [self.getAppPath(), self.getAppExec()],{});
                logger.info("applyVersionUpdate - ready to exit");
                // process.exit();
  
              } else {
                callback(new UpdaterError("App is not in the downloaded file", mpoint, error));
              }
            });
        } else {
          // file and report error
          callback(new UpdaterError("Was not able to mount file", downloadPath, err));
        }
      });    
    },

    // var originalApp = "";
    // var tempOriginalApp = uuid.v4()+originalApp;
    // logger.info("originalApp:"+originalApp+" tempOriginalApp:"+tempOriginalApp);
};

module.exports = Updater;