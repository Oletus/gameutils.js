const { exec, execSync } = require('child_process');
const htmlparser = require("htmlparser2");
const fs = require('fs');
const path = require('path');
const ncp = require('ncp');
var archiver = require('archiver');

var configPaths = {
    rootDir: '../',
    sourceAssetsPath: 'assets/',  // relative to rootDir
    sourceIndexPath: 'index.html',  // must be a file located in rootDir
    outDir: 'out/',  // relative to rootDir
    outDirJS: 'js/',  // relative to outDir
    outDirNWJS: 'nwjs/',  // relative to outDir
    outDirEXE: 'exe/'  // relative to outDir
};

const packageJson = require(path.join(__dirname, configPaths.rootDir, 'package.json'));
const nwjsPackageJsonTemplate = require(path.join(__dirname, 'nwjs_package.json'));

const rootDir = path.join(__dirname, configPaths.rootDir);
const compilerPath = path.join(__dirname, configPaths.rootDir, 'node_modules/google-closure-compiler/compiler.jar');
const sourceAssetsPath = path.join(__dirname, configPaths.rootDir, configPaths.sourceAssetsPath);
const sourceIndexPath = path.join(__dirname, configPaths.rootDir, configPaths.sourceIndexPath);
const outDirJS = path.join(__dirname, configPaths.rootDir, configPaths.outDir, configPaths.outDirJS);
const outDirNWJS = path.join(__dirname, configPaths.rootDir, configPaths.outDir, configPaths.outDirNWJS);
const outDirEXE = path.join(__dirname, configPaths.rootDir, configPaths.outDir, configPaths.outDirEXE);

var tasksDone = {
    copyAssets: false,
    compileJS: false,
    compileHTML: false,
    createNWJSZip: false
};

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

var startZipping = function(targetPath) {
    var output = fs.createWriteStream(targetPath);
    var archive = archiver('zip', {
        store: true // Sets the compression method to STORE. 
    });
     
    // listen for all archive data to be written 
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });
     
    // good practice to catch this error explicitly 
    archive.on('error', function(err) {
      throw err;
    });
     
    // pipe archive data to the file 
    archive.pipe(output);
    
    return archive;
};

/**
 * Returns list of script file paths.
 */
var getJsList = function(htmlContents) {
    var scriptSrc = [];
    var parser = new htmlparser.Parser({
        onopentag: function(name, attribs) {
            if (name === "script") {
                if (attribs.src === undefined) {
                    throw new Error('Inline script tags not supported. Move the script to a separate .js file');
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

var copyAssets = function() {
    mkdirIfNeeded(outDirJS);
    ncp(sourceAssetsPath, path.join(outDirJS, 'assets'), function (err) {
        if (err) {
            return console.error(err);
        }
        tasksDone.copyAssets = true;
        setTimeout(outDirJSTaskReady, 0);
    });
};

var compileHTML = function() {
    mkdirIfNeeded(outDirJS);
    var src = convertJsList(fs.readFileSync(sourceIndexPath), 'game.min.js');
    fs.writeFileSync(path.join(outDirJS, 'index.html'), src, 'utf8');
    tasksDone.compileHTML = true;
    setTimeout(outDirJSTaskReady, 0);
};

var getNWJSPackageJSON = function() {
    var nwjsPackage = JSON.parse(JSON.stringify(nwjsPackageJsonTemplate));
    nwjsPackage.version = packageJson.version;
    nwjsPackage.name = packageJson.name;
    return JSON.stringify(nwjsPackage);
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
    tasksDone.compileJS = true;
    setTimeout(outDirJSTaskReady, 0);
};

var createNWJSZip = function() {
    mkdirIfNeeded(outDirNWJS);
    
    //fs.writeFileSync(path.join(outDirNWJS, 'package.json'), getNWJSPackageJSON());
    
    var archive = startZipping(path.join(outDirNWJS, 'package.nw'));

    // append source files
    archive.directory(outDirJS, '/');

    // append package.json for nw.js
    archive.append(getNWJSPackageJSON(), {name: 'package.json'});

    // finalize the archive (ie we are done appending files but streams have to finish yet) 
    archive.finalize();
    tasksDone.createNWJSZip = true;
    setTimeout(outDirJSTaskReady, 0);
};

var args = process.argv.slice(2);
var onlyJS = false;
if (args.length > 0 && args[0] == '--only-js') {
    onlyJS = true;
}

var outDirJSTaskReady = function() {
    if (!tasksDone.copyAssets || !tasksDone.compileJS || !tasksDone.compileHTML) {
        return;
    }
    if (!onlyJS && !tasksDone.createNWJSZip) {
        createNWJSZip();
    }
};

if (!onlyJS) {
    copyAssets();
    compileHTML();
}
compileJS();
