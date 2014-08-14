//var Fiber = require('fibers');
//var Future = require('fibers/future');
var Fibrous = require('fibrous');

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


// var filePath = execPath.substr(0, execPath.lastIndexOf("\\"));
// var appPath = path.normalize(execPath + "/../../../../../../..");

var exec = require('child_process').exec;

var execPath = process.execPath;
var appPath = path.normalize(execPath + "/../../../../../../..");


var escapeshell = function(cmd) {
  return '"'+cmd.replace(/(["'$`\\])/g,'\\$1')+'"';
};

module.exports = Updater;

function Updater(config) {
    this.config = config || {sources: {}}; 
}

Updater.prototype = {
    // public
    // config: {
    //     sources: {},
    //     progress: function(percentage) {
    //         console.log(percentage + "%");
    //     }
    // },
    
    checkPlatform: function() {
    },

    isFileUrl: function(url){
        // use fibrous for async calls
        var response = request.sync.head(url);
        if (response.headers['content-type'] == 'application/octet-stream') {
            return true;
        }    
       return false;
    },
    getUrlForPlatfrom: function(myPlatform){
        var purl = this.config.sources[myPlatform];
        if ( purl && _.isString(purl) && _str.startsWith(purl, "http") )
            return purl;
        else
            return "";
    },
    existsUrlForPlatform: function(myPlatform) {
        if (this.getUrlForPlatfrom(myPlatform))
            return true;
        else
            return false;
    },

    update: function(callback) {
        var myPlatform = "mac";
        if ( existsUrlForPlatform(myPlatform) && isFileUrl( getUrlForPlatfrom(myPlatform) ) ) {
            var url = getUrlForPlatfrom(myPlatform);


            var tmpfile = u.downloadAsTmpFile( some_github_file_url );
            console.log('downloaded');

            var mount_point = mount(tmpfile);
            
            renameFile(originalApp, tempOriginalApp);
            copyNewApp(mountedApp, originalApp);

            removeQuarantine(originalApp);

            // cleanup
            removeFile(tempOriginalApp);
            unmount(mount_point);
            removeFile()

            // mount 
        } else {
            console.log("Sorry, we can't download the right software update.");
        }
    },

    download: function(url, filename) {
        //console.log("filename: "+filename);
        var pkg = request(url);
        //pkg.pipe(fs.createWriteStream(path.join(os.tmpdir(), filename)));
        var fstr = fs.createWriteStream(filename);
        pkg.pipe(fstr);
        fstr.sync.on('close');
        //if (err) throw err;
        return null;
    },
    downloadAsTmpFile: function(url) {
        var fileId = uuid.v4();
        var tmpfilename = fileId+".updater.dmg";
        this.download(url, tmpfilename);
        return tmpfilename;
    },

    mount: function(dmg, mountpointId) {
        var mpoint = '/Volumes/'+mountpointId;
        var ret = exec.sync('hdiutil attach ' + dmg + ' -nobrowse -mountpoint '+mpoint);
        return mpoint;
    },

    unmount: function(mount_point) {
        exec.sync('hdiutil detach ' + mount_point);
    },

    renameFile: function(origFilename, newFilename) {
        fs.sync.rename(origFilename, newFilename);
    },

    copyUpdate: function(app, from, to, callback) {
        exec('cp -R ' + escapeshell(from + '/' + app + '.app') + ' ' + escapeshell(to), function(err){
            callback(err, to + '/' + app + '.app');
        });
    },

    removeQuarantine: function(filename) {
        exec.sync('xattr -rd com.apple.quarantine ' + filename);
    },


    // findMountPoint: function(dmg_name, callback) {
    // 
    //     Add to package.json  ->  "plist":"~1.0.1"
    //     var Plist = require('plist');
    // 
    //     var hdi_plist = exec.sync('hdiutil info -plist');
    //     // Find the first match
    //     // 
    //     var hdi = Plist.parse(hdi_plist);
    //     var mount_point = null;
    //     _.find(hdi.images, function(img){
    //         if (_str.endsWith(img["image-path"], dmg_name)) {
    //             //console.log("mount point found", img);
    //             var mpt = null;
    //             _.find(img['system-entities'], function(sysent){
    //                 // console.log(sysent['mount-point']);
    //                 if (sysent['mount-point']) {
    //                     console.log(sysent['mount-point']);
    //                     mpt = sysent['mount-point'];
    //                     return true;
    //                 };
    //             });
    //             console.log("mpt:", mpt);
    //             mount_point = mpt;
    //             return true;
    //         }
    //     });
    //     return mount_point;
    // },

    updateOLD: function(callback) {
        console.log('downloading ' + this.config.source.path);
        
        var tempName = '.nw-update.dmg';
        var location = appPath+ "/" +tempName;
        var self = this;
        
        try {
            this.download(this.config.source, location, function(){
                console.log('downloaded');
            
                self.mount(location, self.config.dmg_name, function(mount_point){
                    console.log('update mounted at ' + mount_point);
                
                    self.hideOriginal(self.config.app_name, function(err){
                        if (err) throw err;
                        console.log('original application hidden');
                    
                        self.copyUpdate(self.config.app_name, mount_point, appPath, function(err, app){
                            if (err) throw err;
                            console.log('update applied successfully at ', app);
                            
                            self.removeQuarantine(app, function(err){
                                if (err) throw err;
                                console.log('quarantine removed, cleaning up');
                            });
                            
                            // if either of these fails we're still going to call it a (messy) success
                            self.cleanup(location);
                            self.unmount(mount_point, function(){
                            
                                console.log('update complete');
                                callback(); 
                            });
                        });
                    }); 
                });
            }, this.config.progress);
        } catch (err) {
            
            // in the event of an error, cleanup what we can
            this.cleanup(location);
            callback(err);
        }
    },
    
    
    // private
    // download: function(options, location, callback, progress) {
        
    //     var http = require('http');
    //     var request = http.get(options, function(res){
    //         res.setEncoding('binary');
            
    //         var data = '';
    //         var rln=0,percent=0,ln=res.headers['content-length'];
            
    //         res.on('data', function(chunk){
    //             rln += chunk.length;
    //             data += chunk;
                
    //             var p = Math.round((rln/ln)*100);
    //             if (p > percent) { 
    //                 percent = p;
    //                 progress(p);
    //             }
    //         });
             
    //         res.on('end', function(){
    //             fs.writeFile(location, data, 'binary', callback);
    //         });
    //     });
    // },
    

    
    // unmount: function(mount_point, callback) {
    //     exec('hdiutil detach ' + escapeshell(mount_point), callback);
    // },
    
    // findMountPoint: function(dmg_name, callback) {
    //     exec('hdiutil info', function(err, stdout){
    //         if (err) throw err;
            
    //         var results = stdout.split("\n");
            
    //         for (var i=0,l=results.length;i<l;i++) {
    //             if (results[i].match(dmg_name)) {
    //                 callback(results[i].split("\t").pop());
    //                 return;
    //             }
    //         }
            
    //         throw "Mount point not found";
    //     });
    // },
    
    // copyUpdate: function(app, from, to, callback) {
    //     exec('cp -R ' + escapeshell(from + '/' + app + '.app') + ' ' + escapeshell(to), function(err){
    //         callback(err, to + '/' + app + '.app');
    //     });
    // },
    
    // hideOriginal: function(app, callback) {
    //     var filename = app + '.app';
    //     fs.rename(appPath + '/' + filename, appPath + '/.' + filename, callback);
    // },
    
    restore: function() {
        // TODO: restore previous state of application
    },
    
    cleanup: function(location) {
        // TODO: remove this closely coupled code
        // remove downloaded dmg
        this.deleteFile(location);
        
        // remove old version of application
        this.deleteFolder(appPath + "/."+ this.config.app_name +".app");
    },
    
    // removeQuarantine: function(directory, callback) {
    //     exec('xattr -rd com.apple.quarantine ' + escapeshell(directory), callback);
    // },
    
    deleteFile: function(path) {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    },
    
    deleteFolder: function(path) {
        var self = this;
        
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file, index){
                var curPath = path + "/" + file;
            
                if(fs.statSync(curPath).isDirectory()) { // recurse
                    self.deleteFolder(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            
            fs.rmdirSync(path);
        }
    }
};