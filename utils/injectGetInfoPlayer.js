var webContents, initialized;

var player = {
  isPaused: true,
  volumePercent: 0,
  seekbarCurrentPosition: 0,
  seekbarCurrentPositionHuman: "0:00",
  likeStatus: "INDIFFERENT",
  repatType: "NONE"
};

var track = {
  author: "",
  title: "",
  album: "",
  cover: "",
  duration: 0,
  durationHuman: "0:00",
  statePercent: 0,
  url: "",
  id: "",
  isVideo: false,
  isAdvertisement: false
};

function init(view) {
  webContents = view.webContents;
  initialized = true;
}

function getAllInfo() {
  return {
    player: getPlayerInfo(),
    track: getTrackInfo()
  };
}

function getPlayerInfo() {
  if (webContents !== undefined) {
    isPaused(webContents);
    getVolume(webContents);
    getSeekbarPosition(webContents);
    getLikeStatus(webContents);
    getRepeatType(webContents);
  }
  return player;
}

function getTrackInfo() {
  if (webContents !== undefined) {
    getAuthor(webContents);
    getTitle(webContents);
    getAlbum(webContents);
    getCover(webContents);
    getDuration(webContents);
    getUrl(webContents);
    setPercent(player.seekbarCurrentPosition, track.duration);
    isVideo(webContents);
    isAdvertisement(webContents);
  }
  return track;
}

function isPaused(webContents) {
  webContents
    .executeJavaScript(`document.getElementsByTagName('video')[0].paused;`)
    .then(isPaused => {
      debug(`Is paused: ${isPaused}`);
      player.isPaused = isPaused;
    });
}

function getTitle(webContents) {
  webContents
    .executeJavaScript(
      `document.getElementsByClassName('title ytmusic-player-bar')[0].innerText;`
    )
    .then(title => {
      debug(`Title is: ${title}`);
      track.title = title;
    });
}

function getDuration(webContents) {
  webContents
    .executeJavaScript(
      `document.getElementById('progress-bar').getAttribute('aria-valuemax');`
    )
    .then(duration => {
      debug(`Duration is: ${parseInt(duration)}`);
      track.duration = parseInt(duration);
      track.durationHuman = convertToHuman(parseInt(duration));
    });
}

/**
 * Get Like status
 * LIKE | DISLIKE | INDIFFERENT
 * @param {*} webContents
 */
function getLikeStatus(webContents) {
  webContents
    .executeJavaScript(
      `document.getElementById('like-button-renderer').getAttribute('like-status');`
    )
    .then(likeStatus => {
      debug(`Like status is: ${likeStatus}`);
      player.likeStatus = likeStatus;
    });
}

/**
 * GET CURRENT SEEK BAR POSITION
 * @param {*} webContents
 */
function getSeekbarPosition(webContents) {
  webContents
    .executeJavaScript(
      `document.getElementById('progress-bar').getAttribute('aria-valuenow');`
    )
    .then(position => {
      debug(`Seekbar position is: ${parseInt(position)}`);
      player.seekbarCurrentPosition = parseInt(position);
      player.seekbarCurrentPositionHuman = convertToHuman(parseInt(position));
    });
}

function getVolume(webContents) {
  webContents
    .executeJavaScript(
      `document.getElementsByClassName('volume-slider style-scope ytmusic-player-bar')[0].getAttribute('value');`
    )
    .then(volume => {
      debug(`Volume % is: ${parseInt(volume)}`);
      player.volumePercent = parseInt(volume);
    });
}
// FIX
function getAuthor(webContents) {
  webContents
    .executeJavaScript(
      `
    var bar = document.getElementsByClassName('subtitle ytmusic-player-bar')[0];
				  
    if (bar.getElementsByClassName('yt-simple-endpoint yt-formatted-string')[0]) {
      title = bar.getElementsByClassName('yt-simple-endpoint yt-formatted-string')[0].innerText;
    } else if (bar.getElementsByClassName('byline ytmusic-player-bar')[0]) {
      title = bar.getElementsByClassName('byline ytmusic-player-bar')[0].innerText;
    }
    title;
            `
    )
    .then(author => {
      debug(`Author is: ${author}`);
      track.author = author;
    });
}

