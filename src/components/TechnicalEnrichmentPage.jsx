/**
 * Technical Enrichment page - Technical Attributes with sub-tabs:
 * Configure Technical attributes | Apply Technical Configurations to selected.
 * Supports embedInModal + onClose when shown inside a modal (e.g. from Enrich Quote row overflow).
 */
import { useState } from 'react'
import ConfigureTechnicalAttributesContent from './ConfigureTechnicalAttributesContent'
import LocationsTabContent from './LocationsTabContent'

export default function TechnicalEnrichmentPage({ embedInModal, onClose, onSaveWithConfiguredLocations, compareWithAsset, onCompareWithAssetChange, technicalAttributesOverrides, productFilterLocationIds, autoFillValues = false }) {
  const [technicalSubTab, setTechnicalSubTab] = useState('Configure Technical attributes')
  const [configuredLocationIds, setConfiguredLocationIds] = useState(new Set())
  const [hasConfigureChanges, setHasConfigureChanges] = useState(false)
  const [internalCompareWithAsset, setInternalCompareWithAsset] = useState(false)
  const isControlled = compareWithAsset !== undefined
  const compareWithAssetValue = isControlled ? compareWithAsset : internalCompareWithAsset
  const setCompareWithAssetValue = isControlled ? (onCompareWithAssetChange || (() => {})) : setInternalCompareWithAsset

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {technicalSubTab === 'Apply Technical Configurations to selected' ? (
        /* Assign tab: heading outside any box, aligned above list view; list view keeps its own border */
        <>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Apply Technical Configurations to selected</h2>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <LocationsTabContent
              configuredLocationIds={configuredLocationIds}
              onMarkLocationsConfigured={(ids) => setConfiguredLocationIds((prev) => new Set([...prev, ...ids]))}
              onSelectionChange={() => {}}
              successBannerVariant="technicalEnrichment"
              productFilterLocationIds={productFilterLocationIds}
            />
          </div>
        </>
      ) : (
        /* Configure tab: card with heading row and content */
        <div className="relative flex flex-col flex-1 min-h-0 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-20 pt-4 pb-2 shrink-0 border-b border-gray-200 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-gray-900">Configure Technical attributes</h2>
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800">Compare with Asset</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={compareWithAssetValue}
                    onClick={() => setCompareWithAssetValue(!compareWithAssetValue)}
                    className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-airtel-red/20 focus:ring-offset-1 ${compareWithAsset ? 'bg-airtel-red' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${compareWithAsset ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 mt-0.5">{compareWithAssetValue ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
          <div className="relative flex-1 min-h-0 overflow-y-auto p-4 pb-20">
            <div className="text-sm text-gray-600 px-16">
              <ConfigureTechnicalAttributesContent
                onDirtyChange={setHasConfigureChanges}
                compareWithAsset={compareWithAssetValue}
                technicalAttributesOverrides={technicalAttributesOverrides}
                autoFillValues={autoFillValues}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer - fixed when full page; shrink-0 when in modal (stays visible on both tabs) */}
      <div className={`flex flex-wrap items-center justify-between gap-2 p-4 border-t border-gray-200 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)] shrink-0 ${embedInModal ? '' : 'fixed bottom-0 left-0 right-0 z-50'}`}>
        <button
          type="button"
          onClick={() => technicalSubTab === 'Apply Technical Configurations to selected' && setTechnicalSubTab('Configure Technical attributes')}
          disabled={technicalSubTab === 'Configure Technical attributes'}
          className={technicalSubTab === 'Configure Technical attributes'
            ? 'px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-500 text-xs font-medium cursor-not-allowed'
            : 'px-4 py-2 rounded-md border border-gray-300 bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg'}
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (hasConfigureChanges) {
                setHasConfigureChanges(false)
                setTechnicalSubTab('Apply Technical Configurations to selected')
              }
            }}
            disabled={technicalSubTab !== 'Configure Technical attributes' || !hasConfigureChanges}
            className={(technicalSubTab !== 'Configure Technical attributes' || !hasConfigureChanges)
              ? 'px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-500 text-xs font-medium cursor-not-allowed'
              : 'px-4 py-2 rounded-md border border-gray-300 bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg'}
          >
            Update & Continue
          </button>
          <button
            type="button"
            onClick={() => {
              if (technicalSubTab !== 'Configure Technical attributes' && configuredLocationIds.size > 0) {
                onSaveWithConfiguredLocations?.(configuredLocationIds)
              }
              onClose?.()
            }}
            disabled={technicalSubTab === 'Configure Technical attributes' || configuredLocationIds.size === 0}
            className={(technicalSubTab === 'Configure Technical attributes' || configuredLocationIds.size === 0)
              ? 'px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-500 text-xs font-medium cursor-not-allowed'
              : 'px-4 py-2 rounded-md bg-airtel-red text-white text-xs font-medium hover:opacity-90'}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
