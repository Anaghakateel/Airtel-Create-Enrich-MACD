import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useResizableColumns } from '../hooks/useResizableColumns'

// 50 streets/roads/areas across India (used to build 2500 unique locations)
const INDIAN_STREETS = [
  'MG Road', 'Park Street', 'Anna Salai', 'Linking Road', 'Brigade Road', 'FC Road', 'Connaught Place',
  'Jubilee Hills', 'Marine Drive', 'Commercial Street', 'T Nagar', 'Hauz Khas', 'Banjara Hills',
  'Indiranagar', 'Koramangala', 'Salt Lake', 'Andheri West', 'Adyar', 'Sector 17', 'Ballygunge',
  'Whitefield', 'Powai', 'Velachery', 'Karol Bagh', 'Gachibowli', 'Jayanagar', 'Salt Lake Sector V',
  'Bandra West', 'Nungambakkam', 'Saket', 'Madhapur', 'HSR Layout', 'New Town', 'OMR', 'Dwarka',
  'Kukatpally', 'Electronic City', 'Lajpat Nagar', 'Rajouri Garden', 'Nehru Place', 'Connaught Circus',
  'BTM Layout', 'Marathahalli', 'Silk Board', 'Hebbal', 'Malleshwaram', 'Shivaji Nagar', 'Gandhi Bazaar',
  'Jayanagar 4th Block', 'JP Nagar',
]

