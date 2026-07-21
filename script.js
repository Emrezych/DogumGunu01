"use strict";

// Kaçan buton için sayfa elemanları.
const startButton = document.querySelector("#startButton");
const buttonLabel = startButton.querySelector(".button-label");
const welcomeHint = document.querySelector("#welcomeHint");
const welcomeCard = document.querySelector(".welcome-card");
const welcomeScreen = document.querySelector("#welcomeScreen");
const nightScene = document.querySelector("#nightScene");

// Tek noktadan yönetilebilen oyun ayarları.
const MAX_ESCAPE_COUNT = 7;
const ESCAPE_DISTANCE = 110;
const VIEWPORT_PADDING = 16;
const ESCAPE_AREA_EXPANSION = 48;

const escapeMessages = [
  "O kadar kolay değil! Biraz daha yaklaş. 😄",
  "Yaklaşıyordun ama ben daha hızlıyım!",
  "Bir kalp kadar daha yaklaşman lazım. ♥",
  "Hâlâ deniyorsun, bu çok tatlı!",
  "Az kaldı… ama biraz daha uğraşmalısın.",
  "Son iki hamle! Vazgeçmek yok.",
  "Peki, pes ediyorum… Şimdi bana tıklayabilirsin! ♥",
];

let escapeCount = 0;
let buttonPosition = null;
let isGameFinished = false;
let transitionStarted = false;

/** Gece sahnesinde kullanılacak hafif, tekrar kullanılabilir yaprak katmanını oluşturur. */
function createPetalLayer() {
  const petalLayer = document.createElement("div");
  const fragment = document.createDocumentFragment();

  petalLayer.className = "petal-layer";
  petalLayer.setAttribute("aria-hidden", "true");

  for (let index = 0; index < 18; index += 1) {
    fragment.append(createPetal("sakura-petal", index));
  }

  for (let index = 0; index < 14; index += 1) {
    fragment.append(createPetal("rose-petal", index));
  }

  petalLayer.append(fragment);
  document.body.append(petalLayer);
}

/** Tek bir yaprağın konum, boyut ve hız değerlerini rastgele belirler. */
function createPetal(petalType, index) {
  const petal = document.createElement("span");

  petal.className = `falling-petal ${petalType}`;
  petal.style.setProperty("--x", `${Math.round(Math.random() * 100)}%`);
  petal.style.setProperty("--size", `${12 + Math.round(Math.random() * 12)}px`);
  petal.style.setProperty("--opacity", `${0.42 + Math.random() * 0.4}`);
  petal.style.setProperty("--scale", `${0.7 + Math.random() * 0.55}`);
  petal.style.setProperty("--drift", `${-14 + Math.round(Math.random() * 28)}vw`);
  petal.style.setProperty("--rotation", `${360 + Math.round(Math.random() * 540)}deg`);
  petal.style.setProperty("--duration", `${10 + Math.round(Math.random() * 8)}s`);
  petal.style.setProperty("--delay", `${-(index * 0.9)}s`);

  return petal;
}

/** Sayıyı verilen alt ve üst sınırlar içinde tutar. */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Butonun cam karttan çok uzaklaşmaması için güvenli kaçış alanını hesaplar. */
function getEscapeBounds(buttonRect) {
  const cardRect = welcomeCard.getBoundingClientRect();
  const viewportMaxLeft = Math.max(
    VIEWPORT_PADDING,
    window.innerWidth - buttonRect.width - VIEWPORT_PADDING
  );
  const viewportMaxTop = Math.max(
    VIEWPORT_PADDING,
    window.innerHeight - buttonRect.height - VIEWPORT_PADDING
  );
  const minLeft = clamp(
    cardRect.left - ESCAPE_AREA_EXPANSION,
    VIEWPORT_PADDING,
    viewportMaxLeft
  );
  const minTop = clamp(
    cardRect.top - ESCAPE_AREA_EXPANSION,
    VIEWPORT_PADDING,
    viewportMaxTop
  );

  return {
    minLeft,
    maxLeft: clamp(
      cardRect.right - buttonRect.width + ESCAPE_AREA_EXPANSION,
      minLeft,
      viewportMaxLeft
    ),
    minTop,
    maxTop: clamp(
      cardRect.bottom - buttonRect.height + ESCAPE_AREA_EXPANSION,
      minTop,
      viewportMaxTop
    ),
  };
}

/** Butonun merkezinin işaretçiye yeterince yaklaşıp yaklaşmadığını hesaplar. */
function isPointerClose(pointerX, pointerY) {
  const buttonRect = startButton.getBoundingClientRect();
  const buttonCenterX = buttonRect.left + buttonRect.width / 2;
  const buttonCenterY = buttonRect.top + buttonRect.height / 2;
  const distance = Math.hypot(pointerX - buttonCenterX, pointerY - buttonCenterY);

  return distance < ESCAPE_DISTANCE;
}

