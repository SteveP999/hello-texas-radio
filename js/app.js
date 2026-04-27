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

function upsertStation(id, patch) {
  const existing = stations.find((s) => s.id === id);
  if (existing) {
    Object.assign(existing, patch);
  } else {
    stations.push({ id, ...patch });
  }
}

upsertStation("parsons-cross", {
  frequency: 94.7,
  slug: "parsons-cross",
  name: "Parsons Cross Radio",
  shortName: "Parsons Cross",
  tagline: "Contemporary Christian and worship from Parsons Cross.",
  genre: "Contemporary Christian / Worship",
  mood: "Faithful, hopeful, worshipful",
  description: "The Parsons Cross station, featuring the current Into the Light and Out of the Darkness catalog.",
  theme: { accent: "#c9a46c", glow: "rgba(201,164,108,0.35)", bgClass: "theme-parsons-cross" },
  heroImage: "https://raw.githubusercontent.com/SteveP999/Parsons-Cross/main/covers/parsons-cross-circle-the-wagons-cover.png",
  artistSite: "https://stevep999.github.io/Parsons-Cross/",
  playlistUrl: "https://raw.githubusercontent.com/SteveP999/Parsons-Cross/main/radio.json",
  primaryCtaLabel: "Artist Site",
  featuredTrack: {
    title: "Circle the Wagons",
    artist: "Parsons Cross",
    album: "Into the Light",
    cover: "https://raw.githubusercontent.com/SteveP999/Parsons-Cross/main/covers/parsons-cross-circle-the-wagons-cover.png",
    audioSrc: "https://www.dropbox.com/scl/fi/zv9z8076a6hc13vm8c67z/parsons-cross-circle-the-wagons-mp3.mp3?rlkey=wtv99unlw7flzrtxodxy2n7ho&raw=1",
    duration: null
  }
});

upsertStation("stephen-parsons", {
  frequency: 104.1,
  slug: "stephen-parsons",
  name: "Stephen Parsons",
  shortName: "Stephen",
  tagline: "Faith. Family. Songs that stay.",
  genre: "Christian / Singer-Songwriter",
  mood: "Warm, reflective, heartfelt",
  description: "Songs about family, faith, grief, gratitude, and the people who shape us.",
  theme: { accent: "#c9a46c", glow: "rgba(201,164,108,0.35)", bgClass: "theme-parsons" },
  heroImage: "https://raw.githubusercontent.com/SteveP999/Stephen-Parsons/main/covers/stephen-parsons-rise-up-cover.png",
  artistSite: "https://stevep999.github.io/Stephen-Parsons/",
  playlistUrl: "https://raw.githubusercontent.com/SteveP999/Stephen-Parsons/main/radio.json",
  primaryCtaLabel: "Artist Site",
  featuredTrack: {
    title: "Rise Up",
    artist: "Stephen Parsons",
    album: "Touches of the Heart",
    cover: "https://raw.githubusercontent.com/SteveP999/Stephen-Parsons/main/covers/stephen-parsons-rise-up-cover.png",
    audioSrc: "https://www.dropbox.com/scl/fi/fgz0bbtwwf0e9wlkm8org/stephen-parsons-rise-up-mp3.mp3?rlkey=6yh8ebyatwtvovct94a9nj4xn&raw=1",
    duration: null
  }
});

stations.sort((a, b) => a.frequency - b.frequency);

function syncStickyLayout() {
  const topbar = document.querySelector(".topbar");
  const stickyPlayer = document.getElementById("sticky-player");
  if (!topbar || !stickyPlayer) return;
  const topbarHeight = topbar.getBoundingClientRect().height;
  const stickyHeight = stickyPlayer.classList.contains("is-visible") ? stickyPlayer.getBoundingClientRect().height : 0;
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

function stepStation(offset) { loadStationBeforeSelect(getAdjacentStationId(offset), getPlayerState().isPlaying); }

const ui = createUI({ onSelectStation:(id)=>loadStationBeforeSelect(id,getPlayerState().isPlaying), onPlayStation:(id)=>loadStationBeforeSelect(id,true), onTogglePlayback:()=>togglePlayback(), onPreviousStation:()=>stepStation(-1), onNextStation:()=>stepStation(1), onPreviousTrack:()=>previousTrack(), onNextTrack:()=>nextTrack(), onSeek:(r)=>seekTo(r), onVolume:(v)=>setVolume(v)});
const dial = createDial({ root:document.getElementById("dial"), knob:document.getElementById("dial-knob"), ticksContainer:document.getElementById("dial-ticks"), prevButton:document.getElementById("dial-prev"), nextButton:document.getElementById("dial-next"), onSelectStation:(id)=>loadStationBeforeSelect(id,getPlayerState().isPlaying), onStep:(o)=>stepStation(o)});
const mainPlayerAnchor=document.getElementById("main-player-anchor");
const stickyTriggerAnchor=document.getElementById("stations")??mainPlayerAnchor;
if(stickyTriggerAnchor){const observer=new IntersectionObserver(([entry])=>{const isVisible=!entry.isIntersecting;document.body.classList.toggle("has-sticky-player",isVisible);ui.setStickyPlayerVisible(isVisible);syncStickyLayout();},{threshold:0.1});observer.observe(stickyTriggerAnchor);}
initPlayer({onStateChange:(s)=>{ui.updatePlayerState(s);dial.setActiveStation(s.currentStationId);},onStationChange:(station,s)=>{ui.updateStation(station,s);dial.setActiveStation(station.id);},onTrackChange:(track,station)=>{ui.updateTrack(track,station);}});
const initialStation=getStationById(initialPlayerState.currentStationId);
ui.updateStation(initialStation, initialPlayerState);
ui.updateTrack(getCurrentTrack(), initialStation);
ui.updatePlayerState(initialPlayerState);
syncStickyLayout();
stations.filter((s)=>s.playlistUrl).forEach((s)=>ensureStationPlaylistLoaded(s.id));
window.addEventListener("resize", syncStickyLayout);
