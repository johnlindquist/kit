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

interface TitleBarOverlay {
  /**
   * The CSS color of the Window Controls Overlay when enabled. Default is the system
   * color.
   *
   * @platform win32
   */
  color?: string
  /**
   * The CSS color of the symbols on the Window Controls Overlay when enabled.
   * Default is the system color.
   *
   * @platform win32
   */
  symbolColor?: string
  /**
   * The height of the title bar and Window Controls Overlay in pixels. Default is
   * system height.
   *
   * @platform darwin,win32
   */
  height?: number
}

interface WebPreferences {
  /**
   * Whether to enable DevTools. If it is set to `false`, can not use
   * `BrowserWindow.webContents.openDevTools()` to open DevTools. Default is `true`.
   */
  devTools?: boolean
  /**
   * Whether node integration is enabled. Default is `false`.
   */
  nodeIntegration?: boolean
  /**
   * Whether node integration is enabled in web workers. Default is `false`. More
   * about this can be found in Multithreading.
   */
  nodeIntegrationInWorker?: boolean
  /**
   * Experimental option for enabling Node.js support in sub-frames such as iframes
   * and child windows. All your preloads will load for every iframe, you can use
   * `process.isMainFrame` to determine if you are in the main frame or not.
   */
  nodeIntegrationInSubFrames?: boolean
  /**
   * Specifies a script that will be loaded before other scripts run in the page.
   * This script will always have access to node APIs no matter whether node
   * integration is turned on or off. The value should be the absolute file path to
   * the script. When node integration is turned off, the preload script can
   * reintroduce Node global symbols back to the global scope. See example here.
   */
  preload?: string
  /**
   * If set, this will sandbox the renderer associated with the window, making it
   * compatible with the Chromium OS-level sandbox and disabling the Node.js engine.
   * This is not the same as the `nodeIntegration` option and the APIs available to
   * the preload script are more limited. Read more about the option here.
   */
  sandbox?: boolean
  /**
   * Sets the session used by the page. Instead of passing the Session object
   * directly, you can also choose to use the `partition` option instead, which
   * accepts a partition string. When both `session` and `partition` are provided,
   * `session` will be preferred. Default is the default session.
   */

