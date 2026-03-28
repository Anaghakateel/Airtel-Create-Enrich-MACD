import { useState } from 'react'
import ConfigurationCartContent from './ConfigurationCartContent'
import SummaryTabContent from './SummaryTabContent'

function formatINR(num) {
  if (num == null) return '₹0.00'
  const n = Number(num)
  if (n === 0) return '₹0.00'
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ConfigurationCartView({ row, onBack, locations = [], onUpdateLocation, onDeleteLocations, onAddProductsToQuote, selectedRowIds = new Set(), summaryLocations = [], updatedProductRowIds, showFeasibilityResults = false }) {
  const [subTab, setSubTab] = useState('Configuration Cart')
  const [hasUpdates, setHasUpdates] = useState(false)
  const [selectedLocationIds, setSelectedLocationIds] = useState(new Set())
  const [configuredLocationIds, setConfiguredLocationIds] = useState(new Set())
  const [assignedConfigRowIds, setAssignedConfigRowIds] = useState(() => new Set())

  const oneTimeTotal = row?.oneTimeTotal ?? 10000
  const monthlyTotal = row?.recurringTotal ?? 0
  const updateCartEnabled = hasUpdates
  const addConfigurationsEnabled = subTab === 'Apply Configuration to related products' && assignedConfigRowIds.size > 0
  const addProductsLabel = 'Add Configurations to products'

  return (
    <div className="flex flex-col min-h-0 h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Sub-tabs: Configuration Cart | Apply Configuration to related products */}
      <div className="border-b border-gray-200 shrink-0">
        <div className="flex gap-0">
          <button
            type="button"
            onClick={() => setSubTab('Configuration Cart')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors ${subTab === 'Configuration Cart' ? 'text-airtel-red border-airtel-red' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            Configuration Cart
          </button>
          <button
            type="button"
            onClick={() => setSubTab('Apply Configuration to related products')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors ${subTab === 'Apply Configuration to related products' ? 'text-airtel-red border-airtel-red' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            Apply Configuration to related products
          </button>
        </div>
      </div>

      {subTab === 'Configuration Cart' ? (
      <ConfigurationCartContent
        row={row}
        onBack={onBack}
        onUpdateCart={() => setHasUpdates(false)}
        onDirtyChange={setHasUpdates}
        hideFooter
      />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col pb-20">
          <SummaryTabContent
            locations={summaryLocations}
            updatedProductRowIds={updatedProductRowIds}
            showFeasibilityResults={showFeasibilityResults}
            embedMode
            initialSelectedIds={new Set()}
            defaultProductFilter="Internet"
            onSelectionChange={(count, ids) => setSelectedLocationIds(ids instanceof Set ? ids : new Set(ids || []))}
            assignedConfigRowIds={assignedConfigRowIds}
            onAssignConfigurations={(ids) => setAssignedConfigRowIds((prev) => new Set([...prev, ...(ids || [])]))}
          />
        </div>
      )}

      {/* Footer – fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-wrap items-center justify-between gap-4 p-4 border-t border-gray-200 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <p className="text-gray-500">Location</p>
            <p className="font-medium text-gray-900">1</p>
          </div>
          <div>
            <p className="text-gray-500">One Time Total</p>
            <p className="font-semibold text-gray-900">{formatINR(oneTimeTotal)}</p>
          </div>
          <div>
            <p className="text-gray-500">Monthly Total</p>
            <p className="font-semibold text-gray-900">{formatINR(monthlyTotal)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onBack()}
            className="px-4 py-2 rounded-md border border-gray-300 bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (updateCartEnabled) {
                setHasUpdates(false)
                setSubTab('Apply Configuration to related products')
              }
            }}
            className={updateCartEnabled ? 'px-4 py-2 rounded-md border border-gray-300 bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg' : 'px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-500 text-xs font-medium cursor-not-allowed'}
            disabled={!updateCartEnabled}
          >
            Update Cart
          </button>
          <button
            type="button"
            onClick={() => {
              if (!addConfigurationsEnabled) return
              const idsToAdd = assignedConfigRowIds.size > 0 ? Array.from(assignedConfigRowIds) : (selectedLocationIds.size > 0 ? Array.from(selectedLocationIds) : (selectedRowIds.size > 0 ? Array.from(selectedRowIds) : (row?.id ? [row.id] : [])))
              onAddProductsToQuote?.(idsToAdd)
              if (idsToAdd.length > 0) setConfiguredLocationIds((prev) => new Set([...prev, ...idsToAdd]))
            }}
            className={addConfigurationsEnabled ? 'px-4 py-2 rounded-md bg-airtel-red text-white text-xs font-medium hover:opacity-90' : 'px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-500 text-xs font-medium cursor-not-allowed'}
            disabled={!addConfigurationsEnabled}
          >
            {addProductsLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
