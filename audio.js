'use strict';

/**
 * An object representing one audio sample.
 * @param {string} filename Name of the audio file without a file extension. Assumes that the audio file is located
 * in Audio.audioPath.
 * @param {boolean=} isLooping Whether the sample should loop when played. Defaults to false.
 * @param {Array.<string>} fileExtensions Array of extensions. Defaults to ogg and mp3, which should be enough for
 * cross-browser compatibility.
 * @constructor
 */
var Audio = function(filename, isLooping, fileExtensions) {
    if (isLooping === undefined) {
        isLooping = false;
    }
    if (fileExtensions === undefined) {
        fileExtensions = ['ogg', 'mp3'];
    }
    this.loaded = false;
    this.playWhenLoaded = false;
    this.audio = document.createElement('audio');
    this.audio.loop = isLooping;
    this.filenames = [];
    for (var i = 0; i < fileExtensions.length; ++i) {
        this.filenames.push(filename + '.' + fileExtensions[i]);
    }
    this.addSourcesTo(this.audio);
    this.clones = [];
};

/**
 * Path for audio files. Set this before creating any Audio objects.
 */
Audio.audioPath = 'assets/sounds/';

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
 * Play a clone of this sample. Will not affect other clones, and playback can not be stopped.
 */
Audio.prototype.playClone = function () {
    if (this.audio.readyState < 4) {
        return;
    }
    for (var i = 0; i < this.clones.length; ++i) {
        if (this.clones[i].ended) {
            this.clones[i].currentTime = 0;
            this.clones[i].play();
            return;
        }
    }
    var clone = document.createElement('audio');
    this.addSourcesTo(clone);
    this.clones.push(clone);
    clone.play();
};

/**
 * Play this sample when it is ready. Use only if only one copy of this sample is going to play simultaneously.
 */
Audio.prototype.play = function () {
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
