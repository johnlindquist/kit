export interface Size {
  // Docs: https://electronjs.org/docs/api/structures/size

  height: number
  width: number
}

export interface Point {
  // Docs: https://electronjs.org/docs/api/structures/point

  x: number
  y: number
}

export interface Rectangle {
  // Docs: https://electronjs.org/docs/api/structures/rectangle

  /**
   * The height of the rectangle (must be an integer).
   */
  height: number
  /**
   * The width of the rectangle (must be an integer).
   */
  width: number
  /**
   * The x coordinate of the origin of the rectangle (must be an integer).
   */
  x: number
  /**
   * The y coordinate of the origin of the rectangle (must be an integer).
   */
  y: number
}

export interface Display {
  // Docs: https://electronjs.org/docs/api/structures/display

  /**
   * Can be `available`, `unavailable`, `unknown`.
   */
  accelerometerSupport:
    | "available"
    | "unavailable"
    | "unknown"
  /**
   * the bounds of the display in DIP points.
   */
  bounds: Rectangle
  /**
   * The number of bits per pixel.
   */
  colorDepth: number
  /**
   *  represent a color space (three-dimensional object which contains all realizable
   * color combinations) for the purpose of color conversions
   */
  colorSpace: string
  /**
   * The number of bits per color component.
   */
  depthPerComponent: number
  /**
   * The display refresh rate.
   */
  displayFrequency: number
  /**
   * Unique identifier associated with the display.
   */
  id: number
  /**
   * `true` for an internal display and `false` for an external display
   */
  internal: boolean
  /**
   * Whether or not the display is a monochrome display.
   */
  monochrome: boolean
  /**
   * Can be 0, 90, 180, 270, represents screen rotation in clock-wise degrees.
   */
  rotation: number
  /**
   * Output device's pixel scale factor.
   */
  scaleFactor: number
  size: Size
  /**
   * Can be `available`, `unavailable`, `unknown`.
   */
  touchSupport: "available" | "unavailable" | "unknown"
  /**
   * the work area of the display in DIP points.
   */
  workArea: Rectangle
  workAreaSize: Size
}

interface BrowserWindowConstructorOptions {
  /**
   * Window's width in pixels. Default is `800`.
   */
  width?: number
  /**
   * Window's height in pixels. Default is `600`.
   */
  height?: number
  /**
   * (**required** if y is used) Window's left offset from screen. Default is to
   * center the window.
   */
  x?: number
  /**
   * (**required** if x is used) Window's top offset from screen. Default is to
   * center the window.
   */
  y?: number
  /**
   * The `width` and `height` would be used as web page's size, which means the
   * actual window's size will include window frame's size and be slightly larger.
   * Default is `false`.
   */
  useContentSize?: boolean
  /**
   * Show window in the center of the screen.
   */
  center?: boolean
  /**
   * Window's minimum width. Default is `0`.
   */
  minWidth?: number
  /**
   * Window's minimum height. Default is `0`.
   */
  minHeight?: number
  /**
   * Window's maximum width. Default is no limit.
   */
  maxWidth?: number
  /**
   * Window's maximum height. Default is no limit.
   */
  maxHeight?: number
  /**
   * Whether window is resizable. Default is `true`.
   */
  resizable?: boolean
  /**
   * Whether window is movable. This is not implemented on Linux. Default is `true`.
   */
  movable?: boolean
  /**
   * Whether window is minimizable. This is not implemented on Linux. Default is
   * `true`.
   */
  minimizable?: boolean
  /**
   * Whether window is maximizable. This is not implemented on Linux. Default is
   * `true`.
   */
  maximizable?: boolean
  /**
   * Whether window is closable. This is not implemented on Linux. Default is `true`.
   */
  closable?: boolean
  /**
   * Whether the window can be focused. Default is `true`. On Windows setting
   * `focusable: false` also implies setting `skipTaskbar: true`. On Linux setting
   * `focusable: false` makes the window stop interacting with wm, so the window will
   * always stay on top in all workspaces.
   */
  focusable?: boolean
  /**
   * Whether the window should always stay on top of other windows. Default is
   * `false`.
   */
  alwaysOnTop?: boolean
  /**
   * Whether the window should show in fullscreen. When explicitly set to `false` the
   * fullscreen button will be hidden or disabled on macOS. Default is `false`.
   */
  fullscreen?: boolean
  /**
   * Whether the window can be put into fullscreen mode. On macOS, also whether the
   * maximize/zoom button should toggle full screen mode or maximize window. Default
   * is `true`.
   */
  fullscreenable?: boolean
  /**
   * Use pre-Lion fullscreen on macOS. Default is `false`.
   */
  simpleFullscreen?: boolean
  /**
   * Whether to show the window in taskbar. Default is `false`.
   */
  skipTaskbar?: boolean
  /**
   * Whether the window is in kiosk mode. Default is `false`.
   */
  kiosk?: boolean
  /**
   * Default window title. Default is `"Electron"`. If the HTML tag `<title>` is
   * defined in the HTML file loaded by `loadURL()`, this property will be ignored.
   */
  title?: string
  /**
   * The window icon. On Windows it is recommended to use `ICO` icons to get best
   * visual effects, you can also leave it undefined so the executable's icon will be
   * used.
   */
  icon?: string
  /**
   * Whether window should be shown when created. Default is `true`.
   */
  show?: boolean
  /**
   * Whether the renderer should be active when `show` is `false` and it has just
   * been created.  In order for `document.visibilityState` to work correctly on
   * first load with `show: false` you should set this to `false`.  Setting this to
   * `false` will cause the `ready-to-show` event to not fire.  Default is `true`.
   */
  paintWhenInitiallyHidden?: boolean
  /**
   * Specify `false` to create a frameless window. Default is `true`.
   */
  frame?: boolean

