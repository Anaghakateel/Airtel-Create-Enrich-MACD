import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useResizableColumns } from '../hooks/useResizableColumns'

const PRODUCTS = ['Internet', 'SD WAN', 'MPLS']
const FEASIBILITY_STATUSES = ['Progress', 'Complete', 'Failure']
const FEASIBILITY_RESULT_STATUSES = ['Success', 'Partial', 'Failure'] // after Check Feasibility: green, orange, red

function formatINR(num) {
  if (num == null) return '₹0.00'
  const n = Number(num)
  if (n === 0) return '₹0.00'
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const ERROR_SUMMARY_MESSAGES = [
  'Feasibility check failed for this product at the given location.',
  'Technology not available at location.',
  'Postal code out of service area.',
]
const INTERNET_CONFIG_ERROR_MESSAGE = 'Certain configuration mandatory attributes are missing.'

const MAX_INTERNET_CONFIG_ERRORS = 8

// Build summary rows from locations: mix of Internet, SD WAN, MPLS; random rows get Failure + error.
// Only first MAX_INTERNET_CONFIG_ERRORS Internet products show config error badge.
// When useFeasibilityResults is true, feasibilityStatus is one of Success, Partial, Failure (for post–Check Feasibility view).
export function buildSummaryRows(locations, useFeasibilityResults = false) {
  if (!locations || locations.length === 0) return []
  let internetConfigErrorCount = 0
  const rows = locations.map((loc, i) => {
    const product = PRODUCTS[i % PRODUCTS.length]
    const oneTime = 10000 + Math.floor(Math.random() * 150000)
    const arcTotal = 135300 + Math.floor(Math.random() * 50000)
    const feasibilityStatus = useFeasibilityResults
      ? FEASIBILITY_RESULT_STATUSES[Math.floor(Math.random() * FEASIBILITY_RESULT_STATUSES.length)]
      : (() => {
          const isFailure = Math.random() < 0.2
          return isFailure ? 'Failure' : FEASIBILITY_STATUSES[Math.floor(Math.random() * 2)]
        })()
    const showInternetConfigError = product === 'Internet' && internetConfigErrorCount < MAX_INTERNET_CONFIG_ERRORS
    if (showInternetConfigError) internetConfigErrorCount += 1
    const row = {
      id: loc.id,
      memberGroup: loc.streetAddress || loc.city || '—',
      siteFloor: '—',
      media: '—',
      maxBandwidth: '—',
      tax: '—',
      erpStatus: '—',
      quantity: 1,
      product,
      productDisplay: product,
      showInternetConfigError: showInternetConfigError || false,
      itemCode: '—',
      arcTotal,
      feasibilityStatus,
      crossConnect: '—',
      circuitId: '—',
      changeRequest: 'New',
      subActivity: '----------',
      recurringTotal: i % 3 === 0 ? 0 : 50 + Math.floor(Math.random() * 150),
      oneTimeTotal: oneTime,
    }
    if (!useFeasibilityResults && feasibilityStatus === 'Failure') {
      row.errorSummary = ERROR_SUMMARY_MESSAGES[Math.floor(Math.random() * ERROR_SUMMARY_MESSAGES.length)]
    }
    return row
  })
  return rows
}

function SortIcon({ column, sortColumn, sortDirection, onClick }) {
  const isActive = sortColumn === column
  const asc = isActive && sortDirection === 'asc'
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-0.5 rounded hover:bg-grey-bg focus:outline-none focus:ring-1 focus:ring-gray-400 mr-0.5 shrink-0 inline-flex"
      title={isActive ? `Sort ${sortDirection === 'desc' ? 'ascending' : 'descending'}` : 'Sort'}
      aria-label={`Sort by ${column}`}
    >
      <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        {asc ? (
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        )}
      </svg>
    </button>
  )
}

function FeasibilityBadge({ status }) {
  // Pill-shaped badges: Success (green/white), Partial (orange/black), Failure (red/white)
  const styles = {
    Progress: 'bg-amber-100 text-amber-800 border border-amber-300 rounded-md',
    Complete: 'bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md',
    Success: 'bg-green-600 text-white font-bold rounded-full',
    Partial: 'bg-orange-600 text-black font-bold rounded-full',
    Failure: 'bg-red-600 text-white font-bold rounded-full',
  }
  const baseClass = 'inline-flex items-center justify-center px-3 py-0.5 text-xs min-w-[4.5rem]'
  return (
    <span className={`${baseClass} ${styles[status] || 'bg-gray-200 text-gray-700 rounded-md'}`}>
      {status}
    </span>
  )
}

