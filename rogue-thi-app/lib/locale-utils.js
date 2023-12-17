import { i18n } from 'next-i18next'

export function getAdjustedLocale() {
  if (i18n.languages[0] === 'en') {
    return 'en-UK'
  }
  return i18n.language
}
