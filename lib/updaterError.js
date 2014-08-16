var util = require('util');

module.exports = function UpdaterError(message) {
    this.message = message;
    this.name = "UpdaterError";
    //this.toString = function(){return this.name + ": " + this.message + " object:"+object;}

    var self = this,
      args = Array.prototype.slice.call(arguments, 1);

    while(args[args.length - 1] === null) {
      args.pop();
    }

    this.data = util.format.apply(null, args);
}