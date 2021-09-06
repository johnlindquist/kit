"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playAudioFile = void 0;
let playAudioFile = async (path, playInBackground = true) => {
    return exec(`afplay ${path} ${playInBackground ? "&>/dev/null &" : ""}`);
};
exports.playAudioFile = playAudioFile;
