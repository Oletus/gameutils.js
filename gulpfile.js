var gulp = require('gulp');
var closureCompiler = require('gulp-closure-compiler');
var htmlparser = require("htmlparser2");
var fs = require('fs');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var shell = require('gulp-shell')
var insert = require('gulp-insert');
var ffmpeg = require('gulp-fluent-ffmpeg');
var path = require('path');

var argv = require('yargs').argv;

var packageJson = require('./package.json');

var sourceIndex = 'index.html';
var outDirJS = './out/js/';
var outDirEXE = './out/exe/';

var fullOutDirJS = path.join(__dirname, outDirJS);
var fullOutDirEXE = path.join(__dirname, outDirEXE);

function stringSrc(filename, string) {
  var src = require('stream').Readable({ objectMode: true });
  src._read = function () {
    this.push(new gutil.File({ cwd: "", base: "", path: filename, contents: new Buffer(string) }));
    this.push(null);
  }
  return src;
}

/**
 * Returns list of script file paths.
 */
var getJsList = function(htmlContents) {
    var scriptSrc = [];
    var parser = new htmlparser.Parser({
        onopentag: function(name, attribs) {
            if(name === "script"){
                scriptSrc.push(attribs.src);
            }
        }
    }, {decodeEntities: true});
    parser.write(htmlContents);
    parser.end();
    return scriptSrc;
};

var convertJsList = function(htmlContents, jsReplacement) {
    
    var lineBreakRe = /\n/;
    var isLineBreak = function(str) {
        return str == '\n' || str.match(lineBreakRe);
    };
    
    var addedScript = false;
    var output = [''];
    var parser = new htmlparser.Parser({
        onopentag: function(name, attribs) {
            if (name == 'script') {
                if (!addedScript) {
                    output.push('<script src="' + jsReplacement + '"></script>');
                    addedScript = true;
                }
            } else {
                var tagOutput = '<' + name;
                for (attr in attribs) {
                    tagOutput += ' ' + attr + '="' + attribs[attr] + '"';
                }
                tagOutput += '>';
                output.push(tagOutput);
            }
        },
        onclosetag: function(name) {
            if (name != 'script') {
                output.push('</' + name + '>')
            }
        },
        ontext: function(text) {
            if (!isLineBreak(text) || !isLineBreak(output[output.length - 1])) {
                output.push(text)
            }
        },
        onprocessinginstruction: function(name, data) {
            output.push('<' + data + '>')
        }
    }, {decodeEntities: false});
    parser.write(htmlContents);
    parser.end();
    return output.join('');
};

gulp.task('copy_assets', function() {
    return gulp.src(['assets/**/*'])
    .pipe(gulp.dest(outDirJS + 'assets/'));
});

gulp.task('compile_html', function() {
    var src = convertJsList(fs.readFileSync(sourceIndex), 'game.min.js');
    return stringSrc('index.html', src)
    .pipe(gulp.dest(outDirJS));
});

gulp.task('compile_js', function() {
    var scriptSrc = getJsList(fs.readFileSync(sourceIndex));
    return gulp.src(scriptSrc)
    .pipe(closureCompiler({
        compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
        fileName: 'game.min.js',
        continueWithWarnings: true,
        compilerFlags: {
            compilation_level: 'ADVANCED_OPTIMIZATIONS',
            create_source_map: 'game.min.map'
        }
    }))
    .pipe(insert.append('\n//# sourceMappingURL=../../game.min.map'))
    .pipe(gulp.dest(outDirJS));
});

gulp.task('compile',
          ['compile_html', 'compile_js', 'copy_assets']
);

gulp.task('web2exe',
          ['compile'],
          shell.task([
    'web2exe-win.exe ' + fullOutDirJS + ' --main index.html --export-to windows-x32 --width 1280 --height 720 --nw-version 0.18.8 --output-dir ' + fullOutDirEXE + ' --app-name ' + packageJson.name
]));

