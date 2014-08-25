var UpdaterError = require('./updaterError');

var _ = require('underscore');
var _str = require('underscore.string');
var uuid = require('node-uuid');

var path = require('path');
var fs = require('fs-extra');
var request = require('request');
var Plist = require('plist');
var ncp = require('ncp').ncp;
// ncp.limit = 16;

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
  this.eventToListeners = {};
}

Updater.CONST = {
  "START_RUNNING":"START_RUNNING",
  "START_CLOSED":"START_CLOSED",
  
  "MODE_NORMAL":"### NORMAL-MODE ###",
  "MODE_APPLYVERSIONUPDATE":"### APPLYVERSIONUPDATE-MODE ###",
  "EVENT_STATE":"EVENT_STATE",
  "EVENT_CLOSE":"CLOSE"
  }


var start = {
  mac: function(apppath, args, options, cb){
    logger.info("start[mac]:", apppath, args, options);
    //spawn
    // if(args && args.length) {
    //   args = [apppath].concat('--args', args);
    // } else {
    //   args = [apppath];
    // }
    // return run('open', args, options, cb);

    if(args && args.length) {
      args = ['--args', args];
    } else {
      args = [];
    }
    return run(apppath+"/Contents/MacOS/node-webkit", args, options, cb);
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
  var cbSent = false;

  var opts = {
    detached: true
  }
  for(var key in options){
    opts[key] = options[key];
  }
  
  var sp = spawn(path, args, opts);
  sp.stdout.on('data', function (data) {
    logger.info('run - stdout - data: '+data);
    logger.info('run - check: ',_str.include(data.toString(), Updater.CONST.MODE_APPLYVERSIONUPDATE), data.toString(), Updater.CONST.MODE_APPLYVERSIONUPDATE);
    if (_str.include(data.toString(), Updater.CONST.MODE_APPLYVERSIONUPDATE) || _str.include(data.toString(), Updater.CONST.MODE_NORMAL)) {
      cbSent = true;
      logger.info('run - sending callback ', null, Updater.CONST.START_RUNNING);
      sp.unref();

      if (cb) cb(null, Updater.CONST.START_RUNNING, null);
    }
  });

  sp.stderr.on('data', function (data) {
    logger.info('run - stderr - data: '+data);
  });

  sp.on('close', function (code) {
    logger.info('run - close - process exited with code: ', code);
    // this will only work if we did not yet send a callback
    if (cb && !cbSent)  cb(null, Updater.CONST.CLOSED, code);
  });
  return sp;
}

// prepareVersionUpdate
// This is run by the original app

// applyVersionUpdateStep1
// copys app to temp folder and starts the app from there


// applyVersionUpdateStep2
// This is run from the temp app in temp path. It does the original app replacement
// Then restarts to the new app in the original path




Updater.prototype = {
    on: function (event, callback) {
      if (!this.eventToListeners.hasOwnProperty(event)) {
          this.eventToListeners[event] = [];
      }
      this.eventToListeners[event].push(callback);
    },
    fireOn: function (event, args) {
      if (this.eventToListeners.hasOwnProperty(event)) {
          for (var i = 0; i < this.eventToListeners[event].length; ++i) {
             try {
                 this.eventToListeners[event][i].call(null, args);
             } catch (e) {
                 if (console && console.error) {
                     console.error(e);
                 }
                 if (logger && logger.error) {
                     logger.error(e);
                 }
             }
          }
      }
    },
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
        mac: '',
        win: path.basename(execFolder) + '.exe',
        linux32: path.basename(execFolder),
        linux64: path.basename(execFolder)
      }
      return path.join(execFolder, exec[platform]);
    },

    runApp: function(){
      return start[platform].apply(this, arguments);
    },

    // run: function(){
    //   start[platform].apply(this, arguments);
    // },
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
        logger.info("mount", dmg, mountpointId);
        this.findMountPoint(dmg, function(err, found_mount_point){
          if (!err) {
            logger.info("mount findMountPoint", found_mount_point);
            if (found_mount_point) {
              // the dmg is already mounted
              logger.info("mount cb found", found_mount_point);
              callback(null, found_mount_point);
            } else {
              // Try to mount 
              var mpoint = '/Volumes/'+mountpointId;
              exec('hdiutil attach ' + dmg + ' -nobrowse -mountpoint '+mpoint, function(error, stdout, stderr){
                if (!error) {
                  logger.info("mount cb mounted", mpoint);
                  callback(null, mpoint);
                } else {
                  logger.info("mount cb mount error", mpoint);
                  callback(new UpdaterError("Can't mount file: "+dmg+" at "+mpoint, error));
                }
              });

            }
          } else {
            logger.error("mount cb findMountPoint error", mpoint);
            callback(new UpdaterError("Error finding mount point", dmg, err));
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
          if (callback) { callback(new UpdaterError("Can't remove ", filepath, error)); }
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
    checkExists: function(filepath, callback) {
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
        var errors = [];

        if (self.existsUrlForPlatform(platform)) {

          var curUrl = self.getUrlForPlatfrom(platform);
          var tmpId = uuid.v4();
          self.fireOn(Updater.CONST.EVENT_STATE, 'checkurl');
          self.isFileUrl( curUrl, function(err, isFile){
            logger.info("self.isFileUrl - return: ", err, isFile);
            if (isFile) {
              // we got something to download
              self.fireOn(Updater.CONST.EVENT_STATE, 'downloadfile');
              self.downloadAsTmpFile( curUrl, tmpId, function(err, tmpfilepath){
                if (!err) {
                    logger.info("self.downloadAsTmpFile - return: ", err, tmpfilepath);

                    // we got a file now - let's mount it
                    logger.info("tmpfilepath:"+tmpfilepath);
                    self.fireOn(Updater.CONST.EVENT_STATE, 'mountfile');
                    self.mount(tmpfilepath, tmpId, function(err, mpoint) {
                      logger.info("self.mount - return: ", err, mpoint);

                      if (!err) {                    
                          // Check if the app file is really there !
                          var appFileName = path.basename(self.getAppExec());
                          var dmgAppPath = path.join(mpoint, appFileName);
                          self.fireOn(Updater.CONST.EVENT_STATE, 'checkapp');
                          self.checkExists( dmgAppPath, function(error, exists){
                            logger.info("self.checkExists - return: ", error, exists);
                            if (exists) {
                              var tmpAppPath = path.join(os.tmpdir(), tmpId+"."+appFileName);
                              logger.info("ncp - pre: ", dmgAppPath, tmpAppPath);
                              self.fireOn(Updater.CONST.EVENT_STATE, 'copyapptotemp');
                              ncp(dmgAppPath, tmpAppPath, function(err){
                                logger.info("ncp - return: ", err);
                                self.fireOn(Updater.CONST.EVENT_STATE, 'unmountfile');
                                self.unmount(mpoint, function(err, stdout, stderr){
                                  // Ready for restarting and calling applyVersionUpdate
                                  logger.info("We are all set and ready for the update");
                                  self.fireOn(Updater.CONST.EVENT_STATE, 'readytoupdate');
                                  callback(null, {"downloadPath": tmpAppPath});
                                }); 
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
    applyVersionUpdateStep1: function(tempAppPath, cb){
      var self = this;
      var appPath = this.getAppPath();
      var appExec = this.getAppExec();
      logger.info("applyVersionUpdateStep1", tempAppPath, appPath, appExec, cb);

      // Check if the app file is really there !
      var AppFileName = path.basename(self.getAppExec());
      logger.info("applyVersionUpdateStep1 checkExists pre:", tempAppPath, AppFileName);

      self.checkExists( tempAppPath, function(error, exists){
        logger.info("applyVersionUpdateStep1 checkExists - return: ", error, exists);
        if (exists) {
            logger.info("applyVersionUpdateStep1 removeQuarantine pre:", tempAppPath);
            self.removeQuarantine(tempAppPath, function(error, isRemoved){
              logger.info("applyVersionUpdateStep1 removeQuarantine:", error, isRemoved);
              if (!error) {
                  logger.info("applyVersionUpdateStep1 runApp - pre:", tempAppPath, self.getAppPath(), self.getAppExec());
                  var runner = self.runApp(tempAppPath, ["--destAppPath="+self.getAppPath()], {}, function(error, data, exitcode){
                    logger.info("applyVersionUpdateStep1 runApp - return:", error, data, exitcode);  
                    if (!error) {
                      if (data == Updater.CONST.START_RUNNING) {
                        logger.info("applyVersionUpdateStep1 runApp - temp app is running now... so we quit");
                        if (cb) cb(null, true);
                      } else {
                        logger.warn("applyVersionUpdateStep1 runApp - temp app is not running!");
                        if (cb) cb(new UpdaterError("App did not startup from temp location as expected", error, data, exitcode));
                      }
                    } else {
                      logger.warn("applyVersionUpdateStep1 runApp - temp app is not running!");
                      if (cb) cb(new UpdaterError("App did not startup from temp location as expected", error, data, exitcode));
                    }
                  });
                  logger.info("applyVersionUpdateStep1 - ready to exit");
              } else {
                if (cb) cb(new UpdaterError("Unable to remove quarantine from file", tempAppPath, error));
              }
            });
        } else {
          if (cb) cb(new UpdaterError("App is not in the downloaded file", mpoint, error));
        }
      });    
    },
    applyVersionUpdateStep2: function(destAppPath, cb){
      var self = this;
      var appPath = this.getAppPath();
      var appExec = this.getAppExec();
    
      // copy new App File over
      logger.info("applyVersionUpdateStep2 ncp - pre: ", appPath, destAppPath);
      self.fireOn(Updater.CONST.EVENT_STATE, 'copyapptooriginal');
      ncp(appPath, destAppPath, function(err){
        logger.info("applyVersionUpdateStep2 ncp - return: ", err);
        self.fireOn(Updater.CONST.EVENT_STATE, 'readytorunnewversion');

        // restart
        var runner = self.runApp(destAppPath, [], {}, function(error, data, exitcode){
          logger.info("applyVersionUpdateStep2 runApp - return:", error, data, exitcode);  
          if (!error) {
            if (data == Updater.CONST.START_RUNNING) {
              logger.info("applyVersionUpdateStep2 runApp - new app is running now... so we quit");
              if (cb) cb(null, true);
            } else {
              logger.warn("applyVersionUpdateStep2 runApp - new app is not running!");
              if (cb) cb(new UpdaterError("App did not startup from new/original location as expected", error, data, exitcode));
            }
          } else {
            logger.warn("applyVersionUpdateStep2 runApp - new app is not running!");
            if (cb) cb(new UpdaterError("App did not startup from new/original location as expected", error, data, exitcode));
          }
        });
      });
    }
};

module.exports = Updater;