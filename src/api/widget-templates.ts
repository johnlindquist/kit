/**
 * Widget Templates - Pre-built widget patterns for common use cases
 *
 * These templates extend the base widget() function with convenient factory methods
 * that create fully configured widgets with sensible defaults.
 */

import type { WidgetAPI, WidgetOptions } from '../types/pro.js'

// ============================================================================
// Template Option Types
// ============================================================================

export interface ClockOptions extends Partial<WidgetOptions> {
  /** Time format: '12h', '24h', or custom like 'HH:mm:ss' */
  format?: '12h' | '24h' | 'HH:mm' | 'HH:mm:ss'
  /** Show date below time */
  showDate?: boolean
  /** Visual theme */
  theme?: 'minimal' | 'digital' | 'bold'
}

export interface CounterOptions extends Partial<WidgetOptions> {
  /** Starting value */
  initial?: number
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
  /** Increment/decrement step */
  step?: number
  /** Label text above counter */
  label?: string
}

export interface CounterAPI extends WidgetAPI {
  /** Current counter value */
  value: number
  /** Increment by step */
  increment: () => void
  /** Decrement by step */
  decrement: () => void
  /** Set to specific value */
  setValue: (value: number) => void
}

export interface StatusBadgeOptions extends Partial<WidgetOptions> {
  /** Icon or emoji to display */
  icon?: string
  /** Badge color */
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple' | 'orange'
  /** Enable pulse animation */
  pulse?: boolean
  /** Optional tooltip text */
  tooltip?: string
}

export interface ProgressOptions extends Partial<WidgetOptions> {
  /** Current progress (0-100) */
  value?: number
  /** Optional label */
  label?: string
  /** Show percentage text */
  showPercent?: boolean
  /** Bar color */
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

export interface ProgressAPI extends WidgetAPI {
  /** Current progress value */
  value: number
  /** Set progress (0-100) */
  setProgress: (value: number) => void
  /** Set label text */
  setLabel: (label: string) => void
}

export interface TextOptions extends Partial<WidgetOptions> {
  /** Font size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Text color (Tailwind color) */
  color?: string
  /** Font weight */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

export interface TextAPI extends WidgetAPI {
  /** Update displayed text */
  setText: (text: string) => void
}

// ============================================================================
// Color Mappings
// ============================================================================

const badgeColors: Record<string, { bg: string; text: string }> = {
  green: { bg: 'bg-green-500', text: 'text-white' },
  yellow: { bg: 'bg-yellow-500', text: 'text-black' },
  red: { bg: 'bg-red-500', text: 'text-white' },
  blue: { bg: 'bg-blue-500', text: 'text-white' },
  gray: { bg: 'bg-gray-500', text: 'text-white' },
  purple: { bg: 'bg-purple-500', text: 'text-white' },
  orange: { bg: 'bg-orange-500', text: 'text-white' }
}

const progressColors: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500'
}

const textSizes: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl'
}

// ============================================================================
// Template Implementations
// ============================================================================

/**
 * Creates widget template functions that use the provided base widget function
 */
