import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import agentforceIcon from './AgentforceIcon.png'
import AgentforceSidePanel from './AgentforceSidePanel'

const AGENTFORCE_CONVERSATION_SNAPSHOT_KEY = 'agentforce_conversation_snapshot'
const AGENTFORCE_ENRICH_QUOTE_RESTORE_KEY = 'airtel_esm_agentforce_enrich_quote_restore'

function getStoredQuoteRestore(key) {
  if (!key) return null
  try {
    const s = localStorage.getItem(key)
    if (!s) return null
    const j = JSON.parse(s)
    if (j?.tab === 'Quote' && j?.panelOpen === true) return j
    return null
  } catch (_) {
    return null
  }
}

function getStoredConversationSnapshot() {
  try {
    const s = localStorage.getItem(AGENTFORCE_CONVERSATION_SNAPSHOT_KEY)
    if (!s) return null
    const j = JSON.parse(s)
    if (j && typeof j.isConversationView === 'boolean' && Array.isArray(j.messages)) return j
    return null
  } catch (_) {
    return null
  }
}

// Default Quote 1 panel state: full create-quote conversation so the chat around "Create quote" / "create proposal" is shown when panel is opened on Quote 1
const DEFAULT_QUOTE1_PANEL_SNAPSHOT = {
  isConversationView: true,
  messages: [
    { id: 'u1', role: 'user', text: 'Create quote' },
    { id: 'a1', role: 'agent', text: 'Hi! I can assist you with that. You can upload the document directly. Would you like to proceed with uploading the document or any other type of document?' },
    { id: 'u2', role: 'user', text: 'Yes' },
    { id: 'a2', role: 'agent', text: 'Upload file' },
    { id: 'u3', role: 'user', text: 'Updated the document (Quotes_2026-03-08.xlsx)' },
    { id: 'a3', role: 'agent', text: 'Your file is being processed, you will be notified once done, or you can check the status here', showQuoteProposalStatusLink: true },
  ],
  hasNotification: false,
}

