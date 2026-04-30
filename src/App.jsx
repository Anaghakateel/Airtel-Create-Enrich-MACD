import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Header from './components/Header'
import QuoteSection from './components/QuoteSection'
import emptystateImg from './components/emptystate.png'
import DataTableSection from './components/DataTableSection'
import LocationsTabContent from './components/LocationsTabContent'
import SummaryTabContent, { buildSummaryRows } from './components/SummaryTabContent'
import ConfigurationCartView from './components/ConfigurationCartView'
import FooterActions from './components/FooterActions'
import AccountsPage from './components/AccountsPage'
import HomePage from './components/HomePage'
import QuoteProposalPage from './components/QuoteProposalPage'
import SelectQuoteLineItemsPage, { getTechnicalAttributesOverridesFromIntent } from './components/SelectQuoteLineItemsPage'
import TechnicalEnrichmentPage from './components/TechnicalEnrichmentPage'
import TechnicalAttributesPage from './components/TechnicalAttributesPage'
import RequestFeasibilityLocationsPage from './components/RequestFeasibilityLocationsPage'
import { LocationsProvider } from './context/LocationsContext'
import { SAMPLE_LOCATIONS } from './data/sampleLocations'

const AGENTFORCE_QUOTE_RESTORE_KEY = 'airtel_esm_agentforce_quote_restore'

function getStoredQuoteRestore() {
  try {
    const s = localStorage.getItem(AGENTFORCE_QUOTE_RESTORE_KEY)
    if (!s) return null
    const j = JSON.parse(s)
    if (j?.tab === 'Quote' && j?.panelOpen === true) return j
    return null
  } catch (_) {
    return null
  }
}

