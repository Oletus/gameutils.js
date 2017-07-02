const { exec, execSync } = require('child_process');
const htmlparser = require("htmlparser2");
const fs = require('fs');
const path = require('path');
const ncp = require('ncp');

var configPaths = {
    rootDir: '../',
    sourceAssetsPath: 'assets/',  // relative to rootDir
    sourceIndexPath: 'index.html',  // must be a file located in rootDir
    outDir: 'out/',  // relative to rootDir
    outDirJS: 'js/',  // relative to outDir
    outDirEXE: 'exe/'  // relative to outDir
};

const packageJson = require(path.join(__dirname, configPaths.rootDir, 'package.json'));

const rootDir = path.join(__dirname, configPaths.rootDir);
const compilerPath = path.join(__dirname, configPaths.rootDir, 'node_modules/google-closure-compiler/compiler.jar');
const sourceAssetsPath = path.join(__dirname, configPaths.rootDir, configPaths.sourceAssetsPath);
const sourceIndexPath = path.join(__dirname, configPaths.rootDir, configPaths.sourceIndexPath);
const outDirJS = path.join(__dirname, configPaths.rootDir, configPaths.outDir, configPaths.outDirJS);
const outDirEXE = path.join(__dirname, configPaths.rootDir, configPaths.outDir, configPaths.outDirEXE);

/**
 * Returns the parent directory of a directory.
 */
var pathParent = function(dir) {
    var parsedDir = path.parse(path.normalize(dir)).dir;
    return parsedDir;
};

/**
 * Creates a directory if it doesn't exist yet, including parent directories.
 */
var mkdirIfNeeded = function(dir) {
    if (!fs.existsSync(dir)) {
        mkdirIfNeeded(pathParent(dir));
        fs.mkdirSync(dir);
    }
};

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

var copyAssets = function() {
    mkdirIfNeeded(outDirJS);
    ncp(sourceAssetsPath, path.join(outDirJS, 'assets'), function (err) {
        if (err) {
            return console.error(err);
        }
        console.log('done copying assets!');
    });
};

var compileHtml = function() {
    mkdirIfNeeded(outDirJS);
    var src = convertJsList(fs.readFileSync(sourceIndexPath), 'game.min.js');
    fs.writeFileSync(path.join(outDirJS, 'index.html'), src, 'utf8');
};

var compileJS = function() {
    mkdirIfNeeded(outDirJS);
    var jsList = getJsList(fs.readFileSync(sourceIndexPath));
    for (var i = 0; i < jsList.length; ++i) {
        jsList[i] = path.join(rootDir, jsList[i]);
    }
    var outputPath = path.join(outDirJS, 'game.min.js');
    var sourceMapPath = path.join(pathParent(outDirJS), 'game.min.map');

    command = ['java', '-jar', compilerPath, '--compilation_level', 'ADVANCED_OPTIMIZATIONS', '--create_source_map', sourceMapPath, '--js'];
    command.push.apply(command, jsList);
    command.push.apply(command, ['--js_output_file', outputPath]);
    execSync(command.join(' '));
    var compiledJS = fs.readFileSync(outputPath);
    compiledJS += '\n//# sourceMappingURL=../game.min.map';
    fs.writeFileSync(outputPath, compiledJS, 'utf8');
};

var args = process.argv.slice(2);
var onlyJS = false;
if (args.length > 0 && args[0] == '--only-js') {
    onlyJS = true;
}
if (!onlyJS) {
    copyAssets();
    compileHtml();
}
compileJS();
