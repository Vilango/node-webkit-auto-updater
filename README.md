node-webkit-auto-updater
========================

Node Webkit Auto Updater

This code is strongly inspired by the following projects:
(node-webkit-mac-updater)[https://github.com/sqwiggle/node-webkit-mac-updater]
(node-webkit-updater)[https://github.com/edjafarov/node-webkit-updater]

The following operating systems are supported:
- OSX
- Windows (comming soon)

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
    dmg_name: 'MyApp Installer',
    app_name: 'MyApp',
    source: {
        host: 's3.amazonaws.com',
        port: 80,
        path: '/myapp-releases/mac/app-0.2.dmg'
    }
});

updater.update(function(err){
    if (!err) console.log('App has been updated!');
});

```