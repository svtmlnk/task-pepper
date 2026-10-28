import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import globals from "globals"; // 1. Импортируем пакет globals

export default [
  // Сначала указываем игнорируемые папки
  { ignores: ["dist", "node_modules"] },

  // Подключаем базовые правила ESLint и Prettier
  js.configs.recommended,
  prettier,

  // Ваши настройки для файлов игры
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser, // 2. Говорим ESLint, что window, document, Audio и FontFace — это нормальные переменные браузера
      },
    },
    rules: {
      // Здесь можно переопределять правила, если нужно
    },
  },
];
