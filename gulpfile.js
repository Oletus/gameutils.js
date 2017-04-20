var gulp = require('gulp');
var fs = require('fs');
var rename = require('gulp-rename');
var ncp = require('ncp');

var argv = require('yargs').argv;

var packageJson = require('./package.json');

// TODO: Could be nice if some more of the dependency tasks could be hidden from the user somehow.

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
};

var createTemplateDirs = function(gameName) {
    mkdirIfDoesntExist('./' + gameName + '/');
    mkdirIfDoesntExist('./' + gameName + '/assets/');
    mkdirIfDoesntExist('./' + gameName + '/assets/audio/');
    mkdirIfDoesntExist('./' + gameName + '/assets/fonts/');
    mkdirIfDoesntExist('./' + gameName + '/assets/gfx/');
    mkdirIfDoesntExist('./' + gameName + '/assets/models/');
};

var copyPackageJSON = function(gameName) {
    packageJsonCopy = JSON.parse(JSON.stringify(packageJson));
    packageJsonCopy.name = gameName;
    packageJsonCopy.version = '0.1';
    packageJsonCopy.description = 'Game project created using gameutils.js';
    delete packageJsonCopy.repository;
    delete packageJsonCopy.license;
    fs.writeFileSync('./' + gameName + '/package.json', JSON.stringify(packageJsonCopy, null, 2));
};

var copyUsefulExampleAssets = function(gameName) {
    ncp('./examples/assets/gfx/bitmapfont-medium.png', './' + gameName + '/assets/gfx/bitmapfont-medium.png', function(err) {
        if (err) {
            return console.error(err);
        }
    });
    ncp('./examples/assets/gfx/bitmapfont-tiny.png', './' + gameName + '/assets/gfx/bitmapfont-tiny.png', function(err) {
        if (err) {
            return console.error(err);
        }
    });
};

var copyTemplateFiles = function(gameName) {
    ncp('./tools/template-files/gulpfile.js', './' + gameName + '/gulpfile.js', function(err) {
        if (err) {
            return console.error(err);
        }
    });
    ncp('./tools/template-files/gitignore.txt', './' + gameName + '/.gitignore', function(err) {
        if (err) {
            return console.error(err);
        }
    });
};

gulp.task('init-game-from-template', function(callback) {
    var gameName = argv.name;
    if (!checkValidGameName(gameName)) {
        return;
    }
    createTemplateDirs(gameName);
    copyPackageJSON(gameName);
    copyUsefulExampleAssets(gameName);
    copyTemplateFiles(gameName);
    callback();
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
    ['copy-template', 'init-game-from-template'],
    copySrcToGame
);

gulp.task('game-from-threejs-template',
    ['copy-template-threejs', 'init-game-from-template'],
    copySrcToGame
);

gulp.task('default', ['web2exe']);
