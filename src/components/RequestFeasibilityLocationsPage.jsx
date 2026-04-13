import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { useResizableColumns } from '../hooks/useResizableColumns'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const PAGE_SIZE = 5
const FILTER_ALL = 'All'
const DISPLAY_ALL = 'All'
const DISPLAY_REVIEW_ONLY = 'Show Locations to be reviewed'
const DISPLAY_FEASIBLE_ONLY = 'Show Feasible Records'
const DISPLAY_NON_FEASIBLE_ONLY = 'Show Non-feasible records'
const DISPLAY_COLUMNS_ALL = 'All'
const DISPLAY_COLUMNS_LOCATIONS_PRODUCTS = 'Locations+Products'
const DISPLAY_COLUMNS_PO_DETAILS = 'PO Details'
const PO_DETAIL_CHECKBOX_COLUMNS = [
  { key: 'billingContactPerson', label: 'Billing Contact Person' },
  { key: 'billingDetails', label: 'Billing Details' },
  { key: 'poGroup', label: 'PO Group' },
  { key: 'invoiceShippingDetails', label: 'Invoice Shipping Details' },
  { key: 'gstApplicable', label: 'GST applicable' },
]
const LOCATIONS_PRODUCTS_VISIBLE_COLUMNS = [
  'location',
  'premise',
  'requestedProduct',
  'matchedProduct',
  'media',
  'feasibleMedia',
  'bandwidth',
  'arc',
  'otc',
  'addressStatus',
  'feasibilityStatus',
  'capex',
]
const PO_DETAILS_BASE_VISIBLE_COLUMNS = ['location', 'requestedProduct', 'media', 'bandwidth']
const MEDIA_OPTIONS = ['Fiber', 'Copper', 'Wireless']
const FEASIBLE_MEDIA_OPTIONS = ['Fiber', '4G Fiber', '5G Fiber', '4G', '5G', 'Copper', 'Wireless']
const BANDWIDTH_OPTIONS = ['10 Mbps', '50 Mbps', '100 Mbps', '200 Mbps', '1 Gbps']
const BILLING_CONTACT_OPTIONS = ['Ms. Priya Sharma', 'Mr. Rahul Verma', 'Mrs. Anita Krishnan']
const GST_APPLICABLE_OPTIONS = ['Billing GST', 'Delivery GST']
const INVOICE_SHIPPING_OPTIONS = [
  { value: 'Same as BCP Address', label: 'Same as BCP Address' },
  { value: 'New Invoice', label: 'New Invoice' },
]
const BCP_SALUTATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']
const BCP_STANDARD_REASONS = [
  'SEZ',
  'UIN',
  'Exempt',
  'Non-SEZ',
  'Applied For',
  'SEZ with Taxes',
  'Zero Rated Supply- FTWZ',
  'Zero Rated Supply- Export',
  'Non Taxable as transactions within same Company',
  'Airtel- Foreign Legal Entity',
  'Others',
  'Exempt-Trust/Entities 12AA',
  'Zero Rated Supply- SEZ',
  'J&K delivery - Out of GST Preview',
  'Exempt Supply - Trust/Entities 12AA',
  'Tax Deductor',
]
const BILLING_SUB_COLUMNS = [
  { key: 'billingLegalEntity', label: 'Legal Entity', defaultWidth: 112 },
  { key: 'billingBillDetailsType', label: 'Bill Details Type', defaultWidth: 124 },
  { key: 'billingStore', label: 'Store', defaultWidth: 84 },
  { key: 'billingLevel', label: 'Billing level', defaultWidth: 104 },
  { key: 'billingFrequency', label: 'Billing Frequency', defaultWidth: 128 },
  { key: 'billingCreditPeriod', label: 'Credit Period', defaultWidth: 112 },
  { key: 'billingDispatchMethod', label: 'Bill dispatch method', defaultWidth: 138 },
  { key: 'billingMode', label: 'Bill Mode', defaultWidth: 96 },
  { key: 'billingPaymentMethod', label: 'Bill Payment Method', defaultWidth: 140 },
]
const PO_SUB_COLUMNS = [
  { key: 'poNumber', label: 'PO', defaultWidth: 84 },
  { key: 'poReceivedDate', label: 'PO Received Date', defaultWidth: 128 },
  { key: 'poAmount', label: 'PO Amount', defaultWidth: 104 },
  { key: 'poExpiryDate', label: 'PO Expiry Date', defaultWidth: 120 },
  { key: 'poExpiryType', label: 'PO Expiry Type', defaultWidth: 120 },
  { key: 'poTerms', label: 'PO terms (in months)', defaultWidth: 144 },
  { key: 'poOeReceivedDate', label: 'PO OE Received Date', defaultWidth: 136 },
]
const ADDRESS_STATUS_OPTIONS = ['Valid', 'Partial', 'Invalid']
const FEASIBILITY_STATUS_OPTIONS = ['Feasible', 'Not Feasible']
const EMPTY_CELL_PLACEHOLDER = <span className="text-gray-400 font-medium">—</span>
const MAP_MODE_OPTIONS = ['Map', 'Satellite']
const CONTENT_OVERLAY_CLASS = 'fixed inset-x-0 bottom-0 top-16'

function sanitizeDigitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function bumpAddressNumber(address, delta) {
  const text = String(address || '')
  if (!text) return text
  const nextDelta = Number.isFinite(delta) && delta > 0 ? delta : 1
  return text.replace(/^(\s*)(\d+)(\b|,)/, (_, lead, num, tail) => `${lead}${Number(num) + nextDelta}${tail}`)
}

function parseLocationForEdit(locationText) {
  const raw = String(locationText || '').trim()
  if (!raw) {
    return { street: '', city: '', state: '', country: 'India', pinCode: '' }
  }

  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean)
  const isPinCode = (value) => /^\d{5,6}$/.test(String(value || '').trim())

  let country = parts.length > 0 ? parts[parts.length - 1] : 'India'
  let pinCode = ''
  let state = ''
  let city = ''
  let street = ''

  if (parts.length >= 2 && isPinCode(parts[parts.length - 2])) {
    pinCode = parts[parts.length - 2]
    state = parts[parts.length - 3] || ''
    city = parts[parts.length - 4] || ''
    street = parts.slice(0, Math.max(parts.length - 4, 1)).join(', ')
  } else {
    state = parts[parts.length - 2] || ''
    city = parts[parts.length - 3] || ''
    street = parts.slice(0, Math.max(parts.length - 3, 1)).join(', ')
  }

  if (!country) country = 'India'
  if (!street) street = parts[0] || ''

  return { street, city, state, country, pinCode }
}

function buildLocationFromEdit({ street, city, state, country, pinCode }) {
  return [street, city, state, country, pinCode]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ')
}

function buildFutureDateInputValue(daysAhead = 45) {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function MapClickCapture({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({
        lat: Number(event.latlng.lat),
        lng: Number(event.latlng.lng),
      })
    },
    moveend(event) {
      const center = event.target.getCenter()
      onPick({
        lat: Number(center.lat),
        lng: Number(center.lng),
      })
    },
  })
  return null
}

