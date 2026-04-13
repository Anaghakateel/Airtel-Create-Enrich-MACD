import { useState, useRef, useEffect } from 'react'
import quotesIcon from './quotes.png'

function QuoteSection({
  oneTimeTotal = 0,
  arcTotal = 0,
  monthlyTotal = 0,
  quoteTotal = 0,
  activeTab,
  onTabChange,
  extractedInfoCount = 0,
  locationsCount = 0,
  summaryCount = 0,
  onCheckFeasibility,
  onValidateQuote,
  status = 'Draft', // "Draft" | "Feasibility" | "Validated"
  quoteTitle = 'HDFC bank connectivity across India',
  showExtractedInformationTab = true,
  feasibilityRequestId = '',
}) {
  const oneTimeDisplay = oneTimeTotal > 0 ? `₹${oneTimeTotal.toLocaleString()}` : '₹0.00'
  const arcDisplay = arcTotal > 0 ? `₹${arcTotal.toLocaleString()}` : '₹0.00'
  const monthlyDisplay = monthlyTotal > 0 ? `₹${monthlyTotal.toLocaleString()}` : '₹0.00'
  const quoteDisplay = quoteTotal > 0 ? `₹${quoteTotal.toLocaleString()}` : '₹0.00'

  const [cloneQliDropdownOpen, setCloneQliDropdownOpen] = useState(false)
  const cloneQliRef = useRef(null)
  useEffect(() => {
    if (!cloneQliDropdownOpen) return
    const handleClickOutside = (e) => {
      if (cloneQliRef.current && !cloneQliRef.current.contains(e.target)) setCloneQliDropdownOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [cloneQliDropdownOpen])

  return (
    <>
      {/* Card one: Enterprise Quote header + financial summary only – background #F5F5F5 */}
      <div className="bg-screenshot-grey border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="bg-screenshot-grey flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded flex items-center justify-center shrink-0 overflow-hidden" aria-hidden="true">
              <img src={quotesIcon} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base text-gray-900">
                <span className="block font-normal">Enterprise Quote</span>
                <span className="block font-bold">{quoteTitle}</span>
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'Locations' ? (
              <>
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg">
                  Quote Details
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg">
                  <svg className="w-4 h-4 text-airtel-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Bulk Download
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg">
                  <svg className="w-4 h-4 text-airtel-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Bulk Upload
                </button>
                <div className="relative inline-block" ref={cloneQliRef}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCloneQliDropdownOpen((o) => !o) }}
                    className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg"
                  >
                    Clone QLI
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {cloneQliDropdownOpen && activeTab === 'Locations' && (
                    <div className="absolute left-0 top-full mt-1 z-30 min-w-[10rem] py-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <button type="button" className="w-full px-3 py-2 text-left text-xs text-airtel-red hover:bg-grey-bg" onClick={() => { setCloneQliDropdownOpen(false); onCheckFeasibility?.() }}>Check Feasibility</button>
                      <button type="button" className="w-full px-3 py-2 text-left text-xs text-airtel-red hover:bg-grey-bg" onClick={() => { setCloneQliDropdownOpen(false); onValidateQuote?.() }}>Validate Quote</button>
                    </div>
                  )}
                </div>
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg">
                  Lat-Long Validation
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg">
                  Address Correction
                </button>
                <button type="button" className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg">
                  Check Feasibility
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg">
                  Quote Details
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg">
                  <svg className="w-4 h-4 text-airtel-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Bulk Download
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg">
                  <svg className="w-4 h-4 text-airtel-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Bulk Upload
                </button>
                <div className="relative inline-block" ref={cloneQliRef}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCloneQliDropdownOpen((o) => !o) }}
                    className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg"
                  >
                    Clone QLI
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {cloneQliDropdownOpen && activeTab !== 'Locations' && (
                    <div className="absolute left-0 top-full mt-1 z-30 min-w-[10rem] py-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <button type="button" className="w-full px-3 py-2 text-left text-xs text-airtel-red hover:bg-grey-bg" onClick={() => { setCloneQliDropdownOpen(false); onCheckFeasibility?.() }}>Check Feasibility</button>
                      <button type="button" className="w-full px-3 py-2 text-left text-xs text-airtel-red hover:bg-grey-bg" onClick={() => { setCloneQliDropdownOpen(false); onValidateQuote?.() }}>Validate Quote</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-8 px-5 py-4 bg-white">
          <div>
            <p className="text-xs text-gray-500 tracking-wide">One Time Total</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{oneTimeDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 tracking-wide">ARC Total</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{arcDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 tracking-wide">Monthly Total</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{monthlyDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 tracking-wide">Quote Total</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{quoteDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 tracking-wide">Status</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{status}</p>
          </div>
          {String(feasibilityRequestId || '').trim() && (
            <div>
              <p className="text-xs text-gray-500 tracking-wide">Feasibility Request ID</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{feasibilityRequestId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Card two: Tabs (Summary, Location, Subscribers, Extracted Information) */}
      {typeof activeTab === 'string' && typeof onTabChange === 'function' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-0 overflow-hidden">
          <div className="flex gap-1 px-5 bg-white border-b border-gray-200">
            {[
              { id: 'Summary', label: 'Summary', count: summaryCount },
              { id: 'Locations', label: 'Location', count: locationsCount },
              ...(showExtractedInformationTab ? [{ id: 'Extracted Information', label: 'Extracted Information', count: extractedInfoCount }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-3 text-xs font-medium border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-airtel-red font-semibold border-airtel-red'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count !== undefined && ` (${tab.count})`}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default QuoteSection
