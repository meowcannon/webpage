import "./style.css";

const $canvas = document.querySelector<HTMLCanvasElement>("#visualizer")!;
const $text = document.querySelector<HTMLHeadingElement>("#text")!;
const $button = document.querySelector<HTMLButtonElement>("#play-button")!;
const $audio = document.querySelector<HTMLAudioElement>("#audio")!;

const BAR_COUNT = 48;
const BAR_GAP = 4;
const BLOCK_SIZE = 8;
const BLOCK_GAP = 2;
const FILL_COLOR = "#9d8ea3";
const USABLE_RATIO = 0.5;

const canvasContext = $canvas.getContext("2d")!;

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(0);



function typeWelcome() {
  const message = "welcome to my page, shawty";

  message.split("").forEach((char, index) => {
    setTimeout(() => {
      $text.textContent += char;
    }, index * 100);
  });
}

function resizeCanvas() {
  $canvas.width = window.innerWidth * devicePixelRatio;
  $canvas.height = window.innerHeight * devicePixelRatio;

  $canvas.style.width = `${window.innerWidth}px`;
  $canvas.style.height = `${window.innerHeight}px`;

  canvasContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  canvasContext.imageSmoothingEnabled = false;
}

function setupAudio() {
  if (audioContext) return;

  audioContext = new AudioContext();

  analyser = audioContext.createAnalyser();

  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.85;

  const source = audioContext.createMediaElementSource($audio);
  source.connect(analyser);

  analyser.connect(audioContext.destination);

  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function drawBars() {
  requestAnimationFrame(drawBars);

  const width = window.innerWidth;
  const height = window.innerHeight;

  canvasContext.clearRect(0, 0, width, height);

  if (!analyser) return;

  analyser.getByteFrequencyData(dataArray);

  const binsPerBar = (dataArray.length * USABLE_RATIO) / BAR_COUNT;

  const barWidth = width / BAR_COUNT;

  for (let i = 0; i < BAR_COUNT; i++) {
    const start = Math.floor(i * binsPerBar);
    const end = Math.max(Math.floor((i + 1) * binsPerBar), start + 1);

    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += dataArray[j];
    }
    const value = sum / (end - start) / 255;

    const barHeight = Math.max(value * (height * 0.6), 1);
    const blockCount = Math.ceil(barHeight / (BLOCK_SIZE + BLOCK_GAP));

    const x = i * barWidth + BAR_GAP / 2;
    const w = barWidth - BAR_GAP;

    canvasContext.fillStyle = FILL_COLOR;

    for (let b = 0; b < blockCount; b++) {
      const y = height - (b + 1) * (BLOCK_SIZE + BLOCK_GAP);
      canvasContext.fillRect(x, y, w, BLOCK_SIZE);
    }
  }
}



window.addEventListener("resize", resizeCanvas);

$button.addEventListener("click", async () => {
  setupAudio();

  if (!audioContext) return;

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  if ($audio.paused) {
    await $audio.play();
  } else {
    $audio.pause();
  }
});

typeWelcome();

resizeCanvas();

drawBars();