  partition?: string
  /**
   * The default zoom factor of the page, `3.0` represents `300%`. Default is `1.0`.
   */
  zoomFactor?: number
  /**
   * Enables JavaScript support. Default is `true`.
   */
  javascript?: boolean
  /**
   * When `false`, it will disable the same-origin policy (usually using testing
   * websites by people), and set `allowRunningInsecureContent` to `true` if this
   * options has not been set by user. Default is `true`.
   */
  webSecurity?: boolean
  /**
   * Allow an https page to run JavaScript, CSS or plugins from http URLs. Default is
   * `false`.
   */
  allowRunningInsecureContent?: boolean
  /**
   * Enables image support. Default is `true`.
   */
  images?: boolean
  /**
   * Specifies how to run image animations (E.g. GIFs).  Can be `animate`,
   * `animateOnce` or `noAnimation`.  Default is `animate`.
   */
  imageAnimationPolicy?:
    | "animate"
    | "animateOnce"
    | "noAnimation"
  /**
   * Make TextArea elements resizable. Default is `true`.
   */
  textAreasAreResizable?: boolean
  /**
   * Enables WebGL support. Default is `true`.
   */
  webgl?: boolean
  /**
   * Whether plugins should be enabled. Default is `false`.
   */
  plugins?: boolean
  /**
   * Enables Chromium's experimental features. Default is `false`.
   */
  experimentalFeatures?: boolean
  /**
   * Enables scroll bounce (rubber banding) effect on macOS. Default is `false`.
   *
   * @platform darwin
   */
  scrollBounce?: boolean
  /**
   * A list of feature strings separated by `,`, like `CSSVariables,KeyboardEventKey`
   * to enable. The full list of supported feature strings can be found in the
   * RuntimeEnabledFeatures.json5 file.
   */
  enableBlinkFeatures?: string
  /**
   * A list of feature strings separated by `,`, like `CSSVariables,KeyboardEventKey`
   * to disable. The full list of supported feature strings can be found in the
   * RuntimeEnabledFeatures.json5 file.
   */
  disableBlinkFeatures?: string
  /**
   * Sets the default font for the font-family.
   */
  defaultFontFamily?: DefaultFontFamily
  /**
   * Defaults to `16`.
   */
  defaultFontSize?: number
  /**
   * Defaults to `13`.
   */
  defaultMonospaceFontSize?: number
  /**
   * Defaults to `0`.
   */
  minimumFontSize?: number
  /**
   * Defaults to `ISO-8859-1`.
   */
  defaultEncoding?: string
  /**
   * Whether to throttle animations and timers when the page becomes background. This
   * also affects the Page Visibility API. Defaults to `true`.
   */
  backgroundThrottling?: boolean
  /**
   * Whether to enable offscreen rendering for the browser window. Defaults to
   * `false`. See the offscreen rendering tutorial for more details.
   */
  offscreen?: boolean
  /**
   * Whether to run Electron APIs and the specified `preload` script in a separate
   * JavaScript context. Defaults to `true`. The context that the `preload` script
   * runs in will only have access to its own dedicated `document` and `window`
   * globals, as well as its own set of JavaScript builtins (`Array`, `Object`,
   * `JSON`, etc.), which are all invisible to the loaded content. The Electron API
   * will only be available in the `preload` script and not the loaded page. This
   * option should be used when loading potentially untrusted remote content to
   * ensure the loaded content cannot tamper with the `preload` script and any
   * Electron APIs being used.  This option uses the same technique used by Chrome
   * Content Scripts.  You can access this context in the dev tools by selecting the
   * 'Electron Isolated Context' entry in the combo box at the top of the Console
   * tab.
   */
  contextIsolation?: boolean
  /**
   * Whether to enable the `<webview>` tag. Defaults to `false`. **Note:** The
   * `preload` script configured for the `<webview>` will have node integration
   * enabled when it is executed so you should ensure remote/untrusted content is not
   * able to create a `<webview>` tag with a possibly malicious `preload` script. You
   * can use the `will-attach-webview` event on webContents to strip away the
   * `preload` script and to validate or alter the `<webview>`'s initial settings.
   */
  webviewTag?: boolean
  /**
   * A list of strings that will be appended to `process.argv` in the renderer
   * process of this app.  Useful for passing small bits of data down to renderer
   * process preload scripts.
   */
  additionalArguments?: string[]
  /**
   * Whether to enable browser style consecutive dialog protection. Default is
   * `false`.
   */
  safeDialogs?: boolean
  /**
   * The message to display when consecutive dialog protection is triggered. If not
   * defined the default message would be used, note that currently the default
   * message is in English and not localized.
   */
  safeDialogsMessage?: string
  /**
   * Whether to disable dialogs completely. Overrides `safeDialogs`. Default is
   * `false`.
   */
  disableDialogs?: boolean
  /**
   * Whether dragging and dropping a file or link onto the page causes a navigation.
   * Default is `false`.
   */
  navigateOnDragDrop?: boolean
  /**
   * Autoplay policy to apply to content in the window, can be
   * `no-user-gesture-required`, `user-gesture-required`,
   * `document-user-activation-required`. Defaults to `no-user-gesture-required`.
   */
  autoplayPolicy?:
    | "no-user-gesture-required"
    | "user-gesture-required"
    | "document-user-activation-required"
  /**
   * Whether to prevent the window from resizing when entering HTML Fullscreen.
   * Default is `false`.
   */
  disableHtmlFullscreenWindowResize?: boolean
  /**
   * An alternative title string provided only to accessibility tools such as screen
   * readers. This string is not directly visible to users.
   */
  accessibleTitle?: string
  /**
   * Whether to enable the builtin spellchecker. Default is `true`.
   */
  spellcheck?: boolean
  /**
   * Whether to enable the WebSQL api. Default is `true`.
   */
  enableWebSQL?: boolean
  /**
   * Enforces the v8 code caching policy used by blink. Accepted values are
   */
  v8CacheOptions?:
    | "none"
    | "code"
    | "bypassHeatCheck"
    | "bypassHeatCheckAndEagerCompile"
  /**
   * Whether to enable preferred size mode. The preferred size is the minimum size
   * needed to contain the layout of the document—without requiring scrolling.
   * Enabling this will cause the `preferred-size-changed` event to be emitted on the
   * `WebContents` when the preferred size changes. Default is `false`.
   */
  enablePreferredSizeMode?: boolean
}

interface DefaultFontFamily {
  /**
   * Defaults to `Times New Roman`.
   */
  standard?: string
  /**
   * Defaults to `Times New Roman`.
   */
  serif?: string
  /**
   * Defaults to `Arial`.
   */
  sansSerif?: string
  /**
   * Defaults to `Courier New`.
   */
  monospace?: string
  /**
   * Defaults to `Script`.
   */
  cursive?: string
  /**
   * Defaults to `Impact`.
   */
  fantasy?: string
}
