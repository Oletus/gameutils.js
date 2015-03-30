'use strict';

/**
 * An object representing one audio sample.
 * @param {string} filename Name of the audio file without a file extension. Assumes that the audio file is located
 * in Audio.audioPath.
 * @param {Array.<string>} fileExtensions Array of extensions. Defaults to ogg and mp3, which should be enough for
 * cross-browser compatibility. The default file extensions are configurable through Audio.defaultExtensions.
 * @constructor
 */
var Audio = function(filename, fileExtensions) {
    if (fileExtensions === undefined) {
        fileExtensions = Audio.defaultExtensions;
    }
    this.loaded = false;
    this.playWhenLoaded = false;
    this.audio = document.createElement('audio');
    this.filenames = [];
    for (var i = 0; i < fileExtensions.length; ++i) {
        this.filenames.push(filename + '.' + fileExtensions[i]);
    }
    this.addSourcesTo(this.audio);
    this.clones = [];
    this.ensureOneClone();
};

/**
 * Path for audio files. Set this before creating any Audio objects.
 */
Audio.audioPath = 'assets/sounds/';

/**
 * Default file extensions. Set this before creating any Audio objects. Ogg and mp3 are enough for cross-browser
 * compatibility.
 */
Audio.defaultExtensions = ['ogg', 'mp3'];

/**
 * @param {HTMLAudioElement} audioElement Element to add audio sources to.
 * @protected
 */
Audio.prototype.addSourcesTo = function(audioElement) {
    for (var i = 0; i < this.filenames.length; ++i) {
        var source = document.createElement('source');
        source.src = Audio.audioPath + this.filenames[i];
        audioElement.appendChild(source);
    }
};

/**
 * Play a clone of this sample. Will not affect other clones. Playback will not loop and playback can not be stopped.
 */
Audio.prototype.play = function () {
    if (this.audio.readyState < 4) {
        return;
    }
    var clone = this.ensureOneClone();
    clone.play();
    this.ensureOneClone(); // Make another clone ready ahead of time.
};

/**
 * Play this sample when it is ready. Use only if only one copy of this sample is going to play simultaneously.
 * Playback can be stopped by calling stop().
 * @param {boolean=} loop Whether the sample should loop when played. Defaults to false.
 */
Audio.prototype.playSingular = function (loop) {
    if (loop === undefined) {
        this.audio.loop = false;
    } else {
        this.audio.loop = loop;
    }
    if (this.audio.readyState === 4) {
        this.audio.play();
    } else {
        var that = this.audio;
        this.audio.oncanplay = function() {
            that.play();
        };
    }
};

/**
 * Stop playing this sample.
 */
Audio.prototype.stop = function () {
    this.audio.pause();
    this.audio.currentTime = 0;
};

/**
 * Ensure that there is one clone available for playback and return it.
 * @protected
 * @return {HTMLAudioElement} Clone that is ready for playback.
 */
Audio.prototype.ensureOneClone = function() {
    for (var i = 0; i < this.clones.length; ++i) {
        if (this.clones[i].ended) {
            this.clones[i].currentTime = 0;
            return this.clones[i];
        }
    }
    var clone = document.createElement('audio');
    this.addSourcesTo(clone);
    this.clones.push(clone);
    return clone;
};
