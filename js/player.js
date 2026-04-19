import {
  getStationById,
  getStationIndex,
  getStationTracks,
  initialPlayerState,
  stations
} from "./stations.js";

const state = { ...initialPlayerState };
const audio = new Audio();
audio.preload = "metadata";
audio.volume = state.volume;

let listeners = {
  onStateChange: () => {},
  onStationChange: () => {},
  onTrackChange: () => {}
};

const shuffleState = new Map();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCurrentStation() {
  return getStationById(state.currentStationId);
}

function getCurrentPlaylist() {
  return getStationTracks(getCurrentStation());
}

function createShuffledOrder(length) {
  const order = Array.from({ length }, (_, index) => index);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  return order;
}

function getShuffleState(stationId, playlistLength) {
  const existing = shuffleState.get(stationId);

  if (existing && existing.order.length === playlistLength) {
    return existing;
  }

  const nextState = {
    order: createShuffledOrder(playlistLength),
    pointer: 0
  };

  shuffleState.set(stationId, nextState);
  return nextState;
}

function syncShufflePointer(stationId, trackIndex, playlistLength) {
  const stationShuffle = getShuffleState(stationId, playlistLength);
  const existingPointer = stationShuffle.order.indexOf(trackIndex);

  if (existingPointer >= 0) {
    stationShuffle.pointer = existingPointer;
    return;
  }

  stationShuffle.order = [trackIndex, ...stationShuffle.order.filter((index) => index !== trackIndex)];
  stationShuffle.pointer = 0;
}

function getRandomTrackIndex(stationId, playlistLength) {
  const stationShuffle = getShuffleState(stationId, playlistLength);

  if (playlistLength <= 1) {
    stationShuffle.pointer = 0;
    return 0;
  }

  stationShuffle.order = createShuffledOrder(playlistLength);
  stationShuffle.pointer = 0;
  return stationShuffle.order[0];
}

function stepShuffle(stationId, playlistLength, direction) {
  const stationShuffle = getShuffleState(stationId, playlistLength);

  if (playlistLength <= 1) {
    stationShuffle.pointer = 0;
    return 0;
  }

  const nextPointer = stationShuffle.pointer + direction;

  if (nextPointer >= 0 && nextPointer < stationShuffle.order.length) {
    stationShuffle.pointer = nextPointer;
    return stationShuffle.order[stationShuffle.pointer];
  }

  stationShuffle.order = createShuffledOrder(playlistLength);
  stationShuffle.pointer = direction > 0 ? 0 : stationShuffle.order.length - 1;
  return stationShuffle.order[stationShuffle.pointer];
}

export function getCurrentTrack() {
  const playlist = getCurrentPlaylist();
  return playlist[state.currentTrackIndex] ?? playlist[0];
}

function notifyAll() {
  listeners.onStateChange(getPlayerState());
  listeners.onStationChange(getCurrentStation(), getPlayerState());
  listeners.onTrackChange(getCurrentTrack(), getCurrentStation(), getPlayerState());
}

function loadCurrentTrack(shouldAutoplay = state.isPlaying) {
  const track = getCurrentTrack();
  if (!track) {
    return;
  }

  audio.src = track.audioSrc;
  audio.load();
  state.progress = 0;
  state.duration = typeof track.duration === "number" ? track.duration : 0;

  if (shouldAutoplay) {
    play();
  } else {
    state.isPlaying = false;
    listeners.onStateChange(getPlayerState());
    listeners.onTrackChange(track, getCurrentStation(), getPlayerState());
  }
}

function play() {
  audio
    .play()
    .then(() => {
      state.isPlaying = true;
      listeners.onStateChange(getPlayerState());
    })
    .catch(() => {
      state.isPlaying = false;
      listeners.onStateChange(getPlayerState());
    });
}

function pause() {
  audio.pause();
  state.isPlaying = false;
  listeners.onStateChange(getPlayerState());
}

export function initPlayer(customListeners = {}) {
  listeners = { ...listeners, ...customListeners };

  audio.addEventListener("loadedmetadata", () => {
    state.duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    listeners.onStateChange(getPlayerState());
  });

  audio.addEventListener("timeupdate", () => {
    state.progress = audio.currentTime || 0;
    if (!state.duration && Number.isFinite(audio.duration)) {
      state.duration = audio.duration;
    }
    listeners.onStateChange(getPlayerState());
  });

  audio.addEventListener("durationchange", () => {
    state.duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    listeners.onStateChange(getPlayerState());
  });

  audio.addEventListener("ended", () => {
    nextTrack();
  });

  loadCurrentTrack(false);
  notifyAll();
}

export function setStation(stationId, options = {}) {
  const station = getStationById(stationId);
  const previousStationId = state.currentStationId;
  const shouldAutoplay = options.autoplay ?? state.isPlaying;
  const playlist = getStationTracks(station);

  const nextTrackIndex =
    typeof options.trackIndex === "number"
      ? clamp(options.trackIndex, 0, playlist.length - 1)
      : getRandomTrackIndex(station.id, playlist.length);

  state.currentStationId = station.id;
  state.currentTrackIndex = nextTrackIndex;
  syncShufflePointer(station.id, state.currentTrackIndex, playlist.length);

  loadCurrentTrack(shouldAutoplay);

  if (previousStationId !== station.id) {
    listeners.onStationChange(station, getPlayerState());
  }

  listeners.onTrackChange(getCurrentTrack(), station, getPlayerState());
  listeners.onStateChange(getPlayerState());
}

export function togglePlayback() {
  if (audio.paused) {
    play();
    return;
  }

  pause();
}

export function nextTrack() {
  const playlist = getCurrentPlaylist();
  state.currentTrackIndex = stepShuffle(state.currentStationId, playlist.length, 1);
  loadCurrentTrack(state.isPlaying);
  listeners.onTrackChange(getCurrentTrack(), getCurrentStation(), getPlayerState());
  listeners.onStateChange(getPlayerState());
}

export function previousTrack() {
  const playlist = getCurrentPlaylist();
  state.currentTrackIndex = stepShuffle(state.currentStationId, playlist.length, -1);
  loadCurrentTrack(state.isPlaying);
  listeners.onTrackChange(getCurrentTrack(), getCurrentStation(), getPlayerState());
  listeners.onStateChange(getPlayerState());
}

export function seekTo(ratio) {
  const duration = audio.duration || state.duration || 0;
  if (!duration) {
    return;
  }

  const nextTime = clamp(ratio, 0, 1) * duration;
  audio.currentTime = nextTime;
  state.progress = nextTime;
  listeners.onStateChange(getPlayerState());
}

export function setVolume(value) {
  state.volume = clamp(value, 0, 1);
  audio.volume = state.volume;
  listeners.onStateChange(getPlayerState());
}

export function tuneByOffset(offset) {
  const currentIndex = getStationIndex(state.currentStationId);
  const nextIndex = clamp(currentIndex + offset, 0, stations.length - 1);
  setStation(stations[nextIndex].id, { autoplay: state.isPlaying });
}

export function getPlayerState() {
  return { ...state };
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "--:--";
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}