function Header({ activeNavTab = 'Quote', onNavClick, selectedQuote = 'Quote 1', onQuoteSelect, onNavigateToQuoteExtractedInfo, onNavigateToUpdatedQuote, updatedQuoteNotification = false, onNavigateToUpdatedQuote2, updatedQuoteProposal2Notification = false, onNavigateToUpdatedQuote3, updatedQuoteProposal3Notification = false, onNavigateToUpdatedQuote4, updatedQuoteProposal4Notification = false, attributesUpdatedNotification = false, onAttributesUpdated, onNavigateToAttributesUpdatedView, updatedMatchedProductsNotification = false, onNavigateToUpdatedMatchedProducts, updatedRequestedValuesNotification = false, onNavigateToUpdatedRequestedValues, onUpdatedRequestedValuesCreated, onMarkAllNotificationsRead, feasibilityProposalNotification = false, onNavigateToFeasibilityProposal, feasibilityExtractionNotification = false, onNavigateToFeasibilityExtraction, onFeasibilityExtractionStatusShown, onFeasibilityCheckStatusShown, onNavigateToFeasibilityCheck, onFeasibilityValidateAddressStatusShown, onNavigateToFeasibilityValidateAddress, onFeasibilityMatchedProductsStatusShown, onNavigateToFeasibilityMatchedProducts, onFeasibilityLocationMatchAnalysisStart, onFeasibilityLocationMatchStatusShown, onNavigateToFeasibilityLocationMatch, newQuoteLocationsExtractionNotification = false, newQuoteLocationsExtractionLinkText = 'Extracted Information for HDFC Bank account', onNavigateToNewQuoteLocationsExtraction, onNewQuoteLocationsExtractionStatusShown, sbiQuoteNotification = false, onNavigateToSbiQuote, onSbiQuoteStatusShown, hdfcQuoteNotification = false, onNavigateToHdfcQuote, validateQuoteNotification = false, onNavigateToValidatedQuote, updatedConfigurationsToQuoteNotification = false, onNavigateToUpdatedConfigurationsToQuote, onMarkAllNotificationsReadOnNavigateToQuote, restoreQuoteAgentforceKey, enrichQuoteFlowActive = false, quoteActionsRef, agentforcePanelOpen: agentforcePanelOpenProp, onAgentforcePanelChange, skipOpenPanelOnHomeRef, onNavigateToQuote2, onQuote2POUpdated, quote2ProgressStage = 'Draft', onMatchProductsResponseShown, onMatchProductsAnalysisStart, onMatchProductsAnalysisEnd, onVerifyDetailsResponseShown, onVerifyDetailsAnalysisStart, onVerifyDetailsAnalysisEnd, onAddProductsResponseShown, onAddProductsAnalysisStart, onAddProductsAnalysisEnd, onUpdateChangeAnalysisStart, onUpdateChangeAnalysisEnd, updatedUpgradeQuoteNotification = false, onNavigateToUpgradeQuote, onUpgradeQuoteCreated, updatedEnrichQuoteUpdateNotification = false, enrichQuoteUpdateIntent, onNavigateToEnrichQuoteUpdate, onEnrichQuoteUpdateCreated, onPOChangeUpdateAnalysisStart, technicalAttributesPageActive = false, onTechnicalAttributesToggleCompareWithAsset, updatedTechnicalAttributesUpdateNotification = false, technicalAttributesUpdateIntent, onNavigateToTechnicalAttributesUpdate, onTechnicalAttributesUpdateCreated, updatedMacdUpgradeUpdateNotification = false, onNavigateToMacdUpgradeUpdate, onMacdUpgradeUpdateCreated, onMacdUpgradeUpdateAnalysisStart, macdQuoteActive = false }) {
  const effectiveRestoreKey =
    restoreQuoteAgentforceKey && activeNavTab === 'Quote' && selectedQuote
      ? `${restoreQuoteAgentforceKey}_${String(selectedQuote).replace(/\s/g, '')}`
      : restoreQuoteAgentforceKey
  const stored = effectiveRestoreKey ? getStoredQuoteRestore(effectiveRestoreKey) : null
  const [agentforcePanelOpenLocal, setAgentforcePanelOpenLocal] = useState(!!(stored?.panelOpen))
  const agentforcePanelOpen = onAgentforcePanelChange != null ? agentforcePanelOpenProp : agentforcePanelOpenLocal
  const setAgentforcePanelOpen = onAgentforcePanelChange ?? setAgentforcePanelOpenLocal
  const [bellNotification, setBellNotification] = useState(false)
  const [feasibilityCheckNotification, setFeasibilityCheckNotification] = useState(false)
  const [feasibilityValidateAddressNotification, setFeasibilityValidateAddressNotification] = useState(false)
  const [feasibilityMatchedProductsNotification, setFeasibilityMatchedProductsNotification] = useState(false)
  const [feasibilityLocationMatchNotification, setFeasibilityLocationMatchNotification] = useState(false)
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false)
  const [quoteDropdownOpen, setQuoteDropdownOpen] = useState(false)
  const [feasibilityDropdownOpen, setFeasibilityDropdownOpen] = useState(false)
  const panelStateRef = useRef(null)
  const notificationPopoverRef = useRef(null)
  const quoteDropdownRef = useRef(null)
  const feasibilityDropdownRef = useRef(null)
  const quoteButtonRef = useRef(null)
  const feasibilityButtonRef = useRef(null)
  const [quoteDropdownPosition, setQuoteDropdownPosition] = useState({ top: 0, left: 0 })
  const [feasibilityDropdownPosition, setFeasibilityDropdownPosition] = useState({ top: 0, left: 0 })

  // Single handler for "Updated Quote Proposal with Matched Products" – same action for both bell popup and agentic chat link (navigate, clear notification). Panel stays open unless user closes it.
  const handleNavigateToMatchedProducts = useCallback(() => {
    setBellNotification(false)
    setNotificationPopoverOpen(false)
    onNavigateToUpdatedQuote?.()
    onMarkAllNotificationsRead?.()
    // Ensure red dot stays cleared after navigation/state updates
    setTimeout(() => setBellNotification(false), 0)
  }, [onNavigateToUpdatedQuote, onMarkAllNotificationsRead])

  // Single handler for "Updated Quote Proposal with Verified Details" – used by both bell popup and agent conversation link
  const handleNavigateToVerifiedDetails = useCallback(() => {
    onNavigateToUpdatedQuote2?.()
    setNotificationPopoverOpen(false)
    setBellNotification(false)
    onMarkAllNotificationsRead?.()
  }, [onNavigateToUpdatedQuote2, onMarkAllNotificationsRead])

  // Single handler for "Added Products from Extracted Information" – used by both bell popup and agent conversation link
  const handleNavigateToAddedProductsFromExtracted = useCallback(() => {
    onNavigateToUpdatedQuote4?.()
    setNotificationPopoverOpen(false)
    setBellNotification(false)
    onMarkAllNotificationsRead?.()
  }, [onNavigateToUpdatedQuote4, onMarkAllNotificationsRead])

  useEffect(() => {
    if (!notificationPopoverOpen) return
    const handleClickOutside = (e) => {
      if (notificationPopoverRef.current && !notificationPopoverRef.current.contains(e.target)) {
        setNotificationPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notificationPopoverOpen])

  useEffect(() => {
    if (!sbiQuoteNotification) return
    setNotificationPopoverOpen(true)
    setBellNotification(true)
  }, [sbiQuoteNotification])

  useEffect(() => {
    if (!hdfcQuoteNotification) return
    setNotificationPopoverOpen(true)
    setBellNotification(true)
  }, [hdfcQuoteNotification])

  useEffect(() => {
    if (!newQuoteLocationsExtractionNotification) return
    setNotificationPopoverOpen(true)
    setBellNotification(true)
  }, [newQuoteLocationsExtractionNotification])

  useEffect(() => {
    if (!quoteDropdownOpen && !feasibilityDropdownOpen) return
    const handleClickOutside = (e) => {
      const inButton = quoteButtonRef.current && quoteButtonRef.current.contains(e.target)
      const inFeasibilityButton = feasibilityButtonRef.current && feasibilityButtonRef.current.contains(e.target)
      const inDropdown = e.target.closest?.('[data-quote-dropdown]')
      const inFeasibilityDropdown = e.target.closest?.('[data-feasibility-dropdown]')
      if (!inButton && !inDropdown) setQuoteDropdownOpen(false)
      if (!inFeasibilityButton && !inFeasibilityDropdown) setFeasibilityDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [quoteDropdownOpen, feasibilityDropdownOpen])

  // When user goes to Quote (e.g. via "here" link or bell notification), show the conversation that happened so far; prefer persisted conversation snapshot so chat from Home is reflected on Quote page
  const conversationSnapshot = getStoredConversationSnapshot()
  const enrichQuoteStored = enrichQuoteFlowActive ? (() => {
    try {
      const s = localStorage.getItem(AGENTFORCE_ENRICH_QUOTE_RESTORE_KEY)
      if (!s) return null
      const j = JSON.parse(s)
      if (j && typeof j.isConversationView === 'boolean' && Array.isArray(j.messages)) return j
      return null
    } catch (_) { return null }
  })() : null
  const snapshotToPass =
    agentforcePanelOpen
      ? activeNavTab === 'Quote'
            ? (enrichQuoteFlowActive && enrichQuoteStored?.messages?.length
            ? enrichQuoteStored
            : conversationSnapshot?.messages?.length
            ? conversationSnapshot
            : stored?.snapshot && typeof stored.snapshot.isConversationView === 'boolean' && Array.isArray(stored.snapshot.messages)
              ? stored.snapshot
              : selectedQuote === 'Quote 1' || selectedQuote === 'MACD Quote' || (selectedQuote === 'Quote 2' && quote2ProgressStage === 'Draft')
                ? DEFAULT_QUOTE1_PANEL_SNAPSHOT
                : null)
        : enrichQuoteFlowActive && enrichQuoteStored?.messages?.length
          ? enrichQuoteStored
          : conversationSnapshot?.messages?.length
            ? conversationSnapshot
            : null
      : null

  useEffect(() => {
    if (effectiveRestoreKey && activeNavTab !== 'Quote') {
      try { localStorage.removeItem(effectiveRestoreKey) } catch (_) {}
    }
  }, [effectiveRestoreKey, activeNavTab])

  // When navigating to Enrich Quote, sync conversation from general snapshot to Enrich Quote restore key so panel shows PO/Quote conversation history
  useEffect(() => {
    if (enrichQuoteFlowActive) {
      const conv = getStoredConversationSnapshot()
      if (conv?.messages?.length) {
        try {
          const payload = { isConversationView: conv.isConversationView, messages: conv.messages, hasNotification: conv.hasNotification ?? false, isPinned: conv.isPinned ?? false }
          localStorage.setItem(AGENTFORCE_ENRICH_QUOTE_RESTORE_KEY, JSON.stringify(payload))
        } catch (_) {}
      }
    }
  }, [enrichQuoteFlowActive])

  // When Quote page opens, clear the red dot on the bell icon (except "Updated Configurations to Quote" which is set while on Quote)
  useEffect(() => {
    if (activeNavTab === 'Quote') {
      setBellNotification(false)
      onMarkAllNotificationsReadOnNavigateToQuote?.()
    }
  }, [activeNavTab, onMarkAllNotificationsReadOnNavigateToQuote])

  // On Home page, show the Agentforce panel on top of the content by default (unless Refresh was just clicked)
  useEffect(() => {
    if (activeNavTab === 'Home') {
      if (!skipOpenPanelOnHomeRef?.current) setAgentforcePanelOpen(true)
      if (skipOpenPanelOnHomeRef) skipOpenPanelOnHomeRef.current = false
    }
  }, [activeNavTab, setAgentforcePanelOpen])

  const navItems = [
    { label: 'Home', hasChevron: false },
    { label: 'Quote', hasChevron: true },
    { label: 'Feasibility Request', hasChevron: true },
    { label: 'Contacts', hasChevron: true },
    { label: 'Service', hasChevron: true },
    { label: 'Sales', hasChevron: true },
    { label: 'Accounts', hasChevron: true },
    { label: 'Dashboards', hasChevron: true },
    { label: 'Reports', hasChevron: true },
    { label: 'More', hasChevron: true },
  ]

  return (
    <>
    <header className={`bg-white border-b border-gray-200 sticky top-0 ${notificationPopoverOpen ? 'z-[100]' : 'z-[60]'}`}>
      {/* Top row: logo (left), search (center), status pills + utility icons (right) */}
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="shrink-0 w-[120px]">
          <a href="/" className="inline-flex items-center focus:outline-none text-airtel-red font-bold text-xl tracking-tight" aria-label="Airtel home" style={{ fontFamily: 'system-ui, sans-serif' }}>
            airtel
          </a>
        </div>

        <div className="flex-1 flex justify-center max-w-xl mx-4">
          <div className="relative w-full">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-11 pr-5 py-2.5 border border-gray-300 rounded-full bg-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-airtel-red/20 focus:border-airtel-red"
            />
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setAgentforcePanelOpen(true)}
            className="p-2 rounded-full text-gray-600 hover:bg-grey-bg"
            aria-label="Agentforce"
          >
            <img src={agentforceIcon} alt="Agentforce" className="w-5 h-5 object-contain" />
          </button>
          <button type="button" className="flex items-center rounded-full overflow-hidden border border-gray-200 hover:bg-grey-bg" aria-label="Favorites">
            <span className="p-2 bg-grey-bg border-r border-gray-200">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </span>
            <span className="p-1.5 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </button>
          <button type="button" className="p-2 rounded-full text-gray-600 hover:bg-grey-bg" aria-label="Add">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button type="button" className="p-2 rounded-full text-gray-600 hover:bg-grey-bg" aria-label="Module">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 18l4-6 3 4 3-6 4 8H4z" />
            </svg>
          </button>
          <button type="button" className="p-2 rounded-full text-gray-600 hover:bg-grey-bg" aria-label="Help">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button type="button" className="p-2 rounded-full text-gray-600 hover:bg-grey-bg" aria-label="Settings">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="relative" ref={notificationPopoverRef}>
            <button
              type="button"
              onClick={() => setNotificationPopoverOpen((prev) => !prev)}
              className="relative p-2 rounded-full text-gray-600 hover:bg-grey-bg"
              aria-label="Notifications"
              aria-expanded={notificationPopoverOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {(bellNotification || feasibilityCheckNotification || feasibilityValidateAddressNotification || feasibilityMatchedProductsNotification || feasibilityLocationMatchNotification || updatedQuoteNotification || updatedQuoteProposal2Notification || updatedQuoteProposal3Notification || updatedQuoteProposal4Notification || attributesUpdatedNotification || updatedMatchedProductsNotification || updatedRequestedValuesNotification || feasibilityProposalNotification || feasibilityExtractionNotification || newQuoteLocationsExtractionNotification || sbiQuoteNotification || hdfcQuoteNotification || validateQuoteNotification || updatedConfigurationsToQuoteNotification || updatedUpgradeQuoteNotification || updatedEnrichQuoteUpdateNotification || updatedTechnicalAttributesUpdateNotification || updatedMacdUpgradeUpdateNotification) && (
                <span className="absolute -top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-airtel-red text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">1</span>
              )}
            </button>
            {notificationPopoverOpen && (
              <div className="absolute right-0 top-full mt-1 z-[70] w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" aria-hidden="true" />
                <div className="relative bg-white rounded-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center gap-2">
                        <button
                        type="button"
                        onClick={() => { setBellNotification(false); setFeasibilityCheckNotification(false); setFeasibilityValidateAddressNotification(false); setFeasibilityMatchedProductsNotification(false); setFeasibilityLocationMatchNotification(false); onMarkAllNotificationsRead?.(); setNotificationPopoverOpen(false) }}
                        className="text-xs font-medium text-airtel-red hover:text-red-700"
                      >
                        Mark all as read
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationPopoverOpen(false)}
                        className="p-1 rounded text-gray-500 hover:bg-grey-bg"
                        aria-label="Close notifications"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-2">
                    {(() => {
                      const mostRecent = updatedMacdUpgradeUpdateNotification ? 'macdUpgradeUpdate' : updatedTechnicalAttributesUpdateNotification ? 'technicalAttributesUpdate' : updatedEnrichQuoteUpdateNotification ? 'enrichQuoteUpdate' : updatedUpgradeQuoteNotification ? 'upgradeQuote' : updatedConfigurationsToQuoteNotification ? 'updatedConfigurationsToQuote' : validateQuoteNotification ? 'validatedQuote' : hdfcQuoteNotification ? 'hdfcQuote' : sbiQuoteNotification ? 'sbiQuote' : newQuoteLocationsExtractionNotification ? 'newQuoteLocationsExtraction' : feasibilityCheckNotification ? 'feasibilityCheck' : feasibilityValidateAddressNotification ? 'feasibilityValidateAddress' : feasibilityMatchedProductsNotification ? 'feasibilityMatchedProducts' : feasibilityLocationMatchNotification ? 'feasibilityLocationMatch' : feasibilityExtractionNotification ? 'feasibilityExtraction' : feasibilityProposalNotification ? 'feasibility' : updatedRequestedValuesNotification ? 'updatedRequestedValues' : updatedMatchedProductsNotification ? 'matchedProducts' : attributesUpdatedNotification ? 'attributes' : updatedQuoteProposal4Notification ? 'proposal4' : updatedQuoteProposal3Notification ? 'proposal3' : updatedQuoteProposal2Notification ? 'proposal2' : updatedQuoteNotification ? 'proposal1' : 'new'
                      const linkClass = (isRecent) => isRecent ? 'text-sm font-semibold text-airtel-red hover:text-red-800 hover:underline text-left w-full' : 'text-sm font-semibold text-gray-400 hover:text-gray-600 text-left w-full'
                      const timeClass = (isRecent) => isRecent ? 'text-xs text-gray-600 mt-0.5' : 'text-xs text-gray-400 mt-0.5'
                      return (
                        <>
                    {updatedMacdUpgradeUpdateNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToMacdUpgradeUpdate?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'macdUpgradeUpdate')}
                        >
                          Updates on the upgrade Quote for HDFC Bank
                        </button>
                        <p className={timeClass(mostRecent === 'macdUpgradeUpdate')}>Just now</p>
                      </div>
                    )}
                    {updatedTechnicalAttributesUpdateNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToTechnicalAttributesUpdate?.(technicalAttributesUpdateIntent)
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'technicalAttributesUpdate')}
                        >
                          Updated Technical Attributes for Enrich Quote
                        </button>
                        <p className={timeClass(mostRecent === 'technicalAttributesUpdate')}>Just now</p>
                      </div>
                    )}
                    {updatedEnrichQuoteUpdateNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToEnrichQuoteUpdate?.(enrichQuoteUpdateIntent)
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'enrichQuoteUpdate')}
                        >
                          Updated Enrich Quote
                        </button>
                        <p className={timeClass(mostRecent === 'enrichQuoteUpdate')}>Just now</p>
                      </div>
                    )}
                    {updatedUpgradeQuoteNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToUpgradeQuote?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'upgradeQuote')}
                        >
                          New Quote for Upgrades for HDFC Bank
                        </button>
                        <p className={timeClass(mostRecent === 'upgradeQuote')}>Just now</p>
                      </div>
                    )}
                    {updatedConfigurationsToQuoteNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToUpdatedConfigurationsToQuote?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'updatedConfigurationsToQuote')}
                        >
                          Updated Configurations to Quote for HDFC Bank
                        </button>
                        <p className={timeClass(mostRecent === 'updatedConfigurationsToQuote')}>Just now</p>
                      </div>
                    )}
                    {validateQuoteNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToValidatedQuote?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'validatedQuote')}
                        >
                          Validated Quote for HDFC Bank
                        </button>
                        <p className={timeClass(mostRecent === 'validatedQuote')}>Just now</p>
                      </div>
                    )}
                    {feasibilityProposalNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToFeasibilityProposal?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'feasibility')}
                        >
                          Updated proposal with Feasibility status
                        </button>
                        <p className={timeClass(mostRecent === 'feasibility')}>Just now</p>
                      </div>
                    )}
                    {feasibilityCheckNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToFeasibilityCheck?.()
                            setFeasibilityCheckNotification(false)
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'feasibilityCheck')}
                        >
                          Checked feasibility for Extracted information for feasibility
                        </button>
                        <p className={timeClass(mostRecent === 'feasibilityCheck')}>Just now</p>
                      </div>
                    )}
                    {feasibilityValidateAddressNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToFeasibilityValidateAddress?.()
                            setFeasibilityValidateAddressNotification(false)
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'feasibilityValidateAddress')}
                        >
                          Addresses Validated for Extracted information for feasibility
                        </button>
                        <p className={timeClass(mostRecent === 'feasibilityValidateAddress')}>Just now</p>
                      </div>
                    )}
                    {feasibilityMatchedProductsNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToFeasibilityMatchedProducts?.()
                            setFeasibilityMatchedProductsNotification(false)
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'feasibilityMatchedProducts')}
                        >
                          Matched Products for Extracted information for feasibility
                        </button>
                        <p className={timeClass(mostRecent === 'feasibilityMatchedProducts')}>Just now</p>
                      </div>
                    )}
                    {feasibilityLocationMatchNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToFeasibilityLocationMatch?.()
                            setFeasibilityLocationMatchNotification(false)
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'feasibilityLocationMatch')}
                        >
                          Matched Location for Premises for Extracted information for feasibility
                        </button>
                        <p className={timeClass(mostRecent === 'feasibilityLocationMatch')}>Just now</p>
                      </div>
                    )}
                    {feasibilityExtractionNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToFeasibilityExtraction?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'feasibilityExtraction')}
                        >
                          Extracted Information for Feasibility check
                        </button>
                        <p className={timeClass(mostRecent === 'feasibilityExtraction')}>Just now</p>
                      </div>
                    )}
                    {newQuoteLocationsExtractionNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToNewQuoteLocationsExtraction?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'newQuoteLocationsExtraction')}
                        >
                          {newQuoteLocationsExtractionLinkText}
                        </button>
                        <p className={timeClass(mostRecent === 'newQuoteLocationsExtraction')}>Just now</p>
                      </div>
                    )}
                    {sbiQuoteNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToSbiQuote?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'sbiQuote')}
                        >
                          New Quote for SBI Bank Account
                        </button>
                        <p className={timeClass(mostRecent === 'sbiQuote')}>Just now</p>
                      </div>
                    )}
                    {hdfcQuoteNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToHdfcQuote?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'hdfcQuote')}
                        >
                          Updated Quote for HDFC Bank account
                        </button>
                        <p className={timeClass(mostRecent === 'hdfcQuote')}>Just now</p>
                      </div>
                    )}
                    {updatedRequestedValuesNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToUpdatedRequestedValues?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'updatedRequestedValues')}
                        >
                          Updated Quote proposal with requested Changes for HDFC Bank
                        </button>
                        <p className={timeClass(mostRecent === 'updatedRequestedValues')}>Just now</p>
                      </div>
                    )}
                    {updatedMatchedProductsNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToUpdatedMatchedProducts?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'matchedProducts')}
                        >
                          Updated Matched Products
                        </button>
                        <p className={timeClass(mostRecent === 'matchedProducts')}>Just now</p>
                      </div>
                    )}
                    {attributesUpdatedNotification && (
                      <div className="px-4 py-3 hover:bg-grey-bg border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToAttributesUpdatedView?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'attributes')}
                        >
                          Attributes updated
                        </button>
                        <p className={timeClass(mostRecent === 'attributes')}>Just now</p>
                      </div>
                    )}
                    {updatedQuoteProposal4Notification && (
                      <div className={`px-4 py-3 hover:bg-grey-bg ${(updatedQuoteProposal3Notification || attributesUpdatedNotification) ? 'border-b border-gray-100' : ''}`}>
                        <button
                          type="button"
                          onClick={handleNavigateToAddedProductsFromExtracted}
                          className={linkClass(mostRecent === 'proposal4')}
                        >
                          Added products from Extracted information
                        </button>
                        <p className={timeClass(mostRecent === 'proposal4')}>Just now</p>
                      </div>
                    )}
                    {(updatedQuoteProposal3Notification || updatedQuoteProposal4Notification) && (
                      <div className={`px-4 py-3 hover:bg-grey-bg ${updatedQuoteProposal4Notification ? 'border-b border-gray-100' : 'border-b border-gray-100'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToUpdatedQuote3?.()
                            setNotificationPopoverOpen(false)
                            setBellNotification(false)
                            onMarkAllNotificationsRead?.()
                          }}
                          className={linkClass(mostRecent === 'proposal3')}
                        >
                          Updated Quote proposal with all the verified records
                        </button>
                        <p className={timeClass(mostRecent === 'proposal3')}>Just now</p>
                      </div>
                    )}
                    {(updatedQuoteProposal2Notification || updatedQuoteProposal3Notification || updatedQuoteProposal4Notification) && (
                      <div className={`px-4 py-3 hover:bg-grey-bg ${(updatedQuoteProposal3Notification || updatedQuoteProposal4Notification) ? 'border-b border-gray-100' : ''}`}>
                        <button
                          type="button"
                          onClick={handleNavigateToVerifiedDetails}
                          className={linkClass(mostRecent === 'proposal2')}
                        >
                          Updated Quote Proposal with Verified Details
                        </button>
                        <p className={timeClass(mostRecent === 'proposal2')}>Just now</p>
                      </div>
                    )}
                    {(updatedQuoteNotification || updatedQuoteProposal2Notification || updatedQuoteProposal3Notification || updatedQuoteProposal4Notification || attributesUpdatedNotification) && (
                      <div className={`px-4 py-3 hover:bg-grey-bg ${updatedQuoteProposal2Notification ? 'border-b border-gray-100' : ''}`}>
                        <button
                          type="button"
                          onClick={handleNavigateToMatchedProducts}
                          className={linkClass(mostRecent === 'proposal1')}
                        >
                          Updated Quote Proposal with Matched Products for HDFC Bank
                        </button>
                        <p className={timeClass(mostRecent === 'proposal1')}>Just now</p>
                      </div>
                    )}
                    <div className={`px-4 py-3 hover:bg-grey-bg ${(updatedQuoteNotification || updatedQuoteProposal2Notification || updatedQuoteProposal3Notification || updatedQuoteProposal4Notification || attributesUpdatedNotification) ? 'border-b border-gray-100' : ''} last:border-b-0`}>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToQuoteExtractedInfo?.()
                          setNotificationPopoverOpen(false)
                          setBellNotification(false)
                          onMarkAllNotificationsRead?.()
                        }}
                        className={linkClass(mostRecent === 'new')}
                      >
                        New Quote proposal created for HDFC Bank
                      </button>
                      <p className={timeClass(mostRecent === 'new')}>15 seconds ago</p>
                    </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button type="button" className="p-1 rounded-full overflow-hidden hover:ring-2 hover:ring-gray-200 focus:outline-none" aria-label="User menu">
            <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center overflow-hidden border-2 border-amber-300">
              <svg className="w-6 h-6 text-amber-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Second row: Global nav - App launcher + Sales, then nav links; red underline for active */}
      <div className="border-t border-gray-100 bg-white border-b-2 border-airtel-red">
        <nav className="flex items-center gap-1 px-6 py-2 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0 mr-2">
            <button type="button" className="p-1.5 rounded-lg text-gray-600 hover:bg-grey-bg" aria-label="App launcher">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
              </svg>
            </button>
            <span className="text-xs font-bold text-gray-900">Sales</span>
          </div>
          {navItems.map((item) => {
            if (item.label === 'Quote') {
              const isQuoteActive = activeNavTab === 'Quote'
                && selectedQuote !== 'Request for Feasibility (Locations)'
                && selectedQuote !== 'Request for New Quote - Locations'
                && selectedQuote !== 'Request for New Quote - Locations + PO'
              return (
                <div key={item.label} className="relative flex items-center shrink-0" ref={quoteDropdownRef}>
                  <button
                    ref={quoteButtonRef}
                    type="button"
                    onClick={() => {
                      onNavClick?.('Quote')
                      if (quoteButtonRef.current) {
                        const rect = quoteButtonRef.current.getBoundingClientRect()
                        setQuoteDropdownPosition({ top: rect.bottom + 4, left: rect.left })
                      }
                      setFeasibilityDropdownOpen(false)
                      setQuoteDropdownOpen((prev) => !prev)
                    }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                      isQuoteActive
                        ? 'text-airtel-red font-semibold border-b-2 border-airtel-red pb-2 -mb-0.5 bg-transparent'
                        : 'text-gray-700 hover:bg-grey-bg'
                    }`}
                    aria-expanded={quoteDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    Quote
                    <svg className="w-3.5 h-3.5 text-current" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {quoteDropdownOpen && createPortal(
                    <div
                      data-quote-dropdown
                      className="fixed z-[100] min-w-[120px] bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                      style={{ top: quoteDropdownPosition.top, left: quoteDropdownPosition.left }}
                      role="listbox"
                    >
                      <button
                        type="button"
                        onClick={() => { onQuoteSelect?.('Quote 1'); setQuoteDropdownOpen(false); onNavClick?.('Quote') }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium whitespace-nowrap ${selectedQuote === 'Quote 1' ? 'text-airtel-red bg-red-50' : 'text-gray-700 hover:bg-grey-bg'}`}
                      >
                        Create Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => { onQuoteSelect?.('Quote 2'); setQuoteDropdownOpen(false); onNavClick?.('Quote') }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium whitespace-nowrap ${selectedQuote === 'Quote 2' ? 'text-airtel-red bg-red-50' : 'text-gray-700 hover:bg-grey-bg'}`}
                      >
                        Enrich Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => { onQuoteSelect?.('MACD Quote'); setQuoteDropdownOpen(false); onNavClick?.('Quote') }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium whitespace-nowrap ${selectedQuote === 'MACD Quote' ? 'text-airtel-red bg-red-50' : 'text-gray-700 hover:bg-grey-bg'}`}
                      >
                        MACD Quote
                      </button>
                    </div>,
                    document.body
                  )}
                </div>
              )
            }
            if (item.label === 'Feasibility Request') {
              const isFeasibilityActive = activeNavTab === 'Quote'
                && (
                  selectedQuote === 'Request for Feasibility (Locations)'
                  || selectedQuote === 'Request for New Quote - Locations'
                  || selectedQuote === 'Request for New Quote - Locations + PO'
                )
              return (
                <div key={item.label} className="relative flex items-center shrink-0" ref={feasibilityDropdownRef}>
                  <button
                    ref={feasibilityButtonRef}
                    type="button"
                    onClick={() => {
                      onNavClick?.('Quote')
                      if (feasibilityButtonRef.current) {
                        const rect = feasibilityButtonRef.current.getBoundingClientRect()
                        setFeasibilityDropdownPosition({ top: rect.bottom + 4, left: rect.left })
                      }
                      setQuoteDropdownOpen(false)
                      setFeasibilityDropdownOpen((prev) => !prev)
                    }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                      isFeasibilityActive
                        ? 'text-airtel-red font-semibold border-b-2 border-airtel-red pb-2 -mb-0.5 bg-transparent'
                        : 'text-gray-700 hover:bg-grey-bg'
                    }`}
                    aria-expanded={feasibilityDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    Feasibility Request
                    <svg className="w-3.5 h-3.5 text-current" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {feasibilityDropdownOpen && createPortal(
                    <div
                      data-feasibility-dropdown
                      className="fixed z-[100] min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                      style={{ top: feasibilityDropdownPosition.top, left: feasibilityDropdownPosition.left }}
                      role="listbox"
                    >
                      <button
                        type="button"
                        onClick={() => { onQuoteSelect?.('Request for Feasibility (Locations)'); setFeasibilityDropdownOpen(false); onNavClick?.('Quote') }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium whitespace-nowrap ${selectedQuote === 'Request for Feasibility (Locations)' ? 'text-airtel-red bg-red-50' : 'text-gray-700 hover:bg-grey-bg'}`}
                      >
                        Request for Feasibility (Locations)
                      </button>
                      <button
                        type="button"
                        onClick={() => { onQuoteSelect?.('Request for New Quote - Locations'); setFeasibilityDropdownOpen(false); onNavClick?.('Quote') }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium whitespace-nowrap ${selectedQuote === 'Request for New Quote - Locations' ? 'text-airtel-red bg-red-50' : 'text-gray-700 hover:bg-grey-bg'}`}
                      >
                        Request for New Quote - Locations
                      </button>
                      <button
                        type="button"
                        onClick={() => { onQuoteSelect?.('Request for New Quote - Locations + PO'); setFeasibilityDropdownOpen(false); onNavClick?.('Quote') }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium whitespace-nowrap ${selectedQuote === 'Request for New Quote - Locations + PO' ? 'text-airtel-red bg-red-50' : 'text-gray-700 hover:bg-grey-bg'}`}
                      >
                        Request for New Quote - Locations + PO
                      </button>
                    </div>,
                    document.body
                  )}
                </div>
              )
            }
            return (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavClick?.(item.label)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                item.label === activeNavTab
                  ? 'text-airtel-red font-semibold border-b-2 border-airtel-red pb-2 -mb-0.5 bg-transparent'
                  : 'text-gray-700 hover:bg-grey-bg'
              }`}
            >
              {item.label}
              {item.hasChevron && (
                <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
          })}
        </nav>
      </div>
    </header>
    <AgentforceSidePanel
        key={activeNavTab === 'Quote' ? selectedQuote || 'Quote 1' : 'default'}
        open={agentforcePanelOpen}
        activeNavTab={activeNavTab}
        onClose={() => {
          if (!panelStateRef.current?.isPinned) {
            setAgentforcePanelOpen(false)
            if (effectiveRestoreKey && activeNavTab === 'Quote') {
              try { localStorage.removeItem(effectiveRestoreKey) } catch (_) {}
            }
          }
        }}
        onNavigateToQuote2={onNavigateToQuote2}
        onQuote2POUpdated={onQuote2POUpdated}
        onNavigateToNewQuoteProposal={onNavigateToQuoteExtractedInfo}
        onNavigateToMatchedProducts={handleNavigateToMatchedProducts}
        onNavigateToVerifiedDetails={handleNavigateToVerifiedDetails}
        onNavigateToAddedProductsFromExtracted={handleNavigateToAddedProductsFromExtracted}
        onNavigateToFeasibilityProposal={onNavigateToFeasibilityProposal}
        onNavigateToFeasibilityExtraction={onNavigateToFeasibilityExtraction}
        onNavigateToValidatedQuote={onNavigateToValidatedQuote}
        onNavigateToUpdatedRequestedValues={(intentText) => {
          onNavigateToUpdatedRequestedValues?.(intentText)
        }}
        onUpdatedRequestedValuesCreated={onUpdatedRequestedValuesCreated}
        onQuoteProposalCreated={() => setBellNotification(true)}
        onMatchProductsStatusShown={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onMatchProductsResponseShown?.()
        }}
        onMatchProductsAnalysisStart={onMatchProductsAnalysisStart}
        onMatchProductsAnalysisEnd={onMatchProductsAnalysisEnd}
        onVerifyDetailsStatusShown={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onVerifyDetailsResponseShown?.()
        }}
        onVerifyDetailsAnalysisStart={onVerifyDetailsAnalysisStart}
        onVerifyDetailsAnalysisEnd={onVerifyDetailsAnalysisEnd}
        onAddProductsStatusShown={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onAddProductsResponseShown?.()
        }}
        onAddProductsAnalysisStart={onAddProductsAnalysisStart}
        onAddProductsAnalysisEnd={onAddProductsAnalysisEnd}
        onFeasibilityCheckStatusShown={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          setFeasibilityCheckNotification(true)
          onFeasibilityCheckStatusShown?.()
        }}
        onNavigateToFeasibilityCheck={() => {
          onNavigateToFeasibilityCheck?.()
          setFeasibilityCheckNotification(false)
        }}
        onSbiQuoteStatusShown={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onSbiQuoteStatusShown?.()
        }}
        onNavigateToSbiQuote={onNavigateToSbiQuote}
        onFeasibilityValidateAddressStatusShown={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          setFeasibilityValidateAddressNotification(true)
          onFeasibilityValidateAddressStatusShown?.()
        }}
        onNavigateToFeasibilityValidateAddress={() => {
          onNavigateToFeasibilityValidateAddress?.()
          setFeasibilityValidateAddressNotification(false)
        }}
        onFeasibilityMatchedProductsStatusShown={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          setFeasibilityMatchedProductsNotification(true)
          onFeasibilityMatchedProductsStatusShown?.()
        }}
        onNavigateToFeasibilityMatchedProducts={() => {
          onNavigateToFeasibilityMatchedProducts?.()
          setFeasibilityMatchedProductsNotification(false)
        }}
        onFeasibilityLocationMatchAnalysisStart={onFeasibilityLocationMatchAnalysisStart}
        onNavigateToFeasibilityLocationMatch={() => {
          onNavigateToFeasibilityLocationMatch?.()
          setFeasibilityLocationMatchNotification(false)
        }}
        onFeasibilityLocationMatchStatusShown={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          setFeasibilityLocationMatchNotification(true)
          onFeasibilityLocationMatchStatusShown?.()
        }}
        onFeasibilityExtractionStatusShown={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onFeasibilityExtractionStatusShown?.()
        }}
        onNavigateToNewQuoteLocationsExtraction={onNavigateToNewQuoteLocationsExtraction}
        onNewQuoteLocationsExtractionStatusShown={(accountName) => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onNewQuoteLocationsExtractionStatusShown?.(accountName)
        }}
        onUpdateChangeAnalysisStart={onUpdateChangeAnalysisStart}
        onUpdateChangeAnalysisEnd={onUpdateChangeAnalysisEnd}
        onPOChangeUpdateAnalysisStart={onPOChangeUpdateAnalysisStart}
        onUpgradeQuoteCreated={() => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onUpgradeQuoteCreated?.()
        }}
        onNavigateToUpgradeQuote={onNavigateToUpgradeQuote}
        onEnrichQuoteUpdateCreated={(intentText) => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onEnrichQuoteUpdateCreated?.(intentText)
        }}
        onNavigateToEnrichQuoteUpdate={(intentText) => onNavigateToEnrichQuoteUpdate?.(intentText)}
        enrichQuoteFlowActive={enrichQuoteFlowActive}
        onTechnicalAttributesUpdateCreated={(intentText) => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onTechnicalAttributesUpdateCreated?.(intentText)
        }}
        onNavigateToTechnicalAttributesUpdate={(intentText) => onNavigateToTechnicalAttributesUpdate?.(intentText)}
        technicalAttributesPageActive={technicalAttributesPageActive}
        onTechnicalAttributesToggleCompareWithAsset={onTechnicalAttributesToggleCompareWithAsset}
        macdQuoteActive={macdQuoteActive}
        onMacdUpgradeUpdateCreated={(intentText) => {
          setBellNotification(true)
          setNotificationPopoverOpen(true)
          onMacdUpgradeUpdateCreated?.(intentText)
        }}
        onNavigateToMacdUpgradeUpdate={onNavigateToMacdUpgradeUpdate}
        onMacdUpgradeUpdateAnalysisStart={onMacdUpgradeUpdateAnalysisStart}
        feasibilityRequestsPageActive={activeNavTab === 'Quote' && (
          selectedQuote === 'Request for Feasibility (Locations)'
          || selectedQuote === 'Request for New Quote - Locations'
          || selectedQuote === 'Request for New Quote - Locations + PO'
        )}
        initialRestoreSnapshot={snapshotToPass}
        onPanelStateChange={(snapshot) => {
          panelStateRef.current = snapshot
          if (snapshot) {
            try {
              const payload = { isConversationView: snapshot.isConversationView, messages: snapshot.messages || [], hasNotification: snapshot.hasNotification ?? false, isPinned: snapshot.isPinned ?? false }
              localStorage.setItem(AGENTFORCE_CONVERSATION_SNAPSHOT_KEY, JSON.stringify(payload))
              if (enrichQuoteFlowActive) {
                localStorage.setItem(AGENTFORCE_ENRICH_QUOTE_RESTORE_KEY, JSON.stringify(payload))
              }
            } catch (_) {}
          }
          if (effectiveRestoreKey && activeNavTab === 'Quote' && agentforcePanelOpen && snapshot) {
            try {
              localStorage.setItem(effectiveRestoreKey, JSON.stringify({
                tab: 'Quote',
                panelOpen: true,
                snapshot: { isConversationView: snapshot.isConversationView, messages: snapshot.messages || [], hasNotification: snapshot.hasNotification ?? false, isPinned: snapshot.isPinned ?? false },
              }))
            } catch (_) {}
          }
        }}
      />
    </>
  )
}

export default Header
