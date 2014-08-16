// //var Fiber = require('fibers');
// //var Future = require('fibers/future');
// var Fibrous = require('fibrous');

// var path = require('path');
// var fs = require('fs-extra');
// var request = require('request');

// var _ = require('underscore');
// var _str = require('underscore.string');

// var uuid = require('node-uuid');



// // OS Detection
// var isWin = /^win/.test(process.platform);
// var isMac = /^darwin/.test(process.platform);
// var isLinux = /^linux/.test(process.platform);
// var is32 = process.arch == 'ia32';
// var is64 = process.arch == 'x64';
// // var isLinux32 = isLinux && is32,
// // var isLinux64 = isLinux && is64


// // var filePath = execPath.substr(0, execPath.lastIndexOf("\\"));
// // var appPath = path.normalize(execPath + "/../../../../../../..");

// var exec = require('child_process').exec;

// var execPath = process.execPath;
// var appPath = path.normalize(execPath + "/../../../../../../..");


// var escapeshell = function(cmd) {
//   return '"'+cmd.replace(/(["'$`\\])/g,'\\$1')+'"';
// };

// module.exports = Updater;

// function Updater(config) {
//     this.config = config || {sources: {}}; 
// }

// Updater.prototype = {
//     // public
//     // config: {
//     //     sources: {},
//     //     progress: function(percentage) {
//     //         console.log(percentage + "%");
//     //     }
//     // },
    
//     checkPlatform: function() {
//     },

//     isFileUrl: function(url){
//         // use fibrous for async calls
//         var response = request.sync.head(url);
//         if (response.headers['content-type'] == 'application/octet-stream') {
//             return true;
//         }    
//        return false;
//     },
//     getUrlForPlatfrom: function(myPlatform){
//         var purl = this.config.sources[myPlatform];
//         if ( purl && _.isString(purl) && _str.startsWith(purl, "http") )
//             return purl;
//         else
//             return "";
//     },
//     existsUrlForPlatform: function(myPlatform) {
//         if (this.getUrlForPlatfrom(myPlatform))
//             return true;
//         else
//             return false;
//     },

//     update: function(callback) {
//         var myPlatform = "mac";
//         if ( existsUrlForPlatform(myPlatform) && isFileUrl( getUrlForPlatfrom(myPlatform) ) ) {
//             var url = getUrlForPlatfrom(myPlatform);


//             var tmpfile = u.downloadAsTmpFile( some_github_file_url );
//             console.log('downloaded');

//             var mount_point = mount(tmpfile);
            
//             renameFile(originalApp, tempOriginalApp);
//             copyNewApp(mountedApp, originalApp);

//             removeQuarantine(originalApp);

//             // cleanup
//             removeFile(tempOriginalApp);
//             unmount(mount_point);
//             removeFile()

//             // mount 
//         } else {
//             console.log("Sorry, we can't download the right software update.");
//         }
//     },

//     download: function(url, filename) {
//         //console.log("filename: "+filename);
//         var pkg = request(url);
//         //pkg.pipe(fs.createWriteStream(path.join(os.tmpdir(), filename)));
//         var fstr = fs.createWriteStream(filename);
//         pkg.pipe(fstr);
//         fstr.sync.on('close');
//         //if (err) throw err;
//         return null;
//     },
//     downloadAsTmpFile: function(url) {
//         var fileId = uuid.v4();
//         var tmpfilename = fileId+".updater.dmg";
//         this.download(url, tmpfilename);
//         return tmpfilename;
//     },

//     mount: function(dmg, mountpointId) {
//         var mpoint = '/Volumes/'+mountpointId;
//         var ret = exec.sync('hdiutil attach ' + dmg + ' -nobrowse -mountpoint '+mpoint);
//         return mpoint;
//     },

//     unmount: function(mount_point) {
//         exec.sync('hdiutil detach ' + mount_point);
//     },

//     renameFile: function(origFilename, newFilename) {
//         fs.sync.rename(origFilename, newFilename);
//     },

//     copyUpdate: function(app, from, to, callback) {
//         exec('cp -R ' + escapeshell(from + '/' + app + '.app') + ' ' + escapeshell(to), function(err){
//             callback(err, to + '/' + app + '.app');
//         });
//     },

//     removeQuarantine: function(filename) {
//         exec.sync('xattr -rd com.apple.quarantine ' + filename);
//     },


