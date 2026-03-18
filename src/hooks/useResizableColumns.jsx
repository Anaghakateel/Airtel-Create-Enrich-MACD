import { useState, useCallback, useEffect } from 'react'

const MIN_COLUMN_WIDTH = 56
const CHARS_PER_PX = 5.5
const LABEL_PADDING = 16

/**
 * Compute default width from column label (compact fit to header text width).
 * @param {string} label - Column header text
 * @returns {number} Width in px
 */
function getDefaultWidthFromLabel(label) {
  if (!label || typeof label !== 'string') return MIN_COLUMN_WIDTH
  return Math.max(MIN_COLUMN_WIDTH, Math.ceil(label.length * CHARS_PER_PX + LABEL_PADDING))
}

/**
 * Hook for resizable table columns. Returns column widths and a ResizeHandle component.
 * Default width is derived from column label when defaultWidth is not provided.
 * @param {Array<{ id: string, label?: string, defaultWidth?: number }>} columns - Column config
 * @returns {{ columnWidths: Record<string, number>, ResizeHandle: ({ columnId }) => JSX, getColStyle: (id) => object }}
 */
export function useResizableColumns(columns) {
  const [columnWidths, setColumnWidths] = useState(() => {
    const init = {}
    columns.forEach((c) => {
      init[c.id] = c.defaultWidth ?? getDefaultWidthFromLabel(c.label)
    })
    return init
  })
  const [resizing, setResizing] = useState(null) // { columnId, startX, startWidth }

  const startResize = useCallback((columnId, clientX) => {
    const col = columns.find((c) => c.id === columnId)
    const fallback = col?.defaultWidth ?? getDefaultWidthFromLabel(col?.label)
    const currentWidth = columnWidths[columnId] ?? fallback
    setResizing({ columnId, startX: clientX, startWidth: currentWidth })
  }, [columnWidths, columns])

  useEffect(() => {
    if (!resizing) return
    const onMove = (e) => {
      const dx = e.clientX - resizing.startX
      const newWidth = Math.max(MIN_COLUMN_WIDTH, resizing.startWidth + dx)
      setColumnWidths((prev) => ({ ...prev, [resizing.columnId]: newWidth }))
    }
    const onUp = () => setResizing(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizing])

  const getColStyle = useCallback((id) => {
    const w = columnWidths[id]
    return w != null ? { width: w, minWidth: MIN_COLUMN_WIDTH } : undefined
  }, [columnWidths])

  const ResizeHandle = useCallback(({ columnId }) => (
    <div
      role="presentation"
      onMouseDown={(e) => { e.preventDefault(); startResize(columnId, e.clientX) }}
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-airtel-red/30 active:bg-airtel-red/50 group-hover:bg-airtel-red/20"
      style={{ touchAction: 'none' }}
      title="Drag to resize column"
    />
  ), [startResize])

  return { columnWidths, getColStyle, ResizeHandle, startResize }
}
