/**
 * Technical Attributes page – full-page view with breadcrumbs.
 * Replaces the modal: Quote > Enrich Quote > Technical Attributes
 */
import TechnicalEnrichmentPage from './TechnicalEnrichmentPage'

export default function TechnicalAttributesPage({ onBackToEnrichQuote, onBackToQuote, onSaveWithConfiguredLocations, compareWithAsset, onCompareWithAssetChange, technicalAttributesOverrides, productFilterLocationIds }) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Breadcrumbs: Quote > Enrich Quote > Technical Attributes */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs mb-4">
        <button
          type="button"
          onClick={onBackToQuote}
          className="text-airtel-red font-medium hover:underline"
        >
          Quote
        </button>
        <span className="text-gray-400" aria-hidden="true">&gt;</span>
        <button
          type="button"
          onClick={onBackToEnrichQuote}
          className="text-airtel-red font-medium hover:underline"
        >
          Enrich Quote
        </button>
        <span className="text-gray-400" aria-hidden="true">&gt;</span>
        <span className="text-gray-700 font-medium">Technical Attributes</span>
      </nav>
      <TechnicalEnrichmentPage
        embedInModal={false}
        onClose={onBackToEnrichQuote}
        onSaveWithConfiguredLocations={onSaveWithConfiguredLocations}
        compareWithAsset={compareWithAsset}
        onCompareWithAssetChange={onCompareWithAssetChange}
        technicalAttributesOverrides={technicalAttributesOverrides}
        productFilterLocationIds={productFilterLocationIds}
      />
    </div>
  )
}