gulp.task('ogg2mp3', function () {
    // transcode ogg files to mp3
    return gulp.src('assets/audio/*.ogg')
    .pipe(ffmpeg('mp3', function (cmd) {
        return cmd
        .audioBitrate('128k')
        .audioChannels(2)
        .audioCodec('libmp3lame')
    }))
    .pipe(gulp.dest('assets/audio/'));
});

gulp.task('mp32ogg', function () {
    // transcode mp3 files to ogg
    return gulp.src('assets/audio/*.mp3')
    .pipe(ffmpeg('ogg', function (cmd) {
        return cmd
        .audioBitrate('128k')
        .audioChannels(2)
        .audioCodec('vorbis')
    }))
    .pipe(gulp.dest('assets/audio/'));
});

/* --------------------------------------------------------------------------------------------- */

// TODO: Would be nice if these dependency tasks could be hidden from the user somehow.

// TODO: Create package.json and copy gulpfile to game created from template.

var checkValidGameName = function(name) {
    if (name === undefined) {
        console.log('usage: gulp game-from-template --name <game name>');
        return false;
    } else if (name === 'out' || name === 'assets' || name === 'src' || name === 'tools' || name === 'unit_tests' || name === 'examples' || name === 'node_modules') {
        console.log('--name parameter is reserved and can not be used!');
        return false;
    }
    return true;
};

var mkdirIfDoesntExist = function(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

gulp.task('create-template-dirs', function(callback) {
    var gameName = argv.name;
    if (!checkValidGameName(gameName)) {
        return;
    }
    mkdirIfDoesntExist('./' + gameName + '/assets/');
    mkdirIfDoesntExist('./' + gameName + '/assets/audio/');
    mkdirIfDoesntExist('./' + gameName + '/assets/gfx/');
    mkdirIfDoesntExist('./' + gameName + '/assets/models/');
    callback();
});

gulp.task('copy-useful-example-assets', function() {
    var gameName = argv.name;
    if (!checkValidGameName(gameName)) {
        return;
    }
    return gulp.src('./examples/assets/gfx/bitmapfont*')
    .pipe(gulp.dest('./' + gameName + '/assets/gfx/'));
});

var copyTemplateFn = function(templateName) {
    return function() {
        var gameName = argv.name;
        if (!checkValidGameName(gameName)) {
            return;
        }
        return gulp.src(templateName)
        .pipe(rename('index.html'))
        .pipe(gulp.dest('./' + gameName + '/'));
    };
};

gulp.task('copy-template', copyTemplateFn('game-template.html'));
gulp.task('copy-template-threejs', copyTemplateFn('game-threejs-template.html'));

gulp.task('copy-package-json', function(callback) {
    var gameName = argv.name;
    if (!checkValidGameName(gameName)) {
        return;
    }
    packageJsonCopy = JSON.parse(JSON.stringify(packageJson));
    packageJsonCopy.name = gameName;
    packageJsonCopy.version = '0.1';
    packageJsonCopy.description = 'Game project created using gameutils.js';
    delete packageJsonCopy.repository;
    delete packageJsonCopy.license;
    fs.writeFileSync('./' + gameName + '/package.json', JSON.stringify(packageJsonCopy, null, 2));
    callback();
});

var copySrcToGame = function() {
    var gameName = argv.name;
    if (!checkValidGameName(gameName)) {
        return;
    }
    console.log(gameName);
    return gulp.src('./src/**/*')
    .pipe(gulp.dest('./' + gameName + '/src/'));
};

gulp.task('game-from-template',
    ['copy-template', 'copy-useful-example-assets', 'copy-package-json', 'create-template-dirs'],
    copySrcToGame
);

gulp.task('game-from-threejs-template',
    ['copy-template-threejs', 'copy-useful-example-assets', 'copy-package-json', 'create-template-dirs'],
    copySrcToGame
);

gulp.task('default', ['web2exe']);
