export const UseLegacyAPI = () => {
  if (typeof window === 'undefined') {
    console.warn('Using legacy API in non-browser environment!')
    return false
  }

  const storage = localStorage.useLegacyAPI
  console.log('Use legacy API:', storage)

  if (storage === 'true') {
    return true
  }

  return false
}

export const setUseLegacyAPI = (value) => {
  localStorage.useLegacyAPI = value
  console.log('Use legacy API:', localStorage.useLegacyAPI)
}
