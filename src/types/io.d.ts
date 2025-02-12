import { EventEmitter } from "node:events"
export declare enum EventType {
  EVENT_KEY_PRESSED = 4,
  EVENT_KEY_RELEASED = 5,
  EVENT_MOUSE_CLICKED = 6,
  EVENT_MOUSE_PRESSED = 7,
  EVENT_MOUSE_RELEASED = 8,
  EVENT_MOUSE_MOVED = 9,
  EVENT_MOUSE_WHEEL = 11,
}
export interface UiohookKeyboardEvent {
  type:
    | EventType.EVENT_KEY_PRESSED
    | EventType.EVENT_KEY_RELEASED
  time: number
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  keycode: number
  key: string
  text: string
}
export interface UiohookMouseEvent {
  type:
    | EventType.EVENT_MOUSE_CLICKED
    | EventType.EVENT_MOUSE_MOVED
    | EventType.EVENT_MOUSE_PRESSED
    | EventType.EVENT_MOUSE_RELEASED
  time: number
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  x: number
  y: number
  button: unknown
  clicks: number
}
export interface UiohookWheelEvent {
  type: EventType.EVENT_MOUSE_WHEEL
  time: number
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  x: number
  y: number
  clicks: number
  amount: number
  direction: WheelDirection
  rotation: number
}
export declare enum WheelDirection {
  VERTICAL = 3,
  HORIZONTAL = 4,
}
export declare const UiohookKey: {
  readonly Backspace: 14
  readonly Tab: 15
  readonly Enter: 28
  readonly CapsLock: 58
  readonly Escape: 1
  readonly Space: 57
  readonly PageUp: 3657
  readonly PageDown: 3665
  readonly End: 3663
  readonly Home: 3655
  readonly ArrowLeft: 57419
  readonly ArrowUp: 57416
  readonly ArrowRight: 57421
  readonly ArrowDown: 57424
  readonly Insert: 3666
  readonly Delete: 3667
  readonly 0: 11
  readonly 1: 2
  readonly 2: 3
  readonly 3: 4
  readonly 4: 5
  readonly 5: 6
  readonly 6: 7
  readonly 7: 8
  readonly 8: 9
  readonly 9: 10
  readonly A: 30
  readonly B: 48
  readonly C: 46
  readonly D: 32
  readonly E: 18
  readonly F: 33
  readonly G: 34
  readonly H: 35
  readonly I: 23
  readonly J: 36
  readonly K: 37
  readonly L: 38
  readonly M: 50
  readonly N: 49
  readonly O: 24
  readonly P: 25
  readonly Q: 16
  readonly R: 19
  readonly S: 31
  readonly T: 20
  readonly U: 22
  readonly V: 47
  readonly W: 17
  readonly X: 45
  readonly Y: 21
  readonly Z: 44
  readonly Numpad0: 82
  readonly Numpad1: 79
  readonly Numpad2: 80
  readonly Numpad3: 81
  readonly Numpad4: 75
  readonly Numpad5: 76
  readonly Numpad6: 77
  readonly Numpad7: 71
  readonly Numpad8: 72
  readonly Numpad9: 73
  readonly NumpadMultiply: 55
  readonly NumpadAdd: 78
  readonly NumpadSubtract: 74
  readonly NumpadDecimal: 83
  readonly NumpadDivide: 3637
  readonly NumpadEnd: number
  readonly NumpadArrowDown: number
  readonly NumpadPageDown: number
  readonly NumpadArrowLeft: number
  readonly NumpadArrowRight: number
  readonly NumpadHome: number
  readonly NumpadArrowUp: number
  readonly NumpadPageUp: number
  readonly NumpadInsert: number
  readonly NumpadDelete: number
  readonly F1: 59
  readonly F2: 60
  readonly F3: 61
  readonly F4: 62
  readonly F5: 63
  readonly F6: 64
  readonly F7: 65
  readonly F8: 66
  readonly F9: 67
  readonly F10: 68
  readonly F11: 87
  readonly F12: 88
  readonly F13: 91
  readonly F14: 92
  readonly F15: 93
  readonly F16: 99
  readonly F17: 100
  readonly F18: 101
  readonly F19: 102
  readonly F20: 103
  readonly F21: 104
  readonly F22: 105
  readonly F23: 106
  readonly F24: 107
  readonly Semicolon: 39
  readonly Equal: 13
  readonly Comma: 51
  readonly Minus: 12
  readonly Period: 52
  readonly Slash: 53
  readonly Backquote: 41
  readonly BracketLeft: 26
  readonly Backslash: 43
  readonly BracketRight: 27
  readonly Quote: 40
  readonly Ctrl: 29
  readonly CtrlRight: 3613
  readonly Alt: 56
  readonly AltRight: 3640
  readonly Shift: 42
  readonly ShiftRight: 54
  readonly Meta: 3675
  readonly MetaRight: 3676
  readonly NumLock: 69
  readonly ScrollLock: 70
  readonly PrintScreen: 3639
}
declare interface UiohookNapi {
  on(
    event: "input",
    listener: (
      e:
        | UiohookKeyboardEvent
        | UiohookMouseEvent
        | UiohookWheelEvent
    ) => void
  ): this
  on(
    event: "keydown",
    listener: (e: UiohookKeyboardEvent) => void
  ): this
  on(
    event: "keyup",
    listener: (e: UiohookKeyboardEvent) => void
  ): this
  on(
    event: "mousedown",
    listener: (e: UiohookMouseEvent) => void
  ): this
  on(
    event: "mouseup",
    listener: (e: UiohookMouseEvent) => void
  ): this
  on(
    event: "mousemove",
    listener: (e: UiohookMouseEvent) => void
  ): this
  on(
    event: "click",
    listener: (e: UiohookMouseEvent) => void
  ): this
  on(
    event: "wheel",
    listener: (e: UiohookWheelEvent) => void
  ): this
}
declare class UiohookNapi extends EventEmitter {
  private handler
  start(): void
  stop(): void
  keyTap(key: number, modifiers?: number[]): void
  keyToggle(key: number, toggle: "down" | "up"): void
}
export declare const uIOhook: UiohookNapi