function MapAutoCenter({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

function AddressPickerMap({ mapMode, center, onPick }) {
  const tileUrl = mapMode === 'Satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const attribution = mapMode === 'Satellite'
    ? '&copy; Esri'
    : '&copy; OpenStreetMap contributors'

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer attribution={attribution} url={tileUrl} />
      <Marker position={[center.lat, center.lng]} />
      <MapClickCapture onPick={onPick} />
      <MapAutoCenter center={center} />
    </MapContainer>
  )
}

function getNumericSeedFromId(id) {
  const numeric = Number(String(id || '').replace(/\D/g, ''))
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
}

function buildPseudoCoordinates(seed) {
  const lat = (28.430000 + ((seed * 37) % 1000) / 100000).toFixed(6)
  const lng = (77.010000 + ((seed * 53) % 1000) / 100000).toFixed(6)
  return { lat, lng }
}

function buildRows(locations) {
  const baseLocations = Array.isArray(locations) && locations.length > 0
    ? locations
    : Array.from({ length: 50 }).map((_, i) => ({
        id: `rf-${i + 1}`,
        streetAddress: `${100 + i}, Sample Street`,
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'][i % 5],
        state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana'][i % 5],
        pincode: ['400001', '110001', '560001', '600001', '500001'][i % 5],
        country: 'India',
      }))

  const products = ['MPLS', 'Internet', 'SD WAN']
  const REQUESTED_PRODUCT_LABELS = {
    MPLS: 'Layer 3 VPN',
    Internet: 'Dedicated Internet',
    'SD WAN': 'WAN',
  }
  const medias = MEDIA_OPTIONS
  const bandwidths = BANDWIDTH_OPTIONS
  return Array.from({ length: 450 }).map((_, i) => {
    const loc = baseLocations[i % baseLocations.length]
    const targetProduct = products[i % products.length]
    return {
      id: `rf-row-${i + 1}`,
      requestedProduct: REQUESTED_PRODUCT_LABELS[targetProduct] || targetProduct,
      targetProduct,
      matchedProduct: '',
      state: loc.state || '—',
      location: `${loc.streetAddress || '—'}, ${loc.floorNo || '—'}, ${loc.state || '—'}, ${loc.pincode || loc.postalCode || '—'}, ${loc.country || 'India'}`,
      premise: '',
      media: medias[i % medias.length],
      feasibleMedia: '',
      bandwidth: bandwidths[i % bandwidths.length],
      capex: { onNet: '', offNet: '' },
      confidenceLevel: `${90 - (i % 5) * 6}%`,
      feasibilityStatus: '',
      feasibilityResponse: '',
      addressStatus: '',
      arc: '',
      otc: '',
    }
  })
}

function getRowSequenceFromId(rowId) {
  const n = Number(String(rowId || '').match(/rf-row-(\d+)/)?.[1] || 0)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function getDefaultPoCellValue(row, field) {
  const seq = getRowSequenceFromId(row?.id)
  if (field === 'billingContactPerson') {
    return BILLING_CONTACT_OPTIONS[(seq - 1) % BILLING_CONTACT_OPTIONS.length]
  }
  if (field === 'billingDetails') {
    return `Billing level ${((seq - 1) % 3) + 1}, Monthly`
  }
  if (field === 'poGroup') {
    return `PO-${seq}, 2025-01-${String(((seq - 1) % 27) + 1).padStart(2, '0')}`
  }
  if (field === 'billingLegalEntity') return ['Bharti Airtel Ltd', 'Airtel Business Pvt Ltd', 'Airtel Infra Ltd'][(seq - 1) % 3]
  if (field === 'billingBillDetailsType') return ['A/C wise', 'Summary wise'][(seq - 1) % 2]
  if (field === 'billingStore') return ['Store 1', 'Store 2'][(seq - 1) % 2]
  if (field === 'billingLevel') return `Level ${((seq - 1) % 3) + 1}`
  if (field === 'billingFrequency') return ['Monthly', 'Quarterly'][(seq - 1) % 2]
  if (field === 'billingCreditPeriod') return ['30 days', '45 days'][(seq - 1) % 2]
  if (field === 'billingDispatchMethod') return ['Email', 'Courier'][(seq - 1) % 2]
  if (field === 'billingMode') return ['E-Bill', 'Physical'][(seq - 1) % 2]
  if (field === 'billingPaymentMethod') return ['NEFT', 'Online'][(seq - 1) % 2]
  if (field === 'poNumber') return `PO-${seq}`
  if (field === 'poReceivedDate') return `2025-01-${String(((seq - 1) % 27) + 1).padStart(2, '0')}`
  if (field === 'poAmount') return `Rs. ${(seq * 250000).toLocaleString('en-IN')}`
  if (field === 'poExpiryDate') return `2026-01-${String(((seq - 1) % 27) + 1).padStart(2, '0')}`
  if (field === 'poExpiryType') return ['Calendar Date', 'Service Period'][(seq - 1) % 2]
  if (field === 'poTerms') return `${12 + ((seq - 1) % 3) * 6}`
  if (field === 'poOeReceivedDate') return `2025-02-${String(((seq - 1) % 27) + 1).padStart(2, '0')}`
  if (field === 'invoiceShippingDetails') {
    return String(row?.location || '').split(' (Lat:')[0]
  }
  if (field === 'gstApplicable') {
    return GST_APPLICABLE_OPTIONS[(seq - 1) % GST_APPLICABLE_OPTIONS.length]
  }
  return ''
}

function StatusBadge({ value, type }) {
  if (!value || !String(value).trim()) {
    return EMPTY_CELL_PLACEHOLDER
  }
  const baseClass = 'inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-semibold border'
  const successClass = `${baseClass} bg-[#10B04A] text-white border-[#10B04A]`
  const failureClass = `${baseClass} bg-[#E31B23] text-white border-[#E31B23]`
  const partialClass = `${baseClass} bg-[#F26A00] text-black border-[#F26A00]`

  if (type === 'feasibility') {
    return value === 'Feasible'
      ? <span className={successClass}>Feasible</span>
      : <span className={failureClass}>Non-Feasible</span>
  }
  if (value === 'Valid') {
    return <span className={successClass}>Valid</span>
  }
  if (value === 'Invalid') {
    return <span className={failureClass}>Invalid</span>
  }
  return <span className={partialClass}>Partial</span>
}

export default function RequestFeasibilityLocationsPage({
  quote1Locations = [],
  showAccountInfoHeader = true,
  feasibilityPageName = 'Feasibility for SBI Bank',
  feasibilityRequestId = 'FR-0001',
  accountName = 'SBI Bank',
  opportunityName = '',
  quoteName = '',
  showUpdateQuoteOnly = false,
  onFeasibilityQuoteStatusShown,
  onConvertToOpportunityAndQuote,
  onConvertToOpportunity,
  externalCheckFeasibilityNavigateSignal = 0,
  externalValidateAddressNavigateSignal = 0,
  externalMatchProductsNavigateSignal = 0,
  externalFeasibilityQuoteNavigateSignal = 0,
  externalLocationMatchOverlayVisible = false,
  externalLocationMatchStartSignal = 0,
  externalLocationMatchNavigateSignal = 0,
}) {
  const defaultOpportunityName = `${accountName} - New Opportunity`
  const defaultQuoteName = `${accountName} Quote`
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterByOpen, setFilterByOpen] = useState(false)
  const [filterState, setFilterState] = useState(FILTER_ALL)
  const [filterRequiredProduct, setFilterRequiredProduct] = useState(FILTER_ALL)
  const [filterMedia, setFilterMedia] = useState(FILTER_ALL)
  const [filterBandwidth, setFilterBandwidth] = useState(FILTER_ALL)
  const [filterMatchedProduct, setFilterMatchedProduct] = useState(FILTER_ALL)
  const [filterAddressStatus, setFilterAddressStatus] = useState(FILTER_ALL)
  const [filterFeasibilityStatus, setFilterFeasibilityStatus] = useState(FILTER_ALL)
  const [displayMode, setDisplayMode] = useState(DISPLAY_ALL)
  const [displayingOpen, setDisplayingOpen] = useState(false)
  const [displayColumnsOpen, setDisplayColumnsOpen] = useState(false)
  const [displayColumnsMode, setDisplayColumnsMode] = useState(DISPLAY_COLUMNS_ALL)
  const [poDetailsAllSelected, setPoDetailsAllSelected] = useState(true)
  const [poDetailColumnSelection, setPoDetailColumnSelection] = useState(() => (
    PO_DETAIL_CHECKBOX_COLUMNS.reduce((acc, item) => ({ ...acc, [item.key]: false }), {})
  ))
  const [viewingSelectedOnly, setViewingSelectedOnly] = useState(false)
  const [openRowMenuId, setOpenRowMenuId] = useState(null)
  const [cellEdits, setCellEdits] = useState({})
  const [editingCell, setEditingCell] = useState(null) // { rowId, column }
  const [inlineDraft, setInlineDraft] = useState({})
  const [bulkEditPopover, setBulkEditPopover] = useState(null) // { rowId, column, top, left }
  const [bulkEditDraft, setBulkEditDraft] = useState({})
  const [applyBulkToSelected, setApplyBulkToSelected] = useState(true)
  const [matchPrepOverlayVisible, setMatchPrepOverlayVisible] = useState(false)
  const [matchNotificationVisible, setMatchNotificationVisible] = useState(false)
  const [matchingOverlayVisible, setMatchingOverlayVisible] = useState(false)
  const [locationMatchPrepOverlayVisible, setLocationMatchPrepOverlayVisible] = useState(false)
  const [locationMatchNotificationVisible, setLocationMatchNotificationVisible] = useState(false)
  const [locationMatchingOverlayVisible, setLocationMatchingOverlayVisible] = useState(false)
  const [addressValidationPrepOverlayVisible, setAddressValidationPrepOverlayVisible] = useState(false)
  const [addressValidationNotificationVisible, setAddressValidationNotificationVisible] = useState(false)
  const [addressValidationLoadingVisible, setAddressValidationLoadingVisible] = useState(false)
  const [feasibilityPrepOverlayVisible, setFeasibilityPrepOverlayVisible] = useState(false)
  const [feasibilityNotificationVisible, setFeasibilityNotificationVisible] = useState(false)
  const [createOpportunityNotificationVisible, setCreateOpportunityNotificationVisible] = useState(false)
  const [feasibilityLoadingVisible, setFeasibilityLoadingVisible] = useState(false)
  const [feasibilityQuoteOverlayVisible, setFeasibilityQuoteOverlayVisible] = useState(false)
  const [locationReviewRowIds, setLocationReviewRowIds] = useState(() => new Set())
  const [matchedUpdatedRowIds, setMatchedUpdatedRowIds] = useState(() => new Set())
  const [locationUpdatedRowIds, setLocationUpdatedRowIds] = useState(() => new Set())
  const [updatedCellKeys, setUpdatedCellKeys] = useState(() => new Set()) // `${rowId}_${column}`
  const [isCheckFeasibilityEnabled, setIsCheckFeasibilityEnabled] = useState(false)
  const [isConvertToOpportunityEnabled, setIsConvertToOpportunityEnabled] = useState(false)
  const [isFeasibilityCheckCompleted, setIsFeasibilityCheckCompleted] = useState(false)
  const [showNonFeasibleSelectionError, setShowNonFeasibleSelectionError] = useState(false)
  const [billingDetailsExpanded, setBillingDetailsExpanded] = useState(false)
  const [poGroupExpanded, setPoGroupExpanded] = useState(false)
  const [premiseLookupOpen, setPremiseLookupOpen] = useState(false)
  const [addressMatchModalRowId, setAddressMatchModalRowId] = useState(null)
  const [addressMatchModalContext, setAddressMatchModalContext] = useState('review') // 'review' | 'status'
  const [addressMatchSelectedCandidateId, setAddressMatchSelectedCandidateId] = useState(null)
  const [addressMatchPinnedCoords, setAddressMatchPinnedCoords] = useState({})
  const [addressCorrectionConfirmedSites, setAddressCorrectionConfirmedSites] = useState({})
  const [addressMapMode, setAddressMapMode] = useState('Map')
  const [addressMapSearch, setAddressMapSearch] = useState('')
  const [locationEditModalRowId, setLocationEditModalRowId] = useState(null)
  const [locationEditForm, setLocationEditForm] = useState({ street: '', city: '', state: '', country: 'India', pinCode: '' })
  const [createOpportunityModalOpen, setCreateOpportunityModalOpen] = useState(false)
  const [createOpportunityForm, setCreateOpportunityForm] = useState({
    opportunityName: defaultOpportunityName,
    bsg: 'Rohit Sharma',
    kam: 'Ananya Iyer',
    stage: 'Initial',
    opportunityType: 'New',
    opportunityCurrency: 'Indian Rupee',
    expectedCloseDate: buildFutureDateInputValue(45),
    monthProjection: 'Commitment',
  })
  const [createOpportunityErrors, setCreateOpportunityErrors] = useState({})
  const [createOpportunityQuoteModalOpen, setCreateOpportunityQuoteModalOpen] = useState(false)
  const [createOpportunityQuoteStep, setCreateOpportunityQuoteStep] = useState(1)
  const [createOpportunityQuoteForm, setCreateOpportunityQuoteForm] = useState({
    opportunityName: defaultOpportunityName,
    bsg: 'Rohit Sharma',
    kam: 'Ananya Iyer',
    stage: 'Initial',
    opportunityType: 'New',
    opportunityCurrency: 'Indian Rupee',
    expectedCloseDate: buildFutureDateInputValue(45),
    monthProjection: 'Commitment',
    quoteName: defaultQuoteName,
    quoteContact: 'Rahul Verma',
    nba: accountName,
  })
  const [createOpportunityQuoteErrors, setCreateOpportunityQuoteErrors] = useState({})
  const [billingDetailsModalRowId, setBillingDetailsModalRowId] = useState(null)
  const [applyBillingDetailsToSelected, setApplyBillingDetailsToSelected] = useState(true)
  const [billingDetailsValidationErrors, setBillingDetailsValidationErrors] = useState({})
  const [billingModalForm, setBillingModalForm] = useState({
    billingLegalEntity: '',
    billingBillDetailsType: '',
    billingStore: '',
    billingLevel: '',
    billingFrequency: '',
    billingCreditPeriod: '',
    billingDispatchMethod: '',
    billingMode: '',
    billingPaymentMethod: '',
  })
  const [poGroupModalRowId, setPoGroupModalRowId] = useState(null)
  const [applyPoGroupToSelected, setApplyPoGroupToSelected] = useState(true)
  const [poGroupValidationErrors, setPoGroupValidationErrors] = useState({})
  const [poModalForm, setPoModalForm] = useState({
    poNumber: '',
    poReceivedDate: '',
    poAmount: '',
    poExpiryDate: '',
    poExpiryType: '',
    poTerms: '',
    poOeReceivedDate: '',
  })
  const [invoiceShippingModalRowId, setInvoiceShippingModalRowId] = useState(null)
  const [applyInvoiceShippingToSelected, setApplyInvoiceShippingToSelected] = useState(true)
  const [invoiceShippingForm, setInvoiceShippingForm] = useState({
    invoiceShippingDetails: 'Same as BCP Address',
    invoiceShippingStreet: '',
    invoiceShippingCity: '',
    invoiceShippingState: '',
    invoiceShippingCountry: '',
    invoiceShippingPincode: '',
  })
  const [billingContactOptions, setBillingContactOptions] = useState(BILLING_CONTACT_OPTIONS)
  const [addBcpModalOpen, setAddBcpModalOpen] = useState(false)
  const [addBcpApplyToSelected, setAddBcpApplyToSelected] = useState(true)
  const [bcpSalutation, setBcpSalutation] = useState('Mr.')
  const [bcpFirstName, setBcpFirstName] = useState('')
  const [bcpLastName, setBcpLastName] = useState('')
  const [bcpDesignation, setBcpDesignation] = useState('')
  const [bcpMobileLandline, setBcpMobileLandline] = useState('')
  const [bcpEmail, setBcpEmail] = useState('')
  const [bcpAlternateEmail, setBcpAlternateEmail] = useState('')
  const [bcpFax, setBcpFax] = useState('')
  const [bcpPincode, setBcpPincode] = useState('')
  const [bcpBillingStreet, setBcpBillingStreet] = useState('')
  const [bcpCity, setBcpCity] = useState('')
  const [bcpState, setBcpState] = useState('')
  const [bcpCountry, setBcpCountry] = useState('')
  const [bcpGstApplicable, setBcpGstApplicable] = useState('')
  const [bcpStandardReason, setBcpStandardReason] = useState('')
  const [bcpGstAdded, setBcpGstAdded] = useState(false)
  const [bcpGstNumber, setBcpGstNumber] = useState('')
  const [bcpEndDate, setBcpEndDate] = useState('')
  const [bcpGstValidated, setBcpGstValidated] = useState(false)
  const [validateGstModalOpen, setValidateGstModalOpen] = useState(false)
  const [addBcpValidationErrors, setAddBcpValidationErrors] = useState({})
  const [addBcpTargetIds, setAddBcpTargetIds] = useState([])
  const [addBcpSourceRowId, setAddBcpSourceRowId] = useState(null)
  const bulkPopoverRef = useRef(null)
  const filterByRef = useRef(null)
  const displayingRef = useRef(null)
  const displayColumnsRef = useRef(null)
  const matchPrepTimerRef = useRef(null)
  const matchingTimerRef = useRef(null)
  const locationMatchPrepTimerRef = useRef(null)
  const locationMatchingTimerRef = useRef(null)
  const addressValidationPrepTimerRef = useRef(null)
  const addressValidationLoadingTimerRef = useRef(null)
  const feasibilityPrepTimerRef = useRef(null)
  const feasibilityLoadingTimerRef = useRef(null)
  const feasibilityQuoteStatusTimerRef = useRef(null)
  const nonFeasibleErrorRef = useRef(null)

  const UPDATED_BADGE = (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-black bg-white border border-gray-300 shrink-0" title="Updated">
      Updated
    </span>
  )
  const cellKey = (rowId, column) => `${rowId}_${column}`

  const clearUpdatedBadgesForNextAction = () => {
    setMatchedUpdatedRowIds(new Set())
    setLocationUpdatedRowIds(new Set())
    setUpdatedCellKeys(new Set())
  }

  const rows = useMemo(() => buildRows(quote1Locations), [quote1Locations])
  const isLocationsPoVariant = feasibilityPageName === 'Feasibility of HDFC Bank (Locations+PO)'
  const lockCreateActions = showUpdateQuoteOnly
  const lockUpdateAction = !showUpdateQuoteOnly
  const visibleColumns = useMemo(() => {
    const allColumns = new Set([
      'location',
      'premise',
      'requestedProduct',
      'matchedProduct',
      'media',
      'feasibleMedia',
      'bandwidth',
      'arc',
      'otc',
      'addressStatus',
      'confidenceLevel',
      'feasibilityStatus',
      'capex',
      'billingContactPerson',
      'billingDetails',
      'poGroup',
      'invoiceShippingDetails',
      'gstApplicable',
    ])
    if (!isLocationsPoVariant || displayColumnsMode === DISPLAY_COLUMNS_ALL) {
      return allColumns
    }
    if (displayColumnsMode === DISPLAY_COLUMNS_LOCATIONS_PRODUCTS) {
      return new Set(LOCATIONS_PRODUCTS_VISIBLE_COLUMNS)
    }
    if (displayColumnsMode === DISPLAY_COLUMNS_PO_DETAILS) {
      const set = new Set(PO_DETAILS_BASE_VISIBLE_COLUMNS)
      if (poDetailsAllSelected) {
        PO_DETAIL_CHECKBOX_COLUMNS.forEach((item) => set.add(item.key))
      } else {
        PO_DETAIL_CHECKBOX_COLUMNS.forEach((item) => {
          if (poDetailColumnSelection[item.key]) set.add(item.key)
        })
      }
      return set
    }
    return allColumns
  }, [isLocationsPoVariant, displayColumnsMode, poDetailColumnSelection, poDetailsAllSelected])
  const isColumnVisible = (columnKey) => visibleColumns.has(columnKey)
  const showBillingDetailsColumn = isColumnVisible('billingDetails')
  const showPoGroupColumn = isColumnVisible('poGroup')
  const billingDetailsExpandedEffective = showBillingDetailsColumn && (
    billingDetailsExpanded
    || (isLocationsPoVariant && displayColumnsMode === DISPLAY_COLUMNS_PO_DETAILS && Boolean(poDetailColumnSelection.billingDetails))
  )
  const poGroupExpandedEffective = showPoGroupColumn && (
    poGroupExpanded
    || (isLocationsPoVariant && displayColumnsMode === DISPLAY_COLUMNS_PO_DETAILS && Boolean(poDetailColumnSelection.poGroup))
  )
  const hasSecondaryHeaderRow = isLocationsPoVariant
    && (
      billingDetailsExpandedEffective
      || poGroupExpandedEffective
    )
  const isAllPoDetailsSelected = poDetailsAllSelected
  const tableResizableCols = useMemo(() => ([
    { id: 'location', label: 'Location' },
    { id: 'premise', label: 'Premise' },
    { id: 'requestedProduct', label: 'Requested Product' },
    { id: 'matchedProduct', label: 'Matched Product' },
    { id: 'media', label: 'Requested Media' },
    { id: 'feasibleMedia', label: 'Feasible Media' },
    { id: 'bandwidth', label: 'Bandwidth' },
    { id: 'arc', label: 'ARC' },
    { id: 'otc', label: 'OTC' },
    { id: 'addressStatus', label: 'Address Status' },
    { id: 'confidenceLevel', label: 'Confidence Level' },
    { id: 'feasibilityStatus', label: 'Feasibility Status' },
    { id: 'capex', label: 'Capex' },
    { id: 'billingContactPerson', label: 'Billing Contact Person' },
    { id: 'billingDetails', label: 'Billing Details' },
    ...BILLING_SUB_COLUMNS.map((col) => ({ id: col.key, label: col.label, defaultWidth: col.defaultWidth })),
    { id: 'poGroup', label: 'PO Group' },
    ...PO_SUB_COLUMNS.map((col) => ({ id: col.key, label: col.label, defaultWidth: col.defaultWidth })),
    { id: 'invoiceShippingDetails', label: 'Invoice Shipping Details' },
    { id: 'gstApplicable', label: 'GST Applicable' },
  ]), [])
  const { getColStyle, ResizeHandle } = useResizableColumns(tableResizableCols)
  const addressMatchRow = useMemo(
    () => rows.find((row) => row.id === addressMatchModalRowId) || null,
    [rows, addressMatchModalRowId]
  )
  const locationEditRow = useMemo(
    () => rows.find((row) => row.id === locationEditModalRowId) || null,
    [rows, locationEditModalRowId]
  )
  const billingDetailsModalRow = useMemo(
    () => rows.find((row) => row.id === billingDetailsModalRowId) || null,
    [rows, billingDetailsModalRowId]
  )
  const poGroupModalRow = useMemo(
    () => rows.find((row) => row.id === poGroupModalRowId) || null,
    [rows, poGroupModalRowId]
  )
  const invoiceShippingModalRow = useMemo(
    () => rows.find((row) => row.id === invoiceShippingModalRowId) || null,
    [rows, invoiceShippingModalRowId]
  )
  const addressMatchCandidates = useMemo(() => {
    if (!addressMatchRow) return []
    if (addressMatchModalContext === 'status') {
      const rowLocation = cellEdits[addressMatchRow.id]?.location ?? addressMatchRow.location
      const { lat, lng } = buildPseudoCoordinates(getNumericSeedFromId(addressMatchRow.id))
      return [{
        id: `${addressMatchRow.id}-candidate`,
        rowId: addressMatchRow.id,
        site: rowLocation,
        lat,
        lng,
        confidenceLevel: 96,
      }]
    }
    const candidates = rows
      .filter((row) => row.state === addressMatchRow.state)
      .slice(0, 5)
      .map((row, idx) => {
        const seed = getNumericSeedFromId(row.id) + idx
        const { lat, lng } = buildPseudoCoordinates(seed)
        const confidenceLevel = idx < 2 ? 96 - (idx * 2) : idx < 4 ? 84 - ((idx - 2) * 3) : 68
        return {
          id: `${row.id}-candidate`,
          rowId: row.id,
          site: row.location,
          lat,
          lng,
          confidenceLevel,
        }
      })
    return candidates.length > 0 ? candidates : [{
      id: `${addressMatchRow.id}-candidate`,
      rowId: addressMatchRow.id,
      site: addressMatchRow.location,
      ...buildPseudoCoordinates(getNumericSeedFromId(addressMatchRow.id)),
      confidenceLevel: 96,
    }]
  }, [rows, addressMatchRow, addressMatchModalContext, cellEdits])
  const selectedAddressCandidate = useMemo(
    () => addressMatchCandidates.find((candidate) => candidate.id === addressMatchSelectedCandidateId) || addressMatchCandidates[0] || null,
    [addressMatchCandidates, addressMatchSelectedCandidateId]
  )
  const selectedAddressCandidateCoords = useMemo(() => {
    if (!selectedAddressCandidate) return { lat: 28.430370, lng: 77.01053 }
    const pinned = addressMatchPinnedCoords[selectedAddressCandidate.id]
    if (pinned) return pinned
    return {
      lat: Number(selectedAddressCandidate.lat),
      lng: Number(selectedAddressCandidate.lng),
    }
  }, [selectedAddressCandidate, addressMatchPinnedCoords])

  const getAddressCorrectionPreviewSite = (candidate) => {
    if (!candidate) return ''
    if (addressMatchModalContext !== 'status') return candidate.site
    const pinned = addressMatchPinnedCoords[candidate.id]
    if (!pinned) return candidate.site
    const baseLat = Number(candidate.lat)
    const baseLng = Number(candidate.lng)
    const movedBy = Math.abs(Number(pinned.lat) - baseLat) + Math.abs(Number(pinned.lng) - baseLng)
    if (movedBy < 0.00005) return candidate.site
    const delta = movedBy > 0.003 ? 3 : movedBy > 0.0015 ? 2 : 1
    return bumpAddressNumber(candidate.site, delta)
  }

  const getAddressCorrectionDisplaySite = (candidate) => {
    if (!candidate) return ''
    if (addressMatchModalContext !== 'status') return candidate.site
    return addressCorrectionConfirmedSites[candidate.id] || candidate.site
  }

  const getRowValue = (row, field) => {
    if (field === 'capexOnNet') return cellEdits[row.id]?.capexOnNet ?? row.capex.onNet
    if (field === 'capexOffNet') return cellEdits[row.id]?.capexOffNet ?? row.capex.offNet
    if (
      field === 'billingContactPerson'
      || field === 'billingDetails'
      || field === 'poGroup'
      || field === 'invoiceShippingDetails'
      || field === 'gstApplicable'
      || BILLING_SUB_COLUMNS.some((col) => col.key === field)
      || PO_SUB_COLUMNS.some((col) => col.key === field)
    ) {
      return cellEdits[row.id]?.[field] ?? row[field] ?? getDefaultPoCellValue(row, field)
    }
    return cellEdits[row.id]?.[field] ?? row[field]
  }

  const getInvoiceShippingDisplayValue = (row) => {
    const mode = String(getRowValue(row, 'invoiceShippingDetails') || '').trim()
    if (mode === 'New Invoice') {
      const parts = [
        getRowValue(row, 'invoiceShippingStreet'),
        getRowValue(row, 'invoiceShippingCity'),
        getRowValue(row, 'invoiceShippingState'),
        getRowValue(row, 'invoiceShippingCountry'),
        getRowValue(row, 'invoiceShippingPincode'),
      ].map((v) => String(v || '').trim()).filter(Boolean)
      return parts.length > 0 ? `New Invoice - ${parts.join(', ')}` : 'New Invoice'
    }
    return 'Same as BCP Address'
  }

  const getDraftFromRow = (row, column) => {
    if (column === 'capex') {
      return {
        onNet: String(getRowValue(row, 'capexOnNet') ?? ''),
        offNet: String(getRowValue(row, 'capexOffNet') ?? ''),
      }
    }
    if (column === 'premise') {
      return { value: '' }
    }
    return { value: String(getRowValue(row, column) ?? '') }
  }

  const applyDraftToIds = (ids, column, draft) => {
    if (!ids || ids.length === 0) return
    const changedIds = []
    setCellEdits((prev) => {
      const next = { ...prev }
      ids.forEach((id) => {
        const existing = next[id] || {}
        if (column === 'capex') {
          const onNetRaw = String(draft.onNet ?? '').trim()
          const offNetRaw = String(draft.offNet ?? '').trim()
          const onNetNum = Number(onNetRaw)
          const offNetNum = Number(offNetRaw)
          next[id] = {
            ...existing,
            capexOnNet: onNetRaw === '' ? '' : (Number.isFinite(onNetNum) ? onNetNum : ''),
            capexOffNet: offNetRaw === '' ? '' : (Number.isFinite(offNetNum) ? offNetNum : ''),
          }
          changedIds.push(id)
        } else if (column === 'arc' || column === 'otc') {
          const raw = String(draft.value ?? '').trim()
          if (!raw) {
            next[id] = { ...existing, [column]: '' }
          } else {
            const num = Number(raw)
            next[id] = { ...existing, [column]: Number.isFinite(num) ? num : '' }
          }
          changedIds.push(id)
        } else {
          next[id] = { ...existing, [column]: draft.value || '' }
          changedIds.push(id)
        }
      })
      return next
    })
    if (changedIds.length > 0) {
      setUpdatedCellKeys((prev) => {
        const next = new Set(prev)
        changedIds.forEach((id) => next.add(cellKey(id, column)))
        return next
      })
    }
  }

  const openEdit = (row, column, event) => {
    if (selectedIds.size > 1 && selectedIds.has(row.id)) {
      const rect = event.currentTarget.getBoundingClientRect()
      setBulkEditPopover({ rowId: row.id, column, top: rect.bottom + 8, left: Math.max(16, rect.left - 8) })
      setBulkEditDraft(getDraftFromRow(row, column))
      setApplyBulkToSelected(true)
      return
    }
    setEditingCell({ rowId: row.id, column })
    setInlineDraft(getDraftFromRow(row, column))
    setPremiseLookupOpen(column === 'premise')
  }

  const cancelInlineEdit = () => {
    setEditingCell(null)
    setInlineDraft({})
    setPremiseLookupOpen(false)
  }

  const saveInlineEdit = () => {
    if (!editingCell) return
    applyDraftToIds([editingCell.rowId], editingCell.column, inlineDraft)
    cancelInlineEdit()
  }

  const editingPremiseRow = useMemo(() => {
    if (editingCell?.column !== 'premise' || !editingCell?.rowId) return null
    return rows.find((r) => r.id === editingCell.rowId) || null
  }, [editingCell, rows])

  const premiseLookupSuggestions = useMemo(() => {
    if (!editingPremiseRow) return []
    const query = String(inlineDraft.value ?? '').trim().toLowerCase()
    const currentLocation = String(getRowValue(editingPremiseRow, 'location') ?? editingPremiseRow.location ?? '').toLowerCase()
    const baseTokens = currentLocation.split(/[\s,]+/).filter(Boolean).slice(0, 8)
    const queryTokens = query.split(/[\s,]+/).filter(Boolean)
    const candidates = Array.from(
      new Set(
        rows
          .map((r) => String(getRowValue(r, 'location') ?? r.location ?? '').trim())
          .filter(Boolean)
      )
    )
    return candidates
      .map((address) => {
        const lower = address.toLowerCase()
        let score = 0
        if (query) {
          if (lower.includes(query)) score += 120
          score += queryTokens.filter((t) => lower.includes(t)).length * 10
        }
        score += baseTokens.filter((t) => lower.includes(t)).length * 4
        return { address, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.address)
  }, [editingPremiseRow, inlineDraft.value, rows, cellEdits])

  const closeBulkEdit = () => {
    setBulkEditPopover(null)
    setBulkEditDraft({})
    setApplyBulkToSelected(true)
  }

  const saveBulkEdit = () => {
    if (!bulkEditPopover) return
    const targetIds = applyBulkToSelected && selectedIds.size > 1 ? Array.from(selectedIds) : [bulkEditPopover.rowId]
    applyDraftToIds(targetIds, bulkEditPopover.column, bulkEditDraft)
    if (targetIds.length > 0) {
      const targetColumn = bulkEditPopover.column
      setUpdatedCellKeys((prev) => {
        const next = new Set(prev)
        targetIds.forEach((id) => next.add(cellKey(id, targetColumn)))
        return next
      })
    }
    closeBulkEdit()
  }

  useEffect(() => {
    if (!bulkEditPopover) return
    const handleClickOutside = (event) => {
      if (bulkPopoverRef.current && !bulkPopoverRef.current.contains(event.target)) {
        setBulkEditPopover(null)
        setBulkEditDraft({})
        setApplyBulkToSelected(true)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [bulkEditPopover])

  useEffect(() => {
    if (!filterByOpen) return
    const handleOutsideClick = (event) => {
      if (filterByRef.current && !filterByRef.current.contains(event.target)) {
        setFilterByOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [filterByOpen])

  useEffect(() => {
    if (!displayingOpen) return
    const handleOutsideClick = (event) => {
      if (displayingRef.current && !displayingRef.current.contains(event.target)) {
        setDisplayingOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [displayingOpen])

  useEffect(() => {
    if (!displayColumnsOpen) return
    const handleOutsideClick = (event) => {
      if (displayColumnsRef.current && !displayColumnsRef.current.contains(event.target)) {
        setDisplayColumnsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [displayColumnsOpen])

  const stateOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => (r.state || '').trim()).filter(Boolean))).sort(),
    [rows]
  )
  const requiredProductOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => (r.requestedProduct || '').trim()).filter(Boolean))).sort(),
    [rows]
  )
  const matchedProductOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => String(getRowValue(r, 'matchedProduct') || '').trim()).filter(Boolean))).sort(),
    [rows, cellEdits]
  )
  const editableMatchedProductOptions = useMemo(
    () => Array.from(
      new Set(
        rows
          .map((r) => String(r.targetProduct || getRowValue(r, 'matchedProduct') || '').trim())
          .filter(Boolean)
      )
    ).sort(),
    [rows, cellEdits]
  )
  const addressStatusOptions = useMemo(
    () => {
      const dynamicValues = Array.from(new Set(rows.map((r) => String(getRowValue(r, 'addressStatus') || '').trim()).filter(Boolean)))
      return Array.from(new Set([...ADDRESS_STATUS_OPTIONS, ...dynamicValues]))
    },
    [rows, cellEdits]
  )
  const feasibilityStatusOptions = useMemo(
    () => {
      const dynamicValues = Array.from(new Set(rows.map((r) => String(getRowValue(r, 'feasibilityStatus') || '').trim()).filter(Boolean)))
      return Array.from(new Set([...FEASIBILITY_STATUS_OPTIONS, ...dynamicValues]))
    },
    [rows, cellEdits]
  )

  const effectiveFilterState = filterState === FILTER_ALL || stateOptions.includes(filterState) ? filterState : FILTER_ALL
  const effectiveFilterRequiredProduct = filterRequiredProduct === FILTER_ALL || requiredProductOptions.includes(filterRequiredProduct)
    ? filterRequiredProduct
    : FILTER_ALL
  const effectiveFilterMedia = filterMedia === FILTER_ALL || MEDIA_OPTIONS.includes(filterMedia) ? filterMedia : FILTER_ALL
  const effectiveFilterBandwidth = filterBandwidth === FILTER_ALL || BANDWIDTH_OPTIONS.includes(filterBandwidth) ? filterBandwidth : FILTER_ALL
  const effectiveFilterMatchedProduct = filterMatchedProduct === FILTER_ALL || matchedProductOptions.includes(filterMatchedProduct)
    ? filterMatchedProduct
    : FILTER_ALL
  const effectiveFilterAddressStatus = filterAddressStatus === FILTER_ALL || addressStatusOptions.includes(filterAddressStatus)
    ? filterAddressStatus
    : FILTER_ALL
  const effectiveFilterFeasibilityStatus = filterFeasibilityStatus === FILTER_ALL || feasibilityStatusOptions.includes(filterFeasibilityStatus)
    ? filterFeasibilityStatus
    : FILTER_ALL

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = rows
    if (effectiveFilterState !== FILTER_ALL) {
      list = list.filter((r) => r.state === effectiveFilterState)
    }
    if (effectiveFilterRequiredProduct !== FILTER_ALL) {
      list = list.filter((r) => r.requestedProduct === effectiveFilterRequiredProduct)
    }
    if (effectiveFilterMedia !== FILTER_ALL) {
      list = list.filter((r) => getRowValue(r, 'media') === effectiveFilterMedia)
    }
    if (effectiveFilterBandwidth !== FILTER_ALL) {
      list = list.filter((r) => getRowValue(r, 'bandwidth') === effectiveFilterBandwidth)
    }
    if (effectiveFilterMatchedProduct !== FILTER_ALL) {
      list = list.filter((r) => getRowValue(r, 'matchedProduct') === effectiveFilterMatchedProduct)
    }
    if (effectiveFilterAddressStatus !== FILTER_ALL) {
      list = list.filter((r) => getRowValue(r, 'addressStatus') === effectiveFilterAddressStatus)
    }
    if (effectiveFilterFeasibilityStatus !== FILTER_ALL) {
      list = list.filter((r) => getRowValue(r, 'feasibilityStatus') === effectiveFilterFeasibilityStatus)
    }
    if (displayMode === DISPLAY_REVIEW_ONLY) {
      list = list.filter((r) => locationReviewRowIds.has(r.id))
    }
    if (displayMode === DISPLAY_FEASIBLE_ONLY) {
      list = list.filter((r) => getRowValue(r, 'feasibilityStatus') === 'Feasible')
    }
    if (displayMode === DISPLAY_NON_FEASIBLE_ONLY) {
      list = list.filter((r) => getRowValue(r, 'feasibilityStatus') === 'Not Feasible')
    }
    if (q) {
      list = list.filter((r) => {
        const haystack = [
          r.requestedProduct,
          getRowValue(r, 'matchedProduct'),
          getRowValue(r, 'location'),
          getRowValue(r, 'premise'),
          getRowValue(r, 'media'),
          getRowValue(r, 'feasibleMedia'),
          getRowValue(r, 'bandwidth'),
          getRowValue(r, 'confidenceLevel'),
          getRowValue(r, 'feasibilityStatus'),
          getRowValue(r, 'addressStatus'),
          String(getRowValue(r, 'arc')),
          String(getRowValue(r, 'otc')),
        ].join(' ').toLowerCase()
        return haystack.includes(q)
      })
    }
    if (viewingSelectedOnly && selectedIds.size > 0) {
      list = list.filter((r) => selectedIds.has(r.id))
    }
    return list
  }, [
    rows,
    searchQuery,
    selectedIds,
    viewingSelectedOnly,
    cellEdits,
    effectiveFilterState,
    effectiveFilterRequiredProduct,
    effectiveFilterMedia,
    effectiveFilterBandwidth,
    effectiveFilterMatchedProduct,
    effectiveFilterAddressStatus,
    effectiveFilterFeasibilityStatus,
    displayMode,
    locationReviewRowIds,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleMatchAllProducts = () => {
    clearUpdatedBadgesForNextAction()
    clearTimeout(matchPrepTimerRef.current)
    clearTimeout(matchingTimerRef.current)
    setMatchNotificationVisible(false)
    setMatchingOverlayVisible(false)
    setMatchPrepOverlayVisible(true)
    matchPrepTimerRef.current = setTimeout(() => {
      setMatchNotificationVisible(true)
    }, 1000)
  }

  const handleMatchLocationForPremises = () => {
    clearUpdatedBadgesForNextAction()
    clearTimeout(locationMatchPrepTimerRef.current)
    clearTimeout(locationMatchingTimerRef.current)
    setLocationMatchNotificationVisible(false)
    setLocationMatchingOverlayVisible(false)
    setLocationMatchPrepOverlayVisible(true)
    locationMatchPrepTimerRef.current = setTimeout(() => {
      setLocationMatchNotificationVisible(true)
    }, 1000)
  }

  const handleLocationMatchNotificationLinkClick = (event) => {
    event?.preventDefault?.()
    clearTimeout(locationMatchingTimerRef.current)
    setLocationMatchPrepOverlayVisible(false)
    setLocationMatchNotificationVisible(false)
    setLocationMatchingOverlayVisible(true)
    locationMatchingTimerRef.current = setTimeout(() => {
      setLocationMatchingOverlayVisible(false)
      const reviewIds = new Set(rows.filter((_, idx) => idx % 6 === 0).map((row) => row.id))
      setLocationReviewRowIds(reviewIds)
      setCellEdits((prev) => {
        const next = { ...prev }
        rows.forEach((row) => {
          const resolvedLocation = String(prev[row.id]?.location ?? row.location ?? '').trim()
          next[row.id] = {
            ...(next[row.id] || {}),
            premise: reviewIds.has(row.id) ? '' : resolvedLocation,
          }
        })
        return next
      })
    }, 2000)
  }

  useEffect(() => {
    if (!externalLocationMatchStartSignal) return
    handleMatchLocationForPremises()
  }, [externalLocationMatchStartSignal])

  useEffect(() => {
    if (!externalLocationMatchNavigateSignal) return
    handleLocationMatchNotificationLinkClick()
  }, [externalLocationMatchNavigateSignal])

  const handleValidateAddress = () => {
    clearUpdatedBadgesForNextAction()
    setIsCheckFeasibilityEnabled(true)
    clearTimeout(addressValidationPrepTimerRef.current)
    clearTimeout(addressValidationLoadingTimerRef.current)
    setAddressValidationNotificationVisible(false)
    setAddressValidationLoadingVisible(false)
    setAddressValidationPrepOverlayVisible(true)
    addressValidationPrepTimerRef.current = setTimeout(() => {
      setAddressValidationNotificationVisible(true)
    }, 1000)
  }

  const handleCheckForFeasibility = () => {
    clearUpdatedBadgesForNextAction()
    setIsConvertToOpportunityEnabled(true)
    setIsFeasibilityCheckCompleted(false)
    clearTimeout(feasibilityPrepTimerRef.current)
    clearTimeout(feasibilityLoadingTimerRef.current)
    setFeasibilityNotificationVisible(false)
    setFeasibilityLoadingVisible(false)
    setFeasibilityPrepOverlayVisible(true)
    feasibilityPrepTimerRef.current = setTimeout(() => {
      setFeasibilityNotificationVisible(true)
    }, 1000)
  }

  const handleFeasibilityQuoteClick = ({ force = false } = {}) => {
    if (!force && !isConvertToOpportunityEnabled) return
    clearTimeout(feasibilityQuoteStatusTimerRef.current)
    setFeasibilityQuoteOverlayVisible(true)
    feasibilityQuoteStatusTimerRef.current = setTimeout(() => {
      onFeasibilityQuoteStatusShown?.(Array.from(selectedIds))
    }, 1000)
  }

  const hasNonFeasibleSelectedRows = () => {
    const selectedRows = rows.filter((r) => selectedIds.has(r.id))
    return selectedRows.some((r) => {
      const status = String(getRowValue(r, 'feasibilityStatus') || '').trim().toLowerCase()
      const normalized = status.replace(/[\s-]+/g, '')
      return normalized === 'notfeasible' || normalized === 'nonfeasible'
    })
  }

  const openCreateOpportunityModal = () => {
    setCreateOpportunityForm({
      opportunityName: defaultOpportunityName,
      bsg: 'Rohit Sharma',
      kam: 'Ananya Iyer',
      stage: 'Initial',
      opportunityType: 'New',
      opportunityCurrency: 'Indian Rupee',
      expectedCloseDate: buildFutureDateInputValue(45),
      monthProjection: 'Commitment',
    })
    setCreateOpportunityErrors({})
    setCreateOpportunityModalOpen(true)
  }

  const closeCreateOpportunityModal = () => {
    setCreateOpportunityModalOpen(false)
    setCreateOpportunityErrors({})
  }

  const handleCreateOpportunitySubmit = () => {
    const nextErrors = {}
    if (!String(createOpportunityForm.opportunityName || '').trim()) nextErrors.opportunityName = 'Opportunity name is required'
    if (!String(createOpportunityForm.bsg || '').trim()) nextErrors.bsg = 'BSG is required'
    if (!String(createOpportunityForm.kam || '').trim()) nextErrors.kam = 'KDM is required'
    if (!String(createOpportunityForm.stage || '').trim()) nextErrors.stage = 'Stage is required'
    if (!String(createOpportunityForm.opportunityType || '').trim()) nextErrors.opportunityType = 'Opportunity Type is required'
    if (!String(createOpportunityForm.opportunityCurrency || '').trim()) nextErrors.opportunityCurrency = 'Opportunity Currency is required'
    if (!String(createOpportunityForm.expectedCloseDate || '').trim()) nextErrors.expectedCloseDate = 'Expected Close Date is required'
    if (!String(createOpportunityForm.monthProjection || '').trim()) nextErrors.monthProjection = 'Month Projection is required'

    setCreateOpportunityErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    closeCreateOpportunityModal()
    setCreateOpportunityNotificationVisible(true)
  }

  const handleCreateOpportunityNotificationLinkClick = (event) => {
    event.preventDefault()
    setCreateOpportunityNotificationVisible(false)
  }

  const validateCreateOpportunityQuoteStepOne = () => {
    const nextErrors = {}
    if (!String(createOpportunityQuoteForm.opportunityName || '').trim()) nextErrors.opportunityName = 'Opportunity name is required'
    if (!String(createOpportunityQuoteForm.bsg || '').trim()) nextErrors.bsg = 'BSG is required'
    if (!String(createOpportunityQuoteForm.kam || '').trim()) nextErrors.kam = 'KDM is required'
    if (!String(createOpportunityQuoteForm.stage || '').trim()) nextErrors.stage = 'Stage is required'
    if (!String(createOpportunityQuoteForm.opportunityType || '').trim()) nextErrors.opportunityType = 'Opportunity Type is required'
    if (!String(createOpportunityQuoteForm.opportunityCurrency || '').trim()) nextErrors.opportunityCurrency = 'Opportunity Currency is required'
    if (!String(createOpportunityQuoteForm.expectedCloseDate || '').trim()) nextErrors.expectedCloseDate = 'Expected Close Date is required'
    if (!String(createOpportunityQuoteForm.monthProjection || '').trim()) nextErrors.monthProjection = 'Month Projection is required'
    return nextErrors
  }

  const validateCreateOpportunityQuoteStepTwo = () => {
    const nextErrors = {}
    if (!String(createOpportunityQuoteForm.quoteName || '').trim()) nextErrors.quoteName = 'Quote Name is required'
    if (!String(createOpportunityQuoteForm.quoteContact || '').trim()) nextErrors.quoteContact = 'Quote Contact is required'
    if (!String(createOpportunityQuoteForm.nba || '').trim()) nextErrors.nba = 'NBA is required'
    return nextErrors
  }

  const openCreateOpportunityQuoteModal = () => {
    if (!isConvertToOpportunityEnabled) return
    if (hasNonFeasibleSelectedRows()) {
      setShowNonFeasibleSelectionError(true)
      return
    }
    setShowNonFeasibleSelectionError(false)
    setCreateOpportunityQuoteStep(1)
    setCreateOpportunityQuoteForm({
      opportunityName: defaultOpportunityName,
      bsg: 'Rohit Sharma',
      kam: 'Ananya Iyer',
      stage: 'Initial',
      opportunityType: 'New',
      opportunityCurrency: 'Indian Rupee',
      expectedCloseDate: buildFutureDateInputValue(45),
      monthProjection: 'Commitment',
      quoteName: defaultQuoteName,
      quoteContact: 'Rahul Verma',
      nba: accountName,
    })
    setCreateOpportunityQuoteErrors({})
    setCreateOpportunityQuoteModalOpen(true)
  }

  const closeCreateOpportunityQuoteModal = () => {
    setCreateOpportunityQuoteModalOpen(false)
    setCreateOpportunityQuoteStep(1)
    setCreateOpportunityQuoteErrors({})
  }

  const handleCreateOpportunityQuoteNext = () => {
    const stepOneErrors = validateCreateOpportunityQuoteStepOne()
    setCreateOpportunityQuoteErrors(stepOneErrors)
    if (Object.keys(stepOneErrors).length > 0) return
    setCreateOpportunityQuoteStep(2)
  }

  const handleCreateOpportunityQuotePrevious = () => {
    setCreateOpportunityQuoteStep(1)
  }

  const handleCreateOpportunityQuoteSubmit = () => {
    const stepTwoErrors = validateCreateOpportunityQuoteStepTwo()
    setCreateOpportunityQuoteErrors(stepTwoErrors)
    if (Object.keys(stepTwoErrors).length > 0) return
    closeCreateOpportunityQuoteModal()
    handleConvertAction('quote')
  }

  const handleConvertAction = (mode = 'quote') => {
    if (!isConvertToOpportunityEnabled) return
    if (hasNonFeasibleSelectedRows()) {
      setShowNonFeasibleSelectionError(true)
      return
    }
    setShowNonFeasibleSelectionError(false)
    clearUpdatedBadgesForNextAction()
    if (mode === 'opportunity') {
      if (onConvertToOpportunity) onConvertToOpportunity(Array.from(selectedIds))
      else onConvertToOpportunityAndQuote?.(Array.from(selectedIds))
      return
    }
    onConvertToOpportunityAndQuote?.(Array.from(selectedIds))
  }

  const handleFeasibilityNotificationLinkClick = (event) => {
    event?.preventDefault?.()
    // Keep agent-triggered feasibility behavior aligned with button flow.
    setIsConvertToOpportunityEnabled(true)
    clearTimeout(feasibilityLoadingTimerRef.current)
    setFeasibilityPrepOverlayVisible(false)
    setFeasibilityNotificationVisible(false)
    setFeasibilityLoadingVisible(true)
    feasibilityLoadingTimerRef.current = setTimeout(() => {
      setFeasibilityLoadingVisible(false)
      setCellEdits((prev) => {
        const next = { ...prev }
        rows.forEach((row) => {
          const rowNumber = Number(String(row.id || '').match(/rf-row-(\d+)/)?.[1] || 0)
          const rowIndex = Number.isFinite(rowNumber) && rowNumber > 0 ? rowNumber - 1 : 0
          const onNetCapex = 25000 + (rowIndex % 8) * 5000
          const offNetCapex = 10000 + (rowIndex % 6) * 3000
          const isReviewPending = locationReviewRowIds.has(row.id)
          next[row.id] = {
            ...(next[row.id] || {}),
            confidenceLevel: isReviewPending ? '42%' : '94%',
            feasibilityStatus: isReviewPending ? 'Not Feasible' : 'Feasible',
            feasibleMedia: isReviewPending ? '' : getRowValue(row, 'media'),
            feasibilityResponse: isReviewPending
              ? 'Premise could not be confidently matched for this location.'
              : 'Premise and serviceability checks passed for this location.',
            capexOnNet: onNetCapex,
            capexOffNet: offNetCapex,
          }
        })
        return next
      })
      setIsFeasibilityCheckCompleted(true)
    }, 2000)
  }

  const handleShowAllRecords = () => {
    setViewingSelectedOnly(false)
    setSearchQuery('')
    setFilterState(FILTER_ALL)
    setFilterRequiredProduct(FILTER_ALL)
    setFilterMedia(FILTER_ALL)
    setFilterBandwidth(FILTER_ALL)
    setFilterMatchedProduct(FILTER_ALL)
    setFilterAddressStatus(FILTER_ALL)
    setFilterFeasibilityStatus(FILTER_ALL)
    setDisplayMode(DISPLAY_ALL)
    setFilterByOpen(false)
    setDisplayingOpen(false)
    setDisplayColumnsOpen(false)
    setCurrentPage(1)
  }

  const handleAddressValidationNotificationLinkClick = (event) => {
    event?.preventDefault?.()
    // Keep agent-triggered validation behavior aligned with button flow.
    setIsCheckFeasibilityEnabled(true)
    clearTimeout(addressValidationLoadingTimerRef.current)
    setAddressValidationPrepOverlayVisible(false)
    setAddressValidationNotificationVisible(false)
    setAddressValidationLoadingVisible(true)
    addressValidationLoadingTimerRef.current = setTimeout(() => {
      setAddressValidationLoadingVisible(false)
      setCellEdits((prev) => {
        const next = { ...prev }
        let missingPremiseCount = 0
        rows.forEach((row) => {
          const premiseValue = String(getRowValue(row, 'premise') ?? '').trim()
          let statusValue = 'Valid'
          if (!premiseValue) {
            statusValue = missingPremiseCount % 2 === 0 ? 'Partial' : 'Invalid'
            missingPremiseCount += 1
          }
          next[row.id] = {
            ...(next[row.id] || {}),
            addressStatus: statusValue,
          }
        })
        return next
      })
    }, 2000)
  }

  const handleMatchNotificationLinkClick = (event) => {
    event?.preventDefault?.()
    clearTimeout(matchingTimerRef.current)
    setMatchPrepOverlayVisible(false)
    setMatchNotificationVisible(false)
    setMatchingOverlayVisible(true)
    matchingTimerRef.current = setTimeout(() => {
      setMatchingOverlayVisible(false)
      setCellEdits((prev) => {
        const next = { ...prev }
        rows.forEach((row) => {
          next[row.id] = {
            ...(next[row.id] || {}),
            matchedProduct: row.targetProduct,
          }
        })
        return next
      })
      setMatchedUpdatedRowIds(new Set(rows.map((r) => r.id)))
    }, 2000)
  }

  useEffect(() => {
    if (!externalCheckFeasibilityNavigateSignal) return
    handleFeasibilityNotificationLinkClick()
  }, [externalCheckFeasibilityNavigateSignal])

  useEffect(() => {
    if (!externalValidateAddressNavigateSignal) return
    handleAddressValidationNotificationLinkClick()
  }, [externalValidateAddressNavigateSignal])

  useEffect(() => {
    if (!externalMatchProductsNavigateSignal) return
    handleMatchNotificationLinkClick()
  }, [externalMatchProductsNavigateSignal])

  useEffect(() => {
    if (!externalFeasibilityQuoteNavigateSignal) return
    clearTimeout(feasibilityQuoteStatusTimerRef.current)
    setFeasibilityQuoteOverlayVisible(false)
  }, [externalFeasibilityQuoteNavigateSignal])

  const openAddressMatchModal = (row, context = 'review') => {
    const firstCandidateId = `${row.id}-candidate`
    setAddressMatchModalRowId(row.id)
    setAddressMatchModalContext(context)
    setAddressMatchSelectedCandidateId(firstCandidateId)
    setAddressMatchPinnedCoords({})
    setAddressCorrectionConfirmedSites({})
    setAddressMapMode('Map')
    setAddressMapSearch('')
  }

  const closeAddressMatchModal = () => {
    setAddressMatchModalRowId(null)
    setAddressMatchModalContext('review')
    setAddressMatchSelectedCandidateId(null)
    setAddressMatchPinnedCoords({})
    setAddressCorrectionConfirmedSites({})
    setAddressMapMode('Map')
    setAddressMapSearch('')
  }

  const openLocationEditModal = (row) => {
    const existingLocation = getRowValue(row, 'location') || row.location
    setLocationEditModalRowId(row.id)
    setLocationEditForm(parseLocationForEdit(existingLocation))
  }

  const closeLocationEditModal = () => {
    setLocationEditModalRowId(null)
    setLocationEditForm({ street: '', city: '', state: '', country: 'India', pinCode: '' })
  }

  const openAddBcpModal = (targetIds = [], sourceRowId = null) => {
    setAddBcpTargetIds(targetIds)
    setAddBcpSourceRowId(sourceRowId)
    setAddBcpApplyToSelected(true)
    setBcpSalutation('Mr.')
    setBcpFirstName('')
    setBcpLastName('')
    setBcpDesignation('')
    setBcpMobileLandline('')
    setBcpEmail('')
    setBcpAlternateEmail('')
    setBcpFax('')
    setBcpPincode('')
    setBcpBillingStreet('')
    setBcpCity('')
    setBcpState('')
    setBcpCountry('')
    setBcpGstApplicable('')
    setBcpStandardReason('')
    setBcpGstAdded(false)
    setBcpGstNumber('')
    setBcpEndDate('')
    setBcpGstValidated(false)
    setValidateGstModalOpen(false)
    setAddBcpValidationErrors({})
    setAddBcpModalOpen(true)
  }

  const handleAddBcpSave = () => {
    const errors = {}
    if (!String(bcpCity || '').trim()) errors.city = true
    if (!String(bcpState || '').trim()) errors.state = true
    if (!String(bcpCountry || '').trim()) errors.country = true
    if (!String(bcpGstApplicable || '').trim() && !(bcpGstAdded && bcpGstValidated)) errors.gstApplicable = true
    if (bcpGstAdded && !String(bcpGstNumber || '').trim()) errors.gstNumber = true
    setAddBcpValidationErrors(errors)
    if (Object.keys(errors).length > 0) return
    const name = [bcpSalutation, bcpFirstName, bcpLastName].filter(Boolean).join(' ').trim()
    if (!name) return
    setBillingContactOptions((prev) => (prev.includes(name) ? prev : [...prev, name]))
    const idsToApply = addBcpTargetIds.length >= 2
      ? (addBcpApplyToSelected
        ? addBcpTargetIds
        : [addBcpSourceRowId || addBcpTargetIds[0]].filter(Boolean))
      : addBcpTargetIds
    if (idsToApply.length > 0) {
      applyDraftToIds(idsToApply, 'billingContactPerson', { value: name })
      setUpdatedCellKeys((prev) => new Set([...prev, ...idsToApply.map((id) => cellKey(id, 'billingContactPerson'))]))
    }
    cancelInlineEdit()
    closeBulkEdit()
    setAddBcpModalOpen(false)
    setAddBcpTargetIds([])
    setAddBcpSourceRowId(null)
  }

  const openBillingDetailsModal = (row) => {
    setBillingDetailsModalRowId(row.id)
    setBillingDetailsValidationErrors({})
    setBillingModalForm({
      billingLegalEntity: String(getRowValue(row, 'billingLegalEntity') || ''),
      billingBillDetailsType: String(getRowValue(row, 'billingBillDetailsType') || ''),
      billingStore: String(getRowValue(row, 'billingStore') || ''),
      billingLevel: String(getRowValue(row, 'billingLevel') || ''),
      billingFrequency: String(getRowValue(row, 'billingFrequency') || ''),
      billingCreditPeriod: String(getRowValue(row, 'billingCreditPeriod') || ''),
      billingDispatchMethod: String(getRowValue(row, 'billingDispatchMethod') || ''),
      billingMode: String(getRowValue(row, 'billingMode') || ''),
      billingPaymentMethod: String(getRowValue(row, 'billingPaymentMethod') || ''),
    })
  }

  const openPoGroupModal = (row) => {
    setPoGroupModalRowId(row.id)
    setPoGroupValidationErrors({})
    setPoModalForm({
      poNumber: String(getRowValue(row, 'poNumber') || ''),
      poReceivedDate: String(getRowValue(row, 'poReceivedDate') || ''),
      poAmount: String(getRowValue(row, 'poAmount') || ''),
      poExpiryDate: String(getRowValue(row, 'poExpiryDate') || ''),
      poExpiryType: String(getRowValue(row, 'poExpiryType') || ''),
      poTerms: String(getRowValue(row, 'poTerms') || ''),
      poOeReceivedDate: String(getRowValue(row, 'poOeReceivedDate') || ''),
    })
  }

  const openInvoiceShippingModal = (row) => {
    const parsed = parseLocationForEdit(String(getRowValue(row, 'location') || ''))
    const details = String(getRowValue(row, 'invoiceShippingDetails') || '')
    setInvoiceShippingModalRowId(row.id)
    setInvoiceShippingForm({
      invoiceShippingDetails: details === 'New Invoice' ? 'New Invoice' : 'Same as BCP Address',
      invoiceShippingStreet: String(getRowValue(row, 'invoiceShippingStreet') || parsed.street || ''),
      invoiceShippingCity: String(getRowValue(row, 'invoiceShippingCity') || parsed.city || ''),
      invoiceShippingState: String(getRowValue(row, 'invoiceShippingState') || parsed.state || ''),
      invoiceShippingCountry: String(getRowValue(row, 'invoiceShippingCountry') || parsed.country || 'India'),
      invoiceShippingPincode: String(getRowValue(row, 'invoiceShippingPincode') || parsed.pinCode || ''),
    })
  }

  const handleLocationEditSaveAndMatchPremise = () => {
    if (!locationEditModalRowId) return
    const nextLocation = buildLocationFromEdit(locationEditForm)
    if (!nextLocation) return

    setCellEdits((prev) => ({
      ...prev,
      [locationEditModalRowId]: {
        ...(prev[locationEditModalRowId] || {}),
        location: nextLocation,
        premise: nextLocation,
      },
    }))
    setUpdatedCellKeys((prev) => {
      const next = new Set(prev)
      next.add(cellKey(locationEditModalRowId, 'location'))
      next.add(cellKey(locationEditModalRowId, 'premise'))
      return next
    })
    closeLocationEditModal()
  }

  const handleBillingDetailsModalSave = () => {
    if (!billingDetailsModalRowId) return
    const errors = {}
    if (!String(billingModalForm.billingLegalEntity || '').trim()) errors.billingLegalEntity = true
    if (!String(billingModalForm.billingStore || '').trim()) errors.billingStore = true
    if (!String(billingModalForm.billingLevel || '').trim()) errors.billingLevel = true
    if (!String(billingModalForm.billingFrequency || '').trim()) errors.billingFrequency = true
    if (!String(billingModalForm.billingCreditPeriod || '').trim()) errors.billingCreditPeriod = true
    if (!String(billingModalForm.billingDispatchMethod || '').trim()) errors.billingDispatchMethod = true
    if (!String(billingModalForm.billingMode || '').trim()) errors.billingMode = true
    if (!String(billingModalForm.billingPaymentMethod || '').trim()) errors.billingPaymentMethod = true
    setBillingDetailsValidationErrors(errors)
    if (Object.keys(errors).length > 0) return
    const ids = applyBillingDetailsToSelected && selectedIds.has(billingDetailsModalRowId) && selectedIds.size > 1
      ? Array.from(selectedIds)
      : [billingDetailsModalRowId]
    const updates = {
      billingDetails: billingModalForm.billingLevel,
      billingLegalEntity: billingModalForm.billingLegalEntity,
      billingBillDetailsType: billingModalForm.billingBillDetailsType,
      billingStore: billingModalForm.billingStore,
      billingLevel: billingModalForm.billingLevel,
      billingFrequency: billingModalForm.billingFrequency,
      billingCreditPeriod: billingModalForm.billingCreditPeriod,
      billingDispatchMethod: billingModalForm.billingDispatchMethod,
      billingMode: billingModalForm.billingMode,
      billingPaymentMethod: billingModalForm.billingPaymentMethod,
    }
    setCellEdits((prev) => {
      const next = { ...prev }
      ids.forEach((id) => { next[id] = { ...(next[id] || {}), ...updates } })
      return next
    })
    setUpdatedCellKeys((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => {
        Object.keys(updates).forEach((col) => next.add(cellKey(id, col)))
      })
      return next
    })
    setBillingDetailsModalRowId(null)
  }

  const handlePoGroupModalSave = () => {
    if (!poGroupModalRowId) return
    const errors = {}
    if (!String(poModalForm.poNumber || '').trim()) errors.poNumber = true
    if (!String(poModalForm.poReceivedDate || '').trim()) errors.poReceivedDate = true
    if (!String(poModalForm.poAmount || '').trim()) errors.poAmount = true
    if (!String(poModalForm.poExpiryDate || '').trim()) errors.poExpiryDate = true
    if (!String(poModalForm.poOeReceivedDate || '').trim()) errors.poOeReceivedDate = true
    setPoGroupValidationErrors(errors)
    if (Object.keys(errors).length > 0) return
    const ids = applyPoGroupToSelected && selectedIds.has(poGroupModalRowId) && selectedIds.size > 1
      ? Array.from(selectedIds)
      : [poGroupModalRowId]
    const updates = {
      poGroup: poModalForm.poNumber,
      poNumber: poModalForm.poNumber,
      poReceivedDate: poModalForm.poReceivedDate,
      poAmount: poModalForm.poAmount,
      poExpiryDate: poModalForm.poExpiryDate,
      poExpiryType: poModalForm.poExpiryType,
      poTerms: poModalForm.poTerms,
      poOeReceivedDate: poModalForm.poOeReceivedDate,
    }
    setCellEdits((prev) => {
      const next = { ...prev }
      ids.forEach((id) => { next[id] = { ...(next[id] || {}), ...updates } })
      return next
    })
    setUpdatedCellKeys((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => {
        Object.keys(updates).forEach((col) => next.add(cellKey(id, col)))
      })
      return next
    })
    setPoGroupModalRowId(null)
  }

  const handleInvoiceShippingModalSave = () => {
    if (!invoiceShippingModalRowId) return
    const ids = applyInvoiceShippingToSelected && selectedIds.has(invoiceShippingModalRowId) && selectedIds.size > 1
      ? Array.from(selectedIds)
      : [invoiceShippingModalRowId]
    const updates = invoiceShippingForm.invoiceShippingDetails === 'New Invoice'
      ? {
        invoiceShippingDetails: 'New Invoice',
        invoiceShippingStreet: invoiceShippingForm.invoiceShippingStreet,
        invoiceShippingCity: invoiceShippingForm.invoiceShippingCity,
        invoiceShippingState: invoiceShippingForm.invoiceShippingState,
        invoiceShippingCountry: invoiceShippingForm.invoiceShippingCountry,
        invoiceShippingPincode: invoiceShippingForm.invoiceShippingPincode,
      }
      : {
        invoiceShippingDetails: 'Same as BCP Address',
        invoiceShippingStreet: '',
        invoiceShippingCity: '',
        invoiceShippingState: '',
        invoiceShippingCountry: '',
        invoiceShippingPincode: '',
      }
    setCellEdits((prev) => {
      const next = { ...prev }
      ids.forEach((id) => { next[id] = { ...(next[id] || {}), ...updates } })
      return next
    })
    setUpdatedCellKeys((prev) => new Set([...prev, ...ids.map((id) => cellKey(id, 'invoiceShippingDetails'))]))
    setInvoiceShippingModalRowId(null)
  }

  const handleAddressMatchSubmit = () => {
    if (!addressMatchModalRowId || !selectedAddressCandidate) return
    const isAddressCorrectionModal = addressMatchModalContext === 'status'
    const confirmedCorrectionSite = addressCorrectionConfirmedSites[selectedAddressCandidate.id]
    if (isAddressCorrectionModal && (!confirmedCorrectionSite || confirmedCorrectionSite === selectedAddressCandidate.site)) {
      // For Address Correction, require explicit "Confirm Location" before applying to table cells.
      return
    }
    const selectedPinnedCoords = addressMatchPinnedCoords[selectedAddressCandidate.id]
    const selectedLat = Number(selectedAddressCandidate.lat)
    const selectedLng = Number(selectedAddressCandidate.lng)
    const latChanged = !!selectedPinnedCoords && Math.abs(Number(selectedPinnedCoords.lat) - selectedLat) > 0.000001
    const lngChanged = !!selectedPinnedCoords && Math.abs(Number(selectedPinnedCoords.lng) - selectedLng) > 0.000001
    const selectedDifferentCandidate = selectedAddressCandidate.rowId !== addressMatchModalRowId
    const nextLocation = isAddressCorrectionModal
      ? confirmedCorrectionSite
      : (selectedPinnedCoords
        ? `${selectedAddressCandidate.site} (Lat: ${Number(selectedPinnedCoords.lat).toFixed(6)}, Lng: ${Number(selectedPinnedCoords.lng).toFixed(6)})`
        : selectedAddressCandidate.site)
    const currentLocation = String(getRowValue(addressMatchRow || { id: addressMatchModalRowId }, 'location') || '').trim()
    const hasLocationChanged = selectedDifferentCandidate
      || latChanged
      || lngChanged
      || String(nextLocation || '').trim() !== currentLocation

    if (!hasLocationChanged) {
      closeAddressMatchModal()
      return
    }

    setCellEdits((prev) => ({
      ...prev,
      [addressMatchModalRowId]: {
        ...(prev[addressMatchModalRowId] || {}),
        location: nextLocation,
        premise: nextLocation,
        ...(isAddressCorrectionModal ? { addressStatus: 'Valid' } : {}),
      },
    }))
    setLocationReviewRowIds((prev) => {
      const next = new Set(prev)
      next.delete(addressMatchModalRowId)
      return next
    })
    setLocationUpdatedRowIds((prev) => new Set([...prev, addressMatchModalRowId]))
    setUpdatedCellKeys((prev) => {
      const next = new Set(prev)
      next.add(cellKey(addressMatchModalRowId, 'location'))
      next.add(cellKey(addressMatchModalRowId, 'premise'))
      if (isAddressCorrectionModal) {
        next.add(cellKey(addressMatchModalRowId, 'addressStatus'))
      }
      return next
    })
    if (isAddressCorrectionModal) {
      // Keep corrected row visible immediately after update (it may otherwise be hidden by Partial/Invalid filters).
      setFilterAddressStatus(FILTER_ALL)
      setDisplayMode(DISPLAY_ALL)
      setViewingSelectedOnly(false)
    } else if (displayMode === DISPLAY_REVIEW_ONLY) {
      setDisplayMode(DISPLAY_ALL)
    }
    closeAddressMatchModal()
  }

  useEffect(() => () => {
    clearTimeout(matchPrepTimerRef.current)
    clearTimeout(matchingTimerRef.current)
    clearTimeout(locationMatchPrepTimerRef.current)
    clearTimeout(locationMatchingTimerRef.current)
    clearTimeout(addressValidationPrepTimerRef.current)
    clearTimeout(addressValidationLoadingTimerRef.current)
    clearTimeout(feasibilityPrepTimerRef.current)
    clearTimeout(feasibilityLoadingTimerRef.current)
    clearTimeout(feasibilityQuoteStatusTimerRef.current)
  }, [])

  useEffect(() => {
    if (!showNonFeasibleSelectionError) return
    setShowNonFeasibleSelectionError(false)
  }, [selectedIds])

  useEffect(() => {
    if (!showNonFeasibleSelectionError) return
    nonFeasibleErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [showNonFeasibleSelectionError])

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {showAccountInfoHeader && (
        <div className="bg-screenshot-grey border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
          <div className="bg-screenshot-grey flex flex-wrap items-center gap-4 px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded flex items-center justify-center shrink-0 bg-emerald-600 text-white" aria-hidden="true">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-base text-gray-900">
                  <span className="block font-normal">Feasibility Request</span>
                  <span className="block font-bold">{feasibilityPageName}</span>
                </h1>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-10 px-5 py-4 bg-white">
            <div>
              <p className="text-xs text-gray-500 tracking-wide">Feasibility Request ID</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{feasibilityRequestId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 tracking-wide">Account</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{accountName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 tracking-wide">Opportunity ID</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">—</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 tracking-wide">Opportunity Name</p>
              {String(opportunityName || '').trim() ? (
                <a href="#" onClick={(e) => e.preventDefault()} className="mt-0.5 inline-block text-sm font-bold text-airtel-red hover:underline">
                  {opportunityName}
                </a>
              ) : (
                <p className="text-sm font-bold text-gray-900 mt-0.5">—</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 tracking-wide">Quote ID</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">—</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 tracking-wide">Quote Name</p>
              {String(quoteName || '').trim() ? (
                <a href="#" onClick={(e) => e.preventDefault()} className="mt-0.5 inline-block text-sm font-bold text-airtel-red hover:underline">
                  {quoteName}
                </a>
              ) : (
                <p className="text-sm font-bold text-gray-900 mt-0.5">—</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-screenshot-grey border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 bg-white border-b border-gray-200">
          <button
            type="button"
            className="px-1 py-3 text-xs font-semibold text-gray-600 border-b-2 border-transparent -mb-px"
          >
            Details
          </button>
          <button
            type="button"
            className="ml-5 px-1 py-3 text-xs font-semibold text-gray-600 border-b-2 border-transparent -mb-px"
          >
            Related
          </button>
          <button
            type="button"
            className="ml-5 px-1 py-3 text-xs font-semibold text-airtel-red border-b-2 border-airtel-red -mb-px"
            aria-current="page"
          >
            Extracted Information
          </button>
        </div>

        <>
        {showNonFeasibleSelectionError && (
          <div ref={nonFeasibleErrorRef} className="px-5 py-2 bg-white border-b border-gray-100">
            <div className="w-full bg-[#D81E1E] text-white px-3 py-2 text-xs font-medium flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0" aria-hidden="true">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 15z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>
                  The selected rows include non feasible records. Select only Feasible rows to go ahead and convert to Opportunity &amp; Quote.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNonFeasibleSelectionError(false)}
                className="text-white/90 hover:text-white"
                aria-label="Close error notification"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-white border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-700">Filter by</span>
            <div className="relative" ref={filterByRef}>
              <button
                type="button"
                onClick={() => setFilterByOpen((open) => !open)}
                className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 text-xs border rounded-md bg-white focus:outline-none min-w-[5rem] ${
                  filterByOpen
                    ? 'border-airtel-red/40 ring-1 ring-airtel-red/20'
                    : 'border-gray-300'
                }`}
                aria-label="Filter by"
                aria-expanded={filterByOpen}
              >
                <span>
                  {effectiveFilterState === FILTER_ALL
                  && effectiveFilterRequiredProduct === FILTER_ALL
                  && effectiveFilterMedia === FILTER_ALL
                  && effectiveFilterBandwidth === FILTER_ALL
                  && effectiveFilterMatchedProduct === FILTER_ALL
                  && effectiveFilterAddressStatus === FILTER_ALL
                  && effectiveFilterFeasibilityStatus === FILTER_ALL
                    ? FILTER_ALL
                    : 'Filtered'}
                </span>
                <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {filterByOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 w-[20rem] max-w-[90vw] p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs leading-none font-semibold text-gray-800 mb-1">State</label>
                      <select
                        value={effectiveFilterState}
                        onChange={(e) => { setFilterState(e.target.value) }}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/20 focus:border-airtel-red/40"
                        aria-label="Filter by State"
                      >
                        <option value={FILTER_ALL}>All States</option>
                        {stateOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs leading-none font-semibold text-gray-800 mb-1">Requested Products</label>
                      <select
                        value={effectiveFilterRequiredProduct}
                        onChange={(e) => { setFilterRequiredProduct(e.target.value) }}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/20 focus:border-airtel-red/40"
                        aria-label="Filter by Requested Products"
                      >
                        <option value={FILTER_ALL}>All Products</option>
                        {requiredProductOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs leading-none font-semibold text-gray-800 mb-1">Media</label>
                      <select
                        value={effectiveFilterMedia}
                        onChange={(e) => { setFilterMedia(e.target.value) }}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/20 focus:border-airtel-red/40"
                        aria-label="Filter by Media"
                      >
                        <option value={FILTER_ALL}>All Media</option>
                        {MEDIA_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs leading-none font-semibold text-gray-800 mb-1">Bandwidth</label>
                      <select
                        value={effectiveFilterBandwidth}
                        onChange={(e) => { setFilterBandwidth(e.target.value) }}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/20 focus:border-airtel-red/40"
                        aria-label="Filter by Bandwidth"
                      >
                        <option value={FILTER_ALL}>All Bandwidth</option>
                        {BANDWIDTH_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs leading-none font-semibold text-gray-800 mb-1">Matched Products</label>
                      <select
                        value={effectiveFilterMatchedProduct}
                        onChange={(e) => { setFilterMatchedProduct(e.target.value) }}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/20 focus:border-airtel-red/40"
                        aria-label="Filter by Matched Products"
                      >
                        <option value={FILTER_ALL}>All Products</option>
                        {matchedProductOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs leading-none font-semibold text-gray-800 mb-1">Address Status</label>
                      <select
                        value={effectiveFilterAddressStatus}
                        onChange={(e) => { setFilterAddressStatus(e.target.value) }}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/20 focus:border-airtel-red/40"
                        aria-label="Filter by Address Status"
                      >
                        <option value={FILTER_ALL}>All Statuses</option>
                        {addressStatusOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs leading-none font-semibold text-gray-800 mb-1">Feasibility Status</label>
                      <select
                        value={effectiveFilterFeasibilityStatus}
                        onChange={(e) => { setFilterFeasibilityStatus(e.target.value) }}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/20 focus:border-airtel-red/40"
                        aria-label="Filter by Feasibility Status"
                      >
                        <option value={FILTER_ALL}>All Statuses</option>
                        {feasibilityStatusOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-700 ml-2">Displaying</span>
            <div className="relative" ref={displayingRef}>
              <button
                type="button"
                onClick={() => setDisplayingOpen((open) => !open)}
                className={`inline-flex items-center justify-between gap-2 px-4 py-2 text-xs border rounded-lg bg-white min-w-[12rem] ${
                  displayingOpen
                    ? 'border-airtel-red/40 ring-1 ring-airtel-red/20'
                    : 'border-gray-300'
                }`}
                aria-label="Displaying options"
                aria-expanded={displayingOpen}
              >
                <span>{displayMode}</span>
                <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {displayingOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[12rem] py-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {[DISPLAY_ALL, DISPLAY_REVIEW_ONLY, DISPLAY_FEASIBLE_ONLY, DISPLAY_NON_FEASIBLE_ONLY].map((option) => {
                    const isFeasibilityOption = option === DISPLAY_FEASIBLE_ONLY || option === DISPLAY_NON_FEASIBLE_ONLY
                    const optionDisabled = isFeasibilityOption && !isFeasibilityCheckCompleted
                    return (
                    <button
                      key={option}
                      type="button"
                      disabled={optionDisabled}
                      onClick={() => {
                        if (optionDisabled) return
                        setDisplayMode(option)
                        setCurrentPage(1)
                        setDisplayingOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-xs ${
                        optionDisabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'hover:bg-grey-bg'
                      } ${
                        displayMode === option ? 'text-airtel-red font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                    )
                  })}
                </div>
              )}
            </div>
            {isLocationsPoVariant && (
              <>
              <span className="text-xs text-gray-700 ml-2">Display Columns</span>
              <div className="relative" ref={displayColumnsRef}>
                <button
                  type="button"
                  onClick={() => setDisplayColumnsOpen((open) => !open)}
                  className={`inline-flex items-center justify-between gap-2 px-4 py-2 text-xs border rounded-lg bg-white min-w-[12rem] ${
                    displayColumnsOpen
                      ? 'border-airtel-red/40 ring-1 ring-airtel-red/20'
                      : 'border-gray-300'
                  }`}
                  aria-label="Display Columns options"
                  aria-expanded={displayColumnsOpen}
                >
                  <span>{displayColumnsMode}</span>
                  <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              {displayColumnsOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[18rem] py-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {[DISPLAY_COLUMNS_ALL, DISPLAY_COLUMNS_LOCATIONS_PRODUCTS, DISPLAY_COLUMNS_PO_DETAILS].map((option) => {
                    const checked = displayColumnsMode === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setDisplayColumnsMode(option)
                          if (option === DISPLAY_COLUMNS_PO_DETAILS) {
                            setPoDetailsAllSelected(true)
                            setPoDetailColumnSelection(
                              PO_DETAIL_CHECKBOX_COLUMNS.reduce((acc, item) => ({ ...acc, [item.key]: false }), {})
                            )
                          }
                          setCurrentPage(1)
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-grey-bg"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-airtel-red border-airtel-red text-white' : 'border-gray-400 text-transparent'}`}>
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.75-3.75a1 1 0 111.414-1.414l3.043 3.043 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </span>
                          <span className={checked ? 'text-airtel-red font-semibold' : 'text-gray-700'}>{option}</span>
                        </span>
                      </button>
                    )
                  })}
                  {displayColumnsMode === DISPLAY_COLUMNS_PO_DETAILS && (
                    <div className="mt-1 border-t border-gray-100 pt-1 pb-1">
                      <label className="flex items-center gap-2 px-6 py-1.5 text-xs text-gray-700 hover:bg-grey-bg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAllPoDetailsSelected}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setPoDetailsAllSelected(checked)
                            if (checked) {
                              setPoDetailColumnSelection(
                                PO_DETAIL_CHECKBOX_COLUMNS.reduce((acc, item) => ({ ...acc, [item.key]: false }), {})
                              )
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                        />
                        <span>All</span>
                      </label>
                      {PO_DETAIL_CHECKBOX_COLUMNS.map((item) => (
                        <label key={item.key} className="flex items-center gap-2 px-6 py-1.5 text-xs text-gray-700 hover:bg-grey-bg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(poDetailColumnSelection[item.key])}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setPoDetailsAllSelected(false)
                              setPoDetailColumnSelection((prev) => ({ ...prev, [item.key]: checked }))
                            }}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search this list"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value) }}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-md w-44"
            />
            <button type="button" onClick={handleMatchLocationForPremises} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-airtel-red">Match All Locations for Premises</button>
            <button type="button" onClick={handleMatchAllProducts} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-airtel-red">Match All Products</button>
            <button type="button" onClick={handleValidateAddress} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-airtel-red">Validate Address</button>
            <button
              type="button"
              onClick={handleCheckForFeasibility}
              disabled={!isCheckFeasibilityEnabled}
              className={`px-4 py-1.5 rounded-md border text-xs font-medium ${
                isCheckFeasibilityEnabled
                  ? 'border-gray-300 bg-white text-airtel-red hover:bg-grey-bg'
                  : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            >
              Check for feasibility
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2 bg-white border-t border-gray-100 text-xs text-gray-600">
          <div className="flex flex-wrap items-center gap-x-1">
            Show {filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} records.
            {effectiveFilterState !== FILTER_ALL && <> Filter by State: {effectiveFilterState}.</>}
            {effectiveFilterRequiredProduct !== FILTER_ALL && <> Filter by Requested Product: {effectiveFilterRequiredProduct}.</>}
            {effectiveFilterMedia !== FILTER_ALL && <> Filter by Media: {effectiveFilterMedia}.</>}
            {effectiveFilterBandwidth !== FILTER_ALL && <> Filter by Bandwidth: {effectiveFilterBandwidth}.</>}
            {effectiveFilterMatchedProduct !== FILTER_ALL && <> Filter by Matched Product: {effectiveFilterMatchedProduct}.</>}
            {effectiveFilterAddressStatus !== FILTER_ALL && <> Filter by Address Status: {effectiveFilterAddressStatus}.</>}
            {effectiveFilterFeasibilityStatus !== FILTER_ALL && <> Filter by Feasibility Status: {effectiveFilterFeasibilityStatus}.</>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => selectedIds.size > 0 && setViewingSelectedOnly(true)} className={selectedIds.size > 0 ? 'text-airtel-red font-medium hover:underline' : 'text-gray-400 font-medium'}>View Selected ({selectedIds.size})</button>
            <span>•</span>
            <button type="button" onClick={handleShowAllRecords} className="text-airtel-red font-medium hover:underline">Show all records</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full w-max text-xs table-fixed">
            <colgroup>
              <col className="w-10" />
              {isColumnVisible('location') && <col style={getColStyle('location')} />}
              {isColumnVisible('premise') && <col style={getColStyle('premise')} />}
              {isColumnVisible('requestedProduct') && <col style={getColStyle('requestedProduct')} />}
              {isColumnVisible('matchedProduct') && <col style={getColStyle('matchedProduct')} />}
              {isColumnVisible('media') && <col style={getColStyle('media')} />}
              {isColumnVisible('feasibleMedia') && <col style={getColStyle('feasibleMedia')} />}
              {isColumnVisible('bandwidth') && <col style={getColStyle('bandwidth')} />}
              {isColumnVisible('arc') && <col style={getColStyle('arc')} />}
              {isColumnVisible('otc') && <col style={getColStyle('otc')} />}
              {isColumnVisible('addressStatus') && <col style={getColStyle('addressStatus')} />}
              {isColumnVisible('confidenceLevel') && <col style={getColStyle('confidenceLevel')} />}
              {isColumnVisible('feasibilityStatus') && <col style={getColStyle('feasibilityStatus')} />}
              {isColumnVisible('capex') && <col style={getColStyle('capex')} />}
              {isLocationsPoVariant && isColumnVisible('billingContactPerson') && <col style={getColStyle('billingContactPerson')} />}
              {isLocationsPoVariant && showBillingDetailsColumn && !billingDetailsExpandedEffective && <col style={getColStyle('billingDetails')} />}
              {isLocationsPoVariant && showBillingDetailsColumn && billingDetailsExpandedEffective && BILLING_SUB_COLUMNS.map((col) => (
                <col key={col.key} style={getColStyle(col.key)} />
              ))}
              {isLocationsPoVariant && showPoGroupColumn && !poGroupExpandedEffective && <col style={getColStyle('poGroup')} />}
              {isLocationsPoVariant && showPoGroupColumn && poGroupExpandedEffective && PO_SUB_COLUMNS.map((col) => (
                <col key={col.key} style={getColStyle(col.key)} />
              ))}
              {isLocationsPoVariant && isColumnVisible('invoiceShippingDetails') && <col style={getColStyle('invoiceShippingDetails')} />}
              {isLocationsPoVariant && isColumnVisible('gstApplicable') && <col style={getColStyle('gstApplicable')} />}
              <col className="w-10" />
            </colgroup>
            <thead className="bg-gray-50">
              <tr className="border-y border-gray-200">
                <th className="w-10 px-2 py-2 text-left" rowSpan={hasSecondaryHeaderRow ? 2 : 1}>
                  <input
                    type="checkbox"
                    checked={pagedRows.length > 0 && pagedRows.every((r) => selectedIds.has(r.id))}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds((prev) => new Set([...prev, ...pagedRows.map((r) => r.id)]))
                      else setSelectedIds((prev) => {
                        const next = new Set(prev)
                        pagedRows.forEach((r) => next.delete(r.id))
                        return next
                      })
                    }}
                  />
                </th>
                {isColumnVisible('location') && <th className="px-2 py-2 text-left group relative" style={getColStyle('location')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Location</span><ResizeHandle columnId="location" /></th>}
                {isColumnVisible('premise') && <th className="px-2 py-2 text-left group relative" style={getColStyle('premise')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Premise</span><ResizeHandle columnId="premise" /></th>}
                {isColumnVisible('requestedProduct') && <th className="px-2 py-2 text-left group relative" style={getColStyle('requestedProduct')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Requested Product</span><ResizeHandle columnId="requestedProduct" /></th>}
                {isColumnVisible('matchedProduct') && <th className="px-2 py-2 text-left group relative" style={getColStyle('matchedProduct')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Matched Product</span><ResizeHandle columnId="matchedProduct" /></th>}
                {isColumnVisible('media') && <th className="px-2 py-2 text-left group relative" style={getColStyle('media')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Requested Media</span><ResizeHandle columnId="media" /></th>}
                {isColumnVisible('feasibleMedia') && <th className="px-2 py-2 text-left group relative" style={getColStyle('feasibleMedia')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Feasible Media</span><ResizeHandle columnId="feasibleMedia" /></th>}
                {isColumnVisible('bandwidth') && <th className="px-2 py-2 text-left group relative" style={getColStyle('bandwidth')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Bandwidth</span><ResizeHandle columnId="bandwidth" /></th>}
                {isColumnVisible('arc') && <th className="px-2 py-2 text-left group relative" style={getColStyle('arc')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">ARC</span><ResizeHandle columnId="arc" /></th>}
                {isColumnVisible('otc') && <th className="px-2 py-2 text-left group relative" style={getColStyle('otc')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">OTC</span><ResizeHandle columnId="otc" /></th>}
                {isColumnVisible('addressStatus') && <th className="px-2 py-2 text-left group relative" style={getColStyle('addressStatus')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Address Status</span><ResizeHandle columnId="addressStatus" /></th>}
                {isColumnVisible('confidenceLevel') && <th className="px-2 py-2 text-left group relative" style={getColStyle('confidenceLevel')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Confidence Level</span><ResizeHandle columnId="confidenceLevel" /></th>}
                {isColumnVisible('feasibilityStatus') && <th className="px-2 py-2 text-left group relative" style={getColStyle('feasibilityStatus')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Feasibility Status</span><ResizeHandle columnId="feasibilityStatus" /></th>}
                {isColumnVisible('capex') && <th className="px-2 py-2 text-left group relative" style={getColStyle('capex')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}><span className="block truncate">Capex</span><ResizeHandle columnId="capex" /></th>}
                {isLocationsPoVariant && isColumnVisible('billingContactPerson') && (
                  <th className="px-2 py-2 text-left group relative" style={getColStyle('billingContactPerson')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}>
                    <span className="block truncate">Billing Contact Person</span>
                    <ResizeHandle columnId="billingContactPerson" />
                  </th>
                )}
                {isLocationsPoVariant && showBillingDetailsColumn && (
                  <th className="px-2 py-2 text-left group relative" style={getColStyle('billingDetails')} colSpan={billingDetailsExpandedEffective ? BILLING_SUB_COLUMNS.length : 1} rowSpan={billingDetailsExpandedEffective ? 1 : (hasSecondaryHeaderRow ? 2 : 1)}>
                    <button type="button" className="inline-flex items-center gap-1 hover:text-airtel-red" onClick={() => setBillingDetailsExpanded((v) => !v)}>
                      <span className="block truncate">Billing Details</span>
                      <svg className={`w-3 h-3 transition-transform ${billingDetailsExpandedEffective ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    <ResizeHandle columnId="billingDetails" />
                  </th>
                )}
                {isLocationsPoVariant && showPoGroupColumn && (
                  <th className="px-2 py-2 text-left group relative" style={getColStyle('poGroup')} colSpan={poGroupExpandedEffective ? PO_SUB_COLUMNS.length : 1} rowSpan={poGroupExpandedEffective ? 1 : (hasSecondaryHeaderRow ? 2 : 1)}>
                    <button type="button" className="inline-flex items-center gap-1 hover:text-airtel-red" onClick={() => setPoGroupExpanded((v) => !v)}>
                      <span className="block truncate">PO Group</span>
                      <svg className={`w-3 h-3 transition-transform ${poGroupExpandedEffective ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    <ResizeHandle columnId="poGroup" />
                  </th>
                )}
                {isLocationsPoVariant && isColumnVisible('invoiceShippingDetails') && (
                  <th className="px-2 py-2 text-left group relative" style={getColStyle('invoiceShippingDetails')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}>
                    <span className="block truncate">Invoice Shipping Details</span>
                    <ResizeHandle columnId="invoiceShippingDetails" />
                  </th>
                )}
                {isLocationsPoVariant && isColumnVisible('gstApplicable') && (
                  <th className="px-2 py-2 text-left group relative" style={getColStyle('gstApplicable')} rowSpan={hasSecondaryHeaderRow ? 2 : 1}>
                    <span className="block truncate">GST Applicable</span>
                    <ResizeHandle columnId="gstApplicable" />
                  </th>
                )}
                <th className="w-10 px-2 py-2 text-left" aria-label="Row actions" rowSpan={hasSecondaryHeaderRow ? 2 : 1} />
              </tr>
              {hasSecondaryHeaderRow && (
                <tr className="border-b border-gray-200">
                  {showBillingDetailsColumn && billingDetailsExpandedEffective && BILLING_SUB_COLUMNS.map((col) => (
                    <th key={col.key} className="px-2 py-1.5 text-left text-[11px] font-medium text-gray-700 group relative whitespace-nowrap" style={getColStyle(col.key)}>
                      <span className="block whitespace-nowrap">{col.label}</span>
                      <ResizeHandle columnId={col.key} />
                    </th>
                  ))}
                  {showPoGroupColumn && poGroupExpandedEffective && PO_SUB_COLUMNS.map((col) => (
                    <th key={col.key} className="px-2 py-1.5 text-left text-[11px] font-medium text-gray-700 group relative whitespace-nowrap" style={getColStyle(col.key)}>
                      <span className="block whitespace-nowrap">{col.label}</span>
                      <ResizeHandle columnId={col.key} />
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
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
                  {isColumnVisible('location') && (
                  <td className="px-2 py-2">
                    <span className="inline-flex items-center gap-1.5 flex-wrap group">
                      <span>{getRowValue(row, 'location')}</span>
                      {locationReviewRowIds.has(row.id) && (
                        <button
                          type="button"
                          onClick={() => openAddressMatchModal(row, 'review')}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-[#7A4900] bg-[#FFECC2] border border-[#F6C96A] hover:bg-[#ffe3ab] transition-colors"
                        >
                          Review
                        </button>
                      )}
                      {(locationUpdatedRowIds.has(row.id) || updatedCellKeys.has(cellKey(row.id, 'location'))) && UPDATED_BADGE}
                      <button
                        type="button"
                        onClick={() => openLocationEditModal(row)}
                        className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity"
                        aria-label="Edit location"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                      </button>
                    </span>
                  </td>
                  )}
                  {isColumnVisible('premise') && (
                  <td className="px-2 py-2 relative">
                    {editingCell?.rowId === row.id && editingCell?.column === 'premise' ? (
                      <div className="relative w-full min-w-[15rem]">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          value={inlineDraft.value ?? ''}
                          onFocus={() => setPremiseLookupOpen(true)}
                          onChange={(e) => { setInlineDraft({ value: e.target.value }); setPremiseLookupOpen(true) }}
                          onBlur={() => { setTimeout(() => saveInlineEdit(), 120) }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveInlineEdit()
                            if (e.key === 'Escape') cancelInlineEdit()
                          }}
                          placeholder="Search"
                          className="w-full min-w-[15rem] h-8 pl-8 pr-2.5 text-xs border border-blue-500 rounded"
                          autoFocus
                        />
                        {premiseLookupOpen && premiseLookupSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto">
                            {premiseLookupSuggestions.map((address) => (
                              <button
                                key={address}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  applyDraftToIds([row.id], 'premise', { value: address })
                                  setInlineDraft({ value: address })
                                  cancelInlineEdit()
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-grey-bg"
                              >
                                {address}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 flex-wrap group">
                        <span>
                          {(() => {
                            const premiseValue = String(getRowValue(row, 'premise') || '').trim()
                            if (premiseValue) return premiseValue
                            const shouldMirrorLocation =
                              updatedCellKeys.has(cellKey(row.id, 'premise'))
                              || locationUpdatedRowIds.has(row.id)
                            if (shouldMirrorLocation) {
                              return getRowValue(row, 'location') || EMPTY_CELL_PLACEHOLDER
                            }
                            return EMPTY_CELL_PLACEHOLDER
                          })()}
                        </span>
                        {updatedCellKeys.has(cellKey(row.id, 'premise')) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => openEdit(row, 'premise', e)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit premise">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </span>
                    )}
                  </td>
                  )}
                  {isColumnVisible('requestedProduct') && <td className="px-2 py-2">{row.requestedProduct}</td>}
                  {isColumnVisible('matchedProduct') && (
                  <td className="px-2 py-2 group">
                    {editingCell?.rowId === row.id && editingCell?.column === 'matchedProduct' ? (
                      <select
                        value={inlineDraft.value ?? ''}
                        onChange={(e) => {
                          const nextValue = e.target.value
                          setInlineDraft({ value: nextValue })
                          applyDraftToIds([row.id], 'matchedProduct', { value: nextValue })
                          setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'matchedProduct')]))
                          cancelInlineEdit()
                        }}
                        className="w-full min-w-[8rem] px-2 py-1 text-xs border border-blue-500 rounded"
                        autoFocus
                      >
                        <option value="">Select</option>
                        {editableMatchedProductOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        <span>{getRowValue(row, 'matchedProduct') || EMPTY_CELL_PLACEHOLDER}</span>
                        {(matchedUpdatedRowIds.has(row.id) || updatedCellKeys.has(cellKey(row.id, 'matchedProduct'))) && UPDATED_BADGE}
                        {String(getRowValue(row, 'matchedProduct') || '').trim() && (
                          <button
                            type="button"
                            onClick={(e) => openEdit(row, 'matchedProduct', e)}
                            className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity"
                            aria-label="Edit matched product"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                          </button>
                        )}
                      </span>
                    )}
                  </td>
                  )}
                  {isColumnVisible('media') && (
                  <td className="px-2 py-2">
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      <span>{getRowValue(row, 'media')}</span>
                      {updatedCellKeys.has(cellKey(row.id, 'media')) && UPDATED_BADGE}
                    </span>
                  </td>
                  )}
                  {isColumnVisible('feasibleMedia') && (
                  <td className="px-2 py-2 group">
                    {editingCell?.rowId === row.id && editingCell?.column === 'feasibleMedia' ? (
                      <select
                        value={inlineDraft.value ?? ''}
                        onChange={(e) => {
                          const nextValue = e.target.value
                          setInlineDraft({ value: nextValue })
                          applyDraftToIds([row.id], 'feasibleMedia', { value: nextValue })
                          setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'feasibleMedia')]))
                          cancelInlineEdit()
                        }}
                        className="w-full min-w-[8rem] px-2 py-1 text-xs border border-blue-500 rounded"
                        autoFocus
                      >
                        <option value="">Select</option>
                        {FEASIBLE_MEDIA_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        <span>{getRowValue(row, 'feasibleMedia') || EMPTY_CELL_PLACEHOLDER}</span>
                        {updatedCellKeys.has(cellKey(row.id, 'feasibleMedia')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => openEdit(row, 'feasibleMedia', e)}
                          className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity"
                          aria-label="Edit feasible media"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </span>
                    )}
                  </td>
                  )}
                  {isColumnVisible('bandwidth') && (
                  <td className="px-2 py-2 group">
                    {editingCell?.rowId === row.id && editingCell?.column === 'bandwidth' ? (
                      <select
                        value={inlineDraft.value ?? ''}
                        onChange={(e) => {
                          const nextValue = e.target.value
                          setInlineDraft({ value: nextValue })
                          applyDraftToIds([row.id], 'bandwidth', { value: nextValue })
                          setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'bandwidth')]))
                          cancelInlineEdit()
                        }}
                        className="w-full min-w-[7rem] px-2 py-1 text-xs border border-blue-500 rounded"
                        autoFocus
                      >
                        {BANDWIDTH_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        <span>{getRowValue(row, 'bandwidth')}</span>
                        {updatedCellKeys.has(cellKey(row.id, 'bandwidth')) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => openEdit(row, 'bandwidth', e)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit bandwidth">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </span>
                    )}
                  </td>
                  )}
                  {isColumnVisible('arc') && (
                  <td className="px-2 py-2 group">
                    {editingCell?.rowId === row.id && editingCell?.column === 'arc' ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={inlineDraft.value ?? ''}
                        onChange={(e) => {
                          const typedValue = sanitizeDigitsOnly(e.target.value)
                          setInlineDraft({ value: typedValue })
                          // Keep same inline input look/flow, but persist the typed value immediately.
                          applyDraftToIds([row.id], 'arc', { value: typedValue })
                          setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'arc')]))
                        }}
                        onBlur={(e) => {
                          const typedValue = sanitizeDigitsOnly(e.target.value)
                          applyDraftToIds([row.id], 'arc', { value: typedValue })
                          setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'arc')]))
                          cancelInlineEdit()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const typedValue = sanitizeDigitsOnly(e.currentTarget.value)
                            applyDraftToIds([row.id], 'arc', { value: typedValue })
                            setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'arc')]))
                            cancelInlineEdit()
                          }
                          if (e.key === 'Escape') cancelInlineEdit()
                        }}
                        className="w-24 px-2 py-1 text-xs border border-blue-500 rounded"
                        autoFocus
                      />
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span>{getRowValue(row, 'arc') === '' || getRowValue(row, 'arc') === null || getRowValue(row, 'arc') === undefined ? EMPTY_CELL_PLACEHOLDER : `₹${Number(getRowValue(row, 'arc')).toLocaleString('en-IN')}`}</span>
                        {updatedCellKeys.has(cellKey(row.id, 'arc')) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => openEdit(row, 'arc', e)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit ARC">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </span>
                    )}
                  </td>
                  )}
                  {isColumnVisible('otc') && (
                  <td className="px-2 py-2 group">
                    {editingCell?.rowId === row.id && editingCell?.column === 'otc' ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={inlineDraft.value ?? ''}
                        onChange={(e) => {
                          const typedValue = sanitizeDigitsOnly(e.target.value)
                          setInlineDraft({ value: typedValue })
                          // Keep same inline input look/flow, but persist the typed value immediately.
                          applyDraftToIds([row.id], 'otc', { value: typedValue })
                          setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'otc')]))
                        }}
                        onBlur={(e) => {
                          const typedValue = sanitizeDigitsOnly(e.target.value)
                          applyDraftToIds([row.id], 'otc', { value: typedValue })
                          setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'otc')]))
                          cancelInlineEdit()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const typedValue = sanitizeDigitsOnly(e.currentTarget.value)
                            applyDraftToIds([row.id], 'otc', { value: typedValue })
                            setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'otc')]))
                            cancelInlineEdit()
                          }
                          if (e.key === 'Escape') cancelInlineEdit()
                        }}
                        className="w-24 px-2 py-1 text-xs border border-blue-500 rounded"
                        autoFocus
                      />
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span>{getRowValue(row, 'otc') === '' || getRowValue(row, 'otc') === null || getRowValue(row, 'otc') === undefined ? EMPTY_CELL_PLACEHOLDER : `₹${Number(getRowValue(row, 'otc')).toLocaleString('en-IN')}`}</span>
                        {updatedCellKeys.has(cellKey(row.id, 'otc')) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => openEdit(row, 'otc', e)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit OTC">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </span>
                    )}
                  </td>
                  )}
                  {isColumnVisible('addressStatus') && (
                  <td className="px-2 py-2">
                    {(() => {
                      const addressStatus = String(getRowValue(row, 'addressStatus') || '').trim()
                      if (!addressStatus) return EMPTY_CELL_PLACEHOLDER
                      if (addressStatus === 'Invalid' || addressStatus === 'Partial') {
                        const badgeClass = addressStatus === 'Invalid'
                          ? 'inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-semibold border bg-[#E31B23] text-white border-[#E31B23]'
                          : 'inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-semibold border bg-[#F26A00] text-black border-[#F26A00]'
                        return (
                          <button
                            type="button"
                            onClick={() => openAddressMatchModal(row, 'status')}
                            className={badgeClass}
                            title="Open Address Correction"
                          >
                            {addressStatus}
                          </button>
                        )
                      }
                      return <StatusBadge type="address" value={addressStatus} />
                    })()}
                  </td>
                  )}
                  {isColumnVisible('confidenceLevel') && <td className="px-2 py-2">{getRowValue(row, 'confidenceLevel') || EMPTY_CELL_PLACEHOLDER}</td>}
                  {isColumnVisible('feasibilityStatus') && <td className="px-2 py-2"><StatusBadge type="feasibility" value={getRowValue(row, 'feasibilityStatus')} /></td>}
                  {isColumnVisible('capex') && (
                  <td className="px-2 py-2 group">
                    {editingCell?.rowId === row.id && editingCell?.column === 'capex' ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={inlineDraft.onNet ?? ''}
                          onChange={(e) => setInlineDraft((prev) => ({ ...prev, onNet: e.target.value }))}
                          className="w-20 px-1.5 py-0.5 text-xs border border-blue-500 rounded"
                          placeholder="OnNet"
                        />
                        <input
                          type="number"
                          value={inlineDraft.offNet ?? ''}
                          onChange={(e) => setInlineDraft((prev) => ({ ...prev, offNet: e.target.value }))}
                          className="w-20 px-1.5 py-0.5 text-xs border border-blue-500 rounded"
                          placeholder="Off-net"
                        />
                        <button type="button" onClick={saveInlineEdit} className="text-airtel-red text-xs font-semibold">Save</button>
                        <button type="button" onClick={cancelInlineEdit} className="text-gray-500 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        {(() => {
                          const onNet = getRowValue(row, 'capexOnNet')
                          const offNet = getRowValue(row, 'capexOffNet')
                          const hasOnNet = !(onNet === '' || onNet === null || onNet === undefined)
                          const hasOffNet = !(offNet === '' || offNet === null || offNet === undefined)
                          if (!hasOnNet && !hasOffNet) {
                            return <span>{EMPTY_CELL_PLACEHOLDER}</span>
                          }
                          return (
                            <span>
                              {`OnNet ${hasOnNet ? `₹${Number(onNet).toLocaleString('en-IN')}` : '—'} / Off-net ${hasOffNet ? `₹${Number(offNet).toLocaleString('en-IN')}` : '—'}`}
                            </span>
                          )
                        })()}
                        {updatedCellKeys.has(cellKey(row.id, 'capex')) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => openEdit(row, 'capex', e)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit capex">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </span>
                    )}
                  </td>
                  )}
                  {isLocationsPoVariant && isColumnVisible('billingContactPerson') && (
                    <td className="px-2 py-2 group">
                      {editingCell?.rowId === row.id && editingCell?.column === 'billingContactPerson' ? (
                        <div className="min-w-[12rem] border border-blue-500 rounded bg-white shadow-sm overflow-hidden">
                          {billingContactOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setInlineDraft({ value: opt })
                                applyDraftToIds([row.id], 'billingContactPerson', { value: opt })
                                setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'billingContactPerson')]))
                                cancelInlineEdit()
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-grey-bg"
                            >
                              {opt}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => openAddBcpModal([row.id], row.id)}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-airtel-red border-t border-gray-200 hover:bg-grey-bg"
                          >
                            + Add BCP
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span>{getRowValue(row, 'billingContactPerson') || EMPTY_CELL_PLACEHOLDER}</span>
                          {updatedCellKeys.has(cellKey(row.id, 'billingContactPerson')) && UPDATED_BADGE}
                          <button type="button" onClick={(e) => openEdit(row, 'billingContactPerson', e)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit billing contact person">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                          </button>
                        </span>
                      )}
                    </td>
                  )}
                  {isLocationsPoVariant && showBillingDetailsColumn && !billingDetailsExpandedEffective && (
                    <td className="px-2 py-2 group">
                      <div className="inline-flex items-center gap-1.5 cursor-pointer" onClick={() => openBillingDetailsModal(row)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openBillingDetailsModal(row) }}>
                        <span>{String(getRowValue(row, 'billingLevel') || getRowValue(row, 'billingDetails') || '').trim() || EMPTY_CELL_PLACEHOLDER}</span>
                        {updatedCellKeys.has(cellKey(row.id, 'billingDetails')) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => { e.stopPropagation(); openBillingDetailsModal(row) }} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit billing details">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </div>
                    </td>
                  )}
                  {isLocationsPoVariant && showBillingDetailsColumn && billingDetailsExpandedEffective && BILLING_SUB_COLUMNS.map((col) => (
                    <td key={`${row.id}-${col.key}`} className="px-2 py-2 group whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 cursor-pointer" onClick={() => openBillingDetailsModal(row)}>
                        <span>{getRowValue(row, col.key) || EMPTY_CELL_PLACEHOLDER}</span>
                        {updatedCellKeys.has(cellKey(row.id, col.key)) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => { e.stopPropagation(); openBillingDetailsModal(row) }} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label={`Edit ${col.label}`}>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </div>
                    </td>
                  ))}
                  {isLocationsPoVariant && showPoGroupColumn && !poGroupExpandedEffective && (
                    <td className="px-2 py-2 group">
                      <div className="inline-flex items-center gap-1.5 cursor-pointer" onClick={() => openPoGroupModal(row)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPoGroupModal(row) }}>
                        <span>{String(getRowValue(row, 'poNumber') || getRowValue(row, 'poGroup') || '').trim() || EMPTY_CELL_PLACEHOLDER}</span>
                        {updatedCellKeys.has(cellKey(row.id, 'poGroup')) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => { e.stopPropagation(); openPoGroupModal(row) }} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit PO group">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </div>
                    </td>
                  )}
                  {isLocationsPoVariant && showPoGroupColumn && poGroupExpandedEffective && PO_SUB_COLUMNS.map((col) => (
                    <td key={`${row.id}-${col.key}`} className="px-2 py-2 group whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 cursor-pointer" onClick={() => openPoGroupModal(row)}>
                        <span>{getRowValue(row, col.key) || EMPTY_CELL_PLACEHOLDER}</span>
                        {updatedCellKeys.has(cellKey(row.id, col.key)) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => { e.stopPropagation(); openPoGroupModal(row) }} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label={`Edit ${col.label}`}>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </div>
                    </td>
                  ))}
                  {isLocationsPoVariant && isColumnVisible('invoiceShippingDetails') && (
                    <td className="px-2 py-2 group">
                      <div className="inline-flex items-center gap-1.5 cursor-pointer" onClick={() => openInvoiceShippingModal(row)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openInvoiceShippingModal(row) }}>
                        <span>{getInvoiceShippingDisplayValue(row) || EMPTY_CELL_PLACEHOLDER}</span>
                        {updatedCellKeys.has(cellKey(row.id, 'invoiceShippingDetails')) && UPDATED_BADGE}
                        <button type="button" onClick={(e) => { e.stopPropagation(); openInvoiceShippingModal(row) }} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit invoice shipping details">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                        </button>
                      </div>
                    </td>
                  )}
                  {isLocationsPoVariant && isColumnVisible('gstApplicable') && (
                    <td className="px-2 py-2 group">
                      {editingCell?.rowId === row.id && editingCell?.column === 'gstApplicable' ? (
                        <select
                          value={inlineDraft.value ?? ''}
                          onChange={(e) => {
                            const nextValue = e.target.value
                            setInlineDraft({ value: nextValue })
                            applyDraftToIds([row.id], 'gstApplicable', { value: nextValue })
                            setUpdatedCellKeys((prev) => new Set([...prev, cellKey(row.id, 'gstApplicable')]))
                            cancelInlineEdit()
                          }}
                          className="w-full min-w-[8rem] px-2 py-1 text-xs border border-blue-500 rounded"
                          autoFocus
                        >
                          {GST_APPLICABLE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span>{getRowValue(row, 'gstApplicable') || EMPTY_CELL_PLACEHOLDER}</span>
                          {updatedCellKeys.has(cellKey(row.id, 'gstApplicable')) && UPDATED_BADGE}
                          <button type="button" onClick={(e) => openEdit(row, 'gstApplicable', e)} className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-airtel-red transition-opacity" aria-label="Edit GST applicable">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" /></svg>
                          </button>
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-2 py-2 relative">
                    <button
                      type="button"
                      onClick={() => setOpenRowMenuId((id) => (id === row.id ? null : row.id))}
                      className="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      aria-label="Row actions"
                      aria-expanded={openRowMenuId === row.id}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {openRowMenuId === row.id && (
                      <div className="absolute right-2 top-8 z-20 min-w-[7rem] bg-white border border-gray-200 rounded-md shadow-lg py-1">
                        <button
                          type="button"
                          onClick={() => setOpenRowMenuId(null)}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenRowMenuId(null)}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-4 px-4 py-3 bg-white border-t border-gray-200">
          <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded border border-gray-300 text-xs text-airtel-red disabled:opacity-50">Previous</button>
          <span className="text-xs text-gray-700">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded border border-gray-300 text-xs text-airtel-red disabled:opacity-50">Next</button>
        </div>
        </>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3">
        <button
          type="button"
          onClick={openCreateOpportunityModal}
          disabled={lockCreateActions || !isConvertToOpportunityEnabled}
          className={`px-4 py-2 rounded-md text-white text-xs font-medium ${
            !lockCreateActions && isConvertToOpportunityEnabled
              ? 'bg-airtel-red hover:bg-airtel-red/90'
              : 'bg-airtel-red/60 cursor-not-allowed'
          }`}
        >
          Create Opportunity
        </button>
        <button
          type="button"
          onClick={openCreateOpportunityQuoteModal}
          disabled={lockCreateActions || !isConvertToOpportunityEnabled}
          className={`px-4 py-2 rounded-md text-white text-xs font-medium ${
            !lockCreateActions && isConvertToOpportunityEnabled
              ? 'bg-airtel-red hover:bg-airtel-red/90'
              : 'bg-airtel-red/60 cursor-not-allowed'
          }`}
        >
          Create Opportunity & Quote
        </button>
        <button
          type="button"
          onClick={() => {
            if (showUpdateQuoteOnly || onFeasibilityQuoteStatusShown) {
              handleFeasibilityQuoteClick({ force: true })
              return
            }
            handleConvertAction('quote')
          }}
          disabled={lockUpdateAction || !isConvertToOpportunityEnabled}
          className={`px-4 py-2 rounded-md text-white text-xs font-medium ${
            !lockUpdateAction && isConvertToOpportunityEnabled
              ? 'bg-airtel-red hover:bg-airtel-red/90'
              : 'bg-airtel-red/60 cursor-not-allowed'
          }`}
        >
          Update Opportunity & Quote
        </button>
      </div>

      {createOpportunityModalOpen && createPortal(
        <div className="fixed inset-0 z-[96] bg-black/35 flex items-center justify-center p-6">
          <div className="w-[min(92vw,42rem)] max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl">
            <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center px-5 py-3 border-b border-gray-200">
              <span className="w-7 h-7" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900 text-center">Create Opportunity</h3>
              <button
                type="button"
                onClick={closeCreateOpportunityModal}
                className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Close create opportunity modal"
              >
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Feasibility Request ID</label>
                <input
                  type="text"
                  value={feasibilityRequestId}
                  readOnly
                  className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Opportunity name <span className="text-airtel-red">*</span></label>
                <input
                  type="text"
                  value={createOpportunityForm.opportunityName}
                  onChange={(e) => setCreateOpportunityForm((prev) => ({ ...prev, opportunityName: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                />
                {createOpportunityErrors.opportunityName && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityErrors.opportunityName}</p>}
              </div>

              <div>
                <label className="block text-xs text-gray-700 mb-1">BSG <span className="text-airtel-red">*</span></label>
                <input
                  type="text"
                  value={createOpportunityForm.bsg}
                  onChange={(e) => setCreateOpportunityForm((prev) => ({ ...prev, bsg: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                />
                {createOpportunityErrors.bsg && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityErrors.bsg}</p>}
              </div>

              <div>
                <label className="block text-xs text-gray-700 mb-1">KDM <span className="text-airtel-red">*</span></label>
                <input
                  type="text"
                  value={createOpportunityForm.kam}
                  onChange={(e) => setCreateOpportunityForm((prev) => ({ ...prev, kam: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                />
                {createOpportunityErrors.kam && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityErrors.kam}</p>}
              </div>

              <div>
                <label className="block text-xs text-gray-700 mb-1">Stage <span className="text-airtel-red">*</span></label>
                <select
                  value={createOpportunityForm.stage}
                  onChange={(e) => setCreateOpportunityForm((prev) => ({ ...prev, stage: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:border-airtel-red/50"
                >
                  <option value="Initial">Initial</option>
                  <option value="Qualification">Qualification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-700 mb-1">Opportunity Type <span className="text-airtel-red">*</span></label>
                <select
                  value={createOpportunityForm.opportunityType}
                  onChange={(e) => setCreateOpportunityForm((prev) => ({ ...prev, opportunityType: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:border-airtel-red/50"
                >
                  <option value="New">New</option>
                  <option value="Upsell">Upsell</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-700 mb-1">Opportunity Currency <span className="text-airtel-red">*</span></label>
                <select
                  value={createOpportunityForm.opportunityCurrency}
                  onChange={(e) => setCreateOpportunityForm((prev) => ({ ...prev, opportunityCurrency: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:border-airtel-red/50"
                >
                  <option value="Indian Rupee">Indian Rupee</option>
                  <option value="US Dollar">US Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-700 mb-1">Expected Close Date <span className="text-airtel-red">*</span></label>
                <input
                  type="date"
                  value={createOpportunityForm.expectedCloseDate}
                  onChange={(e) => setCreateOpportunityForm((prev) => ({ ...prev, expectedCloseDate: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-700 mb-1">Month Projection <span className="text-airtel-red">*</span></label>
                <select
                  value={createOpportunityForm.monthProjection}
                  onChange={(e) => setCreateOpportunityForm((prev) => ({ ...prev, monthProjection: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:border-airtel-red/50"
                >
                  <option value="Commitment">Commitment</option>
                  <option value="Pipeline">Pipeline</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-white">
              <button type="button" onClick={closeCreateOpportunityModal} className="px-4 py-1.5 text-xs rounded border border-gray-300 text-airtel-red bg-white">Cancel</button>
              <button type="button" onClick={handleCreateOpportunitySubmit} className="px-4 py-1.5 text-xs rounded bg-airtel-red text-white">Create</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {createOpportunityQuoteModalOpen && createPortal(
        <div className="fixed inset-0 z-[96] bg-black/35 flex items-center justify-center p-6">
          <div className="w-[min(92vw,42rem)] max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl">
            <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center px-5 py-3 border-b border-gray-200">
              <span className="w-7 h-7" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900 text-center">Create Opportunity & Quote</h3>
              <button
                type="button"
                onClick={closeCreateOpportunityQuoteModal}
                className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Close create opportunity and quote modal"
              >
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {createOpportunityQuoteStep === 1 ? (
                <>
                  <h4 className="text-xs font-semibold text-gray-800">Opportunity details</h4>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Feasibility Request ID</label>
                    <input
                      type="text"
                      value={feasibilityRequestId}
                      readOnly
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Opportunity name <span className="text-airtel-red">*</span></label>
                    <input
                      type="text"
                      value={createOpportunityQuoteForm.opportunityName}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, opportunityName: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                    />
                    {createOpportunityQuoteErrors.opportunityName && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.opportunityName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">BSG <span className="text-airtel-red">*</span></label>
                    <input
                      type="text"
                      value={createOpportunityQuoteForm.bsg}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, bsg: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                    />
                    {createOpportunityQuoteErrors.bsg && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.bsg}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">KDM <span className="text-airtel-red">*</span></label>
                    <input
                      type="text"
                      value={createOpportunityQuoteForm.kam}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, kam: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                    />
                    {createOpportunityQuoteErrors.kam && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.kam}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Stage <span className="text-airtel-red">*</span></label>
                    <select
                      value={createOpportunityQuoteForm.stage}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, stage: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:border-airtel-red/50"
                    >
                      <option value="Initial">Initial</option>
                      <option value="Qualification">Qualification</option>
                    </select>
                    {createOpportunityQuoteErrors.stage && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.stage}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Opportunity Type <span className="text-airtel-red">*</span></label>
                    <select
                      value={createOpportunityQuoteForm.opportunityType}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, opportunityType: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:border-airtel-red/50"
                    >
                      <option value="New">New</option>
                      <option value="Upsell">Upsell</option>
                    </select>
                    {createOpportunityQuoteErrors.opportunityType && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.opportunityType}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Opportunity Currency <span className="text-airtel-red">*</span></label>
                    <select
                      value={createOpportunityQuoteForm.opportunityCurrency}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, opportunityCurrency: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:border-airtel-red/50"
                    >
                      <option value="Indian Rupee">Indian Rupee</option>
                      <option value="US Dollar">US Dollar</option>
                    </select>
                    {createOpportunityQuoteErrors.opportunityCurrency && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.opportunityCurrency}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Expected Close Date <span className="text-airtel-red">*</span></label>
                    <input
                      type="date"
                      value={createOpportunityQuoteForm.expectedCloseDate}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, expectedCloseDate: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                    />
                    {createOpportunityQuoteErrors.expectedCloseDate && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.expectedCloseDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Month Projection <span className="text-airtel-red">*</span></label>
                    <select
                      value={createOpportunityQuoteForm.monthProjection}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, monthProjection: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:border-airtel-red/50"
                    >
                      <option value="Commitment">Commitment</option>
                      <option value="Pipeline">Pipeline</option>
                    </select>
                    {createOpportunityQuoteErrors.monthProjection && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.monthProjection}</p>}
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-xs font-semibold text-gray-800">Quote details</h4>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Quote Name <span className="text-airtel-red">*</span></label>
                    <input
                      type="text"
                      value={createOpportunityQuoteForm.quoteName}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, quoteName: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                    />
                    {createOpportunityQuoteErrors.quoteName && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.quoteName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Quote Contact <span className="text-airtel-red">*</span></label>
                    <input
                      type="text"
                      value={createOpportunityQuoteForm.quoteContact}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, quoteContact: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                    />
                    {createOpportunityQuoteErrors.quoteContact && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.quoteContact}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">NBA <span className="text-airtel-red">*</span></label>
                    <input
                      type="text"
                      value={createOpportunityQuoteForm.nba}
                      onChange={(e) => setCreateOpportunityQuoteForm((prev) => ({ ...prev, nba: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-airtel-red/50"
                    />
                    {createOpportunityQuoteErrors.nba && <p className="mt-1 text-[11px] text-airtel-red">{createOpportunityQuoteErrors.nba}</p>}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-start">
                {createOpportunityQuoteStep === 1 ? (
                  <button type="button" onClick={closeCreateOpportunityQuoteModal} className="px-4 py-1.5 text-xs rounded border border-gray-300 text-airtel-red bg-white">Cancel</button>
                ) : (
                  <button type="button" onClick={handleCreateOpportunityQuotePrevious} className="px-4 py-1.5 text-xs rounded border border-gray-300 text-airtel-red bg-white">Previous</button>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 min-w-[26rem]">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${createOpportunityQuoteStep >= 1 ? 'border-airtel-red bg-airtel-red text-white' : 'border-gray-300 bg-white text-gray-400'}`}>
                  {createOpportunityQuoteStep > 1 ? (
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className={`h-0.5 w-48 ${createOpportunityQuoteStep > 1 ? 'bg-airtel-red' : 'bg-gray-300'}`} />
                <span className={`w-4 h-4 rounded-full border-2 ${createOpportunityQuoteStep > 1 ? 'border-airtel-red bg-airtel-red' : 'border-gray-300 bg-white'}`} />
              </div>

              <div className="flex items-center justify-end">
                {createOpportunityQuoteStep === 1 ? (
                  <button type="button" onClick={handleCreateOpportunityQuoteNext} className="px-4 py-1.5 text-xs rounded bg-airtel-red text-white">Next</button>
                ) : (
                  <button type="button" onClick={handleCreateOpportunityQuoteSubmit} className="px-4 py-1.5 text-xs rounded bg-airtel-red text-white">Create</button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {billingDetailsModalRow && createPortal(
        <div className="fixed inset-0 z-[96] bg-black/40 flex items-center justify-center p-6" onClick={() => setBillingDetailsModalRowId(null)}>
          <div className="w-[min(92vw,42rem)] max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center px-5 py-3 border-b border-gray-200">
              <span className="w-7 h-7" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900 text-center">Billing Details</h3>
              <button type="button" onClick={() => setBillingDetailsModalRowId(null)} className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100" aria-label="Close billing details modal">
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-3 text-xs">
              {BILLING_SUB_COLUMNS.map((col) => (
                <div key={col.key} className={col.key === 'billingPaymentMethod' ? 'col-span-2' : ''}>
                  <label className="block text-gray-700 mb-1">{col.label}</label>
                  <input
                    type="text"
                    value={billingModalForm[col.key] || ''}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      setBillingModalForm((prev) => ({ ...prev, [col.key]: nextValue }))
                      setBillingDetailsValidationErrors((prev) => ({ ...prev, [col.key]: false }))
                    }}
                    className={`w-full h-9 px-3 text-xs border rounded-md ${billingDetailsValidationErrors[col.key] ? 'border-airtel-red' : 'border-gray-300'}`}
                  />
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 bg-white">
              {selectedIds.size > 1 && selectedIds.has(billingDetailsModalRowId) && (
                <label className="inline-flex items-center gap-2 text-xs text-gray-700 mb-3">
                  <input type="checkbox" checked={applyBillingDetailsToSelected} onChange={(e) => setApplyBillingDetailsToSelected(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-airtel-red" />
                  Apply to selected ({selectedIds.size})
                </label>
              )}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setBillingDetailsModalRowId(null)} className="px-4 py-1.5 text-xs rounded border border-gray-300 text-airtel-red bg-white">Cancel</button>
                <button type="button" onClick={handleBillingDetailsModalSave} className="px-4 py-1.5 text-xs rounded bg-airtel-red text-white">Save</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {poGroupModalRow && createPortal(
        <div className="fixed inset-0 z-[96] bg-black/40 flex items-center justify-center p-6" onClick={() => setPoGroupModalRowId(null)}>
          <div className="w-[min(92vw,42rem)] max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center px-5 py-3 border-b border-gray-200">
              <span className="w-7 h-7" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900 text-center">PO Group</h3>
              <button type="button" onClick={() => setPoGroupModalRowId(null)} className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100" aria-label="Close PO group modal">
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-3 text-xs">
              {PO_SUB_COLUMNS.map((col) => (
                <div key={col.key}>
                  <label className="block text-gray-700 mb-1">{col.label}</label>
                  <input
                    type="text"
                    value={poModalForm[col.key] || ''}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      setPoModalForm((prev) => ({ ...prev, [col.key]: nextValue }))
                      setPoGroupValidationErrors((prev) => ({ ...prev, [col.key]: false }))
                    }}
                    className={`w-full h-9 px-3 text-xs border rounded-md ${poGroupValidationErrors[col.key] ? 'border-airtel-red' : 'border-gray-300'}`}
                  />
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 bg-white">
              {selectedIds.size > 1 && selectedIds.has(poGroupModalRowId) && (
                <label className="inline-flex items-center gap-2 text-xs text-gray-700 mb-3">
                  <input type="checkbox" checked={applyPoGroupToSelected} onChange={(e) => setApplyPoGroupToSelected(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-airtel-red" />
                  Apply to selected ({selectedIds.size})
                </label>
              )}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setPoGroupModalRowId(null)} className="px-4 py-1.5 text-xs rounded border border-gray-300 text-airtel-red bg-white">Cancel</button>
                <button type="button" onClick={handlePoGroupModalSave} className="px-4 py-1.5 text-xs rounded bg-airtel-red text-white">Save</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {invoiceShippingModalRow && createPortal(
        <div className="fixed inset-0 z-[96] bg-black/40 flex items-center justify-center p-6" onClick={() => setInvoiceShippingModalRowId(null)}>
          <div className="w-[min(92vw,36rem)] max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center px-5 py-3 border-b border-gray-200">
              <span className="w-7 h-7" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900 text-center">Invoice Shipping Details</h3>
              <button type="button" onClick={() => setInvoiceShippingModalRowId(null)} className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100" aria-label="Close invoice shipping modal">
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 text-xs">
              {INVOICE_SHIPPING_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="invoice-shipping-option"
                    checked={invoiceShippingForm.invoiceShippingDetails === option.value}
                    onChange={() => setInvoiceShippingForm((prev) => ({ ...prev, invoiceShippingDetails: option.value }))}
                    className="w-3.5 h-3.5 rounded-full border-gray-300 text-airtel-red"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
              {invoiceShippingForm.invoiceShippingDetails === 'New Invoice' && (
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <input type="text" placeholder="Street" value={invoiceShippingForm.invoiceShippingStreet} onChange={(e) => setInvoiceShippingForm((prev) => ({ ...prev, invoiceShippingStreet: e.target.value }))} className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md" />
                  <input type="text" placeholder="City" value={invoiceShippingForm.invoiceShippingCity} onChange={(e) => setInvoiceShippingForm((prev) => ({ ...prev, invoiceShippingCity: e.target.value }))} className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md" />
                  <input type="text" placeholder="State" value={invoiceShippingForm.invoiceShippingState} onChange={(e) => setInvoiceShippingForm((prev) => ({ ...prev, invoiceShippingState: e.target.value }))} className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md" />
                  <input type="text" placeholder="Country" value={invoiceShippingForm.invoiceShippingCountry} onChange={(e) => setInvoiceShippingForm((prev) => ({ ...prev, invoiceShippingCountry: e.target.value }))} className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md" />
                  <input type="text" placeholder="Pin Code" value={invoiceShippingForm.invoiceShippingPincode} onChange={(e) => setInvoiceShippingForm((prev) => ({ ...prev, invoiceShippingPincode: e.target.value }))} className="w-full h-9 px-3 text-xs border border-gray-300 rounded-md" />
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 bg-white">
              {selectedIds.size > 1 && selectedIds.has(invoiceShippingModalRowId) && (
                <label className="inline-flex items-center gap-2 text-xs text-gray-700 mb-3">
                  <input type="checkbox" checked={applyInvoiceShippingToSelected} onChange={(e) => setApplyInvoiceShippingToSelected(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-airtel-red" />
                  Apply to selected ({selectedIds.size})
                </label>
              )}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setInvoiceShippingModalRowId(null)} className="px-4 py-1.5 text-xs rounded border border-gray-300 text-airtel-red bg-white">Cancel</button>
                <button type="button" onClick={handleInvoiceShippingModalSave} className="px-4 py-1.5 text-xs rounded bg-airtel-red text-white">Save</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {addBcpModalOpen && createPortal(
        <div className="fixed inset-0 z-[96] bg-black/40 flex items-center justify-center p-6" onClick={() => setAddBcpModalOpen(false)}>
          <div className="w-[min(96vw,72rem)] max-h-[90vh] overflow-auto bg-white border border-gray-200 rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center px-5 py-3 border-b border-gray-200">
              <span className="w-7 h-7" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900 text-center">Add Billing Contact Person</h3>
              <button type="button" onClick={() => setAddBcpModalOpen(false)} className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100" aria-label="Close add BCP modal">
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="px-5 py-4 grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-gray-700 mb-1">Salutation <span className="text-airtel-red">*</span></label>
                <select value={bcpSalutation} onChange={(e) => setBcpSalutation(e.target.value)} className="w-full h-9 px-2.5 border border-gray-300 rounded-md">
                  {BCP_SALUTATIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">First Name <span className="text-airtel-red">*</span></label>
                <input type="text" value={bcpFirstName} onChange={(e) => setBcpFirstName(e.target.value)} placeholder="First Name" className="w-full h-9 px-2.5 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Last Name <span className="text-airtel-red">*</span></label>
                <input type="text" value={bcpLastName} onChange={(e) => setBcpLastName(e.target.value)} placeholder="Last Name" className="w-full h-9 px-2.5 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Designation <span className="text-airtel-red">*</span></label>
                <input type="text" value={bcpDesignation} onChange={(e) => setBcpDesignation(e.target.value)} placeholder="Designation" className="w-full h-9 px-2.5 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Mobile/Landline <span className="text-airtel-red">*</span></label>
                <input type="text" value={bcpMobileLandline} onChange={(e) => setBcpMobileLandline(e.target.value)} placeholder="Mobile/Landline" className="w-full h-9 px-2.5 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Email <span className="text-airtel-red">*</span></label>
                <input type="email" value={bcpEmail} onChange={(e) => setBcpEmail(e.target.value)} placeholder="Email" className="w-full h-9 px-2.5 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Alternate Email</label>
                <input type="email" value={bcpAlternateEmail} onChange={(e) => setBcpAlternateEmail(e.target.value)} placeholder="Alternate Email" className="w-full h-9 px-2.5 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Fax</label>
                <input type="text" value={bcpFax} onChange={(e) => setBcpFax(e.target.value)} placeholder="Fax" className="w-full h-9 px-2.5 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Pin code <span className="text-airtel-red">*</span></label>
                <input
                  type="text"
                  value={bcpPincode}
                  onChange={(e) => {
                    const v = e.target.value
                    setBcpPincode(v)
                    if (v === '452002') { setBcpCity('Indore'); setBcpState('Madhya Pradesh'); setBcpCountry('India') }
                    if (v === '110001') { setBcpCity('New Delhi'); setBcpState('Delhi'); setBcpCountry('India') }
                  }}
                  placeholder="e.g. 452002 - Indore"
                  className="w-full h-9 px-2.5 border border-gray-300 rounded-md"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-gray-700 mb-1">Billing Street <span className="text-airtel-red">*</span></label>
                <input type="text" value={bcpBillingStreet} onChange={(e) => setBcpBillingStreet(e.target.value)} placeholder="Billing Street" className="w-full h-9 px-2.5 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">City <span className="text-airtel-red">*</span></label>
                <input type="text" value={bcpCity} onChange={(e) => { setBcpCity(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, city: false })) }} placeholder="City" className={`w-full h-9 px-2.5 border rounded-md ${addBcpValidationErrors.city ? 'border-airtel-red' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">State <span className="text-airtel-red">*</span></label>
                <input type="text" value={bcpState} onChange={(e) => { setBcpState(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, state: false })) }} placeholder="State" className={`w-full h-9 px-2.5 border rounded-md ${addBcpValidationErrors.state ? 'border-airtel-red' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Country <span className="text-airtel-red">*</span></label>
                <input type="text" value={bcpCountry} onChange={(e) => { setBcpCountry(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, country: false })) }} placeholder="e.g. India" className={`w-full h-9 px-2.5 border rounded-md ${addBcpValidationErrors.country ? 'border-airtel-red' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">GST Applicable <span className="text-airtel-red">*</span></label>
                <input type="text" value={bcpGstApplicable} onChange={(e) => { setBcpGstApplicable(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, gstApplicable: false })) }} placeholder="GST Applicable" className={`w-full h-9 px-2.5 border rounded-md ${addBcpValidationErrors.gstApplicable ? 'border-airtel-red' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Standard Reason</label>
                <select value={bcpStandardReason} onChange={(e) => setBcpStandardReason(e.target.value)} className="w-full h-9 px-2.5 border border-gray-300 rounded-md">
                  <option value="">Select...</option>
                  {BCP_STANDARD_REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setBcpGstAdded(true)}
                  disabled={bcpGstAdded}
                  className="px-3 py-1.5 rounded bg-airtel-red text-white text-xs font-medium disabled:opacity-50"
                >
                  Add GST
                </button>
              </div>
              {bcpGstAdded && (
                <>
                  <div className="col-span-3 border-t border-gray-200 my-1 pt-3" />
                  <div>
                    <label className="block text-gray-700 mb-1">GST Number <span className="text-airtel-red">*</span></label>
                    <input type="text" value={bcpGstNumber} onChange={(e) => { setBcpGstNumber(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, gstNumber: false })) }} placeholder="GST Number" className={`w-full h-9 px-2.5 border rounded-md ${addBcpValidationErrors.gstNumber ? 'border-airtel-red' : 'border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">End Date</label>
                    <input type="date" value={bcpEndDate} onChange={(e) => setBcpEndDate(e.target.value)} className="w-full h-9 px-2.5 border border-gray-300 rounded-md" />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setValidateGstModalOpen(true)}
                      disabled={bcpGstValidated}
                      className="px-3 py-1.5 rounded bg-airtel-red text-white text-xs font-medium disabled:opacity-50"
                    >
                      Validate GST
                    </button>
                  </div>
                  {bcpGstValidated && (
                    <div className="col-span-3 text-xs text-green-600">GST number {bcpGstNumber || ''} is validated</div>
                  )}
                </>
              )}
            </div>
            {addBcpTargetIds.length >= 2 && (
              <div className="px-5 py-2 border-t border-gray-100">
                <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                  <input type="checkbox" checked={addBcpApplyToSelected} onChange={(e) => setAddBcpApplyToSelected(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-airtel-red" />
                  Update Selected ({addBcpTargetIds.length}) items
                </label>
              </div>
            )}
            <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-2">
              <button type="button" onClick={() => setAddBcpModalOpen(false)} className="px-4 py-1.5 text-xs rounded border border-gray-300 text-airtel-red bg-white">Cancel</button>
              <button type="button" onClick={handleAddBcpSave} className="px-4 py-1.5 text-xs rounded bg-airtel-red text-white">Save</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {validateGstModalOpen && createPortal(
        <div className="fixed inset-0 z-[97] flex items-center justify-center p-4 bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setValidateGstModalOpen(false) }}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <span className="w-8 shrink-0" aria-hidden="true" />
              <h3 className="flex-1 text-base font-bold text-[#032d60] text-center">Validate GST</h3>
              <button type="button" onClick={() => setValidateGstModalOpen(false)} className="w-8 h-8 shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Close">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <p className="px-5 py-4 text-sm text-gray-700 leading-relaxed">
              Are you sure you want to proceed with GST number - {bcpGstNumber || '(number)'}?
            </p>
            <div className="border-t border-gray-200 px-5 py-4 flex justify-end gap-2">
              <button type="button" onClick={() => setValidateGstModalOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700">Previous</button>
              <button
                type="button"
                onClick={() => {
                  setValidateGstModalOpen(false)
                  setBcpGstValidated(true)
                  setAddBcpValidationErrors((prev) => ({ ...prev, gstApplicable: false }))
                }}
                className="px-4 py-2 text-sm rounded-lg bg-airtel-red text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {addressMatchRow && createPortal(
        <div className="fixed inset-0 z-[95] bg-black/35 flex items-center justify-center p-6">
          {(() => {
            const isAddressCorrectionModal = addressMatchModalContext === 'status'
            return (
          <div className="w-[min(94vw,72rem)] max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl">
            <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center px-5 py-3 border-b border-gray-200">
              <span className="w-7 h-7" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900 text-center">
                {addressMatchModalContext === 'status' ? 'Address Correction' : 'Address Fuzzy Match'}
              </h3>
              <button
                type="button"
                onClick={closeAddressMatchModal}
                className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Close address match modal"
              >
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="overflow-hidden border border-gray-200 rounded-md">
                <table className="w-full text-xs table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-14 px-3 py-2 text-left font-semibold text-gray-700">Select</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Site</th>
                      <th className="w-28 px-3 py-2 text-left font-semibold text-gray-700">Latitude</th>
                      <th className="w-32 px-3 py-2 text-left font-semibold text-gray-700">Longitude</th>
                      <th className="w-28 px-3 py-2 text-left font-semibold text-gray-700">Confidence Level (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addressMatchCandidates.map((candidate) => {
                      const isSelected = addressMatchSelectedCandidateId === candidate.id
                      const confirmedSite = getAddressCorrectionDisplaySite(candidate)
                      const previewSite = getAddressCorrectionPreviewSite(candidate)
                      const pinnedCoords = addressMatchPinnedCoords[candidate.id]
                      const hasMovedMap = !!pinnedCoords
                      const canConfirmLocation = hasMovedMap && previewSite !== confirmedSite
                      return (
                        <Fragment key={candidate.id}>
                          <tr className="border-b border-gray-100">
                            <td className="px-3 py-2">
                              <input
                                type={isAddressCorrectionModal ? 'checkbox' : 'radio'}
                                name={isAddressCorrectionModal ? undefined : 'address-fuzzy-match-candidate'}
                                checked={isSelected}
                                onChange={() => setAddressMatchSelectedCandidateId(candidate.id)}
                              />
                            </td>
                            <td className="px-3 py-2 truncate" title={confirmedSite}>{confirmedSite}</td>
                            <td className="px-3 py-2">{(addressMatchPinnedCoords[candidate.id]?.lat ?? Number(candidate.lat)).toFixed(6)}</td>
                            <td className="px-3 py-2">{(addressMatchPinnedCoords[candidate.id]?.lng ?? Number(candidate.lng)).toFixed(6)}</td>
                            <td className="px-3 py-2 font-medium text-gray-800">{candidate.confidenceLevel}%</td>
                          </tr>
                          {isAddressCorrectionModal && isSelected && (
                            <tr className="border-b border-gray-100">
                              <td colSpan={5} className="px-0 py-0">
                                <div className="border-y border-gray-200 bg-white">
                                  <div className="flex items-center gap-1 px-2 py-2 bg-white border-b border-gray-200">
                                    {MAP_MODE_OPTIONS.map((mode) => (
                                      <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setAddressMapMode(mode)}
                                        className={`px-3 py-1 text-xs rounded-md border ${
                                          addressMapMode === mode
                                            ? 'bg-white border-gray-300 font-semibold text-gray-800'
                                            : 'bg-gray-50 border-gray-200 text-gray-600'
                                        }`}
                                      >
                                        {mode}
                                      </button>
                                    ))}
                                    <input
                                      type="text"
                                      value={addressMapSearch}
                                      onChange={(e) => setAddressMapSearch(e.target.value)}
                                      placeholder="Please enter address"
                                      className="ml-2 h-8 px-2.5 w-[20rem] max-w-[60%] text-xs border border-gray-300 rounded-md"
                                    />
                                  </div>
                                  <div className="h-44 bg-[#eef3ff]">
                                    <AddressPickerMap
                                      mapMode={addressMapMode}
                                      center={selectedAddressCandidateCoords}
                                      onPick={({ lat, lng }) => {
                                        setAddressMatchPinnedCoords((prev) => ({
                                          ...prev,
                                          [candidate.id]: { lat, lng },
                                        }))
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-white">
                                    <p className="text-xs text-gray-800 truncate max-w-[55%]">
                                      {previewSite || addressMatchRow.location}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAddressMatchPinnedCoords((prev) => {
                                            const next = { ...prev }
                                            delete next[candidate.id]
                                            return next
                                          })
                                        }}
                                        className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-700 bg-white"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!canConfirmLocation}
                                        onClick={() => {
                                          if (!canConfirmLocation) return
                                          setAddressCorrectionConfirmedSites((prev) => ({
                                            ...prev,
                                            [candidate.id]: previewSite,
                                          }))
                                        }}
                                        className={`px-3 py-1.5 text-xs rounded border ${
                                          canConfirmLocation
                                            ? 'bg-airtel-red text-white border-airtel-red hover:bg-airtel-red/90'
                                            : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                        }`}
                                      >
                                        Confirm Location
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-white">
              <button type="button" onClick={closeAddressMatchModal} className="px-4 py-1.5 text-xs rounded border border-gray-300 text-airtel-red bg-white">Cancel</button>
              <button type="button" onClick={handleAddressMatchSubmit} className="px-4 py-1.5 text-xs rounded bg-airtel-red text-white">
                {isAddressCorrectionModal ? 'Update & Match Premise' : 'Save & Match Premise'}
              </button>
            </div>
          </div>
            )
          })()}
        </div>,
        document.body
      )}

      {locationEditRow && createPortal(
        <div className="fixed inset-0 z-[95] bg-black/35 flex items-center justify-center p-6">
          <div className="w-[min(92vw,50rem)] max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl">
            <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center px-5 py-3 border-b border-gray-200">
              <span className="w-7 h-7" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900 text-center">Edit Location</h3>
              <button
                type="button"
                onClick={closeLocationEditModal}
                className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Close edit location modal"
              >
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-[11px] text-[#2d3f67] mb-1.5">Street</label>
                <input
                  type="text"
                  value={locationEditForm.street}
                  onChange={(e) => setLocationEditForm((prev) => ({ ...prev, street: e.target.value }))}
                  className="w-full h-11 px-3.5 text-[11px] border border-[#d6deeb] rounded-md focus:outline-none focus:border-[#88a0d0]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#2d3f67] mb-1.5">City</label>
                <input
                  type="text"
                  value={locationEditForm.city}
                  onChange={(e) => setLocationEditForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full h-11 px-3.5 text-[11px] border border-[#d6deeb] rounded-md focus:outline-none focus:border-[#88a0d0]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#2d3f67] mb-1.5">State</label>
                <input
                  type="text"
                  value={locationEditForm.state}
                  onChange={(e) => setLocationEditForm((prev) => ({ ...prev, state: e.target.value }))}
                  className="w-full h-11 px-3.5 text-[11px] border border-[#d6deeb] rounded-md focus:outline-none focus:border-[#88a0d0]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#2d3f67] mb-1.5">Country</label>
                <input
                  type="text"
                  value={locationEditForm.country}
                  onChange={(e) => setLocationEditForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="w-full h-11 px-3.5 text-[11px] border border-[#d6deeb] rounded-md focus:outline-none focus:border-[#88a0d0]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#2d3f67] mb-1.5">Pin Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={locationEditForm.pinCode}
                  onChange={(e) => setLocationEditForm((prev) => ({ ...prev, pinCode: sanitizeDigitsOnly(e.target.value) }))}
                  className="w-full h-11 px-3.5 text-[11px] border border-[#d6deeb] rounded-md focus:outline-none focus:border-[#88a0d0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-white">
              <button
                type="button"
                onClick={closeLocationEditModal}
                className="px-4 py-1.5 text-xs rounded border border-gray-300 text-airtel-red bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLocationEditSaveAndMatchPremise}
                className="px-4 py-1.5 text-xs rounded bg-airtel-red text-white"
              >
                Save and Match Premise
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {matchNotificationVisible && (
        <div className="fixed top-16 right-6 z-[90] w-[22rem] max-w-[92vw] bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-200">
            <p className="text-xs font-semibold text-[#101828]">Notifications</p>
            <div className="flex items-center gap-2.5">
              <button type="button" className="text-xs font-medium text-airtel-red">Mark all as read</button>
              <button type="button" aria-label="Close notifications" className="text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="px-3.5 py-3">
            <button
              type="button"
              onClick={handleMatchNotificationLinkClick}
              className="text-left text-airtel-red hover:text-airtel-red/90"
            >
              <span className="text-xs leading-snug font-semibold">
                Matched Products for Extracted information for feasibility
              </span>
            </button>
            <p className="mt-1.5 text-xs text-[#4A5874]">15 seconds ago</p>
          </div>
        </div>
      )}
      {locationMatchNotificationVisible && (
        <div className="fixed top-16 right-6 z-[90] w-[22rem] max-w-[92vw] bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-200">
            <p className="text-xs font-semibold text-[#101828]">Notifications</p>
            <div className="flex items-center gap-2.5">
              <button type="button" className="text-xs font-medium text-airtel-red">Mark all as read</button>
              <button type="button" aria-label="Close notifications" className="text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="px-3.5 py-3">
            <button
              type="button"
              onClick={handleLocationMatchNotificationLinkClick}
              className="text-left text-airtel-red hover:text-airtel-red/90"
            >
              <span className="text-xs leading-snug font-semibold">
                Matched Location for Premises for Extracted information for feasibility
              </span>
            </button>
            <p className="mt-1.5 text-xs text-[#4A5874]">15 seconds ago</p>
          </div>
        </div>
      )}
      {addressValidationNotificationVisible && (
        <div className="fixed top-16 right-6 z-[90] w-[22rem] max-w-[92vw] bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-200">
            <p className="text-xs font-semibold text-[#101828]">Notifications</p>
            <div className="flex items-center gap-2.5">
              <button type="button" className="text-xs font-medium text-airtel-red">Mark all as read</button>
              <button type="button" aria-label="Close notifications" className="text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="px-3.5 py-3">
            <button
              type="button"
              onClick={handleAddressValidationNotificationLinkClick}
              className="text-left text-airtel-red hover:text-airtel-red/90"
            >
              <span className="text-xs leading-snug font-semibold">
                Addresses Validated for Extracted information for feasibility
              </span>
            </button>
            <p className="mt-1.5 text-xs text-[#4A5874]">15 seconds ago</p>
          </div>
        </div>
      )}
      {feasibilityNotificationVisible && (
        <div className="fixed top-16 right-6 z-[90] w-[22rem] max-w-[92vw] bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-200">
            <p className="text-xs font-semibold text-[#101828]">Notifications</p>
            <div className="flex items-center gap-2.5">
              <button type="button" className="text-xs font-medium text-airtel-red">Mark all as read</button>
              <button type="button" aria-label="Close notifications" className="text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="px-3.5 py-3">
            <button
              type="button"
              onClick={handleFeasibilityNotificationLinkClick}
              className="text-left text-airtel-red hover:text-airtel-red/90"
            >
              <span className="text-xs leading-snug font-semibold">
                Checked Feasibility for Extracted information for feasibility
              </span>
            </button>
            <p className="mt-1.5 text-xs text-[#4A5874]">15 seconds ago</p>
          </div>
        </div>
      )}
      {createOpportunityNotificationVisible && (
        <div className="fixed top-16 right-6 z-[90] w-[22rem] max-w-[92vw] bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-200">
            <p className="text-xs font-semibold text-[#101828]">Notifications</p>
            <div className="flex items-center gap-2.5">
              <button type="button" className="text-xs font-medium text-airtel-red">Mark all as read</button>
              <button type="button" onClick={() => setCreateOpportunityNotificationVisible(false)} aria-label="Close notifications" className="text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="px-3.5 py-3">
            <button
              type="button"
              onClick={handleCreateOpportunityNotificationLinkClick}
              className="text-left text-airtel-red hover:text-airtel-red/90"
            >
              <span className="text-xs leading-snug font-semibold">
                {`New Opportunity creaqted for ${accountName}`}
              </span>
            </button>
            <p className="mt-1.5 text-xs text-[#4A5874]">5 seconds ago</p>
          </div>
        </div>
      )}

      {(matchPrepOverlayVisible || externalLocationMatchOverlayVisible) && (
        <div className={`${CONTENT_OVERLAY_CLASS} z-[70] bg-white/80`} aria-live="polite" />
      )}
      {locationMatchPrepOverlayVisible && (
        <div className={`${CONTENT_OVERLAY_CLASS} z-[70] bg-white/80`} aria-live="polite" />
      )}
      {addressValidationPrepOverlayVisible && (
        <div className={`${CONTENT_OVERLAY_CLASS} z-[70] bg-white/80`} aria-live="polite" />
      )}
      {feasibilityPrepOverlayVisible && (
        <div className={`${CONTENT_OVERLAY_CLASS} z-[70] bg-white/80`} aria-live="polite" />
      )}
      {feasibilityQuoteOverlayVisible && (
        <div className={`${CONTENT_OVERLAY_CLASS} z-[70] bg-white/80`} aria-live="polite" />
      )}
      {matchingOverlayVisible && (
        <div className={`${CONTENT_OVERLAY_CLASS} z-[80] bg-white/85 flex flex-col items-center justify-center gap-3`} aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">Matching Products in progress...</p>
        </div>
      )}
      {locationMatchingOverlayVisible && (
        <div className={`${CONTENT_OVERLAY_CLASS} z-[80] bg-white/85 flex flex-col items-center justify-center gap-3`} aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">Matching All Locations for Premises in progress...</p>
        </div>
      )}
      {addressValidationLoadingVisible && (
        <div className={`${CONTENT_OVERLAY_CLASS} z-[80] bg-white/85 flex flex-col items-center justify-center gap-3`} aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">Address Validation in progress...</p>
        </div>
      )}
      {feasibilityLoadingVisible && (
        <div className={`${CONTENT_OVERLAY_CLASS} z-[80] bg-white/85 flex flex-col items-center justify-center gap-3`} aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">Checking Feasibility in progress...</p>
        </div>
      )}

      {bulkEditPopover && createPortal(
        <div
          ref={bulkPopoverRef}
          className="fixed z-50 w-[20rem] bg-white border border-gray-200 rounded-xl shadow-2xl p-4"
          style={{ top: `${bulkEditPopover.top}px`, left: `${bulkEditPopover.left}px` }}
          role="dialog"
          aria-modal="false"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h3 className="text-xs font-semibold text-gray-900 mb-2">Update {bulkEditPopover.column.toUpperCase()}</h3>
          {bulkEditPopover.column === 'media' && (
            <select
              value={bulkEditDraft.value ?? ''}
              onChange={(e) => setBulkEditDraft({ value: e.target.value })}
              className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
            >
              {MEDIA_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          {bulkEditPopover.column === 'bandwidth' && (
            <select
              value={bulkEditDraft.value ?? ''}
              onChange={(e) => setBulkEditDraft({ value: e.target.value })}
              className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
            >
              {BANDWIDTH_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          {bulkEditPopover.column === 'billingContactPerson' && (
            <div className="space-y-2">
              <select
                value={bulkEditDraft.value ?? ''}
                onChange={(e) => setBulkEditDraft({ value: e.target.value })}
                className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
              >
                {billingContactOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <button
                type="button"
                onClick={() => {
                  const targetIds = applyBulkToSelected && selectedIds.size > 1 ? Array.from(selectedIds) : [bulkEditPopover.rowId]
                  openAddBcpModal(targetIds, bulkEditPopover.rowId)
                }}
                className="text-xs text-airtel-red underline"
              >
                + Add BCP
              </button>
            </div>
          )}
          {bulkEditPopover.column === 'gstApplicable' && (
            <select
              value={bulkEditDraft.value ?? ''}
              onChange={(e) => setBulkEditDraft({ value: e.target.value })}
              className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
            >
              {GST_APPLICABLE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          {bulkEditPopover.column === 'matchedProduct' && (
            <select
              value={bulkEditDraft.value ?? ''}
              onChange={(e) => setBulkEditDraft({ value: e.target.value })}
              className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
            >
              <option value="">Select</option>
              {editableMatchedProductOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          {(bulkEditPopover.column === 'arc' || bulkEditPopover.column === 'otc') && (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={bulkEditDraft.value ?? ''}
              onChange={(e) => setBulkEditDraft({ value: sanitizeDigitsOnly(e.target.value) })}
              className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
            />
          )}
          {(bulkEditPopover.column === 'location' || bulkEditPopover.column === 'premise') && (
            <input
              type="text"
              value={bulkEditDraft.value ?? ''}
              onChange={(e) => setBulkEditDraft({ value: e.target.value })}
              className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
            />
          )}
          {(
            bulkEditPopover.column === 'billingDetails'
            || bulkEditPopover.column === 'poGroup'
            || bulkEditPopover.column === 'invoiceShippingDetails'
            || BILLING_SUB_COLUMNS.some((col) => col.key === bulkEditPopover.column)
            || PO_SUB_COLUMNS.some((col) => col.key === bulkEditPopover.column)
          ) && (
            <input
              type="text"
              value={bulkEditDraft.value ?? ''}
              onChange={(e) => setBulkEditDraft({ value: e.target.value })}
              className="w-full px-3 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
            />
          )}
          {bulkEditPopover.column === 'capex' && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={bulkEditDraft.onNet ?? ''}
                onChange={(e) => setBulkEditDraft((prev) => ({ ...prev, onNet: e.target.value }))}
                placeholder="OnNet"
                className="w-full px-2 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
              />
              <input
                type="number"
                value={bulkEditDraft.offNet ?? ''}
                onChange={(e) => setBulkEditDraft((prev) => ({ ...prev, offNet: e.target.value }))}
                placeholder="Off-net"
                className="w-full px-2 py-2 text-xs border-2 border-blue-500 rounded-xl outline-none"
              />
            </div>
          )}
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={applyBulkToSelected}
              onChange={(e) => setApplyBulkToSelected(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-airtel-red"
            />
            Update {selectedIds.size} selected items
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={closeBulkEdit} className="px-4 py-2 text-xs border border-gray-300 rounded-xl bg-white text-airtel-red">Cancel</button>
            <button type="button" onClick={saveBulkEdit} className="px-4 py-2 text-xs rounded-xl bg-airtel-red text-white">Save</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

