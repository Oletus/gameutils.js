const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const packageJson = require(path.join(__dirname, configPaths.rootDir, 'package.json'));

const compileUtils = require('./compile-utils.js');
const cordovaDir = compileUtils.paths.cordovaDir;

const gitignoreTemplate = [
    "#Cordova www directory is updated from original sources by the compile-js script.",
    "/www",
    "",
    "#Cordova build artifacts.",
    "/platforms",
    "/plugins"
].join("\n");

/**
 * @param {string} id Reverse URL style id for the project.
 */
var createCordovaProject = function(id, name) {
    fse.ensureDirSync(cordovaDir);
    execSync('cordova create . ' + id + ' ' + name, { cwd: cordovaDir });
    fs.writeFileSync(path.join(cordovaDir, '.gitignore'), gitignoreTemplate);
    
    compileUtils.updateCordovaPackageJSON();
    compileUtils.updateCordovaConfigXML();
    compileUtils.updateCordovaWWW();
};

const argv = require('yargs')
    .usage('Usage: --id [com.example.game]')
    .demandOption(['id'])
    .argv;


createCordovaProject(argv.id, packageJson.name);