/** Butonun ekran dışına taşmadan kaçabileceği rastgele bir nokta üretir. */
function getNextButtonPosition(pointerX, pointerY) {
  const buttonRect = startButton.getBoundingClientRect();
  const bounds = getEscapeBounds(buttonRect);
  let fallbackPosition = { left: bounds.minLeft, top: bounds.minTop };

  // Yeni konumun fareden uzak olmasını sağlamak için birkaç alternatif deneriz.
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const left =
      bounds.minLeft + Math.random() * (bounds.maxLeft - bounds.minLeft);
    const top = bounds.minTop + Math.random() * (bounds.maxTop - bounds.minTop);
    const distanceFromPointer = Math.hypot(
      left + buttonRect.width / 2 - pointerX,
      top + buttonRect.height / 2 - pointerY
    );

    fallbackPosition = { left, top };

    if (distanceFromPointer > ESCAPE_DISTANCE * 1.8) {
      return fallbackPosition;
    }
  }

  return fallbackPosition;
}

/** Butonu hesaplanan sabit ekran koordinatına taşır. */
function placeButton(pointerX, pointerY) {
  buttonPosition = getNextButtonPosition(pointerX, pointerY);
  startButton.classList.add("is-escaping");
  startButton.style.left = `${buttonPosition.left}px`;
  startButton.style.top = `${buttonPosition.top}px`;
}

/** Yedinci kaçışta butonun artık yakalanabileceği duruma geçer. */
function finishEscapeGame() {
  isGameFinished = true;
  buttonLabel.textContent = "Şimdi Tıkla";
  startButton.classList.add("is-ready");
  startButton.setAttribute("aria-label", "Şimdi tıkla, buton artık kaçmayacak");
}

/** Bir kaçış gerçekleştirir ve o ana ait mesajı gösterir. */
function escapeButton(pointerX, pointerY) {
  if (isGameFinished) {
    return;
  }

  placeButton(pointerX, pointerY);
  welcomeHint.textContent = escapeMessages[escapeCount];
  escapeCount += 1;

  if (escapeCount === MAX_ESCAPE_COUNT) {
    finishEscapeGame();
  }
}

/** Masaüstünde fare butona yaklaştığında kaçış başlatır. */
function handleMouseMove(event) {
  if (isGameFinished) {
    return;
  }

  if (isPointerClose(event.clientX, event.clientY)) {
    escapeButton(event.clientX, event.clientY);
  }
}

/** İmleç butonun üzerine doğrudan gelirse kaçışı kesin olarak tetikler. */
function handleButtonMouseEnter(event) {
  if (!isGameFinished) {
    escapeButton(event.clientX, event.clientY);
  }
}

/** Mobilde ve çok hızlı tıklamalarda butonun yakalanmasını önler. */
function handleButtonClick(event) {
  if (!isGameFinished) {
    event.preventDefault();
    escapeButton(window.innerWidth / 2, window.innerHeight / 2);
    return;
  }

  buttonLabel.textContent = "Beni Yakaladın!";
  welcomeHint.textContent = "Beni yakaladın. Şimdi asıl sürpriz başlıyor… ♥";
  startButton.classList.add("is-celebrated");
  startCinematicTransition();
}

/** Siyah perde, bulanıklık ve zoom ile gece sahnesine geçişi yönetir. */
function startCinematicTransition() {
  if (transitionStarted) {
    return;
  }

  transitionStarted = true;
  document.body.classList.add("is-transitioning");

  window.setTimeout(() => {
    document.body.classList.remove("is-transitioning");
    document.body.classList.add("is-night-active");
    welcomeScreen.setAttribute("aria-hidden", "true");
    nightScene.setAttribute("aria-hidden", "false");
  }, 720);
}

/** Ekran döndürülür veya küçültülürse buton görünür alanda kalır. */
function keepButtonInViewport() {
  if (!buttonPosition) {
    return;
  }

  const buttonRect = startButton.getBoundingClientRect();
  const bounds = getEscapeBounds(buttonRect);

  buttonPosition.left = clamp(buttonPosition.left, bounds.minLeft, bounds.maxLeft);
  buttonPosition.top = clamp(buttonPosition.top, bounds.minTop, bounds.maxTop);
  startButton.style.left = `${buttonPosition.left}px`;
  startButton.style.top = `${buttonPosition.top}px`;
}

document.addEventListener("mousemove", handleMouseMove, { passive: true });
startButton.addEventListener("mouseenter", handleButtonMouseEnter);
startButton.addEventListener("click", handleButtonClick);
window.addEventListener("resize", keepButtonInViewport);
createPetalLayer();
