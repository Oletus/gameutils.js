var gulp = require('gulp');
var closureCompiler = require('gulp-closure-compiler');
var htmlparser = require("htmlparser2");
var fs = require('fs');
var gutil = require('gulp-util');
var shell = require('gulp-shell')
var insert = require('gulp-insert');
var ffmpeg = require('gulp-fluent-ffmpeg');
var path = require('path');

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
            if (name === "script") {
                if (attribs.src === undefined) {
                    throw new Error('Unsupported: inline scripts in HTML. Move the script to a .js file.');
                }
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
