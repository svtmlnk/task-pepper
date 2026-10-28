import { Texture } from "pixi.js";
import { FIELD, PALETTE, SCREEN, WALL } from "./config.js";

const { lime, green, forest, moss, black } = PALETTE;

// Рисует пиксель-арт на маленьком canvas и превращает его в текстуру PixiJS
function pixelTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const put = (x, y, color, w = 1, h = 1) => {
    ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    ctx.fillRect(x, y, w, h);
  };
  draw(put);
  const texture = Texture.from(canvas);
  texture.source.scaleMode = "nearest";
  return texture;
}

// Кирпич 20x8: светлая фаска сверху-слева, тень снизу-справа, чёрный шов
function brickTexture(base, light, dark, pattern) {
  return pixelTexture(20, 8, (put) => {
    put(0, 0, black, 20, 8);
    put(0, 0, base, 19, 7);
    if (pattern) {
      for (let y = 1; y < 6; y++) {
        for (let x = 1; x < 18; x++) {
          const color = pattern(x, y);
          if (color !== null) put(x, y, color);
        }
      }
    }
    put(0, 0, light, 19, 1);
    put(0, 0, light, 1, 7);
    put(1, 6, dark, 18, 1);
    put(18, 1, dark, 1, 6);
  });
}

// Металлическая труба рамки: поперечный градиент + стыки сегментов
const PIPE = [moss, forest, green, lime, lime, green, forest, moss];
const JOINT = [black, moss, forest, green, green, forest, moss, black];

function wallTexture(length, vertical) {
  const w = vertical ? 8 : length;
  const h = vertical ? length : 8;
  return pixelTexture(w, h, (put) => {
    for (let along = 0; along < length; along++) {
      const isJoint = along % 24 === 22 || along % 24 === 23;
      const colors = isJoint ? JOINT : PIPE;
      for (let across = 0; across < 8; across++) {
        if (vertical) put(across, along, colors[across]);
        else put(along, across, colors[across]);
      }
    }
  });
}

export function createTextures(loaded) {
  const fieldW = (FIELD.right - FIELD.left) / 2;
  const fieldH = (FIELD.bottom - FIELD.top) / 2;
  const frameLeft = FIELD.left - WALL;
  const frameTop = FIELD.top - WALL;

  // Фаска для прочного кирпича: диагональная штриховка "металла"
  const hatch = (x, y) => ((x + y) % 4 === 0 ? lime : null);
  const crack = (x, y) => {
    const crackY = [3, 2, 3, 4, 3, 2, 2, 3, 4, 4, 3, 2, 3, 3, 4, 3, 2];
    if (crackY[x - 1] === y) return black;
    return (x + y) % 4 === 0 ? lime : null;
  };

  return {
    paddle: loaded.paddle,
    ball: loaded.ball,

    bricks: [
      brickTexture(moss, forest, black),
      brickTexture(forest, green, moss),
      brickTexture(green, lime, forest),
      brickTexture(lime, lime, green, (x, y) =>
        x === 1 && y === 1 ? green : null,
      ),
    ],
    hardBrick: brickTexture(green, lime, forest, hatch),
    hardBrickCracked: brickTexture(green, lime, forest, crack),
    brickFlash: brickTexture(lime, lime, lime),

    wallVertical: wallTexture((SCREEN.height - frameTop) / 2, true),
    wallTop: wallTexture((FIELD.right + WALL - frameLeft) / 2, false),
    corner: pixelTexture(8, 8, (put) => {
      put(0, 0, black, 8, 8);
      put(0, 0, lime, 7, 7);
      put(1, 1, green, 6, 6);
      put(2, 2, forest, 4, 4);
      put(3, 3, moss, 2, 2);
    }),

    // Фон поля: пунктирная ромбовидная сетка тёмно-зелёным
    background: pixelTexture(fieldW, fieldH, (put) => {
      for (let y = 0; y < fieldH; y++) {
        for (let x = 0; x < fieldW; x += 2) {
          if ((x + y) % 16 === 0 || (((x - y) % 16) + 16) % 16 === 0)
            put(x, y, moss);
        }
      }
    }),
  };
}
