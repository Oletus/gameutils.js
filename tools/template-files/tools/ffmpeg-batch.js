const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

var convert = function(inputFile, outputFile, codecSettings) {
    if (codecSettings === undefined) {
        codecSettings = '';
    }
    var cmd = 'ffmpeg -i ' + inputFile + ' -y -vn -ac 2 -b:a 128k ' + codecSettings + ' ' + outputFile;
    exec(cmd);
};

var oggToMp3 = function(inputFile) {
    var oldExt = path.extname(inputFile);
    var outputFile = inputFile.substring(0, inputFile.length - oldExt.length) + '.mp3'
    convert(inputFile, outputFile, '-acodec libmp3lame')
};

var mp3ToOgg = function(inputFile) {
    var oldExt = path.extname(inputFile);
    var outputFile = inputFile.substring(0, inputFile.length - oldExt.length) + '.ogg'
    convert(inputFile, outputFile, '-acodec vorbis')
};

var batchConvert = function(parentPath, sourceExt, convertFunc) {
    fs.readdirSync(parentPath).forEach(file => {
        var ext = path.extname(file);
        if (ext === sourceExt) {
            convertFunc(path.join(parentPath, file));
        }
    });
};

var args = process.argv.slice(2);
if (args[0] === 'ogg2mp3') {
    batchConvert(args[1], '.ogg', oggToMp3);
} else if (args[0] === 'mp32ogg') {
    batchConvert(args[1], '.mp3', mp3ToOgg);
}
