import { BRICK } from "./config.js";

// Раскладки кирпичей. Каждая возвращает массив рядов,
// в ряду для каждой колонки: null — пусто, "hard" — прочный кирпич, 0..3 — оттенок
const COLS = BRICK.cols;
const MID = (COLS - 1) / 2;
const shadeByRow = (row) => 3 - (row % 4);

function grid(rows, cell) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => cell(r, c)),
  );
}

const LAYOUTS = {
  // Классика: сплошные ряды, сверху прочный
  classic: () => grid(5, (r) => (r === 0 ? "hard" : 4 - r)),

  // Пирамида
  pyramid: () =>
    grid(7, (r, c) =>
      Math.abs(c - MID) <= r ? (r === 6 ? "hard" : shadeByRow(r)) : null,
    ),

  // Ромб с прочным центром
  diamond: () =>
    grid(9, (r, c) => {
      const d = Math.abs(c - MID) + Math.abs(r - 4);
      if (d > 5) return null;
      return d <= 1 ? "hard" : shadeByRow(d);
    }),

  // Шахматная доска
  checker: () =>
    grid(8, (r, c) =>
      (r + c) % 2 === 0 ? (r % 4 === 0 ? "hard" : shadeByRow(r)) : null,
    ),

  // Колонны с прочными "крышами"
  columns: () =>
    grid(8, (r, c) =>
      c % 2 === 0 ? (r === 0 ? "hard" : shadeByRow(r)) : null,
    ),

  // Полосы с проходами
  stripes: () =>
    grid(8, (r, c) =>
      r % 2 === 0 && c % 4 !== 3
        ? r === 0
          ? "hard"
          : shadeByRow(r / 2)
        : null,
    ),

  // Случайная симметричная фигура
  random: () => {
    const half = grid(8, (r) =>
      Math.random() < 0.6
        ? Math.random() < 0.15
          ? "hard"
          : shadeByRow(r)
        : null,
    );
    // Зеркалим левую половину на правую
    return half.map((row) =>
      row.map((cell, c) => (c > MID ? row[COLS - 1 - c] : cell)),
    );
  },
};

const NAMES = Object.keys(LAYOUTS);

// Первый раунд — всегда классика, дальше — любая другая раскладка, не повторяя предыдущую
export function nextLayout(previous) {
  if (!previous) return { name: "classic", rows: LAYOUTS.classic() };

  const options = NAMES.filter(
    (name) => name !== previous || name === "random",
  );
  const name = options[Math.floor(Math.random() * options.length)];
  const rows = LAYOUTS[name]();
  // На всякий случай: в раскладке должен быть хотя бы один кирпич
  if (rows.flat().every((cell) => cell === null)) return nextLayout(previous);
  return { name, rows };
}
