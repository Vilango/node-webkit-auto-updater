function UpdaterException(message, object) {
   this.message = message;
   this.name = "UserException";
   this.obj = object;
   this.toString = function(){return this.name + ": " + this.message + " object:"+object;} 
}

var path = require('path');
var fs = require('fs-extra');
var request = require('request');

var _ = require('underscore');
var _str = require('underscore.string');
var uuid = require('node-uuid');


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
var os = require('os');

// Logger

var winston = require('winston');
var logger = winston.loggers.get('updateLogger') || winston.loggers.add('updateLogger', {console: {label: "xxx"}});

logger.info("logger initialized");

//var execPath = process.execPath;
//var appPath = path.normalize(execPath + "/../../../../../../..");


// var escapeshell = function(cmd) {
//   return '"'+cmd.replace(/(["'$`\\])/g,'\\$1')+'"';
// };

module.exports = Updater;

function Updater(config) {
  logger.info("Constructer called",config);
  this.config = config || {sources: {}}; 
}

Updater.prototype.getAppPath = function(){
  var appPath = {
    mac: path.join(process.cwd(),'../../..'),
    win: path.dirname(process.execPath)
  }
  appPath.linux32 = appPath.win;
  appPath.linux64 = appPath.win;
  return appPath[platform];
}
Updater.prototype.getAppExec = function(){
  var execFolder = this.getAppPath();
  var exec = {
    mac:'',
    win: path.basename(execFolder) + '.exe',
    linux32: path.basename(execFolder),
    linux64: path.basename(execFolder)
  }
  return path.join(execFolder, exec[platform]);
}

Updater.prototype.runInstaller = function(){
  return start[platform].apply(this, arguments);
}

Updater.prototype.run = function(){
  start[platform].apply(this, arguments);
}

// prepareVersionUpdate
// This is run by the original app

// applyVersionUpdate
// This is run in the new version of the app and does the app swap / replacement

// runNewVersion


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



Updater.prototype = {
    // checkPlatform: function() {
    // },

    isFileUrl: function(url, callback){
      request.head(url, function(error, response, body){
        if (!error) {
          var fileUrl = false;
          if (response.headers['content-type'] == 'application/octet-stream') {
            fileUrl = true;
          }    
          
          callback(error, fileUrl);
        } else {
          callback(new UpdaterException("Can't read the file", error));
        }
      });
    },
    existsUrlForPlatform: function(myPlatform) {
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
            callback(new UpdaterException("Download failed", filepath, url, error));
          }
        });
        var fstr = fs.createWriteStream(filepath);
        pkg.pipe(fstr);

        fstr.on('close', function(error){
          if (!error) {
            callback();
          } else {
            callback(new UpdaterException("Can't download file "+filepath+" from "+url, error));
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
            callback(new UpdaterException("Can't download temp file from:"+url, error));
          }
        });
        return null;
    },

    mount: function(dmg, mountpointId, callback) {
        var mpoint = '/Volumes/'+mountpointId;
        exec('hdiutil attach ' + dmg + ' -nobrowse -mountpoint '+mpoint, function(error, stdout, stderr){
          if (!error) {
            callback(null, mpoint);
          } else {
            callback(new UpdaterException("Can't mount file: "+dmg+" at "+mpoint, error));
          }
        });
        return null;
    },
    unmount: function(mount_point, callback) {
        exec('hdiutil detach ' + mount_point, function(error, stdout, stderr){
          if (!error) {
            callback(null, stdout, stderr);
          } else {
            callback(new UpdaterException("Can't unmount: "+mount_point, error));
          }
        });
    },
    renameFile: function(origFilename, newFilename, callback) {
      fs.rename(origFilename, newFilename, function(error){
        if (!error) {
          callback(null, true);
        } else {
          callback(new UpdaterException("Can't rename "+origFilename+" to "+newFilename, error));
        }
      });
    },
    removeQuarantine: function(filename, callback) {
      exec('xattr -rd com.apple.quarantine ' + filename, function(error, stdout, stderr){
        if (!error) {
          callback(null, stdout);
        } else {
          callback(new UpdaterException("Can't remove quarantine from "+filename, error));
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

          var originalApp = "";
          var tempOriginalApp = uuid.v4()+originalApp;
          var tmpId = uuid.v4();

          self.isFileUrl( curUrl, function(err, isFile){
            logger.info("self.isFileUrl - return: ", err, isFile);
            if (isFile) {
              // we got something to download
              self.downloadAsTmpFile( curUrl, tmpId, function(err, tmpfilepath){
                logger.info("self.downloadAsTmpFile - return: ", err, tmpfilepath);

                // we got a file now - let's mount it
                logger.info("tmpfilepath:"+tmpfilepath);
                self.mount(tmpfilepath, tmpId, function(err, mpoint) {
                  logger.info("self.mount - return: ", err, mpoint);
                  logger.info("originalApp:"+originalApp+" tempOriginalApp:"+tempOriginalApp);

                  // Check if the app file is really there !
                  var newAppPath = path.join(mpoint, "MissingFile.file")
                  self.checkNewApp( newAppPath, function(error, exists){
                    logger.info("self.checkNewApp - return: ", error, exists);
                    if (exists) {
                      self.unmount(mpoint, function(err, stdout, stderr){
                        // Ready for restarting and calling applyVersionUpdate
                        logger.info("Wea are all set and ready for the update");
                        updateReady = true;
                        callback(null, {"mountPoint": mpoint});  
                      }); 
                    } else {
                      errors.push(new UpdaterException("App is not in the downloaded file", newAppPath));
                    }
                  });
                });
              });

            } else {
              errors.push(new UpdaterException("Url is not a file URL: "+curUrl));
            }
          });
          // } catch (error) {
          //   logger.error("We got an error", error);
          //   try {
          //     if (mpoint) {
          //       self.unmount(mpoint, function(err, stdout, stderr){
          //         self.removeFile(tmpfilepath);
          //       });              
          //     } else {
          //       self.removeFile(tmpfilepath);
          //     }
          //   } catch (err) {
          //     logger.error("No update found for platform", platform);
          //     errors.push(new UpdaterException("Something went totally wrong when doing the cleanup", err)); 
          //   }
          // }
        } else {
          logger.info("We do not have a download link for the current platform", platform, this.config.sources);
          errors.push(new UpdaterException("No update found for platform: "+platform));
        }
    }
};