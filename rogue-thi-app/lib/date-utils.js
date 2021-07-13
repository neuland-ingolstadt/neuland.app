
const WORD_TODAY = 'Heute'
const WORD_TOMORROW = 'Morgen'
const WORD_WEEKS = 'Wochen'
const WORD_DAY = 'Tag'
const WORD_DAYS = 'Tagen'
const WORD_HOUR = 'Stunde'
const WORD_HOURS = 'Stunden'
const WORD_MINUTE = 'Minute'
const WORD_MINUTES = 'Minuten'
const WORD_IN = 'in'
const WORD_AGO = 'vor'
const WORD_THIS_WEEK = 'Diese Woche'
const WORD_NEXT_WEEK = 'Nächste Woche'

export const DATE_LOCALE = 'de-DE'

/**
 * Formats a time like "8:15"
 */
export function formatFriendlyTime (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  return datetime.toLocaleTimeString(DATE_LOCALE, { hour: 'numeric', minute: '2-digit' })
}

/**
 * Formats a date like "1.10.2020"
 */
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

/**
 * Formats a day like "Morgen" or "Montag, 1. Oktober"
 */
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

/**
 * Formats a date and time like "1. Oktober, 8:15"
 */
export function formatFriendlyDateTime (datetime) {
  const date = formatFriendlyDate(datetime)
  const time = formatFriendlyTime(datetime)

  return `${date}, ${time}`
}

function formatFriendlyTimeDelta (delta) {
  delta = Math.abs(delta)

  const weeks = delta / (7 * 24 * 60 * 60 * 1000) | 0
  if (weeks > 2) {
    return `${weeks} ${WORD_WEEKS}`
  }

  const days = delta / (24 * 60 * 60 * 1000) | 0
  if (days === 1) {
    return `1 ${WORD_DAY}`
  } else if (days > 0) {
    return `${days} ${WORD_DAYS}`
  }

  const hours = delta / (60 * 60 * 1000) | 0
  if (hours === 1) {
    return `1 ${WORD_HOUR}`
  } else if (hours > 1) {
    return `${hours} ${WORD_HOURS}`
  }

  const minutes = delta / (60 * 1000) | 0
  if (minutes === 1) {
    return `1 ${WORD_MINUTE}`
  } else {
    return `${minutes} ${WORD_MINUTES}`
  }
}

/**
 * Formats a relative date and time like "in 5 Minuten" or "vor 10 Minuten"
 */
export function formatFriendlyRelativeTime (date) {
  const startOfDay = new Date()
  startOfDay.setHours(0)
  startOfDay.setMinutes(0)
  startOfDay.setSeconds(0)
  startOfDay.setMilliseconds(0)

  const deltaFromNow = date.getTime() - Date.now()
  const deltaFromStartOfDay = date.getTime() - startOfDay.getTime()

  if (deltaFromNow > 0) {
    // when the event is more than 24h away, use the start of the day as a reference
    // (because that is how humans measure time, apparently)
    if (Math.abs(deltaFromNow) < 86400000) {
      return `${WORD_IN} ${formatFriendlyTimeDelta(deltaFromNow)}`
    } else {
      return `${WORD_IN} ${formatFriendlyTimeDelta(deltaFromStartOfDay)}`
    }
  } else {
    if (Math.abs(deltaFromNow) < 86400000) {
      return `${WORD_AGO} ${formatFriendlyTimeDelta(deltaFromNow)}`
    } else {
      return `${WORD_AGO} ${formatFriendlyTimeDelta(deltaFromStartOfDay - 86400000)}`
    }
  }
}

/**
 * Formats a relative date and time like "5 min"
 */
export function formatRelativeMinutes (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  const minutes = Math.max(Math.floor((datetime.getTime() - Date.now()) / 60000), 0)
  return `${minutes} min`
}

/**
 * Formats a date range like "1.10.2021 - 2.10.2021"
 */
export function formatFriendlyDateRange (begin, end) {
  let str = formatFriendlyDate(begin)
  if (end && begin.toDateString() !== end.toDateString()) {
    str += ' – ' + formatFriendlyDate(end)
  }
  return str
}

/**
 * Formats a date range like "1.10.2021 08:00 – 12:00" or "1.10.2021 08:00 – 2.10.2021 08:00"
 */
export function formatFriendlyDateTimeRange (begin, end) {
  let str = formatFriendlyDate(begin) + ', ' + formatFriendlyTime(begin)
  if (end) {
    if (begin.toDateString() === end.toDateString()) {
      str += ' – ' + formatFriendlyTime(end)
    } else {
      str += ' – ' + formatFriendlyDate(end) + ', ' + formatFriendlyTime(end)
    }
  }
  return str
}

/**
 * Formats a date like "2020-10-01"
 */
export function formatISODate (date) {
  return date.getFullYear().toString().padStart(4, '0') + '-' +
    (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
    date.getDate().toString().padStart(2, '0')
}

/**
 * Formats a time like "08:15"
 */
export function formatISOTime (date) {
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
}

/**
 * Returns the start of the week
 * https://stackoverflow.com/a/4156516
 */
export function getMonday (date) {
  date = new Date(date)
  const day = date.getDay()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return date
}

/**
 * Returns the start end the end of the week
 */
export function getWeek (date) {
  const start = getMonday(date)
  const end = getMonday(date)
  end.setDate(end.getDate() + 7)
  return [start, end]
}

/**
 * Adds weeks to a date
 */
export function addWeek (date, delta) {
  date = new Date(date)
  date.setDate(date.getDate() + delta * 7)
  return date
}

/**
 * Formats a date like 'Nächste Woche' or '17.5. – 23.5.'
 */
export function getFriendlyWeek (date) {
  const [currStart, currEnd] = getWeek(new Date())
  const [nextStart, nextEnd] = getWeek(addWeek(new Date(), 1))
  if (date >= currStart && date < currEnd) {
    return WORD_THIS_WEEK
  } else if (date >= nextStart && date < nextEnd) {
    return WORD_NEXT_WEEK
  } else {
    const monday = getMonday(date)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)

    return monday.toLocaleString(DATE_LOCALE, { day: 'numeric', month: 'numeric' }) +
      ' – ' + sunday.toLocaleString(DATE_LOCALE, { day: 'numeric', month: 'numeric' })
  }
}
