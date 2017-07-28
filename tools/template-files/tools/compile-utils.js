const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const htmlparser = require('htmlparser2');

const configPaths = require(path.join(__dirname, 'tools-config.json')).paths;

const packageJson = require(path.join(__dirname, configPaths.rootDir, 'package.json'));

const rootDir = path.join(__dirname, configPaths.rootDir);
const compilerPath = path.join(__dirname, configPaths.rootDir, 'node_modules/google-closure-compiler/compiler.jar');
const sourceAssetsPath = path.join(__dirname, configPaths.rootDir, configPaths.sourceAssetsPath);
const sourceIndexPath = path.join(__dirname, configPaths.rootDir, configPaths.sourceIndexPath);
const cordovaDir = path.join(__dirname, configPaths.rootDir, configPaths.cordovaDir);
const cordovaWwwDir = path.join(cordovaDir, 'www');
const outDirJS = path.join(__dirname, configPaths.rootDir, configPaths.outDir, configPaths.outDirJS);
const outDirNWJS = path.join(__dirname, configPaths.rootDir, configPaths.outDir, configPaths.outDirNWJS);

exports.paths = {
    rootDir: rootDir,
    compilerPath: compilerPath,
    sourceAssetsPath: sourceAssetsPath,
    sourceIndexPath: sourceIndexPath,
    cordovaDir: cordovaDir,
    outDirJS: outDirJS,
    outDirNWJS: outDirNWJS
};

var updateCordovaPackageJSON = function() {
    // Fill in some more config values
    var cordovaPackageJson = require(path.join(cordovaDir, 'package.json'));

    cordovaPackageJson.version = packageJson.version;
    if (packageJson.description) {
        cordovaPackageJson.description = packageJson.description;
    } else {
        cordovaPackageJson.description = '?';
    }
    if (packageJson.license) {
        cordovaPackageJson.license = packageJson.license;
    } else {
        cordovaPackageJson.license = '?';
    }
    if (packageJson.author) {
        cordovaPackageJson.author = packageJson.author.name;
    } else {
        cordovaPackageJson.author = '?';
    }

    fs.writeFileSync(path.join(cordovaDir, 'package.json'), JSON.stringify(cordovaPackageJson, null, '    '));
};

var updateCordovaConfigXML = function() {
    var configXMLPath = path.join(cordovaDir, 'config.xml');

    var xmlContents = fs.readFileSync(configXMLPath);

    var pushTextInTag = true;
    
    var lastOpenTagIndex;

    var xmlOutput = [''];
    var parser = new htmlparser.Parser({
        onopentag: function(name, attribs) {
            lastOpenTagIndex = xmlOutput.length;
            if (name == 'description' && packageJson.description) {
                xmlOutput.push('<description>');
                xmlOutput.push('\n' + packageJson.description + '\n');
                pushTextInTag = false;
            } else if (name == 'author' && packageJson.author) {
                xmlOutput.push('<author email="' + packageJson.author.email + '" href="' + packageJson.author.url + '">');
                xmlOutput.push('\n' + packageJson.author.name + '\n');
                pushTextInTag = false;
            } else {
                var tagOutput = '<' + name;
                for (attr in attribs) {
                    tagOutput += ' ' + attr + '="' + attribs[attr] + '"';
                }
                tagOutput += '>';
                xmlOutput.push(tagOutput);
            }
        },
        onclosetag: function(name) {
            if (lastOpenTagIndex === xmlOutput.length - 1) {
                var lastTag = xmlOutput[lastOpenTagIndex];
                lastTagClosed = lastTag.substring(0, lastTag.length - 1) + ' />';
                xmlOutput[lastOpenTagIndex] = lastTagClosed;
            } else {
                xmlOutput.push('</' + name + '>')
            }
            pushTextInTag = true;
        },
        ontext: function(text) {
            if (pushTextInTag) {
                xmlOutput.push(text);
            }
        },
        onprocessinginstruction: function(name, data) {
            xmlOutput.push('<' + data + '>');
        }
    }, {decodeEntities: false, xmlMode: true});
    parser.write(xmlContents);
    parser.end();
    fs.writeFileSync(configXMLPath, xmlOutput.join(''));
};

var updateCordovaWWW = function(callback) {
    fse.removeSync(cordovaWwwDir);
    
    fse.copy(outDirJS, cordovaWwwDir, callback);
};

exports.updateCordovaPackageJSON = updateCordovaPackageJSON;
exports.updateCordovaConfigXML = updateCordovaConfigXML;
exports.updateCordovaWWW = updateCordovaWWW;
