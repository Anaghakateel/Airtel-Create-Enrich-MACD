/**
 * Select Quote Line Items page (Enrich Quote flow).
 * Table of line items built from quote locations; row selection, overflow menu with Delete, delete modal (single + bulk), repeated LSI badge, filters, pagination.
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useResizableColumns } from '../hooks/useResizableColumns'

const PAGE_SIZE = 10
const FILTER_ALL = 'All'

const BILLING_LEGAL_ENTITIES = ['Bharti Airtel Services Ltd', 'Bharti Airtel Ltd', 'AES-Carrier', 'XTELIFY LIMITED', 'NXTRA DATA LIMITED', 'Bharti Airtel Hongkong Ltd', 'Bharti Airtel (France) SAS', 'Bharti Airtel USA Ltd', 'Bharti Airtel (UK) Limited', 'Bharti Airtel Singapore Ltd']
const BILLING_DETAILS_TYPES = ['New Billing Account', 'Existing Billing Account']
const BILLING_STORES = ['Store 1', 'Store 2']
const BILLING_LEVELS = ['Account Level', 'PO Level', 'LSI Level']
const BILLING_FREQUENCIES = ['Advanced Half-Yearly 365', 'Advanced Monthly 365', 'Advanced Monthly Billing', 'Advanced Odd Quarterly Billing', 'Advanced Odd Yearly Billing', 'Advanced Odd Half Yearly Billing', 'Advanced Quarterly 365', 'Advanced Quarterly Billing', 'Advanced Second Month of Odd Quarter', 'Advanced Third Month of Odd Quarter']
const BILLING_CREDIT_PERIODS = ['15 Days', '30 Days']
const BILLING_DISPATCH_METHODS = ['No Dispatch', 'CD', 'Paper-Center + E-mail', 'E-mail', 'Paper-Circle + E-mail', 'Paper-Center']
const BILLING_MODES = ['Prepaid', 'Postpaid']
const BILLING_PAYMENT_METHODS = ['NEFT', 'Card', 'Cheque', 'DD', 'RTGS']

// 3 Billing Contact Person names shown across the list (with salutation)
const BILLING_CONTACT_NAMES = ['Mrs. Priya Sharma', 'Mr. Rahul Verma', 'Mrs. Anita Krishnan']

// Build line items from locations (from Summary/Locations continue). LSI shared across 2–3 rows for demo.
function buildLineItemsFromQuote1(locations) {
  if (!Array.isArray(locations) || locations.length === 0) return []
  const products = ['Internet', 'SD WAN', 'MPLS']
  const medias = ['Fiber', 'Copper']
  const bandwidths = ['10 Mbps', '100 Mbps', '1 Gbps']
  return locations.map((loc, i) => {
    const g = Math.floor(i / 3) + 1
    return {
      id: loc.id ?? `line-${i + 1}`,
      lastEnrichedDate: '01/15/2025',
      lsi: `80260000478${String(g).padStart(2, '0')}...`,
      lineNumber: i + 1,
      address: loc.streetAddress || loc.city || '—',
      state: loc.state || '—',
      productName: products[i % products.length],
      media: medias[i % medias.length],
      bandwidth: bandwidths[i % bandwidths.length],
      quantity: 1,
      billingContactPerson: BILLING_CONTACT_NAMES[i % BILLING_CONTACT_NAMES.length],
      gstApplicable: 'Billing GST',
      billingDetailsSummary: BILLING_LEVELS[i % BILLING_LEVELS.length],
      billingLegalEntity: BILLING_LEGAL_ENTITIES[i % BILLING_LEGAL_ENTITIES.length],
      billingBillDetailsType: BILLING_DETAILS_TYPES[i % 2],
      billingStore: BILLING_STORES[i % 2],
      billingFrequency: BILLING_FREQUENCIES[i % BILLING_FREQUENCIES.length],
      billingCreditPeriod: BILLING_CREDIT_PERIODS[i % 2],
      billingDispatchMethod: BILLING_DISPATCH_METHODS[i % BILLING_DISPATCH_METHODS.length],
      billingMode: 'Postpaid',
      billingPaymentMethod: 'NEFT',
      poGroupSummary: `PO-${i + 1}`,
      poNumber: `PO-${i + 1}`,
      poReceivedDate: `2025-01-${String(Math.min(15 + (i % 15), 28)).padStart(2, '0')}`,
      poAmount: `${(50000 + (i % 5) * 10000).toLocaleString('en-IN')}`,
      poExpiryDate: `2026-01-${String(Math.min(10 + (i % 18), 28)).padStart(2, '0')}`,
      poExpiryType: ['Fixed Date', 'No Expiry', 'Auto Renew'][i % 3],
      poTerms: ['1', '3', '6', '12', '24', '36'][i % 6],
      poOeReceivedDate: `2025-01-${String(Math.min(5 + (i % 10), 28)).padStart(2, '0')}`,
      invoiceShippingDetails: 'Same as BCP Address',
      invoiceShippingStreet: loc.streetAddress || loc.address || '—',
      invoiceShippingCity: loc.city || '—',
      invoiceShippingState: loc.state || '—',
      invoiceShippingCountry: loc.country || 'India',
      invoiceShippingPincode: loc.pincode || loc.postalCode || '—',
    }
  })
}

function getFallbackLineItems() {
  const items = []
  for (let i = 1; i <= 25; i++) {
    const g = Math.floor((i - 1) / 3) + 1
    items.push({
      id: `fallback-${i}`,
      lastEnrichedDate: '01/15/2025',
      lsi: `80260000478${String(g).padStart(2, '0')}...`,
      lineNumber: i,
      address: `${100 + i}, Sample St, City, State, India`,
      state: ['Karnataka', 'Maharashtra', 'Tamil Nadu'][(i - 1) % 3],
      productName: ['Internet', 'SD WAN', 'MPLS'][(i - 1) % 3],
      media: i % 2 === 0 ? 'Fiber' : 'Copper',
      bandwidth: '100 Mbps',
      quantity: 1,
      billingContactPerson: BILLING_CONTACT_NAMES[(i - 1) % BILLING_CONTACT_NAMES.length],
      gstApplicable: ['Billing GST', 'Delivery GST'][(i - 1) % 2],
      billingDetailsSummary: BILLING_LEVELS[(i - 1) % BILLING_LEVELS.length],
      billingLegalEntity: BILLING_LEGAL_ENTITIES[(i - 1) % BILLING_LEGAL_ENTITIES.length],
      billingBillDetailsType: BILLING_DETAILS_TYPES[(i - 1) % 2],
      billingStore: BILLING_STORES[(i - 1) % 2],
      billingFrequency: BILLING_FREQUENCIES[(i - 1) % BILLING_FREQUENCIES.length],
      billingCreditPeriod: BILLING_CREDIT_PERIODS[(i - 1) % 2],
      billingDispatchMethod: BILLING_DISPATCH_METHODS[(i - 1) % BILLING_DISPATCH_METHODS.length],
      billingMode: 'Postpaid',
      billingPaymentMethod: 'NEFT',
      poGroupSummary: `PO-${i}`,
      poNumber: `PO-${i}`,
      poReceivedDate: `2025-01-${String(Math.min(15 + ((i - 1) % 15), 28)).padStart(2, '0')}`,
      poAmount: `${(50000 + ((i - 1) % 5) * 10000).toLocaleString('en-IN')}`,
      poExpiryDate: `2026-01-${String(Math.min(10 + ((i - 1) % 18), 28)).padStart(2, '0')}`,
      poExpiryType: ['Fixed Date', 'No Expiry', 'Auto Renew'][(i - 1) % 3],
      poTerms: ['1', '3', '6', '12', '24', '36'][(i - 1) % 6],
      poOeReceivedDate: `2025-01-${String(Math.min(5 + ((i - 1) % 10), 28)).padStart(2, '0')}`,
      invoiceShippingDetails: 'Same as BCP Address',
      invoiceShippingStreet: `${100 + i}, Sample St`,
      invoiceShippingCity: ['Bangalore', 'Mumbai', 'Chennai'][(i - 1) % 3],
      invoiceShippingState: ['Karnataka', 'Maharashtra', 'Tamil Nadu'][(i - 1) % 3],
      invoiceShippingCountry: 'India',
      invoiceShippingPincode: ['560001', '400001', '600001'][(i - 1) % 3],
    })
  }
  return items
}

const FALLBACK_LINE_ITEMS = getFallbackLineItems()

// Column order: Last Enriched Date first, LSI second, then Line Number, Address, State, Products, Media, Bandwidth, Quantity, Billing Contact Person, Billing..., PO..., Invoice Shipping Details, GST app
const COLUMNS = [
  { key: 'lastEnrichedDate', label: 'Last Enriched Date' },
  { key: 'lsi', label: 'LSI' },
  { key: 'lineNumber', label: 'Line Number' },
  { key: 'address', label: 'Address' },
  { key: 'state', label: 'State' },
  { key: 'productName', label: 'Products' },
  { key: 'media', label: 'Media' },
  { key: 'bandwidth', label: 'Bandwidth' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'billingContactPerson', label: 'Billing Contact Person' },
]
const BILLING_DETAILS_LABEL = 'Billing...'
const PO_GROUP_LABEL = 'PO...'
const INVOICE_SHIPPING_LABEL = 'Invoice Shipping Details'
const INVOICE_SHIPPING_OPTIONS = [
  { value: 'Same as BCP Address', label: 'Same as BCP Address' },
  { value: 'New Invoice', label: 'New Invoice' },
]
const GST_APPLICABLE_LABEL = 'GST app'
const GST_OPTIONS = ['Billing GST', 'Delivery GST']

const ALWAYS_VISIBLE_COLUMN_KEYS = ['lastEnrichedDate', 'lsi', 'lineNumber', 'address', 'state', 'productName']
const COLUMN_FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'media', label: 'Media' },
  { key: 'bandwidth', label: 'Bandwidth' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'billingContactPerson', label: 'Billing Contact Person' },
  { key: 'billingDetails', label: 'Billing Details' },
  { key: 'poGroup', label: 'PO Group' },
  { key: 'invoiceShippingDetails', label: 'Invoice Shipping Details' },
  { key: 'gstApplicable', label: 'GST applicable' },
]
const COLUMN_FILTER_KEYS = COLUMN_FILTER_OPTIONS.filter((o) => o.key !== 'all').map((o) => o.key)

const BILLING_SUB_COLUMNS = [
  { key: 'billingLegalEntity', label: 'Legal Entity' },
  { key: 'billingBillDetailsType', label: 'Bill Details Type' },
  { key: 'billingStore', label: 'Store' },
  { key: 'billingDetailsSummary', label: 'Billing level' },
  { key: 'billingFrequency', label: 'Billing Frequency' },
  { key: 'billingCreditPeriod', label: 'Credit Period' },
  { key: 'billingDispatchMethod', label: 'Bill dispatch method' },
  { key: 'billingMode', label: 'Bill Mode' },
  { key: 'billingPaymentMethod', label: 'Bill Payment Method' },
]
const PO_EXPIRY_TYPES = ['Fixed Date', 'No Expiry', 'Auto Renew']
const PO_TERMS_MONTHS = ['1', '3', '6', '12', '24', '36']
const PO_SUB_COLUMNS = [
  { key: 'poNumber', label: 'PO' },
  { key: 'poReceivedDate', label: 'PO Received Date' },
  { key: 'poAmount', label: 'PO Amount' },
  { key: 'poExpiryDate', label: 'PO Expiry Date' },
  { key: 'poExpiryType', label: 'PO Expiry Type' },
  { key: 'poTerms', label: 'PO terms (in months)' },
  { key: 'poOeReceivedDate', label: 'PO OE Received Date' },
]

const ENRICH_QUOTE_UPDATE_COLUMNS = {
  poGroup: ['poGroupSummary', 'poNumber', 'poReceivedDate', 'poAmount', 'poExpiryDate', 'poExpiryType', 'poTerms', 'poOeReceivedDate'],
  billing: ['billingDetailsSummary', 'billingLegalEntity', 'billingBillDetailsType', 'billingStore', 'billingFrequency', 'billingCreditPeriod', 'billingDispatchMethod', 'billingMode', 'billingPaymentMethod'],
  bcp: ['billingContactPerson'],
}

function getEnrichQuoteUpdateColumnsForIntent(intentText) {
  if (!intentText || typeof intentText !== 'string') return []
  const t = intentText.toLowerCase().trim()
  const cols = []
  if (/\b(change|update|modify)\s+(technical\s+)?attributes?\b/.test(t) || /\b(technical\s+)?attributes?\s+(change|update|modify)\b/.test(t) || /\btechnical\s+attributes?\b/.test(t)) cols.push('productName')
  if (/po\s*group|pogroup/.test(t)) cols.push(...ENRICH_QUOTE_UPDATE_COLUMNS.poGroup)
  if (/billing\s*details|billingdetails/.test(t)) {
    if (/legal\s*entity|legalentity/.test(t)) cols.push('billingLegalEntity')
    else cols.push(...ENRICH_QUOTE_UPDATE_COLUMNS.billing)
  }
  if (/\bbcp\b/.test(t)) cols.push(...ENRICH_QUOTE_UPDATE_COLUMNS.bcp)
  return [...new Set(cols)]
}

// Parse product filter from intent (e.g. "all Internet Products" -> "Internet", "SD WAN" -> "SD WAN")
function getProductFilterFromIntent(intentText) {
  if (!intentText || typeof intentText !== 'string') return null
  const t = intentText.trim()
  const products = ['Internet', 'SD WAN', 'MPLS', 'SDWAN']
  for (const p of products) {
    const re = new RegExp(`\\b${p.replace(/\s+/g, '\\s*')}\\b`, 'i')
    if (re.test(t)) return p === 'SDWAN' ? 'SD WAN' : p
  }
  return null
}

// Parse Legal Entity value from intent (e.g. "to 'Bharti Airtel Ltd'" or "to Bharti Airtel Ltd" -> "Bharti Airtel Ltd")
function getLegalEntityFromIntent(intentText) {
  if (!intentText || typeof intentText !== 'string') return null
  const m = intentText.match(/legal\s*entity\s+to\s+['"]([^'"]+)['"]/i) ||
    intentText.match(/to\s+['"]([^'"]+)['"]\s*(?:for|to|in)/i) ||
    intentText.match(/to\s+['"]([^'"]+)['"]/i) ||
    intentText.match(/legal\s*entity[^t]*to\s+([A-Za-z][A-Za-z0-9\s.,\-]+(?:Ltd|Limited|SAS|LLC)?)\s*$/i) ||
    intentText.match(/\bto\s+([A-Za-z][A-Za-z0-9\s.,\-]+(?:Ltd|Limited|SAS|LLC)?)\s*$/i)
  return m ? m[1].trim() : null
}

// Parse LSI filter from intent (e.g. "all LSI 8026000047801" or "LSI 8026000047801" -> "8026000047801")
function getLsiFilterFromIntent(intentText) {
  if (!intentText || typeof intentText !== 'string') return null
  const m = intentText.match(/\blsi\s+(\d{10,})/i) || intentText.match(/\b(\d{10,})\b/)
  return m ? m[1].trim() : null
}

// Parse BCP value from intent (e.g. "to Rahul Verma" or "to 'Rahul Verma'" -> "Rahul Verma")
function getBcpFromIntent(intentText) {
  if (!intentText || typeof intentText !== 'string') return null
  const m = intentText.match(/\bto\s+['"]([^'"]+)['"]/i) || intentText.match(/\bto\s+([A-Za-z][A-Za-z\s.-]+?)(?:\s+(?:for|in|all)|\s*$)/i)
  return m ? m[1].trim() : null
}

// Parse Technical Attributes overrides from intent (e.g. "routing type to Static" -> { routingType: 'Static' })
const ROUTING_TYPE_OPTIONS = ['Static', 'Private BGP', 'Static with Public BGP', 'Public BGP', 'Static with Private BGP', 'None']
function getTechnicalAttributesOverridesFromIntent(intentText) {
  if (!intentText || typeof intentText !== 'string') return null
  const t = intentText.trim()
  const overrides = {}
  const routingTypeMatch = t.match(/\brouting\s+type\s+to\s+([A-Za-z][A-Za-z0-9\s\-]*(?:\s+[A-Za-z]+)*)/i)
  if (routingTypeMatch) {
    const val = routingTypeMatch[1].trim()
    const match = ROUTING_TYPE_OPTIONS.find((opt) => opt.toLowerCase() === val.toLowerCase())
    if (match) overrides.routingType = match
  }
  return Object.keys(overrides).length ? overrides : null
}

export { getTechnicalAttributesOverridesFromIntent }

export default function SelectQuoteLineItemsPage({ onBack, quote1Locations = [], onTechnicalAttributesClick, enrichQuoteUpdateIntent, technicalAttributesConfiguredLocationIds }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [viewingSelectedOnly, setViewingSelectedOnly] = useState(false)
  const [deletedIds, setDeletedIds] = useState(() => new Set())
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteModalIds, setDeleteModalIds] = useState([])
  const [applyDeleteToSelectedRows, setApplyDeleteToSelectedRows] = useState(false)
  const [openRowMenuId, setOpenRowMenuId] = useState(null)
  const [rowMenuPosition, setRowMenuPosition] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterState, setFilterState] = useState(FILTER_ALL)
  const [filterProduct, setFilterProduct] = useState(FILTER_ALL)
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => new Set(COLUMN_FILTER_KEYS))
  const [columnFilterOpen, setColumnFilterOpen] = useState(false)
  const columnFilterAnchorRef = useRef(null)
  const columnFilterPopoverRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cellEdits, setCellEdits] = useState({})
  const [lastUpdatedCells, setLastUpdatedCells] = useState(() => new Set()) // Set of 'rowId_column' – show UPDATED badge until next change
  const cellKey = (rowId, col) => `${rowId}_${col}`
  const UPDATED_BADGE = (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-black bg-white border border-gray-300 shrink-0" title="Updated">Updated</span>
  )
  const [billingDetailsModalRow, setBillingDetailsModalRow] = useState(null)
  const [poGroupModalRow, setPoGroupModalRow] = useState(null)
  const [applyBillingDetailsToSelected, setApplyBillingDetailsToSelected] = useState(true)
  const [applyPoGroupToSelected, setApplyPoGroupToSelected] = useState(true)
  const [billingDetailsValidationErrors, setBillingDetailsValidationErrors] = useState({})
  const [bcpSearchQuery, setBcpSearchQuery] = useState('')
  const [bcpPopoverPosition, setBcpPopoverPosition] = useState(null)
  const bcpAnchorRef = useRef(null)
  const bcpPopoverRef = useRef(null)
  const [invoiceShippingPopoverPosition, setInvoiceShippingPopoverPosition] = useState(null)
  const [invoiceShippingPopoverSelection, setInvoiceShippingPopoverSelection] = useState(null)
  const invoiceShippingAnchorRef = useRef(null)
  const invoiceShippingPopoverRef = useRef(null)
  const [addBcpModalOpen, setAddBcpModalOpen] = useState(false)
  const [addBcpApplyToSelected, setAddBcpApplyToSelected] = useState(true)
  const [addBcpTargetIds, setAddBcpTargetIds] = useState([]) // row IDs to apply new BCP to when Save (from Add BCP flow)
  const [newBcpNames, setNewBcpNames] = useState([])
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
  const [existingInvoiceModalRow, setExistingInvoiceModalRow] = useState(null)
  const [existingInvoiceModalBulkIds, setExistingInvoiceModalBulkIds] = useState(null)
  const [applyNewInvoiceToSelectedIds, setApplyNewInvoiceToSelectedIds] = useState(true)
  const [newInvoiceStreet, setNewInvoiceStreet] = useState('')
  const [newInvoiceCity, setNewInvoiceCity] = useState('')
  const [newInvoiceState, setNewInvoiceState] = useState('')
  const [newInvoiceCountry, setNewInvoiceCountry] = useState('')
  const [newInvoicePincode, setNewInvoicePincode] = useState('')
  const [editingCell, setEditingCell] = useState(null) // { rowId, column: 'productName' | 'media' | 'bandwidth' | 'quantity' | 'billingContactPerson' | 'gstApplicable' }
  const [applyBulkEditToSelected, setApplyBulkEditToSelected] = useState(true)
  const [bulkEditPopoverPosition, setBulkEditPopoverPosition] = useState(null)
  const [bulkEditPopoverValue, setBulkEditPopoverValue] = useState('')
  const [billingModalLevel, setBillingModalLevel] = useState('')
  const [billingModalLegalEntity, setBillingModalLegalEntity] = useState('')
  const [billingModalBillDetailsType, setBillingModalBillDetailsType] = useState('')
  const [billingModalStore, setBillingModalStore] = useState('')
  const [billingModalFrequency, setBillingModalFrequency] = useState('')
  const [billingModalCreditPeriod, setBillingModalCreditPeriod] = useState('')
  const [billingModalDispatchMethod, setBillingModalDispatchMethod] = useState('')
  const [billingModalMode, setBillingModalMode] = useState('')
  const [billingModalPaymentMethod, setBillingModalPaymentMethod] = useState('')
  const [poModalNumber, setPoModalNumber] = useState('')
  const [poModalReceivedDate, setPoModalReceivedDate] = useState('')
  const [poModalAmount, setPoModalAmount] = useState('')
  const [poModalExpiryDate, setPoModalExpiryDate] = useState('')
  const [poModalExpiryType, setPoModalExpiryType] = useState('')
  const [poModalTerms, setPoModalTerms] = useState('')
  const [poModalOeReceivedDate, setPoModalOeReceivedDate] = useState('')
  const [poGroupValidationErrors, setPoGroupValidationErrors] = useState({})
  const [billingDetailsExpanded, setBillingDetailsExpanded] = useState(false)
  const [poDetailsExpanded, setPoDetailsExpanded] = useState(false)
  const rowMenuRef = useRef(null)
  const rowMenuPortalRef = useRef(null)
  const bulkEditAnchorRef = useRef(null)
  const prevVisibleColumnKeysRef = useRef(null)
  const enrichResizableCols = useMemo(() => [
    ...COLUMNS.map((c) => ({ id: c.key, label: c.label })),
    { id: 'billingDetails', label: BILLING_DETAILS_LABEL },
    { id: 'poGroup', label: PO_GROUP_LABEL },
    ...BILLING_SUB_COLUMNS.map((s) => ({ id: `billing_${s.key}`, label: s.label })),
    ...PO_SUB_COLUMNS.map((s) => ({ id: `po_${s.key}`, label: s.label })),
    { id: 'invoiceShippingDetails', label: INVOICE_SHIPPING_LABEL },
    { id: 'gstApplicable', label: GST_APPLICABLE_LABEL },
  ], [])
  const { getColStyle, ResizeHandle } = useResizableColumns(enrichResizableCols)
  const lastEnrichQuoteUpdateIntentRef = useRef(null)

  const getCellValue = (row, field) => cellEdits[row.id]?.[field] ?? row[field]

  const getInvoiceShippingAddressDisplay = (row) => {
    const street = getCellValue(row, 'invoiceShippingStreet') ?? row.invoiceShippingStreet ?? ''
    const city = getCellValue(row, 'invoiceShippingCity') ?? row.invoiceShippingCity ?? ''
    const state = getCellValue(row, 'invoiceShippingState') ?? row.invoiceShippingState ?? ''
    const country = getCellValue(row, 'invoiceShippingCountry') ?? row.invoiceShippingCountry ?? ''
    const pincode = getCellValue(row, 'invoiceShippingPincode') ?? row.invoiceShippingPincode ?? ''
    const parts = [street, city, state, country, pincode].filter((p) => p && String(p).trim() && p !== '—')
    return parts.length ? parts.join(', ') : '—'
  }

  const getInvoiceShippingDisplay = (row) => {
    return getInvoiceShippingAddressDisplay(row)
  }

  const showColumn = (key) => ALWAYS_VISIBLE_COLUMN_KEYS.includes(key) || visibleColumnKeys.size === 0 || visibleColumnKeys.has(key)

  // Auto-expand Billing Details and PO Group when explicitly selected in Displaying dropdown (not when "All" is selected)
  useEffect(() => {
    const isFiltered = visibleColumnKeys.size > 0 && visibleColumnKeys.size < COLUMN_FILTER_KEYS.length
    if (isFiltered) {
      setBillingDetailsExpanded(visibleColumnKeys.has('billingDetails'))
      setPoDetailsExpanded(visibleColumnKeys.has('poGroup'))
    }
  }, [visibleColumnKeys])

  const allLineItems = useMemo(
    () =>
      Array.isArray(quote1Locations) && quote1Locations.length > 0
        ? buildLineItemsFromQuote1(quote1Locations)
        : FALLBACK_LINE_ITEMS,
    [quote1Locations]
  )

  // When navigating from PO Change/Update flow, apply updates and show Updated badge on relevant columns for affected rows only
  useEffect(() => {
    if (!enrichQuoteUpdateIntent) {
      lastEnrichQuoteUpdateIntentRef.current = null
      return
    }
    const cols = getEnrichQuoteUpdateColumnsForIntent(enrichQuoteUpdateIntent)
    if (cols.length === 0) return
    const productFilter = getProductFilterFromIntent(enrichQuoteUpdateIntent)
    const lsiFilter = getLsiFilterFromIntent(enrichQuoteUpdateIntent)
    const legalEntity = getLegalEntityFromIntent(enrichQuoteUpdateIntent)
    const bcpValue = getBcpFromIntent(enrichQuoteUpdateIntent)
    const rows = allLineItems.filter((r) => {
      if (deletedIds.has(r.id)) return false
      if (productFilter) {
        const product = (cellEdits[r.id]?.productName ?? r.productName ?? '').toString().trim()
        if (product.toLowerCase() !== productFilter.toLowerCase()) return false
      }
      if (lsiFilter) {
        const lsi = (r.lsi ?? '').toString()
        if (!lsi.startsWith(lsiFilter) && !lsi.includes(lsiFilter)) return false
      }
      return true
    })
    // Apply updates when intent specifies values - only once per intent (avoid re-applying on effect re-runs)
    const isFirstApply = lastEnrichQuoteUpdateIntentRef.current !== enrichQuoteUpdateIntent
    if (isFirstApply) {
      if (legalEntity && cols.includes('billingLegalEntity')) {
        setCellEdits((prev) => {
          const next = { ...prev }
          rows.forEach((r) => {
            next[r.id] = { ...next[r.id], billingLegalEntity: legalEntity }
          })
          return next
        })
      }
      if (bcpValue && cols.includes('billingContactPerson')) {
        setCellEdits((prev) => {
          const next = { ...prev }
          rows.forEach((r) => {
            next[r.id] = { ...next[r.id], billingContactPerson: bcpValue }
          })
          return next
        })
      }
      lastEnrichQuoteUpdateIntentRef.current = enrichQuoteUpdateIntent
    }
    const keys = new Set(rows.flatMap((r) => cols.map((col) => cellKey(r.id, col))))
    setLastUpdatedCells(keys)
  }, [enrichQuoteUpdateIntent, allLineItems, deletedIds, cellEdits])

  // When returning from Technical Attributes Save, show Updated badge on address and productName for configured locations
  useEffect(() => {
    if (!technicalAttributesConfiguredLocationIds || (technicalAttributesConfiguredLocationIds instanceof Set && technicalAttributesConfiguredLocationIds.size === 0)) return
    const ids = technicalAttributesConfiguredLocationIds instanceof Set ? technicalAttributesConfiguredLocationIds : new Set(technicalAttributesConfiguredLocationIds || [])
    const rows = allLineItems.filter((r) => !deletedIds.has(r.id) && ids.has(r.id))
    const keys = new Set(rows.flatMap((r) => [cellKey(r.id, 'address'), cellKey(r.id, 'productName')]))
    setLastUpdatedCells((prev) => new Set([...prev, ...keys]))
  }, [technicalAttributesConfiguredLocationIds, allLineItems, deletedIds])

  const stateOptions = useMemo(() => {
    const states = [...new Set(allLineItems.map((r) => r.state).filter((s) => s && s !== '—'))].sort()
    return states
  }, [allLineItems])

  const productOptions = useMemo(() => {
    const products = [...new Set(allLineItems.map((r) => getCellValue(r, 'productName')).filter((p) => p && p !== '—'))].sort()
    return products
  }, [allLineItems, cellEdits])

  const mediaOptions = useMemo(() => {
    const opts = [...new Set(allLineItems.map((r) => getCellValue(r, 'media')).filter((m) => m && m !== '—'))].sort()
    return opts.length ? opts : ['Fiber', 'Copper']
  }, [allLineItems, cellEdits])

  const bandwidthOptions = useMemo(() => {
    const opts = [...new Set(allLineItems.map((r) => getCellValue(r, 'bandwidth')).filter((b) => b && b !== '—'))].sort()
    return opts.length ? opts : ['10 Mbps', '100 Mbps', '1 Gbps']
  }, [allLineItems, cellEdits])

  const bcpOptions = useMemo(() => {
    const set = new Set(BILLING_CONTACT_NAMES)
    allLineItems.forEach((r) => {
      const v = getCellValue(r, 'billingContactPerson')
      if (v && v !== '—') set.add(v)
    })
    newBcpNames.forEach((n) => set.add(n))
    return Array.from(set).sort()
  }, [allLineItems, cellEdits, newBcpNames])

  const bcpFilteredOptions = useMemo(() => {
    const q = (bcpSearchQuery || '').trim().toLowerCase()
    if (!q) return bcpOptions
    return bcpOptions.filter((name) => name.toLowerCase().includes(q))
  }, [bcpOptions, bcpSearchQuery])

  const effectiveFilterState = filterState === FILTER_ALL || stateOptions.includes(filterState) ? filterState : FILTER_ALL
  const effectiveFilterProduct =
    filterProduct === FILTER_ALL || productOptions.includes(filterProduct) ? filterProduct : FILTER_ALL

  const filteredItems = useMemo(() => {
    let list = allLineItems.filter((r) => !deletedIds.has(r.id))
    if (effectiveFilterState !== FILTER_ALL) list = list.filter((r) => r.state === effectiveFilterState)
    if (effectiveFilterProduct !== FILTER_ALL)
      list = list.filter((r) => (getCellValue(r, 'productName') || '').toLowerCase().includes(effectiveFilterProduct.toLowerCase()))
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((r) => {
        const bcp = ((cellEdits[r.id]?.billingContactPerson ?? r.billingContactPerson) || '').toString().toLowerCase()
        const product = ((cellEdits[r.id]?.productName ?? r.productName) || '').toString().toLowerCase()
        const address = (r.address || '').toLowerCase()
        const state = (r.state || '').toLowerCase()
        return product.includes(q) || address.includes(q) || state.includes(q) || bcp.includes(q)
      })
    }
    return list
  }, [allLineItems, deletedIds, effectiveFilterState, effectiveFilterProduct, searchQuery, cellEdits])

  const displayFilteredItems = useMemo(() => {
    if (viewingSelectedOnly && selectedIds.size > 0) {
      return filteredItems.filter((r) => selectedIds.has(r.id))
    }
    return filteredItems
  }, [filteredItems, viewingSelectedOnly, selectedIds])

  const totalPages = Math.max(1, Math.ceil(displayFilteredItems.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const start = (page - 1) * PAGE_SIZE
  const items = useMemo(() => displayFilteredItems.slice(start, start + PAGE_SIZE), [displayFilteredItems, start])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(items.map((r) => r.id)))
  }

  const openDeleteModal = (ids) => {
    setDeleteModalIds(Array.isArray(ids) ? ids : [ids])
    setApplyDeleteToSelectedRows(false)
    setDeleteModalOpen(true)
    setOpenRowMenuId(null)
  }

  useEffect(() => {
    if (!openRowMenuId) {
      setRowMenuPosition(null)
      return
    }
    const tick = requestAnimationFrame(() => {
      const el = rowMenuRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setRowMenuPosition({ top: rect.bottom + 4, left: rect.right - 176 })
    })
    return () => cancelAnimationFrame(tick)
  }, [openRowMenuId])

  const isBulkEditActive = editingCell && selectedIds.size >= 2
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
  }, [editingCell?.rowId, editingCell?.column, isBulkEditActive])

  const editingRowForBulk = editingCell ? filteredItems.find((r) => r.id === editingCell.rowId) : null
  const lastBulkEditCellRef = useRef(null)
  useEffect(() => {
    if (!editingCell || !editingRowForBulk || selectedIds.size < 2) return
    const key = `${editingCell.rowId}-${editingCell.column}`
    if (lastBulkEditCellRef.current === key) return
    lastBulkEditCellRef.current = key
    const v = getCellValue(editingRowForBulk, editingCell.column)
    if (editingCell.column === 'quantity') {
      setBulkEditPopoverValue(v ?? 1)
    } else if (editingCell.column === 'invoiceShippingDetails') {
      setBulkEditPopoverValue(v === 'Same as BCP Address' || v === 'New Invoice' ? v : 'Same as BCP Address')
    } else {
      setBulkEditPopoverValue((v ?? '') || '')
    }
    if (editingCell.column === 'billingContactPerson') setBcpSearchQuery('')
  }, [editingCell?.rowId, editingCell?.column, selectedIds.size, editingRowForBulk])
  useEffect(() => {
    if (!editingCell) lastBulkEditCellRef.current = null
  }, [editingCell])

  const isBcpSingleRowEdit = editingCell?.column === 'billingContactPerson' && selectedIds.size < 2
  useEffect(() => {
    if (!isBcpSingleRowEdit) {
      setBcpPopoverPosition(null)
      return
    }
    const tick = requestAnimationFrame(() => {
      const el = bcpAnchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setBcpPopoverPosition({ top: rect.bottom + 4, left: rect.left })
    })
    return () => cancelAnimationFrame(tick)
  }, [editingCell?.rowId, editingCell?.column, selectedIds.size, isBcpSingleRowEdit])

  useEffect(() => {
    if (!isBcpSingleRowEdit) return
    const handleMouseDown = (e) => {
      if (bcpPopoverRef.current?.contains(e.target) || bcpAnchorRef.current?.contains(e.target)) return
      setEditingCell(null)
      setBcpSearchQuery('')
      setBcpPopoverPosition(null)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isBcpSingleRowEdit])

  const isInvoiceShippingSingleRowEdit = editingCell?.column === 'invoiceShippingDetails' && selectedIds.size < 2
  useEffect(() => {
    if (isInvoiceShippingSingleRowEdit) setInvoiceShippingPopoverSelection(null)
  }, [isInvoiceShippingSingleRowEdit])
  useEffect(() => {
    if (!isInvoiceShippingSingleRowEdit) {
      setInvoiceShippingPopoverPosition(null)
      return
    }
    const tick = requestAnimationFrame(() => {
      const el = invoiceShippingAnchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setInvoiceShippingPopoverPosition({ top: rect.bottom + 4, left: rect.left })
    })
    return () => cancelAnimationFrame(tick)
  }, [editingCell?.rowId, editingCell?.column, selectedIds.size, isInvoiceShippingSingleRowEdit])

  useEffect(() => {
    if (!isInvoiceShippingSingleRowEdit) return
    const handleMouseDown = (e) => {
      if (invoiceShippingPopoverRef.current?.contains(e.target) || invoiceShippingAnchorRef.current?.contains(e.target)) return
      setEditingCell(null)
      setInvoiceShippingPopoverPosition(null)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isInvoiceShippingSingleRowEdit])

  useEffect(() => {
    if (addBcpModalOpen) {
      setAddBcpValidationErrors({})
      setBcpGstAdded(false)
      setBcpGstNumber('')
      setBcpEndDate('')
      setBcpGstValidated(false)
      setValidateGstModalOpen(false)
    } else {
      setAddBcpTargetIds([])
    }
  }, [addBcpModalOpen])

  useEffect(() => {
    if (!columnFilterOpen) return
    const handleMouseDown = (e) => {
      if (columnFilterAnchorRef.current?.contains(e.target) || columnFilterPopoverRef.current?.contains(e.target)) return
      setColumnFilterOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [columnFilterOpen])

  useEffect(() => {
    const isAllSelected = visibleColumnKeys.size === 0 || visibleColumnKeys.size === COLUMN_FILTER_KEYS.length
    if (isAllSelected) {
      setBillingDetailsExpanded(false)
      setPoDetailsExpanded(false)
    } else {
      const prev = prevVisibleColumnKeysRef.current
      if (prev !== null) {
        if (visibleColumnKeys.has('billingDetails') && !prev.has('billingDetails')) setBillingDetailsExpanded(true)
        if (visibleColumnKeys.has('poGroup') && !prev.has('poGroup')) setPoDetailsExpanded(true)
      }
    }
    prevVisibleColumnKeysRef.current = new Set(visibleColumnKeys)
  }, [visibleColumnKeys])

  useEffect(() => {
    if (!existingInvoiceModalRow) return
    setNewInvoiceStreet(getCellValue(existingInvoiceModalRow, 'invoiceShippingStreet') ?? existingInvoiceModalRow.invoiceShippingStreet ?? '')
    setNewInvoiceCity(getCellValue(existingInvoiceModalRow, 'invoiceShippingCity') ?? existingInvoiceModalRow.invoiceShippingCity ?? '')
    setNewInvoiceState(getCellValue(existingInvoiceModalRow, 'invoiceShippingState') ?? existingInvoiceModalRow.invoiceShippingState ?? '')
    setNewInvoiceCountry(getCellValue(existingInvoiceModalRow, 'invoiceShippingCountry') ?? existingInvoiceModalRow.invoiceShippingCountry ?? '')
    setNewInvoicePincode(getCellValue(existingInvoiceModalRow, 'invoiceShippingPincode') ?? existingInvoiceModalRow.invoiceShippingPincode ?? '')
  }, [existingInvoiceModalRow])

  const saveBulkEditFromPopover = () => {
    if (!editingCell || !editingRowForBulk) return
    const col = editingCell.column
    const v = col === 'quantity' ? (Number(bulkEditPopoverValue) || 1) : bulkEditPopoverValue
    if (col === 'invoiceShippingDetails' && v === 'New Invoice') {
      setExistingInvoiceModalRow(editingRowForBulk)
      setExistingInvoiceModalBulkIds(Array.from(selectedIds))
      setApplyNewInvoiceToSelectedIds(true)
      setEditingCell(null)
      return
    }
    const ids = applyBulkEditToSelected ? Array.from(selectedIds) : [editingCell.rowId]
    setCellEdits((prev) => {
      const next = { ...prev }
      ids.forEach((id) => {
        const cur = next[id] || {}
        cur[col] = v
        next[id] = cur
      })
      return next
    })
    setLastUpdatedCells(new Set(ids.map((id) => cellKey(id, col))))
    setEditingCell(null)
  }

  const confirmDelete = () => {
    const idsToDelete = (deleteModalIds.length === 1 && applyDeleteToSelectedRows && selectedIds.size >= 2 && selectedIds.has(deleteModalIds[0]))
      ? Array.from(selectedIds)
      : deleteModalIds
    setDeletedIds((prev) => {
      const next = new Set(prev)
      idsToDelete.forEach((id) => next.add(id))
      return next
    })
    setSelectedIds((prev) => {
      const next = new Set(prev)
      idsToDelete.forEach((id) => next.delete(id))
      return next
    })
    setDeleteModalOpen(false)
    setDeleteModalIds([])
    setApplyDeleteToSelectedRows(false)
  }

  useEffect(() => {
    if (!openRowMenuId) {
      setRowMenuPosition(null)
      return
    }
    const tick = requestAnimationFrame(() => {
      if (rowMenuRef.current) {
        const rect = rowMenuRef.current.getBoundingClientRect()
        setRowMenuPosition({ top: rect.bottom + 4, left: rect.right - 176, width: 176 })
      }
    })
    return () => cancelAnimationFrame(tick)
  }, [openRowMenuId])

  useEffect(() => {
    if (!openRowMenuId) return
    const handleClickOutside = (e) => {
      const inTrigger = rowMenuRef.current?.contains(e.target)
      const inMenu = rowMenuPortalRef.current?.contains(e.target)
      if (!inTrigger && !inMenu) {
        setOpenRowMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openRowMenuId])

  useEffect(() => {
    if (!billingDetailsModalRow) return
    setBillingDetailsValidationErrors({})
    setBillingModalLevel(getCellValue(billingDetailsModalRow, 'billingDetailsSummary') || billingDetailsModalRow.billingDetailsSummary || 'Account Level')
    setBillingModalLegalEntity(getCellValue(billingDetailsModalRow, 'billingLegalEntity') ?? billingDetailsModalRow.billingLegalEntity ?? '')
    setBillingModalBillDetailsType(getCellValue(billingDetailsModalRow, 'billingBillDetailsType') ?? billingDetailsModalRow.billingBillDetailsType ?? '')
    setBillingModalStore(getCellValue(billingDetailsModalRow, 'billingStore') ?? billingDetailsModalRow.billingStore ?? '')
    setBillingModalFrequency(getCellValue(billingDetailsModalRow, 'billingFrequency') ?? billingDetailsModalRow.billingFrequency ?? '')
    setBillingModalCreditPeriod(getCellValue(billingDetailsModalRow, 'billingCreditPeriod') ?? billingDetailsModalRow.billingCreditPeriod ?? '')
    setBillingModalDispatchMethod(getCellValue(billingDetailsModalRow, 'billingDispatchMethod') ?? billingDetailsModalRow.billingDispatchMethod ?? '')
    setBillingModalMode(getCellValue(billingDetailsModalRow, 'billingMode') ?? billingDetailsModalRow.billingMode ?? '')
    setBillingModalPaymentMethod(getCellValue(billingDetailsModalRow, 'billingPaymentMethod') ?? billingDetailsModalRow.billingPaymentMethod ?? '')
  }, [billingDetailsModalRow])

  useEffect(() => {
    if (!poGroupModalRow) return
    const row = poGroupModalRow
    setPoGroupValidationErrors({})
    setPoModalNumber(getCellValue(row, 'poNumber') ?? row.poNumber ?? getCellValue(row, 'poGroupSummary') ?? row.poGroupSummary ?? '')
    setPoModalReceivedDate(getCellValue(row, 'poReceivedDate') ?? row.poReceivedDate ?? '')
    setPoModalAmount(getCellValue(row, 'poAmount') ?? row.poAmount ?? '')
    setPoModalExpiryDate(getCellValue(row, 'poExpiryDate') ?? row.poExpiryDate ?? '')
    setPoModalExpiryType(getCellValue(row, 'poExpiryType') ?? row.poExpiryType ?? '')
    setPoModalTerms(getCellValue(row, 'poTerms') ?? row.poTerms ?? '')
    setPoModalOeReceivedDate(getCellValue(row, 'poOeReceivedDate') ?? row.poOeReceivedDate ?? '')
  }, [poGroupModalRow])

  const startRecord = displayFilteredItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endRecord = Math.min(page * PAGE_SIZE, displayFilteredItems.length)
  const totalRecords = displayFilteredItems.length

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Header: Breadcrumbs Quote > Enrich Quote */}
      <div className="bg-screenshot-grey border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-200">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs mb-2">
            <button
              type="button"
              onClick={onBack}
              className="text-airtel-red font-medium hover:underline"
            >
              Quote
            </button>
            <span className="text-gray-400" aria-hidden="true">&gt;</span>
            <span className="text-gray-700 font-medium">Enrich Quote</span>
          </nav>
          <h2 className="text-base font-semibold text-gray-900">Enrich Quote</h2>
        </div>

        {/* Filter by State, Filter by Product, Search this list (search on right) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-white border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-700">Filter by State</span>
            <select
              value={effectiveFilterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-airtel-red/30"
              aria-label="Filter by State"
            >
              <option value={FILTER_ALL}>All</option>
              {stateOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="text-xs text-gray-700 ml-2">Filter by Product</span>
            <select
              value={effectiveFilterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-airtel-red/30"
              aria-label="Filter by Product"
            >
              <option value={FILTER_ALL}>All</option>
              {productOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="text-xs text-gray-700 ml-2">Displaying</span>
            <div className="relative inline-block" ref={columnFilterAnchorRef}>
              <button
                type="button"
                onClick={() => setColumnFilterOpen((o) => !o)}
                className="inline-flex items-center justify-between gap-2 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/30 min-w-[8rem]"
                aria-label="Displaying"
                aria-expanded={columnFilterOpen}
              >
                <span className="truncate">
                  {visibleColumnKeys.size === 0 || visibleColumnKeys.size === COLUMN_FILTER_KEYS.length ? 'All' : `${visibleColumnKeys.size} column${visibleColumnKeys.size === 1 ? '' : 's'}`}
                </span>
                <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {columnFilterOpen && (
                <div
                  ref={columnFilterPopoverRef}
                  className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 min-w-[12rem] max-h-64 overflow-y-auto"
                  role="dialog"
                  aria-label="Select columns"
                >
                  {COLUMN_FILTER_OPTIONS.map((opt) => {
                    const isAllSelected = visibleColumnKeys.size === 0 || visibleColumnKeys.size === COLUMN_FILTER_KEYS.length
                    return (
                    <label key={opt.key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={opt.key === 'all' ? isAllSelected : (!isAllSelected && visibleColumnKeys.has(opt.key))}
                        onChange={() => {
                          if (opt.key === 'all') {
                            setVisibleColumnKeys(isAllSelected ? new Set() : new Set(COLUMN_FILTER_KEYS))
                          } else {
                            if (isAllSelected) {
                              setVisibleColumnKeys(new Set([opt.key]))
                            } else {
                              setVisibleColumnKeys((prev) => {
                                const next = new Set(prev)
                                if (next.has(opt.key)) next.delete(opt.key)
                                else next.add(opt.key)
                                return next
                              })
                            }
                          }
                        }}
                        className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red w-3.5 h-3.5"
                      />
                      <span>{opt.label}</span>
                    </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <label className="sr-only" htmlFor="enrich-quote-search">Search this list</label>
            <input
              id="enrich-quote-search"
              type="text"
              placeholder="Search this list"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 pr-9 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-airtel-red/30 w-44 bg-white"
              aria-label="Search this list"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-airtel-red/30"
                aria-label="Clear search"
                title="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Record summary: Left - Show X to Y of Z, filters. Right - View Selected • Show all records. */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2 bg-white border-t border-gray-100 text-xs text-gray-600">
          <div className="flex flex-wrap items-center gap-x-1">
            Show {startRecord} to {endRecord} of {totalRecords} records.
            {' '}
            {selectedIds.size} Records selected
            {'. '}
            Filter by State: {effectiveFilterState}.
            Filter by Product: {effectiveFilterProduct}.
            Displaying: {visibleColumnKeys.size === 0 || visibleColumnKeys.size === COLUMN_FILTER_KEYS.length ? 'All' : `${visibleColumnKeys.size} column${visibleColumnKeys.size === 1 ? '' : 's'}`}.
          </div>
          <div className="flex items-center gap-x-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (selectedIds.size > 0) {
                  setViewingSelectedOnly(true)
                  setCurrentPage(1)
                }
              }}
              className={`font-medium ${selectedIds.size > 0 ? 'text-airtel-red hover:underline cursor-pointer' : 'text-gray-400 cursor-default'}`}
            >
              View Selected ({selectedIds.size})
            </button>
            {' • '}
            <button
              type="button"
              onClick={() => {
                setViewingSelectedOnly(false)
                setCurrentPage(1)
              }}
              className="text-airtel-red hover:underline font-medium cursor-pointer underline"
            >
              Show all records
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex flex-col min-h-0" style={{ minHeight: '20rem' }}>
          <table className="w-full text-xs border-collapse table-fixed">
            <colgroup>
              <col className="w-10" />
              {COLUMNS.filter((col) => showColumn(col.key)).map((col) => (
                <col key={col.key} style={getColStyle(col.key)} />
              ))}
              {showColumn('billingDetails') && (billingDetailsExpanded ? BILLING_SUB_COLUMNS.map((s) => <col key={s.key} style={getColStyle(`billing_${s.key}`)} />) : <col style={getColStyle('billingDetails')} />)}
              {showColumn('poGroup') && (poDetailsExpanded ? PO_SUB_COLUMNS.map((s) => <col key={s.key} style={getColStyle(`po_${s.key}`)} />) : <col style={getColStyle('poGroup')} />)}
              {showColumn('invoiceShippingDetails') && <col style={getColStyle('invoiceShippingDetails')} />}
              {showColumn('gstApplicable') && <col style={getColStyle('gstApplicable')} />}
              <col className="w-8" />
            </colgroup>
            <thead className="bg-gray-50">
              {/* Row 1: main column headers; Billing Details and PO Group are main columns (expand/collapse) */}
              <tr>
                <th rowSpan={2} className="text-left font-medium text-gray-700 py-1 px-2 border-b border-r border-gray-200 w-10 align-top">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.size === items.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                    aria-label="Select all on page"
                  />
                </th>
                {COLUMNS.filter((col) => showColumn(col.key)).map((col) => (
                  <th key={col.key} rowSpan={2} className="text-left font-medium text-gray-700 py-1 px-2 border-b border-r border-gray-200 whitespace-nowrap align-top group relative" style={getColStyle(col.key)}>
                    <span className="inline-flex items-center gap-0.5">
                      {col.label}
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <ResizeHandle columnId={col.key} />
                  </th>
                ))}
                {/* Billing Details: main column – collapsed = one column (rowSpan 2), expanded = colspan 9 in row 1 */}
                {showColumn('billingDetails') && (
                <th
                  colSpan={billingDetailsExpanded ? 9 : 1}
                  rowSpan={billingDetailsExpanded ? 1 : 2}
                  className={`text-left font-medium text-gray-700 py-1 px-2 border-b border-r border-gray-200 whitespace-nowrap align-top group relative ${!billingDetailsExpanded ? '' : ''}`}
                  style={!billingDetailsExpanded ? getColStyle('billingDetails') : undefined}
                >
                  <button
                    type="button"
                    onClick={() => setBillingDetailsExpanded((e) => !e)}
                    className="inline-flex items-center gap-1 text-gray-700 hover:text-airtel-red focus:outline-none"
                    aria-expanded={billingDetailsExpanded}
                  >
                    <span>Billing Details</span>
                    {billingDetailsExpanded ? (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Collapse"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Expand"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    )}
                  </button>
                  {!billingDetailsExpanded && <ResizeHandle columnId="billingDetails" />}
                </th>
                )}
                {/* PO Group: main column – collapsed = one column (rowSpan 2), expanded = colspan 6 in row 1 */}
                {showColumn('poGroup') && (
                <th
                  colSpan={poDetailsExpanded ? 7 : 1}
                  rowSpan={poDetailsExpanded ? 1 : 2}
                  className={`text-left font-medium text-gray-700 py-1 px-2 border-b border-r border-gray-200 whitespace-nowrap align-top group relative ${!poDetailsExpanded ? '' : ''}`}
                  style={!poDetailsExpanded ? getColStyle('poGroup') : undefined}
                >
                  <button
                    type="button"
                    onClick={() => setPoDetailsExpanded((e) => !e)}
                    className="inline-flex items-center gap-1 text-gray-700 hover:text-airtel-red focus:outline-none"
                    aria-expanded={poDetailsExpanded}
                  >
                    <span>PO Group</span>
                    {poDetailsExpanded ? (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Collapse"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Expand"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    )}
                  </button>
                  {!poDetailsExpanded && <ResizeHandle columnId="poGroup" />}
                </th>
                )}
                {showColumn('invoiceShippingDetails') && (
                <th rowSpan={2} className="text-left font-medium text-gray-700 py-1 px-2 border-b border-r border-gray-200 whitespace-nowrap align-top group relative" style={getColStyle('invoiceShippingDetails')}>
                  <span className="inline-flex items-center gap-0.5">{INVOICE_SHIPPING_LABEL}<svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></span>
                  <ResizeHandle columnId="invoiceShippingDetails" />
                </th>
                )}
                {showColumn('gstApplicable') && (
                <th rowSpan={2} className="text-left font-medium text-gray-700 py-1 px-2 border-b border-r border-gray-200 whitespace-nowrap align-top group relative" style={getColStyle('gstApplicable')}>
                  <span className="inline-flex items-center gap-0.5">{GST_APPLICABLE_LABEL}<svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></span>
                  <ResizeHandle columnId="gstApplicable" />
                </th>
                )}
                <th rowSpan={2} className="text-left font-medium text-gray-700 py-1 px-2 border-b border-gray-200 w-8 align-top" aria-label="Actions" />
              </tr>
              {/* Row 2: sub-column headers for Billing Details and PO Group (only when expanded) */}
              {(billingDetailsExpanded || poDetailsExpanded) && (
                <tr>
                  {showColumn('billingDetails') && billingDetailsExpanded && BILLING_SUB_COLUMNS.map((sub) => (
                    <th key={sub.key} className="text-left font-medium text-gray-600 py-1.5 px-2 border-b border-r border-gray-200 whitespace-nowrap text-[11px] group relative" style={getColStyle(`billing_${sub.key}`)}>
                      <span>{sub.label}</span>
                      <ResizeHandle columnId={`billing_${sub.key}`} />
                    </th>
                  ))}
                  {showColumn('poGroup') && poDetailsExpanded && PO_SUB_COLUMNS.map((sub) => (
                    <th key={sub.key} className="text-left font-medium text-gray-600 py-1.5 px-2 border-b border-r border-gray-200 whitespace-nowrap text-[11px] group relative" style={getColStyle(`po_${sub.key}`)}>
                      <span>{sub.label}</span>
                      <ResizeHandle columnId={`po_${sub.key}`} />
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody className="bg-white">
              {items.map((row) => (
                <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                  <td className="py-1 px-2 border-r border-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                      aria-label={`Select line ${row.lineNumber}`}
                    />
                  </td>
                  {showColumn('lastEnrichedDate') && <td className="py-1 px-2 border-r border-gray-100">{row.lastEnrichedDate}</td>}
                  {showColumn('lsi') && <td className="py-1 px-2 border-r border-gray-100 truncate" title={row.lsi ?? '—'}>{row.lsi ?? '—'}</td>}
                  {showColumn('lineNumber') && <td className="py-1 px-2 border-r border-gray-100">{String(row.lineNumber).padStart(8, '0')}</td>}
                  {showColumn('address') && (
                    <td className="py-1 px-2 border-r border-gray-100 max-w-[140px]">
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate block" title={row.address}>{row.address}</span>
                        {lastUpdatedCells.has(cellKey(row.id, 'address')) && UPDATED_BADGE}
                      </div>
                    </td>
                  )}
                  {showColumn('state') && <td className="py-1 px-2 border-r border-gray-100">{row.state}</td>}
                  {showColumn('productName') && (
                  <td
                    ref={editingCell?.rowId === row.id && editingCell?.column === 'productName' && selectedIds.size >= 2 ? bulkEditAnchorRef : undefined}
                    className="py-1 px-2 border-r border-gray-100 group"
                  >
                    {editingCell?.rowId === row.id && editingCell?.column === 'productName' ? (
                      selectedIds.size >= 2 ? (
                        <span className="truncate block" title={getCellValue(row, 'productName') || row.productName}>{getCellValue(row, 'productName') || row.productName || '—'}</span>
                      ) : (
                        <select
                          value={getCellValue(row, 'productName') || ''}
                          onChange={(e) => {
                            setCellEdits((prev) => ({ ...prev, [row.id]: { ...prev[row.id], productName: e.target.value || row.productName } }))
                            setLastUpdatedCells(new Set([cellKey(row.id, 'productName')]))
                            setEditingCell(null)
                          }}
                          onBlur={() => setEditingCell(null)}
                          className="w-full min-w-0 px-1.5 py-0.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-airtel-red/30"
                          autoFocus
                        >
                          {productOptions.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate" title={getCellValue(row, 'productName') || row.productName}>{getCellValue(row, 'productName') || row.productName || '—'}</span>
                        {lastUpdatedCells.has(cellKey(row.id, 'productName')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: row.id, column: 'productName' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                          aria-label="Edit product"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  )}
                  {showColumn('media') && (
                  <td
                    ref={editingCell?.rowId === row.id && editingCell?.column === 'media' && selectedIds.size >= 2 ? bulkEditAnchorRef : undefined}
                    className="py-1 px-2 border-r border-gray-100 group"
                  >
                    {editingCell?.rowId === row.id && editingCell?.column === 'media' ? (
                      selectedIds.size >= 2 ? (
                        <span className="truncate block" title={getCellValue(row, 'media') || row.media}>{getCellValue(row, 'media') || row.media || '—'}</span>
                      ) : (
                        <select
                          value={getCellValue(row, 'media') || ''}
                          onChange={(e) => {
                            setCellEdits((prev) => ({ ...prev, [row.id]: { ...prev[row.id], media: e.target.value || row.media } }))
                            setLastUpdatedCells(new Set([cellKey(row.id, 'media')]))
                            setEditingCell(null)
                          }}
                          onBlur={() => setEditingCell(null)}
                          className="w-full min-w-0 px-1.5 py-0.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-airtel-red/30"
                          autoFocus
                        >
                          {mediaOptions.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate" title={getCellValue(row, 'media') || row.media}>{getCellValue(row, 'media') || row.media || '—'}</span>
                        {lastUpdatedCells.has(cellKey(row.id, 'media')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: row.id, column: 'media' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                          aria-label="Edit media"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  )}
                  {showColumn('bandwidth') && (
                  <td
                    ref={editingCell?.rowId === row.id && editingCell?.column === 'bandwidth' && selectedIds.size >= 2 ? bulkEditAnchorRef : undefined}
                    className="py-1 px-2 border-r border-gray-100 group"
                  >
                    {editingCell?.rowId === row.id && editingCell?.column === 'bandwidth' ? (
                      selectedIds.size >= 2 ? (
                        <span className="truncate block" title={getCellValue(row, 'bandwidth') || row.bandwidth}>{getCellValue(row, 'bandwidth') || row.bandwidth || '—'}</span>
                      ) : (
                        <select
                          value={getCellValue(row, 'bandwidth') || ''}
                          onChange={(e) => {
                            setCellEdits((prev) => ({ ...prev, [row.id]: { ...prev[row.id], bandwidth: e.target.value || row.bandwidth } }))
                            setLastUpdatedCells(new Set([cellKey(row.id, 'bandwidth')]))
                            setEditingCell(null)
                          }}
                          onBlur={() => setEditingCell(null)}
                          className="w-full min-w-0 px-1.5 py-0.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-airtel-red/30"
                          autoFocus
                        >
                          {bandwidthOptions.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate" title={getCellValue(row, 'bandwidth') || row.bandwidth}>{getCellValue(row, 'bandwidth') || row.bandwidth || '—'}</span>
                        {lastUpdatedCells.has(cellKey(row.id, 'bandwidth')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: row.id, column: 'bandwidth' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                          aria-label="Edit bandwidth"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  )}
                  {showColumn('quantity') && (
                  <td
                    ref={editingCell?.rowId === row.id && editingCell?.column === 'quantity' && selectedIds.size >= 2 ? bulkEditAnchorRef : undefined}
                    className="py-1 px-2 border-r border-gray-100 group"
                  >
                    {editingCell?.rowId === row.id && editingCell?.column === 'quantity' ? (
                      selectedIds.size >= 2 ? (
                        <span className="truncate block">{String(getCellValue(row, 'quantity') ?? row.quantity ?? 1)}</span>
                      ) : (
                        <input
                          type="number"
                          min={1}
                          value={String(getCellValue(row, 'quantity') ?? row.quantity ?? 1)}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            if (!isNaN(v) && v >= 1) {
                              setCellEdits((prev) => ({ ...prev, [row.id]: { ...prev[row.id], quantity: v } }))
                              setLastUpdatedCells(new Set([cellKey(row.id, 'quantity')]))
                            }
                          }}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingCell(null) }}
                          className="w-14 px-1.5 py-0.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-airtel-red/30"
                          autoFocus
                        />
                      )
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate">{String(getCellValue(row, 'quantity') ?? row.quantity ?? 1)}</span>
                        {lastUpdatedCells.has(cellKey(row.id, 'quantity')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: row.id, column: 'quantity' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                          aria-label="Edit quantity"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  )}
                  {showColumn('billingContactPerson') && (
                  <td
                    ref={editingCell?.rowId === row.id && editingCell?.column === 'billingContactPerson' ? (selectedIds.size >= 2 ? bulkEditAnchorRef : bcpAnchorRef) : undefined}
                    className="py-1 px-2 border-r border-gray-100 group"
                  >
                    {editingCell?.rowId === row.id && editingCell?.column === 'billingContactPerson' && selectedIds.size >= 2 ? (
                      <span className="truncate block" title={getCellValue(row, 'billingContactPerson') || row.billingContactPerson}>{getCellValue(row, 'billingContactPerson') || row.billingContactPerson || '—'}</span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate" title={getCellValue(row, 'billingContactPerson') || row.billingContactPerson}>{getCellValue(row, 'billingContactPerson') || row.billingContactPerson || '—'}</span>
                        {lastUpdatedCells.has(cellKey(row.id, 'billingContactPerson')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setBcpSearchQuery(''); setEditingCell({ rowId: row.id, column: 'billingContactPerson' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                          aria-label="Edit billing contact person"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  )}
                  {/* Billing Details: one column when collapsed, sub-columns when expanded */}
                  {showColumn('billingDetails') && (!billingDetailsExpanded ? (
                    <td
                      className="py-1 px-2 border-r border-gray-100 w-[1%] max-w-[145px] truncate cursor-pointer hover:bg-gray-50 group"
                      onClick={() => setBillingDetailsModalRow(row)}
                      title={BILLING_SUB_COLUMNS.map((sub) => getCellValue(row, sub.key) ?? row[sub.key] ?? '').filter(Boolean).join(', ') || 'Click to edit Billing Details'}
                    >
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate block">
                          {BILLING_SUB_COLUMNS.map((sub) => getCellValue(row, sub.key) ?? row[sub.key] ?? '').filter(Boolean).join(', ') || '—'}
                        </span>
                        {lastUpdatedCells.has(cellKey(row.id, 'billingDetailsSummary')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setBillingDetailsModalRow(row) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                          aria-label="Edit Billing Details"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                        </button>
                      </div>
                    </td>
                  ) : (
                    BILLING_SUB_COLUMNS.map((sub, subIdx) => (
                      <td
                        key={sub.key}
                        className="py-1 px-2 border-r border-gray-100 min-w-[90px] max-w-[180px] truncate cursor-pointer hover:bg-gray-50 group"
                        onClick={() => setBillingDetailsModalRow(row)}
                        title={`${sub.label}: click to edit`}
                      >
                        <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                          <span className="truncate">{getCellValue(row, sub.key) ?? row[sub.key] ?? '—'}</span>
                          {lastUpdatedCells.has(cellKey(row.id, sub.key)) && UPDATED_BADGE}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setBillingDetailsModalRow(row) }}
                            className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                            aria-label={`Edit ${sub.label}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                          </button>
                        </div>
                      </td>
                    ))
                  ) )}
                  {/* PO Group: one column when collapsed, sub-columns when expanded */}
                  {showColumn('poGroup') && (!poDetailsExpanded ? (
                    <td
                      className="py-1 px-2 border-r border-gray-100 w-[1%] max-w-[110px] truncate cursor-pointer hover:bg-gray-50 group"
                      onClick={() => setPoGroupModalRow(row)}
                      title={PO_SUB_COLUMNS.map((sub) => getCellValue(row, sub.key) ?? row[sub.key] ?? '').filter(Boolean).join(', ') || 'Click to edit PO Group'}
                    >
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate block">
                          {PO_SUB_COLUMNS.map((sub) => getCellValue(row, sub.key) ?? row[sub.key] ?? '').filter(Boolean).join(', ') || '—'}
                        </span>
                        {lastUpdatedCells.has(cellKey(row.id, 'poGroupSummary')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPoGroupModalRow(row) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                          aria-label="Edit PO Group"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                        </button>
                      </div>
                    </td>
                  ) : (
                    PO_SUB_COLUMNS.map((sub, subIdx) => (
                      <td
                        key={sub.key}
                        className="py-1 px-2 border-r border-gray-100 min-w-[90px] max-w-[140px] truncate cursor-pointer hover:bg-gray-50 group"
                        onClick={() => setPoGroupModalRow(row)}
                        title={`${sub.label}: click to edit`}
                      >
                        <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                          <span className="truncate">{getCellValue(row, sub.key) ?? row[sub.key] ?? '—'}</span>
                          {lastUpdatedCells.has(cellKey(row.id, sub.key)) && UPDATED_BADGE}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPoGroupModalRow(row) }}
                            className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                            aria-label={`Edit ${sub.label}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                          </button>
                        </div>
                      </td>
                    ))
                  ) )}
                  {showColumn('invoiceShippingDetails') && (
                  <td
                    ref={editingCell?.rowId === row.id && editingCell?.column === 'invoiceShippingDetails' && selectedIds.size >= 2 ? bulkEditAnchorRef : undefined}
                    className="py-1 px-2 border-r border-gray-100 w-[11.5rem] max-w-[11.5rem] min-w-0 group"
                  >
                    {editingCell?.rowId === row.id && editingCell?.column === 'invoiceShippingDetails' ? (
                      <span ref={selectedIds.size >= 2 ? undefined : invoiceShippingAnchorRef} className="block truncate" title={getInvoiceShippingDisplay(row)}>{getInvoiceShippingDisplay(row)}</span>
                    ) : (
                      <div
                        className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap cursor-pointer hover:bg-gray-50 rounded"
                        onClick={() => setEditingCell({ rowId: row.id, column: 'invoiceShippingDetails' })}
                        title={getInvoiceShippingDisplay(row)}
                      >
                        <span className="truncate block min-w-0">{getInvoiceShippingDisplay(row)}</span>
                        {lastUpdatedCells.has(cellKey(row.id, 'invoiceShippingDetails')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: row.id, column: 'invoiceShippingDetails' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                          aria-label="Edit Invoice Shipping"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                        </button>
                      </div>
                    )}
                  </td>
                  )}
                  {showColumn('gstApplicable') && (
                  <td
                    ref={editingCell?.rowId === row.id && editingCell?.column === 'gstApplicable' && selectedIds.size >= 2 ? bulkEditAnchorRef : undefined}
                    className="py-1 px-2 border-r border-gray-100 group"
                  >
                    {editingCell?.rowId === row.id && editingCell?.column === 'gstApplicable' ? (
                      selectedIds.size >= 2 ? (
                        <span className="truncate block" title={getCellValue(row, 'gstApplicable') || row.gstApplicable}>{getCellValue(row, 'gstApplicable') || row.gstApplicable || '—'}</span>
                      ) : (
                        <select
                          value={getCellValue(row, 'gstApplicable') || ''}
                          onChange={(e) => {
                            setCellEdits((prev) => ({ ...prev, [row.id]: { ...prev[row.id], gstApplicable: e.target.value } }))
                            setLastUpdatedCells(new Set([cellKey(row.id, 'gstApplicable')]))
                            setEditingCell(null)
                          }}
                          onBlur={() => setEditingCell(null)}
                          className="w-full min-w-0 px-1.5 py-0.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-airtel-red/30"
                          autoFocus
                        >
                          {GST_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full flex-wrap">
                        <span className="truncate" title={getCellValue(row, 'gstApplicable') || row.gstApplicable}>{getCellValue(row, 'gstApplicable') || row.gstApplicable || '—'}</span>
                        {lastUpdatedCells.has(cellKey(row.id, 'gstApplicable')) && UPDATED_BADGE}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setApplyBulkEditToSelected(true); setEditingCell({ rowId: row.id, column: 'gstApplicable' }) }}
                          className="shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 focus:outline-none"
                          aria-label="Edit GST applicable"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  )}
                  <td className="py-1 px-2 border-l border-gray-100 align-middle w-8 relative">
                    <div ref={openRowMenuId === row.id ? rowMenuRef : undefined} className="relative inline-block">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenRowMenuId((id) => (id === row.id ? null : row.id))
                        }}
                        className="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 shrink-0 shadow-sm"
                        aria-label="Row actions"
                        aria-expanded={openRowMenuId === row.id}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {/* Dropdown rendered via portal to avoid overflow clipping - both options always visible */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination + Bulk Delete */}
        <div className="flex-shrink-0 flex items-center justify-between w-full px-2 min-h-[2.5rem] py-2 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => openDeleteModal(Array.from(selectedIds))}
                className="px-3 py-1.5 rounded-md border border-red-300 bg-white text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none"
              >
                Delete ({selectedIds.size})
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-xs font-medium text-airtel-red disabled:opacity-50 disabled:cursor-not-allowed hover:bg-grey-bg enabled:cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-gray-800">Page {page} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-xs font-medium text-airtel-red disabled:opacity-50 disabled:cursor-not-allowed hover:bg-grey-bg enabled:cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Update Parameter */}
      <div className="flex justify-end mt-4 flex-shrink-0">
        <button
          type="button"
          className="px-4 py-2 rounded-md text-xs font-medium bg-airtel-red text-white hover:opacity-90"
        >
          Update Parameter
        </button>
      </div>

      {/* Row overflow menu - rendered via portal to avoid clipping; both Technical Attributes and Delete visible */}
      {openRowMenuId &&
        rowMenuPosition &&
        (() => {
          const openRow = displayFilteredItems.find((r) => r.id === openRowMenuId) ?? filteredItems.find((r) => r.id === openRowMenuId)
          if (!openRow) return null
          return createPortal(
            <div
              ref={rowMenuPortalRef}
              className="min-w-[11rem] whitespace-nowrap bg-white border border-gray-200 rounded-md shadow-lg py-1"
              style={{
                position: 'fixed',
                top: rowMenuPosition.top,
                left: rowMenuPosition.left,
                zIndex: 9999,
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenRowMenuId(null)
                  setRowMenuPosition(null)
                  onTechnicalAttributesClick?.(openRow)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-airtel-red hover:bg-red-50 focus:outline-none block"
              >
                Technical Attributes
              </button>
              <div className="border-t border-gray-200" aria-hidden="true" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenRowMenuId(null)
                  setRowMenuPosition(null)
                  openDeleteModal(openRow.id)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 focus:outline-none block"
              >
                Delete
              </button>
            </div>,
            document.body
          )
        })()}

      {/* Bulk edit popover (Quote 1 style: per-column, "Update N selected items") */}
      {bulkEditPopoverPosition &&
        isBulkEditActive &&
        editingRowForBulk &&
        editingCell?.column &&
        createPortal(
          <div
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[12rem]"
            style={{
              position: 'fixed',
              top: bulkEditPopoverPosition.top,
              left: bulkEditPopoverPosition.left,
              zIndex: 9999,
            }}
            role="dialog"
            aria-label={`Bulk edit ${editingCell.column}`}
          >
            {editingCell.column === 'productName' && (
              <select
                value={bulkEditPopoverValue}
                onChange={(e) => setBulkEditPopoverValue(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/30"
              >
                {productOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}
            {editingCell.column === 'media' && (
              <select
                value={bulkEditPopoverValue}
                onChange={(e) => setBulkEditPopoverValue(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/30"
              >
                {mediaOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            {editingCell.column === 'bandwidth' && (
              <select
                value={bulkEditPopoverValue}
                onChange={(e) => setBulkEditPopoverValue(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/30"
              >
                {bandwidthOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}
            {editingCell.column === 'quantity' && (
              <input
                type="number"
                min={1}
                value={bulkEditPopoverValue}
                onChange={(e) => setBulkEditPopoverValue(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-airtel-red/30"
              />
            )}
            {editingCell.column === 'billingContactPerson' && (
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={bcpSearchQuery}
                  onChange={(e) => setBcpSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/30"
                />
                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded bg-white">
                  {bcpFilteredOptions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setBulkEditPopoverValue(name)}
                      className={`w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 focus:outline-none ${bulkEditPopoverValue === name ? 'bg-red-50 text-airtel-red' : ''}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const ids = selectedIds.size >= 2 ? Array.from(selectedIds) : (editingCell?.rowId ? [editingCell.rowId] : [])
                    setAddBcpTargetIds(ids)
                    setAddBcpModalOpen(true)
                    setEditingCell(null)
                  }}
                  className="text-airtel-red text-xs font-medium underline hover:no-underline text-left"
                >
                  + Add BCP
                </button>
              </div>
            )}
            {editingCell.column === 'gstApplicable' && (
              <select
                value={bulkEditPopoverValue}
                onChange={(e) => setBulkEditPopoverValue(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/30"
              >
                {GST_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            )}
            {editingCell.column === 'invoiceShippingDetails' && (
              <div className="flex flex-col gap-1 py-1">
                {INVOICE_SHIPPING_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="bulk-invoice-shipping"
                      checked={bulkEditPopoverValue === opt.value}
                      onChange={() => {
                        if (opt.value === 'New Invoice' && editingRowForBulk) {
                          setExistingInvoiceModalRow(editingRowForBulk)
                          setExistingInvoiceModalBulkIds(Array.from(selectedIds))
                          setApplyNewInvoiceToSelectedIds(true)
                          setEditingCell(null)
                        } else {
                          setBulkEditPopoverValue(opt.value)
                        }
                      }}
                      className="rounded-full border-gray-300 text-airtel-red focus:ring-airtel-red w-3.5 h-3.5"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={applyBulkEditToSelected}
                onChange={(e) => setApplyBulkEditToSelected(e.target.checked)}
                className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red w-3.5 h-3.5"
              />
              <span className="text-xs text-gray-700">Update {selectedIds.size} selected items</span>
            </label>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveBulkEditFromPopover}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-airtel-red text-white hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* BCP single-row popover (search + list + Add BCP), does not expand cell */}
      {bcpPopoverPosition && isBcpSingleRowEdit && editingCell?.rowId &&
        createPortal(
          <div
            ref={bcpPopoverRef}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[12rem]"
            style={{
              position: 'fixed',
              top: bcpPopoverPosition.top,
              left: bcpPopoverPosition.left,
              zIndex: 9999,
            }}
            role="dialog"
            aria-label="Select Billing Contact Person"
          >
            <input
              type="text"
              value={bcpSearchQuery}
              onChange={(e) => setBcpSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-airtel-red/30 mb-2"
              autoFocus
            />
            <div className="max-h-36 overflow-y-auto border border-gray-200 rounded bg-white">
              {bcpFilteredOptions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setCellEdits((prev) => ({ ...prev, [editingCell.rowId]: { ...prev[editingCell.rowId], billingContactPerson: name } }))
                    setLastUpdatedCells(new Set([cellKey(editingCell.rowId, 'billingContactPerson')]))
                    setEditingCell(null)
                    setBcpSearchQuery('')
                    setBcpPopoverPosition(null)
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                const ids = editingCell?.rowId ? [editingCell.rowId] : []
                setAddBcpTargetIds(ids)
                setAddBcpModalOpen(true)
                setEditingCell(null)
                setBcpSearchQuery('')
                setBcpPopoverPosition(null)
              }}
              className="text-airtel-red text-xs font-medium underline hover:no-underline text-left mt-2"
            >
              + Add BCP
            </button>
          </div>,
          document.body
        )}

      {/* Invoice Shipping single-row popover (does not expand cell) */}
      {invoiceShippingPopoverPosition && isInvoiceShippingSingleRowEdit && editingCell?.rowId &&
        (() => {
          const row = filteredItems.find((r) => r.id === editingCell.rowId)
          if (!row) return null
          return createPortal(
            <div
              ref={invoiceShippingPopoverRef}
              className="bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 min-w-[12rem]"
              style={{
                position: 'fixed',
                top: invoiceShippingPopoverPosition.top,
                left: invoiceShippingPopoverPosition.left,
                zIndex: 9999,
              }}
              role="dialog"
              aria-label="Invoice Shipping Details"
            >
              {INVOICE_SHIPPING_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name={`invoice-shipping-popover-${row.id}`}
                    checked={invoiceShippingPopoverSelection === opt.value}
                    onChange={() => {
                      if (opt.value === 'New Invoice') {
                        setExistingInvoiceModalRow(row)
                        setExistingInvoiceModalBulkIds(null)
                        setEditingCell(null)
                        setInvoiceShippingPopoverPosition(null)
                      } else {
                        setCellEdits((prev) => {
                          const cur = { ...(prev[row.id] || {}) }
                          cur.invoiceShippingDetails = 'Same as BCP Address'
                          delete cur.invoiceShippingStreet
                          delete cur.invoiceShippingCity
                          delete cur.invoiceShippingState
                          delete cur.invoiceShippingCountry
                          delete cur.invoiceShippingPincode
                          const next = { ...prev }
                          next[row.id] = Object.keys(cur).length ? cur : undefined
                          return next
                        })
                        setLastUpdatedCells(new Set([cellKey(row.id, 'invoiceShippingDetails')]))
                        setEditingCell(null)
                        setInvoiceShippingPopoverPosition(null)
                      }
                    }}
                    className="rounded-full border-gray-300 text-airtel-red focus:ring-airtel-red w-3.5 h-3.5"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>,
            document.body
          )
        })()}

      {/* Billing Details modal */}
      {billingDetailsModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setBillingDetailsModalRow(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center">
              <div className="w-7 shrink-0" />
              <h3 className="flex-1 text-center text-sm font-semibold text-gray-900">Billing Details</h3>
              <button type="button" onClick={() => { setBillingDetailsModalRow(null); setBillingDetailsValidationErrors({}) }} className="w-7 h-7 shrink-0 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 focus:outline-none" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-700 mb-1">Legal Entity <span className="text-red-500">*</span></label>
                <select value={billingModalLegalEntity} onChange={(e) => { setBillingModalLegalEntity(e.target.value); setBillingDetailsValidationErrors((prev) => ({ ...prev, legalEntity: false })) }} className={`w-full px-2 py-1.5 border rounded ${billingDetailsValidationErrors.legalEntity ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select</option>
                  {BILLING_LEGAL_ENTITIES.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                {billingDetailsValidationErrors.legalEntity && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Bill Details Type</label>
                <select value={billingModalBillDetailsType} onChange={(e) => setBillingModalBillDetailsType(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded">
                  <option value="">Select</option>
                  {BILLING_DETAILS_TYPES.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Store <span className="text-red-500">*</span></label>
                <select value={billingModalStore} onChange={(e) => { setBillingModalStore(e.target.value); setBillingDetailsValidationErrors((prev) => ({ ...prev, store: false })) }} className={`w-full px-2 py-1.5 border rounded ${billingDetailsValidationErrors.store ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select</option>
                  {BILLING_STORES.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                {billingDetailsValidationErrors.store && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Billing level <span className="text-red-500">*</span></label>
                <select value={billingModalLevel} onChange={(e) => { setBillingModalLevel(e.target.value); setBillingDetailsValidationErrors((prev) => ({ ...prev, billingLevel: false })) }} className={`w-full px-2 py-1.5 border rounded ${billingDetailsValidationErrors.billingLevel ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select</option>
                  {BILLING_LEVELS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                {billingDetailsValidationErrors.billingLevel && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Billing Frequency <span className="text-red-500">*</span></label>
                <select value={billingModalFrequency} onChange={(e) => { setBillingModalFrequency(e.target.value); setBillingDetailsValidationErrors((prev) => ({ ...prev, billingFrequency: false })) }} className={`w-full px-2 py-1.5 border rounded ${billingDetailsValidationErrors.billingFrequency ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select</option>
                  {BILLING_FREQUENCIES.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                {billingDetailsValidationErrors.billingFrequency && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Credit Period <span className="text-red-500">*</span></label>
                <select value={billingModalCreditPeriod} onChange={(e) => { setBillingModalCreditPeriod(e.target.value); setBillingDetailsValidationErrors((prev) => ({ ...prev, creditPeriod: false })) }} className={`w-full px-2 py-1.5 border rounded ${billingDetailsValidationErrors.creditPeriod ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select</option>
                  {BILLING_CREDIT_PERIODS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                {billingDetailsValidationErrors.creditPeriod && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Bill Dispatch method <span className="text-red-500">*</span></label>
                <select value={billingModalDispatchMethod} onChange={(e) => { setBillingModalDispatchMethod(e.target.value); setBillingDetailsValidationErrors((prev) => ({ ...prev, billDispatchMethod: false })) }} className={`w-full px-2 py-1.5 border rounded ${billingDetailsValidationErrors.billDispatchMethod ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select</option>
                  {BILLING_DISPATCH_METHODS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                {billingDetailsValidationErrors.billDispatchMethod && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Bill Mode <span className="text-red-500">*</span></label>
                <select value={billingModalMode} onChange={(e) => { setBillingModalMode(e.target.value); setBillingDetailsValidationErrors((prev) => ({ ...prev, billMode: false })) }} className={`w-full px-2 py-1.5 border rounded ${billingDetailsValidationErrors.billMode ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select</option>
                  {BILLING_MODES.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                {billingDetailsValidationErrors.billMode && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div className="col-span-2">
                <label className="block text-gray-700 mb-1">Bill Payment Method <span className="text-red-500">*</span></label>
                <select value={billingModalPaymentMethod} onChange={(e) => { setBillingModalPaymentMethod(e.target.value); setBillingDetailsValidationErrors((prev) => ({ ...prev, billPaymentMethod: false })) }} className={`w-full px-2 py-1.5 border rounded ${billingDetailsValidationErrors.billPaymentMethod ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select</option>
                  {BILLING_PAYMENT_METHODS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
                {billingDetailsValidationErrors.billPaymentMethod && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex flex-col gap-3">
              {billingDetailsModalRow && selectedIds.size >= 2 && selectedIds.has(billingDetailsModalRow.id) && (
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyBillingDetailsToSelected}
                    onChange={(e) => setApplyBillingDetailsToSelected(e.target.checked)}
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                  />
                  Apply to all selected rows ({selectedIds.size})
                </label>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setBillingDetailsModalRow(null)} className="px-3 py-1.5 rounded border border-gray-300 text-xs font-medium">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    const errors = {}
                    if (!(billingModalLegalEntity || '').trim()) errors.legalEntity = true
                    if (!(billingModalStore || '').trim()) errors.store = true
                    if (!(billingModalLevel || '').trim()) errors.billingLevel = true
                    if (!(billingModalFrequency || '').trim()) errors.billingFrequency = true
                    if (!(billingModalCreditPeriod || '').trim()) errors.creditPeriod = true
                    if (!(billingModalDispatchMethod || '').trim()) errors.billDispatchMethod = true
                    if (!(billingModalMode || '').trim()) errors.billMode = true
                    if (!(billingModalPaymentMethod || '').trim()) errors.billPaymentMethod = true
                    setBillingDetailsValidationErrors(errors)
                    if (Object.keys(errors).length > 0) return
                    if (billingDetailsModalRow) {
                      const ids = applyBillingDetailsToSelected && selectedIds.size >= 2 && selectedIds.has(billingDetailsModalRow.id)
                        ? Array.from(selectedIds)
                        : [billingDetailsModalRow.id]
                      const updates = {
                        billingDetailsSummary: billingModalLevel,
                        billingLegalEntity: billingModalLegalEntity,
                        billingBillDetailsType: billingModalBillDetailsType,
                        billingStore: billingModalStore,
                        billingFrequency: billingModalFrequency,
                        billingCreditPeriod: billingModalCreditPeriod,
                        billingDispatchMethod: billingModalDispatchMethod,
                        billingMode: billingModalMode,
                        billingPaymentMethod: billingModalPaymentMethod,
                      }
                      setCellEdits((prev) => {
                        const next = { ...prev }
                        ids.forEach((id) => {
                          next[id] = { ...next[id], ...updates }
                        })
                        return next
                      })
                      const billingChangedCols = Object.keys(updates).filter(
                        (col) => String(getCellValue(billingDetailsModalRow, col) ?? '') !== String(updates[col] ?? '')
                      )
                      const billingKeys = billingChangedCols.length > 0 ? [...billingChangedCols, 'billingDetailsSummary'] : ['billingDetailsSummary']
                      setLastUpdatedCells(new Set(ids.flatMap((id) => billingKeys.map((col) => cellKey(id, col)))))
                    }
                    setBillingDetailsModalRow(null)
                  }}
                  className="px-3 py-1.5 rounded bg-airtel-red text-white text-xs font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PO Group modal */}
      {poGroupModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPoGroupModalRow(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center">
              <div className="w-7 shrink-0" />
              <h3 className="flex-1 text-center text-sm font-semibold text-gray-900">PO Group</h3>
              <button type="button" onClick={() => { setPoGroupModalRow(null); setPoGroupValidationErrors({}) }} className="w-7 h-7 shrink-0 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 focus:outline-none" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-700 mb-1">PO <span className="text-red-500">*</span></label>
                <input type="text" value={poModalNumber} onChange={(e) => { setPoModalNumber(e.target.value); setPoGroupValidationErrors((prev) => ({ ...prev, poNumber: false })) }} className={`w-full px-2 py-1.5 border rounded ${poGroupValidationErrors.poNumber ? 'border-red-500' : 'border-gray-300'}`} placeholder="PO" />
                {poGroupValidationErrors.poNumber && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">PO Received Date <span className="text-red-500">*</span></label>
                <input type="date" value={poModalReceivedDate} onChange={(e) => { setPoModalReceivedDate(e.target.value); setPoGroupValidationErrors((prev) => ({ ...prev, poReceivedDate: false })) }} className={`w-full px-2 py-1.5 border rounded ${poGroupValidationErrors.poReceivedDate ? 'border-red-500' : 'border-gray-300'}`} />
                {poGroupValidationErrors.poReceivedDate && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">PO Amount <span className="text-red-500">*</span></label>
                <input type="text" value={poModalAmount} onChange={(e) => { setPoModalAmount(e.target.value); setPoGroupValidationErrors((prev) => ({ ...prev, poAmount: false })) }} className={`w-full px-2 py-1.5 border rounded ${poGroupValidationErrors.poAmount ? 'border-red-500' : 'border-gray-300'}`} placeholder="PO Amount" />
                {poGroupValidationErrors.poAmount && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">PO Expiry Date <span className="text-red-500">*</span></label>
                <input type="date" value={poModalExpiryDate} onChange={(e) => { setPoModalExpiryDate(e.target.value); setPoGroupValidationErrors((prev) => ({ ...prev, poExpiryDate: false })) }} className={`w-full px-2 py-1.5 border rounded ${poGroupValidationErrors.poExpiryDate ? 'border-red-500' : 'border-gray-300'}`} />
                {poGroupValidationErrors.poExpiryDate && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">PO Expiry Type</label>
                <select value={poModalExpiryType} onChange={(e) => setPoModalExpiryType(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded">
                  <option value="">Select</option>
                  {PO_EXPIRY_TYPES.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">PO terms (in months)</label>
                <select value={poModalTerms} onChange={(e) => setPoModalTerms(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded">
                  <option value="">Select</option>
                  {PO_TERMS_MONTHS.map((opt) => (<option key={opt} value={opt}>{opt} month{opt === '1' ? '' : 's'}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">PO OE Received Date <span className="text-red-500">*</span></label>
                <input type="date" value={poModalOeReceivedDate} onChange={(e) => { setPoModalOeReceivedDate(e.target.value); setPoGroupValidationErrors((prev) => ({ ...prev, poOeReceivedDate: false })) }} className={`w-full px-2 py-1.5 border rounded ${poGroupValidationErrors.poOeReceivedDate ? 'border-red-500' : 'border-gray-300'}`} />
                {poGroupValidationErrors.poOeReceivedDate && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex flex-col gap-3">
              {poGroupModalRow && selectedIds.size >= 2 && selectedIds.has(poGroupModalRow.id) && (
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyPoGroupToSelected}
                    onChange={(e) => setApplyPoGroupToSelected(e.target.checked)}
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                  />
                  Apply to all selected rows ({selectedIds.size})
                </label>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPoGroupModalRow(null)} className="px-3 py-1.5 rounded border border-gray-300 text-xs font-medium">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    const errors = {}
                    if (!(poModalNumber || '').trim()) errors.poNumber = true
                    if (!(poModalReceivedDate || '').trim()) errors.poReceivedDate = true
                    if (!(poModalAmount || '').trim()) errors.poAmount = true
                    if (!(poModalExpiryDate || '').trim()) errors.poExpiryDate = true
                    if (!(poModalOeReceivedDate || '').trim()) errors.poOeReceivedDate = true
                    setPoGroupValidationErrors(errors)
                    if (Object.keys(errors).length > 0) return
                    if (poGroupModalRow) {
                      const ids = applyPoGroupToSelected && selectedIds.size >= 2 && selectedIds.has(poGroupModalRow.id)
                        ? Array.from(selectedIds)
                        : [poGroupModalRow.id]
                      const updates = {
                        poGroupSummary: poModalNumber || '—',
                        poNumber: poModalNumber,
                        poReceivedDate: poModalReceivedDate,
                        poAmount: poModalAmount,
                        poExpiryDate: poModalExpiryDate,
                        poExpiryType: poModalExpiryType,
                        poTerms: poModalTerms,
                        poOeReceivedDate: poModalOeReceivedDate,
                      }
                      setCellEdits((prev) => {
                        const next = { ...prev }
                        ids.forEach((id) => {
                          next[id] = { ...next[id], ...updates }
                        })
                        return next
                      })
                      const poChangedCols = Object.keys(updates).filter(
                        (col) => String(getCellValue(poGroupModalRow, col) ?? '') !== String(updates[col] ?? '')
                      )
                      const poKeys = poChangedCols.length > 0 ? [...poChangedCols, 'poGroupSummary'] : ['poGroupSummary']
                      setLastUpdatedCells(new Set(ids.flatMap((id) => poKeys.map((col) => cellKey(id, col)))))
                    }
                    setPoGroupModalRow(null)
                  }}
                  className="px-3 py-1.5 rounded bg-airtel-red text-white text-xs font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Billing Contact Person modal */}
      {addBcpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAddBcpModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center">
              <div className="w-7 shrink-0" />
              <h3 className="flex-1 text-center text-sm font-semibold text-gray-900">Add Billing Contact Person</h3>
              <button type="button" onClick={() => setAddBcpModalOpen(false)} className="w-7 h-7 shrink-0 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 focus:outline-none" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-gray-700 mb-1">Salutation <span className="text-red-500">*</span></label>
                <select value={bcpSalutation} onChange={(e) => setBcpSalutation(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded">
                  {BCP_SALUTATIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                <input type="text" value={bcpFirstName} onChange={(e) => setBcpFirstName(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" placeholder="First Name" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                <input type="text" value={bcpLastName} onChange={(e) => setBcpLastName(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" placeholder="Last Name" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Designation <span className="text-red-500">*</span></label>
                <input type="text" value={bcpDesignation} onChange={(e) => setBcpDesignation(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" placeholder="Designation" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Mobile/Landline <span className="text-red-500">*</span></label>
                <input type="text" value={bcpMobileLandline} onChange={(e) => setBcpMobileLandline(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" placeholder="Mobile/Landline" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={bcpEmail} onChange={(e) => setBcpEmail(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" placeholder="Email" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Alternate Email</label>
                <input type="email" value={bcpAlternateEmail} onChange={(e) => setBcpAlternateEmail(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" placeholder="Alternate Email" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Fax</label>
                <input type="text" value={bcpFax} onChange={(e) => setBcpFax(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" placeholder="Fax" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Pin code <span className="text-red-500">*</span></label>
                <input type="text" value={bcpPincode} onChange={(e) => { setBcpPincode(e.target.value); const v = e.target.value; if (v === '452002') { setBcpCity('Indore'); setBcpState('Madhya Pradesh'); setBcpCountry('India'); } else if (v === '110001') { setBcpCity('New Delhi'); setBcpState('Delhi'); setBcpCountry('India'); } }} className="w-full px-2 py-1.5 border border-gray-300 rounded" placeholder="e.g. 452002 - Indore" />
              </div>
              <div className="col-span-3">
                <label className="block text-gray-700 mb-1">Billing Street <span className="text-red-500">*</span></label>
                <input type="text" value={bcpBillingStreet} onChange={(e) => setBcpBillingStreet(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" placeholder="Billing Street" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input type="text" value={bcpCity} onChange={(e) => { setBcpCity(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, city: false })) }} className={`w-full px-2 py-1.5 border rounded ${addBcpValidationErrors.city ? 'border-red-500' : 'border-gray-300'}`} placeholder="City" />
                {addBcpValidationErrors.city && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                <input type="text" value={bcpState} onChange={(e) => { setBcpState(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, state: false })) }} className={`w-full px-2 py-1.5 border rounded ${addBcpValidationErrors.state ? 'border-red-500' : 'border-gray-300'}`} placeholder="State" />
                {addBcpValidationErrors.state && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                <input type="text" value={bcpCountry} onChange={(e) => { setBcpCountry(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, country: false })) }} className={`w-full px-2 py-1.5 border rounded ${addBcpValidationErrors.country ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g. India" />
                {addBcpValidationErrors.country && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">GST Applicable <span className="text-red-500">*</span></label>
                <input type="text" value={bcpGstApplicable} onChange={(e) => { setBcpGstApplicable(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, gstApplicable: false })) }} className={`w-full px-2 py-1.5 border rounded ${addBcpValidationErrors.gstApplicable ? 'border-red-500' : 'border-gray-300'}`} placeholder="GST Applicable" />
                {addBcpValidationErrors.gstApplicable && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Standard Reason</label>
                <select value={bcpStandardReason} onChange={(e) => setBcpStandardReason(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded">
                  <option value="">Select...</option>
                  {BCP_STANDARD_REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setBcpGstAdded(true)}
                  disabled={bcpGstAdded}
                  className="px-3 py-1.5 rounded bg-airtel-red text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-airtel-red"
                >
                  Add GST
                </button>
              </div>
              {bcpGstAdded && (
                <>
                  <div className="col-span-3 border-t border-gray-200 my-2 pt-3" />
                  <div>
                    <label className="block text-gray-700 mb-1">GST Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={bcpGstNumber}
                      onChange={(e) => { setBcpGstNumber(e.target.value); setAddBcpValidationErrors((prev) => ({ ...prev, gstNumber: false })) }}
                      className={`w-full px-2 py-1.5 border rounded ${addBcpValidationErrors.gstNumber ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="GST Number"
                    />
                    {addBcpValidationErrors.gstNumber && <p className="text-red-500 text-[10px] mt-0.5">Required</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={bcpEndDate}
                      onChange={(e) => setBcpEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setValidateGstModalOpen(true)}
                      disabled={bcpGstValidated}
                      className="px-3 py-1.5 rounded bg-airtel-red text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-airtel-red"
                    >
                      Validate GST
                    </button>
                  </div>
                  {bcpGstValidated && (
                    <div className="col-span-3 text-sm text-green-600">
                      GST number {bcpGstNumber || ''} is validated
                    </div>
                  )}
                </>
              )}
            </div>
            {addBcpModalOpen && selectedIds.size >= 2 && (
              <div className="px-4 py-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addBcpApplyToSelected}
                    onChange={(e) => setAddBcpApplyToSelected(e.target.checked)}
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red"
                  />
                  <span className="text-sm text-gray-700">Update Selected ({selectedIds.size}) items</span>
                </label>
              </div>
            )}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button type="button" onClick={() => setAddBcpModalOpen(false)} className="px-3 py-1.5 rounded border border-gray-300 text-xs font-medium">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const errors = {}
                  if (!(bcpCity || '').trim()) errors.city = true
                  if (!(bcpState || '').trim()) errors.state = true
                  if (!(bcpCountry || '').trim()) errors.country = true
                  // GST Applicable not required when Add GST is used and GST is validated
                  if (!(bcpGstApplicable || '').trim() && !(bcpGstAdded && bcpGstValidated)) errors.gstApplicable = true
                  if (bcpGstAdded && !(bcpGstNumber || '').trim()) errors.gstNumber = true
                  setAddBcpValidationErrors(errors)
                  if (Object.keys(errors).length > 0) return
                  const name = [bcpSalutation, bcpFirstName, bcpLastName].filter(Boolean).join(' ').trim()
                  if (name) {
                    setNewBcpNames((prev) => [...prev, name])
                    const idsToApply = addBcpTargetIds.length >= 2
                      ? (addBcpApplyToSelected ? addBcpTargetIds : [])
                      : addBcpTargetIds
                    if (idsToApply.length > 0) {
                      setCellEdits((prev) => {
                        const next = { ...prev }
                        idsToApply.forEach((id) => {
                          next[id] = { ...next[id], billingContactPerson: name }
                        })
                        return next
                      })
                      setLastUpdatedCells(new Set(idsToApply.map((id) => cellKey(id, 'billingContactPerson'))))
                    }
                  }
                  setAddBcpTargetIds([])
                  setAddBcpModalOpen(false)
                }}
                className="px-3 py-1.5 rounded bg-airtel-red text-white text-xs font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validate GST confirmation modal */}
      {validateGstModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
          aria-modal="true"
          role="dialog"
          onClick={(e) => { if (e.target === e.currentTarget) setValidateGstModalOpen(false) }}
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <span className="w-8 shrink-0" aria-hidden="true" />
              <h2 className="flex-1 text-base font-bold text-[#032d60] text-center">Validate GST</h2>
              <button
                type="button"
                onClick={() => setValidateGstModalOpen(false)}
                className="w-8 h-8 shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="px-5 py-4 text-sm text-gray-700 leading-relaxed">
              Are you sure you want to proceed with GST number - {bcpGstNumber || '(number)'}?
            </p>
            <div className="border-t border-gray-200 px-5 py-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setValidateGstModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  setValidateGstModalOpen(false)
                  setBcpGstValidated(true)
                  setAddBcpValidationErrors((prev) => ({ ...prev, gstApplicable: false }))
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-airtel-red text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-airtel-red focus:ring-offset-1"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice – Shipping Address modal: prefilled editable Street, City, State, Country, Pin Code */}
      {existingInvoiceModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setExistingInvoiceModalRow(null); setExistingInvoiceModalBulkIds(null) }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">New Invoice – Shipping Address</h3>
              <button type="button" onClick={() => { setExistingInvoiceModalRow(null); setExistingInvoiceModalBulkIds(null) }} className="p-1 rounded text-gray-500 hover:bg-gray-100 focus:outline-none" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 mb-1">Street</label>
                <input type="text" value={newInvoiceStreet} onChange={(e) => setNewInvoiceStreet(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white" placeholder="Street" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">City</label>
                <input type="text" value={newInvoiceCity} onChange={(e) => setNewInvoiceCity(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white" placeholder="City" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">State</label>
                <input type="text" value={newInvoiceState} onChange={(e) => setNewInvoiceState(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white" placeholder="State" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Country</label>
                <input type="text" value={newInvoiceCountry} onChange={(e) => setNewInvoiceCountry(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white" placeholder="Country" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Pin Code</label>
                <input type="text" value={newInvoicePincode} onChange={(e) => setNewInvoicePincode(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white" placeholder="Pin Code" />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 space-y-3">
              {existingInvoiceModalBulkIds && existingInvoiceModalBulkIds.length >= 2 && (
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={applyNewInvoiceToSelectedIds}
                    onChange={(e) => setApplyNewInvoiceToSelectedIds(e.target.checked)}
                    className="rounded border-gray-300 text-airtel-red focus:ring-airtel-red w-3.5 h-3.5"
                  />
                  <span className="text-gray-700">Update selected ({existingInvoiceModalBulkIds.length}) items</span>
                </label>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setExistingInvoiceModalRow(null); setExistingInvoiceModalBulkIds(null) }} className="px-3 py-1.5 rounded border border-gray-300 text-xs font-medium">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    const ids = (existingInvoiceModalBulkIds && existingInvoiceModalBulkIds.length >= 2 && applyNewInvoiceToSelectedIds)
                      ? existingInvoiceModalBulkIds
                      : [existingInvoiceModalRow.id]
                    const payload = {
                      invoiceShippingDetails: 'New Invoice',
                      invoiceShippingStreet: newInvoiceStreet,
                      invoiceShippingCity: newInvoiceCity,
                      invoiceShippingState: newInvoiceState,
                      invoiceShippingCountry: newInvoiceCountry,
                      invoiceShippingPincode: newInvoicePincode,
                    }
                    setCellEdits((prev) => {
                      const next = { ...prev }
                      ids.forEach((id) => {
                        next[id] = { ...(prev[id] || {}), ...payload }
                      })
                      return next
                    })
                    setLastUpdatedCells(new Set(ids.map((id) => cellKey(id, 'invoiceShippingDetails'))))
                    setExistingInvoiceModalRow(null)
                    setExistingInvoiceModalBulkIds(null)
                  }}
                  className="px-3 py-1.5 rounded bg-airtel-red text-white text-xs font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal - same as Quote 1 (Locations), supports bulk delete */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          aria-modal="true"
          role="dialog"
          onClick={(e) => { if (e.target === e.currentTarget) { setDeleteModalOpen(false); setDeleteModalIds([]); setApplyDeleteToSelectedRows(false) } }}
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <span className="w-8 shrink-0" aria-hidden="true" />
              <h2 id="delete-modal-title" className="flex-1 text-base font-bold text-[#032d60] text-center">Delete this record</h2>
              <button
                type="button"
                onClick={() => { setDeleteModalOpen(false); setDeleteModalIds([]); setApplyDeleteToSelectedRows(false) }}
                className="w-8 h-8 shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="px-5 py-4 text-sm text-gray-700 leading-relaxed">
              {deleteModalIds.length === 1 ? (
                (() => {
                  const row = allLineItems.find((r) => r.id === deleteModalIds[0])
                  return row ? `Are you sure you want to delete this record for ${row.address || row.lineNumber || 'this line'}?` : 'Are you sure you want to delete this record?'
                })()
              ) : (
                `Are you sure you want to delete ${deleteModalIds.length} selected records?`
              )}
            </p>
            {deleteModalIds.length === 1 && selectedIds.size >= 2 && selectedIds.has(deleteModalIds[0]) && (
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
                onClick={() => { setDeleteModalOpen(false); setDeleteModalIds([]); setApplyDeleteToSelectedRows(false) }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
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