  /**
   * Whether this is a modal window. This only works when the window is a child
   * window. Default is `false`.
   */
  modal?: boolean
  /**
   * Whether clicking an inactive window will also click through to the web contents.
   * Default is `false` on macOS. This option is not configurable on other platforms.
   */
  acceptFirstMouse?: boolean
  /**
   * Whether to hide cursor when typing. Default is `false`.
   */
  disableAutoHideCursor?: boolean
  /**
   * Auto hide the menu bar unless the `Alt` key is pressed. Default is `false`.
   */
  autoHideMenuBar?: boolean
  /**
   * Enable the window to be resized larger than screen. Only relevant for macOS, as
   * other OSes allow larger-than-screen windows by default. Default is `false`.
   */
  enableLargerThanScreen?: boolean
  /**
   * Window's background color as a hexadecimal value, like `#66CD00` or `#FFF` or
   * `#80FFFFFF` (alpha in #AARRGGBB format is supported if `transparent` is set to
   * `true`). Default is `#FFF` (white).
   */
  backgroundColor?: string
  /**
   * Whether window should have a shadow. Default is `true`.
   */
  hasShadow?: boolean
  /**
   * Set the initial opacity of the window, between 0.0 (fully transparent) and 1.0
   * (fully opaque). This is only implemented on Windows and macOS.
   */
  opacity?: number
  /**
   * Forces using dark theme for the window, only works on some GTK+3 desktop
   * environments. Default is `false`.
   */
  darkTheme?: boolean
  /**
   * Makes the window transparent. Default is `false`. On Windows, does not work
   * unless the window is frameless.
   */
  transparent?: boolean
  /**
   * The type of window, default is normal window. See more about this below.
   */
  type?: string
  /**
   * Specify how the material appearance should reflect window activity state on
   * macOS. Must be used with the `vibrancy` property. Possible values are:
   */
  visualEffectState?: "followWindow" | "active" | "inactive"
  /**
   * The style of window title bar. Default is `default`. Possible values are:
   *
   * @platform darwin,win32
   */
  titleBarStyle?:
    | "default"
    | "hidden"
    | "hiddenInset"
    | "customButtonsOnHover"
  /**
   * Set a custom position for the traffic light buttons in frameless windows.
   */
  trafficLightPosition?: Point
  /**
   * Whether frameless window should have rounded corners on macOS. Default is
   * `true`.
   */
  roundedCorners?: boolean
  /**
   * Shows the title in the title bar in full screen mode on macOS for `hiddenInset`
   * titleBarStyle. Default is `false`.
   *
   * @deprecated
   */
  fullscreenWindowTitle?: boolean
  /**
   * Use `WS_THICKFRAME` style for frameless windows on Windows, which adds standard
   * window frame. Setting it to `false` will remove window shadow and window
   * animations. Default is `true`.
   */
  thickFrame?: boolean
  /**
   * Add a type of vibrancy effect to the window, only on macOS. Can be
   * `appearance-based`, `light`, `dark`, `titlebar`, `selection`, `menu`, `popover`,
   * `sidebar`, `medium-light`, `ultra-dark`, `header`, `sheet`, `window`, `hud`,
   * `fullscreen-ui`, `tooltip`, `content`, `under-window`, or `under-page`. Please
   * note that `appearance-based`, `light`, `dark`, `medium-light`, and `ultra-dark`
   * are deprecated and have been removed in macOS Catalina (10.15).
   */
  vibrancy?:
    | "appearance-based"
    | "light"
    | "dark"
    | "titlebar"
    | "selection"
    | "menu"
    | "popover"
    | "sidebar"
    | "medium-light"
    | "ultra-dark"
    | "header"
    | "sheet"
    | "window"
    | "hud"
    | "fullscreen-ui"
    | "tooltip"
    | "content"
    | "under-window"
    | "under-page"
  /**
   * Controls the behavior on macOS when option-clicking the green stoplight button
   * on the toolbar or by clicking the Window > Zoom menu item. If `true`, the window
   * will grow to the preferred width of the web page when zoomed, `false` will cause
   * it to zoom to the width of the screen. This will also affect the behavior when
   * calling `maximize()` directly. Default is `false`.
   */
  zoomToPageWidth?: boolean
  /**
   * Tab group name, allows opening the window as a native tab on macOS 10.12+.
   * Windows with the same tabbing identifier will be grouped together. This also
   * adds a native new tab button to your window's tab bar and allows your `app` and
   * window to receive the `new-window-for-tab` event.
   */
  tabbingIdentifier?: string
  /**
   * Settings of web page's features.
   */
  webPreferences?: WebPreferences
  /**
   *  When using a frameless window in conjuction with
   * `win.setWindowButtonVisibility(true)` on macOS or using a `titleBarStyle` so
   * that the standard window controls ("traffic lights" on macOS) are visible, this
   * property enables the Window Controls Overlay JavaScript APIs and CSS Environment
   * Variables. Specifying `true` will result in an overlay with default system
   * colors. Default is `false`.
   */
  titleBarOverlay?: TitleBarOverlay | boolean
}
