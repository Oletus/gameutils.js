const htmlparser = require("htmlparser2");
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

var argv = require('yargs').argv;

const rootDir = path.join(__dirname, '..');

const packageJson = require(path.join(rootDir, 'package.json'));
const templateNpmScripts = require(path.join(rootDir, 'tools/template-files/npm-scripts.json'));

const checkValidGameName = function(name) {
    var gameDir = path.join(rootDir, name);
    if (name === undefined) {
        console.error('possible arguments: --name <game name> [--template threejs]');
        return false;
    } else if (name === 'out' || name === 'assets' || name === 'src' || name === 'tools' || name === 'unit_tests' || name === 'examples' || name === 'node_modules') {
        console.error('--name parameter is reserved and can not be used!');
        return false;
    } else if (fs.existsSync(gameDir)) {
        console.error('game directory ' + gameDir + ' already exists');
        return false;
    }
    return true;
};

const createTemplateDirs = function(gameDir) {
    fse.ensureDirSync(gameDir);
    fse.ensureDirSync(path.join(gameDir, 'assets'));
    fse.ensureDirSync(path.join(gameDir, 'assets/audio'));
    fse.ensureDirSync(path.join(gameDir, 'assets/fonts'));
    fse.ensureDirSync(path.join(gameDir, 'assets/gfx'));
    fse.ensureDirSync(path.join(gameDir, 'assets/models'));
};

const copyPackageJSON = function(gameDir, gameName) {
    packageJsonCopy = JSON.parse(JSON.stringify(packageJson));
    packageJsonCopy.scripts = JSON.parse(JSON.stringify(templateNpmScripts));
    packageJsonCopy.name = gameName;
    packageJsonCopy.version = '0.1.0';
    packageJsonCopy.description = 'Game project created using gameutils.js';
    delete packageJsonCopy.repository;
    delete packageJsonCopy.license;
    fs.writeFileSync(path.join(gameDir, 'package.json'), JSON.stringify(packageJsonCopy, null, 2));
};

const copyUsefulExampleAssets = function(gameDir) {
    fse.copy(path.join(rootDir, 'examples/assets/gfx/bitmapfont-medium.png'), path.join(gameDir, 'assets/gfx/bitmapfont-medium.png'), function(err) {
        if (err) {
            return console.error(err);
        }
    });
    fse.copy(path.join(rootDir, 'examples/assets/gfx/bitmapfont-tiny.png'), path.join(gameDir, 'assets/gfx/bitmapfont-tiny.png'), function(err) {
        if (err) {
            return console.error(err);
        }
    });
};

const copyTemplateFiles = function(gameDir) {
    fse.copy(path.join(rootDir, 'tools/template-files/tools'), path.join(gameDir, 'tools'), function(err) {
        if (err) {
            return console.error(err);
        }
    });
    fse.copy(path.join(rootDir, 'tools/template-files/gitignore.txt'), path.join(gameDir, '.gitignore'), function(err) {
        if (err) {
            return console.error(err);
        }
    });
};

const putInlineJSToFile = function(htmlContents, targetHTMLPath, targetJSPath) {
    let addedScriptRef = false;
    let htmlOutput = [''];
    let scriptOutput = [''];
    let inScript = false;
    const parser = new htmlparser.Parser({
        onopentag: function(name, attribs) {
            if (name == 'script' && attribs['src'] === undefined) {
                if (addedScriptRef) {
                    throw new Error('Multiple inline scripts not supported.');
                }
                let relativeJSPath = path.relative(path.dirname(targetHTMLPath), targetJSPath);
                relativeJSPath = relativeJSPath.replace(/\\/g, "/");
                htmlOutput.push('<script src="' + relativeJSPath + '">');
                addedScriptRef = true;
                inScript = true;
            } else {
                let tagOutput = '<' + name;
                for (attr in attribs) {
                    tagOutput += ' ' + attr + '="' + attribs[attr] + '"';
                }
                tagOutput += '>';
                htmlOutput.push(tagOutput);
            }
        },
        onclosetag: function(name) {
            htmlOutput.push('</' + name + '>')
            inScript = false;
        },
        ontext: function(text) {
            if (inScript) {
                // TODO: Replace import paths in script
                scriptOutput.push(text);
            } else {
                htmlOutput.push(text)
            }
        },
        onprocessinginstruction: function(name, data) {
            htmlOutput.push('<' + data + '>')
        }
    }, {decodeEntities: false});
    parser.write(htmlContents);
    parser.end();
    fs.writeFileSync(targetJSPath, scriptOutput.join(''));
    fs.writeFileSync(targetHTMLPath, htmlOutput.join(''));
};

const copyTemplateIndex = function(gameDir, templateName) {
    fse.ensureDirSync(path.join(gameDir, 'src'));
    let htmlContents = fs.readFileSync(path.join(rootDir, templateName));
    htmlContents = putInlineJSToFile(htmlContents, path.join(gameDir, 'index.html'), path.join(gameDir, 'src/game.js'));
};

const copySrcToGame = function() {
    fse.copy(path.join(rootDir, 'src'), path.join(gameDir, 'src'), function(err) {
        if (err) {
            return console.error(err);
        }
    });
};

if (checkValidGameName(argv.name)) {
    const gameDir = path.join(rootDir, argv.name);
    createTemplateDirs(gameDir);
    copySrcToGame(gameDir);
    copyPackageJSON(gameDir, argv.name);
    copyUsefulExampleAssets(gameDir);
    copyTemplateFiles(gameDir);
    
    const useThreeJS = (argv.template !== undefined && argv.template === 'threejs');
    if (useThreeJS) {
        copyTemplateIndex(gameDir, 'game-threejs-template.html');
    } else {
        copyTemplateIndex(gameDir, 'game-template.html');
    }
}
