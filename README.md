node-webkit-auto-updater
========================

Node Webkit Auto Updater

This code is strongly inspired by the following projects:
(node-webkit-mac-updater)[https://github.com/sqwiggle/node-webkit-mac-updater]
(node-webkit-updater)[https://github.com/edjafarov/node-webkit-updater]

The following operating systems are supported:
- OSX
- Windows

## Installation

You can install this package from NPM with the following command:

```js
npm install node-webkit-auto-updater
```


## Usage

It's upto your application to know whether an update is needed and where to find it. You can do this by periodically hitting an API endpoint under your control or use sockets to let you client know when it's time to update. Once you know an update is needed then simply let the updater know where to find it. 

This gives you the oppertunity to ask the user if they wish to update or force an update in the background.

```js
var Updater = require('node-webkit-mac-updater');

var updater = new Updater({
    source: {
      mac: "http://localhost:3000/releases/updapp/mac/updapp.dmg",
      win: "http://localhost:3000/releases/updapp/win/updapp.zip",
      linux: "http://localhost:3000/releases/updapp/linux32/updapp.tar.gz"
    }
});

updater.update(function(err){
    if (!err) console.log('App has been updated!');
});

```



We use [bunyan](https://github.com/trentm/node-bunyan) as logger 
```
tail -f update.log | bunyan -o short
```