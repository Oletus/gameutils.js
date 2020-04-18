
// Legacy - these functions are basically only useful for polyfilling on very old browsers.

/**
 * Request fullscreen on a given element.
 * @param {HTMLElement} elem Element to make fullscreen.
 */
const requestFullscreen = function(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
};

/**
 * Exit fullscreen.
 */
const exitFullscreen = function() {
    if(document.exitFullscreen) {
        document.exitFullscreen();
    } else if(document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if(document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
};

/**
 * @param {function} listener Listener to call when fullscreen state changes.
 */
const addFullscreenChangeListener = function(listener) {
    document.addEventListener('fullscreenchange', listener);
    document.addEventListener('mozfullscreenchange', listener);
    document.addEventListener('webkitfullscreenchange', listener);
};

/**
 * @return {boolean} True if document is currently fullscreen.
 */
const isFullscreen = function() {
    if (document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitCurrentFullScreenElement)
    {
        return true;
    }
    return false;
};

export { requestFullscreen, exitFullscreen, addFullscreenChangeListener, isFullscreen }
