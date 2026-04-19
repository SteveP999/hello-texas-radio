import { stations } from "./stations.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function createDial({
  root,
  knob,
  ticksContainer,
  prevButton,
  nextButton,
  onSelectStation,
  onStep
}) {
  let activeIndex = 0;
  let pointerActive = false;
  let trackRect = null;

  const positions = stations.map((_, index) => {
    if (stations.length === 1) {
      return 0;
    }

    return (index / (stations.length - 1)) * 100;
  });

  function renderTicks() {
    ticksContainer.innerHTML = stations
      .map(
        (station, index) => `
          <button
            class="dial__tick ${index === activeIndex ? "is-active" : ""}"
            type="button"
            data-station-id="${station.id}"
            style="left:${positions[index]}%"
            aria-label="Tune to ${station.name}"
          >
            <span>${station.frequency}</span>
          </button>
        `
      )
      .join("");

    Array.from(ticksContainer.querySelectorAll("[data-station-id]")).forEach((tick) => {
      tick.addEventListener("click", () => {
        onSelectStation(tick.getAttribute("data-station-id"));
      });
    });
  }

  function setKnobPosition(index) {
    activeIndex = index;
    knob.style.left = `${positions[index]}%`;
    knob.setAttribute("aria-valuenow", String(stations[index].frequency));

    Array.from(ticksContainer.children).forEach((tick, tickIndex) => {
      tick.classList.toggle("is-active", tickIndex === index);
    });
  }

  function getNearestIndex(clientX) {
    trackRect = trackRect ?? root.getBoundingClientRect();
    const ratio = clamp((clientX - trackRect.left) / trackRect.width, 0, 1);

    return positions.reduce((bestIndex, position, index) => {
      const distance = Math.abs(position / 100 - ratio);
      const bestDistance = Math.abs(positions[bestIndex] / 100 - ratio);
      return distance < bestDistance ? index : bestIndex;
    }, 0);
  }

  function handlePointerMove(event) {
    if (!pointerActive) {
      return;
    }

    setKnobPosition(getNearestIndex(event.clientX));
  }

  function finishPointer(event) {
    if (!pointerActive) {
      return;
    }

    pointerActive = false;
    knob.releasePointerCapture?.(event.pointerId);
    const nextIndex = getNearestIndex(event.clientX);
    onSelectStation(stations[nextIndex].id);
  }

  knob.addEventListener("pointerdown", (event) => {
    pointerActive = true;
    trackRect = root.getBoundingClientRect();
    knob.setPointerCapture?.(event.pointerId);
  });

  knob.addEventListener("pointermove", handlePointerMove);
  knob.addEventListener("pointerup", finishPointer);
  knob.addEventListener("pointercancel", finishPointer);

  root.addEventListener("click", (event) => {
    if (event.target === knob) {
      return;
    }

    onSelectStation(stations[getNearestIndex(event.clientX)].id);
  });

  let touchStartX = 0;
  root.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  root.addEventListener(
    "touchend",
    (event) => {
      const delta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 30) {
        onStep(delta > 0 ? -1 : 1);
      }
    },
    { passive: true }
  );

  prevButton?.addEventListener("click", () => onStep(-1));
  nextButton?.addEventListener("click", () => onStep(1));
  window.addEventListener("resize", () => {
    trackRect = null;
  });

  renderTicks();
  setKnobPosition(0);

  return {
    setActiveStation(stationId) {
      const nextIndex = stations.findIndex((station) => station.id === stationId);
      if (nextIndex >= 0) {
        setKnobPosition(nextIndex);
      }
    }
  };
}
