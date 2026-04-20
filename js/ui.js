import { formatTime } from "./player.js";
import { getStationTracks, stations } from "./stations.js";

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setImage(id, src, alt) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.src = src;
  element.alt = alt;
}

function buildPresetMarkup(station) {
  return `
    <button class="preset-button" type="button" data-station-id="${station.id}" data-action="select-station">
      <strong>${station.frequency}</strong>
      <span>${station.shortName}</span>
    </button>
  `;
}

function buildStripMarkup(station) {
  const allTracks = getStationTracks(station).filter(t => t.cover);
  const nowPlaying = allTracks.length > 0
    ? allTracks[Math.floor(Math.random() * allTracks.length)]
    : station.featuredTrack;
  const cardImage = nowPlaying?.cover || station.heroImage || "";

  return `
    <article
      class="roster-card"
      data-station-card="${station.id}"
    >
      <div class="roster-card__media">
        <img class="roster-card__image" src="${cardImage}" alt="${nowPlaying?.title ?? station.name}" />
      </div>
      <div class="roster-card__body">
        <div class="roster-card__topline">
          <span class="roster-card__frequency">${station.frequency} FM</span>
          <span class="roster-card__genre">${station.genre}</span>
        </div>
        <div class="roster-card__copy">
          <strong>${station.name}</strong>
          <span class="roster-card__now-playing">&#9654; ${nowPlaying?.title ?? station.tagline}</span>
        </div>
        <div class="roster-card__actions">
          <button
            class="roster-card__button"
            type="button"
            data-station-id="${station.id}"
            data-action="select-station"
          >
            Tune In
          </button>
          <button
            class="roster-card__button roster-card__button--ghost"
            type="button"
            data-station-id="${station.id}"
            data-action="play-station"
          >
            Play Station
          </button>
          <a
            class="roster-card__link"
            href="${station.artistSite}"
            target="_blank"
            rel="noreferrer"
          >
            Artist Site
          </a>
        </div>
      </div>
    </article>
  `;
}

