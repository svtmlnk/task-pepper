import { Container, Text } from "pixi.js";
import { Scene } from "./Scene.js";
import { FONT, PALETTE, SCREEN } from "../config.js";
import { Starfield, pixelText, setFade } from "../fx.js";

// Буквы в стиле figlet "standard"
const GLYPHS = {
  A: ["    _    ", "   / \\   ", "  / _ \\  ", " / ___ \\ ", "/_/   \\_\\"],
  R: [" ____  ", "|  _ \\ ", "| |_) |", "|  _ < ", "|_| \\_\\"],
  K: [" _  __", "| |/ /", "| ' / ", "| . \\ ", "|_|\\_\\"],
  N: [" _   _ ", "| \\ | |", "|  \\| |", "| |\\  |", "|_| \\_|"],
  O: ["  ___  ", " / _ \\ ", "| | | |", "| |_| |", " \\___/ "],
  I: [" ___ ", "|_ _|", " | | ", " | | ", "|___|"],
  D: [" ____  ", "|  _ \\ ", "| | | |", "| |_| |", "|____/ "],
};

// Сдвигаем буквы друг к другу, пока они не соприкоснутся (кернинг как у figlet)
function asciiArt(word) {
  let rows = ["", "", "", "", ""];
  for (const char of word) {
    const glyph = GLYPHS[char];
    const width = rows[0].length;
    const fits = (k) =>
      rows.every((row, i) => {
        for (let j = 0; j < k; j++) {
          if (row[width - k + j] !== " " && glyph[i][j] !== " ") return false;
        }
        return true;
      });

    let overlap = 0;
    while (overlap < Math.min(width, glyph[0].length) && fits(overlap + 1))
      overlap++;

    rows = rows.map((row, i) => {
      let merged = row.slice(0, width - overlap);
      for (let j = 0; j < overlap; j++) {
        const a = row[width - overlap + j];
        merged += a !== " " ? a : glyph[i][j];
      }
      return merged + glyph[i].slice(overlap);
    });
  }
  return rows;
}

const TITLE_SIZE = 9;
const TITLE_Y = 96;
const TITLE_COLORS = [
  PALETTE.lime,
  PALETTE.lime,
  PALETTE.green,
  PALETTE.green,
  PALETTE.forest,
];
const SHIMMER_RAMP = [
  PALETTE.lime,
  PALETTE.green,
  PALETTE.forest,
  PALETTE.green,
];

// ГЛАВНОЕ МЕНЮ ("Press Enter")
export class MenuScene extends Scene {
  constructor(game) {
    super(game);

    this.stars = new Starfield(this.container);

    // Заголовок ARKANOID в виде ASCII + тень
    const art = asciiArt("ARKANOID");
    const titleX = Math.round((SCREEN.width - art[0].length * TITLE_SIZE) / 2);
    this.title = new Container();
    this.titleRows = [];
    for (const [layer, offset] of [
      ["shadow", 2],
      ["front", 0],
    ]) {
      art.forEach((line, i) => {
        const row = new Text({
          text: line,
          style: {
            fontFamily: FONT,
            fontSize: TITLE_SIZE,
            fill: layer === "shadow" ? PALETTE.moss : TITLE_COLORS[i],
          },
        });
        row.roundPixels = true;
        row.position.set(titleX + offset, TITLE_Y + i * TITLE_SIZE + offset);
        this.title.addChild(row);
        if (layer === "front") this.titleRows.push(row);
      });
    }
    this.container.addChild(this.title);

    this.prompt = pixelText("PRESS ENTER TO PLAY", 16, PALETTE.lime);
    this.prompt.position.set(SCREEN.width / 2, 330);

    this.footer = pixelText("MADE BY MELNIK", 8, PALETTE.forest);
    this.footer.position.set(SCREEN.width / 2, 456);

    this.container.addChild(this.prompt, this.footer);
  }

  enter() {
    this.time = 0;
    this.shimmerStep = -1;
    this.game.audio.playMusic("main");

    for (const text of [this.title, this.prompt, this.footer]) setFade(text, 0);
    this.titleRows.forEach((row, i) => (row.style.fill = TITLE_COLORS[i]));

    this.fadeIn(this.title);
    this.fadeIn(this.footer);
    this.blinkPrompt();
  }

  // Надпись плавно появляется и исчезает по кругу
  async blinkPrompt() {
    await this.fadeIn(this.prompt);
    for (;;) {
      await this.scheduler.wait(1000);
      await this.fadeOut(this.prompt);
      await this.fadeIn(this.prompt);
    }
  }

  update(delta, ms) {
    this.time += ms;

    this.stars.update(delta);

    // Заголовок слегка "плавает" с шагом в 2 пикселя
    this.title.y = Math.round(Math.sin(this.time / 600) * 1.5) * 2;

    // Каждые 4 секунды по заголовку пробегает перелив цветов (color cycling)
    const cycle = this.time % 4000;
    const step = cycle < 900 ? Math.floor(cycle / 100) : -1;
    if (step !== this.shimmerStep) {
      this.shimmerStep = step;
      this.titleRows.forEach((row, i) => {
        row.style.fill =
          step < 0
            ? TITLE_COLORS[i]
            : SHIMMER_RAMP[(i + step) % SHIMMER_RAMP.length];
      });
    }
  }

  onKeyDown(code) {
    if (code === "Enter" || code === "NumpadEnter") {
      this.game.audio.sfx("start");
      this.game.switchTo("story");
    }
  }
}
