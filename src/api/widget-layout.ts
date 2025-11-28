/**
 * Widget Layout Helpers - Utility functions for positioning widgets
 *
 * Provides layout presets for common widget positions (corners, edges, center)
 * without requiring manual coordinate calculations.
 */

/**
 * Layout preset types for widget positioning
 */
export type LayoutPreset =
  | 'center'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'sidebar-right'
  | 'sidebar-left'
  | 'top-bar'
  | 'bottom-bar'

/**
 * Layout options for widget positioning
 */
export interface LayoutOptions {
  /** Layout preset for automatic positioning */
  layout?: LayoutPreset
  /** Margin from screen edges (default: 20) */
  margin?: number
  /** Monitor to use: 'current' (where cursor is) or 'primary' */
  monitor?: 'current' | 'primary'
}

/**
 * Screen work area information
 */
export interface WorkArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Calculate widget position based on layout preset
 *
 * @param layout - The layout preset to use
 * @param workArea - The screen work area (respects taskbar/dock)
 * @param widgetSize - The widget dimensions
 * @param margin - Margin from screen edges
 * @returns The calculated x, y position
 */
export function calculateLayoutPosition(
  layout: LayoutPreset,
  workArea: WorkArea,
  widgetSize: { width: number; height: number },
  margin = 20
): { x: number; y: number } {
  const { x, y, width, height } = workArea
  const { width: w, height: h } = widgetSize

  switch (layout) {
    case 'center':
      return {
        x: x + Math.round((width - w) / 2),
        y: y + Math.round((height - h) / 2)
      }

    case 'top-right':
      return {
        x: x + width - w - margin,
        y: y + margin
      }

    case 'top-left':
      return {
        x: x + margin,
        y: y + margin
      }

    case 'bottom-right':
      return {
        x: x + width - w - margin,
        y: y + height - h - margin
      }

    case 'bottom-left':
      return {
        x: x + margin,
        y: y + height - h - margin
      }

    case 'sidebar-right':
      return {
        x: x + width - w,
        y: y
      }

    case 'sidebar-left':
      return {
        x: x,
        y: y
      }

    case 'top-bar':
      return {
        x: x,
        y: y
      }

    case 'bottom-bar':
      return {
        x: x,
        y: y + height - h
      }

    default:
      // Default to top-right
      return {
        x: x + width - w - margin,
        y: y + margin
      }
  }
}

/**
 * Calculate widget size based on layout preset
 * Some layouts like sidebars and bars should span the full dimension
 *
 * @param layout - The layout preset
 * @param workArea - The screen work area
 * @param requestedSize - The requested widget size
 * @returns The calculated width and height
 */
export function calculateLayoutSize(
  layout: LayoutPreset,
  workArea: WorkArea,
  requestedSize: { width?: number; height?: number }
): { width: number; height: number } {
  const { width: areaWidth, height: areaHeight } = workArea
  const { width = 300, height = 200 } = requestedSize

  switch (layout) {
    case 'sidebar-right':
    case 'sidebar-left':
      // Sidebars span full height
      return {
        width,
        height: areaHeight
      }

    case 'top-bar':
    case 'bottom-bar':
      // Bars span full width
      return {
        width: areaWidth,
        height
      }

    default:
      // Use requested size or defaults
      return { width, height }
  }
}

/**
 * Check if a layout preset is a full-edge layout (sidebar or bar)
 */
export function isFullEdgeLayout(layout: LayoutPreset): boolean {
  return ['sidebar-right', 'sidebar-left', 'top-bar', 'bottom-bar'].includes(layout)
}

/**
 * Get layout preset description for documentation
 */
export function getLayoutDescription(layout: LayoutPreset): string {
  const descriptions: Record<LayoutPreset, string> = {
    'center': 'Centered on screen',
    'top-right': 'Top-right corner with margin',
    'top-left': 'Top-left corner with margin',
    'bottom-right': 'Bottom-right corner with margin',
    'bottom-left': 'Bottom-left corner with margin',
    'sidebar-right': 'Right edge, full height',
    'sidebar-left': 'Left edge, full height',
    'top-bar': 'Top edge, full width',
    'bottom-bar': 'Bottom edge, full width'
  }
  return descriptions[layout] || 'Unknown layout'
}
