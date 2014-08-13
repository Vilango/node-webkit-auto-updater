var Updater = require("../lib/updater");
//var u = new Updater({source: {mac: "http://downloads.sourceforge.net/project/git-osx-installer/git-2.0.1-intel-universal-snow-leopard.dmg?r=http%3A%2F%2Fgit-scm.com%2Fdownload%2Fmac&ts=1407942206&use_mirror=freefr"} });
some_html_url = "http://ajax.googleapis.com/ajax/libs/angularjs/1.2.22/angular.min.js"
some_file_url = "http://ajax.googleapis.com/ajax/libs/angularjs/1.2.22/angular.min.js"


describe("updater", function () {
  it("should correctly dedect false file urls", function () {
    var u = new Updater();
    expect(u.isFileUrl(some_html_url)).toBe(false);
  });
  it("should correctly dedect good file urls", function () {
    var u = new Updater();
    expect(u.isFileUrl(some_html_url)).toBe(true);
  });
}); 