const { exec, execSync } = require('child_process');
const htmlparser = require("htmlparser2");
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const async = require('async');
const nwfindpath = require('nw').findpath;
const archiver = require('archiver');

const configPaths = require(path.join(__dirname, 'tools-config.json')).paths;
const configCompileSettings = require(path.join(__dirname, 'tools-config.json')).compileSettings;

const packageJson = require(path.join(__dirname, configPaths.rootDir, 'package.json'));
const nwjsPackageJsonTemplate = require(path.join(__dirname, 'nwjs_package.json'));

const compileUtils = require('./compile-utils.js');
const rootDir = compileUtils.paths.rootDir;
const compilerPath = compileUtils.paths.compilerPath;
const sourceAssetsPath = compileUtils.paths.sourceAssetsPath;
const sourceIndexPath = compileUtils.paths.sourceIndexPath;
const cordovaDir = compileUtils.paths.cordovaDir;
const outDirJS = compileUtils.paths.outDirJS;
const outDirNWJS = compileUtils.paths.outDirNWJS;

/**
 * Returns the parent directory of a directory.
 */
var pathParent = function(dir) {
    var parsedDir = path.parse(path.normalize(dir)).dir;
    return parsedDir;
};

var startZipping = function(targetPath) {
    var output = fs.createWriteStream(targetPath);
    var archive = archiver('zip', {
        store: true // Sets the compression method to STORE. 
    });

    output.on('close', function() {
      console.log('archive written: ' + archive.pointer() + ' total bytes');
    });

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
                output.push('</' + name + '>');
            }
        },
        ontext: function(text) {
            if (!isLineBreak(text) || !isLineBreak(output[output.length - 1])) {
                output.push(text);
            }
        },
        onprocessinginstruction: function(name, data) {
            output.push('<' + data + '>');
        }
    }, {decodeEntities: false});
    parser.write(htmlContents);
    parser.end();
    return output.join('');
};

var copyAssets = function(callback) {
    fse.ensureDirSync(outDirJS);
    var destAssetsPath = path.join(outDirJS, 'assets');
    if (fs.existsSync(destAssetsPath)) {
        fse.removeSync(destAssetsPath);
    }
    var filterFn = function(src, dest) {
        if (configCompileSettings.spritesInAtlas) {
            var srcExt = path.extname(src);
            var spritesInAtlasSrc = path.join(rootDir, configCompileSettings.spritesInAtlas);
            if ((srcExt === '.png' || srcExt === '.jpg') && src != spritesInAtlasSrc) {
                return false;
            }
        }
        return true;
    }
    fse.copy(sourceAssetsPath, destAssetsPath, {filter: filterFn}, callback);
};

var compileHTML = function(callback) {
    fse.ensureDirSync(outDirJS);
    var src = convertJsList(fs.readFileSync(sourceIndexPath), 'game.min.js');
    fs.writeFile(path.join(outDirJS, 'index.html'), src, 'utf8', callback);
};

var getNWJSPackageJSON = function() {
    var nwjsPackage = JSON.parse(JSON.stringify(nwjsPackageJsonTemplate));
    nwjsPackage.version = packageJson.version;
    nwjsPackage.name = packageJson.name;
    return JSON.stringify(nwjsPackage);
};

var compileJS = function(callback) {
    fse.ensureDirSync(outDirJS);
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
    fs.writeFile(outputPath, compiledJS, 'utf8', callback);
};

var createNWJSZip = function(callback) {
    console.log('creating nw.js package');
    fse.ensureDirSync(outDirNWJS);
    
    var archive = startZipping(path.join(outDirNWJS, 'package.nw'));

    // append source files
    archive.directory(outDirJS, '/');

    // append package.json for nw.js
    archive.append(getNWJSPackageJSON(), {name: 'package.json'});

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    var ret = archive.finalize().then(function() {
        if (callback !== undefined) {
            callback(null);
        }
    });
};

var appendNWJSZipToNWExe = function(callback) {
    if (process.platform !== 'win32') {
        console.log('Creating nw.js based exe on other platforms than Windows not supported.');
        return;
    }
    var nwpath = nwfindpath();
    var nwSourceDir = path.dirname(nwpath);
    var packageNwSourcePath = path.join(outDirNWJS, 'package.nw');

    var exeOutDir = path.join(outDirNWJS, 'win');
    if (fs.existsSync(exeOutDir)) {
        fse.removeSync(exeOutDir);
    }
    fse.copy(nwSourceDir, exeOutDir, function() {
        var nwExePath = path.join(exeOutDir, 'nw.exe');
        var outputExeName = packageJson.name + '.exe';
        var outputExePath = path.join(exeOutDir, outputExeName);

        // Alternative: just copy the package.nw into place and rename the exe.
        //fse.copySync(packageNwSourcePath + path.join(exeOutDir, 'package.nw');
        //fse.moveSync(nwExePath, outputExePath);

        // Combine the binaries:
        execSync('copy /b nw.exe+..\\package.nw ' + outputExeName,
                 { cwd: exeOutDir });
        fse.removeSync(nwExePath);

        if (callback !== undefined) {
            callback(null);
        }
    });
};

var updateCordovaProject = function(callback) {
    if (!fs.existsSync(cordovaDir)) {
        console.log('Cordova project not initialized');
        return;
    }

    const compileUtils = require('./compile-utils.js');

    compileUtils.updateCordovaPackageJSON();
    compileUtils.updateCordovaConfigXML();
    compileUtils.updateCordovaWWW(callback);
};

var args = process.argv.slice(2);
var onlyJS = false;
if (args.length > 0 && args[0] == '--only-js') {
    onlyJS = true;
}

if (onlyJS) {
    compileJS(function() {});
} else {
    async.parallel([
        copyAssets,
        compileHTML,
        compileJS
    ], function(err) {
        if (err) {
            console.error(err);
            return;
        }
        updateCordovaProject();
        createNWJSZip(function(err) {
            if (err) {
                console.error(err);
                return;
            }
            appendNWJSZipToNWExe();
        });
    });
}
