function FooterActions({
  onValidate,
  validationComplete,
  onContinueWithValidRecords,
  showValidateAddressButton = false,
  onValidateAddress,
  isAddressValidated = true,
}) {
  const verifyDisabled = !isAddressValidated
  const continueDisabled = !validationComplete || !isAddressValidated
  return (
    <div className="flex justify-end gap-2 mt-2 pt-2 flex-shrink-0">
      {showValidateAddressButton && (
        <button
          type="button"
          onClick={() => onValidateAddress?.()}
          className="px-4 py-1.5 border border-gray-300 rounded-md bg-white text-airtel-red text-xs font-medium hover:bg-grey-bg"
        >
          Validate Address
        </button>
      )}
      <button
        type="button"
        disabled={verifyDisabled}
        onClick={() => !verifyDisabled && onValidate?.()}
        className={`px-4 py-1.5 border rounded-md text-xs font-medium ${
          verifyDisabled
            ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'border-gray-300 bg-white text-airtel-red hover:bg-grey-bg'
        }`}
      >
        Verify Details
      </button>
      <button
        type="button"
        disabled={continueDisabled}
        onClick={() => !continueDisabled && onContinueWithValidRecords?.()}
        className={`px-4 py-1.5 border rounded-md text-xs font-medium ${!continueDisabled ? 'border-airtel-red bg-airtel-red text-white hover:opacity-90' : 'border-gray-300 bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      >
        Continue with Verified Records
      </button>
    </div>
  )
}

export default FooterActions
