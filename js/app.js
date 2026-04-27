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

// Inject Stephen without rewriting the giant stations file 🛠️
if (!stations.find((s) => s.id === "stephen-parsons")) {
  stations.push({
    id: "stephen-parsons",
    frequency: 95.7,
    slug: "stephen-parsons",
    name: "Stephen Parsons",
    shortName: "Stephen",
    tagline: "Faith. Family. Songs that stay.",
    genre: "Christian / Singer-Songwriter",
    mood: "Warm, reflective, heartfelt",
    description: "Songs about family, faith, grief, gratitude, and the people who shape us.",
    theme: { accent: "#c9a46c", glow: "rgba(201,164,108,0.35)", bgClass: "theme-parsons" },
    heroImage: "https://www.dropbox.com/scl/fi/0j5fbn3ott28vhs3ke82i/stephen-parsons-rise-up-cover.png?rlkey=e46mzbgy8mjiwgncz7evzfott&raw=1",
    artistSite: "https://stevep999.github.io/Stephen-Parsons/",
    playlistUrl: "https://raw.githubusercontent.com/SteveP999/Stephen-Parsons/main/radio.json",
    primaryCtaLabel: "Artist Site"
  });
  stations.sort((a,b)=>a.frequency-b.frequency);
}

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
