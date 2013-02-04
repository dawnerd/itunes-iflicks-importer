/**
 * This little app watches for new media from sickbeard and couchpotato.
 */

var fs = require('fs');
var path = require('path');

var config = {

  // Waits this long for more files after a file is added.
  batch_wait: 1000,

  // Accepted filetypes (.TS will be supported soon)
  filetypes: ['mkv', 'avi', 'mp4', 'm4v', 'wmv'].join('|'),

  // Couchpotato post-process directory (Where couchpotato moves files)
  couch_dir: '/Volumes/Media/Pending/Movies',

  // Sickbeard post-process directory (Where sickbeard keeps processed files)
  sickbeard_dir: '/Volumes/Media/Pending/Tv',

  // Temp processing directory (trailing slash)
  temp_dir: '/Volumes/Storage/Pending/'
};

var validFile = new RegExp(config.filetypes + '$', 'gi');

var stalker = require('stalker');
var applescript = require('applescript');

stalker.watch(config.sickbeard_dir, {buffer: config.batch_wait || 0}, cbHandleNewFile);
stalker.watch(config.couch_dir, {buffer: config.batch_wait || 0}, cbHandleNewFile);

function cbHandleNewFile(err, files) {
  console.log('Found:', files);
  var dest = '';

  for(var i = 0, c = files.length; i < c; i++) {
    if(validFile.test(files[i])) {
      dest = config.temp_dir + path.basename(files[i]).replace(/720p|1080p/i, '');
      var stat = fs.statSync(files[i]);

      // Checks if file is over 10MB
      if(stat.size > 10485760) {
        copyFile(files[i], dest, cbHandleCopiedFile);
      }
    }
  }
}

function cbHandleCopiedFile(err, source, target) {
  console.log('Moved:', source);
  if(err) {
    console.log(err);
  }

  // Leaves a "shadow" copy of the file to make Sickbeard think
  // the file is still there.
  var file = fs.openSync(source, 'w+');
  fs.closeSync(file);

  applescript.execFile('send_to_iflicks.applescript', [target], function(err, rtn){
    console.log(err, rtn);
  })
}

// http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err, source, target);
      cbCalled = true;
    }
  }
}