//     // findMountPoint: function(dmg_name, callback) {
//     // 
//     //     Add to package.json  ->  "plist":"~1.0.1"
//     //     var Plist = require('plist');
//     // 
//     //     var hdi_plist = exec.sync('hdiutil info -plist');
//     //     // Find the first match
//     //     // 
//     //     var hdi = Plist.parse(hdi_plist);
//     //     var mount_point = null;
//     //     _.find(hdi.images, function(img){
//     //         if (_str.endsWith(img["image-path"], dmg_name)) {
//     //             //console.log("mount point found", img);
//     //             var mpt = null;
//     //             _.find(img['system-entities'], function(sysent){
//     //                 // console.log(sysent['mount-point']);
//     //                 if (sysent['mount-point']) {
//     //                     console.log(sysent['mount-point']);
//     //                     mpt = sysent['mount-point'];
//     //                     return true;
//     //                 };
//     //             });
//     //             console.log("mpt:", mpt);
//     //             mount_point = mpt;
//     //             return true;
//     //         }
//     //     });
//     //     return mount_point;
//     // },

//     updateOLD: function(callback) {
//         console.log('downloading ' + this.config.source.path);
        
//         var tempName = '.nw-update.dmg';
//         var location = appPath+ "/" +tempName;
//         var self = this;
        
//         try {
//             this.download(this.config.source, location, function(){
//                 console.log('downloaded');
            
//                 self.mount(location, self.config.dmg_name, function(mount_point){
//                     console.log('update mounted at ' + mount_point);
                
//                     self.hideOriginal(self.config.app_name, function(err){
//                         if (err) throw err;
//                         console.log('original application hidden');
                    
//                         self.copyUpdate(self.config.app_name, mount_point, appPath, function(err, app){
//                             if (err) throw err;
//                             console.log('update applied successfully at ', app);
                            
//                             self.removeQuarantine(app, function(err){
//                                 if (err) throw err;
//                                 console.log('quarantine removed, cleaning up');
//                             });
                            
//                             // if either of these fails we're still going to call it a (messy) success
//                             self.cleanup(location);
//                             self.unmount(mount_point, function(){
                            
//                                 console.log('update complete');
//                                 callback(); 
//                             });
//                         });
//                     }); 
//                 });
//             }, this.config.progress);
//         } catch (err) {
            
//             // in the event of an error, cleanup what we can
//             this.cleanup(location);
//             callback(err);
//         }
//     },
    
    
//     // private
//     // download: function(options, location, callback, progress) {
        
//     //     var http = require('http');
//     //     var request = http.get(options, function(res){
//     //         res.setEncoding('binary');
            
//     //         var data = '';
//     //         var rln=0,percent=0,ln=res.headers['content-length'];
            
//     //         res.on('data', function(chunk){
//     //             rln += chunk.length;
//     //             data += chunk;
                
//     //             var p = Math.round((rln/ln)*100);
//     //             if (p > percent) { 
//     //                 percent = p;
//     //                 progress(p);
//     //             }
//     //         });
             
//     //         res.on('end', function(){
//     //             fs.writeFile(location, data, 'binary', callback);
//     //         });
//     //     });
//     // },
    

    
//     // unmount: function(mount_point, callback) {
//     //     exec('hdiutil detach ' + escapeshell(mount_point), callback);
//     // },
    
//     // findMountPoint: function(dmg_name, callback) {
//     //     exec('hdiutil info', function(err, stdout){
//     //         if (err) throw err;
            
//     //         var results = stdout.split("\n");
            
//     //         for (var i=0,l=results.length;i<l;i++) {
//     //             if (results[i].match(dmg_name)) {
//     //                 callback(results[i].split("\t").pop());
//     //                 return;
//     //             }
//     //         }
            
//     //         throw "Mount point not found";
//     //     });
//     // },
    
//     // copyUpdate: function(app, from, to, callback) {
//     //     exec('cp -R ' + escapeshell(from + '/' + app + '.app') + ' ' + escapeshell(to), function(err){
//     //         callback(err, to + '/' + app + '.app');
//     //     });
//     // },
    
//     // hideOriginal: function(app, callback) {
//     //     var filename = app + '.app';
//     //     fs.rename(appPath + '/' + filename, appPath + '/.' + filename, callback);
//     // },
    
//     restore: function() {
//         // TODO: restore previous state of application
//     },
    
//     cleanup: function(location) {
//         // TODO: remove this closely coupled code
//         // remove downloaded dmg
//         this.deleteFile(location);
        
