/**
 * Screen Recording API for Script Kit
 * Enables screen capture with optional area selection
 *
 * These functions are available globally in scripts.
 * This module re-exports them for explicit imports if needed.
 */

/**
 * Screen source available for recording
 */
export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
  displayId: string
}

/**
 * Area definition for recording a portion of the screen
 */
export interface RecordingArea {
  x: number
  y: number
  width: number
  height: number
  displayId?: number
}

/**
 * Result returned from a screen recording operation
 */
export interface ScreenRecordingResult {
  filePath: string
  duration: number
  width: number
  height: number
  cancelled: boolean
}

/**
 * Result returned from a measurement operation
 */
export interface MeasureResult {
  x: number
  y: number
  width: number
  height: number
  right: number
  bottom: number
  centerX: number
  centerY: number
  area: number
  displayId?: string
  scaleFactor?: number
  cancelled: boolean
}

/**
 * Configuration options for screen recording
 */
export interface ScreenRecordOptions {
  /** Video format: 'webm' or 'mp4' (default: 'webm') */
  format?: 'webm' | 'mp4'
  /** Video quality 0.0-1.0 (default: 0.9) */
  quality?: number
  /** Frame rate in FPS (default: 30) */
  frameRate?: number
  /** Include system audio (default: false) */
  includeAudio?: boolean
  /** Whether to prompt for area selection (default: false for full screen) */
  selectArea?: boolean
  /** Pre-defined area to record (skips area selection) */
  area?: RecordingArea
  /** Specific source ID to record (skips source selection) */
  sourceId?: string
  /** Custom file path for the recording (default: temp directory) */
  filePath?: string
  /** Maximum recording duration in seconds (0 = unlimited) */
  maxDuration?: number
  /** Instructions shown to the user during area selection */
  hint?: string
  /** Whether to show recording controls overlay (default: true) */
  showControls?: boolean
  /** Whether to show countdown before recording starts (default: true) */
  countdown?: boolean
  /** Countdown duration in seconds (default: 3) */
  countdownSeconds?: number
}

/**
 * Configuration options for the measurement tool
 */
export interface MeasureOptions {
  /** Stroke color for the selection rectangle (default: #00ff00) */
  color?: string
  /** Width of the selection border in pixels (default: 2) */
  strokeWidth?: number
  /** Opacity of the selection fill (0-1, default: 0.1) */
  fillOpacity?: number
  /** Whether to show dimension labels (default: true) */
  showDimensions?: boolean
  /** Whether to show crosshair guides (default: true) */
  showCrosshair?: boolean
  /** Font size for dimension labels (default: 14) */
  fontSize?: number
  /** Grid size for snapping, 1 = no snap (default: 1) */
  gridSnap?: number
  /** Whether to constrain selection to current display (default: false) */
  constrainToDisplay?: boolean
  /** Whether to allow keyboard adjustments after initial drag (default: true) */
  allowKeyboardAdjust?: boolean
  /** Instructions shown to the user */
  hint?: string
  /** Starting position for the overlay (follows cursor if not specified) */
  startPosition?: { x: number; y: number }
  /** Initial rectangle to display (for editing existing measurement) */
  initialRect?: { x: number; y: number; width: number; height: number }
  /** Clipboard format when user presses Cmd+C during measurement */
  clipboardFormat?: 'dimensions' | 'css' | 'json'
}

/**
 * Get available screen sources for recording
 * @see global.getScreenSources
 */
export const getScreenSources = (): Promise<ScreenSource[]> => global.getScreenSources()

/**
 * Start a screen recording session
 * @see global.screenRecord
 */
export const screenRecord = (options?: ScreenRecordOptions): Promise<ScreenRecordingResult | null> =>
  global.screenRecord(options)

/**
 * Stop an active screen recording
 * @see global.stopScreenRecording
 */
export const stopScreenRecording = (): Promise<ScreenRecordingResult | null> =>
  global.stopScreenRecording()

/**
 * Pause an active screen recording
 * @see global.pauseScreenRecording
 */
export const pauseScreenRecording = (): Promise<boolean> => global.pauseScreenRecording()

/**
 * Resume a paused screen recording
 * @see global.resumeScreenRecording
 */
export const resumeScreenRecording = (): Promise<boolean> => global.resumeScreenRecording()

/**
 * Get the current screen recording status
 * @see global.getScreenRecordingStatus
 */
export const getScreenRecordingStatus = () => global.getScreenRecordingStatus()

/**
 * Opens a transparent overlay for measuring screen areas
 * @see global.measure
 */
export const measure = (options?: MeasureOptions): Promise<MeasureResult | null> =>
  global.measure(options)