// 50 city–state pairs across India (different parts of the country)
const INDIAN_CITY_STATE = [
  { city: 'Bengaluru', state: 'Karnataka' }, { city: 'Kolkata', state: 'West Bengal' }, { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Mumbai', state: 'Maharashtra' }, { city: 'Pune', state: 'Maharashtra' }, { city: 'Hyderabad', state: 'Telangana' },
  { city: 'New Delhi', state: 'Delhi' }, { city: 'Chandigarh', state: 'Punjab' }, { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' }, { city: 'Lucknow', state: 'Uttar Pradesh' }, { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Indore', state: 'Madhya Pradesh' }, { city: 'Coimbatore', state: 'Tamil Nadu' }, { city: 'Kochi', state: 'Kerala' },
  { city: 'Thiruvananthapuram', state: 'Kerala' }, { city: 'Nagpur', state: 'Maharashtra' }, { city: 'Surat', state: 'Gujarat' },
  { city: 'Vadodara', state: 'Gujarat' }, { city: 'Ludhiana', state: 'Punjab' }, { city: 'Kanpur', state: 'Uttar Pradesh' },
  { city: 'Allahabad', state: 'Uttar Pradesh' }, { city: 'Varanasi', state: 'Uttar Pradesh' }, { city: 'Patna', state: 'Bihar' },
  { city: 'Ranchi', state: 'Jharkhand' }, { city: 'Bhubaneswar', state: 'Odisha' }, { city: 'Guwahati', state: 'Assam' },
  { city: 'Shillong', state: 'Meghalaya' }, { city: 'Imphal', state: 'Manipur' }, { city: 'Aizawl', state: 'Mizoram' },
  { city: 'Kohima', state: 'Nagaland' }, { city: 'Gangtok', state: 'Sikkim' }, { city: 'Shimla', state: 'Himachal Pradesh' },
  { city: 'Dehradun', state: 'Uttarakhand' }, { city: 'Srinagar', state: 'Jammu and Kashmir' }, { city: 'Jammu', state: 'Jammu and Kashmir' },
  { city: 'Raipur', state: 'Chhattisgarh' }, { city: 'Jabalpur', state: 'Madhya Pradesh' }, { city: 'Gwalior', state: 'Madhya Pradesh' },
  { city: 'Mysuru', state: 'Karnataka' }, { city: 'Mangaluru', state: 'Karnataka' }, { city: 'Vijayawada', state: 'Andhra Pradesh' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' }, { city: 'Tiruchirappalli', state: 'Tamil Nadu' }, { city: 'Madurai', state: 'Tamil Nadu' },
  { city: 'Kozhikode', state: 'Kerala' }, { city: 'Thrissur', state: 'Kerala' }, { city: 'Nashik', state: 'Maharashtra' },
  { city: 'Aurangabad', state: 'Maharashtra' }, { city: 'Rajkot', state: 'Gujarat' }, { city: 'Jodhpur', state: 'Rajasthan' },
  { city: 'Udaipur', state: 'Rajasthan' }, { city: 'Amritsar', state: 'Punjab' }, { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh' },
]

// 2500 unique locations: each a different part of India (street + city + state). Format: "number, Street, City, State, India"
function buildUniqueAddresses() {
  const out = []
  for (let i = 0; i < 2500; i++) {
    const street = INDIAN_STREETS[i % INDIAN_STREETS.length]
    const { city, state } = INDIAN_CITY_STATE[Math.floor(i / INDIAN_STREETS.length) % INDIAN_CITY_STATE.length]
    const num = (i % 500) + 1
    out.push(`${num}, ${street}, ${city}, ${state}, India`)
  }
  return out
}
const UNIQUE_LOCATION_ADDRESSES = buildUniqueAddresses()

// Matched products are the three standardized types: SD WAN, MPLS, Internet (and their specific offerings).
// Requested products are customer wording from enterprise quote requests; they map to one of these three categories.
const MATCHED_PRODUCT_CATEGORIES = ['SD WAN', 'MPLS', 'Internet']

const REQUESTED_PRODUCT_TO_CATEGORY = {
  'SD WAN': 'SD WAN', SDWAN: 'SD WAN', 'Software-defined WAN': 'SD WAN', 'WAN': 'SD WAN', 'SD-WAN': 'SD WAN',
  MPLS: 'MPLS', 'MPLS VPN': 'MPLS', 'Private line': 'MPLS', 'Layer 2': 'MPLS', 'Layer 3': 'MPLS',
  Internet: 'Internet', 'Leased line': 'Internet', Broadband: 'Internet', 'Dedicated Internet': 'Internet', 'Internet Leased Line': 'Internet', Connectivity: 'Internet',
}
const REQUESTED_PRODUCT_TERMS = Object.keys(REQUESTED_PRODUCT_TO_CATEGORY)
const REQUESTED_PRODUCTS = REQUESTED_PRODUCT_TERMS

function getCategoryForRequestedProduct(term) {
  if (!term) return MATCHED_PRODUCT_CATEGORIES[0]
  const category = REQUESTED_PRODUCT_TO_CATEGORY[term]
  return category ?? MATCHED_PRODUCT_CATEGORIES[0]
}

/** Parse intent text for product/category filter. Returns array of categories e.g. ['SD WAN'], or [] if none found (then badge shows on all rows). */
function parseProductFilterFromIntent(intentText) {
  if (!intentText || typeof intentText !== 'string') return []
  const t = intentText.toLowerCase().trim()
  const categories = []
  if (/\b(?:all\s+)?(?:sd\s*[-]?\s*wan|sdwan)\b/.test(t)) categories.push('SD WAN')
  if (/\b(?:all\s+)?mpls\b/.test(t)) categories.push('MPLS')
  if (/\b(?:all\s+)?internet\b/.test(t)) categories.push('Internet')
  return categories
}

/** Parse intent text for "from X to Y" attribute change. Returns { fromValue, toValue } or null. */
function parseAttributeChangeFromIntent(intentText) {
  if (!intentText || typeof intentText !== 'string') return null
  const m = intentText.match(/\bfrom\s+(.+?)\s+to\s+(.+?)(?:\s*[.。]|$)/is)
  if (!m) return null
  const fromValue = m[1].replace(/^["']|["']$/g, '').trim()
  const toValue = m[2].replace(/^["']|["']$/g, '').trim()
  if (!fromValue || !toValue) return null
  return { fromValue, toValue }
}

const CONFIDENCE_LEVEL_OPTIONS = [
  { value: 'below30', label: 'Below 30%', min: 0, max: 29 },
  { value: '30-50', label: '30-50%', min: 30, max: 49 },
  { value: '50-70', label: '50-70%', min: 50, max: 69 },
  { value: '70-85', label: '70-85%', min: 70, max: 85 },
  { value: 'above85', label: 'Above 85%', min: 86, max: 100 },
]

const OTHER_FIELDS = {
  postalCodes: ['110021', '600070', '110045', '110078', '110023', '600090', '110015', '600056', '110034', '600067', '400001', '500032', '560001', '700001', '600001'],
  statuses: ['Done', 'Partial', 'Pending'],
  technology: ['Copper', 'Fiber'],
}

// Matched product is always one of the three categories based on requested product
const MATCHED_PRODUCTS_OPTIONS = {
  'SD WAN': ['SD WAN'],
  Internet: ['Internet'],
  MPLS: ['MPLS'],
}
const MATCHING_STATUSES = ['Done', 'Partial', 'Pending']

const UNMATCHED_ERROR_REASONS = [
  'Product not available',
  'Confidence below threshold',
  'Invalid product combination',
  'Technology not available at location',
  'Postal code out of service area',
]

// When user edits Matched Products: Partial → Done or Pending; Pending → Partial or Done; Done → Partial or Pending
function getNextMatchingStatus(currentStatus) {
  const transitions = {
    Done: ['Partial', 'Pending'],
    Partial: ['Done', 'Pending'],
    Pending: ['Partial', 'Done'],
  }
  const options = transitions[currentStatus] || MATCHING_STATUSES
  return options[Math.floor(Math.random() * options.length)]
}

// Confidence level range by matching status (used to update Confidence Level column when Matching Status is set)
// Done = highest, Partial = medium, Pending = lowest
function getConfidenceLevelForMatchingStatus(status) {
  switch (status) {
    case 'Done':
      return 70 + Math.floor(Math.random() * 31)   // 70–100%
    case 'Partial':
      return 40 + Math.floor(Math.random() * 30)   // 40–69%
    case 'Pending':
      return Math.floor(Math.random() * 40)        // 0–39%
    default:
      return 40 + Math.floor(Math.random() * 59)   // fallback 40–98%
  }
}

// Product-specific attributes and values (per user spec)
const PRODUCT_ATTRIBUTES = {
  Internet: {
    Bandwidth: ['10 Mbps', '50 Mbps', '100 Mbps', '150 Mbps', '200 Mbps', '1 Gbps'],
    Media: ['Fiber Optics', 'FTTH', 'Copper'],
  },
  MPLS: {
    Bandwidth: ['2 Mbps', '10 Mbps', '50 Mbps', '100 Mbps', '1 Gbps'],
    Media: ['Fiber', 'Ethernet', 'ATM', 'Frame Relay', 'Transport over IP'],
    'Circuit Type': ['Layer 2 (VPLS)', 'Layer 3 (IP VPN)'],
  },
  'SD WAN': {
    'Service Type': ['Managed SD-WAN', 'Co-Managed', 'DIY'],
    'SDWAN Deployment Type': ['On-Premises', 'Cloud-Based', 'Hybrid'],
    'SDWAN Controller Platform': ['Cisco Meraki (MX Series)', 'Cisco Viptela', 'Airtel Cloud Dashboard'],
  },
}

// Actual product-style asset names for the Asset Name column (not just category labels)
const ASSET_NAMES = {
  'SD WAN': ['SD-WAN Managed Service', 'Software-Defined WAN', 'SD-WAN Hybrid', 'Airtel SD-WAN Connect', 'Enterprise SD-WAN'],
  MPLS: ['MPLS VPN', 'Private Line MPLS', 'Layer 2 VPN', 'Layer 3 IP VPN', 'MPLS Connectivity'],
  Internet: ['Dedicated Internet Access', 'Internet Leased Line', 'Broadband Connectivity', 'Enterprise Internet', 'DIA', '4G Infra', 'Account Commitment'],
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getAttributesForProduct(requestedProduct) {
  const category = getCategoryForRequestedProduct(requestedProduct)
  const attrs = PRODUCT_ATTRIBUTES[category]
  if (!attrs) return '—'
  const values = []
  for (const key of Object.keys(attrs)) {
    values.push(pick(attrs[key]))
  }
  return values.join(', ')
}

// Parse row.attributes string (e.g. "2 Mbps, Transport over IP, Layer 2 (VPLS)") into { attrName: value } by product key order
function parseAttributesToObject(attributesString, requestedProduct) {
  const category = getCategoryForRequestedProduct(requestedProduct)
  const attrs = PRODUCT_ATTRIBUTES[category]
  if (!attrs) return {}
  const keys = Object.keys(attrs)
  if (!attributesString || attributesString === '—') {
    const obj = {}
    keys.forEach((k) => { obj[k] = attrs[k][0] ?? '' })
    return obj
  }
  const parts = attributesString.split(',').map((s) => s.trim())
  const obj = {}
  keys.forEach((k, i) => { obj[k] = parts[i] ?? (attrs[k][0] ?? '') })
  return obj
}

// Format { attrName: value } back to display string in key order
function formatAttributesFromObject(obj, requestedProduct) {
  const category = getCategoryForRequestedProduct(requestedProduct)
  const attrs = PRODUCT_ATTRIBUTES[category]
  if (!attrs) return '—'
  const values = Object.keys(attrs).map((k) => obj[k] ?? attrs[k][0] ?? '')
  return values.join(', ')
}

// Return the "other" technology (Copper <-> Fiber) for MACD New Media column.
function getDifferentTechnology(technology) {
  if (technology === 'Copper') return 'Fiber'
  if (technology === 'Fiber') return 'Copper'
  return pick(OTHER_FIELDS.technology)
}

// Return attribute values different from oldAttributes (for MACD New Attributes column).
// Deterministic: same (oldAttributes, requestedProduct) always yields same result, so values don't fluctuate on re-render.
function getDifferentAttributesForProduct(oldAttributes, requestedProduct) {
  const category = getCategoryForRequestedProduct(requestedProduct)
  const attrs = PRODUCT_ATTRIBUTES[category]
  if (!attrs) return '—'
  const oldObj = parseAttributesToObject(oldAttributes, requestedProduct)
  const newObj = {}
  for (const key of Object.keys(attrs)) {
    const options = attrs[key]
    const current = oldObj[key]
    const idx = options.indexOf(current)
    // Pick next option cyclically (deterministic, different from current when 2+ options exist)
    const nextIdx = options.length > 1 ? (idx + 1) % options.length : 0
    newObj[key] = options[nextIdx] ?? current
  }
  return formatAttributesFromObject(newObj, requestedProduct)
}

function randomLsi() {
  return '8000' + String(Math.floor(10000000000 + Math.random() * 9000000000)).slice(-11)
}

function createRow(id, streetAddress, requestedProduct) {
  const attrs = getAttributesForProduct(requestedProduct)
  return {
    id,
    streetAddress,
    postalCode: pick(OTHER_FIELDS.postalCodes),
    requestedProducts: requestedProduct,
    matchedProducts: '',
    matchingStatus: '',
    technology: pick(OTHER_FIELDS.technology),
    attributes: attrs,
    assetName: pick(ASSET_NAMES[getCategoryForRequestedProduct(requestedProduct)] ?? ASSET_NAMES['SD WAN']),
    lsi: randomLsi(),
    newAttributes: '',
    confidenceLevel: 40 + Math.floor(Math.random() * 59), // 40% to 98%
  }
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function termsForCategory(category) {
  return REQUESTED_PRODUCT_TERMS.filter((t) => getCategoryForRequestedProduct(t) === category)
}

function buildAllRows() {
  const rows = []
  let id = 1

  // 1000 locations × 3 requested products (one per category: SD WAN, MPLS, Internet) = 3000 records; use varied customer terms
  for (let i = 0; i < 1000; i++) {
    const address = UNIQUE_LOCATION_ADDRESSES[i]
    rows.push(createRow(id++, address, pick(termsForCategory('SD WAN'))))
    rows.push(createRow(id++, address, pick(termsForCategory('MPLS'))))
    rows.push(createRow(id++, address, pick(termsForCategory('Internet'))))
  }
  // 500 locations × 2 requested products (two different categories) = 1000 records
  for (let i = 0; i < 500; i++) {
    const address = UNIQUE_LOCATION_ADDRESSES[1000 + i]
    const cats = shuffleArray([...MATCHED_PRODUCT_CATEGORIES]).slice(0, 2)
    rows.push(createRow(id++, address, pick(termsForCategory(cats[0]))))
    rows.push(createRow(id++, address, pick(termsForCategory(cats[1]))))
  }
  // 1000 locations × 1 requested product each = 1000 records. Total = 5000
  for (let i = 0; i < 1000; i++) {
    const address = UNIQUE_LOCATION_ADDRESSES[1500 + i]
    rows.push(createRow(id++, address, pick(REQUESTED_PRODUCT_TERMS)))
  }

  // Shuffle so repeated locations appear mixed, not grouped
  const shuffled = shuffleArray(rows)
  return shuffled.map((row, index) => ({ ...row, id: index + 1 }))
}

const ALL_ROWS = buildAllRows()
// 2500 unique locations; 5000 total records (1000×3 + 500×2 + 1000×1)
const TOTAL_LOCATIONS = 2500

const VALIDATION_FAILURE_REASONS = [
  'Missing required attribute',
  'Postal code out of service area',
  'Technology not available at location',
  'Confidence below threshold',
  'Invalid product combination',
]

function StatusPill({ status }) {
  if (!status) return null
  const styles = {
    Done: 'bg-emerald-100 text-teal-700 border border-transparent',
    Partial: 'bg-grey-bg text-gray-600 border border-gray-300',
    Pending: 'bg-amber-100 text-amber-800 border border-transparent',
  }
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded-md text-xs font-medium border ${styles[status] || 'bg-grey-bg text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}

// Scoped notification bar: info (grey), success (green), warning (orange), error (red). Optional message overrides default. Optional onDismiss shows close icon.
function ScopedNotificationBar({ variant = 'success', locationsCount, productsCount, message: messageProp, onDismiss }) {
  const config = {
    info: {
      bg: 'bg-gray-600',
      icon: (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-gray-600 text-xs font-bold shrink-0">i</span>
      ),
      textColor: 'text-white',
      closeColor: 'text-white hover:bg-white/20',
    },
    success: {
      bg: 'bg-green-600',
      icon: (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-green-600 shrink-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      ),
      textColor: 'text-white',
      closeColor: 'text-white hover:bg-white/20',
    },
    warning: {
      bg: 'bg-orange-500',
      icon: (
        <svg className="w-5 h-5 text-black shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
      ),
      textColor: 'text-white',
      closeColor: 'text-white hover:bg-white/20',
    },
    error: {
      bg: 'bg-red-600',
      icon: (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-red-600 shrink-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      ),
      textColor: 'text-white',
      closeColor: 'text-white hover:bg-white/20',
    },
  }
  const { bg, icon, textColor, closeColor } = config[variant] || config.success
  const message = messageProp ?? `${locationsCount} locations were successfully extracted and ${productsCount} requested products are successfully provided for each location based on the request.`
  return (
    <div className="px-4 pt-4 pb-2">
      <div className={`flex items-center gap-3 px-4 py-2.5 ${bg}`} role="status">
        <span className="flex items-center justify-center shrink-0" aria-hidden="true">
          {icon}
        </span>
        <p className={`text-sm font-medium flex-1 min-w-0 ${textColor}`}>{message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`shrink-0 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current ${closeColor}`}
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function DataTableSection({
  continuedRecordIds: continuedRecordIdsProp,
  validationByRowId: validationByRowIdProp,
  validationResult: validationResultProp,
  onRecordCountChange,
  onValidationComplete,
  onValidationStarted,
  onSelectionChange,
  onSelectedIdsChange,
  onLocationsData,
  notificationVariant: notificationVariantProp,
  quoteActionsRef,
  showMatchedResults = false,
  onMatchValidationComplete,
  showAttributesPrefilledNotification = false,
  onDismissAttributesPrefilled,
  revealMatchedResultsInProgress = false,
  onRevealComplete,
  hideMatchSummaryNotification = false,
  onMatchedProductsEditComplete,
  isMacdQuote = false,
}) {
  const continuedRecordIds = continuedRecordIdsProp ?? new Set()
  const PAGE_SIZE = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [notificationVariantState, setNotificationVariantState] = useState('success')
  const notificationVariant = notificationVariantProp ?? notificationVariantState // 'success' | 'error' | 'warning'
  const [scopedNotificationDismissed, setScopedNotificationDismissed] = useState(false)
  const [showBulkAttributesMixedProductError, setShowBulkAttributesMixedProductError] = useState(false)
  const [attributesModalRow, setAttributesModalRow] = useState(null) // { rowId, product } when open
  const [attributesFormValues, setAttributesFormValues] = useState(null) // { [attrName]: value } for modal form
  const [applyAttributesToSelectedRows, setApplyAttributesToSelectedRows] = useState(false) // "Update N selected items" in attributes modal
  const [openMenuRowId, setOpenMenuRowId] = useState(null)
  const [deletedIds, setDeletedIds] = useState(new Set())
  const [deleteModalRow, setDeleteModalRow] = useState(null)
  const [applyDeleteToSelectedRows, setApplyDeleteToSelectedRows] = useState(false)
  const [viewByOpen, setViewByOpen] = useState(false)
  const [viewByValue, setViewByValue] = useState('All')
  const [viewBySortDirection, setViewBySortDirection] = useState('asc') // 'asc' | 'desc' – toggled when clicking the column sort icon
  const [confidenceSortDirection, setConfidenceSortDirection] = useState(null) // null | 'asc' | 'desc' – toggled when clicking Confidence Level sort icon
  const [filterByOpen, setFilterByOpen] = useState(false)
  const [requestedProductFilter, setRequestedProductFilter] = useState(null) // null = All Products
  const [confidenceLevelFilter, setConfidenceLevelFilter] = useState(null) // null = All; or value from CONFIDENCE_LEVEL_OPTIONS
  const [matchedProductFilter, setMatchedProductFilter] = useState(null) // null = All Matched Products
  const [mediaFilter, setMediaFilter] = useState(null) // null = All Media; or 'Copper' | 'Fiber'
  const [requestedProductDropdownOpen, setRequestedProductDropdownOpen] = useState(false)
  const [confidenceLevelDropdownOpen, setConfidenceLevelDropdownOpen] = useState(false)
  const [matchedProductDropdownOpen, setMatchedProductDropdownOpen] = useState(false)
  const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchFilter, setSearchFilter] = useState(null) // applied when user clicks Search button
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [selectedRowIds, setSelectedRowIds] = useState(() => new Set())
  const [viewSelectedOnly, setViewSelectedOnly] = useState(false)
  const [validationInProgress, setValidationInProgress] = useState(false)
  const [validationResultLocal, setValidationResultLocal] = useState(null) // { validatedCount, totalCount }
  const [validationByRowIdLocal, setValidationByRowIdLocal] = useState(null) // { [id]: { valid: boolean, reasoning?: string } }
  const [viewInvalidOnly, setViewInvalidOnly] = useState(false)
  const [viewValidOnly, setViewValidOnly] = useState(false)
  const [validationNotificationDismissed, setValidationNotificationDismissed] = useState(false)
  // Use lifted state from App when provided (so Data Reasoning is prefilled when returning to tab)
  const validationByRowId = validationByRowIdProp !== undefined && validationByRowIdProp !== null ? validationByRowIdProp : validationByRowIdLocal
  const validationResult = validationResultProp !== undefined && validationResultProp !== null ? validationResultProp : validationResultLocal
  const setValidationByRowId = (v) => {
    if (validationByRowIdProp !== undefined && validationByRowIdProp !== null) return // parent owns it
    setValidationByRowIdLocal(v)
  }
  const setValidationResult = (v) => {
    if (validationResultProp !== undefined && validationResultProp !== null) return
    setValidationResultLocal(v)
  }
  const [editingCell, setEditingCell] = useState(null) // { rowId, column: 'technology' | 'requestedProducts' | 'postalCode' }
  const [cellEdits, setCellEdits] = useState(() => ({})) // { [rowId]: { technology?, requestedProducts?, postalCode? } }
  const [matchResults, setMatchResults] = useState(() => ({})) // { [rowId]: { matchedProducts, matchingStatus, confidenceLevel?, errorDetails? } } from "Match All Products"
  const pendingMatchResultsRef = useRef({}) // filled after Match All completes; applied to matchResults when user clicks "Updated Quote Proposal"
  const [matchSummaryNotification, setMatchSummaryNotification] = useState(null) // { matchedCount, unmatchedCount } after match; shown as orange warning
  const [matchWarningDismissed, setMatchWarningDismissed] = useState(false)
  const [viewUnmatchedOnly, setViewUnmatchedOnly] = useState(false)
  const [isMatchLoading, setIsMatchLoading] = useState(false)
  const [lastUpdatedCells, setLastUpdatedCells] = useState(() => new Set()) // Set of 'rowId_column' – show UPDATED badge on these cells until next change
  const cellKey = (rowId, col) => `${rowId}_${col}`
  const dataRowsRef = useRef([])
  const UPDATED_BADGE = (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-black bg-white border border-gray-300 shrink-0" title="Updated">Updated</span>
  )
  const [applyPostalCodeToSelected, setApplyPostalCodeToSelected] = useState(true) // "Update N selected items" when bulk editing postal code
  const [postalCodePopoverPosition, setPostalCodePopoverPosition] = useState(null) // { top, left } for popover when bulk editing
  const postalCodeInputRef = useRef(null)
  const postalCodeEditAnchorRef = useRef(null)
  const [applyBulkEditToSelected, setApplyBulkEditToSelected] = useState(true) // "Update N selected items" for Requested Products / Matched Products / Technology
  const [bulkEditPopoverPosition, setBulkEditPopoverPosition] = useState(null) // { top, left } for bulk edit popover
  const bulkEditAnchorRef = useRef(null)
  const bulkEditRequestedProductsRef = useRef(null)
  const bulkEditMatchedProductsRef = useRef(null)
  const bulkEditTechnologyRef = useRef(null)
  const bulkEditNewTechnologyRef = useRef(null)
  const menuAnchorRef = useRef(null)
  const viewByAnchorRef = useRef(null)
  const filterByAnchorRef = useRef(null)
  const searchAnchorRef = useRef(null)
  const selectAllCheckboxRef = useRef(null)
  const validationRowsRef = useRef([])
  const dataTableResizableCols = useMemo(() => {
    const base = [
      { id: 'streetAddress', label: 'Street Address' },
      { id: 'postalCode', label: 'Postal Code' },
      { id: 'requestedProducts', label: 'Requested Products' },
      { id: 'matchedProducts', label: 'Matched Products' },
      { id: 'media', label: 'Media' },
      { id: 'attributes', label: 'Attributes' },
      { id: 'confidenceLevel', label: 'Confidence Level' },
      { id: 'errorDetails', label: 'Error Details' },
    ]
    if (isMacdQuote) {
      return [
        { id: 'streetAddress', label: 'Street Address' },
        { id: 'postalCode', label: 'Postal Code' },
        { id: 'assetName', label: 'Asset Name' },
        { id: 'lsi', label: 'LSI' },
        { id: 'requestedProducts', label: 'Requested Products' },
        { id: 'matchedProducts', label: 'Matched Products' },
        { id: 'media', label: 'Old Media' },
        { id: 'newMedia', label: 'New Media' },
        { id: 'attributes', label: 'Old Attributes' },
        { id: 'newAttributes', label: 'New Attributes' },
        { id: 'confidenceLevel', label: 'Confidence Level' },
        { id: 'errorDetails', label: 'Error Details' },
      ]
    }
    return base
  }, [isMacdQuote])
  const { getColStyle, ResizeHandle } = useResizableColumns(dataTableResizableCols)
  const macdNewAttributesCache = useRef({}) // Persist newAttributes per row so they don't fluctuate on re-render
  const macdNewTechnologyCache = useRef({}) // Persist newTechnology per row for MACD New Media column

  const dataRows = ALL_ROWS.filter(
    (r) => !deletedIds.has(r.id) && !(continuedRecordIds && continuedRecordIds.has(r.id))
  )
  dataRowsRef.current = dataRows
  const effectiveMatchResults = showMatchedResults ? matchResults : {}
  const dataRowsWithEdits = dataRows.map((row) => {
    const merged = { ...row, ...cellEdits[row.id], ...effectiveMatchResults[row.id] }
    if (isMacdQuote) {
      if (!merged.matchedProducts) {
        merged.matchedProducts = MATCHED_PRODUCTS_OPTIONS[getCategoryForRequestedProduct(merged.requestedProducts)]?.[0] ?? getCategoryForRequestedProduct(merged.requestedProducts)
        merged.matchingStatus = 'Done'
      }
      if (!merged.newAttributes || merged.newAttributes === '') {
        const cacheKey = `${row.id}`
        if (!macdNewAttributesCache.current[cacheKey]) {
          macdNewAttributesCache.current[cacheKey] = getDifferentAttributesForProduct(merged.attributes, merged.requestedProducts)
        }
        merged.newAttributes = macdNewAttributesCache.current[cacheKey]
      }
      if (!merged.newTechnology || merged.newTechnology === '') {
        const cacheKey = `${row.id}`
        if (!macdNewTechnologyCache.current[cacheKey]) {
          macdNewTechnologyCache.current[cacheKey] = getDifferentTechnology(merged.technology)
        }
        merged.newTechnology = macdNewTechnologyCache.current[cacheKey]
      }
    }
    return merged
  })

  // All matched product options for filter dropdown (flatten MATCHED_PRODUCTS_OPTIONS)
  const ALL_MATCHED_PRODUCT_OPTIONS = Object.values(MATCHED_PRODUCTS_OPTIONS).flat()

  // Apply Requested Products, Confidence Level, Matched Products, and Media filters
  const filteredRows = dataRowsWithEdits.filter((row) => {
    if (requestedProductFilter != null && row.requestedProducts !== requestedProductFilter) return false
    if (confidenceLevelFilter != null) {
      const opt = CONFIDENCE_LEVEL_OPTIONS.find((o) => o.value === confidenceLevelFilter)
      if (opt && (row.confidenceLevel < opt.min || row.confidenceLevel > opt.max)) return false
    }
    if (matchedProductFilter != null && row.matchedProducts !== matchedProductFilter) return false
    if (mediaFilter != null && row.technology !== mediaFilter) return false
    return true
  })

  // Parse city and state from streetAddress ("number, Street, City, State, India")
  const getCityAndState = (streetAddress) => {
    if (!streetAddress || typeof streetAddress !== 'string') return { city: '', state: '' }
    const parts = streetAddress.split(',').map((p) => p.trim())
    return { city: parts[2] || '', state: parts[3] || '' }
  }

  // Search filter: rows where any searchable field contains the term; city/state match from address
  const searchFilteredRows = (() => {
    if (searchFilter == null || String(searchFilter).trim() === '') return filteredRows
    const term = String(searchFilter).trim().toLowerCase()
    return filteredRows.filter((row) => {
      const { city, state } = getCityAndState(row.streetAddress)
      const fields = [
        row.streetAddress,
        city,
        state,
        row.requestedProducts,
        row.postalCode,
        row.technology,
        row.attributes,
      ]
      return fields.some((v) => String(v || '').toLowerCase().includes(term))
    })
  })()

  // Auto-suggestions: include city and state so user can type "Chennai" or "Tamil Nadu" and pick them
  const searchSuggestions = (() => {
    const q = searchInput.trim().toLowerCase()
    if (q.length === 0) return []
    const seen = new Set()
    const out = []
    for (const row of filteredRows) {
      const { city, state } = getCityAndState(row.streetAddress)
      const candidates = [city, state, row.streetAddress, row.requestedProducts, row.postalCode, row.technology]
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
  })()

  // Apply Confidence Level sort (when active) or View By grouping
  const groupedRows = (() => {
    const copy = [...searchFilteredRows]
    if (confidenceSortDirection != null) {
      return copy.sort((a, b) =>
        confidenceSortDirection === 'asc'
          ? a.confidenceLevel - b.confidenceLevel
          : b.confidenceLevel - a.confidenceLevel
      )
    }
    if (viewByValue === 'All') return searchFilteredRows
    if (viewByValue === 'Media') {
      const order = viewBySortDirection === 'asc' ? ['Copper', 'Fiber'] : ['Fiber', 'Copper']
      return copy.sort((a, b) => {
        const i = order.indexOf(a.technology)
        const j = order.indexOf(b.technology)
        return (i === -1 ? order.length : i) - (j === -1 ? order.length : j) || 0
      })
    }
    if (viewByValue === 'Requested Products') {
      const categoryOrder = viewBySortDirection === 'asc' ? ['MPLS', 'SD WAN', 'Internet'] : ['Internet', 'SD WAN', 'MPLS']
      return copy.sort((a, b) => {
        const catA = getCategoryForRequestedProduct(a.requestedProducts)
        const catB = getCategoryForRequestedProduct(b.requestedProducts)
        const i = categoryOrder.indexOf(catA)
        const j = categoryOrder.indexOf(catB)
        if (i !== j) return (i === -1 ? categoryOrder.length : i) - (j === -1 ? categoryOrder.length : j)
        return (a.requestedProducts || '').localeCompare(b.requestedProducts || '')
      })
    }
    return searchFilteredRows
  })()

  validationRowsRef.current = groupedRows

  // When "View Selected" is on, show only selected rows; when validation filter is on, show only invalid or only valid rows; when "View Unmatched" is on, show only unmatched
  let rowsToDisplay = viewSelectedOnly
    ? groupedRows.filter((r) => selectedRowIds.has(r.id))
    : groupedRows
  if (viewInvalidOnly && validationByRowId) {
    rowsToDisplay = rowsToDisplay.filter((r) => validationByRowId[r.id] && !validationByRowId[r.id].valid)
  }
  if (viewValidOnly && validationByRowId) {
    rowsToDisplay = rowsToDisplay.filter((r) => validationByRowId[r.id] && validationByRowId[r.id].valid)
  }
  if (viewUnmatchedOnly) {
    rowsToDisplay = rowsToDisplay.filter((r) => r.matchingStatus === 'Partial' || r.matchingStatus === 'Pending')
  }
  const totalRows = rowsToDisplay.length
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))
  const visibleRows = viewSelectedOnly ? rowsToDisplay : rowsToDisplay.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasPagination = !viewSelectedOnly && totalRows > PAGE_SIZE
  // When viewing a subset (unmatched, selected, valid-only, invalid-only), tab and status line show this count
  const effectiveRecordCount = (viewSelectedOnly || viewUnmatchedOnly || (viewInvalidOnly && validationByRowId) || (viewValidOnly && validationByRowId)) ? totalRows : searchFilteredRows.length

  // Extra status line text for filtering, grouping, or search
  const statusExtras = (() => {
    const parts = []
    const rows = searchFilteredRows
    if (viewByValue === 'Media' && confidenceSortDirection == null) {
      const copper = rows.filter((r) => r.technology === 'Copper').length
      const fiber = rows.filter((r) => r.technology === 'Fiber').length
      if (copper > 0) parts.push(`Shows ${copper} of Copper Technology`)
      if (fiber > 0) parts.push(`Shows ${fiber} of Fiber Technology`)
    }
    if (viewByValue === 'Requested Products' && confidenceSortDirection == null && requestedProductFilter == null) {
      const mpls = rows.filter((r) => getCategoryForRequestedProduct(r.requestedProducts) === 'MPLS').length
      const sdwan = rows.filter((r) => getCategoryForRequestedProduct(r.requestedProducts) === 'SD WAN').length
      const internet = rows.filter((r) => getCategoryForRequestedProduct(r.requestedProducts) === 'Internet').length
      if (mpls > 0) parts.push(`Shows ${mpls} MPLS products`)
      if (sdwan > 0) parts.push(`Shows ${sdwan} SD WAN products`)
      if (internet > 0) parts.push(`Shows ${internet} Internet products`)
    }
    if (requestedProductFilter != null) {
      parts.push(`Shows ${rows.length} ${requestedProductFilter} products`)
    }
    if (confidenceLevelFilter != null) {
      const opt = CONFIDENCE_LEVEL_OPTIONS.find((o) => o.value === confidenceLevelFilter)
      const label = opt ? opt.label : confidenceLevelFilter
      parts.push(`Shows ${rows.length} ${label} confidence`)
    }
    if (matchedProductFilter != null) {
      parts.push(`Shows ${rows.length} ${matchedProductFilter}`)
    }
    if (mediaFilter != null) {
      parts.push(`Shows ${rows.length} ${mediaFilter}`)
    }
    if (searchFilter != null && String(searchFilter).trim() !== '') {
      parts.push(`Shows ${rows.length} matching search`)
    }
    return parts
  })()

  // When grouped by Media or Requested Products (and not sorting by Confidence), insert section header rows
  const TABLE_COLUMN_COUNT = isMacdQuote ? 14 : 10
  const effectiveColumnCount = TABLE_COLUMN_COUNT
  const tbodyItems = (() => {
    if (viewByValue === 'All' || confidenceSortDirection != null) return visibleRows.map((row) => ({ type: 'row', row }))
    const key = viewByValue === 'Media' ? 'technology' : 'requestedProducts'
    const items = []
    let lastGroup = null
    for (const row of visibleRows) {
      const group = row[key]
      if (group !== lastGroup) {
        items.push({ type: 'group', label: group })
        lastGroup = group
      }
      items.push({ type: 'row', row })
    }
    return items
  })()

  useEffect(() => {
    onRecordCountChange?.(effectiveRecordCount)
  }, [effectiveRecordCount, onRecordCountChange])

  useEffect(() => {
    onSelectionChange?.(selectedRowIds.size)
  }, [selectedRowIds, onSelectionChange])

  useEffect(() => {
    onSelectedIdsChange?.(selectedRowIds)
  }, [selectedRowIds, onSelectedIdsChange])

  // Unique locations (one per streetAddress) for Locations tab; source = "AI Extracted" | "File Uploaded", circle = e.g. "DL", "UW"
  const CIRCLE_CODES = ['DL', 'UW', 'DL', 'MH', 'KA', 'TN', 'AP', 'GJ', 'WB', 'UP', 'RJ', 'PB']
  useEffect(() => {
    if (!onLocationsData) return
    const seen = new Set()
    const list = []
    let index = 0
    for (const row of dataRows) {
      if (!seen.has(row.streetAddress)) {
        seen.add(row.streetAddress)
        const parts = (row.streetAddress || '').split(',').map((p) => p.trim())
        list.push({
          id: row.id,
          streetAddress: row.streetAddress,
          postalCode: row.postalCode,
          city: parts[2] || '',
          state: parts[3] || '',
          country: parts[4] || 'India',
          source: index % 2 === 0 ? 'AI Extracted' : 'File Uploaded',
          circle: CIRCLE_CODES[index % CIRCLE_CODES.length],
          productsAssigned: !!(row.requestedProducts || row.matchedProducts),
        })
        index++
      }
    }
    onLocationsData(list)
  }, [dataRows, onLocationsData])

  useEffect(() => {
    const el = selectAllCheckboxRef.current
    if (!el) return
    const n = groupedRows.length
    const s = selectedRowIds.size
    el.indeterminate = n > 0 && s > 0 && s < n
  }, [groupedRows.length, selectedRowIds.size])

  useEffect(() => {
    const isBulkPostal = editingCell?.column === 'postalCode' && selectedRowIds.size >= 2
    if (!isBulkPostal) {
      setPostalCodePopoverPosition(null)
      return
    }
    const tick = requestAnimationFrame(() => {
      const el = postalCodeEditAnchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPostalCodePopoverPosition({ top: rect.bottom + 4, left: rect.left })
    })
    return () => cancelAnimationFrame(tick)
  }, [editingCell?.rowId, editingCell?.column, selectedRowIds.size])

  const isBulkEditColumn = isMacdQuote
    ? ['requestedProducts', 'matchedProducts', 'newTechnology'].includes(editingCell?.column)
    : ['requestedProducts', 'matchedProducts', 'technology'].includes(editingCell?.column)
  const isBulkEditActive = isBulkEditColumn && selectedRowIds.size >= 2
  useEffect(() => {
    if (!isBulkEditActive) {
      setBulkEditPopoverPosition(null)
      return
    }
    const tick = requestAnimationFrame(() => {
      const el = bulkEditAnchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setBulkEditPopoverPosition({ top: rect.bottom + 4, left: rect.left })
    })
    return () => cancelAnimationFrame(tick)
  }, [editingCell?.rowId, editingCell?.column, selectedRowIds.size, isBulkEditActive])

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

  useEffect(() => {
    if (!viewByOpen) return
    const handleClickOutside = (e) => {
      if (viewByAnchorRef.current && !viewByAnchorRef.current.contains(e.target)) {
        setViewByOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [viewByOpen])

  useEffect(() => {
    if (!filterByOpen) return
    const handleClickOutside = (e) => {
      if (filterByAnchorRef.current && !filterByAnchorRef.current.contains(e.target)) {
        setFilterByOpen(false)
        setRequestedProductDropdownOpen(false)
        setConfidenceLevelDropdownOpen(false)
        setMatchedProductDropdownOpen(false)
        setMediaDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [filterByOpen])

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

  const uniqueLocationsCount = new Set(dataRows.map((r) => r.streetAddress)).size
  const productsCount = dataRows.length
  const editingRowForPostal = editingCell?.column === 'postalCode' ? dataRowsWithEdits.find((r) => r.id === editingCell.rowId) : null
  const editingRowForBulk = isBulkEditColumn && editingCell?.rowId ? dataRowsWithEdits.find((r) => r.id === editingCell.rowId) : null

  const handleMatchAllProducts = () => {
    const isRevealFromLink = revealMatchedResultsInProgress
    if (!isRevealFromLink) onMatchValidationComplete?.()
    setTimeout(() => {
      const next = {}
      dataRows.forEach((row) => {
        const requested = cellEdits[row.id]?.requestedProducts ?? row.requestedProducts
        const category = getCategoryForRequestedProduct(requested)
        const options = MATCHED_PRODUCTS_OPTIONS[category]
        const matched = options ? pick(options) : ''
        const status = pick(MATCHING_STATUSES)
        const isUnmatched = status !== 'Done'
        next[row.id] = {
          matchedProducts: matched,
          matchingStatus: status,
          confidenceLevel: getConfidenceLevelForMatchingStatus(status),
          ...(isUnmatched && { errorDetails: pick(UNMATCHED_ERROR_REASONS) }),
        }
      })
      if (isRevealFromLink) {
        setMatchResults({ ...next })
        let matchedCount = 0
        let unmatchedCount = 0
        Object.values(next).forEach((r) => {
          if (r.matchingStatus === 'Done') matchedCount++
          else unmatchedCount++
        })
        setMatchSummaryNotification({ matchedCount, unmatchedCount })
        setMatchWarningDismissed(false)
      } else {
        pendingMatchResultsRef.current = next
      }
    }, 2000)
  }

  useEffect(() => {
    if (showMatchedResults && Object.keys(pendingMatchResultsRef.current || {}).length > 0) {
      const pending = pendingMatchResultsRef.current
      setMatchResults({ ...pending })
      let matchedCount = 0
      let unmatchedCount = 0
      Object.values(pending).forEach((r) => {
        if (r.matchingStatus === 'Done') matchedCount++
        else unmatchedCount++
      })
      setMatchSummaryNotification({ matchedCount, unmatchedCount })
      setMatchWarningDismissed(false)
      pendingMatchResultsRef.current = {}
    }
  }, [showMatchedResults])

  useEffect(() => {
    if (!revealMatchedResultsInProgress || !onRevealComplete) return
    const t = setTimeout(() => { onRevealComplete() }, 2000)
    return () => clearTimeout(t)
  }, [revealMatchedResultsInProgress, onRevealComplete])

  const applyBulkPostalCode = (postalCode) => {
    const ids = Array.from(selectedRowIds)
    if (ids.length === 0) return false
    const v = String(postalCode || '').trim()
    if (!v) return false
    setCellEdits((prev) => {
      const next = { ...prev }
      ids.forEach((id) => { next[id] = { ...next[id], postalCode: v } })
      return next
    })
    return true
  }

  const applyBulkAttributes = (productName, attributesObject, applyToAllRowsWithProduct = false, applyToSelectedRowsOnly = false) => {
    const category = getCategoryForRequestedProduct(productName)
    if (!attributesObject || !PRODUCT_ATTRIBUTES[category]) return { applied: 0, message: 'Invalid product or attributes.', updatedIds: [] }
    const str = formatAttributesFromObject(attributesObject, productName)
    const ids = applyToAllRowsWithProduct
      ? dataRows.filter((row) => (cellEdits[row.id]?.requestedProducts ?? row.requestedProducts) === productName).map((r) => r.id)
      : applyToSelectedRowsOnly && selectedRowIds.size >= 2
        ? Array.from(selectedRowIds)
        : Array.from(selectedRowIds).filter((id) => {
            const row = dataRows.find((r) => r.id === id)
            const requested = cellEdits[id]?.requestedProducts ?? row?.requestedProducts
            return requested === productName
          })
    if (ids.length === 0) {
      return {
        applied: 0,
        message: applyToAllRowsWithProduct
          ? `No rows have Requested Product: ${productName}.`
          : `No selected rows have Requested Product: ${productName}. Select rows on the table first, then save attributes.`,
        updatedIds: [],
      }
    }
    setCellEdits((prev) => { const next = { ...prev }; ids.forEach((id) => { next[id] = { ...next[id], attributes: str } }); return next })
    setMatchResults((prev) => { const next = { ...prev }; ids.forEach((id) => { next[id] = { ...next[id], attributes: str } }); return next })
    return {
      applied: ids.length,
      message: `Successfully changed the attributes of ${productName}. ${ids.length} row(s) updated in the table.`,
      updatedIds: ids,
    }
  }

  const applyAttributesByMatchedProductCategory = (category, attributesOverride) => {
    const productName = category === 'SD WAN' ? termsForCategory('SD WAN')[0] : category === 'MPLS' ? termsForCategory('MPLS')[0] : termsForCategory('Internet')[0]
    const attrs = PRODUCT_ATTRIBUTES[category]
    if (!attrs || !attributesOverride) return []
    const merged = {}
    Object.keys(attrs).forEach((k) => { merged[k] = attributesOverride[k] ?? attrs[k][0] ?? '' })
    const str = formatAttributesFromObject(merged, productName)
    const ids = dataRows.filter((row) => getCategoryForRequestedProduct(cellEdits[row.id]?.requestedProducts ?? row.requestedProducts) === category).map((r) => r.id)
    if (ids.length === 0) return []
    setCellEdits((prev) => { const next = { ...prev }; ids.forEach((id) => { next[id] = { ...next[id], attributes: str } }); return next })
    setMatchResults((prev) => { const next = { ...prev }; ids.forEach((id) => { next[id] = { ...next[id], attributes: str } }); return next })
    return ids
  }

  const applyRequestedProductsByPostalCode = (postalCode, requestedProduct) => {
    const pc = String(postalCode || '').trim()
    if (!pc || !requestedProduct) return []
    const ids = dataRows.filter((row) => (cellEdits[row.id]?.postalCode ?? row.postalCode) === pc).map((r) => r.id)
    if (ids.length === 0) return []
    setCellEdits((prev) => { const next = { ...prev }; ids.forEach((id) => { next[id] = { ...next[id], requestedProducts: requestedProduct } }); return next })
    setMatchResults((prev) => {
      const next = { ...prev }
      const category = getCategoryForRequestedProduct(requestedProduct)
      ids.forEach((id) => {
        const row = dataRows.find((r) => r.id === id)
        next[id] = { ...next[id], requestedProducts: requestedProduct, matchedProducts: MATCHED_PRODUCTS_OPTIONS[category]?.[0] ?? '', attributes: getAttributesForProduct(requestedProduct) }
      })
      return next
    })
    return ids
  }

  const applyUpdateFromIntent = (intentText) => {
    if (!intentText || typeof intentText !== 'string') return []
    const t = intentText.toLowerCase().trim()
    let rowIds = []
    if (/sd\s*wan|sdwan/.test(t) && (/attribute|co-?owned|co-?managed|managed/.test(t))) {
      rowIds = applyAttributesByMatchedProductCategory('SD WAN', { 'Service Type': 'Co-Managed', 'SDWAN Deployment Type': 'Hybrid', 'SDWAN Controller Platform': 'Cisco Meraki (MX Series)' })
      setMatchedProductFilter('SD WAN')
    } else {
      const pincodeMatch = t.match(/pincode\s*\(?(\d+)\)?|postal\s*code\s*\(?(\d+)\)?|pincode\s+(\d+)/i)
      const toInternet = /\bto\s+internet\b/i.test(t)
      if (pincodeMatch && toInternet) {
        const postalCode = (pincodeMatch[1] || pincodeMatch[2] || pincodeMatch[3] || '').trim()
        if (postalCode) rowIds = applyRequestedProductsByPostalCode(postalCode, 'Internet')
      }
    }
    return rowIds
  }

  const runValidation = () => {
    setValidationInProgress(true)
    onValidationStarted?.()
    setValidationNotificationDismissed(false)
    setViewInvalidOnly(false)
    setViewValidOnly(false)
    const rows = validationRowsRef.current || []
    const passRate = isMacdQuote ? 0.82 : 0.8  // MACD: ~18% fail (error reasons for some rows); others: ~20% fail
    setTimeout(() => {
      const byRowId = {}
      const validatedRowIds = new Set()
      let validatedCount = 0
      for (const row of rows) {
        const valid = Math.random() < passRate
        if (valid) {
          validatedCount++
          validatedRowIds.add(row.id)
          byRowId[row.id] = { valid: true }
        } else {
          byRowId[row.id] = {
            valid: false,
            reasoning: VALIDATION_FAILURE_REASONS[Math.floor(Math.random() * VALIDATION_FAILURE_REASONS.length)],
          }
        }
      }
      const result = { validatedCount, totalCount: rows.length }
      setValidationByRowId(byRowId)
      setValidationResult(result)
      setValidationInProgress(false)
      onValidationComplete?.(validatedCount, validatedRowIds, { validationByRowId: byRowId, validationResult: result })
    }, 2000)
  }

  useEffect(() => {
    if (!quoteActionsRef) return
    quoteActionsRef.current = {
      matchAllProducts: handleMatchAllProducts,
      runValidation,
      setRequestedProductFilter,
      setConfidenceLevelFilter,
      setMatchedProductFilter,
      setMediaFilter,
      setViewByValue,
      setSearchFilter,
      setViewSelectedOnly,
      setFilterByOpen: (open) => setFilterByOpen(!!open),
      applyBulkPostalCode,
      applyBulkAttributes,
      getProductAttributes: (productName) => {
        const category = getCategoryForRequestedProduct(productName)
        const attrs = PRODUCT_ATTRIBUTES[category]
        if (!attrs) return null
        return { productName, attributes: attrs }
      },
      clearFilters: () => {
        setRequestedProductFilter(null)
        setConfidenceLevelFilter(null)
        setMatchedProductFilter(null)
        setMediaFilter(null)
      },
      showUpdatedBadgeForRows: (rowIds) => {
        if (!rowIds || !rowIds.length) return
        setLastUpdatedCells(new Set(rowIds.map((id) => cellKey(id, 'matchedProducts'))))
      },
      showMacdUpdatedBadgeForColumns: (columns, intentText) => {
        if (!columns || !columns.length || !isMacdQuote) return
        const rows = dataRowsRef.current || []
        const targetCategories = parseProductFilterFromIntent(intentText)
        const matchingRows = targetCategories.length > 0
          ? rows.filter((r) => {
              const reqCat = getCategoryForRequestedProduct(r.requestedProducts)
              const matchCat = getCategoryForRequestedProduct(r.matchedProducts)
              const cat = reqCat || matchCat
              return targetCategories.some((c) => c === cat)
            })
          : rows
        const rowIds = matchingRows.map((r) => r.id)
        const cells = rowIds.flatMap((id) => columns.map((col) => cellKey(id, col)))
        setLastUpdatedCells(new Set(cells))

        // Apply newAttributes value changes when intent has "from X to Y"
        if (columns.includes('newAttributes') && intentText) {
          const change = parseAttributeChangeFromIntent(intentText)
          if (change) {
            const { fromValue, toValue } = change
            setCellEdits((prev) => {
              const next = { ...prev }
              for (const row of matchingRows) {
                const current = prev[row.id]?.newAttributes ?? getDifferentAttributesForProduct(row.attributes, row.requestedProducts)
                if (!current) continue
                const parts = current.split(',').map((s) => s.trim())
                const newParts = parts.map((p) => (p.toLowerCase() === fromValue.toLowerCase() ? toValue : p))
                const newStr = newParts.join(', ')
                if (newStr !== current) {
                  next[row.id] = { ...next[row.id], newAttributes: newStr }
                  macdNewAttributesCache.current[row.id] = newStr
                }
              }
              return next
            })
          }
        }
      },
      applyUpdateFromIntent,
    }
    return () => { quoteActionsRef.current = {} }
  }, [isMacdQuote])

  const postalCodePopover =
    postalCodePopoverPosition &&
    editingCell?.column === 'postalCode' &&
    selectedRowIds.size >= 2 &&
    editingRowForPostal
      ? createPortal(
          <div
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[14rem]"
            style={{
              position: 'fixed',
              top: postalCodePopoverPosition.top,
              left: postalCodePopoverPosition.left,
              zIndex: 9999,
            }}
            role="dialog"
            aria-label="Edit postal code for selected items"
          >
            <input
              ref={postalCodeInputRef}
              type="text"
              defaultValue={editingRowForPostal.postalCode}
              placeholder="Postal code"
              autoFocus
              className="w-full px-2 py-1.5 text-xs border border-blue-600 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditingCell(null)
              }}
            />
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={applyPostalCodeToSelected}
                onChange={(e) => setApplyPostalCodeToSelected(e.target.checked)}
                className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red w-3.5 h-3.5"
              />
              <span className="text-xs text-gray-700">Update {selectedRowIds.size} selected items</span>
            </label>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-blue-600 hover:bg-grey-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const v = (postalCodeInputRef.current?.value ?? '').trim() || editingRowForPostal.postalCode
                  const ids = applyPostalCodeToSelected ? Array.from(selectedRowIds) : [editingCell.rowId]
                  setCellEdits((prev) => {
                    const next = { ...prev }
                    ids.forEach((id) => {
                      next[id] = { ...next[id], postalCode: v }
                    })
                    return next
                  })
                  setLastUpdatedCells(new Set(ids.map((id) => cellKey(id, 'postalCode'))))
                  setEditingCell(null)
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-airtel-red text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-airtel-red focus:ring-offset-1"
              >
                Save
              </button>
            </div>
          </div>,
          document.body
        )
      : null

  const bulkEditPopover =
    bulkEditPopoverPosition &&
    isBulkEditActive &&
    editingRowForBulk &&
    editingCell?.column
      ? createPortal(
          <div
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[14rem]"
            style={{
              position: 'fixed',
              top: bulkEditPopoverPosition.top,
              left: bulkEditPopoverPosition.left,
              zIndex: 9999,
            }}
            role="dialog"
            aria-label={`Bulk edit ${editingCell.column === 'requestedProducts' ? 'Requested Products' : editingCell.column === 'matchedProducts' ? 'Matched Products' : editingCell.column === 'newTechnology' ? 'New Media' : 'Media'}`}
          >
            {editingCell.column === 'requestedProducts' && (
              <select
                ref={bulkEditRequestedProductsRef}
                defaultValue={editingRowForBulk.requestedProducts}
                className="w-full px-2 py-1.5 text-xs border border-blue-600 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {REQUESTED_PRODUCTS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {editingCell.column === 'matchedProducts' && (
              <select
                ref={bulkEditMatchedProductsRef}
                defaultValue={editingRowForBulk.matchedProducts || (MATCHED_PRODUCTS_OPTIONS[getCategoryForRequestedProduct(editingRowForBulk.requestedProducts)]?.[0] ?? '')}
                className="w-full px-2 py-1.5 text-xs border border-blue-600 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {ALL_MATCHED_PRODUCT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {editingCell.column === 'technology' && (
              <select
                ref={bulkEditTechnologyRef}
                defaultValue={editingRowForBulk.technology}
                className="w-full px-2 py-1.5 text-xs border border-blue-600 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {OTHER_FIELDS.technology.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {editingCell.column === 'newTechnology' && (
              <select
                ref={bulkEditNewTechnologyRef}
                defaultValue={editingRowForBulk.newTechnology}
                className="w-full px-2 py-1.5 text-xs border border-blue-600 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {OTHER_FIELDS.technology.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={applyBulkEditToSelected}
                onChange={(e) => setApplyBulkEditToSelected(e.target.checked)}
                className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red w-3.5 h-3.5"
              />
              <span className="text-xs text-gray-700">Update {selectedRowIds.size} selected items</span>
            </label>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-blue-600 hover:bg-grey-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const ids = applyBulkEditToSelected ? Array.from(selectedRowIds) : [editingCell.rowId]
                  if (editingCell.column === 'requestedProducts') {
                    const v = bulkEditRequestedProductsRef.current?.value ?? editingRowForBulk.requestedProducts
                    setCellEdits((prev) => {
                      const next = { ...prev }
                      ids.forEach((id) => { next[id] = { ...next[id], requestedProducts: v } })
                      return next
                    })
                  }
                  if (editingCell.column === 'matchedProducts') {
                    const v = bulkEditMatchedProductsRef.current?.value ?? editingRowForBulk.matchedProducts
                    const attributesForMatched = getAttributesForProduct(v)
                    setMatchResults((prev) => {
                      const next = { ...prev }
                      ids.forEach((id) => {
                        const row = dataRowsWithEdits.find((r) => r.id === id)
                        const currentStatus = row?.matchingStatus || ''
                        const status = getNextMatchingStatus(currentStatus)
                        next[id] = { ...prev[id], matchedProducts: v, matchingStatus: status, confidenceLevel: getConfidenceLevelForMatchingStatus(status), attributes: attributesForMatched }
                      })
                      return next
                    })
                    onMatchedProductsEditComplete?.(ids)
                  }
                  if (editingCell.column === 'technology') {
                    const v = bulkEditTechnologyRef.current?.value ?? editingRowForBulk.technology
                    setCellEdits((prev) => {
                      const next = { ...prev }
                      ids.forEach((id) => { next[id] = { ...next[id], technology: v } })
                      return next
                    })
                  }
                  if (editingCell.column === 'newTechnology') {
                    const v = bulkEditNewTechnologyRef.current?.value ?? editingRowForBulk.newTechnology
                    setCellEdits((prev) => {
                      const next = { ...prev }
                      ids.forEach((id) => { next[id] = { ...next[id], newTechnology: v } })
                      return next
                    })
                  }
                  // Show Updated badge on all cells that were bulk-updated; for matchedProducts also show badge on attributes column (attributes update with product)
                  if (editingCell.column === 'matchedProducts') {
                    setLastUpdatedCells(new Set(ids.flatMap((id) => [cellKey(id, 'matchedProducts'), cellKey(id, 'attributes')])))
                  } else {
                    setLastUpdatedCells(new Set(ids.map((id) => cellKey(id, editingCell.column))))
                  }
                  setEditingCell(null)
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-airtel-red text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-airtel-red focus:ring-offset-1"
              >
                Save
              </button>
            </div>
          </div>,
          document.body
        )
      : null

  const attributesModalOpen = attributesModalRow != null && PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(attributesModalRow.product)]

  const attributesModal =
    attributesModalOpen && attributesModalRow && attributesFormValues
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="attributes-modal-title"
            onClick={(e) => { if (e.target === e.currentTarget) { setAttributesModalRow(null); setAttributesFormValues(null); setApplyAttributesToSelectedRows(false) } }}
          >
            <div
              className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="attributes-modal-title" className="text-base font-bold text-[#032d60] px-5 py-4 border-b border-gray-200">
                Requested Product : {attributesModalRow.product}
              </h2>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(attributesModalRow.product)] || {}).map((attrName) => (
                    <div key={attrName}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{attrName}</label>
                      <select
                        value={attributesFormValues[attrName] ?? ''}
                        onChange={(e) =>
                          setAttributesFormValues((prev) => ({ ...prev, [attrName]: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">All Products</option>
                        {(PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(attributesModalRow.product)][attrName] || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              {selectedRowIds.size >= 2 && (
                <div className="shrink-0 px-5 py-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyAttributesToSelectedRows}
                      onChange={(e) => setApplyAttributesToSelectedRows(e.target.checked)}
                      className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                    />
                    <span className="text-sm text-gray-700">Update {selectedRowIds.size} selected items</span>
                  </label>
                </div>
              )}
              <div className="shrink-0 border-t border-gray-200 px-5 py-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAttributesModalRow(null)
                    setAttributesFormValues(null)
                    setApplyAttributesToSelectedRows(false)
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const str = formatAttributesFromObject(attributesFormValues, attributesModalRow.product)
                    const rowId = attributesModalRow.rowId
                    let updatedIds = [rowId]
                    const isNewAttrs = attributesModalRow.editingNewAttributes
                    if (applyAttributesToSelectedRows && selectedRowIds.size >= 2) {
                      const ids = Array.from(selectedRowIds)
                      setCellEdits((prev) => {
                        const next = { ...prev }
                        ids.forEach((id) => {
                          next[id] = { ...next[id], [isNewAttrs ? 'newAttributes' : 'attributes']: str }
                        })
                        return next
                      })
                      updatedIds = ids
                    } else {
                      if (isNewAttrs) {
                        setCellEdits((prev) => ({ ...prev, [rowId]: { ...prev[rowId], newAttributes: str } }))
                      } else {
                        setCellEdits((prev) => ({ ...prev, [rowId]: { ...prev[rowId], attributes: str } }))
                        setMatchResults((prev) => ({ ...prev, [rowId]: { ...prev[rowId], attributes: str } }))
                      }
                    }
                    setLastUpdatedCells(new Set(updatedIds.map((id) => cellKey(id, isNewAttrs ? 'newAttributes' : 'attributes'))))
                    setAttributesModalRow(null)
                    setAttributesFormValues(null)
                    setApplyAttributesToSelectedRows(false)
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-airtel-red text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-airtel-red focus:ring-offset-1"
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  const openAttributesModal = (rowId, product, currentAttributesString) => {
    if (!PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(product)]) return
    // Only block when selected rows have different product types (e.g. MPLS + SD WAN). Same product with different attribute values is allowed.
    if (selectedRowIds.size >= 2) {
      const selectedRows = dataRowsWithEdits.filter((r) => selectedRowIds.has(r.id))
      const productTypes = new Set(
        selectedRows.map((r) => getCategoryForRequestedProduct((r.requestedProducts ?? '').toString().trim()))
      )
      if (productTypes.size > 1) {
        setShowBulkAttributesMixedProductError(true)
        return
      }
    }
    setShowBulkAttributesMixedProductError(false)
    setAttributesModalRow({ rowId, product })
    setAttributesFormValues(parseAttributesToObject(currentAttributesString, product))
    setApplyAttributesToSelectedRows(false)
  }

  const openNewAttributesModal = (rowId, product, currentNewAttributesString) => {
    if (!PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(product)]) return
    if (selectedRowIds.size >= 2) {
      const selectedRows = dataRowsWithEdits.filter((r) => selectedRowIds.has(r.id))
      const productTypes = new Set(
        selectedRows.map((r) => getCategoryForRequestedProduct((r.requestedProducts ?? '').toString().trim()))
      )
      if (productTypes.size > 1) {
        setShowBulkAttributesMixedProductError(true)
        return
      }
    }
    setShowBulkAttributesMixedProductError(false)
    setAttributesModalRow({ rowId, product, editingNewAttributes: true })
    setAttributesFormValues(parseAttributesToObject(currentNewAttributesString || '—', product))
    setApplyAttributesToSelectedRows(selectedRowIds.size >= 2)
  }

  return (
    <>
      {postalCodePopover}
      {bulkEditPopover}
      {attributesModal}
      {/* Screenshot area: one rectangle card (banner + toolbar + stats + table) – grey #F5F5F5 */}
      <div className="bg-screenshot-grey rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-screenshot-grey">
      {/* Error: bulk edit attributes with mixed product types (e.g. SDWAN + MPLS) */}
      {showBulkAttributesMixedProductError ? (
        <ScopedNotificationBar
          variant="error"
          message="Unable to bulk edit. Your selection includes different products. To proceed, ensure all selected items are of the same product type."
          onDismiss={() => setShowBulkAttributesMixedProductError(false)}
        />
      ) : validationResult != null && !validationNotificationDismissed ? (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-500" role="status">
            <span className="flex items-center justify-center shrink-0" aria-hidden="true">
              <svg className="w-5 h-5 text-black shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </span>
            <p className="text-sm font-medium flex-1 min-w-0 text-black">
              {validationResult.validatedCount} of {validationResult.totalCount} records validated
              {(validationResult.totalCount - validationResult.validatedCount) > 0 && (
                <> · {validationResult.totalCount - validationResult.validatedCount} have errors</>
              )}
              {' '}
              <button
                type="button"
                onClick={() => { setViewValidOnly(true); setViewInvalidOnly(false) }}
                className="underline text-black font-semibold hover:text-black/80 focus:outline-none"
              >
                Show verified records
              </button>
              {' · '}
              <button
                type="button"
                onClick={() => { setViewInvalidOnly(true); setViewValidOnly(false); setCurrentPage(1) }}
                className="underline text-black font-semibold hover:text-black/80 focus:outline-none"
              >
                Show unverified Records
              </button>
            </p>
            <button
              type="button"
              onClick={() => setValidationNotificationDismissed(true)}
              className="shrink-0 p-1 rounded-full text-black hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current"
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : showAttributesPrefilledNotification ? (
        <ScopedNotificationBar
          variant="info"
          message="Attributes pre-filled based on 47 similar past orders for SDWAN/ HDFC Bank / 500089. Review and adjust as needed."
          onDismiss={onDismissAttributesPrefilled}
        />
      ) : !scopedNotificationDismissed ? (
        <ScopedNotificationBar
          variant="info"
          locationsCount={uniqueLocationsCount}
          productsCount={productsCount}
          onDismiss={() => setScopedNotificationDismissed(true)}
        />
      ) : null}
      {/* Match warning: X matched, Y unmatched; View Unmatched records link (orange) */}
      {matchSummaryNotification && !matchWarningDismissed && !hideMatchSummaryNotification && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-500" role="status">
            <span className="flex items-center justify-center shrink-0" aria-hidden="true">
              <svg className="w-5 h-5 text-black shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </span>
            <p className="text-sm font-medium flex-1 min-w-0 text-black">
              {matchSummaryNotification.matchedCount} records were successfully matched and {matchSummaryNotification.unmatchedCount} records were unmatched.{' '}
              <button
                type="button"
                onClick={() => { setViewUnmatchedOnly(true); setMatchWarningDismissed(true); setCurrentPage(1) }}
                className="underline text-black font-semibold hover:text-black/80 focus:outline-none"
              >
                View Unmatched records
              </button>
            </p>
            <button
              type="button"
              onClick={() => setMatchWarningDismissed(true)}
              className="shrink-0 p-1 rounded-full text-black hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current"
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Table toolbar */}
      <div className="flex flex-col gap-3 p-4 border-b border-gray-200">
        {/* Row 1: Filter by (left) | Search group (right) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center" ref={filterByAnchorRef}>
              <span className="text-xs text-gray-600 mr-2">Filter by</span>
              <button
                type="button"
                onClick={() => setFilterByOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-airtel-red"
                aria-expanded={filterByOpen}
              >
                All
                <svg className="w-4 h-4 text-airtel-red" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {filterByOpen && (
                <div className="absolute left-0 top-full mt-1 z-30 w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-xs">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Requested Products</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => { setConfidenceLevelDropdownOpen(false); setMatchedProductDropdownOpen(false); setMediaDropdownOpen(false); setRequestedProductDropdownOpen((o) => !o) }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-left text-xs text-gray-600"
                        >
                          <span>{requestedProductFilter == null ? 'All Products' : requestedProductFilter}</span>
                          <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {requestedProductDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-0.5 py-0.5 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button type="button" onClick={() => { setRequestedProductFilter(null); setRequestedProductDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">All Products</button>
                            {REQUESTED_PRODUCTS.map((p) => (
                              <button key={p} type="button" onClick={() => { setRequestedProductFilter(p); setRequestedProductDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">{p}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Confidence Level</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => { setRequestedProductDropdownOpen(false); setMatchedProductDropdownOpen(false); setMediaDropdownOpen(false); setConfidenceLevelDropdownOpen((o) => !o) }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-left text-xs text-gray-600"
                        >
                          <span>
                            {confidenceLevelFilter == null
                              ? 'All Confidence Levels'
                              : CONFIDENCE_LEVEL_OPTIONS.find((o) => o.value === confidenceLevelFilter)?.label ?? 'All Confidence Levels'}
                          </span>
                          <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {confidenceLevelDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-0.5 py-0.5 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button type="button" onClick={() => { setConfidenceLevelFilter(null); setConfidenceLevelDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">All Confidence Levels</button>
                            {CONFIDENCE_LEVEL_OPTIONS.map((o) => (
                              <button key={o.value} type="button" onClick={() => { setConfidenceLevelFilter(o.value); setConfidenceLevelDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">{o.label}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Matched Products</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => { setRequestedProductDropdownOpen(false); setConfidenceLevelDropdownOpen(false); setMediaDropdownOpen(false); setMatchedProductDropdownOpen((o) => !o) }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-left text-xs text-gray-600"
                        >
                          <span>{matchedProductFilter == null ? 'All Matched Products' : matchedProductFilter}</span>
                          <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {matchedProductDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-0.5 py-0.5 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                            <button type="button" onClick={() => { setMatchedProductFilter(null); setMatchedProductDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">All Matched Products</button>
                            {ALL_MATCHED_PRODUCT_OPTIONS.map((p) => (
                              <button key={p} type="button" onClick={() => { setMatchedProductFilter(p); setMatchedProductDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">{p}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Media</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => { setRequestedProductDropdownOpen(false); setConfidenceLevelDropdownOpen(false); setMatchedProductDropdownOpen(false); setMediaDropdownOpen((o) => !o) }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-left text-xs text-gray-600"
                        >
                          <span>{mediaFilter == null ? 'All Media' : mediaFilter}</span>
                          <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {mediaDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-0.5 py-0.5 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button type="button" onClick={() => { setMediaFilter(null); setMediaDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">All Media</button>
                            {OTHER_FIELDS.technology.map((t) => (
                              <button key={t} type="button" onClick={() => { setMediaFilter(t); setMediaDropdownOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-grey-bg">{t}</button>
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
              <input
                type="text"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setShowSearchSuggestions(true) }}
                onFocus={() => { if (searchInput.trim()) setShowSearchSuggestions(true) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchFilter(searchInput.trim() || null)
                    setShowSearchSuggestions(false)
                  }
                }}
                placeholder="Search this list"
                className="pl-3 pr-9 py-1.5 border border-gray-300 rounded-lg text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                aria-autocomplete="list"
                aria-expanded={showSearchSuggestions && searchSuggestions.length > 0}
              />
              {(searchFilter != null && String(searchFilter).trim() !== '') || (searchInput != null && String(searchInput).trim() !== '') ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchFilter(null)
                    setSearchInput('')
                    setShowSearchSuggestions(false)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {searchSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSearchInput(s)
                        setSearchFilter(s)
                        setShowSearchSuggestions(false)
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-grey-bg truncate"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleMatchAllProducts}
              className="px-4 py-1.5 rounded-md border border-gray-300 bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg"
            >
              Match All Products
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs border-b border-gray-200">
        <p className="text-gray-600">
          Showing {viewSelectedOnly ? (totalRows ? 1 : 0) : (totalRows ? (currentPage - 1) * PAGE_SIZE + 1 : 0)} to {viewSelectedOnly ? rowsToDisplay.length : (totalRows ? Math.min(currentPage * PAGE_SIZE, totalRows) : 0)} of {effectiveRecordCount} records • {selectedRowIds.size} Records selected
          {viewInvalidOnly && validationByRowId && (
            <span> • Showing only unvalidated records</span>
          )}
          {viewValidOnly && validationByRowId && (
            <span> • Showing only validated records</span>
          )}
          {viewUnmatchedOnly && (
            <span> • Showing only unmatched records</span>
          )}
          {statusExtras.length > 0 && !viewSelectedOnly && statusExtras.map((extra) => <span key={extra}> • {extra}</span>)}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            disabled={selectedRowIds.size === 0}
            onClick={() => selectedRowIds.size > 0 && setViewSelectedOnly(true)}
            className={`font-medium ${selectedRowIds.size > 0 ? 'text-airtel-red hover:underline cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
          >
            View selected ({selectedRowIds.size})
          </button>
          <span className="text-gray-600">•</span>
          <button
            type="button"
            onClick={() => {
              setViewSelectedOnly(false)
              setViewUnmatchedOnly(false)
              setViewInvalidOnly(false)
              setViewValidOnly(false)
              setRequestedProductFilter(null)
              setConfidenceLevelFilter(null)
              setMatchedProductFilter(null)
              setMediaFilter(null)
              setSearchFilter(null)
              setSearchInput('')
              setCurrentPage(1)
            }}
            className="text-airtel-red hover:underline font-medium"
          >
            Show all records
          </button>
        </div>
      </div>
      </div>

      {/* List view: table – white background (screenshot 1) */}
      {/* Table: first 10 rows in scrollable area; row 11 (Load more) fixed at bottom; no blank row space */}
      <div className="overflow-x-auto flex flex-col min-h-0 bg-white" style={{ height: '24rem' }}>
        {/* Scrollable: fixed height for 10 rows so all 10 visible without scrolling */}
        <div className="relative overflow-y-auto border-b border-gray-200 min-h-0 bg-white" style={{ height: '22rem' }}>
          {(validationInProgress || isMatchLoading || revealMatchedResultsInProgress) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/90" aria-live="polite">
              <div className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {(isMatchLoading || revealMatchedResultsInProgress) ? 'Products are getting matched' : 'Verification in progress...'}
              </p>
            </div>
          )}
          <table className="w-full text-xs leading-tight table-fixed">
            <colgroup>
              <col className="w-10" />
              <col style={getColStyle('streetAddress')} />
              <col style={getColStyle('postalCode')} />
              {isMacdQuote && <col style={getColStyle('assetName')} />}
              {isMacdQuote && <col style={getColStyle('lsi')} />}
              <col style={getColStyle('requestedProducts')} />
              <col style={getColStyle('matchedProducts')} />
              <col style={getColStyle('media')} />
              {isMacdQuote && <col style={getColStyle('newMedia')} />}
              <col style={getColStyle('attributes')} />
              {isMacdQuote && <col style={getColStyle('newAttributes')} />}
              <col style={getColStyle('confidenceLevel')} />
              <col style={getColStyle('errorDetails')} />
              <col className="w-9" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-white border-b border-gray-200">
                <th className="w-10 pl-4 pr-2 py-1 text-left shrink-0">
                  <input
                    type="checkbox"
                    ref={selectAllCheckboxRef}
                    checked={groupedRows.length > 0 && selectedRowIds.size === groupedRows.length}
                    onChange={() => {
                      if (selectedRowIds.size === groupedRows.length) {
                        setSelectedRowIds(new Set())
                      } else {
                        setSelectedRowIds(new Set(groupedRows.map((r) => r.id)))
                      }
                    }}
                    className="rounded-md border-gray-300 text-airtel-red focus:ring-airtel-red w-3.5 h-3.5"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="Street Address" style={getColStyle('streetAddress')}><span className="block truncate">Street Address</span><ResizeHandle columnId="streetAddress" /></th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="Postal Code" style={getColStyle('postalCode')}><span className="block truncate">Postal Code</span><ResizeHandle columnId="postalCode" /></th>
                {isMacdQuote && <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="Asset Name" style={getColStyle('assetName')}><span className="block truncate">Asset Name</span><ResizeHandle columnId="assetName" /></th>}
                {isMacdQuote && <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="LSI" style={getColStyle('lsi')}><span className="block truncate">LSI</span><ResizeHandle columnId="lsi" /></th>}
                <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="Requested Products" style={getColStyle('requestedProducts')}>
                  <span className="inline-flex items-center gap-0.5 truncate max-w-full">
                    Requested Products
                    {viewByValue === 'Requested Products' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewBySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc')) }}
                        className="p-0.5 rounded hover:bg-grey-bg focus:outline-none focus:ring-1 focus:ring-gray-400"
                        title={viewBySortDirection === 'asc' ? 'Show descending order (click to toggle)' : 'Show ascending order (click to toggle)'}
                        aria-label={`Sort by Requested Products ${viewBySortDirection === 'asc' ? 'descending' : 'ascending'}`}
                      >
                        <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          {viewBySortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      </button>
                    )}
                  </span>
                  <ResizeHandle columnId="requestedProducts" />
                </th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="Matched Products" style={getColStyle('matchedProducts')}><span className="block truncate">Matched Products</span><ResizeHandle columnId="matchedProducts" /></th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title={isMacdQuote ? 'Old Media' : 'Media'} style={getColStyle('media')}>
                  <span className="inline-flex items-center gap-0.5 truncate max-w-full">
                    {isMacdQuote ? 'Old Media' : 'Media'}
                    {viewByValue === 'Media' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewBySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc')) }}
                        className="p-0.5 rounded hover:bg-grey-bg focus:outline-none focus:ring-1 focus:ring-gray-400"
                        title={viewBySortDirection === 'asc' ? 'Show Fiber first (click to show Copper first)' : 'Show Copper first (click to show Fiber first)'}
                        aria-label={`Sort by Media ${viewBySortDirection === 'asc' ? 'descending' : 'ascending'}`}
                      >
                        <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          {viewBySortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      </button>
                    )}
                  </span>
                  <ResizeHandle columnId="media" />
                </th>
                {isMacdQuote && <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="New Media" style={getColStyle('newMedia')}><span className="block truncate">New Media</span><ResizeHandle columnId="newMedia" /></th>}
                <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title={isMacdQuote ? 'Old Attributes' : 'Attributes'} style={getColStyle('attributes')}><span className="block truncate">{isMacdQuote ? 'Old Attributes' : 'Attributes'}</span><ResizeHandle columnId="attributes" /></th>
                {isMacdQuote && <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="New Attributes" style={getColStyle('newAttributes')}><span className="block truncate">New Attributes</span><ResizeHandle columnId="newAttributes" /></th>}
                <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="Confidence Level" style={getColStyle('confidenceLevel')}>
                  <span className="inline-flex items-center gap-0.5 truncate max-w-full">
                    Confidence Level
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfidenceSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                      }}
                      className="p-0.5 rounded hover:bg-grey-bg focus:outline-none focus:ring-1 focus:ring-gray-400"
                      title={confidenceSortDirection === 'desc' ? 'Sort ascending (low to high)' : 'Sort descending (high to low)'}
                      aria-label={`Sort by Confidence Level ${confidenceSortDirection === 'desc' ? 'ascending' : 'descending'}`}
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        {confidenceSortDirection === 'asc' ? (
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        )}
                      </svg>
                    </button>
                  </span>
                  <ResizeHandle columnId="confidenceLevel" />
                </th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 truncate text-xs group relative" title="Error Details" style={getColStyle('errorDetails')}><span className="block truncate">Error Details</span><ResizeHandle columnId="errorDetails" /></th>
                <th className="w-9 px-2 py-1 shrink-0" aria-label="Row actions" />
              </tr>
            </thead>
            <tbody>
              {tbodyItems.map((item, idx) =>
                item.type === 'group' ? (
                  <tr key={`group-${item.label}-${idx}`} className="bg-grey-bg border-b border-gray-200">
                    <td colSpan={effectiveColumnCount} className="pl-4 py-2 text-xs font-semibold text-gray-700">
                      {item.label}
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={item.row.id}
                    className="border-b border-gray-100 bg-white hover:bg-gray-50"
                  >
<td className="pl-4 pr-2 py-1 align-middle">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.has(item.row.id)}
                    onChange={() => {
                      setSelectedRowIds((prev) => {
                        const next = new Set(prev)
                        if (next.has(item.row.id)) next.delete(item.row.id)
                        else next.add(item.row.id)
                        return next
                      })
                    }}
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red w-3.5 h-3.5"
                    aria-label={`Select row ${item.row.id}`}
                  />
                </td>
                  <td className="px-2 py-1 text-gray-800 align-middle min-w-0">
                    <div className="truncate" title={item.row.streetAddress}>{item.row.streetAddress}</div>
                  </td>
                  <td
                    ref={editingCell?.rowId === item.row.id && editingCell?.column === 'postalCode' && selectedRowIds.size >= 2 ? postalCodeEditAnchorRef : null}
                    className="px-2 py-1 text-gray-800 align-middle min-w-0 group"
                  >
                    {editingCell?.rowId === item.row.id && editingCell?.column === 'postalCode' ? (
                      selectedRowIds.size >= 2 ? (
                        <div className="truncate" title={item.row.postalCode}>{item.row.postalCode}</div>
                      ) : (
                        <input
                          ref={postalCodeInputRef}
                          type="text"
                          defaultValue={item.row.postalCode}
                          className="w-full min-w-[5rem] px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            setCellEdits((prev) => ({ ...prev, [item.row.id]: { ...prev[item.row.id], postalCode: v || item.row.postalCode } }))
                            setLastUpdatedCells(new Set([cellKey(item.row.id, 'postalCode')]))
                            setEditingCell(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur()
                            if (e.key === 'Escape') { setEditingCell(null); e.target.value = item.row.postalCode }
                          }}
                          autoFocus
                        />
                      )
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate" title={item.row.postalCode}>{item.row.postalCode}</span>
                        {lastUpdatedCells.has(cellKey(item.row.id, 'postalCode')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyPostalCodeToSelected(true); setEditingCell({ rowId: item.row.id, column: 'postalCode' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-grey-bg focus:outline-none"
                          aria-label="Edit postal code"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  {isMacdQuote && (
                    <td className="px-2 py-1 text-gray-800 align-middle min-w-0">
                      <div className="truncate" title={item.row.assetName}>{item.row.assetName}</div>
                    </td>
                  )}
                  {isMacdQuote && (
                    <td className="px-2 py-1 text-gray-800 align-middle min-w-0">
                      <div className="truncate" title={item.row.lsi}>{item.row.lsi}</div>
                    </td>
                  )}
                  <td
                    ref={editingCell?.rowId === item.row.id && editingCell?.column === 'requestedProducts' && selectedRowIds.size >= 2 ? bulkEditAnchorRef : null}
                    className="px-2 py-1 text-gray-800 align-middle min-w-0 group"
                  >
                    {editingCell?.rowId === item.row.id && editingCell?.column === 'requestedProducts' ? (
                      selectedRowIds.size >= 2 ? (
                        <div className="truncate" title={item.row.requestedProducts}>{item.row.requestedProducts}</div>
                      ) : (
                        <select
                          value={item.row.requestedProducts}
                          onChange={(e) => {
                            const v = e.target.value
                            setCellEdits((prev) => ({ ...prev, [item.row.id]: { ...prev[item.row.id], requestedProducts: v } }))
                            setLastUpdatedCells(new Set([cellKey(item.row.id, 'requestedProducts')]))
                            setEditingCell(null)
                          }}
                          onBlur={() => setEditingCell(null)}
                          className="w-full min-w-[6rem] px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          autoFocus
                        >
                          {REQUESTED_PRODUCTS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate" title={item.row.requestedProducts}>
                          {item.row.requestedProducts}
                        </span>
                        {lastUpdatedCells.has(cellKey(item.row.id, 'requestedProducts')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: item.row.id, column: 'requestedProducts' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-grey-bg focus:outline-none"
                          aria-label="Edit requested products"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  <td
                    ref={editingCell?.rowId === item.row.id && editingCell?.column === 'matchedProducts' && selectedRowIds.size >= 2 ? bulkEditAnchorRef : null}
                    className="px-2 py-1 text-gray-800 align-middle min-w-0 group"
                  >
                    {isMatchLoading ? (
                      <span className="inline-flex items-center justify-center text-gray-400" aria-hidden="true">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </span>
                    ) : editingCell?.rowId === item.row.id && editingCell?.column === 'matchedProducts' ? (
                      selectedRowIds.size >= 2 ? (
                        <div className="truncate" title={item.row.matchedProducts || '---'}>{item.row.matchedProducts || '---'}</div>
                      ) : (
                      <select
                        value={item.row.matchedProducts || getCategoryForRequestedProduct(item.row.requestedProducts) || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          // Current status from merged row (same rule when filter by Matching Status is Partial/Pending: use this row’s status for transition)
                          const currentStatus = item.row.matchingStatus || matchResults[item.row.id]?.matchingStatus || ''
                          const status = getNextMatchingStatus(currentStatus)
                          const confidenceLevel = getConfidenceLevelForMatchingStatus(status)
                          // Attributes column should reflect the new matched product (v), not the requested product
                          const attributes = getAttributesForProduct(v)
                          // Row-level update only: by row id. Applies the same whether or not Filter by (e.g. Matching Status = Partial/Pending) is active; no other rows change.
                          setMatchResults((prev) => ({ ...prev, [item.row.id]: { ...prev[item.row.id], matchedProducts: v, matchingStatus: status, confidenceLevel, attributes } }))
                          setEditingCell(null)
                          onMatchedProductsEditComplete?.([item.row.id])
                          setLastUpdatedCells(new Set([cellKey(item.row.id, 'matchedProducts'), cellKey(item.row.id, 'attributes')]))
                        }}
                        onBlur={() => setEditingCell(null)}
                        className="w-full min-w-[8rem] px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        autoFocus
                      >
                        {ALL_MATCHED_PRODUCT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      )
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); if (PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(item.row.requestedProducts)]) openAttributesModal(item.row.id, item.row.requestedProducts, item.row.attributes) }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(item.row.requestedProducts)]) openAttributesModal(item.row.id, item.row.requestedProducts, item.row.attributes) } }}
                          className="truncate cursor-pointer hover:text-airtel-red hover:underline"
                          title={`${item.row.matchedProducts || '---'} (click to edit attributes)`}
                        >
                          {item.row.matchedProducts || '---'}
                        </span>
                        {lastUpdatedCells.has(cellKey(item.row.id, 'matchedProducts')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: item.row.id, column: 'matchedProducts' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-grey-bg focus:outline-none"
                          aria-label="Edit matched products"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  <td
                    ref={!isMacdQuote && editingCell?.rowId === item.row.id && editingCell?.column === 'technology' && selectedRowIds.size >= 2 ? bulkEditAnchorRef : null}
                    className="px-2 py-1 text-gray-800 align-middle min-w-0 group"
                  >
                    {!isMacdQuote && editingCell?.rowId === item.row.id && editingCell?.column === 'technology' ? (
                      selectedRowIds.size >= 2 ? (
                        <div className="truncate" title={item.row.technology}>{item.row.technology}</div>
                      ) : (
                        <select
                          value={item.row.technology}
                          onChange={(e) => {
                            const v = e.target.value
                            setCellEdits((prev) => ({ ...prev, [item.row.id]: { ...prev[item.row.id], technology: v } }))
                            setLastUpdatedCells(new Set([cellKey(item.row.id, 'technology')]))
                            setEditingCell(null)
                          }}
                          onBlur={() => setEditingCell(null)}
                          className="w-full min-w-[5rem] px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          autoFocus
                        >
                          {OTHER_FIELDS.technology.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )
                    ) : isMacdQuote ? (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate" title={item.row.technology}>{item.row.technology}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        {lastUpdatedCells.has(cellKey(item.row.id, 'technology')) && UPDATED_BADGE}
                        <span className="truncate" title={item.row.technology}>{item.row.technology}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: item.row.id, column: 'technology' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-grey-bg focus:outline-none"
                          aria-label="Edit technology"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  {isMacdQuote && (
                    <td
                      ref={editingCell?.rowId === item.row.id && editingCell?.column === 'newTechnology' && selectedRowIds.size >= 2 ? bulkEditAnchorRef : null}
                      className="px-2 py-1 text-gray-800 align-middle min-w-0 group"
                    >
                      {editingCell?.rowId === item.row.id && editingCell?.column === 'newTechnology' ? (
                        selectedRowIds.size >= 2 ? (
                          <div className="truncate" title={item.row.newTechnology}>{item.row.newTechnology}</div>
                        ) : (
                          <select
                            value={item.row.newTechnology}
                            onChange={(e) => {
                              const v = e.target.value
                              setCellEdits((prev) => ({ ...prev, [item.row.id]: { ...prev[item.row.id], newTechnology: v } }))
                              setLastUpdatedCells(new Set([cellKey(item.row.id, 'newTechnology')]))
                              setEditingCell(null)
                            }}
                            onBlur={() => setEditingCell(null)}
                            className="w-full min-w-[5rem] px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            autoFocus
                          >
                            {OTHER_FIELDS.technology.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )
                      ) : (
                        <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                          {lastUpdatedCells.has(cellKey(item.row.id, 'newTechnology')) && UPDATED_BADGE}
                          <span className="truncate" title={item.row.newTechnology}>{item.row.newTechnology}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: item.row.id, column: 'newTechnology' }) }}
                            className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-grey-bg focus:outline-none"
                            aria-label="Edit New Media"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-2 py-1 text-gray-800 align-middle min-w-0 group">
                    <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                      <span className="truncate" title={item.row.attributes || (isMacdQuote ? 'Old Attributes' : 'Edit attributes')}>
                        {item.row.attributes}
                      </span>
                      {lastUpdatedCells.has(cellKey(item.row.id, 'attributes')) && UPDATED_BADGE}
                      {!isMacdQuote && PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(item.row.requestedProducts)] && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openAttributesModal(item.row.id, item.row.requestedProducts, item.row.attributes) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-grey-bg focus:outline-none"
                          aria-label="Edit attributes"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  {isMacdQuote && (
                    <td className="px-2 py-1 text-gray-800 align-middle min-w-0 group">
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); if (PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(item.row.requestedProducts)]) openNewAttributesModal(item.row.id, item.row.requestedProducts, item.row.newAttributes) }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(item.row.requestedProducts)]) openNewAttributesModal(item.row.id, item.row.requestedProducts, item.row.newAttributes) } }}
                            className="truncate cursor-pointer hover:text-airtel-red hover:underline"
                            title={`${item.row.newAttributes || '—'} (click to edit New Attributes)`}
                          >
                            {item.row.newAttributes || '—'}
                          </span>
                          {lastUpdatedCells.has(cellKey(item.row.id, 'newAttributes')) && UPDATED_BADGE}
                          {PRODUCT_ATTRIBUTES[getCategoryForRequestedProduct(item.row.requestedProducts)] && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openNewAttributesModal(item.row.id, item.row.requestedProducts, item.row.newAttributes) }}
                              className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-grey-bg focus:outline-none"
                              aria-label="Edit New Attributes"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                              </svg>
                            </button>
                          )}
                        </div>
                    </td>
                  )}
                  <td className="px-2 py-1 text-gray-800 align-middle min-w-0">
                    <div className="truncate flex items-center gap-1" title={`${item.row.confidenceLevel}%`}>
                      <span>{item.row.confidenceLevel}%</span>
                      {lastUpdatedCells.has(cellKey(item.row.id, 'matchedProducts')) && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" title="Updated with status" aria-hidden />
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1 text-gray-800 align-middle min-w-0">
                    {(() => {
                      const validationErr = validationByRowId?.[item.row.id] && !validationByRowId[item.row.id].valid ? validationByRowId[item.row.id].reasoning : null
                      const matchErr = item.row.errorDetails
                      const err = validationErr || matchErr
                      return err ? (
                        <span className="truncate block text-gray-700" title={err}>{err}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    })()}
                  </td>
                  <td className="px-2 py-1 align-middle">
                    <div
                      className="relative inline-block"
                      ref={openMenuRowId === item.row.id ? menuAnchorRef : null}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuRowId((prev) => (prev === item.row.id ? null : item.row.id))
                        }}
                        className="w-8 h-8 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 shrink-0 shadow-sm"
                        aria-label="Row actions"
                        aria-expanded={openMenuRowId === item.row.id}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {openMenuRowId === item.row.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 min-w-[6rem] py-1 bg-white border border-gray-300 rounded shadow-sm">
                          <button
                            type="button"
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-grey-bg"
                            onClick={() => {
                              setDeleteModalRow({ id: item.row.id, streetAddress: item.row.streetAddress })
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
              )
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination: Previous, Page X of Y, Next — centre aligned; red secondary button style */}
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
              Are you sure you want to delete the requested product for {deleteModalRow.streetAddress}?
            </p>
            {selectedRowIds.size >= 2 && (
              <div className="shrink-0 px-5 py-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyDeleteToSelectedRows}
                    onChange={(e) => setApplyDeleteToSelectedRows(e.target.checked)}
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                  />
                  <span className="text-sm text-gray-700">Delete selected ({selectedRowIds.size}) items</span>
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
                  if (applyDeleteToSelectedRows && selectedRowIds.size >= 2) {
                    setDeletedIds((prev) => new Set([...prev, ...selectedRowIds]))
                    setSelectedRowIds(new Set())
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
    </>
  )
}

export default DataTableSection