//         // remove old version of application
//         this.deleteFolder(appPath + "/."+ this.config.app_name +".app");
//     },
    
//     // removeQuarantine: function(directory, callback) {
//     //     exec('xattr -rd com.apple.quarantine ' + escapeshell(directory), callback);
//     // },
    
//     deleteFile: function(path) {
//         if (fs.existsSync(path)) {
//             fs.unlinkSync(path);
//         }
//     },
    
//     deleteFolder: function(path) {
//         var self = this;
        
//         if (fs.existsSync(path)) {
//             fs.readdirSync(path).forEach(function(file, index){
//                 var curPath = path + "/" + file;
            
//                 if(fs.statSync(curPath).isDirectory()) { // recurse
//                     self.deleteFolder(curPath);
//                 } else { // delete file
//                     fs.unlinkSync(curPath);
//                 }
//             });
            
//             fs.rmdirSync(path);
//         }
//     }
// };

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

// var filePath = execPath.substr(0, execPath.lastIndexOf("\\"));
// var appPath = path.normalize(execPath + "/../../../../../../..");

var exec = require('child_process').exec;
var os = require('os');


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
// 



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
          throw UpdaterException("Can't read the file", error);
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
        logger.info("download loading ", url, filepath);
        var pkg = request(url);
        var fstr = fs.createWriteStream(filepath);
        pkg.pipe(fstr);
        fstr.on('close', function(error){
          if (!error) {
            callback();
          } else {
            throw UpdaterException("Can't download file "+filenampath+" from "+url, error);
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
            throw UpdaterException("Can't download temp file from:"+url, error);
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
            throw UpdaterException("Can't mount file: "+dmg+" at "+mpoint, error);
          }
        });
        return null;
    },
    unmount: function(mount_point, callback) {
        exec('hdiutil detach ' + mount_point, function(error, stdout, stderr){
          if (!error) {
            callback(null, stdout, stderr);
          } else {
            throw UpdaterException("Can't unmount: "+mount_point, error);
          }
        });
    },
    renameFile: function(origFilename, newFilename, callback) {
      fs.rename(origFilename, newFilename, function(error){
        if (!error) {
          callback(null, true);
        } else {
          throw UpdaterException("Can't rename "+origFilename+" to "+newFilename, error);
        }
      });
    },
    removeQuarantine: function(filename, callback) {
      exec('xattr -rd com.apple.quarantine ' + filename, function(error, stdout, stderr){
        if (!error) {
          callback(null, stdout);
        } else {
          throw UpdaterException("Can't remove quarantine from "+filename, error);
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
          var mpoint;
          var tmpfilepath;
          var tmpId = uuid.v4();

          try {
              self.isFileUrl( curUrl, function(err, isFile){
                logger.info("self.isFileUrl - return: ", err, isFile);
                if (isFile) {
                  // we got something to download
                  self.downloadAsTmpFile( curUrl, tmpId, function(err, tmpf){
                    logger.info("self.downloadAsTmpFile - return: ", err, tmpf);

                    tmpfilepath = tmpf;
                    // we got a file now - let's mount it
                    logger.info("tmpfilepath:"+tmpfilepath);
                    self.mount(tmpfilepath, tmpId, function(err, mp) {
                      logger.info("self.mount - return: ", err, mp);

                      mpoint = mp;
                      logger.info("mpoint:"+mpoint);
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
                          }); 
                        } else {
                          throw UpdaterException("App is not in the downloaded file", newAppPath);
                        }
                      });
                    });
                  });

                } else {
                  throw UpdaterException("Url is not a file URL: "+curUrl);
                }
              });
          } catch (error) {
            logger.error("We got an error", error);
            try {
              if (mpoint) {
                self.unmount(mpoint, function(err, stdout, stderr){
                  self.removeFile(tmpfilepath);
                });              
              } else {
                self.removeFile(tmpfilepath);
              }
            } catch (err) {
              logger.error("No update found for platform", platform);
              throw UpdaterException("Something went totally wrong when doing the cleanup", err);    
            }
          }
        } else {
          logger.info("We do not have a download link for the current platform", platform, this.config.sources);
          errors.push(new UpdaterException("No update found for platform: "+platform));
        }
        if (updateReady) {
          callback(null, {"mountPoint": mpoint});  
        } else {
          callback(errors, null);
        }
        
    }
};