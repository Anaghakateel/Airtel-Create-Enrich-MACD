import { useState, useRef, useEffect } from 'react'
import agentforceIllustration from './agentforceillustration.png'
import agentforceIcon from './AgentforceIcon.png'
import { getOldValueForField } from '../data/technicalAttributesOldValues'

const PANEL_MIN_WIDTH = 288
const PANEL_MAX_WIDTH = 640
const PANEL_DEFAULT_WIDTH = 411

const QUOTE_NAME = 'HDFC bank connectivity across India'
const PO_AGENT_RESPONSE = `The Quote "${QUOTE_NAME}" is in Stage "Proposal accepted". Would you like to upload the file/document for Purchase Order?`
const PO_UPLOAD_FORM_MESSAGE_ID = 'po-upload-form'
const PO_THANK_YOU_TEXT = 'Thank you for uploading the Purchase Order document. Click here to see the updated file.'

const CREATE_QUOTE_PROPOSAL_RESPONSE = 'Hi! I can assist you with that. You can upload the document directly. Would you like to proceed with uploading the document or any other type of document?'
const QUOTE_PROPOSAL_UPLOAD_FORM_MESSAGE_ID = 'quote-proposal-upload-form'
const QUOTE_PROPOSAL_PROCESSING_TEXT = 'Your file is being processed, you will be notified once done, or you can check the status here'
const QUOTE_PROPOSAL_LOADING_STAGES = ['Working', 'Understanding your request', 'Identifying Next Steps', 'Finishing Up']

const CREATE_QUOTE_ACCOUNT_STAGES = ['Working', 'Understanding your request', 'Initiating next steps', 'Finishing up']
const FEASIBILITY_LOCATION_ANALYSIS_STAGES = ['Working', 'Understanding your Request', 'Initiating Next Steps', 'Finishing Up']

const MATCH_PRODUCTS_ANALYSIS_STAGES = ['Working', 'Understanding your request', 'Identifying next steps', 'Finishing up']

const VERIFY_DETAILS_ANALYSIS_STAGES = ['Working', 'Understanding your request', 'Identifying Next Steps', 'Finishing up']

const ADD_PRODUCTS_ANALYSIS_STAGES = ['Working', 'Understanding your request', 'Identifying Next Steps', 'Finishing up']

const UPDATE_CHANGE_ANALYSIS_STAGES = ['Working', 'Understanding your need', 'Identifying Next steps', 'Finishing Up']

const PO_CHANGE_UPDATE_ANALYSIS_STAGES = ['Working', 'Understanding the requirement', 'Initiating the Steps', 'Finishing Up']
const PO_CHANGE_UPDATE_RESPONSE_PREFIX = 'The changes are getting incorporated. It will take some time. See the updated changes here - '
const PO_CHANGE_UPDATE_LINK_TEXT = 'Updated Enrich Quote'

const TECHNICAL_ATTRIBUTES_UPDATE_ANALYSIS_STAGES = ['Working', 'Understanding the requirement', 'Initiating the Steps', 'Finishing Up']
const TECHNICAL_ATTRIBUTES_UPDATE_RESPONSE_PREFIX = 'Technical attributes are getting updated. It will take some time. See the updated changes on the respective products - '
const TECHNICAL_ATTRIBUTES_UPDATE_LINK_TEXT = 'Updated Technical Attributes for Enrich Quote'

const MACD_UPGRADE_UPDATE_ANALYSIS_STAGES = ['Working', 'Understanding the requirement', 'Initiating the Steps', 'Finishing Up']
const MACD_UPGRADE_UPDATE_RESPONSE_PREFIX = 'Sure. It will take some time to update the changes. See the updated changes here - '
const MACD_UPGRADE_UPDATE_LINK_TEXT = 'Updates on the upgrade Quote for HDFC Bank'

function getCreateQuoteCustomerName(text) {
  if (!text || typeof text !== 'string') return null
  const t = text.trim()
  const forCustomerMatch = t.match(/\bfor\s+(?:customer(?:s)?\s+)?(.+)$/i)
  if (forCustomerMatch && (/\bcreate\b/i.test(t) || /\bquote\b/i.test(t))) return forCustomerMatch[1].trim().replace(/[.,!?]$/, '') || null
  const quoteForMatch = t.match(/\bquote\s+for\s+(.+)$/i)
  if (quoteForMatch) return quoteForMatch[1].trim().replace(/[.,!?]$/, '') || null
  return null
}

function isCreateQuoteForCustomerFlow(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim()
  if (!/\bcreate\b/i.test(t) || !/\bquote\b/i.test(t)) return false
  return /\bfor\s+customers?\b/i.test(t) || getCreateQuoteCustomerName(text) != null
}

function random10Digit() {
  return String(Math.floor(1000000000 + Math.random() * 9000000000))
}

function buildCreateQuoteAccountMatchesPayload(accountName) {
  const name = accountName && accountName.trim() ? accountName.trim() : 'the customer'
  return {
    accountName: name,
    bestMatch: {
      accountName: name,
      accountNumber: random10Digit(),
      score: 90,
      rankingReason: 'High activity with 44 total activities, 3 recent activities in the last 30 days and multiple opportunities in advanced stages.',
      keyHighlights: ['44 total activities', '3 recent activities in last 30 days', 'Multiple opportunities in advanced steps'],
    },
    additionalOptions: [
      { accountName: name, accountNumber: random10Digit(), score: 60, rankingReason: 'Minimal activity but has 1 opportunity in the initial stage' },
      { accountName: name, accountNumber: random10Digit(), score: 75, rankingReason: 'Moderate activity with 6 recent activities and multiple quotes in feasibility types' },
      { accountName: name, accountNumber: random10Digit(), score: 50, rankingReason: 'No recent activities but has 1 opportunity and 1 draft quote' },
    ],
  }
}

function buildFeasibilityAccountMatchesPayload() {
  return {
    accounts: [
      { accountName: 'HDFC Bank', accountNumber: random10Digit(), score: 92, rankingReason: 'Frequent quote activity and recent location feasibility requests.' },
      { accountName: 'ICICI Bank', accountNumber: random10Digit(), score: 85, rankingReason: 'Strong account activity with multiple draft opportunities.' },
      { accountName: 'Axis Bank', accountNumber: random10Digit(), score: 78, rankingReason: 'Moderate activity and recent extracted-information workflows.' },
    ],
  }
}

const UPDATE_CHANGE_RESPONSE = 'Sure. The updates/changes will take some time. Click here to view the updated values'

const MATCH_PRODUCTS_RESPONSE_PREFIX = 'Matching products to the requested products will take some time. Click here to view status - '
const MATCH_PRODUCTS_LINK_TEXT = 'Updated Quote Proposal with Matched Products for HDFC Bank'

const VERIFY_DETAILS_RESPONSE_PREFIX = 'Verifying details is in progress. It will take some time. Click here to view status - '
const VERIFY_DETAILS_LINK_TEXT = 'Updated Quote Proposal with Verified Details'

const ADD_PRODUCTS_RESPONSE_PREFIX = 'Adding Products is in progress. It will take some time. Click here to view status - '
const ADD_PRODUCTS_LINK_TEXT = 'Added Products from Extracted Information'

const FEASIBILITY_RESPONSE_PREFIX = 'Feasibility check will take some time. Click here to check for status - '
const FEASIBILITY_LINK_TEXT = 'Updated proposal with Feasibility status'
const FEASIBILITY_EXTRACT_RESPONSE_PREFIX = 'Your file is being extracted, under the '
const FEASIBILITY_EXTRACT_REQUEST_ID_TEXT = 'Feasibility Request ID - FR-001'
const FEASIBILITY_EXTRACT_RESPONSE_SUFFIX = '. You will be notified once done, or you can check the status - '
const FEASIBILITY_EXTRACT_LINK_TEXT = 'Extracted Information for Feasibility check'
const FEASIBILITY_CHECK_RESPONSE_PREFIX = 'It will take some time. Meanwhile you can click here - '
const FEASIBILITY_CHECK_LINK_TEXT = 'Checked feasibility for Extracted information for feasibility'
const FEASIBILITY_CREATE_OPP_QUOTE_PROMPT = `Sure. I can help you with that. But please note only feasible records will be considered.
Please provide Opportunity Name for the new Opportunity to be created.`
const FEASIBILITY_SBI_QUOTE_RESPONSE_PREFIX = 'Thank you. Your file is now being extracted, you will be notified once done, or you can check the status - '
const FEASIBILITY_SBI_QUOTE_LINK_TEXT = 'New Quote for SBI Bank Account'
const FEASIBILITY_CREATE_OPP_QUOTE_QUOTE_NAME_PROMPT = 'Please provide the name of the Quote you want to create'
const FEASIBILITY_VALIDATE_ADDRESS_RESPONSE_PREFIX = 'It will take some time. Meanwhile you can click here - '
const FEASIBILITY_VALIDATE_ADDRESS_LINK_TEXT = 'Addresses Validated for Extracted information for feasibility'
const FEASIBILITY_MATCHED_PRODUCTS_RESPONSE_PREFIX = 'It will take some time. Meanwhile you can click here - '
const FEASIBILITY_MATCHED_PRODUCTS_LINK_TEXT = 'Matched Products for Extracted information for feasibility'
const FEASIBILITY_LOCATION_MATCH_RESPONSE_PREFIX = 'It will take some time. Meanwhile you can click here - '
const FEASIBILITY_LOCATION_MATCH_LINK_TEXT = 'Matched Location for Premises for Extracted information for feasibility'
const NEW_QUOTE_LOCATIONS_EXTRACT_RESPONSE_PREFIX = 'Thank you. Your file is now being extracted, you will be notified once done, or you can check the status - '
const NEW_QUOTE_LOCATIONS_EXTRACT_RESPONSE_ID_PREFIX = 'Thank you. Your file is now being extracted under '
const NEW_QUOTE_LOCATIONS_EXTRACT_RESPONSE_ID_SUFFIX = ', you will be notified once done, or you can check the status - '
const NEW_QUOTE_LOCATIONS_QUOTE_NAME_PROMPT = 'Please provide the name of the Quote you want to create'
const DEFAULT_LOCATIONS_NEW_QUOTE_OPPORTUNITY_AMOUNTS = [1250000, 2950000, 5400000]

const VALIDATE_QUOTE_RESPONSE_PREFIX = 'Quote Validation will take some time. Click here to check for status - '
const VALIDATE_QUOTE_LINK_TEXT = 'Validated Quote for HDFC Bank'

const DOA_RESPONSE = 'Since the Quote is in Validation Stage, I can send it to DOA for approval'

const UPGRADE_ATTRIBUTES_RESPONSE = 'Hi! I can assist you with that. Would you like to proceed with uploading the document directly or is there any other type of document?'
const UPGRADE_ATTRIBUTES_ANALYSIS_STAGES = ['Working', 'Understanding your requirement', 'Identifying the steps', 'Finishing Up']
const UPGRADE_ATTRIBUTES_RESPONSE_PREFIX = 'The file extraction will take some time. You can see the status here until then - '
const UPGRADE_ATTRIBUTES_LINK_TEXT = 'New Quote for Upgrades for HDFC Bank'

const SALES_ASSISTANT_INTRO = "Hello! I'm your Airtel B2B Sales Assistant. 👋\n\nI help with sales quotes, proposals, opportunities/ quote updates and CRM queries. Start by sharing a customer account name/number or upload a file"
const SALES_ASSISTANT_INTRO_MSG = { id: 'agent-intro', role: 'agent', text: SALES_ASSISTANT_INTRO }

function isDOAIntent(text) {
  if (!text || typeof text !== 'string') return false
  return /doa/i.test(text.trim())
}

function isValidateQuoteIntent(text) {
  if (!text || typeof text !== 'string') return false
  return /\bvalidate\b/i.test(text.trim())
}

function isFeasibilityIntent(text) {
  if (!text || typeof text !== 'string') return false
  return /\bfeasibility\b/i.test(text.trim())
}

function isUploadLocationsToNewQuoteIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  const hasUpload = /\bupload\b/.test(t)
  const hasLocation = /\blocations?\b/.test(t)
  const hasNewQuote = /\bnew\s+quote\b/.test(t)
  const hasDirect = /\bdirect(?:ly)?\b/.test(t)
  return hasUpload && hasLocation && hasNewQuote && (hasDirect || /\bto\b/.test(t))
}

function isFeasibilityOnlyQuoteChoiceIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return /^\s*3\.?\s*$/.test(t) || (/\bcheck\b/.test(t) && /\bfeasibility\b/.test(t))
}

function isLocationsWithoutPOIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return /^\s*2\.?\s*$/.test(t) || (/\blocations?\b/.test(t) && /\bwithout\b/.test(t) && /\bpo\b/.test(t))
}

function isPODocumentIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return /^\s*1\.?\s*$/.test(t) || /\bpo\b/.test(t) || /\bpurchase\s*order\b/.test(t)
}

function normalizeFeasibilityAccountName(text) {
  const raw = String(text || '').trim().replace(/[.,!?]$/, '')
  if (!raw) return 'SBI Bank'
  let cleaned = raw
    .replace(/^i\s+want\s+to\s+go\s+with\s+/i, '')
    .replace(/^go\s+with\s+/i, '')
    .replace(/^choose\s+/i, '')
    .replace(/^select\s+/i, '')
    .replace(/^account\s+/i, '')
    .replace(/\s+account$/i, '')
    .trim()
  if (!cleaned) cleaned = raw
  return cleaned
}

function normalizeLocationsNewQuoteAccountName(text) {
  const raw = String(text || '').trim().replace(/[.,!?]$/, '')
  if (!raw) return 'HDFC Bank'
  let cleaned = raw
    .replace(/^i\s+want\s+to\s+go\s+with\s+/i, '')
    .replace(/^go\s+with\s+/i, '')
    .replace(/^choose\s+/i, '')
    .replace(/^select\s+/i, '')
    .replace(/^account\s+/i, '')
    .replace(/^the\s+/i, '')
    .replace(/\s+account$/i, '')
    .trim()
  if (!cleaned) cleaned = raw
  return cleaned
}

function randomOpportunityId15() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 15; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function buildLocationsNewQuoteAccountMatchesPayload() {
  return {
    accounts: [
      { accountName: 'SBI Bank', accountNumber: random10Digit(), score: 93, rankingReason: 'High quote and opportunity activity in the last 7 days.' },
      { accountName: 'ICICI Bank', accountNumber: random10Digit(), score: 86, rankingReason: 'Strong account activity with recent location-based requests.' },
      { accountName: 'Axis Bank', accountNumber: random10Digit(), score: 79, rankingReason: 'Moderate activity with active draft quote workflows.' },
    ],
  }
}

function buildLocationsNewQuoteOpportunities(accountName) {
  const name = accountName && String(accountName).trim() ? String(accountName).trim() : 'HDFC Bank'
  return [
    { opportunityName: `${name} - 100 services`, opportunityAmount: 1250000, opportunityId: randomOpportunityId15() },
    { opportunityName: `${name} - 250 services`, opportunityAmount: 2950000, opportunityId: randomOpportunityId15() },
    { opportunityName: `${name} - 500 services`, opportunityAmount: 5400000, opportunityId: randomOpportunityId15() },
  ]
}

function buildLocationsNewQuotePrefill(accountName, selectedOpportunityName) {
  const name = accountName && String(accountName).trim() ? String(accountName).trim() : 'HDFC Bank'
  const expectedCloseDate = new Date()
  expectedCloseDate.setDate(expectedCloseDate.getDate() + 45)
  const dateLabel = expectedCloseDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return {
    opportunityName: selectedOpportunityName && String(selectedOpportunityName).trim()
      ? String(selectedOpportunityName).trim()
      : `${name} - New Opportunity`,
    bsg: 'Rohit Sharma',
    kdm: 'Ananya Iyer',
    stage: 'Initial',
    opportunityType: 'New',
    expectedCloseDate: dateLabel,
    monthProjection: 'Commitment',
  }
}

function isAddProductsFromExtractedIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim()
  return (/\badd\b/i.test(t) && /\bproducts?\b/i.test(t) && /\bextracted\b/i.test(t) && (/\binformation\b/i.test(t) || /\binfo\b/i.test(t))) ||
    /\badd\s*products?\s*from\s*extracted\s*(information|info)\b/i.test(t)
}

function isVerifyDetailsIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim()
  return (/\bverify\b/i.test(t) && /\bdetails?\b/i.test(t)) || /\bverify\s*details?\b/i.test(t)
}

function isMatchIntent(text) {
  if (!text || typeof text !== 'string') return false
  return /\bmatch\b/i.test(text.trim())
}

function isMatchLocationsForPremisesIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return /\bmatch\b/.test(t) && /\blocations?\b/.test(t) && /\bpremises?\b/.test(t)
}

function isMatchAllProductsIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return /\bmatch\b/.test(t) && /\bproducts?\b/.test(t)
}

function isValidateAddressIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return /\bvalidate\b/.test(t) && /\baddress(es)?\b/.test(t)
}

function isCheckForFeasibilityIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return /\bcheck\b/.test(t) && /\bfeasibility\b/.test(t)
}

function isCreateOpportunityAndQuoteIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return /\bcreate\b/.test(t) && /\bopportunit(y|ies)\b/.test(t) && /\bquote\b/.test(t)
}


function isPOIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.toLowerCase().trim()
  return /\bpurchase\s*order\b/.test(t)
}

function isCreateQuoteProposalIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim()
  return (
    /\bcreate\b/i.test(t) ||
    /\bquote\b/i.test(t) ||
    /\bproposal\b/i.test(t) ||
    /\bcreate\s*quote\b/i.test(t) ||
    /\bcreate\s*proposal\b/i.test(t) ||
    /\bcreate\s*quote\s*proposal\b/i.test(t) ||
    /\bcreate\s*a\s*quote\b/i.test(t) ||
    /\bcreate\s*a\s*proposal\b/i.test(t) ||
    /\bcreate\s*a\s*quote\s*proposal\b/i.test(t)
  )
}

function isUpdateOrChangeIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim()
  return /\bupdate\b/i.test(t) || /\bchange\b/i.test(t)
}

// Purchase Order Agentic Flow: Change/Update PO Group, Billing Details, or BCP
const PO_CHANGE_UPDATE_PHRASES = [
  'change po group',
  'change billing details',
  'change bcp',
  'update po group',
  'update billing details',
  'update bcp',
]
function isPOChangeUpdateIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return PO_CHANGE_UPDATE_PHRASES.some((p) => t.includes(p))
}

function isTechnicalAttributesChangeIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return (
    /\b(change|update|modify)\s+(technical\s+)?attributes?\b/.test(t) ||
    /\b(technical\s+)?attributes?\s+(change|update|modify)\b/.test(t) ||
    /\btechnical\s+attributes?\b/.test(t)
  )
}

function isUpgradeAttributesIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim()
  return (/\bupgrade\b/i.test(t) && /\battributes?\b/i.test(t)) || /\bupgrade\s*attributes?\b/i.test(t)
}

// MACD Quote: "Update New Attributes", "Update New Media", "Change New Attributes", "Change New Media"
function isMacdUpdateNewAttributesOrMediaIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  const hasUpdateOrChange = /\b(update|change)\b/.test(t)
  const hasNewAttributes = /\bnew\s+attributes?\b/.test(t)
  const hasNewMedia = /\bnew\s+media\b/.test(t)
  return hasUpdateOrChange && (hasNewAttributes || hasNewMedia)
}

// Technical Attributes: "Old Values" (no specific field) → toggle Compare with Asset only
function isOldValuesToggleIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  // Only match when NO field is mentioned – e.g. "old values", "show old values" without a field
  if (/^old\s+values?\s*\.?$/.test(t)) return true
  // "show/enable old values" but NOT followed by "for/of [field]"
  if (/\b(show|enable|turn\s+on)\s+old\s+values?\s*\.?$/.test(t)) return true
  return false
}

// Technical Attributes: "old value of/for [field]" → extract field name
function getOldValueFieldFromIntent(text) {
  if (!text || typeof text !== 'string') return null
  const t = text.trim()
  // "old value of [field]", "what is the old value of [field]"
  const m1 = t.match(/(?:what\s+is\s+)?(?:the\s+)?old\s+values?\s+of\s+["']?([^"'?.]+)["']?\.?\s*$/i)
  if (m1) return m1[1].trim()
  // "old value for [field]", "show old value for [field]", "show old values for [field]"
  const m2 = t.match(/(?:show\s+)?old\s+values?\s+for\s+["']?([^"'?.]+)["']?\.?\s*$/i)
  if (m2) return m2[1].trim()
  // "old value of [field]" (anywhere)
  const m3 = t.match(/\bold\s+values?\s+of\s+["']?([^"'?.]+)["']?\.?\s*$/i)
  if (m3) return m3[1].trim()
  return null
}

function isYesIntent(text) {
  const s = (text || '').toLowerCase().trim()
  return /^\s*(yes|yeah|yep|sure|ok|okay|proceed|please|confirm)\s*\.?!?\s*$/i.test(s) || s === 'yes' || s === 'yeah' || s === 'sure' || s === 'proceed' || s === 'confirm'
}

function isAccountSelectionIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim()
  return /\baccount\s+ending\s+(?:in|with)\s+\d+/i.test(t) ||
    /\baccount\s+ending\s+\d+/i.test(t) ||
    /\bselect\s+account\b/i.test(t) ||
    /\bchoose\s+account\b/i.test(t) ||
    (/\baccount\b/i.test(t) && (/\bgo\s+ahead\b/i.test(t) || /\bselect\b/i.test(t) || /\bchoose\b/i.test(t) || /\bthis\b/i.test(t) || /\bthat\b/i.test(t) || /\bending\b/i.test(t)))
}

function isNewQuoteIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim()
  return /^\s*2\.?\s*$/.test(t) || /\bnew\b/i.test(t)
}

function isCreateNewOpportunityOptionIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim().toLowerCase()
  return /^\s*4\.?\s*$/.test(t) || /create\s+a?\s*new\s+opportunit/.test(t) || /new\s+opportunit/.test(t)
}

function buildQuoteChoicePrompt(accountName) {
  const name = String(accountName || '').trim() || 'this'
  return `This ${name} account currently has multiple quotes which are in various stages. Would you like to
1. Select one of the previous quotes
2. Create a new quote
3. Check only for feasibility for these locations`
}

function extractQuoteNameFromText(text) {
  const raw = String(text || '').trim()
  if (!raw) return ''
  const explicit = raw.match(/quote\s*name\s*(?:is|:)\s*(.+)$/i)
  if (explicit?.[1]) return explicit[1].trim().replace(/[.]+$/, '')
  return ''
}

