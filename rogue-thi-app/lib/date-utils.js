
const DATE_LOCALE = 'de-DE'
const WORD_TODAY = 'Heute'
const WORD_TOMORROW = 'Morgen'

export function formatFriendlyTime (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  return datetime.toLocaleTimeString(DATE_LOCALE, { hour: 'numeric', minute: '2-digit' })
}

export function formatFriendlyDate (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  if (datetime.toDateString() === today.toDateString()) {
    return WORD_TODAY
  } else if (datetime.toDateString() === tomorrow.toDateString()) {
    return WORD_TOMORROW
  } else {
    return datetime.toLocaleString(DATE_LOCALE, { day: 'numeric', month: '2-digit', year: 'numeric' })
  }
}

export function formatNearDate (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  if (datetime.toDateString() === today.toDateString()) {
    return WORD_TODAY
  } else if (datetime.toDateString() === tomorrow.toDateString()) {
    return WORD_TOMORROW
  } else {
    return datetime.toLocaleString(DATE_LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })
  }
}

export function formatFriendlyDateTime (datetime) {
  const date = formatFriendlyDate(datetime)
  const time = formatFriendlyTime(datetime)

  return `${date}, ${time}`
}
