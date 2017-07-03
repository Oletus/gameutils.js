gameutils.js
============

## A Head Start on JavaScript Game Development

Gameutils.js is a collection of helpers aimed at handling the tedious tasks of JavaScript game development.
It is not a framework, but rather a library of simple utilities that can be used independently of each other.

It is for people who like to work with code close to the platform level, but aims to make this as simple as possible.

It is especially well suited for game jams and similar events, with a focus on flexibility that enables the exploration
of new ideas.

It targets browsers that support modern APIs, and has been tested on Chrome, Firefox and Internet Explorer 11.

[Check out the examples!](http://oletus.github.io/gameutils.js/)

## Games created with these utilities

* [Totem Takedown](http://oletus.github.io/totemteardown/)
* [Panjandrum vs. Triebflügel](http://oletus.github.io/codename-x/)
* [Megatitan vs. Cthulhu](http://oletus.github.io/megatitan/)
* [The Everything Building](http://oletus.github.io/elevator/) - Ludum Dare 34 overall #2 ranked game
* [Laser Town](http://oletus.github.io/lasertown/)

## Tools

The utilities include some tools to automate common development tasks.

To install:

* Install [node.js](https://nodejs.org/en/) LTS version (tested with 6.10.2)
* Install [ffmpeg](https://www.ffmpeg.org/) and add it to PATH
* To use web2exe - install [web2exe Windows release](https://github.com/jyapayne/Web2Executable) and add it to PATH (tested with v0.5.4b Web2ExeWin-CMD)
* Run **npm install** in the directory where package.json is.

Note: use **cmd** for running gulp commands on Windows, NOT GitHub for Windows shell:

To start a game project (it will be created in a new folder under gameutils.js):

Step 1:
* **npm run game-from-template -- --name <game name>** - create a game based on the basic template.
* **npm run game-from-template -- --name <game name> --template threejs** - create a game based on the three.js template.

Step 2 (install tools for the game):
* In the newly created game folder, run **npm install**

Things you can do with the tools for a game project:

* **npm run ogg2mp3** - convert all ogg files under assets/audio to mp3.
* **npm run mp32ogg** - convert all mp3 files under assets/audio to ogg.
* **npm run compile** - compile the project as minified under out/js and creates an NW.JS package.
* **npm run compile_js** - same as above, but process only JS, not assets. Good for incremental updates.