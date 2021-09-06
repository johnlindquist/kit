"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.say = void 0;
//List voices: `say -v "?"`. Get more voices: Preferences->Accessibility->System Voices
let say = async (string, { rate = 250, voice = "Alex" } = {}) => await applescript(String.raw `say "${string}" using "${voice}" speaking rate ${rate}`);
exports.say = say;
