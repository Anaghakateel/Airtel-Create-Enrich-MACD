import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocations } from '../context/LocationsContext'
import { useResizableColumns } from '../hooks/useResizableColumns'

// Parse street display from "number, Street, City, State, India"
function getStreetDisplay(streetAddress) {
  if (!streetAddress || typeof streetAddress !== 'string') return ''
  const parts = streetAddress.split(',').map((p) => p.trim())
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] || ''
}

function formatINR(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '₹0'
  return `₹${n.toLocaleString('en-IN')}`
}

function getStableNumericSeed(id, fallback = 0) {
  const str = String(id ?? fallback)
  const digits = str.replace(/\D/g, '')
  if (digits) return Number(digits.slice(-6))
  return fallback
}

function getRootProductName(loc, index) {
  void index
  return loc.product || 'Internet'
}

const PAGE_SIZE = 5

const UPDATED_BADGE = (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-black bg-white border border-gray-300 shrink-0 ml-1.5" title="Updated">Updated</span>
)

// Inline editable cell: click to edit, blur or Enter to save
function EditableCell({ loc, field, displayValue, onUpdate, className = '', showUpdatedBadge = false }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(displayValue ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    setValue(displayValue ?? '')
  }, [displayValue])

  const save = () => {
    setEditing(false)
    if (!onUpdate) return
    const trimmed = typeof value === 'string' ? value.trim() : value
    const current = field === 'streetAddress' ? getStreetDisplay(loc.streetAddress) : (loc[field] ?? '')
    if (String(trimmed) === String(current)) return
    if (field === 'streetAddress') {
      const parts = (loc.streetAddress || '').split(',').map((p) => p.trim())
      const rest = parts.length >= 3 ? parts.slice(2).join(', ') : [loc.city, loc.state, loc.country].filter(Boolean).join(', ')
      onUpdate(loc.id, { streetAddress: rest ? `${trimmed}, ${rest}` : trimmed })
    } else {
      onUpdate(loc.id, { [field]: trimmed || undefined })
    }
  }

  if (editing) {
    return (
      <td className={className}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') {
              setValue(displayValue ?? '')
              setEditing(false)
            }
          }}
          className="w-full min-w-0 px-1.5 py-0.5 text-xs border border-airtel-red/50 rounded focus:outline-none focus:ring-1 focus:ring-airtel-red/30 bg-white"
        />
      </td>
    )
  }

  return (
    <td
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditing(true) }}
      className={`${className} cursor-text hover:bg-grey-bg/70 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-airtel-red/30 rounded`}
      title="Click to edit"
    >
      <span className="inline-flex flex-wrap items-center gap-y-1">
        <span className="block break-words line-clamp-3">{displayValue || '—'}</span>
        {showUpdatedBadge && UPDATED_BADGE}
      </span>
    </td>
  )
}