function App() {
  const quoteActionsRef = useRef({})

  // On load/refresh, clear persisted Agentforce chat so agentic conversation history does not carry forward
  useEffect(() => {
    try {
      localStorage.removeItem(AGENTFORCE_QUOTE_RESTORE_KEY)
      localStorage.removeItem(`${AGENTFORCE_QUOTE_RESTORE_KEY}_Quote1`)
      localStorage.removeItem(`${AGENTFORCE_QUOTE_RESTORE_KEY}_Quote2`)
      localStorage.removeItem(`${AGENTFORCE_QUOTE_RESTORE_KEY}_TechnicalEnrichment`)
      localStorage.removeItem(`${AGENTFORCE_QUOTE_RESTORE_KEY}_MACDQuote`)
      localStorage.removeItem('agentforce_conversation_snapshot')
    } catch (_) {}
  }, [])

  const [extractedRecordCount, setExtractedRecordCount] = useState(5000)
  const [validationComplete, setValidationComplete] = useState(false)
  const [validatedRecordCount, setValidatedRecordCount] = useState(0) // number of validated records (for "Continue with Verified Records")
  const [validatedRecordIds, setValidatedRecordIds] = useState(() => new Set()) // IDs of validated rows (for Continue with Verified Records)
  const [selectedRecordCount, setSelectedRecordCount] = useState(0)
  const [selectedRecordIds, setSelectedRecordIds] = useState(() => new Set()) // IDs of selected rows (for Continue with Selected)
  const [continuedRecordIds, setContinuedRecordIds] = useState(() => new Set()) // IDs of rows moved to Locations; hidden in Extracted Information
  const [validationByRowId, setValidationByRowId] = useState(null) // { [id]: { valid, reasoning? } } so Data Reasoning is prefilled when returning to tab
  const [validationResult, setValidationResult] = useState(null) // { validatedCount, totalCount }
  const [activeTab, setActiveTab] = useState('Extracted Information')
  const [addressValidationInProgress, setAddressValidationInProgress] = useState(false)
  const [summaryLoadingInProgress, setSummaryLoadingInProgress] = useState(false)
  const [locationsData, setLocationsData] = useState([])
  // Locations tab gets data after Continue from Extracted Information; Summary tab gets data after Continue from Locations
  const [locationsForDownstreamTabs, setLocationsForDownstreamTabs] = useState(SAMPLE_LOCATIONS)
  const [locationsForSummaryTab, setLocationsForSummaryTab] = useState([]) // populated only when user clicks Continue on Locations tab
  const [summaryTotals, setSummaryTotals] = useState({ oneTimeTotal: 0, monthlyTotal: 0, quoteTotal: 0 })
  const [editingSummaryRow, setEditingSummaryRow] = useState(null) // when set, show Configuration Cart sub-tab
  const [selectedSummaryRowIdsForConfig, setSelectedSummaryRowIdsForConfig] = useState(() => new Set()) // row ids selected when Edit opened; used for Add Configurations to apply to all selected
  const [configUpdateInProgress, setConfigUpdateInProgress] = useState(false) // loading when "Add products to locations" is clicked
  const [summaryUpdatedProductHighlight, setSummaryUpdatedProductHighlight] = useState(null) // legacy, kept for compat
  const [summaryUpdatedProductRowIds, setSummaryUpdatedProductRowIds] = useState(() => new Set()) // row ids to show Updated badge in Product/Member-Group after Add configurations to quote
  const [summaryConfigSuccessCount, setSummaryConfigSuccessCount] = useState(null) // show "(N) locations were successfully configured" when set
  const [summaryConfigSuccessBannerDismissed, setSummaryConfigSuccessBannerDismissed] = useState(false)
  const [configToQuoteOverlayVisible, setConfigToQuoteOverlayVisible] = useState(false) // white overlay after Add configurations to quote
  const [updatedConfigurationsToQuoteNotification, setUpdatedConfigurationsToQuoteNotification] = useState(false) // bell + popup link
  const pendingConfigRef = useRef({ ids: [], count: 0 })
  const [configUpdateInProgressFromLink, setConfigUpdateInProgressFromLink] = useState(false) // loading "Configurations are getting updated"

  // Auto-hide green success notification at top (e.g. "(N) locations were successfully configured") after 2 seconds
  useEffect(() => {
    if (summaryConfigSuccessCount == null || summaryConfigSuccessCount <= 0) return
    const t = setTimeout(() => {
      setSummaryConfigSuccessCount(null)
      setSummaryConfigSuccessBannerDismissed(true)
    }, 2000)
    return () => clearTimeout(t)
  }, [summaryConfigSuccessCount])

  const [showMatchProductsAnalysisOverlay, setShowMatchProductsAnalysisOverlay] = useState(false) // white transparent overlay on Quote page during 4-step match analysis
  const [showVerifyDetailsAnalysisOverlay, setShowVerifyDetailsAnalysisOverlay] = useState(false) // white transparent overlay during 4-step verify details analysis
  const [showAddProductsAnalysisOverlay, setShowAddProductsAnalysisOverlay] = useState(false) // white transparent overlay during 4-step add products from extracted analysis
  const [showUpdateChangeAnalysisOverlay, setShowUpdateChangeAnalysisOverlay] = useState(false) // white overlay during 4-step update/change analysis
  const [showPOChangeUpdateOverlay, setShowPOChangeUpdateOverlay] = useState(false) // white overlay during/after PO change/update analysis until user clicks link
  const [showMacdUpgradeUpdateOverlay, setShowMacdUpgradeUpdateOverlay] = useState(false) // white overlay during/after MACD upgrade update analysis until user clicks link
  const [checkFeasibilityOverlayOnSummary, setCheckFeasibilityOverlayOnSummary] = useState(false) // white overlay on summary when Check Feasibility clicked
  const [feasibilityProposalNotification, setFeasibilityProposalNotification] = useState(false) // red dot on bell + popup link
  const [feasibilityCheckInProgress, setFeasibilityCheckInProgress] = useState(false) // full screen "Feasibility Check in progress.."
  const [feasibilityCheckComplete, setFeasibilityCheckComplete] = useState(false) // summary shows Success/Partial/Failure badges
  const [validateQuoteOverlayOnSummary, setValidateQuoteOverlayOnSummary] = useState(false)
  const [validateQuoteNotification, setValidateQuoteNotification] = useState(false)
  const [validateQuoteInProgress, setValidateQuoteInProgress] = useState(false)
  const [validateQuoteComplete, setValidateQuoteComplete] = useState(false) // status becomes "Validated"
  const [validateQuoteSuccessBannerDismissed, setValidateQuoteSuccessBannerDismissed] = useState(false) // hide banner on X, status stays Validated
  const [feasibilityExtractionNotification, setFeasibilityExtractionNotification] = useState(false)
  const [feasibilityExtractionInProgress, setFeasibilityExtractionInProgress] = useState(false)
  const [feasibilityCheckNavigateSignal, setFeasibilityCheckNavigateSignal] = useState(0)
  const [feasibilityValidateAddressNavigateSignal, setFeasibilityValidateAddressNavigateSignal] = useState(0)
  const [feasibilityMatchedProductsNavigateSignal, setFeasibilityMatchedProductsNavigateSignal] = useState(0)
  const [feasibilityLocationMatchAnalysisOverlayVisible, setFeasibilityLocationMatchAnalysisOverlayVisible] = useState(false)
  const [feasibilityLocationMatchStartSignal, setFeasibilityLocationMatchStartSignal] = useState(0)
  const [feasibilityLocationMatchNavigateSignal, setFeasibilityLocationMatchNavigateSignal] = useState(0)
  const [newQuoteLocationsExtractionNotification, setNewQuoteLocationsExtractionNotification] = useState(false)
  const [newQuoteLocationsExtractionInProgress, setNewQuoteLocationsExtractionInProgress] = useState(false)
  const [newQuoteLocationsExtractionLinkText, setNewQuoteLocationsExtractionLinkText] = useState('Extracted Information for HDFC Bank account')
  const [convertToQuoteOverlayVisible, setConvertToQuoteOverlayVisible] = useState(false)
  const [sbiQuoteNotification, setSbiQuoteNotification] = useState(false)
  const [sbiQuoteCreationLoading, setSbiQuoteCreationLoading] = useState(false)
  const [pendingSbiFeasibilityRowIds, setPendingSbiFeasibilityRowIds] = useState([])
  const [sbiQuoteLocations, setSbiQuoteLocations] = useState([])
  const [hdfcQuoteNotification, setHdfcQuoteNotification] = useState(false)
  const [hdfcQuoteUpdateLoading, setHdfcQuoteUpdateLoading] = useState(false)
  const [pendingHdfcFeasibilityRowIds, setPendingHdfcFeasibilityRowIds] = useState([])
  const [hdfcQuoteLocations, setHdfcQuoteLocations] = useState([])
  const [hdfcQuoteFeasibilityRequestId, setHdfcQuoteFeasibilityRequestId] = useState('FR-0002')
  const [hdfcQuoteNavigateSignal, setHdfcQuoteNavigateSignal] = useState(0)
  const [currentPage, setCurrentPage] = useState(() => {
    const stored = getStoredQuoteRestore()
    return stored?.tab === 'Quote' ? 'Quote' : 'Home'
  })
  const [agentforcePanelOpen, setAgentforcePanelOpen] = useState(() => getStoredQuoteRestore()?.panelOpen ?? false)
  const [selectedQuote, setSelectedQuote] = useState('Quote 1')
  const [extractionInProgress, setExtractionInProgress] = useState(false)
  const [hasUpdatedQuoteNotification, setHasUpdatedQuoteNotification] = useState(false)
  const [showMatchedResults, setShowMatchedResults] = useState(false)
  const [showAttributesPrefilledNotification, setShowAttributesPrefilledNotification] = useState(false)
  const [revealMatchedResultsInProgress, setRevealMatchedResultsInProgress] = useState(false)
  const [hasUpdatedQuoteProposal2Notification, setHasUpdatedQuoteProposal2Notification] = useState(false)
  const [hasUpdatedQuoteProposal3Notification, setHasUpdatedQuoteProposal3Notification] = useState(false)
  const [hasUpdatedQuoteProposal4Notification, setHasUpdatedQuoteProposal4Notification] = useState(false)
  const [hasAttributesUpdatedNotification, setHasAttributesUpdatedNotification] = useState(false)
  const [showMatchAllOverlay, setShowMatchAllOverlay] = useState(false)
  const [showValidateOverlay, setShowValidateOverlay] = useState(false)
  const [showContinueValidOverlay, setShowContinueValidOverlay] = useState(false)
  const [showContinueSummaryOverlay, setShowContinueSummaryOverlay] = useState(false)
  const [attributesViewLoadingInProgress, setAttributesViewLoadingInProgress] = useState(false)
  const [showMatchedProductsOverlay, setShowMatchedProductsOverlay] = useState(false)
  const [hasUpdatedMatchedProductsNotification, setHasUpdatedMatchedProductsNotification] = useState(false)
  const [matchedProductsViewLoadingInProgress, setMatchedProductsViewLoadingInProgress] = useState(false)
  const matchedProductsUpdatedRowIdsRef = useRef([])
  const [hasUpdatedRequestedValuesNotification, setHasUpdatedRequestedValuesNotification] = useState(false)
  const [updatingRequestedValuesInProgress, setUpdatingRequestedValuesInProgress] = useState(false)
  const lastUpdateIntentRef = useRef(null)
  const skipOpenPanelOnHomeRef = useRef(false)
  const [showEnrichQuotePage, setShowEnrichQuotePage] = useState(false)
  const [showTechnicalAttributesPage, setShowTechnicalAttributesPage] = useState(false)
  const [compareWithAsset, setCompareWithAsset] = useState(false)
  const [hideUnmatchedRecordsBanner, setHideUnmatchedRecordsBanner] = useState(false)
  const [verificationInProgress, setVerificationInProgress] = useState(false)
  const [addedProductsFromExtractedInProgress, setAddedProductsFromExtractedInProgress] = useState(false)
  const [summaryFeasibilityEmptyInitially, setSummaryFeasibilityEmptyInitially] = useState(false)
  const [quote2ProgressStage, setQuote2ProgressStage] = useState('Draft') // 'Draft' when opened from Add Products; 'Proposal' when PO document updated in agent
  const [hasUpgradeQuoteNotification, setHasUpgradeQuoteNotification] = useState(false)
  const [hasEnrichQuoteUpdateNotification, setHasEnrichQuoteUpdateNotification] = useState(false)
  const [enrichingQuoteUpdateInProgress, setEnrichingQuoteUpdateInProgress] = useState(false)
  const [enrichQuoteUpdateIntent, setEnrichQuoteUpdateIntent] = useState(null)
  const [hasTechnicalAttributesUpdateNotification, setHasTechnicalAttributesUpdateNotification] = useState(false)
  const [technicalAttributesUpdateIntent, setTechnicalAttributesUpdateIntent] = useState(null)
  const [technicalAttributesOverrides, setTechnicalAttributesOverrides] = useState(null)
  const [technicalAttributesConfiguredLocationIds, setTechnicalAttributesConfiguredLocationIds] = useState(() => new Set())
  const [technicalAttributesShouldAutofill, setTechnicalAttributesShouldAutofill] = useState(false)
  const [hasMacdUpgradeUpdateNotification, setHasMacdUpgradeUpdateNotification] = useState(false)
  const [macdUpgradeUpdateInProgress, setMacdUpgradeUpdateInProgress] = useState(false)
  const macdUpgradeUpdateIntentRef = useRef(null)

  const quote1Locations = locationsForSummaryTab?.length ? locationsForSummaryTab : locationsForDownstreamTabs
  const visibleSbiQuoteLocations = sbiQuoteLocations?.length ? sbiQuoteLocations : quote1Locations
  const visibleHdfcQuoteLocations = hdfcQuoteLocations?.length ? hdfcQuoteLocations : quote1Locations
  const technicalAttributesInternetLocationIds = useMemo(() => {
    const products = ['Internet', 'SD WAN', 'MPLS']
    return new Set(
      (quote1Locations || []).map((loc, i) => ({ id: loc.id, product: products[i % products.length] })).filter((x) => x.product === 'Internet').map((x) => x.id)
    )
  }, [quote1Locations])

  const activeNavTab = currentPage

  useEffect(() => {
    if (activeTab !== 'Summary') setSummaryFeasibilityEmptyInitially(false)
  }, [activeTab])

  const onNavClick = (label) => {
    if (label === 'Home' || label === 'Quote' || label === 'Accounts') setCurrentPage(label)
  }
  const onNavigateToQuoteExtractedInfo = useCallback(() => {
    setCurrentPage('Quote')
    setActiveTab('Extracted Information')
    setExtractionInProgress(true)
    setTimeout(() => setExtractionInProgress(false), 2000)
  }, [])

  const onNavigateToUpgradeQuote = useCallback(() => {
    setSelectedQuote('MACD Quote')
    setCurrentPage('Quote')
    setActiveTab('Extracted Information')
    setExtractionInProgress(true)
    setHasUpgradeQuoteNotification(false)
    setTimeout(() => setExtractionInProgress(false), 2000)
  }, [])

  const onNavigateToFeasibilityExtraction = useCallback(() => {
    setFeasibilityExtractionNotification(false)
    setCurrentPage('Quote')
    setSelectedQuote('Request for Feasibility (Locations)')
    setFeasibilityExtractionInProgress(true)
    setTimeout(() => setFeasibilityExtractionInProgress(false), 2000)
  }, [])

  const onNavigateToNewQuoteLocationsExtraction = useCallback(() => {
    setNewQuoteLocationsExtractionNotification(false)
    setNewQuoteLocationsExtractionInProgress(true)
    setTimeout(() => {
      setNewQuoteLocationsExtractionInProgress(false)
      setCurrentPage('Quote')
      setSelectedQuote('Request for New Quote - Locations')
      setShowEnrichQuotePage(false)
      setShowTechnicalAttributesPage(false)
    }, 2000)
  }, [])

  const onConvertToSbiOpportunityAndQuote = useCallback((selectedRowIds = []) => {
    setPendingSbiFeasibilityRowIds(Array.isArray(selectedRowIds) ? selectedRowIds : [])
    setSbiQuoteNotification(false)
    setConvertToQuoteOverlayVisible(true)
    setTimeout(() => {
      setSbiQuoteNotification(true)
    }, 1000)
  }, [])

  const onNavigateToSbiQuote = useCallback(() => {
    setSbiQuoteNotification(false)
    setConvertToQuoteOverlayVisible(false)
    setSbiQuoteCreationLoading(true)
    setTimeout(() => {
      const sourceLocations = quote1Locations || []
      const parsedIndexes = (pendingSbiFeasibilityRowIds || [])
        .map((id) => Number(String(id || '').match(/rf-row-(\d+)/)?.[1]))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => a - b)
      const nextSbiLocations = parsedIndexes.length > 0 && sourceLocations.length > 0
        ? parsedIndexes
          .map((n) => sourceLocations[(n - 1) % sourceLocations.length])
          .filter(Boolean)
          .map((loc, idx) => {
            const rowNo = parsedIndexes[idx] || (idx + 1)
            return { ...loc, feasibilityStatus: rowNo % 6 === 0 ? 'Not Feasible' : 'Feasible' }
          })
        : (sourceLocations || []).map((loc, idx) => ({ ...loc, feasibilityStatus: (idx + 1) % 6 === 0 ? 'Not Feasible' : 'Feasible' }))
      setSbiQuoteLocations(nextSbiLocations)
      setSbiQuoteCreationLoading(false)
      setCurrentPage('Quote')
      setSelectedQuote('SBI Bank Quote')
      setActiveTab('Summary')
      setShowEnrichQuotePage(false)
      setShowTechnicalAttributesPage(false)
      setPendingSbiFeasibilityRowIds([])
    }, 2000)
  }, [pendingSbiFeasibilityRowIds, quote1Locations])

  const onHdfcFeasibilityQuoteStatusShown = useCallback((selectedRowIds = []) => {
    setPendingHdfcFeasibilityRowIds(Array.isArray(selectedRowIds) ? selectedRowIds : [])
    setHdfcQuoteNotification(true)
  }, [])

  const onNavigateToHdfcQuote = useCallback(() => {
    setHdfcQuoteNotification(false)
    setHdfcQuoteNavigateSignal((v) => v + 1)
    setHdfcQuoteUpdateLoading(true)
    setHdfcQuoteFeasibilityRequestId(selectedQuote === 'Request for New Quote - Locations + PO' ? 'FR-0003' : 'FR-0002')
    setTimeout(() => {
      const sourceLocations = quote1Locations || []
      const parsedIndexes = (pendingHdfcFeasibilityRowIds || [])
        .map((id) => Number(String(id || '').match(/rf-row-(\d+)/)?.[1]))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => a - b)
      const nextHdfcLocations = parsedIndexes.length > 0 && sourceLocations.length > 0
        ? parsedIndexes
          .map((n) => sourceLocations[(n - 1) % sourceLocations.length])
          .filter(Boolean)
          .map((loc, idx) => {
            const rowNo = parsedIndexes[idx] || (idx + 1)
            return { ...loc, feasibilityStatus: rowNo % 6 === 0 ? 'Not Feasible' : 'Feasible' }
          })
        : (sourceLocations || []).map((loc, idx) => ({ ...loc, feasibilityStatus: (idx + 1) % 6 === 0 ? 'Not Feasible' : 'Feasible' }))
      setHdfcQuoteLocations(nextHdfcLocations)
      setHdfcQuoteUpdateLoading(false)
      setCurrentPage('Quote')
      setSelectedQuote('HDFC Bank Quote')
      setActiveTab('Summary')
      setShowEnrichQuotePage(false)
      setShowTechnicalAttributesPage(false)
      setPendingHdfcFeasibilityRowIds([])
    }, 2000)
  }, [pendingHdfcFeasibilityRowIds, quote1Locations, selectedQuote])

  const onNavigateToEnrichQuoteUpdate = useCallback((intentText) => {
    setShowPOChangeUpdateOverlay(false)
    setEnrichQuoteUpdateIntent((prev) => intentText ?? prev)
    setHasEnrichQuoteUpdateNotification(false)
    setCurrentPage('Quote')
    setSelectedQuote('Quote 2')
    setShowEnrichQuotePage(true)
    setEnrichingQuoteUpdateInProgress(true)
    setTimeout(() => setEnrichingQuoteUpdateInProgress(false), 2000)
  }, [])

  const onEnrichQuoteUpdateCreated = useCallback((intentText) => {
    setEnrichQuoteUpdateIntent(intentText ?? null)
    setHasEnrichQuoteUpdateNotification(true)
  }, [])

  const onTechnicalAttributesUpdateCreated = useCallback((intentText) => {
    setTechnicalAttributesUpdateIntent(intentText ?? null)
    setHasTechnicalAttributesUpdateNotification(true)
  }, [])

  const onNavigateToTechnicalAttributesUpdate = useCallback((intentText) => {
    setShowPOChangeUpdateOverlay(false)
    setHasTechnicalAttributesUpdateNotification(false)
    const intent = intentText ?? technicalAttributesUpdateIntent
    setEnrichQuoteUpdateIntent(intent ?? null)
    const overrides = intent ? getTechnicalAttributesOverridesFromIntent(intent) : null
    setTechnicalAttributesOverrides(overrides)
    setCurrentPage('Quote')
    setSelectedQuote('Quote 2')
    setShowEnrichQuotePage(true)
    setEnrichingQuoteUpdateInProgress(true)
    setTimeout(() => setEnrichingQuoteUpdateInProgress(false), 2000)
  }, [technicalAttributesUpdateIntent])

  const onMacdUpgradeUpdateCreated = useCallback((intentText) => {
    macdUpgradeUpdateIntentRef.current = intentText ?? null
    setHasMacdUpgradeUpdateNotification(true)
  }, [])

  const onNavigateToMacdUpgradeUpdate = useCallback((intentText) => {
    setShowMacdUpgradeUpdateOverlay(false)
    setHasMacdUpgradeUpdateNotification(false)
    setSelectedQuote('MACD Quote')
    setCurrentPage('Quote')
    setActiveTab('Extracted Information')
    setMacdUpgradeUpdateInProgress(true)
    macdUpgradeUpdateIntentRef.current = intentText ?? macdUpgradeUpdateIntentRef.current
    setTimeout(() => {
      setMacdUpgradeUpdateInProgress(false)
      const intent = macdUpgradeUpdateIntentRef.current
      const columns = []
      if (intent && /\bnew\s+attributes?\b/i.test(intent)) columns.push('newAttributes')
      if (intent && /\bnew\s+media\b/i.test(intent)) columns.push('newTechnology')
      if (columns.length === 0) columns.push('newAttributes', 'newTechnology')
      quoteActionsRef.current?.showMacdUpdatedBadgeForColumns?.(columns, intent)
    }, 2000)
  }, [])

  const handleContinueWithSelected = useCallback(() => {
    setContinuedRecordIds((prev) => new Set([...prev, ...selectedRecordIds]))
    setLocationsForDownstreamTabs(locationsData)
    setExtractedRecordCount((prev) => Math.max(0, prev - selectedRecordCount))
    setAddressValidationInProgress(true)
    setTimeout(() => {
      setAddressValidationInProgress(false)
      setActiveTab('Locations')
    }, 2000)
  }, [locationsData, selectedRecordCount, selectedRecordIds])

  const handleContinueWithValidRecords = useCallback(() => {
    setHasUpdatedQuoteProposal3Notification(true)
    setShowContinueValidOverlay(true)
    setContinuedRecordIds((prev) => new Set([...prev, ...validatedRecordIds]))
    setLocationsForDownstreamTabs(locationsData)
    setExtractedRecordCount((prev) => Math.max(0, prev - validatedRecordCount))
  }, [locationsData, validatedRecordCount, validatedRecordIds])

  const handleContinueToSummary = useCallback(() => {
    setHasUpdatedQuoteProposal4Notification(true)
    setShowContinueSummaryOverlay(true)
    setLocationsForSummaryTab(locationsForDownstreamTabs)
  }, [locationsForDownstreamTabs])

  const handleUpdateLocation = useCallback((locationId, updates) => {
    setLocationsData((prev) => prev.map((loc) => (loc.id === locationId ? { ...loc, ...updates } : loc)))
    setLocationsForDownstreamTabs((prev) => prev.map((loc) => (loc.id === locationId ? { ...loc, ...updates } : loc)))
    setSbiQuoteLocations((prev) => prev.map((loc) => (loc.id === locationId ? { ...loc, ...updates } : loc)))
  }, [])

  const handleDeleteLocations = useCallback((ids) => {
    if (!ids?.length) return
    const idSet = new Set(ids)
    setLocationsData((prev) => prev.filter((loc) => !idSet.has(loc.id)))
    setLocationsForDownstreamTabs((prev) => prev.filter((loc) => !idSet.has(loc.id)))
    setSbiQuoteLocations((prev) => prev.filter((loc) => !idSet.has(loc.id)))
  }, [])

  const onRevealComplete = useCallback(() => {
    setRevealMatchedResultsInProgress(false)
    setShowMatchAllOverlay(false)
    setShowMatchedResults(true)
    // Do not show attributes pre-filled notification when matched products is done
    setShowAttributesPrefilledNotification(false)
  }, [])

  const onNavigateToUpdatedQuote = useCallback(() => {
    setShowMatchProductsAnalysisOverlay(false)
    setHasUpdatedQuoteNotification(false)
    setHasUpdatedMatchedProductsNotification(false)
    setShowMatchAllOverlay(false)
    setShowMatchedResults(true)
    setHideUnmatchedRecordsBanner(false)
    setRevealMatchedResultsInProgress(true)
    setCurrentPage('Quote')
    setActiveTab('Extracted Information')
    // When coming from "here" (Match products): run Match All so after 2s the matched products column and orange scoped notification are filled
    setTimeout(() => quoteActionsRef.current?.matchAllProducts?.(), 0)
  }, [])

  const onUpdatedRequestedValuesCreated = useCallback((intentText) => {
    lastUpdateIntentRef.current = intentText ?? null
    setHasUpdatedRequestedValuesNotification(true)
  }, [])

  const onNavigateToUpdatedRequestedValues = useCallback((intentText) => {
    setShowUpdateChangeAnalysisOverlay(false)
    setHasUpdatedRequestedValuesNotification(false)
    setCurrentPage('Quote')
    setSelectedQuote('Quote 1')
    setActiveTab('Extracted Information')
    setUpdatingRequestedValuesInProgress(true)
    const intent = intentText ?? lastUpdateIntentRef.current
    setTimeout(() => {
      setUpdatingRequestedValuesInProgress(false)
      const rowIds = quoteActionsRef.current?.applyUpdateFromIntent?.(intent) ?? []
      if (rowIds.length) quoteActionsRef.current?.showUpdatedBadgeForRows?.(rowIds, 1000)
    }, 2000)
  }, [])

  const isSbiQuoteActive = currentPage === 'Quote' && selectedQuote === 'SBI Bank Quote'
  const isHdfcQuoteActive = currentPage === 'Quote' && selectedQuote === 'HDFC Bank Quote'
  const quoteContentLocations = isSbiQuoteActive
    ? visibleSbiQuoteLocations
    : isHdfcQuoteActive
      ? visibleHdfcQuoteLocations
      : locationsForDownstreamTabs
  const quoteSummaryLocations = isSbiQuoteActive
    ? visibleSbiQuoteLocations
    : isHdfcQuoteActive
      ? visibleHdfcQuoteLocations
      : locationsForSummaryTab

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* White transparent overlay on Quote page while agent shows 4 analysis steps before match-products message */}
      {showMatchProductsAnalysisOverlay && (
        <div className="fixed inset-0 z-40 bg-white/70 pointer-events-none" aria-hidden />
      )}
      {/* White transparent overlay on Quote page while agent shows 4 analysis steps before verify-details message */}
      {showVerifyDetailsAnalysisOverlay && (
        <div className="fixed inset-0 z-40 bg-white/70 pointer-events-none" aria-hidden />
      )}
      {/* White transparent overlay on Quote page while agent shows 4 analysis steps before add-products-from-extracted message */}
      {showAddProductsAnalysisOverlay && (
        <div className="fixed inset-0 z-40 bg-white/70 pointer-events-none" aria-hidden />
      )}
      {/* White transparent overlay while agent shows 4 steps for update/change intent */}
      {showUpdateChangeAnalysisOverlay && (
        <div className="fixed inset-0 z-40 bg-white/70 pointer-events-none" aria-hidden />
      )}
      {/* White transparent overlay during/after PO change/update analysis (4 steps + message with link) until user clicks "Updated Enrich Quote" */}
      {showPOChangeUpdateOverlay && (
        <div className="fixed inset-0 z-40 bg-white/70 pointer-events-none" aria-hidden />
      )}
      {/* White transparent overlay during/after MACD upgrade update analysis (4 steps + message with link) until user clicks "Updates on the upgrade Quote for HDFC Bank" */}
      {showMacdUpgradeUpdateOverlay && (
        <div className="fixed inset-0 z-40 bg-white/70 pointer-events-none" aria-hidden />
      )}
      {/* Full-screen white overlay when products are getting matched */}
      {revealMatchedResultsInProgress && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/95" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Products are getting matched</p>
        </div>
      )}
      {/* Full-screen white overlay when verification is in progress */}
      {verificationInProgress && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/95" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Verification in progress...</p>
        </div>
      )}
      {/* Full-screen white overlay when adding products from extracted information */}
      {addedProductsFromExtractedInProgress && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/95" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Products are getting added from extracted information</p>
        </div>
      )}
      {/* Full-screen white overlay when data is getting verified (address/summary/attributes loading) */}
      {(addressValidationInProgress || summaryLoadingInProgress || attributesViewLoadingInProgress) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/95" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Data is getting verified</p>
        </div>
      )}
      {/* Full-screen white overlay when enriching quote update or MACD upgrade update */}
      {(enrichingQuoteUpdateInProgress || macdUpgradeUpdateInProgress) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/95" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Updating the values...</p>
        </div>
      )}
      {feasibilityExtractionInProgress && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col items-center justify-center gap-3 bg-white/95" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Extraction for feasibility check in progress..</p>
        </div>
      )}
      {newQuoteLocationsExtractionInProgress && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col items-center justify-center gap-3 bg-white/95" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Extracting information in progress..</p>
        </div>
      )}
      {convertToQuoteOverlayVisible && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 bg-white/70 pointer-events-none" aria-hidden />
      )}
      {sbiQuoteCreationLoading && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col items-center justify-center gap-3 bg-white/95" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Creating Opportunity and Quote in progress...</p>
        </div>
      )}
      {hdfcQuoteUpdateLoading && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col items-center justify-center gap-3 bg-white/95" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Updating Quote in progress</p>
        </div>
      )}
      <Header
        activeNavTab={activeNavTab}
        onNavClick={onNavClick}
        agentforcePanelOpen={agentforcePanelOpen}
        onAgentforcePanelChange={setAgentforcePanelOpen}
        selectedQuote={selectedQuote}
        onQuoteSelect={setSelectedQuote}
        quote2ProgressStage={quote2ProgressStage}
        onNavigateToQuoteExtractedInfo={onNavigateToQuoteExtractedInfo}
        onNavigateToUpdatedQuote={onNavigateToUpdatedQuote}
        updatedQuoteNotification={hasUpdatedQuoteNotification}
        updatedQuoteProposal2Notification={hasUpdatedQuoteProposal2Notification}
        onNavigateToUpdatedQuote2={() => {
          setShowVerifyDetailsAnalysisOverlay(false)
          setHasUpdatedQuoteProposal2Notification(false)
          setShowValidateOverlay(false)
          setCurrentPage('Quote')
          setActiveTab('Extracted Information')
          setTimeout(() => quoteActionsRef.current?.runValidation?.(), 0)
        }}
        updatedQuoteProposal3Notification={hasUpdatedQuoteProposal3Notification}
        updatedQuoteProposal4Notification={hasUpdatedQuoteProposal4Notification}
        onNavigateToUpdatedQuote3={() => {
          setHasUpdatedQuoteProposal3Notification(false)
          setShowContinueValidOverlay(false)
          setCurrentPage('Quote')
          setSummaryLoadingInProgress(true)
          setTimeout(() => {
            setSummaryLoadingInProgress(false)
            setActiveTab('Locations')
          }, 2000)
        }}
        onNavigateToUpdatedQuote4={() => {
          setShowAddProductsAnalysisOverlay(false)
          setHasUpdatedQuoteProposal4Notification(false)
          setShowContinueSummaryOverlay(false)
          setCurrentPage('Quote')
          setAddedProductsFromExtractedInProgress(true)
          setLocationsForSummaryTab(locationsForDownstreamTabs.length > 0 ? locationsForDownstreamTabs : locationsData)
          setTimeout(() => {
            setAddedProductsFromExtractedInProgress(false)
            setActiveTab('Summary')
            setSummaryFeasibilityEmptyInitially(true)
          }, 2000)
        }}
        attributesUpdatedNotification={hasAttributesUpdatedNotification}
        onAttributesUpdated={() => setHasAttributesUpdatedNotification(true)}
        onNavigateToAttributesUpdatedView={(productName) => {
          setHasAttributesUpdatedNotification(false)
          setCurrentPage('Quote')
          setActiveTab('Extracted Information')
          if (productName != null && productName !== '') {
            setAttributesViewLoadingInProgress(true)
            setTimeout(() => {
              setAttributesViewLoadingInProgress(false)
              quoteActionsRef.current?.setRequestedProductFilter?.(productName)
            }, 2000)
          }
        }}
        updatedMatchedProductsNotification={hasUpdatedMatchedProductsNotification}
        onNavigateToUpdatedMatchedProducts={() => {
          setHasUpdatedMatchedProductsNotification(false)
          setShowMatchedProductsOverlay(false)
          setCurrentPage('Quote')
          setActiveTab('Extracted Information')
          setMatchedProductsViewLoadingInProgress(true)
          setTimeout(() => {
            setMatchedProductsViewLoadingInProgress(false)
            const rowIds = matchedProductsUpdatedRowIdsRef.current || []
            if (rowIds.length) quoteActionsRef.current?.showUpdatedBadgeForRows?.(rowIds)
          }, 2000)
        }}
        updatedRequestedValuesNotification={hasUpdatedRequestedValuesNotification}
        onNavigateToUpdatedRequestedValues={onNavigateToUpdatedRequestedValues}
        onUpdatedRequestedValuesCreated={onUpdatedRequestedValuesCreated}
        onMarkAllNotificationsRead={() => { setHasUpdatedRequestedValuesNotification(false); setFeasibilityProposalNotification(false); setValidateQuoteNotification(false); setUpdatedConfigurationsToQuoteNotification(false); setHasUpgradeQuoteNotification(false); setHasEnrichQuoteUpdateNotification(false); setHasTechnicalAttributesUpdateNotification(false); setHasMacdUpgradeUpdateNotification(false); setFeasibilityExtractionNotification(false); setNewQuoteLocationsExtractionNotification(false); setSbiQuoteNotification(false); setHdfcQuoteNotification(false) }}
        updatedUpgradeQuoteNotification={hasUpgradeQuoteNotification}
        onNavigateToUpgradeQuote={onNavigateToUpgradeQuote}
        onUpgradeQuoteCreated={() => setHasUpgradeQuoteNotification(true)}
        updatedEnrichQuoteUpdateNotification={hasEnrichQuoteUpdateNotification}
        enrichQuoteUpdateIntent={enrichQuoteUpdateIntent}
        onNavigateToEnrichQuoteUpdate={onNavigateToEnrichQuoteUpdate}
        onEnrichQuoteUpdateCreated={onEnrichQuoteUpdateCreated}
        updatedTechnicalAttributesUpdateNotification={hasTechnicalAttributesUpdateNotification}
        technicalAttributesUpdateIntent={technicalAttributesUpdateIntent}
        onNavigateToTechnicalAttributesUpdate={onNavigateToTechnicalAttributesUpdate}
        onTechnicalAttributesUpdateCreated={onTechnicalAttributesUpdateCreated}
        updatedMacdUpgradeUpdateNotification={hasMacdUpgradeUpdateNotification}
        onNavigateToMacdUpgradeUpdate={onNavigateToMacdUpgradeUpdate}
        onMacdUpgradeUpdateCreated={onMacdUpgradeUpdateCreated}
        onMacdUpgradeUpdateAnalysisStart={() => setShowMacdUpgradeUpdateOverlay(true)}
        macdQuoteActive={selectedQuote === 'MACD Quote'}
        onMarkAllNotificationsReadOnNavigateToQuote={() => { /* do not clear requested-values notification when on Quote so bell + popup show after update/change flow */ }}
        updatedConfigurationsToQuoteNotification={updatedConfigurationsToQuoteNotification}
        onNavigateToUpdatedConfigurationsToQuote={() => {
          setUpdatedConfigurationsToQuoteNotification(false)
          setConfigToQuoteOverlayVisible(false)
          setConfigUpdateInProgressFromLink(true)
          const { ids, count } = pendingConfigRef.current
          setTimeout(() => {
            setSummaryUpdatedProductRowIds(new Set(ids))
            setSummaryConfigSuccessCount(count)
            setSummaryConfigSuccessBannerDismissed(false)
            setConfigUpdateInProgressFromLink(false)
            pendingConfigRef.current = { ids: [], count: 0 }
          }, 2000)
        }}
        feasibilityProposalNotification={feasibilityProposalNotification}
        onNavigateToFeasibilityProposal={() => {
          setFeasibilityProposalNotification(false)
          setCheckFeasibilityOverlayOnSummary(false)
          setCurrentPage('Quote')
          setActiveTab('Summary')
          setFeasibilityCheckInProgress(true)
          setTimeout(() => {
            setFeasibilityCheckInProgress(false)
            setFeasibilityCheckComplete(true)
          }, 2000)
        }}
        feasibilityExtractionNotification={feasibilityExtractionNotification}
        onNavigateToFeasibilityExtraction={onNavigateToFeasibilityExtraction}
        onFeasibilityExtractionStatusShown={() => setFeasibilityExtractionNotification(true)}
        onNavigateToFeasibilityCheck={() => {
          setFeasibilityCheckNavigateSignal((v) => v + 1)
        }}
        onNavigateToFeasibilityValidateAddress={() => {
          setFeasibilityValidateAddressNavigateSignal((v) => v + 1)
        }}
        onNavigateToFeasibilityMatchedProducts={() => {
          setFeasibilityMatchedProductsNavigateSignal((v) => v + 1)
        }}
        onFeasibilityLocationMatchAnalysisStart={() => setFeasibilityLocationMatchAnalysisOverlayVisible(true)}
        onFeasibilityLocationMatchStatusShown={() => {
          setFeasibilityLocationMatchAnalysisOverlayVisible(false)
          setFeasibilityLocationMatchStartSignal((v) => v + 1)
        }}
        onNavigateToFeasibilityLocationMatch={() => {
          setFeasibilityLocationMatchNavigateSignal((v) => v + 1)
        }}
        newQuoteLocationsExtractionNotification={newQuoteLocationsExtractionNotification}
        newQuoteLocationsExtractionLinkText={newQuoteLocationsExtractionLinkText}
        onNavigateToNewQuoteLocationsExtraction={onNavigateToNewQuoteLocationsExtraction}
        onNewQuoteLocationsExtractionStatusShown={(accountName) => {
          const cleanedName = String(accountName || 'HDFC Bank').replace(/\s+Account$/i, '').trim() || 'HDFC Bank'
          setNewQuoteLocationsExtractionLinkText(`Extracted Information for ${cleanedName} account`)
          setNewQuoteLocationsExtractionNotification(true)
        }}
        sbiQuoteNotification={sbiQuoteNotification}
        onSbiQuoteStatusShown={() => {
          setPendingSbiFeasibilityRowIds([])
          setSbiQuoteNotification(true)
        }}
        onNavigateToSbiQuote={onNavigateToSbiQuote}
        hdfcQuoteNotification={hdfcQuoteNotification}
        onNavigateToHdfcQuote={onNavigateToHdfcQuote}
        validateQuoteNotification={validateQuoteNotification}
        onNavigateToValidatedQuote={() => {
          setValidateQuoteNotification(false)
          setValidateQuoteOverlayOnSummary(false)
          setCurrentPage('Quote')
          setActiveTab('Summary')
          setValidateQuoteInProgress(true)
          setTimeout(() => {
            setValidateQuoteInProgress(false)
            setValidateQuoteComplete(true)
            setValidateQuoteSuccessBannerDismissed(false) // show banner when validation completes
          }, 2000)
        }}
        restoreQuoteAgentforceKey={AGENTFORCE_QUOTE_RESTORE_KEY}
        enrichQuoteFlowActive={showEnrichQuotePage}
        quoteActionsRef={quoteActionsRef}
        skipOpenPanelOnHomeRef={skipOpenPanelOnHomeRef}
        onNavigateToQuote2={() => {
          setCurrentPage('Quote')
          setSelectedQuote('Quote 2')
        }}
        onQuote2POUpdated={() => setQuote2ProgressStage('Proposal')}
        onMatchProductsResponseShown={() => setHasUpdatedQuoteNotification(true)}
        onMatchProductsAnalysisStart={() => setShowMatchProductsAnalysisOverlay(true)}
        onMatchProductsAnalysisEnd={() => setShowMatchProductsAnalysisOverlay(false)}
        onVerifyDetailsResponseShown={() => setHasUpdatedQuoteProposal2Notification(true)}
        onVerifyDetailsAnalysisStart={() => setShowVerifyDetailsAnalysisOverlay(true)}
        onVerifyDetailsAnalysisEnd={() => setShowVerifyDetailsAnalysisOverlay(false)}
        onAddProductsResponseShown={() => setHasUpdatedQuoteProposal4Notification(true)}
        onAddProductsAnalysisStart={() => setShowAddProductsAnalysisOverlay(true)}
        onAddProductsAnalysisEnd={() => setShowAddProductsAnalysisOverlay(false)}
        onUpdateChangeAnalysisStart={() => setShowUpdateChangeAnalysisOverlay(true)}
        onUpdateChangeAnalysisEnd={() => setShowUpdateChangeAnalysisOverlay(false)}
        onPOChangeUpdateAnalysisStart={() => setShowPOChangeUpdateOverlay(true)}
        technicalAttributesPageActive={showEnrichQuotePage && showTechnicalAttributesPage}
        onTechnicalAttributesToggleCompareWithAsset={() => setCompareWithAsset(true)}
      />
      <main className="flex-1 flex flex-col p-6 max-w-[1920px] w-full mx-auto pb-4 min-h-0">
        <LocationsProvider value={{ locations: currentPage === 'Quote' ? quoteContentLocations : locationsForDownstreamTabs, onUpdateLocation: handleUpdateLocation, onDeleteLocations: handleDeleteLocations }}>
        {currentPage === 'Home' && (
          <HomePage
            onRefresh={() => {
              skipOpenPanelOnHomeRef.current = true
              setCurrentPage('Home')
              setAgentforcePanelOpen(false)
            }}
          />
        )}
        {currentPage === 'Quote' && (
          <>
            {selectedQuote === 'Technical Enrichment' ? (
              <TechnicalEnrichmentPage />
            ) : (
              selectedQuote === 'Request for Feasibility (Locations)'
              || selectedQuote === 'Request for New Quote - Locations'
              || selectedQuote === 'Request for New Quote - Locations + PO'
            ) ? (
              <RequestFeasibilityLocationsPage
                quote1Locations={quoteSummaryLocations?.length ? quoteSummaryLocations : quoteContentLocations}
                feasibilityPageName={
                  selectedQuote === 'Request for New Quote - Locations + PO'
                    ? 'Feasibility of HDFC Bank (Locations+PO)'
                    : selectedQuote === 'Request for New Quote - Locations'
                      ? 'Feasibility of HDFC Bank (Locations)'
                      : 'Feasibility of SBI Bank'
                }
                feasibilityRequestId={
                  selectedQuote === 'Request for New Quote - Locations + PO'
                    ? 'FR-0003'
                    : selectedQuote === 'Request for New Quote - Locations'
                      ? 'FR-0002'
                      : 'FR-0001'
                }
                accountName={
                  selectedQuote === 'Request for New Quote - Locations + PO' || selectedQuote === 'Request for New Quote - Locations'
                    ? 'HDFC Bank'
                    : 'SBI Bank'
                }
                opportunityName={
                  selectedQuote === 'Request for New Quote - Locations + PO' || selectedQuote === 'Request for New Quote - Locations'
                    ? 'HDFC Bank - New opportunity'
                    : ''
                }
                quoteName={
                  selectedQuote === 'Request for New Quote - Locations + PO' || selectedQuote === 'Request for New Quote - Locations'
                    ? 'HDFC Bank Quote'
                    : ''
                }
                showUpdateQuoteOnly={
                  selectedQuote === 'Request for New Quote - Locations + PO' || selectedQuote === 'Request for New Quote - Locations'
                }
                onFeasibilityQuoteStatusShown={
                  selectedQuote === 'Request for New Quote - Locations + PO' || selectedQuote === 'Request for New Quote - Locations'
                    ? onHdfcFeasibilityQuoteStatusShown
                    : undefined
                }
                onConvertToOpportunityAndQuote={onConvertToSbiOpportunityAndQuote}
                externalCheckFeasibilityNavigateSignal={feasibilityCheckNavigateSignal}
                externalValidateAddressNavigateSignal={feasibilityValidateAddressNavigateSignal}
                externalMatchProductsNavigateSignal={feasibilityMatchedProductsNavigateSignal}
                externalFeasibilityQuoteNavigateSignal={hdfcQuoteNavigateSignal}
                externalLocationMatchOverlayVisible={feasibilityLocationMatchAnalysisOverlayVisible}
                externalLocationMatchStartSignal={feasibilityLocationMatchStartSignal}
                externalLocationMatchNavigateSignal={feasibilityLocationMatchNavigateSignal}
              />
            ) : (selectedQuote === 'Quote 1' || selectedQuote === 'MACD Quote' || selectedQuote === 'SBI Bank Quote' || selectedQuote === 'HDFC Bank Quote') ? (
            <div className="relative flex flex-col flex-1 min-h-0">
            {validateQuoteComplete && !validateQuoteSuccessBannerDismissed && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center" role="status">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-green-600 rounded-lg shadow-lg text-white w-max">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div className="min-w-0 text-center">
                    <p className="text-sm font-bold leading-tight">Success</p>
                    <p className="text-xs font-normal opacity-95 leading-tight">Quote Validation is successful</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValidateQuoteSuccessBannerDismissed(true)}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'Summary' && summaryConfigSuccessCount != null && summaryConfigSuccessCount > 0 && !summaryConfigSuccessBannerDismissed && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center" role="status">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-green-600 rounded-lg shadow-lg text-white w-max">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div className="min-w-0 text-center">
                    <p className="text-sm font-bold leading-tight">Success</p>
                    <p className="text-xs font-normal opacity-95 leading-tight">
                      {summaryConfigSuccessCount} location{summaryConfigSuccessCount === 1 ? '' : 's'} were successfully configured
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSummaryConfigSuccessBannerDismissed(true)
                      setSummaryConfigSuccessCount(null)
                    }}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <QuoteSection
              oneTimeTotal={summaryTotals.oneTimeTotal}
              arcTotal={0}
              monthlyTotal={summaryTotals.monthlyTotal}
              quoteTotal={summaryTotals.quoteTotal}
              quoteTitle={selectedQuote === 'SBI Bank Quote' ? 'SBI Bank Quote' : selectedQuote === 'HDFC Bank Quote' ? 'HDFC Bank Quote' : 'HDFC bank connectivity across India'}
              showExtractedInformationTab={selectedQuote !== 'SBI Bank Quote' && selectedQuote !== 'HDFC Bank Quote'}
              feasibilityRequestId={selectedQuote === 'SBI Bank Quote' ? 'FR-0001' : selectedQuote === 'HDFC Bank Quote' ? hdfcQuoteFeasibilityRequestId : ''}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              extractedInfoCount={extractedRecordCount}
              locationsCount={quoteContentLocations.length}
              summaryCount={quoteSummaryLocations.length}
              onCheckFeasibility={() => {
                setActiveTab('Summary')
                setCheckFeasibilityOverlayOnSummary(true)
                setFeasibilityProposalNotification(true)
              }}
              onValidateQuote={() => {
                setActiveTab('Summary')
                setValidateQuoteOverlayOnSummary(true)
                setValidateQuoteNotification(true)
              }}
              status={validateQuoteComplete ? 'Validated' : feasibilityCheckComplete ? 'Feasibility' : 'Draft'}
            />
            <div className="flex-1 min-h-0 relative">
              {showMatchAllOverlay && currentPage === 'Quote' && activeTab === 'Extracted Information' && (
                <div className="absolute inset-0 z-20 bg-black/20 pointer-events-auto" aria-hidden="true" />
              )}
              {showValidateOverlay && currentPage === 'Quote' && activeTab === 'Extracted Information' && (
                <div className="absolute inset-0 z-20 bg-white/40 pointer-events-auto" aria-hidden="true" />
              )}
              {showContinueValidOverlay && currentPage === 'Quote' && activeTab === 'Extracted Information' && (
                <div className="absolute inset-0 z-20 bg-white/40 pointer-events-auto" aria-hidden="true" />
              )}
              {showContinueSummaryOverlay && currentPage === 'Quote' && activeTab === 'Locations' && (
                <div className="absolute inset-0 z-20 bg-white/40 pointer-events-auto" aria-hidden="true" />
              )}
              {showMatchedProductsOverlay && currentPage === 'Quote' && activeTab === 'Extracted Information' && (
                <div className="absolute inset-0 z-20 bg-white/40 pointer-events-auto" aria-hidden="true" />
              )}
              {(addressValidationInProgress || summaryLoadingInProgress || attributesViewLoadingInProgress || matchedProductsViewLoadingInProgress || updatingRequestedValuesInProgress) && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-white/90" aria-live="polite">
                  <div className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {updatingRequestedValuesInProgress ? 'Updates are in progress' : matchedProductsViewLoadingInProgress ? 'Products are getting matched' : 'Data is getting verified'}
                  </p>
                </div>
              )}
              {activeTab === 'Summary' ? (
                editingSummaryRow ? (
                  <div className="relative flex-1 min-h-0 flex flex-col">
                    <ConfigurationCartView
                      row={editingSummaryRow}
                      selectedRowIds={selectedSummaryRowIdsForConfig}
                      summaryLocations={quoteSummaryLocations?.length ? quoteSummaryLocations : quoteContentLocations}
                      updatedProductRowIds={summaryUpdatedProductRowIds}
                      showFeasibilityResults={feasibilityCheckComplete}
                      onBack={() => {
                        setEditingSummaryRow(null)
                        setSelectedSummaryRowIdsForConfig(new Set())
                        setActiveTab('Summary')
                      }}
                      onAddProductsToQuote={(selectedLocationIds = []) => {
                        const ids = Array.isArray(selectedLocationIds) ? selectedLocationIds : []
                        if (ids.length === 0) return
                        pendingConfigRef.current = { ids, count: ids.length }
                        setConfigUpdateInProgress(true)
                        setSummaryUpdatedProductRowIds((prev) => new Set([...prev, ...ids]))
                        setEditingSummaryRow(null)
                        setSelectedSummaryRowIdsForConfig(new Set())
                        setActiveTab('Summary')
                        setConfigToQuoteOverlayVisible(true)
                        setUpdatedConfigurationsToQuoteNotification(true)
                        setTimeout(() => {
                          setConfigUpdateInProgress(false)
                          setConfigToQuoteOverlayVisible(false)
                        }, 1800)
                      }}
                      locations={
                      editingSummaryRow?.product === 'Internet'
                        ? (() => {
                            const summaryRows = buildSummaryRows(quoteSummaryLocations)
                            const internetIds = new Set(summaryRows.filter((r) => r.product === 'Internet').map((r) => r.id))
                            return quoteContentLocations.filter((loc) => internetIds.has(loc.id))
                          })()
                        : quoteContentLocations
                    }
                    onUpdateLocation={handleUpdateLocation}
                    onDeleteLocations={handleDeleteLocations}
                  />
                    {configUpdateInProgress && (
                      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/95 rounded-lg border border-gray-200" aria-live="polite">
                        <div className="flex gap-1" aria-hidden>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span key={i} className="w-2 h-2 rounded-full bg-airtel-red animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Configurations Update in progress</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {configToQuoteOverlayVisible && (
                      <div className="absolute inset-0 z-20 bg-white/60 pointer-events-auto rounded-lg" aria-hidden="true" />
                    )}
                    {configUpdateInProgressFromLink && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-white/90 rounded-lg" aria-live="polite">
                        <div className="flex gap-1" aria-hidden>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span key={i} className="w-2 h-2 rounded-full bg-airtel-red animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Configurations are getting updated</p>
                      </div>
                    )}
                    <SummaryTabContent
                      locations={quoteSummaryLocations}
                      onTotalsChange={setSummaryTotals}
                      onEditRow={(row, selectedIds) => {
                        setEditingSummaryRow(row)
                        setSelectedSummaryRowIdsForConfig(selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []))
                      }}
                      showFeasibilityEmptyInitially={summaryFeasibilityEmptyInitially}
                      updatedProductHighlight={summaryUpdatedProductHighlight}
                      updatedProductRowIds={summaryUpdatedProductRowIds}
                      showFeasibilityResults={feasibilityCheckComplete}
                    />
                    {checkFeasibilityOverlayOnSummary && (
                      <div className="absolute inset-0 z-20 bg-white/60 pointer-events-auto rounded-lg" aria-hidden="true" />
                    )}
                    {validateQuoteOverlayOnSummary && (
                      <div className="absolute inset-0 z-20 bg-white/60 pointer-events-auto rounded-lg" aria-hidden="true" />
                    )}
                    {feasibilityCheckInProgress && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-white/90 rounded-lg" aria-live="polite">
                        <div className="flex gap-1" aria-hidden>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span key={i} className="w-2 h-2 rounded-full bg-airtel-red animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Feasibility Check in progress..</p>
                      </div>
                    )}
                    {validateQuoteInProgress && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-white/90 rounded-lg" aria-live="polite">
                        <div className="flex gap-1" aria-hidden>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span key={i} className="w-2 h-2 rounded-full bg-airtel-red animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Quote Validation in progress..</p>
                      </div>
                    )}
                  </>
                )
              ) : activeTab === 'Locations' ? (
                <LocationsTabContent showAddConfigurationsButton={false} />
              ) : extractionInProgress ? (
                <div className="flex flex-col items-center justify-center flex-1 min-h-0 w-full bg-white rounded-lg border border-gray-100 shadow-sm absolute inset-0">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <img src={emptystateImg} alt="" className="w-40 h-auto object-contain" />
                    <p className="text-gray-700 font-bold">Data is getting extracted....</p>
                    <div className="flex gap-1" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <DataTableSection
                  isMacdQuote={selectedQuote === 'MACD Quote'}
                  continuedRecordIds={continuedRecordIds}
                  validationByRowId={validationByRowId}
                  validationResult={validationResult}
                  onRecordCountChange={setExtractedRecordCount}
                  onValidationComplete={(validatedCount, validatedIds, validationState) => {
                    setVerificationInProgress(false)
                    setValidationComplete(true)
                    setValidatedRecordCount(validatedCount ?? 0)
                    if (validatedIds) setValidatedRecordIds(validatedIds)
                    if (validationState) {
                      setValidationByRowId(validationState.validationByRowId ?? null)
                      setValidationResult(validationState.validationResult ?? null)
                    }
                  }}
                  onValidationStarted={() => setVerificationInProgress(true)}
                  onSelectionChange={setSelectedRecordCount}
                  onSelectedIdsChange={setSelectedRecordIds}
                  onLocationsData={setLocationsData}
                  quoteActionsRef={quoteActionsRef}
                  showMatchedResults={showMatchedResults}
                  onMatchValidationComplete={() => {
                    setHasUpdatedQuoteNotification(true)
                    setShowMatchedResults(false)
                    setShowMatchAllOverlay(true)
                  }}
                  showAttributesPrefilledNotification={showAttributesPrefilledNotification}
                  onDismissAttributesPrefilled={() => setShowAttributesPrefilledNotification(false)}
                  revealMatchedResultsInProgress={revealMatchedResultsInProgress}
                  onRevealComplete={onRevealComplete}
                  hideMatchSummaryNotification={hideUnmatchedRecordsBanner}
                  onMatchedProductsEditComplete={(affectedRowIds) => {
                    matchedProductsUpdatedRowIdsRef.current = affectedRowIds || []
                    // Do not show bell/popup or overlay for UI inline/bulk edit; only agentic conversation flow shows notification
                  }}
                />
              )}
            </div>
            {activeTab === 'Extracted Information' && !extractionInProgress && (
              <FooterActions
                onValidate={() => {
                  setHideUnmatchedRecordsBanner(true)
                  setHasUpdatedQuoteProposal2Notification(true)
                  setShowValidateOverlay(true)
                }}
                validationComplete={validationComplete}
                onContinueWithValidRecords={handleContinueWithValidRecords}
              />
            )}
            {activeTab === 'Locations' && (
              <div className="flex justify-end gap-2 mt-2 pt-2 flex-shrink-0">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-md border border-gray-300 bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg"
                >
                  Add Products
                </button>
                <button
                  type="button"
                  onClick={handleContinueToSummary}
                  className="px-4 py-1.5 rounded-md text-xs font-medium bg-airtel-red text-white hover:opacity-90"
                >
                  Add products from Extracted information
                </button>
              </div>
            )}
            {activeTab === 'Summary' && !editingSummaryRow && (
              <div className="flex justify-end mt-2 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setQuote2ProgressStage('Draft')
                    setSelectedQuote('Quote 2')
                  }}
                  className="px-4 py-1.5 rounded-md text-xs font-medium bg-airtel-red text-white hover:opacity-90"
                >
                  Add Products
                </button>
              </div>
            )}
            </div>
            ) : showEnrichQuotePage && showTechnicalAttributesPage ? (
              <TechnicalAttributesPage
                compareWithAsset={compareWithAsset}
                onCompareWithAssetChange={setCompareWithAsset}
                technicalAttributesOverrides={technicalAttributesOverrides}
                productFilterLocationIds={technicalAttributesInternetLocationIds}
                autoFillValues={technicalAttributesShouldAutofill}
                onBackToEnrichQuote={() => {
                  setShowTechnicalAttributesPage(false)
                  setCompareWithAsset(false)
                }}
                onSaveWithConfiguredLocations={(ids) => {
                  setTechnicalAttributesConfiguredLocationIds(ids instanceof Set ? ids : new Set(ids || []))
                }}
                onBackToQuote={() => {
                  setShowTechnicalAttributesPage(false)
                  setShowEnrichQuotePage(false)
                  setCompareWithAsset(false)
                  setEnrichQuoteUpdateIntent(null)
                  setTechnicalAttributesOverrides(null)
                  setTechnicalAttributesConfiguredLocationIds(new Set())
                  setTechnicalAttributesShouldAutofill(false)
                }}
              />
            ) : showEnrichQuotePage ? (
              <SelectQuoteLineItemsPage
                onBack={() => { setShowEnrichQuotePage(false); setEnrichQuoteUpdateIntent(null); setTechnicalAttributesConfiguredLocationIds(new Set()) }}
                quote1Locations={locationsForSummaryTab?.length ? locationsForSummaryTab : locationsForDownstreamTabs}
                onTechnicalAttributesClick={(row) => {
                  const technicalAttributesValue = (row?.technicalAttributes || '').toString().trim().toLowerCase()
                  setTechnicalAttributesShouldAutofill(technicalAttributesValue === 'autofilled')
                  setShowTechnicalAttributesPage(true)
                }}
                enrichQuoteUpdateIntent={enrichQuoteUpdateIntent}
                technicalAttributesConfiguredLocationIds={technicalAttributesConfiguredLocationIds}
              />
            ) : (
              <QuoteProposalPage progressStage={quote2ProgressStage} onEnrichQuoteClick={() => setShowEnrichQuotePage(true)} />
            )}
          </>
        )}
        {currentPage === 'Accounts' && <AccountsPage />}
        </LocationsProvider>
      </main>
    </div>
  )
}

export default App