function AgentforceSidePanel({
  open,
  onClose,
  activeNavTab,
  onNavigateToQuote2,
  onQuote2POUpdated,
  onNavigateToNewQuoteProposal,
  onNavigateToMatchedProducts,
  onNavigateToVerifiedDetails,
  onNavigateToAddedProductsFromExtracted,
  onNavigateToUpdatedRequestedValues,
  onUpdatedRequestedValuesCreated,
  onUpdateChangeAnalysisStart,
  onUpdateChangeAnalysisEnd,
  onNavigateToFeasibilityProposal,
  onNavigateToFeasibilityExtraction,
  onFeasibilityExtractionStatusShown,
  onNavigateToNewQuoteLocationsExtraction,
  onNewQuoteLocationsExtractionStatusShown,
  onNavigateToValidatedQuote,
  onQuoteProposalCreated,
  onMatchProductsStatusShown,
  onMatchProductsAnalysisStart,
  onMatchProductsAnalysisEnd,
  onVerifyDetailsStatusShown,
  onVerifyDetailsAnalysisStart,
  onVerifyDetailsAnalysisEnd,
  onAddProductsStatusShown,
  onAddProductsAnalysisStart,
  onAddProductsAnalysisEnd,
  onFeasibilityCheckStatusShown,
  onNavigateToFeasibilityCheck,
  onSbiQuoteStatusShown,
  onNavigateToSbiQuote,
  onFeasibilityValidateAddressStatusShown,
  onNavigateToFeasibilityValidateAddress,
  onFeasibilityMatchedProductsStatusShown,
  onNavigateToFeasibilityMatchedProducts,
  onFeasibilityLocationMatchAnalysisStart,
  onFeasibilityLocationMatchStatusShown,
  onNavigateToFeasibilityLocationMatch,
  onUpgradeQuoteCreated,
  onNavigateToUpgradeQuote,
  onEnrichQuoteUpdateCreated,
  onNavigateToEnrichQuoteUpdate,
  onPOChangeUpdateAnalysisStart,
  enrichQuoteFlowActive = false,
  technicalAttributesPageActive = false,
  onTechnicalAttributesUpdateCreated,
  onTechnicalAttributesToggleCompareWithAsset,
  macdQuoteActive = false,
  onMacdUpgradeUpdateCreated,
  onNavigateToMacdUpgradeUpdate,
  onMacdUpgradeUpdateAnalysisStart,
  feasibilityRequestsPageActive = false,
  initialRestoreSnapshot,
  onPanelStateChange,
}) {
  const showSalesAssistantStyle = activeNavTab === 'Home' || activeNavTab === 'Accounts'
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH)
  const [isPinned, setIsPinned] = useState(false)
  const [isConversationView, setIsConversationView] = useState(false)
  const [messages, setMessages] = useState([])
  const [hasNotification, setHasNotification] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef(null)
  const conversationScrollRef = useRef(null)
  const uploadFormFileInputRef = useRef(null)
  const [uploadFormFile, setUploadFormFile] = useState(null)
  const quoteProposalFormPendingStateRef = useRef(null)
  const poFormSubmittedRef = useRef(false)
  const quoteProposalFormSubmittedRef = useRef(false)
  const upgradeAttributesFormSubmittedRef = useRef(false)
  const feasibilityLocationsFormSubmittedRef = useRef(false)
  const dragRef = useRef({ startX: 0, startWidth: 0 })
  const hasAppliedRestoreRef = useRef(false)
  const createQuoteAccountFlowRef = useRef({ analyzingId: null, stageTimerId: null, revealTimerId: null })
  const feasibilityAccountFlowRef = useRef({ analyzingId: null, stageTimerId: null, payload: null, mode: 'matches', accountName: null })
  const locationsNewQuoteFlowRef = useRef({ analyzingId: null, stageTimerId: null, payload: null, mode: 'accountMatches', accountName: 'HDFC Bank', accountNumber: null, opportunityName: null, quoteName: null })
  const feasibilityUploadAnalysisIntervalRef = useRef(null)
  const feasibilityQuoteChoiceAnalysisIntervalRef = useRef(null)
  const feasibilityExtractionAnalysisIntervalRef = useRef(null)
  const feasibilityCheckAnalysisIntervalRef = useRef(null)
  const feasibilityCreateOppQuotePrefillAnalysisIntervalRef = useRef(null)
  const feasibilityCreateOppQuoteExtractionAnalysisIntervalRef = useRef(null)
  const feasibilityValidateAddressAnalysisIntervalRef = useRef(null)
  const locationsNewQuoteUploadAnalysisIntervalRef = useRef(null)
  const feasibilityLocationMatchAnalysisIntervalRef = useRef(null)
  const feasibilityMatchedProductsAnalysisIntervalRef = useRef(null)
  const feasibilityCreateOppQuoteFlowRef = useRef({ opportunityName: 'SBI Bank - New opportunity', quoteName: '' })
  const locationsNewQuoteUploadFormSubmittedRef = useRef(false)
  const matchProductsAnalyzingIntervalRef = useRef(null)
  const onMatchProductsAnalysisEndRef = useRef(onMatchProductsAnalysisEnd)
  onMatchProductsAnalysisEndRef.current = onMatchProductsAnalysisEnd
  const verifyDetailsAnalyzingIntervalRef = useRef(null)
  const onVerifyDetailsAnalysisEndRef = useRef(onVerifyDetailsAnalysisEnd)
  onVerifyDetailsAnalysisEndRef.current = onVerifyDetailsAnalysisEnd
  const addProductsAnalyzingIntervalRef = useRef(null)
  const onAddProductsAnalysisEndRef = useRef(onAddProductsAnalysisEnd)
  onAddProductsAnalysisEndRef.current = onAddProductsAnalysisEnd
  const updateChangeAnalyzingIntervalRef = useRef(null)

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  const startUpdateChangeAnalysisFlow = (analyzingId, userText) => {
    onUpdateChangeAnalysisStart?.()
    let step = 0
    updateChangeAnalyzingIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (updateChangeAnalyzingIntervalRef.current) clearInterval(updateChangeAnalyzingIntervalRef.current)
        updateChangeAnalyzingIntervalRef.current = null
        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingId
              ? { ...m, id: m.id, role: 'agent', text: UPDATE_CHANGE_RESPONSE, showUpdatedRequestedValuesLink: true, updateIntentText: userText, isUpdateChangeAnalyzing: false }
              : m
          )
        )
        onUpdatedRequestedValuesCreated?.(userText)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, updateChangeStageIndex: step } : m)))
      scrollToBottom()
    }, 1500)
  }

  const macdUpgradeUpdateAnalyzingIntervalRef = useRef(null)
  const startMacdUpgradeUpdateAnalysisFlow = (analyzingId, userText) => {
    onMacdUpgradeUpdateAnalysisStart?.()
    let step = 0
    macdUpgradeUpdateAnalyzingIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (macdUpgradeUpdateAnalyzingIntervalRef.current) clearInterval(macdUpgradeUpdateAnalyzingIntervalRef.current)
        macdUpgradeUpdateAnalyzingIntervalRef.current = null
        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingId
              ? { ...m, id: m.id, role: 'agent', text: MACD_UPGRADE_UPDATE_RESPONSE_PREFIX, showMacdUpgradeUpdateLink: true, macdUpgradeUpdateIntentText: userText, isMacdUpgradeUpdateAnalyzing: false }
              : m
          )
        )
        onMacdUpgradeUpdateCreated?.(userText)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, macdUpgradeUpdateStageIndex: step } : m)))
      scrollToBottom()
    }, 1500)
  }

  const technicalAttributesUpdateAnalyzingIntervalRef = useRef(null)
  const startTechnicalAttributesUpdateAnalysisFlow = (analyzingId, userText) => {
    onPOChangeUpdateAnalysisStart?.()
    let step = 0
    technicalAttributesUpdateAnalyzingIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (technicalAttributesUpdateAnalyzingIntervalRef.current) clearInterval(technicalAttributesUpdateAnalyzingIntervalRef.current)
        technicalAttributesUpdateAnalyzingIntervalRef.current = null
        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingId
              ? { ...m, id: m.id, role: 'agent', text: TECHNICAL_ATTRIBUTES_UPDATE_RESPONSE_PREFIX, showTechnicalAttributesUpdateLink: true, technicalAttributesUpdateIntentText: userText, isTechnicalAttributesUpdateAnalyzing: false }
              : m
          )
        )
        onTechnicalAttributesUpdateCreated?.(userText)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, technicalAttributesUpdateStageIndex: step } : m)))
      scrollToBottom()
    }, 1500)
  }

  const poChangeUpdateAnalyzingIntervalRef = useRef(null)
  const startPOChangeUpdateAnalysisFlow = (analyzingId, userText) => {
    onPOChangeUpdateAnalysisStart?.()
    let step = 0
    poChangeUpdateAnalyzingIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (poChangeUpdateAnalyzingIntervalRef.current) clearInterval(poChangeUpdateAnalyzingIntervalRef.current)
        poChangeUpdateAnalyzingIntervalRef.current = null
        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingId
              ? { ...m, id: m.id, role: 'agent', text: PO_CHANGE_UPDATE_RESPONSE_PREFIX, showEnrichQuoteUpdateLink: true, enrichQuoteUpdateIntentText: userText, isPOChangeUpdateAnalyzing: false }
              : m
          )
        )
        onEnrichQuoteUpdateCreated?.(userText)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, poChangeUpdateStageIndex: step } : m)))
      scrollToBottom()
    }, 1500)
  }

  const startMatchProductsAnalysisFlow = (analyzingId) => {
    onMatchProductsAnalysisStart?.()
    let step = 0
    matchProductsAnalyzingIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (matchProductsAnalyzingIntervalRef.current) clearInterval(matchProductsAnalyzingIntervalRef.current)
        matchProductsAnalyzingIntervalRef.current = null
        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingId
              ? { ...m, id: m.id, role: 'agent', text: MATCH_PRODUCTS_RESPONSE_PREFIX, showMatchProductsLink: true, isMatchProductsAnalyzing: false }
              : m
          )
        )
        onMatchProductsStatusShown?.()
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, matchProductsStageIndex: step } : m)))
      scrollToBottom()
    }, 1500)
  }

  const startVerifyDetailsAnalysisFlow = (analyzingId) => {
    onVerifyDetailsAnalysisStart?.()
    let step = 0
    verifyDetailsAnalyzingIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (verifyDetailsAnalyzingIntervalRef.current) clearInterval(verifyDetailsAnalyzingIntervalRef.current)
        verifyDetailsAnalyzingIntervalRef.current = null
        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingId
              ? { ...m, id: m.id, role: 'agent', text: VERIFY_DETAILS_RESPONSE_PREFIX, showVerifiedDetailsLink: true, isVerifyDetailsAnalyzing: false }
              : m
          )
        )
        onVerifyDetailsStatusShown?.()
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, verifyDetailsStageIndex: step } : m)))
      scrollToBottom()
    }, 1500)
  }

  const startAddProductsAnalysisFlow = (analyzingId) => {
    onAddProductsAnalysisStart?.()
    let step = 0
    addProductsAnalyzingIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (addProductsAnalyzingIntervalRef.current) clearInterval(addProductsAnalyzingIntervalRef.current)
        addProductsAnalyzingIntervalRef.current = null
        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingId
              ? { ...m, id: m.id, role: 'agent', text: ADD_PRODUCTS_RESPONSE_PREFIX, showAddedProductsFromExtractedLink: true, isAddProductsAnalyzing: false }
              : m
          )
        )
        onAddProductsStatusShown?.()
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, addProductsStageIndex: step } : m)))
      scrollToBottom()
    }, 1500)
  }

  useEffect(() => { if (messages.length) scrollToBottom() }, [messages.length])

  useEffect(() => {
    quoteProposalFormPendingStateRef.current = null
  }, [messages])

  const startCreateQuoteAccountFlow = (customerName, analyzingId, isFromWelcome) => {
    const ref = createQuoteAccountFlowRef.current
    ref.analyzingId = analyzingId
    ref.customerName = customerName ?? 'the customer'
    if (ref.stageTimerId) clearInterval(ref.stageTimerId)
    let step = 0
    ref.stageTimerId = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (ref.stageTimerId) clearInterval(ref.stageTimerId)
        ref.stageTimerId = null
        const payload = buildCreateQuoteAccountMatchesPayload(ref.customerName)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingId
              ? { ...m, id: m.id, role: 'agent', showCreateQuoteAccountMatches: true, accountMatchesRevealPhase: 0, ...payload, isCreateQuoteAccountAnalyzing: false }
              : m
          )
        )
        let phase = 0
        if (ref.revealTimerId) clearInterval(ref.revealTimerId)
        ref.revealTimerId = setInterval(() => {
          phase += 1
          if (phase > 5) {
            if (ref.revealTimerId) clearInterval(ref.revealTimerId)
            ref.revealTimerId = null
            return
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === analyzingId && m.showCreateQuoteAccountMatches ? { ...m, accountMatchesRevealPhase: phase } : m))
          )
          scrollToBottom()
        }, 1200)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, createQuoteAccountStageIndex: step } : m)))
      scrollToBottom()
    }, 1500)
  }

  const startFeasibilityAccountAnalysisFlow = ({ analyzingId, mode, accountName }) => {
    const ref = feasibilityAccountFlowRef.current
    ref.analyzingId = analyzingId
    ref.mode = mode
    ref.accountName = accountName || null
    if (ref.stageTimerId) clearInterval(ref.stageTimerId)
    let step = 0
    ref.stageTimerId = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (ref.stageTimerId) clearInterval(ref.stageTimerId)
        ref.stageTimerId = null
        if (mode === 'confirm') {
          const payload = {
            accountName: accountName || 'SBI Bank Account',
            accountNumber: random10Digit(),
          }
          ref.payload = payload
          setMessages((prev) => prev.map((m) => (m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: 'Please confirm the account',
                showFeasibilityAccountConfirmation: true,
                feasibilityAccountConfirmation: payload,
                isFeasibilityAccountAnalyzing: false,
              }
            : m)))
          return
        }
        const payload = buildFeasibilityAccountMatchesPayload()
        ref.payload = payload
        setMessages((prev) => prev.map((m) => (m.id === analyzingId
          ? {
              ...m,
              role: 'agent',
              text: 'Here are some of the recent accounts that you were working on. Please review the option below and select the one you want to proceed with or let me know the name of the account you want to go ahead with :',
              showFeasibilityAccountMatches: true,
              feasibilityAccountMatches: payload.accounts,
              isFeasibilityAccountAnalyzing: false,
            }
          : m)))
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityAccountStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const startLocationsNewQuoteAnalysisFlow = ({ analyzingId, mode, accountName, opportunityName }) => {
    const ref = locationsNewQuoteFlowRef.current
    ref.analyzingId = analyzingId
    ref.mode = mode
    ref.accountName = accountName || ref.accountName || 'HDFC Bank'
    if (opportunityName && String(opportunityName).trim()) {
      ref.opportunityName = String(opportunityName).trim()
    }
    if (ref.stageTimerId) clearInterval(ref.stageTimerId)
    let step = 0
    ref.stageTimerId = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (ref.stageTimerId) clearInterval(ref.stageTimerId)
        ref.stageTimerId = null
        if (mode === 'accountConfirm') {
          const payload = {
            accountName: ref.accountName || 'HDFC Bank',
            accountNumber: random10Digit(),
          }
          ref.payload = payload
          ref.accountName = payload.accountName
          ref.accountNumber = payload.accountNumber
          setMessages((prev) => prev.map((m) => (m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: 'Please confirm if this is the account you are looking for,',
                showLocationsNewQuoteAccountConfirmation: true,
                locationsNewQuoteAccountConfirmation: payload,
                isLocationsNewQuoteAnalyzing: false,
              }
            : m)))
          return
        }
        if (mode === 'opportunities') {
          const opportunities = buildLocationsNewQuoteOpportunities(ref.accountName)
          ref.payload = { opportunities }
          setMessages((prev) => prev.map((m) => (m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: 'Here are the existing recent Opportunities of HDFC Bank that you have worked with which does not have any quotes on them. Do you want to go ahead with this or you want to create a new Opportunity?',
                showLocationsNewQuoteOpportunities: true,
                locationsNewQuoteOpportunities: opportunities,
                isLocationsNewQuoteAnalyzing: false,
              }
            : m)))
          return
        }
        if (mode === 'prefillOpportunity') {
          const prefill = buildLocationsNewQuotePrefill(ref.accountName, ref.opportunityName)
          ref.payload = { prefill }
          setMessages((prev) => prev.map((m) => (m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: 'Sure. I can assist you with that. Here are some of the pre-filled details for the new opportunity, please review and confirm if you are good to go ahead with it',
                showLocationsNewQuoteOpportunityPrefill: true,
                locationsNewQuoteOpportunityPrefill: prefill,
                isLocationsNewQuoteOpportunityPrefillQuestion: true,
                isLocationsNewQuoteAnalyzing: false,
              }
            : m)))
          return
        }
        const payload = buildLocationsNewQuoteAccountMatchesPayload()
        ref.payload = payload
        setMessages((prev) => prev.map((m) => (m.id === analyzingId
          ? {
              ...m,
              role: 'agent',
              text: 'Here are some of the recent accounts that you have been working on in last week. Please review the option below and select the one you want to proceed with or let me know the name of the account you want to go ahead with :',
              showLocationsNewQuoteAccountMatches: true,
              locationsNewQuoteAccountMatches: payload.accounts,
              isLocationsNewQuoteAnalyzing: false,
            }
          : m)))
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, locationsNewQuoteStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const startFeasibilityQuoteChoiceAnalysisFlow = (analyzingId, accountName) => {
    let step = 0
    if (feasibilityQuoteChoiceAnalysisIntervalRef.current) {
      clearInterval(feasibilityQuoteChoiceAnalysisIntervalRef.current)
      feasibilityQuoteChoiceAnalysisIntervalRef.current = null
    }
    feasibilityQuoteChoiceAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (feasibilityQuoteChoiceAnalysisIntervalRef.current) {
          clearInterval(feasibilityQuoteChoiceAnalysisIntervalRef.current)
          feasibilityQuoteChoiceAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: buildQuoteChoicePrompt(accountName),
                isFeasibilityQuoteChoiceAnalyzing: false,
                isFeasibilityQuoteChoiceQuestion: true,
              }
            : m
        )))
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityQuoteChoiceStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const startFeasibilityExtractionAnalysisFlow = (analyzingId) => {
    let step = 0
    if (feasibilityExtractionAnalysisIntervalRef.current) {
      clearInterval(feasibilityExtractionAnalysisIntervalRef.current)
      feasibilityExtractionAnalysisIntervalRef.current = null
    }
    feasibilityExtractionAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (feasibilityExtractionAnalysisIntervalRef.current) {
          clearInterval(feasibilityExtractionAnalysisIntervalRef.current)
          feasibilityExtractionAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: FEASIBILITY_EXTRACT_RESPONSE_PREFIX,
                showFeasibilityExtractionLink: true,
                isFeasibilityExtractionAnalyzing: false,
              }
            : m
        )))
        setTimeout(() => onFeasibilityExtractionStatusShown?.(), 1000)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityExtractionStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const startFeasibilityLocationMatchAnalysisFlow = (analyzingId) => {
    onFeasibilityLocationMatchAnalysisStart?.()
    let step = 0
    if (feasibilityLocationMatchAnalysisIntervalRef.current) {
      clearInterval(feasibilityLocationMatchAnalysisIntervalRef.current)
      feasibilityLocationMatchAnalysisIntervalRef.current = null
    }
    feasibilityLocationMatchAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (feasibilityLocationMatchAnalysisIntervalRef.current) {
          clearInterval(feasibilityLocationMatchAnalysisIntervalRef.current)
          feasibilityLocationMatchAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: FEASIBILITY_LOCATION_MATCH_RESPONSE_PREFIX,
                showFeasibilityLocationMatchLink: true,
                isFeasibilityLocationMatchAnalyzing: false,
              }
            : m
        )))
        setTimeout(() => onFeasibilityLocationMatchStatusShown?.(), 1000)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityLocationMatchStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const startFeasibilityMatchedProductsAnalysisFlow = (analyzingId) => {
    let step = 0
    if (feasibilityMatchedProductsAnalysisIntervalRef.current) {
      clearInterval(feasibilityMatchedProductsAnalysisIntervalRef.current)
      feasibilityMatchedProductsAnalysisIntervalRef.current = null
    }
    feasibilityMatchedProductsAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (feasibilityMatchedProductsAnalysisIntervalRef.current) {
          clearInterval(feasibilityMatchedProductsAnalysisIntervalRef.current)
          feasibilityMatchedProductsAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: FEASIBILITY_MATCHED_PRODUCTS_RESPONSE_PREFIX,
                showFeasibilityMatchedProductsLink: true,
                isFeasibilityMatchedProductsAnalyzing: false,
              }
            : m
        )))
        setTimeout(() => onFeasibilityMatchedProductsStatusShown?.(), 1000)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityMatchedProductsStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const startFeasibilityValidateAddressAnalysisFlow = (analyzingId) => {
    let step = 0
    if (feasibilityValidateAddressAnalysisIntervalRef.current) {
      clearInterval(feasibilityValidateAddressAnalysisIntervalRef.current)
      feasibilityValidateAddressAnalysisIntervalRef.current = null
    }
    feasibilityValidateAddressAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (feasibilityValidateAddressAnalysisIntervalRef.current) {
          clearInterval(feasibilityValidateAddressAnalysisIntervalRef.current)
          feasibilityValidateAddressAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: FEASIBILITY_VALIDATE_ADDRESS_RESPONSE_PREFIX,
                showFeasibilityValidateAddressLink: true,
                isFeasibilityValidateAddressAnalyzing: false,
              }
            : m
        )))
        setTimeout(() => onFeasibilityValidateAddressStatusShown?.(), 1000)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityValidateAddressStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const startFeasibilityCheckAnalysisFlow = (analyzingId) => {
    let step = 0
    if (feasibilityCheckAnalysisIntervalRef.current) {
      clearInterval(feasibilityCheckAnalysisIntervalRef.current)
      feasibilityCheckAnalysisIntervalRef.current = null
    }
    feasibilityCheckAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (feasibilityCheckAnalysisIntervalRef.current) {
          clearInterval(feasibilityCheckAnalysisIntervalRef.current)
          feasibilityCheckAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: FEASIBILITY_CHECK_RESPONSE_PREFIX,
                showFeasibilityCheckLink: true,
                isFeasibilityCheckAnalyzing: false,
              }
            : m
        )))
        setTimeout(() => onFeasibilityCheckStatusShown?.(), 1000)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityCheckStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const startFeasibilityCreateOppQuotePrefillAnalysisFlow = (analyzingId, opportunityName) => {
    let step = 0
    if (feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current) {
      clearInterval(feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current)
      feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current = null
    }
    feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current) {
          clearInterval(feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current)
          feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: 'Here are some of the pre-filled details for the new opportunity, please review and confirm if you are good to go ahead with',
                showFeasibilityCreateOppQuotePrefill: true,
                feasibilityCreateOppQuotePrefill: {
                  opportunityName: opportunityName && String(opportunityName).trim() ? String(opportunityName).trim() : 'SBI Bank - New opportunity',
                  bsg: 'Rohit Sharma',
                  kdm: 'Ananya Iyer',
                  stage: 'Initial',
                  opportunityType: 'New',
                  expectedCloseDate: '24 May 2026',
                  monthProjection: 'Commitment',
                },
                isFeasibilityCreateOppQuotePrefillAnalyzing: false,
                isFeasibilityCreateOppQuotePrefillQuestion: true,
              }
            : m
        )))
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityCreateOppQuotePrefillStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const startFeasibilityCreateOppQuoteExtractionAnalysisFlow = (analyzingId, quoteName) => {
    let step = 0
    if (feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current) {
      clearInterval(feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current)
      feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current = null
    }
    feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current) {
          clearInterval(feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current)
          feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: `Thank you. Your quote is now being created under the name ${String(quoteName || '').trim() || 'SBI Bank Quote'}, you will be notified once done, or you can check the status - `,
                showFeasibilitySbiQuoteLink: true,
                isFeasibilityCreateOppQuoteExtractionAnalyzing: false,
              }
            : m
        )))
        setTimeout(() => onSbiQuoteStatusShown?.(), 1000)
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityCreateOppQuoteExtractionStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  useEffect(() => {
    const ref = createQuoteAccountFlowRef.current
    const feasibilityRef = feasibilityAccountFlowRef.current
    const locationsRef = locationsNewQuoteFlowRef.current
    return () => {
      if (ref.stageTimerId) clearInterval(ref.stageTimerId)
      if (ref.revealTimerId) clearInterval(ref.revealTimerId)
      if (feasibilityRef.stageTimerId) clearInterval(feasibilityRef.stageTimerId)
      if (locationsRef.stageTimerId) clearInterval(locationsRef.stageTimerId)
      if (matchProductsAnalyzingIntervalRef.current) {
        clearInterval(matchProductsAnalyzingIntervalRef.current)
        matchProductsAnalyzingIntervalRef.current = null
      }
      if (verifyDetailsAnalyzingIntervalRef.current) {
        clearInterval(verifyDetailsAnalyzingIntervalRef.current)
        verifyDetailsAnalyzingIntervalRef.current = null
      }
      if (addProductsAnalyzingIntervalRef.current) {
        clearInterval(addProductsAnalyzingIntervalRef.current)
        addProductsAnalyzingIntervalRef.current = null
      }
      if (feasibilityUploadAnalysisIntervalRef.current) {
        clearInterval(feasibilityUploadAnalysisIntervalRef.current)
        feasibilityUploadAnalysisIntervalRef.current = null
      }
      if (feasibilityQuoteChoiceAnalysisIntervalRef.current) {
        clearInterval(feasibilityQuoteChoiceAnalysisIntervalRef.current)
        feasibilityQuoteChoiceAnalysisIntervalRef.current = null
      }
      if (feasibilityExtractionAnalysisIntervalRef.current) {
        clearInterval(feasibilityExtractionAnalysisIntervalRef.current)
        feasibilityExtractionAnalysisIntervalRef.current = null
      }
      if (locationsNewQuoteUploadAnalysisIntervalRef.current) {
        clearInterval(locationsNewQuoteUploadAnalysisIntervalRef.current)
        locationsNewQuoteUploadAnalysisIntervalRef.current = null
      }
      if (feasibilityLocationMatchAnalysisIntervalRef.current) {
        clearInterval(feasibilityLocationMatchAnalysisIntervalRef.current)
        feasibilityLocationMatchAnalysisIntervalRef.current = null
      }
      if (feasibilityMatchedProductsAnalysisIntervalRef.current) {
        clearInterval(feasibilityMatchedProductsAnalysisIntervalRef.current)
        feasibilityMatchedProductsAnalysisIntervalRef.current = null
      }
      if (feasibilityValidateAddressAnalysisIntervalRef.current) {
        clearInterval(feasibilityValidateAddressAnalysisIntervalRef.current)
        feasibilityValidateAddressAnalysisIntervalRef.current = null
      }
      if (feasibilityCheckAnalysisIntervalRef.current) {
        clearInterval(feasibilityCheckAnalysisIntervalRef.current)
        feasibilityCheckAnalysisIntervalRef.current = null
      }
      if (feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current) {
        clearInterval(feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current)
        feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current = null
      }
      if (feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current) {
        clearInterval(feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current)
        feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current = null
      }
      if (updateChangeAnalyzingIntervalRef.current) {
        clearInterval(updateChangeAnalyzingIntervalRef.current)
        updateChangeAnalyzingIntervalRef.current = null
      }
      onMatchProductsAnalysisEndRef.current?.()
      onVerifyDetailsAnalysisEndRef.current?.()
      onAddProductsAnalysisEndRef.current?.()
    }
  }, [])

  const effectiveMessages = open && initialRestoreSnapshot?.messages?.length && messages.length === 0
    ? initialRestoreSnapshot.messages
    : messages
  const effectiveIsConversationView = open && initialRestoreSnapshot?.messages?.length && messages.length === 0
    ? !!initialRestoreSnapshot.isConversationView
    : isConversationView

  useEffect(() => {
    if (!open) hasAppliedRestoreRef.current = false
  }, [open])

  useEffect(() => {
    if (!open || !initialRestoreSnapshot || hasAppliedRestoreRef.current) return
    hasAppliedRestoreRef.current = true
    const s = initialRestoreSnapshot
    if (s.isConversationView != null) setIsConversationView(!!s.isConversationView)
    if (Array.isArray(s.messages) && s.messages.length > 0) setMessages(s.messages)
    if (s.hasNotification != null) setHasNotification(!!s.hasNotification)
    if (s.isPinned != null) setIsPinned(!!s.isPinned)
    onPanelStateChange?.({ isConversationView: !!s.isConversationView, messages: s.messages || [], hasNotification: !!s.hasNotification, isPinned: !!s.isPinned })
  }, [open, initialRestoreSnapshot, onPanelStateChange])

  useEffect(() => {
    if (!open) return
    onPanelStateChange?.({ isConversationView, messages, hasNotification, isPinned })
  }, [open, isConversationView, messages, hasNotification, isPinned, onPanelStateChange])

  const startConversation = () => {
    setIsConversationView(true)
    setMessages(showSalesAssistantStyle ? [SALES_ASSISTANT_INTRO_MSG] : [])
    setHasNotification(false)
  }

  const goBackToWelcome = () => {
    setIsConversationView(false)
    setMessages([])
    setHasNotification(false)
  }

  const sendChatMessage = () => {
    const text = (chatInput || '').trim()
    if (!text) return
    setChatInput('')

    if (!isConversationView) {
      setIsConversationView(true)
      const userMsg = { id: `user-${Date.now()}`, role: 'user', text }
      const prependIntro = showSalesAssistantStyle ? [SALES_ASSISTANT_INTRO_MSG] : []
      if (technicalAttributesPageActive) {
        const field = getOldValueFieldFromIntent(text)
        if (field) {
          onTechnicalAttributesToggleCompareWithAsset?.()
          const result = getOldValueForField(field)
          const agentText = result ? `The old value of "${result.label}" is ${result.value}.` : `I couldn't find an old value for "${field}".`
          setMessages([...prependIntro, userMsg, { id: `agent-${Date.now()}`, role: 'agent', text: agentText }])
          return
        }
        if (isOldValuesToggleIntent(text)) {
          onTechnicalAttributesToggleCompareWithAsset?.()
          setMessages([...prependIntro, userMsg, { id: `agent-${Date.now()}`, role: 'agent', text: 'Compare with Asset has been enabled.' }])
          return
        }
      }
      if (macdQuoteActive && isMacdUpdateNewAttributesOrMediaIntent(text)) {
        const analyzingId = `macd-upgrade-update-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isMacdUpgradeUpdateAnalyzing: true, macdUpgradeUpdateStageIndex: 0, macdUpgradeUpdateIntentText: text }])
        startMacdUpgradeUpdateAnalysisFlow(analyzingId, text)
      } else if (isTechnicalAttributesChangeIntent(text)) {
        const analyzingId = `technical-attributes-update-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isTechnicalAttributesUpdateAnalyzing: true, technicalAttributesUpdateStageIndex: 0, technicalAttributesUpdateIntentText: text }])
        startTechnicalAttributesUpdateAnalysisFlow(analyzingId, text)
      } else if (isPOChangeUpdateIntent(text)) {
        const analyzingId = `po-change-update-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isPOChangeUpdateAnalyzing: true, poChangeUpdateStageIndex: 0, enrichQuoteUpdateIntentText: text }])
        startPOChangeUpdateAnalysisFlow(analyzingId, text)
      } else if (isUpdateOrChangeIntent(text)) {
        const analyzingId = `update-change-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isUpdateChangeAnalyzing: true, updateChangeStageIndex: 0, updateIntentText: text }])
        startUpdateChangeAnalysisFlow(analyzingId, text)
      } else if (isCreateQuoteForCustomerFlow(text)) {
        const customerName = getCreateQuoteCustomerName(text) || 'the customer'
        const analyzingId = `create-quote-account-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isCreateQuoteAccountAnalyzing: true, createQuoteAccountStageIndex: 0 }])
        startCreateQuoteAccountFlow(customerName, analyzingId, true)
      } else if (isUploadLocationsToNewQuoteIntent(text)) {
        const analyzingId = `locations-new-quote-account-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isLocationsNewQuoteAnalyzing: true, locationsNewQuoteStageIndex: 0 }])
        startLocationsNewQuoteAnalysisFlow({ analyzingId, mode: 'accountMatches' })
      } else if (feasibilityRequestsPageActive && isCreateOpportunityAndQuoteIntent(text)) {
        setMessages([
          ...prependIntro,
          userMsg,
          { id: `agent-${Date.now()}`, role: 'agent', text: FEASIBILITY_CREATE_OPP_QUOTE_PROMPT, isFeasibilityCreateOppQuoteOpportunityNameQuestion: true },
        ])
      } else if (isCreateQuoteProposalIntent(text)) {
        setMessages([...prependIntro, userMsg, { id: `agent-${Date.now()}`, role: 'agent', text: CREATE_QUOTE_PROPOSAL_RESPONSE, isCreateQuoteUploadQuestion: true }])
      } else if (isAddProductsFromExtractedIntent(text)) {
        const analyzingId = `add-products-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isAddProductsAnalyzing: true, addProductsStageIndex: 0 }])
        startAddProductsAnalysisFlow(analyzingId)
      } else if (isVerifyDetailsIntent(text)) {
        const analyzingId = `verify-details-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isVerifyDetailsAnalyzing: true, verifyDetailsStageIndex: 0 }])
        startVerifyDetailsAnalysisFlow(analyzingId)
      } else if (feasibilityRequestsPageActive && isCheckForFeasibilityIntent(text)) {
        const analyzingId = `feasibility-check-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isFeasibilityCheckAnalyzing: true, feasibilityCheckStageIndex: 0 }])
        startFeasibilityCheckAnalysisFlow(analyzingId)
      } else if (feasibilityRequestsPageActive && isValidateAddressIntent(text)) {
        const analyzingId = `feasibility-validate-address-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isFeasibilityValidateAddressAnalyzing: true, feasibilityValidateAddressStageIndex: 0 }])
        startFeasibilityValidateAddressAnalysisFlow(analyzingId)
      } else if (feasibilityRequestsPageActive && isMatchAllProductsIntent(text)) {
        const analyzingId = `feasibility-matched-products-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isFeasibilityMatchedProductsAnalyzing: true, feasibilityMatchedProductsStageIndex: 0 }])
        startFeasibilityMatchedProductsAnalysisFlow(analyzingId)
      } else if (isMatchLocationsForPremisesIntent(text)) {
        const analyzingId = `feasibility-location-match-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isFeasibilityLocationMatchAnalyzing: true, feasibilityLocationMatchStageIndex: 0 }])
        startFeasibilityLocationMatchAnalysisFlow(analyzingId)
      } else if (isMatchIntent(text)) {
        const analyzingId = `match-products-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isMatchProductsAnalyzing: true, matchProductsStageIndex: 0 }])
        startMatchProductsAnalysisFlow(analyzingId)
      } else if (isFeasibilityIntent(text)) {
        const analyzingId = `feasibility-account-analyzing-${Date.now()}`
        setMessages([...prependIntro, userMsg, { id: analyzingId, role: 'agent', isFeasibilityAccountAnalyzing: true, feasibilityAccountStageIndex: 0 }])
        startFeasibilityAccountAnalysisFlow({ analyzingId, mode: 'matches' })
      } else if (isValidateQuoteIntent(text)) {
        setMessages([...prependIntro, userMsg, { id: `agent-${Date.now()}`, role: 'agent', text: VALIDATE_QUOTE_RESPONSE_PREFIX, showValidatedQuoteLink: true }])
      } else if (isDOAIntent(text)) {
        setMessages([...prependIntro, userMsg, { id: `agent-${Date.now()}`, role: 'agent', text: DOA_RESPONSE }])
      } else if (isUpgradeAttributesIntent(text)) {
        setMessages([...prependIntro, userMsg, { id: `agent-${Date.now()}`, role: 'agent', text: UPGRADE_ATTRIBUTES_RESPONSE, isUpgradeAttributesUploadQuestion: true }])
      } else if (isPOIntent(text)) {
        setMessages([...prependIntro, userMsg, { id: `agent-${Date.now()}`, role: 'agent', text: PO_AGENT_RESPONSE, isPOUploadQuestion: true }])
      } else {
      setMessages([
          ...prependIntro,
          userMsg,
          { id: `agent-${Date.now()}`, role: 'agent', text: 'I can help with creating quote proposals, matching products, or updating/changing quote values. Try asking something like: "I want to create a quote proposal", "Match all products", or "Update the attributes for SD WAN from managed to co-owned".' },
      ])
      }
      return
    }

    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null
    const isAfterPOQuestion = lastMsg?.isPOUploadQuestion === true
    const isAfterCreateQuoteQuestion = lastMsg?.isCreateQuoteUploadQuestion === true
    const isAfterUpgradeAttributesQuestion = lastMsg?.isUpgradeAttributesUploadQuestion === true

    if (isAfterPOQuestion && isYesIntent(text)) {
      poFormSubmittedRef.current = false
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `${PO_UPLOAD_FORM_MESSAGE_ID}-${Date.now()}`, role: 'agent', text: 'Upload file', showUploadForm: true, uploadFormType: 'po' },
      ])
      return
    }

    if (isAfterCreateQuoteQuestion && isYesIntent(text)) {
      console.log('[Agentforce Upload] User said "yes" after Create Quote question – adding Quote Proposal upload form')
      quoteProposalFormSubmittedRef.current = false
      setMessages((prev) => {
        const pending = quoteProposalFormPendingStateRef.current
        if (pending) {
          console.log('[Agentforce Upload] Quote Proposal – using pending state (duplicate run)')
          return pending
        }
        const alreadyHasQuoteProposalForm = prev.some((m) => m.showUploadForm && m.uploadFormType === 'quoteProposal')
        if (alreadyHasQuoteProposalForm) {
          console.log('[Agentforce Upload] Quote Proposal – upload form already present, skipping')
          return prev
        }
        const next = [
          ...prev,
          { id: `user-${Date.now()}`, role: 'user', text },
          { id: `${QUOTE_PROPOSAL_UPLOAD_FORM_MESSAGE_ID}-${Date.now()}`, role: 'agent', text: 'Upload file', showUploadForm: true, uploadFormType: 'quoteProposal' },
        ]
        quoteProposalFormPendingStateRef.current = next
        console.log('[Agentforce Upload] Quote Proposal – adding upload form message to conversation')
        return next
      })
      return
    }

    if (isAfterUpgradeAttributesQuestion && isYesIntent(text)) {
      upgradeAttributesFormSubmittedRef.current = false
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `upgrade-attributes-upload-form-${Date.now()}`, role: 'agent', text: 'Upload file', showUploadForm: true, uploadFormType: 'upgradeAttributes' },
      ])
      return
    }

    const isAfterAccountMatches = lastMsg?.role === 'agent' && lastMsg?.showCreateQuoteAccountMatches === true
    const isAfterSelectOpportunityOrNewQuote = lastMsg?.isSelectOpportunityOrNewQuoteQuestion === true
    const isAfterFeasibilityAccountMatches = lastMsg?.role === 'agent' && lastMsg?.showFeasibilityAccountMatches === true
    const isAfterFeasibilityAccountConfirm = lastMsg?.role === 'agent' && lastMsg?.showFeasibilityAccountConfirmation === true
    const isAfterFeasibilityUploadQuestion = lastMsg?.isFeasibilityUploadQuestion === true
    const isAfterFeasibilityDocumentTypeQuestion = lastMsg?.isFeasibilityDocumentTypeQuestion === true
    const isAfterFeasibilityQuoteChoiceQuestion = lastMsg?.isFeasibilityQuoteChoiceQuestion === true
    const isAfterFeasibilityRequestNameQuestion = lastMsg?.isFeasibilityRequestNameQuestion === true
    const isAfterLocationsNewQuoteAccountMatches = lastMsg?.role === 'agent' && lastMsg?.showLocationsNewQuoteAccountMatches === true
    const isAfterLocationsNewQuoteAccountConfirm = lastMsg?.role === 'agent' && lastMsg?.showLocationsNewQuoteAccountConfirmation === true
    const isAfterLocationsNewQuoteUploadQuestion = lastMsg?.isLocationsNewQuoteUploadQuestion === true
    const isAfterLocationsNewQuoteDocumentTypeQuestion = lastMsg?.isLocationsNewQuoteDocumentTypeQuestion === true
    const isAfterLocationsNewQuoteChoiceQuestion = lastMsg?.isLocationsNewQuoteQuoteChoiceQuestion === true
    const isAfterLocationsNewQuoteOpportunities = lastMsg?.showLocationsNewQuoteOpportunities === true
    const isAfterLocationsNewQuoteOpportunityNameQuestion = lastMsg?.isLocationsNewQuoteOpportunityNameQuestion === true
    const isAfterLocationsNewQuoteOpportunityPrefill = lastMsg?.isLocationsNewQuoteOpportunityPrefillQuestion === true
    const isAfterLocationsNewQuoteQuoteNameQuestion = lastMsg?.isLocationsNewQuoteQuoteNameQuestion === true
    const isAfterFeasibilityCreateOppQuoteOpportunityNameQuestion = lastMsg?.isFeasibilityCreateOppQuoteOpportunityNameQuestion === true
    const isAfterFeasibilityCreateOppQuotePrefillQuestion = lastMsg?.isFeasibilityCreateOppQuotePrefillQuestion === true
    const isAfterFeasibilityCreateOppQuoteQuoteNameQuestion = lastMsg?.isFeasibilityCreateOppQuoteQuoteNameQuestion === true

    if (isAfterFeasibilityCreateOppQuoteOpportunityNameQuestion && text.trim()) {
      const providedOpportunityName = text.trim()
      feasibilityCreateOppQuoteFlowRef.current.opportunityName = providedOpportunityName
      const analyzingId = `feasibility-create-opp-quote-prefill-analyzing-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: analyzingId, role: 'agent', isFeasibilityCreateOppQuotePrefillAnalyzing: true, feasibilityCreateOppQuotePrefillStageIndex: 0 },
      ])
      startFeasibilityCreateOppQuotePrefillAnalysisFlow(analyzingId, providedOpportunityName)
      return
    }

    if (isAfterFeasibilityCreateOppQuotePrefillQuestion) {
      if (!(isYesIntent(text) || /\bgo\s+ahead\b/i.test(text))) {
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: 'user', text },
          { id: `agent-${Date.now()}`, role: 'agent', text: FEASIBILITY_CREATE_OPP_QUOTE_QUOTE_NAME_PROMPT, isFeasibilityCreateOppQuoteQuoteNameQuestion: true },
        ])
        return
      }
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `agent-${Date.now()}`, role: 'agent', text: FEASIBILITY_CREATE_OPP_QUOTE_QUOTE_NAME_PROMPT, isFeasibilityCreateOppQuoteQuoteNameQuestion: true },
      ])
      return
    }

    if (isAfterFeasibilityCreateOppQuoteQuoteNameQuestion && text.trim()) {
      const providedQuoteName = extractQuoteNameFromText(text) || text.trim().replace(/[.]+$/, '')
      feasibilityCreateOppQuoteFlowRef.current.quoteName = providedQuoteName
      const analyzingId = `feasibility-create-opp-quote-extraction-analyzing-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: analyzingId, role: 'agent', isFeasibilityCreateOppQuoteExtractionAnalyzing: true, feasibilityCreateOppQuoteExtractionStageIndex: 0 },
      ])
      startFeasibilityCreateOppQuoteExtractionAnalysisFlow(analyzingId, providedQuoteName)
      return
    }

    if (isAfterAccountMatches && isAccountSelectionIntent(text)) {
      const accountName = lastMsg.accountName || 'This customer'
      const agentText = `${accountName} currently has multiple opportunities and quotes in various stages. Would you like to select one of them or create a new quote`
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `agent-${Date.now()}`, role: 'agent', text: agentText, isSelectOpportunityOrNewQuoteQuestion: true },
      ])
      return
    }

    if (isAfterSelectOpportunityOrNewQuote && isNewQuoteIntent(text)) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `agent-${Date.now()}`, role: 'agent', text: CREATE_QUOTE_PROPOSAL_RESPONSE, isCreateQuoteUploadQuestion: true },
      ])
      return
    }

    if (isAfterFeasibilityAccountMatches) {
      const userLower = text.toLowerCase().trim()
      const options = lastMsg.feasibilityAccountMatches || []
      const matchedOption = options.find((option) => userLower.includes(option.accountName.toLowerCase()))
      if (matchedOption || isAccountSelectionIntent(text)) {
        const selected = matchedOption || options[0]
        if (selected?.accountName) feasibilityAccountFlowRef.current.accountName = selected.accountName
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: 'user', text },
          { id: `agent-${Date.now()}`, role: 'agent', text: 'I can assist you with your request. You could upload the document directly. Would you like to proceed with uploading the document or any other type of document?', isFeasibilityUploadQuestion: true },
        ])
      } else {
        const analyzingId = `feasibility-account-confirm-analyzing-${Date.now()}`
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: 'user', text },
          { id: analyzingId, role: 'agent', isFeasibilityAccountAnalyzing: true, feasibilityAccountStageIndex: 0 },
        ])
        startFeasibilityAccountAnalysisFlow({ analyzingId, mode: 'confirm', accountName: normalizeFeasibilityAccountName(text) })
      }
      return
    }

    if (isAfterFeasibilityAccountConfirm && isYesIntent(text)) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `agent-${Date.now()}`, role: 'agent', text: 'I can assist you with your request. You could upload the document directly. Would you like to proceed with uploading the document or any other type of document?', isFeasibilityUploadQuestion: true },
      ])
      return
    }

    if (isAfterFeasibilityUploadQuestion && isYesIntent(text)) {
      feasibilityLocationsFormSubmittedRef.current = false
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `feasibility-upload-form-${Date.now()}`, role: 'agent', text: 'Upload file', showUploadForm: true, uploadFormType: 'feasibilityLocations' },
      ])
      return
    }

    if (isAfterFeasibilityDocumentTypeQuestion && (isPODocumentIntent(text) || isLocationsWithoutPOIntent(text) || /without\s+po\s+document/i.test(text))) {
      const analyzingId = `feasibility-quote-choice-analyzing-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        {
          id: analyzingId,
          role: 'agent',
          isFeasibilityQuoteChoiceAnalyzing: true,
          feasibilityQuoteChoiceStageIndex: 0,
        },
      ])
      startFeasibilityQuoteChoiceAnalysisFlow(analyzingId, feasibilityAccountFlowRef.current.accountName || 'SBI Bank')
      return
    }

    if (isAfterFeasibilityQuoteChoiceQuestion && isFeasibilityOnlyQuoteChoiceIntent(text)) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        {
          id: `agent-${Date.now()}`,
          role: 'agent',
          text: 'Please specify the name for the Feasibility request',
          isFeasibilityRequestNameQuestion: true,
        },
      ])
      return
    }

    if (isAfterFeasibilityRequestNameQuestion && text.trim()) {
      const analyzingId = `feasibility-extraction-analyzing-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: analyzingId, role: 'agent', isFeasibilityExtractionAnalyzing: true, feasibilityExtractionStageIndex: 0 },
      ])
      startFeasibilityExtractionAnalysisFlow(analyzingId)
      return
    }

    if (isAfterLocationsNewQuoteAccountMatches) {
      const userLower = text.toLowerCase().trim()
      const options = lastMsg.locationsNewQuoteAccountMatches || []
      const matchedOption = options.find((option) => userLower.includes(option.accountName.toLowerCase()))
      if (matchedOption || isAccountSelectionIntent(text)) {
        const selected = matchedOption || options[0]
        if (selected?.accountName) locationsNewQuoteFlowRef.current.accountName = selected.accountName
        if (selected?.accountNumber) locationsNewQuoteFlowRef.current.accountNumber = selected.accountNumber
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: 'user', text },
          { id: `agent-${Date.now()}`, role: 'agent', text: 'I can assist you with your request. You could upload the document directly here. Would you like to proceed with uploading the document here or any other type of document?', isLocationsNewQuoteUploadQuestion: true },
        ])
      } else {
        const analyzingId = `locations-new-quote-account-confirm-analyzing-${Date.now()}`
        const accountName = normalizeLocationsNewQuoteAccountName(text)
        locationsNewQuoteFlowRef.current.accountName = accountName
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: 'user', text },
          { id: analyzingId, role: 'agent', isLocationsNewQuoteAnalyzing: true, locationsNewQuoteStageIndex: 0 },
        ])
        startLocationsNewQuoteAnalysisFlow({ analyzingId, mode: 'accountConfirm', accountName })
      }
      return
    }

    if (isAfterLocationsNewQuoteAccountConfirm && isYesIntent(text)) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `agent-${Date.now()}`, role: 'agent', text: 'I can assist you with your request. You could upload the document directly here. Would you like to proceed with uploading the document here or any other type of document?', isLocationsNewQuoteUploadQuestion: true },
      ])
      return
    }

    if (isAfterLocationsNewQuoteUploadQuestion && isYesIntent(text)) {
      locationsNewQuoteUploadFormSubmittedRef.current = false
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `locations-new-quote-upload-form-${Date.now()}`, role: 'agent', text: 'Upload file', showUploadForm: true, uploadFormType: 'locationsNewQuote' },
      ])
      return
    }

    if (isAfterLocationsNewQuoteDocumentTypeQuestion && (isPODocumentIntent(text) || isLocationsWithoutPOIntent(text) || /without\s+po\s+document/i.test(text) || /just\s+locations?/i.test(text))) {
      const accountName = locationsNewQuoteFlowRef.current.accountName || 'HDFC Bank'
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        {
          id: `agent-${Date.now()}`,
          role: 'agent',
          text: buildQuoteChoicePrompt(accountName),
          isLocationsNewQuoteQuoteChoiceQuestion: true,
        },
      ])
      return
    }

    if (isAfterLocationsNewQuoteChoiceQuestion && isNewQuoteIntent(text)) {
      const analyzingId = `locations-new-quote-opportunities-analyzing-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: analyzingId, role: 'agent', isLocationsNewQuoteAnalyzing: true, locationsNewQuoteStageIndex: 0 },
      ])
      startLocationsNewQuoteAnalysisFlow({ analyzingId, mode: 'opportunities', accountName: locationsNewQuoteFlowRef.current.accountName })
      return
    }

    if (isAfterLocationsNewQuoteOpportunities && isCreateNewOpportunityOptionIntent(text)) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `agent-${Date.now()}`, role: 'agent', text: 'Please provide the Opportunity Name for the new Opportunity that needs to be created.', isLocationsNewQuoteOpportunityNameQuestion: true },
      ])
      return
    }

    if (isAfterLocationsNewQuoteOpportunityNameQuestion && text.trim()) {
      const providedOpportunityName = text.trim()
      locationsNewQuoteFlowRef.current.opportunityName = providedOpportunityName
      const analyzingId = `locations-new-quote-prefill-opportunity-analyzing-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: analyzingId, role: 'agent', isLocationsNewQuoteAnalyzing: true, locationsNewQuoteStageIndex: 0 },
      ])
      startLocationsNewQuoteAnalysisFlow({
        analyzingId,
        mode: 'prefillOpportunity',
        accountName: locationsNewQuoteFlowRef.current.accountName,
        opportunityName: providedOpportunityName,
      })
      return
    }

    if (isAfterLocationsNewQuoteOpportunities) {
      const opportunities = lastMsg.locationsNewQuoteOpportunities || []
      const userLower = text.toLowerCase()
      const userDigits = userLower.replace(/\D/g, '')
      const selectedOpportunity = opportunities.find((op) =>
        userLower.includes(op.opportunityName.toLowerCase())
          || (op.opportunityId && userLower.includes(op.opportunityId.toLowerCase()))
          || (op.opportunityAmount && userDigits && userDigits === String(op.opportunityAmount))
      )
      if (selectedOpportunity) {
        locationsNewQuoteFlowRef.current.opportunityName = selectedOpportunity.opportunityName
        setMessages((prev) => [
          ...prev,
          { id: `user-${Date.now()}`, role: 'user', text },
          { id: `agent-${Date.now()}`, role: 'agent', text: `Selected ${selectedOpportunity.opportunityName}. Please confirm if you would like to go ahead with this opportunity.`, isLocationsNewQuoteOpportunityPrefillQuestion: true },
        ])
        return
      }
    }

    if (isAfterLocationsNewQuoteOpportunityPrefill && (isYesIntent(text) || /\bgo\s+ahead\b/i.test(text))) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        { id: `agent-${Date.now()}`, role: 'agent', text: NEW_QUOTE_LOCATIONS_QUOTE_NAME_PROMPT, isLocationsNewQuoteQuoteNameQuestion: true },
      ])
      return
    }

    if (isAfterLocationsNewQuoteQuoteNameQuestion && text.trim()) {
      const providedQuoteName = extractQuoteNameFromText(text) || text.trim().replace(/[.]+$/, '')
      locationsNewQuoteFlowRef.current.quoteName = providedQuoteName
      const accountName = locationsNewQuoteFlowRef.current.accountName || 'HDFC Bank'
      const linkText = `Extracted Information for New Quote for ${accountName} Account`
      const feasibilityRequestId = 'FR-0002'
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
        {
          id: `agent-${Date.now()}`,
          role: 'agent',
          text: NEW_QUOTE_LOCATIONS_EXTRACT_RESPONSE_ID_PREFIX,
          showNewQuoteLocationsExtractionLink: true,
          newQuoteLocationsExtractionLinkText: linkText,
          newQuoteLocationsAccountName: accountName,
          newQuoteLocationsFeasibilityRequestId: feasibilityRequestId,
        },
      ])
      setTimeout(() => onNewQuoteLocationsExtractionStatusShown?.(accountName), 1000)
      return
    }

    const userMsg = { id: `user-${Date.now()}`, role: 'user', text }
    if (technicalAttributesPageActive) {
      const field = getOldValueFieldFromIntent(text)
      if (field) {
        onTechnicalAttributesToggleCompareWithAsset?.()
        const result = getOldValueForField(field)
        const agentText = result ? `The old value of "${result.label}" is ${result.value}.` : `I couldn't find an old value for "${field}".`
        setMessages((prev) => [...prev, userMsg, { id: `agent-${Date.now()}`, role: 'agent', text: agentText }])
        return
      }
      if (isOldValuesToggleIntent(text)) {
        onTechnicalAttributesToggleCompareWithAsset?.()
        setMessages((prev) => [...prev, userMsg, { id: `agent-${Date.now()}`, role: 'agent', text: 'Compare with Asset has been enabled.' }])
        return
      }
    }
    if (macdQuoteActive && isMacdUpdateNewAttributesOrMediaIntent(text)) {
      const analyzingId = `macd-upgrade-update-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isMacdUpgradeUpdateAnalyzing: true, macdUpgradeUpdateStageIndex: 0, macdUpgradeUpdateIntentText: text }])
      startMacdUpgradeUpdateAnalysisFlow(analyzingId, text)
      return
    }
    if (enrichQuoteFlowActive && isTechnicalAttributesChangeIntent(text)) {
      const analyzingId = `technical-attributes-update-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isTechnicalAttributesUpdateAnalyzing: true, technicalAttributesUpdateStageIndex: 0, technicalAttributesUpdateIntentText: text }])
      startTechnicalAttributesUpdateAnalysisFlow(analyzingId, text)
      return
    }
    let agentMsg
    if (isPOChangeUpdateIntent(text)) {
      const analyzingId = `po-change-update-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isPOChangeUpdateAnalyzing: true, poChangeUpdateStageIndex: 0, enrichQuoteUpdateIntentText: text }])
      startPOChangeUpdateAnalysisFlow(analyzingId, text)
      return
    }
    if (isTechnicalAttributesChangeIntent(text)) {
      const analyzingId = `technical-attributes-update-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isTechnicalAttributesUpdateAnalyzing: true, technicalAttributesUpdateStageIndex: 0, technicalAttributesUpdateIntentText: text }])
      startTechnicalAttributesUpdateAnalysisFlow(analyzingId, text)
      return
    }
    if (isUpdateOrChangeIntent(text)) {
      const analyzingId = `update-change-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isUpdateChangeAnalyzing: true, updateChangeStageIndex: 0, updateIntentText: text }])
      startUpdateChangeAnalysisFlow(analyzingId, text)
      return
    }
    if (isAddProductsFromExtractedIntent(text)) {
      const analyzingId = `add-products-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isAddProductsAnalyzing: true, addProductsStageIndex: 0 }])
      startAddProductsAnalysisFlow(analyzingId)
      return
    } else if (isVerifyDetailsIntent(text)) {
      const analyzingId = `verify-details-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isVerifyDetailsAnalyzing: true, verifyDetailsStageIndex: 0 }])
      startVerifyDetailsAnalysisFlow(analyzingId)
      return
    } else if (feasibilityRequestsPageActive && isCreateOpportunityAndQuoteIntent(text)) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: `agent-${Date.now()}`, role: 'agent', text: FEASIBILITY_CREATE_OPP_QUOTE_PROMPT, isFeasibilityCreateOppQuoteOpportunityNameQuestion: true },
      ])
      return
    } else if (feasibilityRequestsPageActive && isCheckForFeasibilityIntent(text)) {
      const analyzingId = `feasibility-check-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isFeasibilityCheckAnalyzing: true, feasibilityCheckStageIndex: 0 }])
      startFeasibilityCheckAnalysisFlow(analyzingId)
      return
    } else if (feasibilityRequestsPageActive && isValidateAddressIntent(text)) {
      const analyzingId = `feasibility-validate-address-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isFeasibilityValidateAddressAnalyzing: true, feasibilityValidateAddressStageIndex: 0 }])
      startFeasibilityValidateAddressAnalysisFlow(analyzingId)
      return
    } else if (feasibilityRequestsPageActive && isMatchAllProductsIntent(text)) {
      const analyzingId = `feasibility-matched-products-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isFeasibilityMatchedProductsAnalyzing: true, feasibilityMatchedProductsStageIndex: 0 }])
      startFeasibilityMatchedProductsAnalysisFlow(analyzingId)
      return
    } else if (isMatchLocationsForPremisesIntent(text)) {
      const analyzingId = `feasibility-location-match-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isFeasibilityLocationMatchAnalyzing: true, feasibilityLocationMatchStageIndex: 0 }])
      startFeasibilityLocationMatchAnalysisFlow(analyzingId)
      return
    } else if (isMatchIntent(text)) {
      const analyzingId = `match-products-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isMatchProductsAnalyzing: true, matchProductsStageIndex: 0 }])
      startMatchProductsAnalysisFlow(analyzingId)
      return
    } else if (isFeasibilityIntent(text)) {
      const analyzingId = `feasibility-account-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isFeasibilityAccountAnalyzing: true, feasibilityAccountStageIndex: 0 }])
      startFeasibilityAccountAnalysisFlow({ analyzingId, mode: 'matches' })
      return
    } else if (isUploadLocationsToNewQuoteIntent(text)) {
      const analyzingId = `locations-new-quote-account-analyzing-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isLocationsNewQuoteAnalyzing: true, locationsNewQuoteStageIndex: 0 }])
      startLocationsNewQuoteAnalysisFlow({ analyzingId, mode: 'accountMatches' })
      return
    } else if (isValidateQuoteIntent(text)) {
      agentMsg = { id: `agent-${Date.now()}`, role: 'agent', text: VALIDATE_QUOTE_RESPONSE_PREFIX, showValidatedQuoteLink: true }
    } else if (isDOAIntent(text)) {
      agentMsg = { id: `agent-${Date.now()}`, role: 'agent', text: DOA_RESPONSE }
    } else if (isCreateQuoteForCustomerFlow(text)) {
      const customerName = getCreateQuoteCustomerName(text) || 'the customer'
      const analyzingId = `create-quote-account-${Date.now()}`
      setMessages((prev) => [...prev, userMsg, { id: analyzingId, role: 'agent', isCreateQuoteAccountAnalyzing: true, createQuoteAccountStageIndex: 0 }])
      startCreateQuoteAccountFlow(customerName, analyzingId, false)
      return
    } else if (isCreateQuoteProposalIntent(text)) {
      agentMsg = { id: `agent-${Date.now()}`, role: 'agent', text: CREATE_QUOTE_PROPOSAL_RESPONSE, isCreateQuoteUploadQuestion: true }
    } else if (isPOIntent(text)) {
      agentMsg = { id: `agent-${Date.now()}`, role: 'agent', text: PO_AGENT_RESPONSE, isPOUploadQuestion: true }
    } else {
      agentMsg = { id: `agent-${Date.now()}`, role: 'agent', text: 'I can help with creating quote proposals, matching products, or updating/changing quote values. Try asking something like: "I want to create a quote proposal", "Match all products", or "Update the attributes for SD WAN from managed to co-owned".' }
    }
    setMessages((prev) => [...prev, userMsg, agentMsg])
  }


  const upgradeAttributesAnalyzingIntervalRef = useRef(null)

  const handleUpgradeAttributesUploadSubmit = () => {
    const file = uploadFormFile ?? uploadFormFileInputRef.current?.files?.[0]
    if (!file) return
    upgradeAttributesFormSubmittedRef.current = true
    const fileName = file.name || 'document'
    setUploadFormFile(null)
    if (uploadFormFileInputRef.current) uploadFormFileInputRef.current.value = ''
    const analyzingId = `upgrade-attributes-analyzing-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: `user-upload-${Date.now()}`, role: 'user', text: `Uploading document (${fileName})` },
      { id: analyzingId, role: 'agent', isUpgradeAttributesAnalyzing: true, upgradeAttributesStageIndex: 0 },
      ])
      let step = 0
    upgradeAttributesAnalyzingIntervalRef.current = setInterval(() => {
        step += 1
      if (step >= 4) {
        if (upgradeAttributesAnalyzingIntervalRef.current) clearInterval(upgradeAttributesAnalyzingIntervalRef.current)
        upgradeAttributesAnalyzingIntervalRef.current = null
          setMessages((prev) =>
            prev.map((m) =>
            m.id === analyzingId ? { ...m, id: m.id, role: 'agent', text: UPGRADE_ATTRIBUTES_RESPONSE_PREFIX, showUpgradeQuoteLink: true, isUpgradeAttributesAnalyzing: false } : m
          )
        )
        onUpgradeQuoteCreated?.()
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, upgradeAttributesStageIndex: step } : m)))
      scrollToBottom()
      }, 1500)
  }

  const handlePOUploadSubmit = () => {
    const file = uploadFormFile ?? uploadFormFileInputRef.current?.files?.[0]
    if (!file) return
    poFormSubmittedRef.current = true
    setUploadFormFile(null)
    if (uploadFormFileInputRef.current) uploadFormFileInputRef.current.value = ''
    const fileName = file.name || 'document'
    setMessages((prev) => [
      ...prev,
      { id: `user-upload-${Date.now()}`, role: 'user', text: `Uploaded the document (${fileName})` },
      { id: `agent-thanks-${Date.now()}`, role: 'agent', text: PO_THANK_YOU_TEXT, showQuote2Link: true },
    ])
    setTimeout(() => onQuote2POUpdated?.(), 0)
  }

  const quoteProposalAnalyzingIntervalRef = useRef(null)

  const handleQuoteProposalUploadSubmit = () => {
    console.log('[Agentforce Upload] Submit clicked (Quote Proposal)')
    const file = uploadFormFile ?? uploadFormFileInputRef.current?.files?.[0]
    console.log('[Agentforce Upload] Quote Proposal – file from state:', !!uploadFormFile, 'file from ref:', !!uploadFormFileInputRef.current?.files?.[0], 'resolved file:', file?.name ?? null)
    if (!file) {
      console.log('[Agentforce Upload] Quote Proposal – no file, returning early')
      return
    }
    quoteProposalFormSubmittedRef.current = true
    const fileName = file.name || 'document'
    console.log('[Agentforce Upload] Quote Proposal – clearing form and starting analysis flow, fileName:', fileName)
    setUploadFormFile(null)
    if (uploadFormFileInputRef.current) uploadFormFileInputRef.current.value = ''
    const analyzingId = `quote-proposal-analyzing-${Date.now()}`
      setMessages((prev) => [
        ...prev,
      { id: `user-upload-${Date.now()}`, role: 'user', text: `Updated the document (${fileName})` },
      { id: analyzingId, role: 'agent', isAnalyzing: true, analyzingStageIndex: 0 },
      ])
    console.log('[Agentforce Upload] Quote Proposal – setMessages called (analyzing started), analyzingId:', analyzingId)
      let step = 0
    quoteProposalAnalyzingIntervalRef.current = setInterval(() => {
        step += 1
      console.log('[Agentforce Upload] Quote Proposal – analysis step:', step)
      if (step >= 4) {
        if (quoteProposalAnalyzingIntervalRef.current) clearInterval(quoteProposalAnalyzingIntervalRef.current)
        quoteProposalAnalyzingIntervalRef.current = null
          setMessages((prev) =>
            prev.map((m) =>
            m.id === analyzingId ? { id: m.id, role: 'agent', text: QUOTE_PROPOSAL_PROCESSING_TEXT, showQuoteProposalStatusLink: true } : m
          )
        )
        onQuoteProposalCreated?.()
        console.log('[Agentforce Upload] Quote Proposal – analysis complete, showQuoteProposalStatusLink set')
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, analyzingStageIndex: step } : m)))
    }, 2000)
  }

  const handleFeasibilityLocationsUploadSubmit = () => {
    const file = uploadFormFile ?? uploadFormFileInputRef.current?.files?.[0]
    if (!file) return
    feasibilityLocationsFormSubmittedRef.current = true
    const fileName = file.name || 'document'
    setUploadFormFile(null)
    if (uploadFormFileInputRef.current) uploadFormFileInputRef.current.value = ''
    const analyzingId = `feasibility-upload-analyzing-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: `user-upload-${Date.now()}`, role: 'user', text: `Uploaded the document (${fileName})` },
      { id: analyzingId, role: 'agent', isFeasibilityUploadAnalyzing: true, feasibilityUploadStageIndex: 0 },
    ])
    let step = 0
    if (feasibilityUploadAnalysisIntervalRef.current) {
      clearInterval(feasibilityUploadAnalysisIntervalRef.current)
      feasibilityUploadAnalysisIntervalRef.current = null
    }
    feasibilityUploadAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (feasibilityUploadAnalysisIntervalRef.current) {
          clearInterval(feasibilityUploadAnalysisIntervalRef.current)
          feasibilityUploadAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: `Is the uploaded file a
1. PO document
2. Locations without PO document`,
                isFeasibilityUploadAnalyzing: false,
                isFeasibilityDocumentTypeQuestion: true,
              }
            : m
        )))
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, feasibilityUploadStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  const handleLocationsNewQuoteUploadSubmit = () => {
    const file = uploadFormFile ?? uploadFormFileInputRef.current?.files?.[0]
    if (!file) return
    locationsNewQuoteUploadFormSubmittedRef.current = true
    const fileName = file.name || 'document'
    setUploadFormFile(null)
    if (uploadFormFileInputRef.current) uploadFormFileInputRef.current.value = ''
    const analyzingId = `locations-new-quote-upload-analyzing-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: `user-upload-${Date.now()}`, role: 'user', text: `Uploaded the document (${fileName})` },
      { id: analyzingId, role: 'agent', isLocationsNewQuoteUploadAnalyzing: true, locationsNewQuoteUploadStageIndex: 0 },
    ])
    let step = 0
    if (locationsNewQuoteUploadAnalysisIntervalRef.current) {
      clearInterval(locationsNewQuoteUploadAnalysisIntervalRef.current)
      locationsNewQuoteUploadAnalysisIntervalRef.current = null
    }
    locationsNewQuoteUploadAnalysisIntervalRef.current = setInterval(() => {
      step += 1
      if (step >= 4) {
        if (locationsNewQuoteUploadAnalysisIntervalRef.current) {
          clearInterval(locationsNewQuoteUploadAnalysisIntervalRef.current)
          locationsNewQuoteUploadAnalysisIntervalRef.current = null
        }
        setMessages((prev) => prev.map((m) => (
          m.id === analyzingId
            ? {
                ...m,
                role: 'agent',
                text: `Is the uploaded file a
1. PO document
2. Locations without PO document`,
                isLocationsNewQuoteUploadAnalyzing: false,
                isLocationsNewQuoteDocumentTypeQuestion: true,
              }
            : m
        )))
        return
      }
      setMessages((prev) => prev.map((m) => (m.id === analyzingId ? { ...m, locationsNewQuoteUploadStageIndex: step } : m)))
      scrollToBottom()
    }, 1200)
  }

  useEffect(() => {
    return () => {
      if (quoteProposalAnalyzingIntervalRef.current) clearInterval(quoteProposalAnalyzingIntervalRef.current)
      if (upgradeAttributesAnalyzingIntervalRef.current) clearInterval(upgradeAttributesAnalyzingIntervalRef.current)
      if (poChangeUpdateAnalyzingIntervalRef.current) clearInterval(poChangeUpdateAnalyzingIntervalRef.current)
      if (technicalAttributesUpdateAnalyzingIntervalRef.current) clearInterval(technicalAttributesUpdateAnalyzingIntervalRef.current)
      if (macdUpgradeUpdateAnalyzingIntervalRef.current) clearInterval(macdUpgradeUpdateAnalyzingIntervalRef.current)
      if (feasibilityUploadAnalysisIntervalRef.current) clearInterval(feasibilityUploadAnalysisIntervalRef.current)
      if (feasibilityQuoteChoiceAnalysisIntervalRef.current) clearInterval(feasibilityQuoteChoiceAnalysisIntervalRef.current)
      if (feasibilityExtractionAnalysisIntervalRef.current) clearInterval(feasibilityExtractionAnalysisIntervalRef.current)
      if (feasibilityCheckAnalysisIntervalRef.current) clearInterval(feasibilityCheckAnalysisIntervalRef.current)
      if (feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current) clearInterval(feasibilityCreateOppQuotePrefillAnalysisIntervalRef.current)
      if (feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current) clearInterval(feasibilityCreateOppQuoteExtractionAnalysisIntervalRef.current)
      if (feasibilityValidateAddressAnalysisIntervalRef.current) clearInterval(feasibilityValidateAddressAnalysisIntervalRef.current)
      if (locationsNewQuoteUploadAnalysisIntervalRef.current) clearInterval(locationsNewQuoteUploadAnalysisIntervalRef.current)
      if (feasibilityLocationMatchAnalysisIntervalRef.current) clearInterval(feasibilityLocationMatchAnalysisIntervalRef.current)
      if (feasibilityMatchedProductsAnalysisIntervalRef.current) clearInterval(feasibilityMatchedProductsAnalysisIntervalRef.current)
    }
  }, [])

  // Fallback: if a quote-proposal analyzing message is stuck at last stage (e.g. interval was cleared on unmount), replace it with final response after delay
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isAnalyzing === true && (m.analyzingStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isAnalyzing ? { id: m.id, role: 'agent', text: QUOTE_PROPOSAL_PROCESSING_TEXT, showQuoteProposalStatusLink: true } : m
        )
      )
      onQuoteProposalCreated?.()
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onQuoteProposalCreated])

  // Fallback: if match-products analyzing is stuck at last stage, replace with final message and clear overlay
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isMatchProductsAnalyzing === true && (m.matchProductsStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isMatchProductsAnalyzing
            ? { ...m, text: MATCH_PRODUCTS_RESPONSE_PREFIX, showMatchProductsLink: true, isMatchProductsAnalyzing: false }
            : m
        )
      )
      onMatchProductsStatusShown?.()
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onMatchProductsStatusShown])

  // Fallback: if verify-details analyzing is stuck at last stage, replace with final message and clear overlay
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isVerifyDetailsAnalyzing === true && (m.verifyDetailsStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isVerifyDetailsAnalyzing
            ? { ...m, text: VERIFY_DETAILS_RESPONSE_PREFIX, showVerifiedDetailsLink: true, isVerifyDetailsAnalyzing: false }
            : m
        )
      )
      onVerifyDetailsStatusShown?.()
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onVerifyDetailsStatusShown])

  // Fallback: if add-products analyzing is stuck at last stage, replace with final message (overlay stays until user clicks link)
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isAddProductsAnalyzing === true && (m.addProductsStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isAddProductsAnalyzing
            ? { ...m, text: ADD_PRODUCTS_RESPONSE_PREFIX, showAddedProductsFromExtractedLink: true, isAddProductsAnalyzing: false }
            : m
        )
      )
      onAddProductsStatusShown?.()
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onAddProductsStatusShown])

  // Fallback: if PO change/update analyzing is stuck at last stage, replace with final message and link
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isPOChangeUpdateAnalyzing === true && (m.poChangeUpdateStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const intentText = stuck.enrichQuoteUpdateIntentText
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isPOChangeUpdateAnalyzing
            ? { ...m, text: PO_CHANGE_UPDATE_RESPONSE_PREFIX, showEnrichQuoteUpdateLink: true, enrichQuoteUpdateIntentText: intentText, isPOChangeUpdateAnalyzing: false }
            : m
        )
      )
      onEnrichQuoteUpdateCreated?.(intentText)
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onEnrichQuoteUpdateCreated])

  // Fallback: if MACD upgrade update analyzing is stuck at last stage
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isMacdUpgradeUpdateAnalyzing === true && (m.macdUpgradeUpdateStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const intentText = stuck.macdUpgradeUpdateIntentText
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isMacdUpgradeUpdateAnalyzing
            ? { ...m, text: MACD_UPGRADE_UPDATE_RESPONSE_PREFIX, showMacdUpgradeUpdateLink: true, macdUpgradeUpdateIntentText: intentText, isMacdUpgradeUpdateAnalyzing: false }
            : m
        )
      )
      onMacdUpgradeUpdateCreated?.(intentText)
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onMacdUpgradeUpdateCreated])

  // Fallback: if upgrade-attributes analyzing is stuck at last stage ("Finishing Up"), replace with final message and link
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isUpgradeAttributesAnalyzing === true && (m.upgradeAttributesStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isUpgradeAttributesAnalyzing
            ? { ...m, text: UPGRADE_ATTRIBUTES_RESPONSE_PREFIX, showUpgradeQuoteLink: true, isUpgradeAttributesAnalyzing: false }
            : m
        )
      )
      onUpgradeQuoteCreated?.()
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onUpgradeQuoteCreated])

  // Fallback: if upgrade-attributes analyzing is stuck at last stage ("Finishing Up"), replace with final message and link
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isUpgradeAttributesAnalyzing === true && (m.upgradeAttributesStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isUpgradeAttributesAnalyzing
            ? { ...m, text: UPGRADE_ATTRIBUTES_RESPONSE_PREFIX, showUpgradeQuoteLink: true, isUpgradeAttributesAnalyzing: false }
            : m
        )
      )
      onUpgradeQuoteCreated?.()
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onUpgradeQuoteCreated])

  // Fallback: if upgrade-attributes analyzing is stuck at last stage ("Finishing Up"), replace with final message and link
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isUpgradeAttributesAnalyzing === true && (m.upgradeAttributesStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isUpgradeAttributesAnalyzing
            ? { ...m, text: UPGRADE_ATTRIBUTES_RESPONSE_PREFIX, showUpgradeQuoteLink: true, isUpgradeAttributesAnalyzing: false }
            : m
        )
      )
      onUpgradeQuoteCreated?.()
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onUpgradeQuoteCreated])

  // Fallback: if upgrade-attributes analyzing is stuck at last stage ("Finishing Up"), replace with final message and link
  useEffect(() => {
    const stuck = effectiveMessages.find((m) => m.role === 'agent' && m.isUpgradeAttributesAnalyzing === true && (m.upgradeAttributesStageIndex ?? 0) === 3)
    if (!stuck) return
    const id = stuck.id
    const t = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.isUpgradeAttributesAnalyzing
            ? { ...m, text: UPGRADE_ATTRIBUTES_RESPONSE_PREFIX, showUpgradeQuoteLink: true, isUpgradeAttributesAnalyzing: false }
            : m
        )
      )
      onUpgradeQuoteCreated?.()
    }, 2500)
    return () => clearTimeout(t)
  }, [effectiveMessages, onUpgradeQuoteCreated])

  const handleResizeMouseDown = (e) => {
    if (isPinned) return
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { startX: e.clientX, startWidth: panelWidth }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMouseMove = (e) => {
      const { startX, startWidth } = dragRef.current
      const delta = startX - e.clientX
      const newWidth = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, startWidth + delta))
      setPanelWidth(newWidth)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  if (!open) return null

  return (
      <aside
      className="fixed top-[7rem] right-0 bottom-0 bg-white border-l border-gray-200 shadow-xl z-[60] flex flex-col min-h-0 overflow-hidden"
        style={{ width: panelWidth, maxWidth: '90vw' }}
        aria-label="Agentforce panel"
      >
        <div
          role="button"
          tabIndex={isPinned ? -1 : 0}
          onMouseDown={handleResizeMouseDown}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault() }}
          className={`absolute left-0 top-1/2 -translate-y-1/2 py-3 px-1 flex items-center justify-center focus:outline-none focus:ring-0 z-[60] ${isPinned ? 'cursor-default opacity-60' : 'cursor-col-resize'}`}
          aria-label={isPinned ? 'Panel width locked' : 'Resize panel'}
        >
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 12L18 4v16L6 12z" />
          </svg>
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
          <span className={`text-base font-bold ${showSalesAssistantStyle ? 'text-airtel-red' : 'text-[#032d60]'}`}>
            {showSalesAssistantStyle ? 'Sales Assistant' : 'Agentforce'}
          </span>
          <button type="button" className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 focus:outline-none shrink-0" aria-label="Information">
              <span className="text-xs font-bold">i</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
          <button type="button" onClick={() => setHasNotification(false)} className="relative p-1.5 rounded-full text-[#032d60] hover:bg-grey-bg focus:outline-none" aria-label="Chat history">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
              <circle cx="7.5" cy="10" r="1" /><circle cx="12" cy="10" r="1" /><circle cx="16.5" cy="10" r="1" />
              </svg>
            {hasNotification && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true" />}
            </button>
          <button type="button" onClick={() => setIsPinned((p) => !p)} className={`p-1.5 rounded-full focus:outline-none ${isPinned ? 'bg-blue-100 text-blue-600' : 'text-[#032d60] hover:bg-grey-bg'}`} aria-label={isPinned ? 'Unpin panel width' : 'Pin panel width'}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
            </button>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-[#032d60] hover:bg-grey-bg focus:outline-none" aria-label="Close panel">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {!effectiveIsConversationView ? (
        <div className="flex-1 min-h-0 overflow-y-scroll pt-8 px-4 pb-4 flex flex-col items-center bg-white">
          <img src={agentforceIllustration} alt="" className="w-40 h-40 rounded-full object-cover object-center shrink-0" />
          <h2 className="text-lg font-bold text-[#032d60] mt-4">Let&apos;s chat!</h2>
          <p className="text-sm text-gray-700 mt-2 text-center max-w-[85%]">
            {showSalesAssistantStyle ? <>Hello! I&apos;m your Airtel B2B Sales Assistant. 👋</> : <>Hi, I&apos;m Agentforce! What can I help you with?</>}
          </p>
          {showSalesAssistantStyle && (
            <p className="text-sm text-gray-600 mt-1 text-center max-w-[85%]">I help with sales quotes, proposals, opportunities/ quote updates and CRM queries. Start by sharing a customer account name/number or upload a file</p>
          )}
          <button type="button" onClick={startConversation} className="mt-6 px-6 py-3 rounded-full bg-airtel-red text-white text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-airtel-red/30">
            Get Started
              </button>
          </div>
        ) : (
        <div
          ref={conversationScrollRef}
          role="region"
          aria-label="Conversation messages"
          className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 flex flex-col justify-end gap-4 bg-white"
          onWheel={(e) => {
            const el = conversationScrollRef.current
            if (!el) return
            const { scrollTop, scrollHeight, clientHeight } = el
            const canScrollUp = scrollTop > 0
            const canScrollDown = scrollTop < scrollHeight - clientHeight - 1
            const scrollingUp = e.deltaY < 0
            const scrollingDown = e.deltaY > 0
            if ((scrollingUp && canScrollUp) || (scrollingDown && canScrollDown)) {
              e.preventDefault()
              e.stopPropagation()
              el.scrollTop += e.deltaY
            }
          }}
        >
          {effectiveMessages.map((msg, msgIdx) => {
              if (msg.showUploadForm && msg.uploadFormType === 'po' && poFormSubmittedRef.current) return null
              const laterMessages = effectiveMessages.slice(msgIdx + 1)
              const quoteProposalAlreadySubmitted = msg.uploadFormType === 'quoteProposal' && laterMessages.some((m) => m.showQuoteProposalStatusLink)
              const upgradeAttributesAlreadySubmitted = msg.uploadFormType === 'upgradeAttributes' && laterMessages.some((m) => m.showUpgradeQuoteLink)
              const hideUploadFormBecauseSubmitted = msg.showUploadForm && (quoteProposalAlreadySubmitted || upgradeAttributesAlreadySubmitted)
              return (
                <div key={msg.id} className="flex gap-3 items-start">
                  {msg.role === 'agent' ? (
                    <>
                      <img src={agentforceIcon} alt="" className="w-9 h-9 rounded-full object-cover object-center shrink-0" />
                      <div className="flex-1 min-w-0">
                      {msg.showQuote2Link ? (
                          <p className="text-sm text-gray-800 whitespace-pre-line">
                          Thank you for uploading the Purchase Order document. Click{' '}
                          {onNavigateToQuote2 ? (
                            <button type="button" onClick={onNavigateToQuote2} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                              here
                            </button>
                          ) : (
                            <span>here</span>
                          )}
                          {' '}to see the updated file.
                          </p>
                      ) : msg.showQuoteProposalStatusLink && onNavigateToNewQuoteProposal ? (
                          <p className="text-sm text-gray-800 whitespace-pre-line">
                          Your file is being processed, you will be notified once done, or you can check the status{' '}
                          <button type="button" onClick={onNavigateToNewQuoteProposal} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                              here
                            </button>
                          .
                        </p>
                      ) : msg.isAddProductsAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {ADD_PRODUCTS_ANALYSIS_STAGES[msg.addProductsStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showAddedProductsFromExtractedLink && onNavigateToAddedProductsFromExtracted ? (
                          <p className="text-sm text-gray-800 whitespace-pre-line">
                          {ADD_PRODUCTS_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToAddedProductsFromExtracted} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {ADD_PRODUCTS_LINK_TEXT}
                            </button>
                        </p>
                      ) : msg.isVerifyDetailsAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {VERIFY_DETAILS_ANALYSIS_STAGES[msg.verifyDetailsStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showVerifiedDetailsLink && onNavigateToVerifiedDetails ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {VERIFY_DETAILS_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToVerifiedDetails} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {VERIFY_DETAILS_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.isMatchProductsAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {MATCH_PRODUCTS_ANALYSIS_STAGES[msg.matchProductsStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showMatchProductsLink && onNavigateToMatchedProducts ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {MATCH_PRODUCTS_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToMatchedProducts} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {MATCH_PRODUCTS_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.showFeasibilityExtractionLink && onNavigateToFeasibilityExtraction ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {FEASIBILITY_EXTRACT_RESPONSE_PREFIX}
                          <strong>{FEASIBILITY_EXTRACT_REQUEST_ID_TEXT}</strong>
                          {FEASIBILITY_EXTRACT_RESPONSE_SUFFIX}
                          <button type="button" onClick={onNavigateToFeasibilityExtraction} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {FEASIBILITY_EXTRACT_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.showFeasibilityCheckLink && onNavigateToFeasibilityCheck ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {FEASIBILITY_CHECK_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToFeasibilityCheck} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {FEASIBILITY_CHECK_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.showFeasibilitySbiQuoteLink && onNavigateToSbiQuote ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {msg.text || FEASIBILITY_SBI_QUOTE_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToSbiQuote} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {FEASIBILITY_SBI_QUOTE_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.showFeasibilityValidateAddressLink && onNavigateToFeasibilityValidateAddress ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {FEASIBILITY_VALIDATE_ADDRESS_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToFeasibilityValidateAddress} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {FEASIBILITY_VALIDATE_ADDRESS_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.showFeasibilityMatchedProductsLink && onNavigateToFeasibilityMatchedProducts ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {FEASIBILITY_MATCHED_PRODUCTS_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToFeasibilityMatchedProducts} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {FEASIBILITY_MATCHED_PRODUCTS_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.showFeasibilityLocationMatchLink && onNavigateToFeasibilityLocationMatch ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {FEASIBILITY_LOCATION_MATCH_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToFeasibilityLocationMatch} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {FEASIBILITY_LOCATION_MATCH_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.showNewQuoteLocationsExtractionLink && onNavigateToNewQuoteLocationsExtraction ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {NEW_QUOTE_LOCATIONS_EXTRACT_RESPONSE_ID_PREFIX}
                          <strong>{`Feasibility Request ID - ${msg.newQuoteLocationsFeasibilityRequestId || 'FR-0002'}`}</strong>
                          {NEW_QUOTE_LOCATIONS_EXTRACT_RESPONSE_ID_SUFFIX}
                          <button type="button" onClick={onNavigateToNewQuoteLocationsExtraction} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {msg.newQuoteLocationsExtractionLinkText || 'Extracted Information for HDFC Bank account'}
                          </button>
                        </p>
                      ) : msg.showFeasibilityStatusLink && onNavigateToFeasibilityProposal ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {FEASIBILITY_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToFeasibilityProposal} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {FEASIBILITY_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.isFeasibilityUploadAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityUploadStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isFeasibilityQuoteChoiceAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityQuoteChoiceStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isFeasibilityCheckAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityCheckStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isFeasibilityCreateOppQuotePrefillAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityCreateOppQuotePrefillStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isFeasibilityCreateOppQuoteExtractionAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityCreateOppQuoteExtractionStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isFeasibilityValidateAddressAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityValidateAddressStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isFeasibilityMatchedProductsAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityMatchedProductsStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isFeasibilityLocationMatchAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityLocationMatchStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isFeasibilityExtractionAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityExtractionStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isFeasibilityAccountAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.feasibilityAccountStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isLocationsNewQuoteAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.locationsNewQuoteStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.isLocationsNewQuoteUploadAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {FEASIBILITY_LOCATION_ANALYSIS_STAGES[msg.locationsNewQuoteUploadStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showFeasibilityAccountConfirmation && msg.feasibilityAccountConfirmation ? (
                        <div className="text-sm text-gray-800 space-y-1">
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <p><span className="font-semibold">Account Name</span> : {msg.feasibilityAccountConfirmation.accountName}</p>
                          <p><span className="font-semibold">Account Number</span> : <a href="#" className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:underline">{msg.feasibilityAccountConfirmation.accountNumber}</a></p>
                        </div>
                      ) : msg.showFeasibilityAccountMatches && msg.feasibilityAccountMatches ? (
                        <div className="text-sm text-gray-800 space-y-2">
                          <p className="whitespace-pre-line">{msg.text}</p>
                          {msg.feasibilityAccountMatches.map((option, idx) => (
                            <div key={`${option.accountNumber}-${idx}`} className="space-y-1 border-t border-gray-100 pt-2">
                              <p><span className="font-semibold">{idx + 1}. Account Name</span> : {option.accountName}</p>
                              <p><span className="font-semibold">Account Number</span> : <a href="#" className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:underline">{option.accountNumber}</a></p>
                              <p><span className="font-semibold">Score</span> : {option.score}</p>
                              <p><span className="font-semibold">Ranking Reason</span> : {option.rankingReason}</p>
                            </div>
                          ))}
                        </div>
                      ) : msg.showFeasibilityCreateOppQuotePrefill && msg.feasibilityCreateOppQuotePrefill ? (
                        <div className="text-sm text-gray-800 space-y-1">
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <ul className="list-disc pl-5 space-y-0.5">
                            <li><span className="font-semibold">Opportunity Name</span> : {msg.feasibilityCreateOppQuotePrefill.opportunityName}</li>
                            <li><span className="font-semibold">BSG</span> : {msg.feasibilityCreateOppQuotePrefill.bsg}</li>
                            <li><span className="font-semibold">KDM</span> : {msg.feasibilityCreateOppQuotePrefill.kdm}</li>
                            <li><span className="font-semibold">Stage</span> : {msg.feasibilityCreateOppQuotePrefill.stage}</li>
                            <li><span className="font-semibold">Opportunity Type</span> : {msg.feasibilityCreateOppQuotePrefill.opportunityType}</li>
                            <li><span className="font-semibold">Expected close Date</span> : {msg.feasibilityCreateOppQuotePrefill.expectedCloseDate}</li>
                            <li><span className="font-semibold">Month Projection</span> : {msg.feasibilityCreateOppQuotePrefill.monthProjection}</li>
                          </ul>
                        </div>
                      ) : msg.showLocationsNewQuoteAccountConfirmation && msg.locationsNewQuoteAccountConfirmation ? (
                        <div className="text-sm text-gray-800 space-y-1">
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <p><span className="font-semibold">Account Name</span> : {msg.locationsNewQuoteAccountConfirmation.accountName}</p>
                          <p><span className="font-semibold">Account Number</span> : <a href="#" className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:underline">{msg.locationsNewQuoteAccountConfirmation.accountNumber}</a></p>
                        </div>
                      ) : msg.showLocationsNewQuoteAccountMatches && msg.locationsNewQuoteAccountMatches ? (
                        <div className="text-sm text-gray-800 space-y-2">
                          <p className="whitespace-pre-line">{msg.text}</p>
                          {msg.locationsNewQuoteAccountMatches.map((option, idx) => (
                            <div key={`${option.accountNumber}-${idx}`} className="space-y-1 border-t border-gray-100 pt-2">
                              <p><span className="font-semibold">{idx + 1}. Account Name</span> : {option.accountName}</p>
                              <p><span className="font-semibold">Account Number</span> : <a href="#" className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:underline">{option.accountNumber}</a></p>
                              <p><span className="font-semibold">Score</span> : {option.score}</p>
                              <p><span className="font-semibold">Ranking Reason</span> : {option.rankingReason}</p>
                            </div>
                          ))}
                        </div>
                      ) : msg.showLocationsNewQuoteOpportunities && msg.locationsNewQuoteOpportunities ? (
                        <div className="text-sm text-gray-800 space-y-2">
                          <p className="whitespace-pre-line">{msg.text}</p>
                          {msg.locationsNewQuoteOpportunities.map((opportunity, idx) => (
                            <div key={`${opportunity.opportunityId || opportunity.opportunityName}-${idx}`} className="space-y-1 border-t border-gray-100 pt-2">
                              {(() => {
                                const fallbackAmount = DEFAULT_LOCATIONS_NEW_QUOTE_OPPORTUNITY_AMOUNTS[idx] ?? DEFAULT_LOCATIONS_NEW_QUOTE_OPPORTUNITY_AMOUNTS[DEFAULT_LOCATIONS_NEW_QUOTE_OPPORTUNITY_AMOUNTS.length - 1]
                                const resolvedAmount = Number(opportunity.opportunityAmount ?? fallbackAmount)
                                return (
                                  <>
                              <p>
                                <span className="font-semibold">{idx + 1}. Opportunity Name</span> :{' '}
                                <a href="#" className="text-airtel-red underline hover:text-airtel-red/90 focus:outline-none focus:underline">{opportunity.opportunityName}</a>
                              </p>
                              <p><span className="font-semibold">Opportunity Amount</span> : Rs. {resolvedAmount.toLocaleString('en-IN')}</p>
                                  </>
                                )
                              })()}
                            </div>
                          ))}
                          <div className="space-y-1 border-t border-gray-100 pt-2">
                            <p><span className="font-semibold">4.</span> Create a New Opportunity</p>
                          </div>
                        </div>
                      ) : msg.showLocationsNewQuoteOpportunityPrefill && msg.locationsNewQuoteOpportunityPrefill ? (
                        <div className="text-sm text-gray-800 space-y-1">
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <ul className="list-disc pl-5 space-y-0.5">
                            <li><span className="font-semibold">Opportunity Name</span> : {msg.locationsNewQuoteOpportunityPrefill.opportunityName}</li>
                            <li><span className="font-semibold">BSG</span> : {msg.locationsNewQuoteOpportunityPrefill.bsg}</li>
                            <li><span className="font-semibold">KDM</span> : {msg.locationsNewQuoteOpportunityPrefill.kdm}</li>
                            <li><span className="font-semibold">Stage</span> : {msg.locationsNewQuoteOpportunityPrefill.stage}</li>
                            <li><span className="font-semibold">Opportunity Type</span> : {msg.locationsNewQuoteOpportunityPrefill.opportunityType}</li>
                            <li><span className="font-semibold">Expected close Date</span> : {msg.locationsNewQuoteOpportunityPrefill.expectedCloseDate}</li>
                            <li><span className="font-semibold">Month Projection</span> : {msg.locationsNewQuoteOpportunityPrefill.monthProjection}</li>
                          </ul>
                        </div>
                      ) : msg.showValidatedQuoteLink && onNavigateToValidatedQuote ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {VALIDATE_QUOTE_RESPONSE_PREFIX}
                          <button type="button" onClick={onNavigateToValidatedQuote} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            {VALIDATE_QUOTE_LINK_TEXT}
                          </button>
                        </p>
                      ) : msg.isUpgradeAttributesAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {UPGRADE_ATTRIBUTES_ANALYSIS_STAGES[msg.upgradeAttributesStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showUpgradeQuoteLink ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {UPGRADE_ATTRIBUTES_RESPONSE_PREFIX}
                          {onNavigateToUpgradeQuote ? (
                            <button type="button" onClick={onNavigateToUpgradeQuote} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                              {UPGRADE_ATTRIBUTES_LINK_TEXT}
                            </button>
                          ) : (
                            <span className="text-airtel-red underline">{UPGRADE_ATTRIBUTES_LINK_TEXT}</span>
                          )}
                        </p>
                      ) : msg.isMacdUpgradeUpdateAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {MACD_UPGRADE_UPDATE_ANALYSIS_STAGES[msg.macdUpgradeUpdateStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showMacdUpgradeUpdateLink ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {MACD_UPGRADE_UPDATE_RESPONSE_PREFIX}
                          {onNavigateToMacdUpgradeUpdate ? (
                            <button type="button" onClick={() => onNavigateToMacdUpgradeUpdate(msg.macdUpgradeUpdateIntentText)} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                              {MACD_UPGRADE_UPDATE_LINK_TEXT}
                            </button>
                          ) : (
                            <span className="text-airtel-red underline">{MACD_UPGRADE_UPDATE_LINK_TEXT}</span>
                          )}
                        </p>
                      ) : msg.isTechnicalAttributesUpdateAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {TECHNICAL_ATTRIBUTES_UPDATE_ANALYSIS_STAGES[msg.technicalAttributesUpdateStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showTechnicalAttributesUpdateLink ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {TECHNICAL_ATTRIBUTES_UPDATE_RESPONSE_PREFIX}
                          {onNavigateToEnrichQuoteUpdate ? (
                            <button type="button" onClick={() => onNavigateToEnrichQuoteUpdate(msg.technicalAttributesUpdateIntentText)} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                              {TECHNICAL_ATTRIBUTES_UPDATE_LINK_TEXT}
                            </button>
                          ) : (
                            <span className="text-airtel-red underline">{TECHNICAL_ATTRIBUTES_UPDATE_LINK_TEXT}</span>
                          )}
                        </p>
                      ) : msg.isPOChangeUpdateAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {PO_CHANGE_UPDATE_ANALYSIS_STAGES[msg.poChangeUpdateStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showEnrichQuoteUpdateLink ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {PO_CHANGE_UPDATE_RESPONSE_PREFIX}
                          {onNavigateToEnrichQuoteUpdate ? (
                            <button type="button" onClick={() => onNavigateToEnrichQuoteUpdate(msg.enrichQuoteUpdateIntentText)} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                              {PO_CHANGE_UPDATE_LINK_TEXT}
                            </button>
                          ) : (
                            <span className="text-airtel-red underline">{PO_CHANGE_UPDATE_LINK_TEXT}</span>
                          )}
                        </p>
                      ) : msg.isUpdateChangeAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {UPDATE_CHANGE_ANALYSIS_STAGES[msg.updateChangeStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showUpdatedRequestedValuesLink && onNavigateToUpdatedRequestedValues ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          Sure. The updates/changes will take some time. Click{' '}
                          <button type="button" onClick={() => onNavigateToUpdatedRequestedValues(msg.updateIntentText)} className="text-airtel-red underline hover:text-red-800 focus:outline-none focus:underline">
                            here
                          </button>
                          {' '}to view the updated values
                        </p>
                      ) : msg.isCreateQuoteAccountAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {CREATE_QUOTE_ACCOUNT_STAGES[msg.createQuoteAccountStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : msg.showCreateQuoteAccountMatches && msg.accountName ? (
                        <div className="text-sm text-gray-800 space-y-3">
                          {(msg.accountMatchesRevealPhase ?? 0) >= 0 && (
                            <p className="whitespace-pre-line">
                              I found multiple accounts matching &quot;{msg.accountName}&quot;. Please review the options below and select the one you&apos;d like to proceed with :
                            </p>
                          )}
                          {(msg.accountMatchesRevealPhase ?? 0) >= 1 && msg.bestMatch && (
                            <>
                              <p className="font-semibold text-gray-900">Best Match :</p>
                              <p className="text-gray-800"><span className="font-semibold">Account Name</span> : {msg.bestMatch.accountName}</p>
                              <p className="text-gray-800"><span className="font-semibold">Account Number</span> : <a href="#" className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:underline">{msg.bestMatch.accountNumber}</a></p>
                              <p className="text-gray-800"><span className="font-semibold">Score</span> : {msg.bestMatch.score}</p>
                              <p className="text-gray-800"><span className="font-semibold">Ranking Reason</span> : {msg.bestMatch.rankingReason}</p>
                              {msg.bestMatch.keyHighlights && msg.bestMatch.keyHighlights.length > 0 && (
                                <>
                                  <p className="font-medium text-gray-900">Key Highlights :</p>
                                  <ul className="list-disc list-inside ml-1 space-y-0.5 text-gray-800">
                                    {msg.bestMatch.keyHighlights.map((h, i) => (
                                      <li key={i}>{h}</li>
                                    ))}
                            </ul>
                                </>
                              )}
                            </>
                          )}
                          {(msg.accountMatchesRevealPhase ?? 0) >= 2 && (
                            <>
                              <p className="font-semibold text-gray-900">Additional Options</p>
                              {msg.additionalOptions?.[0] && (
                                <div className="space-y-1 text-gray-800">
                                  <p><span className="font-semibold">1. Account Name</span> : {msg.additionalOptions[0].accountName}</p>
                                  <p><span className="font-semibold">Account Number</span> : <a href="#" className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:underline">{msg.additionalOptions[0].accountNumber}</a></p>
                                  <p><span className="font-semibold">Score</span> : {msg.additionalOptions[0].score}</p>
                                  <p><span className="font-semibold">Ranking Reason</span> : {msg.additionalOptions[0].rankingReason}</p>
                          </div>
                        )}
                            </>
                          )}
                          {(msg.accountMatchesRevealPhase ?? 0) >= 3 && msg.additionalOptions?.[1] && (
                            <div className="space-y-1 text-gray-800">
                              <p><span className="font-semibold">2. Account Name</span> : {msg.additionalOptions[1].accountName}</p>
                              <p><span className="font-semibold">Account Number</span> : <a href="#" className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:underline">{msg.additionalOptions[1].accountNumber}</a></p>
                              <p><span className="font-semibold">Score</span> : {msg.additionalOptions[1].score}</p>
                              <p><span className="font-semibold">Ranking Reason</span> : {msg.additionalOptions[1].rankingReason}</p>
                                  </div>
                          )}
                          {(msg.accountMatchesRevealPhase ?? 0) >= 4 && msg.additionalOptions?.[2] && (
                            <div className="space-y-1 text-gray-800">
                              <p><span className="font-semibold">3. Account Name</span> : {msg.additionalOptions[2].accountName}</p>
                              <p><span className="font-semibold">Account Number</span> : <a href="#" className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:underline">{msg.additionalOptions[2].accountNumber}</a></p>
                              <p><span className="font-semibold">Score</span> : {msg.additionalOptions[2].score}</p>
                              <p><span className="font-semibold">Ranking Reason</span> : {msg.additionalOptions[2].rankingReason}</p>
                          </div>
                        )}
                          {(msg.accountMatchesRevealPhase ?? 0) >= 5 && (
                            <p className="pt-1">Please reply with the number of the account you would like to proceed with</p>
                          )}
                        </div>
                      ) : msg.isAnalyzing ? (
                        <p className="text-sm text-gray-800">
                          {QUOTE_PROPOSAL_LOADING_STAGES[msg.analyzingStageIndex ?? 0]}
                          <span className="inline-block ml-1 animate-pulse">...</span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-800 whitespace-pre-line">{msg.text}</p>
                      )}
                      {msg.showUploadForm && !hideUploadFormBecauseSubmitted && !(msg.uploadFormType === 'po' && poFormSubmittedRef.current) && !(msg.uploadFormType === 'quoteProposal' && quoteProposalFormSubmittedRef.current) && !(msg.uploadFormType === 'upgradeAttributes' && upgradeAttributesFormSubmittedRef.current) && !(msg.uploadFormType === 'feasibilityLocations' && feasibilityLocationsFormSubmittedRef.current) && !(msg.uploadFormType === 'locationsNewQuote' && locationsNewQuoteUploadFormSubmittedRef.current) && (
                          <div className="mt-3 space-y-3">
                          <p className="text-xs text-gray-700 font-medium">Upload file</p>
                            <input
                              ref={uploadFormFileInputRef}
                              type="file"
                              accept=".pdf,.csv,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                              className="hidden"
                              onChange={(e) => {
                              const chosen = e.target.files?.[0] || null
                              console.log('[Agentforce Upload] File input onChange – selected file:', chosen?.name ?? null, 'type:', msg.uploadFormType)
                              setUploadFormFile(chosen)
                              }}
                            aria-label="Upload file"
                            />
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-wrap items-center gap-2 bg-grey-bg/50">
                              <button
                                type="button"
                              onClick={() => {
                                console.log('[Agentforce Upload] Upload file button clicked (opens file picker), form type:', msg.uploadFormType)
                                uploadFormFileInputRef.current?.click()
                              }}
                              className="px-4 py-2 rounded-lg border border-airtel-red bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-airtel-red/20"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              Upload file
                              </button>
                            </div>
                            {uploadFormFile && (
                            <p className="text-xs text-gray-700">Selected: {uploadFormFile.name || 'document'}</p>
                            )}
                            <button
                              type="button"
                            onClick={() => {
                              console.log('[Agentforce Upload] Submit button clicked, form type:', msg.uploadFormType)
                              if (msg.uploadFormType === 'quoteProposal') handleQuoteProposalUploadSubmit()
                              else if (msg.uploadFormType === 'upgradeAttributes') handleUpgradeAttributesUploadSubmit()
                              else if (msg.uploadFormType === 'feasibilityLocations') handleFeasibilityLocationsUploadSubmit()
                              else if (msg.uploadFormType === 'locationsNewQuote') handleLocationsNewQuoteUploadSubmit()
                              else handlePOUploadSubmit()
                            }}
                            className="px-4 py-2 rounded-md bg-airtel-red text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Submit
                              </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      </div>
                      <p className="text-sm text-gray-800 flex-1">{msg.text}</p>
                    </>
                  )}
                </div>
            );
          })}
              <div ref={chatEndRef} />
          </div>
        )}

        <div className="shrink-0 p-4 bg-white border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendChatMessage()
          }}
          className="flex items-end gap-2 rounded-lg border border-gray-300 bg-white pl-3 pr-2 py-3 min-h-[4.5rem]"
        >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendChatMessage() } }}
            placeholder="Type your message..."
            className="flex-1 min-w-0 py-2 px-1 text-sm text-gray-800 placeholder-gray-500 focus:outline-none bg-transparent"
              aria-label="Chat input"
            />
          <button type="submit" className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-grey-bg focus:outline-none shrink-0 mb-0.5" aria-label="Send message">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
        </form>
        </div>
      </aside>
  )
}

export default AgentforceSidePanel