export function createWidgetTemplates(baseWidget: (html: string, options?: WidgetOptions) => Promise<WidgetAPI>) {
  return {
    /**
     * Creates a live clock widget
     * @example
     * const clock = await widget.clock({ format: '12h', showDate: true })
     */
    clock: async (options: ClockOptions = {}): Promise<WidgetAPI> => {
      const {
        format = 'HH:mm:ss',
        showDate = false,
        theme = 'minimal',
        ...widgetOpts
      } = options

      const themeClasses = {
        minimal: 'bg-transparent',
        digital: 'bg-black text-green-400 font-mono',
        bold: 'bg-gray-900 text-white'
      }

      const html = `
        <div class="p-4 text-center select-none ${themeClasses[theme]}">
          <div class="text-4xl font-bold tracking-wider">{{time}}</div>
          ${showDate ? '<div class="text-sm opacity-70 mt-1">{{date}}</div>' : ''}
        </div>
      `.trim()

      const w = await baseWidget(html, {
        transparent: theme === 'minimal',
        draggable: true,
        alwaysOnTop: true,
        hasShadow: theme !== 'minimal',
        width: 220,
        height: showDate ? 100 : 70,
        state: { time: '', date: '' },
        ...widgetOpts
      })

      const formatTime = (date: Date): string => {
        switch (format) {
          case '12h':
            return date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: undefined,
              hour12: true
            })
          case '24h':
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
          case 'HH:mm':
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
          case 'HH:mm:ss':
          default:
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
        }
      }

      const updateTime = () => {
        const now = new Date()
        w.setState({
          time: formatTime(now),
          date: now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })
        })
      }

      updateTime()
      const interval = setInterval(updateTime, 1000)

      // Clean up interval when widget closes
      const originalClose = w.close.bind(w)
      w.close = () => {
        clearInterval(interval)
        originalClose()
      }

      w.onClose(() => clearInterval(interval))

      return w
    },

    /**
     * Creates an interactive counter widget with +/- buttons
     * @example
     * const counter = await widget.counter({ initial: 0, min: 0, max: 100 })
     * console.log(counter.value) // 0
     * counter.increment() // value is now 1
     */
    counter: async (options: CounterOptions = {}): Promise<CounterAPI> => {
      const {
        initial = 0,
        min = Number.NEGATIVE_INFINITY,
        max = Number.POSITIVE_INFINITY,
        step = 1,
        label,
        ...widgetOpts
      } = options

      const html = `
        <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg select-none">
          ${label ? '<div class="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">{{label}}</div>' : ''}
          <div class="flex items-center justify-center gap-4">
            <button
              id="dec"
              class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xl font-bold transition-colors flex items-center justify-center"
            >−</button>
            <span class="text-3xl font-mono min-w-[80px] text-center font-bold">{{count}}</span>
            <button
              id="inc"
              class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xl font-bold transition-colors flex items-center justify-center"
            >+</button>
          </div>
        </div>
      `.trim()

      let currentValue = Math.max(min, Math.min(max, initial))

      const w = await baseWidget(html, {
        draggable: true,
        transparent: true,
        hasShadow: false,
        width: 220,
        height: label ? 110 : 85,
        state: { count: currentValue, label: label || '' },
        ...widgetOpts
      })

      const clamp = (v: number) => Math.max(min, Math.min(max, v))

      const api = w as CounterAPI

      Object.defineProperty(api, 'value', {
        get: () => currentValue,
        set: (v: number) => {
          currentValue = clamp(v)
          w.setState({ count: currentValue })
        }
      })

      api.increment = () => {
        api.value = currentValue + step
      }

      api.decrement = () => {
        api.value = currentValue - step
      }

      api.setValue = (v: number) => {
        api.value = v
      }

      w.onClick((e) => {
        if (e.targetId === 'inc') {
          api.increment()
        } else if (e.targetId === 'dec') {
          api.decrement()
        }
      })

      return api
    },

    /**
     * Creates a status badge/indicator widget
     * @example
     * const status = await widget.statusBadge({ icon: '✓', color: 'green', pulse: true })
     */
    statusBadge: async (options: StatusBadgeOptions = {}): Promise<WidgetAPI> => {
      const {
        icon = '●',
        color = 'green',
        pulse = false,
        tooltip,
        ...widgetOpts
      } = options

      const colorStyle = badgeColors[color] || badgeColors.green

      const html = `
        <div class="p-2" ${tooltip ? `title="${tooltip}"` : ''}>
          <span class="${colorStyle.bg} ${colorStyle.text} ${pulse ? 'animate-pulse' : ''} inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold shadow-lg">
            {{icon}}
          </span>
        </div>
      `.trim()

      return await baseWidget(html, {
        transparent: true,
        draggable: true,
        alwaysOnTop: true,
        hasShadow: false,
        width: 60,
        height: 60,
        state: { icon },
        ...widgetOpts
      })
    },

    /**
     * Creates a progress bar widget
     * @example
     * const progress = await widget.progress({ value: 50, label: 'Loading...' })
     * progress.setProgress(75)
     */
    progress: async (options: ProgressOptions = {}): Promise<ProgressAPI> => {
      const {
        value = 0,
        label,
        showPercent = true,
        color = 'blue',
        ...widgetOpts
      } = options

      const barColor = progressColors[color] || progressColors.blue

      const html = `
        <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[200px]">
          ${label ? '<div class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{label}}</div>' : ''}
          <div class="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="${barColor} h-full rounded-full transition-all duration-300"
              :style="{ width: progress + '%' }"
            ></div>
          </div>
          ${showPercent ? '<div class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{{progress}}%</div>' : ''}
        </div>
      `.trim()

      let currentValue = Math.max(0, Math.min(100, value))
      let currentLabel = label || ''

      const w = await baseWidget(html, {
        transparent: true,
        draggable: true,
        hasShadow: false,
        width: 280,
        height: label ? 95 : 70,
        state: { progress: currentValue, label: currentLabel },
        ...widgetOpts
      })

      const api = w as ProgressAPI

      Object.defineProperty(api, 'value', {
        get: () => currentValue,
        set: (v: number) => {
          currentValue = Math.max(0, Math.min(100, v))
          w.setState({ progress: currentValue })
        }
      })

      api.setProgress = (v: number) => {
        api.value = v
      }

      api.setLabel = (l: string) => {
        currentLabel = l
        w.setState({ label: currentLabel })
      }

      return api
    },

    /**
     * Creates a simple text display widget
     * @example
     * const text = await widget.text('Hello World', { size: '2xl', align: 'center' })
     * text.setText('Updated!')
     */
    text: async (content: string, options: TextOptions = {}): Promise<TextAPI> => {
      const {
        size = 'lg',
        align = 'center',
        color = 'text-gray-900 dark:text-gray-100',
        weight = 'normal',
        ...widgetOpts
      } = options

      const sizeClass = textSizes[size] || textSizes.lg
      const alignClass = `text-${align}`
      const weightClass = `font-${weight}`

      const html = `
        <div class="p-4 ${sizeClass} ${alignClass} ${weightClass} ${color}">
          {{content}}
        </div>
      `.trim()

      const w = await baseWidget(html, {
        transparent: true,
        draggable: true,
        hasShadow: false,
        width: 300,
        height: 80,
        state: { content },
        ...widgetOpts
      })

      const api = w as TextAPI

      api.setText = (text: string) => {
        w.setState({ content: text })
      }

      return api
    },

    /**
     * Creates a timer/stopwatch widget
     * @example
     * const timer = await widget.timer({ autoStart: true })
     */
    timer: async (options: Partial<WidgetOptions> & {
      autoStart?: boolean
      countdown?: number // seconds
    } = {}): Promise<WidgetAPI & {
      start: () => void
      stop: () => void
      reset: () => void
      elapsed: number
    }> => {
      const { autoStart = false, countdown, ...widgetOpts } = options

      const html = `
        <div class="p-4 bg-gray-900 text-white rounded-lg shadow-lg font-mono select-none">
          <div class="text-3xl text-center tracking-widest">{{display}}</div>
          <div class="flex justify-center gap-2 mt-3">
            <button id="start" class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm">▶</button>
            <button id="stop" class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">■</button>
            <button id="reset" class="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm">↺</button>
          </div>
        </div>
      `.trim()

      let elapsed = countdown ? countdown * 1000 : 0
      let running = false
      let intervalId: NodeJS.Timeout | null = null
      const isCountdown = !!countdown

      const formatTime = (ms: number): string => {
        const totalSeconds = Math.floor(Math.abs(ms) / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }

      const w = await baseWidget(html, {
        transparent: true,
        draggable: true,
        alwaysOnTop: true,
        hasShadow: false,
        width: 200,
        height: 110,
        state: { display: formatTime(elapsed) },
        ...widgetOpts
      })

      const update = () => {
        w.setState({ display: formatTime(elapsed) })
      }

      const api = w as WidgetAPI & {
        start: () => void
        stop: () => void
        reset: () => void
        elapsed: number
      }

      Object.defineProperty(api, 'elapsed', {
        get: () => elapsed
      })

      api.start = () => {
        if (running) return
        running = true
        const startTime = Date.now() - (isCountdown ? 0 : elapsed)
        const startElapsed = elapsed

        intervalId = setInterval(() => {
          if (isCountdown) {
            elapsed = startElapsed - (Date.now() - startTime + startElapsed - elapsed)
            elapsed = Math.max(0, startElapsed - (Date.now() - startTime))
            if (elapsed <= 0) {
              elapsed = 0
              api.stop()
            }
          } else {
            elapsed = Date.now() - startTime
          }
          update()
        }, 100)
      }

      api.stop = () => {
        running = false
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }

      api.reset = () => {
        api.stop()
        elapsed = countdown ? countdown * 1000 : 0
        update()
      }

      w.onClick((e) => {
        switch (e.targetId) {
          case 'start':
            api.start()
            break
          case 'stop':
            api.stop()
            break
          case 'reset':
            api.reset()
            break
        }
      })

      const originalClose = w.close.bind(w)
      w.close = () => {
        api.stop()
        originalClose()
      }

      w.onClose(() => api.stop())

      if (autoStart) {
        api.start()
      }

      return api
    }
  }
}

export type WidgetTemplates = ReturnType<typeof createWidgetTemplates>
