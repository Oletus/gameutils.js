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
    Audio.createdCount++;
    this.loaded = false; // Used purely for purposes of marking the audio loaded.
    this.audio = document.createElement('audio');
    this.filenames = [];
    this.playWhenReady = null; // Event listener to start playing when audio is ready.
    var canDetermineLoaded = false;
    for (var i = 0; i < fileExtensions.length; ++i) {
        this.filenames.push(filename + '.' + fileExtensions[i]);
        if (fileExtensions[i] === 'ogg' && !canDetermineLoaded) {
            canDetermineLoaded = this.audio.canPlayType('audio/ogg;codecs="vorbis"') == 'probably';
        }
        if (fileExtensions[i] === 'mp3' && !canDetermineLoaded) {
            canDetermineLoaded = this.audio.canPlayType('audio/mpeg') == 'probably';
        }
    }
    if (canDetermineLoaded) {
        var that = this;
        var markLoaded = function() {
            that._markLoaded();
        }
        this.audio.addEventListener('canplay', markLoaded);
        // Can never be sure that the audio will load. Fake loaded after 10 seconds to unblock loading bar.
        setTimeout(markLoaded, 10000);
    } else {
        this._markLoaded();
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
 * How many Audio objects have been created.
 */
Audio.createdCount = 0;
/**
 * How many Audio objects have been fully loaded.
 */
Audio.loadedCount = 0;

/**
 * @return {number} Amount of Audio objects that have been fully loaded per amount that has been created.
 */
Audio.loadedFraction = function() {
    return Audio.loadedCount / Audio.createdCount;
};

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
        if (this.playWhenReady !== null) {
            this.audio.removeEventListener('canplay', this.playWhenReady);
            this.playWhenReady = null;
        }
        this.audio.play();
        this._markLoaded();
    } else if (this.playWhenReady === null) {
        var that = this;
        this.playWhenReady = function() {
            that.audio.play();
            that._markLoaded();
        }
        this.audio.addEventListener('canplay', this.playWhenReady);
    }
};

/**
 * Stop playing this sample.
 */
Audio.prototype.stop = function () {
    if (this.playWhenReady !== null) {
        this.audio.removeEventListener('canplay', this.playWhenReady);
        this.playWhenReady = null;
    }
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
        if (this.clones[i].ended || (this.clones[i].readyState == 4 && this.clones[i].paused)) {
            this.clones[i].currentTime = 0;
            return this.clones[i];
        }
    }
    var clone = document.createElement('audio');
    this.addSourcesTo(clone);
    this.clones.push(clone);
    return clone;
};

/**
 * Mark this audio sample loaded.
 * @protected
 */
Audio.prototype._markLoaded = function() {
    if (this.loaded) {
        return;
    }
    this.loaded = true;
    Audio.loadedCount++;
};
