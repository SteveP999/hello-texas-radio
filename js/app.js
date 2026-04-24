import { createDial } from "./dial.js";
import {
  getCurrentTrack,
  getPlayerState,
  initPlayer,
  nextTrack,
  previousTrack,
  seekTo,
  setStation,
  setVolume,
  togglePlayback
} from "./player.js";
import { createUI } from "./ui.js";
import {
  ensureStationPlaylistLoaded,
  getStationById,
  getStationIndex,
  initialPlayerState,
  stations
} from "./stations.js";

function syncStickyLayout() {
  const topbar = document.querySelector(".topbar");
  const stickyPlayer = document.getElementById("sticky-player");
  if (!topbar || !stickyPlayer) {
    return;
  }

  const topbarHeight = topbar.getBoundingClientRect().height;
  const stickyHeight = stickyPlayer.classList.contains("is-visible")
    ? stickyPlayer.getBoundingClientRect().height
    : 0;

  document.documentElement.style.setProperty("--topbar-height", `${topbarHeight}px`);
  document.documentElement.style.setProperty("--sticky-player-height", `${stickyHeight}px`);
}

async function loadStationBeforeSelect(stationId, autoplay) {
  await ensureStationPlaylistLoaded(stationId);
  setStation(stationId, { autoplay });
}

function getAdjacentStationId(offset) {
  const currentIndex = getStationIndex(getPlayerState().currentStationId);
  const nextIndex = Math.min(Math.max(currentIndex + offset, 0), stations.length - 1);
  return stations[nextIndex].id;
}

function stepStation(offset) {
  loadStationBeforeSelect(getAdjacentStationId(offset), getPlayerState().isPlaying);
}

const ui = createUI({
  onSelectStation: (stationId) => {
    loadStationBeforeSelect(stationId, getPlayerState().isPlaying);
  },
  onPlayStation: (stationId) => {
    loadStationBeforeSelect(stationId, true);
  },
  onTogglePlayback: () => togglePlayback(),
  onPreviousStation: () => stepStation(-1),
  onNextStation: () => stepStation(1),
  onPreviousTrack: () => previousTrack(),
  onNextTrack: () => nextTrack(),
  onSeek: (ratio) => seekTo(ratio),
  onVolume: (value) => setVolume(value)
});

const dial = createDial({
  root: document.getElementById("dial"),
  knob: document.getElementById("dial-knob"),
  ticksContainer: document.getElementById("dial-ticks"),
  prevButton: document.getElementById("dial-prev"),
  nextButton: document.getElementById("dial-next"),
  onSelectStation: (stationId) => {
    loadStationBeforeSelect(stationId, getPlayerState().isPlaying);
  },
  onStep: (offset) => {
    stepStation(offset);
  }
});

const mainPlayerAnchor = document.getElementById("main-player-anchor");
const stickyTriggerAnchor = document.getElementById("stations") ?? mainPlayerAnchor;

if (stickyTriggerAnchor) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      const isVisible = !entry.isIntersecting;
      document.body.classList.toggle("has-sticky-player", isVisible);
      ui.setStickyPlayerVisible(isVisible);
      syncStickyLayout();
    },
    {
      threshold: 0.1
    }
  );

  observer.observe(stickyTriggerAnchor);
}

// Main app wiring keeps the station UI, dial state, and single global player in sync.
initPlayer({
  onStateChange: (playerState) => {
    ui.updatePlayerState(playerState);
    dial.setActiveStation(playerState.currentStationId);
  },
  onStationChange: (station, playerState) => {
    ui.updateStation(station, playerState);
    dial.setActiveStation(station.id);
  },
  onTrackChange: (track, station) => {
    ui.updateTrack(track, station);
    if (typeof gtag === 'function' && getPlayerState().isPlaying) {
      gtag('event', 'song_play', {
        song_title: track.title ?? track.name ?? 'Unknown',
        artist: track.artist ?? track.artistName ?? 'Unknown',
        station: station.name ?? station.id ?? 'Unknown',
        player_type: 'radio_site'
      });
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement
  ) {
    return;
  }

  if (event.key === "ArrowLeft") {
    stepStation(-1);
  }

  if (event.key === "ArrowRight") {
    stepStation(1);
  }
});

const initialStation = getStationById(initialPlayerState.currentStationId);
ui.updateStation(initialStation, initialPlayerState);
ui.updateTrack(getCurrentTrack(), initialStation);
ui.updatePlayerState(initialPlayerState);
syncStickyLayout();
stations
  .filter((station) => station.playlistUrl)
  .forEach((station) => {
    ensureStationPlaylistLoaded(station.id);
  });

window.addEventListener("resize", syncStickyLayout);