export function createUI({
  onSelectStation,
  onPlayStation,
  onTogglePlayback,
  onPreviousStation,
  onNextStation,
  onPreviousTrack,
  onNextTrack,
  onSeek,
  onVolume
}) {
  const refs = {
    heroSection: document.getElementById("main-player-anchor"),
    heroArt: document.getElementById("hero-art"),
    heroCta: document.getElementById("hero-cta"),
    heroPlayToggle: document.getElementById("hero-play-toggle"),
    presetRow: document.getElementById("preset-row"),
    quickStrip: document.getElementById("quick-strip"),
    playerPlay: document.getElementById("player-play"),
    playerPrev: document.getElementById("player-prev"),
    playerNext: document.getElementById("player-next"),
    stickyPlayer: document.getElementById("sticky-player"),
    stickyPlay: document.getElementById("sticky-play"),
    stickyPrev: document.getElementById("sticky-prev"),
    stickyNext: document.getElementById("sticky-next"),
    stickyStationPrev: document.getElementById("sticky-station-prev"),
    stickyStationNext: document.getElementById("sticky-station-next"),
    playerStationPrev: document.getElementById("player-station-prev"),
    playerStationNext: document.getElementById("player-station-next"),
    progressSlider: document.getElementById("progress-slider"),
    volumeSlider: document.getElementById("volume-slider")
  };

  refs.presetRow.innerHTML = stations.map(buildPresetMarkup).join("");
  refs.quickStrip.innerHTML = stations.map(buildStripMarkup).join("");

  const stationButtons = Array.from(document.querySelectorAll('[data-action="select-station"]'));
  const playStationButtons = Array.from(document.querySelectorAll('[data-action="play-station"]'));
  const stationCards = Array.from(document.querySelectorAll("[data-station-card]"));

  stationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      onSelectStation(button.getAttribute("data-station-id"));
    });
  });

  playStationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      onPlayStation(button.getAttribute("data-station-id"));
    });
  });

  refs.heroPlayToggle?.addEventListener("click", onTogglePlayback);
  refs.playerPlay?.addEventListener("click", onTogglePlayback);
  refs.playerPrev?.addEventListener("click", onPreviousTrack);
  refs.playerNext?.addEventListener("click", onNextTrack);
  refs.stickyPlay?.addEventListener("click", onTogglePlayback);
  refs.stickyPrev?.addEventListener("click", onPreviousTrack);
  refs.stickyNext?.addEventListener("click", onNextTrack);
  refs.stickyStationPrev?.addEventListener("click", onPreviousStation);
  refs.stickyStationNext?.addEventListener("click", onNextStation);
  refs.playerStationPrev?.addEventListener("click", onPreviousStation);
  refs.playerStationNext?.addEventListener("click", onNextStation);

  refs.progressSlider?.addEventListener("input", (event) => {
    onSeek(Number(event.target.value) / 100);
  });

  refs.volumeSlider?.addEventListener("input", (event) => {
    onVolume(Number(event.target.value));
  });

  let activeThemeClass = "";

  return {
    updateStation(station, playerState) {
      const playlist = getStationTracks(station);
      const track = playlist[playerState.currentTrackIndex] ?? playlist[0];

      if (activeThemeClass) {
        document.body.classList.remove(activeThemeClass);
      }
      activeThemeClass = station.theme.bgClass;
      document.body.classList.add(activeThemeClass);
      document.documentElement.style.setProperty("--accent", station.theme.accent);
      document.documentElement.style.setProperty("--glow", station.theme.glow);

      const heroArtUrl = track?.cover || station.heroImage;
      refs.heroSection?.style.setProperty("--hero-image", heroArtUrl ? `url("${heroArtUrl}")` : "none");
      if (refs.heroArt) {
        refs.heroArt.style.backgroundImage = heroArtUrl ? `url("${heroArtUrl}")` : "";
      }
      if (refs.heroCta) {
        refs.heroCta.href = station.artistSite;
        refs.heroCta.textContent = `Visit ${station.primaryCtaLabel ?? "Artist Site"}`;
      }

      setText("hero-station-name", station.name);
      setText("hero-tagline", station.tagline);
      setText("hero-genre", station.genre);
      setText("hero-mood", station.mood);
      setText("hero-description", station.description);

      setText("station-frequency-badge", station.frequency.toFixed(1));
      setText("station-featured-track", station.featuredTrack.title);

      setText("dial-frequency", station.frequency.toFixed(1));
      setText("dial-name", station.name);
      setText("sticky-station", station.name);
      setText("sticky-frequency", `${station.frequency.toFixed(1)} FM`);
      setText("player-frequency", station.frequency.toFixed(1));

      stationButtons.forEach((button) => {
        button.classList.toggle("is-active", button.getAttribute("data-station-id") === station.id);
      });

      stationCards.forEach((card) => {
        card.classList.toggle("is-active", card.getAttribute("data-station-card") === station.id);
      });
    },

    updateTrack(track, station) {
      setText("player-station", station.name);
      setText("player-track", track?.title ?? "No track available");
      setText("player-artist", track?.artist ?? station.name);
      setText("player-album", track?.album ?? "Single");
      setText("sticky-track", track?.title ?? "No track available");
      setText("sticky-artist", track?.artist ?? station.name);

      if (track?.cover) {
        setImage("player-art", track.cover, `${track.title} cover art`);
        setImage("sticky-art", track.cover, `${track.title} cover art`);
        setImage("station-cover", track.cover, `${track.title} cover art`);
        refs.heroSection?.style.setProperty("--hero-image", `url("${track.cover}")`);
        if (refs.heroArt) {
          refs.heroArt.style.backgroundImage = `url("${track.cover}")`;
        }
      }
    },

    updatePlayerState(playerState) {
      if (refs.playerPlay) {
        refs.playerPlay.textContent = playerState.isPlaying ? "Pause" : "Play";
      }
      if (refs.heroPlayToggle) {
        refs.heroPlayToggle.textContent = playerState.isPlaying ? "Pause Station" : "Play Station";
      }
      if (refs.stickyPlay) {
        refs.stickyPlay.textContent = playerState.isPlaying ? "Pause" : "Play";
      }
      if (refs.progressSlider) {
        refs.progressSlider.value = playerState.duration
          ? ((playerState.progress / playerState.duration) * 100).toFixed(2)
          : 0;
      }
      if (refs.volumeSlider) {
        refs.volumeSlider.value = String(playerState.volume);
      }

      setText("current-time", formatTime(playerState.progress).replace("--:--", "0:00"));
      setText("duration-time", formatTime(playerState.duration));
    },

    setStickyPlayerVisible(isVisible) {
      refs.stickyPlayer?.classList.toggle("is-visible", isVisible);
      refs.stickyPlayer?.setAttribute("aria-hidden", String(!isVisible));
    }
  };
}