function LocationsTabContent({ locations: locationsProp, configuredLocationIds = new Set(), onMarkLocationsConfigured, onUpdateLocation: onUpdateLocationProp, onSelectionChange, onDeleteLocations: onDeleteLocationsProp, showAddConfigurationsButton = true, successBannerVariant, productFilterLocationIds }) {
  const { locations: ctxLocations, onUpdateLocation: ctxOnUpdate, onDeleteLocations: ctxOnDelete } = useLocations()
  const locationsRaw = locationsProp !== undefined && locationsProp !== null ? locationsProp : ctxLocations
  const locations = useMemo(() => {
    if (!productFilterLocationIds || productFilterLocationIds.size === 0) return locationsRaw
    const idSet = productFilterLocationIds instanceof Set ? productFilterLocationIds : new Set(productFilterLocationIds)
    return locationsRaw.filter((loc) => idSet.has(loc.id))
  }, [locationsRaw, productFilterLocationIds])
  const onUpdateLocation = onUpdateLocationProp ?? ctxOnUpdate
  const onDeleteLocations = onDeleteLocationsProp ?? ctxOnDelete

  const VIEW_BY_OPTIONS = [
    { value: 'No Grouping', label: 'No Grouping' },
    { value: 'Show Configured locations', label: 'Show Configured locations' },
    { value: 'Show Unconfigured locations', label: 'Show Unconfigured locations' },
  ]

  const configuredSet = configuredLocationIds instanceof Set ? configuredLocationIds : new Set(configuredLocationIds || [])
  const isTechnicalEnrichmentView = successBannerVariant === 'technicalEnrichment'

  const [currentPage, setCurrentPage] = useState(1)
  const [viewBy, setViewBy] = useState('No Grouping')
  const [displaying, setDisplaying] = useState('All')
  const [searchInput, setSearchInput] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [viewingSelectedOnly, setViewingSelectedOnly] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [deleteModalRow, setDeleteModalRow] = useState(null)
  const [applyDeleteToSelectedRows, setApplyDeleteToSelectedRows] = useState(false)
  const selectAllCheckboxRef = useRef(null)
  const locationsResizableCols = useMemo(() => {
    if (isTechnicalEnrichmentView) {
      return [
        { id: 'member', label: 'Member' },
        { id: 'product', label: 'Product' },
        { id: 'media', label: 'Media' },
        { id: 'serviceType', label: 'Service Type' },
        { id: 'lsi', label: 'LSI' },
        { id: 'quantity', label: 'Quantity' },
        { id: 'feasibility', label: 'Feasibility' },
        { id: 'crossConnectRequired', label: 'Cross Connect Required' },
        { id: 'ddosRequired', label: 'DDoS Required' },
        { id: 'oneTime', label: 'One Time' },
        { id: 'recurring', label: 'Recurring' },
        { id: 'arcTotal', label: 'ARC Total' },
      ]
    }
    return [
      { id: 'offerAssigned', label: 'Offer Assigned' },
      { id: 'streetAddress', label: 'Street Address' },
      { id: 'floorNo', label: 'Floor No' },
      { id: 'flatNo', label: 'Flat No' },
      { id: 'city', label: 'City' },
      { id: 'state', label: 'State' },
      { id: 'country', label: 'Country' },
      { id: 'premises', label: 'Premises' },
      { id: 'postalCode', label: 'Postal Code' },
      { id: 'servicePoint', label: 'Service Point' },
      { id: 'locationType', label: 'Location Type' },
      { id: 'solutionType', label: 'Solution Type' },
      { id: 'circle', label: 'Circle' },
      { id: 'source', label: 'Source' },
    ]
  }, [isTechnicalEnrichmentView])
  const { getColStyle, ResizeHandle } = useResizableColumns(locationsResizableCols)

  const technicalViewLocations = useMemo(() => {
    if (!isTechnicalEnrichmentView) return locations
    return locations.filter((loc, idx) => getRootProductName(loc, idx) === 'Internet')
  }, [locations, isTechnicalEnrichmentView])

  const filteredByViewBy =
    viewBy === 'Show Configured locations'
      ? technicalViewLocations.filter((loc) => configuredSet.has(loc.id))
      : viewBy === 'Show Unconfigured locations'
        ? technicalViewLocations.filter((loc) => !configuredSet.has(loc.id))
        : technicalViewLocations
  const filteredLocations =
    viewingSelectedOnly && selectedCount > 0
      ? filteredByViewBy.filter((loc) => selectedIds.has(loc.id))
      : filteredByViewBy

  const total = filteredLocations.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const visibleLocations = filteredLocations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasPagination = total > PAGE_SIZE
  const selectedCount = selectedIds.size

  useEffect(() => {
    onSelectionChange?.(selectedCount, selectedIds)
  }, [selectedCount, selectedIds, onSelectionChange])

  const allSelected = filteredLocations.length > 0 && filteredLocations.every((loc) => selectedIds.has(loc.id))
  const someSelected = filteredLocations.some((loc) => selectedIds.has(loc.id))

  useEffect(() => {
    const el = selectAllCheckboxRef.current
    if (!el) return
    el.indeterminate = filteredLocations.length > 0 && someSelected && !allSelected
  }, [filteredLocations.length, someSelected, allSelected])

  const onViewByChange = (value) => {
    setViewBy(value)
    setCurrentPage(1)
  }

  const getTechnicalRowValues = (loc, absoluteIndex) => {
    const mediaCycle = ['50 Mbps', '100 Mbps', '200 Mbps']
    const serviceTypeCycle = ['Unmanaged', 'Partially Managed', 'Managed']
    const seed = getStableNumericSeed(loc.id, absoluteIndex + 1)
    const oneTime = Number(loc.oneTimeTotal ?? loc.oneTimeCharge ?? (45000 + (seed % 5) * 5000))
    const recurring = Number(loc.recurringTotal ?? loc.monthlyTotal ?? (2500 + (seed % 4) * 750))
    const arcTotal = Number(loc.arcTotal ?? recurring * 12)
    return {
      member: loc.streetAddress || [loc.city, loc.state, loc.country || 'India'].filter(Boolean).join(', '),
      product: getRootProductName(loc, absoluteIndex),
      media: loc.maxBandwidth || loc.bandwidth || mediaCycle[absoluteIndex % mediaCycle.length],
      serviceType: loc.serviceType || serviceTypeCycle[absoluteIndex % serviceTypeCycle.length],
      lsi: loc.lsi || `80002301259${String(100 + (seed % 900))}`,
      quantity: loc.quantity ?? 1,
      feasibility: loc.feasibilityId || `FZ-${String(1000 + (seed % 9000))}`,
      crossConnectRequired: loc.crossConnectRequired ?? ((absoluteIndex + seed) % 2 === 0 ? 'Yes' : 'No'),
      ddosRequired: loc.ddosRequired ?? ((absoluteIndex + seed + 1) % 2 === 0 ? 'Yes' : 'No'),
      oneTime: formatINR(oneTime),
      recurring: formatINR(recurring),
      arcTotal: formatINR(arcTotal),
    }
  }

  useEffect(() => {
    if (!successMessage) return
    const t = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(t)
  }, [successMessage])

  return (
    <div className="flex flex-col min-h-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
      {/* View By, Displaying | Search, Delete */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200 bg-grey-bg/30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-600">View By</span>
          <div className="relative inline-block">
            <select
              value={viewBy}
              onChange={(e) => onViewByChange(e.target.value)}
              className="inline-flex items-center gap-1 pl-3 pr-8 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
              aria-label="View by"
            >
              {VIEW_BY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs text-gray-600">Displaying</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-700"
          >
            {displaying}
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search this list"
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>
          {showAddConfigurationsButton && (
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() => {
                if (selectedCount === 0) return
                onMarkLocationsConfigured?.(selectedIds)
                const msg = successBannerVariant === 'technicalEnrichment'
                  ? `Technical attributes updates were successfully applied to ${selectedCount} location${selectedCount === 1 ? '' : 's'}`
                  : `${selectedCount} location${selectedCount === 1 ? '' : 's'} were successfully configured`
                setSuccessMessage(msg)
                setSelectedIds(new Set())
                setViewingSelectedOnly(false)
              }}
              className={selectedCount > 0
                ? 'px-3 py-1.5 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 text-gray-500 text-xs font-medium cursor-not-allowed'}
            >
              Apply Configurations
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        successBannerVariant === 'technicalEnrichment' ? (
          <div className="w-full px-4 py-2" role="status">
            <div className="flex items-center gap-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg shadow-md">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <p className="font-bold text-xs shrink-0">Success</p>
                <p className="text-xs font-normal opacity-95">{successMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2 bg-green-50 border-b border-green-200 text-xs text-green-800 font-medium" role="status">
            {successMessage}
          </div>
        )
      )}

      {/* Showing X - Y of Z records | View Selected (N) | Show Map toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs border-b border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 text-gray-600">
          <span>
            Showing {total === 0 ? '0' : (currentPage - 1) * PAGE_SIZE + 1} - {total === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, total)} of {total} records.
          </span>
          {viewBy === 'Show Configured locations' && (
            <span className="text-gray-700">• Grouped by configured locations ({total})</span>
          )}
          {viewBy === 'Show Unconfigured locations' && (
            <span className="text-gray-700">• Grouped by unconfigured locations ({total})</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => selectedCount > 0 && setViewingSelectedOnly(true)}
            className={`font-medium ${selectedCount > 0 ? 'text-airtel-red hover:underline cursor-pointer' : 'text-gray-400 cursor-default'}`}
          >
            View Selected ({selectedCount})
          </button>
          <button
            type="button"
            onClick={() => setViewingSelectedOnly(false)}
            className="text-airtel-red hover:underline text-xs font-medium cursor-pointer underline"
          >
            Show all records
          </button>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Show Map</span>
            <button
              type="button"
              role="switch"
              aria-checked={showMap}
              onClick={() => setShowMap((prev) => !prev)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-1 ${showMap ? 'bg-airtel-red' : 'bg-gray-300'}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${showMap ? 'translate-x-4' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Table - wider rows, 5 records at a time; pagination fixed at bottom */}
      <div className="overflow-x-auto flex flex-col min-h-0 flex-1 flex-shrink-0" style={{ minHeight: '20rem' }}>
        <div className="overflow-y-auto border-b border-gray-200 min-h-0 flex-1">
          <table className="w-full text-xs leading-relaxed table-fixed locations-table" style={{ minWidth: '72rem' }}>
            <colgroup>
              <col className="w-10" />
              {locationsResizableCols.map((c) => <col key={c.id} style={getColStyle(c.id)} />)}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr className="border-b border-gray-200">
                <th className="w-10 pl-4 pr-2 py-4 text-left shrink-0">
                  <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red/20 w-3.5 h-3.5"
                    aria-label="Select all rows"
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filteredLocations.map((loc) => loc.id)))
                      } else {
                        setSelectedIds(new Set())
                      }
                    }}
                  />
                </th>
                {locationsResizableCols.map((col) => (
                  <th key={col.id} className="px-2 py-4 text-left font-semibold text-gray-900 group relative" style={getColStyle(col.id)}>
                    <span className="block truncate">{col.label}</span>
                    <ResizeHandle columnId={col.id} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLocations.length === 0 ? (
                <tr>
                  <td colSpan={locationsResizableCols.length + 1} className="px-4 py-8 text-center text-gray-500">
                    No locations to display.
                  </td>
                </tr>
              ) : (
                visibleLocations.map((loc, idx) => {
                  const streetDisplay = getStreetDisplay(loc.streetAddress)
                  const cellClass = 'px-2 py-4 text-gray-800 align-middle leading-relaxed min-h-[7rem]'
                  const absoluteIndex = (currentPage - 1) * PAGE_SIZE + idx
                  const technicalRow = getTechnicalRowValues(loc, absoluteIndex)
                  return (
                    <tr
                      key={loc.id}
                      className="border-b border-gray-100 hover:bg-grey-bg/50"
                    >
                      <td className="pl-4 pr-2 py-4 align-middle min-h-[7rem]">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red/20 w-3.5 h-3.5"
                          aria-label="Select row"
                          checked={selectedIds.has(loc.id)}
                          onChange={(e) => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev)
                              if (e.target.checked) next.add(loc.id)
                              else next.delete(loc.id)
                              return next
                            })
                          }}
                        />
                      </td>
                      {isTechnicalEnrichmentView ? (
                        <>
                          <td className={`${cellClass} min-w-[18rem]`}>{technicalRow.member || '—'}</td>
                          <td className={cellClass}>
                            <span className="inline-flex flex-wrap items-center gap-y-1">
                              <span>{technicalRow.product || '—'}</span>
                              {configuredSet.has(loc.id) && UPDATED_BADGE}
                            </span>
                          </td>
                          <td className={cellClass}>{technicalRow.media || '—'}</td>
                          <td className={cellClass}>{technicalRow.serviceType || '—'}</td>
                          <td className={cellClass}>{technicalRow.lsi || '—'}</td>
                          <td className={cellClass}>{technicalRow.quantity ?? '—'}</td>
                          <td className={cellClass}>{technicalRow.feasibility || '—'}</td>
                          <td className={cellClass}>{technicalRow.crossConnectRequired || '—'}</td>
                          <td className={cellClass}>{technicalRow.ddosRequired || '—'}</td>
                          <td className={cellClass}>{technicalRow.oneTime || '—'}</td>
                          <td className={cellClass}>{technicalRow.recurring || '—'}</td>
                          <td className={cellClass}>{technicalRow.arcTotal || '—'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-4 text-gray-800 align-middle min-h-[7rem]">
                            {loc.productsAssigned !== false ? (
                              <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-green-700 text-white shrink-0" aria-label="Offer assigned" title="Products assigned">
                                <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <EditableCell loc={loc} field="streetAddress" displayValue={streetDisplay} onUpdate={onUpdateLocation} className={`${cellClass} min-w-[14rem]`} showUpdatedBadge={configuredSet.has(loc.id)} />
                          <EditableCell loc={loc} field="floorNo" displayValue={loc.floorNo ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="flatNo" displayValue={loc.flatNo ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="city" displayValue={loc.city ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="state" displayValue={loc.state ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="country" displayValue={loc.country || 'India'} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="premises" displayValue={loc.premises ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="postalCode" displayValue={loc.postalCode ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="servicePoint" displayValue={loc.servicePoint ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="locationType" displayValue={loc.locationType ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="solutionType" displayValue={loc.solutionType ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <EditableCell loc={loc} field="circle" displayValue={loc.circle ?? ''} onUpdate={onUpdateLocation} className={cellClass} />
                          <td className="px-2 py-4 text-gray-800 align-middle text-gray-600 leading-relaxed min-h-[7rem]" title="Read only">{loc.source === 'File Uploaded' || loc.source === 'File Upload' ? 'File Uploaded' : (loc.source || 'AI Extracted')}</td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Previous / Next pagination at bottom - always visible like other list views */}
        <div className="flex-shrink-0 flex items-center justify-center gap-4 w-full px-4 py-3 bg-white border-t border-gray-200">
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
      </div>

      {/* Delete confirmation modal - supports bulk delete when multiple rows selected */}
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
              Are you sure you want to delete this record for {deleteModalRow.streetAddress}?
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
                    onDeleteLocations?.(Array.from(selectedIds))
                    setSelectedIds(new Set())
                  } else {
                    onDeleteLocations?.([deleteModalRow.id])
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

export default LocationsTabContent