function getAlbum(webContents) {
  webContents
    .executeJavaScript(
      `
      var album = '';
      var player_bar = document.getElementsByClassName("byline ytmusic-player-bar")[0].children;
      var arr_player_bar = Array.from(player_bar);
      
      arr_player_bar.forEach( function(data, index) {
      
       if (data.getAttribute('href') != null && data.getAttribute('href').includes('browse')) {
          album = data.innerText;
       }
      } )
      
      album
      `
    )
    .then(album => {
      debug(`Album is: ${album}`);
      track.album = album;
    });
}

function getCover(webContents) {
  webContents
    .executeJavaScript(
      `
        var cover;

        var thumbnail = document.getElementsByClassName('thumbnail ytmusic-player no-transition')[0];
        var image = thumbnail.getElementsByClassName('yt-img-shadow')[0].src;

        cover = image;

        if (cover.includes("data:image")) {
          cover = document.getElementsByClassName("image ytmusic-player-bar")[0].src
        }

        cover;
      `
    )
    .then(cover => {
      debug(`Cover is: ${cover}`);
      track.cover = cover;
    });
}

function getRepeatType(webContents) {
  webContents
    .executeJavaScript(
      `document.getElementsByTagName("ytmusic-player-bar")[0].getAttribute("repeat-mode_");`
    )
    .then(repeatType => {
      debug(`Repeat type is: ${repeatType}`);
      player.repatType = repeatType;
    });
}

function getUrl(webContents) {
  webContents
    .executeJavaScript(
      `document.getElementsByClassName('ytp-title-link yt-uix-sessionlink')[0].href`
    )
    .then(url => {
      if (url) {
        track.url = url;

        var newUrl = new URL(url);
        var searchParams = new URLSearchParams(newUrl.search);

        track.id = searchParams.get("v");
        debug(`Track Url: ${track.url}`);
        debug(`Track id: ${track.id}`);
      }
    });
}

function isVideo(webContents) {
  webContents
    .executeJavaScript(
      `document.getElementById('player').attributes['video-mode_']`
    )
    .then(isVideo => {
      track.isVideo = !!isVideo;
      debug(`Is video: ${track.isVideo}`);
    });
}

function isAdvertisement(webContents) {
  webContents
    .executeJavaScript(
      `document.getElementsByClassName('advertisement ')[0].hasAttribute('hidden')`
    )
    .then(isAdvertisement => {
      track.isAdvertisement = !isAdvertisement;
      debug(`Is advertisement: ${track.isAdvertisement}`);
    });
}

function convertToHuman(time) {
  var _aux = time;
  var _minutes = 0;
  var _seconds = 0;

  while (_aux >= 60) {
    _aux = _aux - 60;
    _minutes++;
  }

  _seconds = _aux;

  if (_seconds < 10) {
    return _minutes + ":0" + _seconds;
  }
  return _minutes + ":" + _seconds;
}

function setPercent(px, ptotal) {
  track.statePercent = px / ptotal;
}

function hasInitialized() {
  return initialized;
}

function firstPlay(webContents) {
  webContents.executeJavaScript(
    `
      var carousel = document.getElementsByClassName('carousel')[0];
      var firstChild = carousel.querySelector('#items').children[0];
      var playButton = firstChild.querySelector('#play-button')
      
      playButton.click();`
  );
}

function debug(data) {
  // console.log(data);
}

module.exports = {
  init: init,
  getAllInfo: getAllInfo,
  getPlayerInfo: getPlayerInfo,
  getTrackInfo: getTrackInfo,
  hasInitialized: hasInitialized,
  firstPlay: firstPlay
};
