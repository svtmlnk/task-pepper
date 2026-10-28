// Палитра игры
export const PALETTE = {
  lime: 0x58f707,
  green: 0x27c009,
  forest: 0x257804,
  moss: 0x274e13,
  black: 0x000000,
};

// Оттенки зелёного от тёмного к светлому
export const SHADES = [
  PALETTE.moss,
  PALETTE.forest,
  PALETTE.green,
  PALETTE.lime,
];

// Внутреннее разрешение игры (на экране масштабируется целым множителем)
export const SCREEN = { width: 640, height: 480 };

// Толщина стенок рамки
export const WALL = 16;

// Игровое поле (внутренняя область рамки)
export const FIELD = { left: 60, right: 580, top: 40, bottom: 480 };

// Кирпичи: 13 колонок как в оригинале, отступ сверху в рядах
export const BRICK = { width: 40, height: 16, cols: 13, offsetRows: 3 };

export const PADDLE = { y: 440, speed: 7, scale: 2 };

export const BALL = {
  scale: 0.75,
  radius: 6,
  startSpeed: 4.2,
  maxSpeed: 8,
  paddleStep: 0.08, // ускорение при каждом отскоке от платформы
  brickStep: 0.02, // ускорение при каждом разбитом кирпиче
  stickOffset: 12, // где мяч лежит на платформе перед запуском
};

export const LIVES = 3;

// Текст появляется/исчезает: 0% -> 50% за 3 секунды -> 100% ещё за 3 секунды
export const TEXT_FADE_STEP = 3000;

// Сколько уровней прозрачности (как 16 уровней яркости у SNES)
export const FADE_LEVELS = 16;

export const FONT_NAME = "Press Start 2P";
export const FONT = `"${FONT_NAME}", monospace`;