const UPDATED_BADGE = (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-black bg-white border border-gray-300 shrink-0 ml-1.5" title="Updated">Updated</span>
)

function SummaryTabContent({ locations = [], onTotalsChange, onEditRow, showFeasibilityEmptyInitially = false, updatedProductHighlight = null, updatedProductRowIds, showFeasibilityResults = false }) {
  const updatedRowIdsSet = updatedProductRowIds instanceof Set ? updatedProductRowIds : new Set(updatedProductRowIds || [])
  const summaryRows = useMemo(() => buildSummaryRows(locations, showFeasibilityResults), [locations, showFeasibilityResults])
  const PAGE_SIZE = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [showFeasibilityErrorOnly, setShowFeasibilityErrorOnly] = useState(false)
  const [notificationDismissed, setNotificationDismissed] = useState(false)
  const [viewBy, setViewBy] = useState('No Grouping')
  const [displaying, setDisplaying] = useState('All')
  const [searchInput, setSearchInput] = useState('')
  const [searchFilter, setSearchFilter] = useState(null)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [openMenuRowId, setOpenMenuRowId] = useState(null)
  const [deletedIds, setDeletedIds] = useState(() => new Set())
  const [deleteModalRow, setDeleteModalRow] = useState(null)
  const [applyDeleteToSelectedRows, setApplyDeleteToSelectedRows] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const searchAnchorRef = useRef(null)
  const productFilterRef = useRef(null)
  const menuAnchorRef = useRef(null)
  const [filterByOpen, setFilterByOpen] = useState(false)
  const [productFilter, setProductFilter] = useState(null)
  const [feasibilityFilter, setFeasibilityFilter] = useState(null)
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)
  const [feasibilityDropdownOpen, setFeasibilityDropdownOpen] = useState(false)
  const [errorPopoverRow, setErrorPopoverRow] = useState(null) // { id, message } when Error Summary popover is open
  const errorPopoverAnchorRef = useRef(null)
  const errorPopoverCloseTimeoutRef = useRef(null)
  const selectAllCheckboxRef = useRef(null)
  const summaryResizableCols = useMemo(() => [
    { id: 'memberGroup', label: 'Member/Group' },
    { id: 'siteFloor', label: 'Site Floor' },
    { id: 'media', label: 'Media' },
    { id: 'maxBandwidth', label: 'Max Bandwidth' },
    { id: 'tax', label: 'Tax' },
    { id: 'erpStatus', label: 'ERP Status' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'product', label: 'Product' },
    { id: 'itemCode', label: 'Item Code' },
    { id: 'arcTotal', label: 'ARC Total' },
    { id: 'feasibilityStatus', label: 'Feasibility Status' },
    { id: 'crossConnect', label: 'Cross Connect' },
    { id: 'circuitId', label: 'Circuit Id' },
    { id: 'changeRequest', label: 'Change Request' },
    { id: 'subActivity', label: 'Sub Activity' },
    { id: 'recurringTotal', label: 'Recurring' },
    { id: 'oneTimeTotal', label: 'One Time' },
  ], [])
  const { getColStyle, ResizeHandle } = useResizableColumns(summaryResizableCols)

  useEffect(() => {
    return () => {
      if (errorPopoverCloseTimeoutRef.current) clearTimeout(errorPopoverCloseTimeoutRef.current)
    }
  }, [])

  // Close row overflow menu when clicking outside
  useEffect(() => {
    if (openMenuRowId === null) return
    const handleClickOutside = (e) => {
      if (menuAnchorRef.current && !menuAnchorRef.current.contains(e.target)) {
        setOpenMenuRowId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuRowId])

  // Close search suggestions when clicking outside
  useEffect(() => {
    if (!showSearchSuggestions) return
    const handleClickOutside = (e) => {
      if (searchAnchorRef.current && !searchAnchorRef.current.contains(e.target)) {
        setShowSearchSuggestions(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showSearchSuggestions])

  // Close product filter dropdown when clicking outside
  useEffect(() => {
    if (!productDropdownOpen) return
    const handleClickOutside = (e) => {
      if (productFilterRef.current && !productFilterRef.current.contains(e.target)) {
        setProductDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [productDropdownOpen])

  // Reset to page 1 when product filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [productFilter])

  let rowsToDisplay = summaryRows.filter((r) => !deletedIds.has(r.id))
  if (showFeasibilityErrorOnly) rowsToDisplay = rowsToDisplay.filter((r) => r.feasibilityStatus === 'Failure')
  if (productFilter != null) {
    if (productFilter === 'Error') {
      rowsToDisplay = rowsToDisplay.filter((r) => r.feasibilityStatus === 'Failure')
    } else {
      rowsToDisplay = rowsToDisplay.filter((r) => r.product === productFilter)
    }
  }

  const searchSuggestions = useMemo(() => {
    const q = searchInput.trim().toLowerCase()
    if (q.length === 0) return []
    const seen = new Set()
    const out = []
    for (const row of rowsToDisplay) {
      const candidates = [row.memberGroup, row.product, row.feasibilityStatus, String(row.oneTimeTotal ?? ''), String(row.recurringTotal ?? '')]
      for (const v of candidates) {
        const s = String(v || '').trim()
        if (s && s.toLowerCase().includes(q) && !seen.has(s)) {
          seen.add(s)
          out.push(s)
          if (out.length >= 15) return out
        }
      }
    }
    return out
  }, [searchInput, rowsToDisplay])

  if (searchFilter != null && String(searchFilter).trim() !== '') {
    const term = String(searchFilter).trim().toLowerCase()
    rowsToDisplay = rowsToDisplay.filter((r) => {
      const searchable = [r.memberGroup, r.product, r.feasibilityStatus, String(r.oneTimeTotal), String(r.recurringTotal)].join(' ')
      return searchable.toLowerCase().includes(term)
    })
  }
  if (sortColumn) {
    const dir = sortDirection === 'asc' ? 1 : -1
    rowsToDisplay = [...rowsToDisplay].sort((a, b) => {
      let va = a[sortColumn]
      let vb = b[sortColumn]
      if (sortColumn === 'memberGroup' || sortColumn === 'product' || sortColumn === 'feasibilityStatus') {
        va = String(va ?? '').toLowerCase()
        vb = String(vb ?? '').toLowerCase()
        return dir * (va < vb ? -1 : va > vb ? 1 : 0)
      }
      if (sortColumn === 'quantity' || sortColumn === 'oneTimeTotal' || sortColumn === 'recurringTotal') {
        return dir * ((Number(va) || 0) - (Number(vb) || 0))
      }
      return 0
    })
  }
  const totalRows = rowsToDisplay.length
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))
  const visibleRows = rowsToDisplay.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasPagination = totalRows > PAGE_SIZE

  // Totals from summary rows excluding deleted
  const totals = useMemo(() => {
    const activeRows = summaryRows.filter((r) => !deletedIds.has(r.id))
    const oneTime = activeRows.reduce((s, r) => s + (r.oneTimeTotal || 0), 0)
    const monthly = activeRows.reduce((s, r) => s + (r.recurringTotal || 0), 0)
    return { oneTimeTotal: oneTime, monthlyTotal: monthly, quoteTotal: oneTime + monthly }
  }, [summaryRows, deletedIds])
  useEffect(() => {
    onTotalsChange?.(totals)
  }, [totals.oneTimeTotal, totals.monthlyTotal, totals.quoteTotal, onTotalsChange])

  useEffect(() => {
    const el = selectAllCheckboxRef.current
    if (!el) return
    const visibleIds = visibleRows.map((r) => r.id)
    const selectedOnPage = visibleIds.filter((id) => selectedIds.has(id)).length
    el.indeterminate = selectedOnPage > 0 && selectedOnPage < visibleIds.length
  }, [visibleRows, selectedIds])

  const feasibilityErrorCount = summaryRows.filter((r) => r.feasibilityStatus === 'Failure').length

  const handleSort = (column) => {
    const nextDir = sortColumn === column ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc'
    setSortColumn(column)
    setSortDirection(nextDir)
  }

  return (
    <div className="flex flex-col min-h-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Toolbar: View By, Displaying (left) | Search, actions (right) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200 bg-grey-bg/30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-600">View By</span>
          <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-700">
            {viewBy}
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-xs text-gray-600">Displaying</span>
          <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-700">
            {displaying}
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-xs text-gray-600">Filter by Product</span>
          <div className="relative" ref={productFilterRef}>
            <button
              type="button"
              onClick={() => setProductDropdownOpen((o) => !o)}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-700 hover:bg-grey-bg/50"
              aria-expanded={productDropdownOpen}
            >
              {productFilter == null ? 'All Products' : productFilter}
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {productDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 z-30 min-w-[8rem] py-1 bg-white border border-gray-200 rounded-md shadow-lg">
                <button type="button" onClick={() => { setProductFilter(null); setProductDropdownOpen(false) }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-grey-bg">All Products</button>
                {PRODUCTS.map((p) => (
                  <button key={p} type="button" onClick={() => { setProductFilter(p); setProductDropdownOpen(false) }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-grey-bg">{p}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" aria-hidden>
            {/* search + actions */}
              <button
                type="button"
                style={{ display: 'none' }}
                onClick={() => setFilterByOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-full bg-white text-xs text-blue-600"
                aria-expanded={filterByOpen}
              >
                All
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {filterByOpen && (
                <div className="absolute left-0 top-full mt-1 z-30 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-xs">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Products</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => { setFeasibilityDropdownOpen(false); setProductDropdownOpen((o) => !o) }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-left text-xs text-gray-600"
                        >
                          <span>{productFilter == null ? 'All Products' : productFilter}</span>
                          <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {productDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-0.5 py-0.5 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button type="button" onClick={() => { setProductFilter(null); setProductDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">All Products</button>
                            {PRODUCTS.map((p) => (
                              <button key={p} type="button" onClick={() => { setProductFilter(p); setProductDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">{p}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Feasibility status</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => { setProductDropdownOpen(false); setFeasibilityDropdownOpen((o) => !o) }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-left text-xs text-gray-600"
                        >
                          <span>{feasibilityFilter == null ? 'All Status' : feasibilityFilter}</span>
                          <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {feasibilityDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-0.5 py-0.5 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button type="button" onClick={() => { setFeasibilityFilter(null); setFeasibilityDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">All Status</button>
                            {(showFeasibilityResults ? FEASIBILITY_RESULT_STATUSES : FEASIBILITY_STATUSES).map((s) => (
                              <button key={s} type="button" onClick={() => { setFeasibilityFilter(s); setFeasibilityDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48" ref={searchAnchorRef}>
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setShowSearchSuggestions(true) }}
                onFocus={() => { if (searchInput.trim()) setShowSearchSuggestions(true) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearchFilter(searchInput.trim() || null); setShowSearchSuggestions(false) } }}
                placeholder="Search this list"
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-full text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                aria-autocomplete="list"
                aria-expanded={showSearchSuggestions && searchSuggestions.length > 0}
              />
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {searchSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSearchInput(s); setShowSearchSuggestions(false) }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-grey-bg truncate"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="p-1.5 text-gray-500 hover:bg-grey-bg rounded focus:outline-none" aria-label="Delete">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button type="button" className="p-1.5 text-gray-500 hover:bg-grey-bg rounded focus:outline-none" aria-label="Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button type="button" className="px-4 py-1.5 border border-gray-300 rounded-md bg-white text-xs font-medium text-gray-700 hover:bg-grey-bg">Validate</button>
            <button type="button" className="px-4 py-1.5 border border-gray-300 rounded-md bg-white text-xs font-medium text-gray-700 hover:bg-grey-bg">Enrich Quote</button>
            <button type="button" className="px-4 py-1.5 border border-gray-300 rounded-md bg-white text-xs font-medium text-gray-700 hover:bg-grey-bg">Upload Documents</button>
            <button type="button" className="px-4 py-1.5 rounded-md bg-airtel-red text-white text-xs font-medium hover:opacity-90">Manage Solution Bundle</button>
            <span className="text-xs text-gray-500">View Selected ({selectedIds.size})</span>
          </div>
        </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs border-b border-gray-100">
        <p className="text-gray-600">
          Showing {totalRows === 0 ? '0' : (currentPage - 1) * PAGE_SIZE + 1} - {totalRows === 0 ? '0' : Math.min(currentPage * PAGE_SIZE, totalRows)} of {rowsToDisplay.length} records.
          {showFeasibilityErrorOnly && <span> • Showing only records with feasibility error</span>}
          {productFilter != null && <span> • Product: {productFilter}</span>}
          {searchFilter != null && String(searchFilter).trim() !== '' && <span> • Matching search</span>}
        </p>
        {showFeasibilityErrorOnly ? (
          <button type="button" onClick={() => setShowFeasibilityErrorOnly(false)} className="text-airtel-red hover:underline font-medium">
            Show all records
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto flex flex-col min-h-0" style={{ height: '24rem' }}>
        <div className="overflow-y-auto border-b border-gray-100 min-h-0" style={{ height: '22rem' }}>
          <table className="w-full text-xs leading-tight table-fixed">
            <colgroup>
              <col className="w-10" />
              {summaryResizableCols.map((c) => <col key={c.id} style={getColStyle(c.id)} />)}
              <col className="w-9" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr className="border-b border-gray-200">
                <th className="w-10 pl-4 pr-2 py-3 text-left shrink-0">
                  <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red/20 w-3.5 h-3.5"
                    aria-label="Select all"
                    checked={visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id))}
                    onChange={(e) => {
                      const visibleIds = visibleRows.map((r) => r.id)
                      if (e.target.checked) {
                        setSelectedIds((prev) => new Set([...prev, ...visibleIds]))
                      } else {
                        setSelectedIds((prev) => {
                          const next = new Set(prev)
                          visibleIds.forEach((id) => next.delete(id))
                          return next
                        })
                      }
                    }}
                  />
                </th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('memberGroup')}><span className="block truncate">Member/Group</span><ResizeHandle columnId="memberGroup" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('siteFloor')}><span className="block truncate">Site Floor</span><ResizeHandle columnId="siteFloor" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('media')}><span className="block truncate">Media</span><ResizeHandle columnId="media" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('maxBandwidth')}><span className="block truncate">Max Bandwidth</span><ResizeHandle columnId="maxBandwidth" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('tax')}><span className="block truncate">Tax</span><ResizeHandle columnId="tax" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('erpStatus')}><span className="block truncate">ERP Status</span><ResizeHandle columnId="erpStatus" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('quantity')}><span className="block truncate">Quantity</span><ResizeHandle columnId="quantity" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('product')}><span className="block truncate">Product</span><ResizeHandle columnId="product" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('itemCode')}><span className="block truncate">Item Code</span><ResizeHandle columnId="itemCode" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('arcTotal')}><span className="block truncate">ARC Total</span><ResizeHandle columnId="arcTotal" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('feasibilityStatus')}><span className="block truncate">Feasibility Status</span><ResizeHandle columnId="feasibilityStatus" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('crossConnect')}><span className="block truncate">Cross Connect</span><ResizeHandle columnId="crossConnect" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('circuitId')}><span className="block truncate">Circuit Id</span><ResizeHandle columnId="circuitId" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('changeRequest')}><span className="block truncate">Change Request</span><ResizeHandle columnId="changeRequest" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('subActivity')}><span className="block truncate">Sub Activity</span><ResizeHandle columnId="subActivity" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('recurringTotal')}><span className="block truncate">Recurring</span><ResizeHandle columnId="recurringTotal" /></th>
                <th className="px-2 py-3 text-left font-semibold text-gray-900 text-xs truncate group relative" style={getColStyle('oneTimeTotal')}><span className="block truncate">One Time</span><ResizeHandle columnId="oneTimeTotal" /></th>
                <th className="w-9 px-2 py-3 shrink-0" aria-label="Row actions" />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-grey-bg/50 ${idx % 2 === 1 ? 'bg-grey-bg/30' : ''}`}
                >
                  <td className="pl-4 pr-2 py-3 align-middle">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red/20 w-3.5 h-3.5"
                      aria-label="Select row"
                      checked={selectedIds.has(row.id)}
                      onChange={(e) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(row.id)
                          else next.delete(row.id)
                          return next
                        })
                      }}
                    />
                  </td>
                  <td className="px-2 py-3 text-gray-800 align-middle truncate" title={row.memberGroup}>
                    <span className="inline-flex flex-wrap items-center gap-y-1 gap-x-1.5 min-w-0">
                      <span className="truncate">{row.memberGroup || '—'}</span>
                      {updatedRowIdsSet.has(row.id) && UPDATED_BADGE}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-gray-500 align-middle truncate">{row.siteFloor}</td>
                  <td className="px-2 py-3 text-gray-500 align-middle truncate">{row.media}</td>
                  <td className="px-2 py-3 text-gray-500 align-middle truncate">{row.maxBandwidth}</td>
                  <td className="px-2 py-3 text-gray-500 align-middle truncate">{row.tax}</td>
                  <td className="px-2 py-3 text-gray-500 align-middle truncate">{row.erpStatus}</td>
                  <td className="px-2 py-3 text-gray-800 align-middle">{row.quantity}</td>
                  <td className="px-2 py-3 text-gray-800 align-middle truncate">
                    <span className="inline-flex items-center gap-1 min-w-0">
                      {(() => {
                        const hasFeasibilityError = row.feasibilityStatus === 'Failure'
                        const hasInternetConfigError = row.showInternetConfigError && !updatedRowIdsSet.has(row.id)
                        const showError = hasFeasibilityError || hasInternetConfigError
                        const errorMessage = hasFeasibilityError
                          ? (row.errorSummary || 'Error summary in a sentence.')
                          : hasInternetConfigError
                            ? INTERNET_CONFIG_ERROR_MESSAGE
                            : ''
                        if (!showError || !errorMessage) return null
                        return (
                          <button
                            type="button"
                            ref={(el) => { if (errorPopoverRow?.id === row.id) errorPopoverAnchorRef.current = el }}
                            onClick={(e) => {
                              e.stopPropagation()
                              errorPopoverAnchorRef.current = e.currentTarget
                              setErrorPopoverRow({ id: row.id, message: errorMessage })
                            }}
                            onMouseEnter={(e) => {
                              if (errorPopoverCloseTimeoutRef.current) {
                                clearTimeout(errorPopoverCloseTimeoutRef.current)
                                errorPopoverCloseTimeoutRef.current = null
                              }
                              errorPopoverAnchorRef.current = e.currentTarget
                              setErrorPopoverRow({ id: row.id, message: errorMessage })
                            }}
                            onMouseLeave={() => {
                              errorPopoverCloseTimeoutRef.current = setTimeout(() => setErrorPopoverRow(null), 150)
                            }}
                            className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#A03565]/30"
                            style={{ backgroundColor: '#FCEEF2' }}
                            aria-label="View error summary"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="#A03565" strokeWidth={2.5} viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <path strokeLinecap="round" d="M4.93 4.93l14.14 14.14" />
                            </svg>
                            <span className="text-xs font-medium" style={{ color: '#A03565' }}>Error</span>
                          </button>
                        )
                      })()}
                      <span className="truncate">{row.productDisplay ?? row.product}</span>
                      {updatedRowIdsSet.has(row.id) && UPDATED_BADGE}
                      {!updatedRowIdsSet.has(row.id) && updatedProductHighlight && row.product === updatedProductHighlight && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                          Updated
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-gray-500 align-middle truncate">{row.itemCode}</td>
                  <td className="px-2 py-3 text-gray-800 align-middle truncate">{formatINR(row.arcTotal)}</td>
                  <td className="px-2 py-3 align-middle">
                    {showFeasibilityResults ? (
                      <FeasibilityBadge status={row.feasibilityStatus} />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-gray-500 align-middle truncate">{row.crossConnect}</td>
                  <td className="px-2 py-3 text-gray-500 align-middle truncate">{row.circuitId}</td>
                  <td className="px-2 py-3 text-gray-800 align-middle truncate">{row.changeRequest}</td>
                  <td className="px-2 py-3 text-gray-800 align-middle truncate">{row.subActivity}</td>
                  <td className="px-2 py-3 text-gray-800 align-middle truncate">{row.recurringTotal === 0 ? '₹0.00' : formatINR(row.recurringTotal)}</td>
                  <td className="px-2 py-3 text-gray-800 align-middle truncate">{formatINR(row.oneTimeTotal)}</td>
                  <td className="px-2 py-3 align-middle">
                    <div
                      className="relative inline-block"
                      ref={openMenuRowId === row.id ? menuAnchorRef : null}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuRowId((prev) => (prev === row.id ? null : row.id))
                        }}
                        className="w-8 h-8 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 shrink-0 shadow-sm"
                        aria-label="Row actions"
                        aria-expanded={openMenuRowId === row.id}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {openMenuRowId === row.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 min-w-[6rem] py-1 bg-white border border-gray-300 rounded-lg shadow-sm">
                          <button
                            type="button"
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-grey-bg"
                            onClick={() => {
                              setOpenMenuRowId(null)
                              const idsToPass = new Set(selectedIds)
                              if (row?.id) idsToPass.add(row.id)
                              onEditRow?.(row, idsToPass)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-grey-bg"
                            onClick={() => {
                              setDeleteModalRow({ id: row.id, memberGroup: row.memberGroup })
                              setOpenMenuRowId(null)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasPagination && (
          <div className="flex-shrink-0 flex items-center justify-center gap-4 w-full px-2 min-h-[2.5rem] py-2 bg-white border-t border-gray-200">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-xs font-medium text-airtel-red disabled:opacity-50 disabled:cursor-not-allowed hover:bg-grey-bg enabled:cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-gray-800">Page {currentPage} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-xs font-medium text-airtel-red disabled:opacity-50 disabled:cursor-not-allowed hover:bg-grey-bg enabled:cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Error Summary popover – on click of error icon in Product column */}
      {errorPopoverRow && errorPopoverAnchorRef.current && createPortal(
        (() => {
          const rect = errorPopoverAnchorRef.current.getBoundingClientRect()
          return (
            <div
              className="fixed z-[200] w-72 rounded-xl bg-white shadow-lg border border-gray-200 overflow-visible"
              style={{
                top: rect.bottom + 8,
                left: Math.max(8, Math.min(rect.left, typeof window !== 'undefined' ? window.innerWidth - 296 : rect.left)),
              }}
              role="dialog"
              aria-labelledby="error-summary-title"
              onMouseEnter={() => {
                if (errorPopoverCloseTimeoutRef.current) {
                  clearTimeout(errorPopoverCloseTimeoutRef.current)
                  errorPopoverCloseTimeoutRef.current = null
                }
              }}
              onMouseLeave={() => setErrorPopoverRow(null)}
            >
              <div
                className="absolute left-4 -top-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white"
                style={{ filter: 'drop-shadow(0 -1px 0 rgb(229 231 235))' }}
              />
              <div className="p-4 pt-3 relative bg-white rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <h3 id="error-summary-title" className="text-sm font-bold text-gray-900 shrink-0">Error Summary</h3>
                  <button
                    type="button"
                    onClick={() => setErrorPopoverRow(null)}
                    className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{errorPopoverRow.message}</p>
              </div>
            </div>
          )
        })(),
        document.body
      )}

      {/* Delete confirmation modal - matches attributes and other app modals; supports bulk delete when multiple rows selected */}
      {deleteModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" aria-modal="true" role="dialog" onClick={(e) => { if (e.target === e.currentTarget) { setDeleteModalRow(null); setApplyDeleteToSelectedRows(false) } }}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <span className="w-8 shrink-0" aria-hidden="true" />
              <h2 id="delete-modal-title" className="flex-1 text-base font-bold text-[#032d60] text-center">Delete this record</h2>
              <button
                type="button"
                onClick={() => { setDeleteModalRow(null); setApplyDeleteToSelectedRows(false) }}
                className="w-8 h-8 shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="px-5 py-4 text-sm text-gray-700 leading-relaxed">
              Are you sure you want to delete this record for {deleteModalRow.memberGroup}?
            </p>
            {selectedIds.size >= 2 && (
              <div className="shrink-0 px-5 py-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyDeleteToSelectedRows}
                    onChange={(e) => setApplyDeleteToSelectedRows(e.target.checked)}
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                  />
                  <span className="text-sm text-gray-700">Delete selected ({selectedIds.size}) items</span>
                </label>
              </div>
            )}
            <div className="border-t border-gray-200 px-5 py-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setDeleteModalRow(null); setApplyDeleteToSelectedRows(false) }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (applyDeleteToSelectedRows && selectedIds.size >= 2) {
                    setDeletedIds((prev) => new Set([...prev, ...selectedIds]))
                    setSelectedIds(new Set())
                  } else {
                    setDeletedIds((prev) => new Set(prev).add(deleteModalRow.id))
                  }
                  setDeleteModalRow(null)
                  setApplyDeleteToSelectedRows(false)
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-airtel-red text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-airtel-red focus:ring-offset-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SummaryTabContent
