import { ArkanoidGame } from "./ArkanoidGame.js";

// Точка входа: вся логика игры спрятана внутри класса ArkanoidGame
const game = new ArkanoidGame(document.getElementById("pixi-container"));
game.init();
