import { getAdjustedLocale } from './locale-utils'
import { i18n } from 'next-i18next'

/**
 * Formats a date like "Mo., 1.10.2020"
 * @param {Date|string} datetime
 * @returns {string}
 */
export function formatFriendlyDate (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  if (datetime.toDateString() === today.toDateString()) {
    return t('common.dates.today')
  } else if (datetime.toDateString() === tomorrow.toDateString()) {
    return t('common.dates.tomorrow')
  } else {
    return datetime.toLocaleString(getAdjustedLocale(), { weekday: 'short', day: 'numeric', month: '2-digit', year: 'numeric' })
  }
}

/**
 * Formats a date range like "Mo., 1.10.2021 - Di., 2.10.2021"
 * @param {Date} begin
 * @param {Date} end
 * @returns {string}
 */
export function formatFriendlyDateRange (begin, end) {
  let str = formatFriendlyDate(begin)
  if (end && begin.toDateString() !== end.toDateString()) {
    str += ' – ' + formatFriendlyDate(end)
  }
  return str
}

/**
 * Formats a time like "8:15"
 * @param {Date|string} datetime
 * @returns {string}
 */
export function formatFriendlyTime (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  return datetime.toLocaleTimeString(getAdjustedLocale(), { hour: 'numeric', minute: '2-digit' })
}

/**
 * Formats a date range like "Mo., 1.10.2021 08:00 – 12:00" or "Mo., 1.10.2021 08:00 – Do., 2.10.2021 08:00"
 * @param {Date} begin
 * @param {Date} end
 * @returns {string}
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
 * Formats a date and time like "Mo., 1.10.2020, 08:15"
 * @param {Date|string} datetime
 * @returns {string}
 */
export function formatFriendlyDateTime (datetime) {
  const date = formatFriendlyDate(datetime)
  const time = formatFriendlyTime(datetime)

  return `${date}, ${time}`
}

/**
 * Formats a day like "Morgen" or "Montag, 1.10."
 * @param {Date|string} datetime
 * @returns {string}
 */
export function formatNearDate (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  if (datetime.toDateString() === today.toDateString()) {
    return i18n.t('common.dates.today', { ns: 'common' })
  } else if (datetime.toDateString() === tomorrow.toDateString()) {
    return i18n.t('common.dates.tomorrow', { ns: 'common' })
  } else {
    return datetime.toLocaleString(getAdjustedLocale(), { weekday: 'long', day: 'numeric', month: 'numeric' })
  }
}

/**
 * This Function takes a datetame and returns a span which is Formated, that on the first line is the Weekday and on the second line you get the date
 * @param datetime
 * @returns {JSX.Element}
 */
export function buildLinedWeekdaySpan (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  const weekday = datetime.toLocaleString(getAdjustedLocale(), { weekday: 'short' })
  const date = datetime.toLocaleString(getAdjustedLocale(), { day: 'numeric', month: 'numeric' })

  return <span>{weekday}<br />{date}</span>
}

/**
 * Formats a time delta like "in 5 Minuten".
 * @param {number} delta Time delta in milliseconds
 * @returns {string}
 */
function formatFriendlyTimeDelta (delta) {
  const rtl = new Intl.RelativeTimeFormat(getAdjustedLocale(), {
    numeric: 'auto',
    style: 'long'
  })

  const weeks = delta / (7 * 24 * 60 * 60 * 1000) | 0
  if (Math.abs(weeks) > 0) {
    return rtl.format(weeks, 'week')
  }

  const days = delta / (24 * 60 * 60 * 1000) | 0
  if (Math.abs(days) > 0) {
    return rtl.format(days, 'day')
  }

  const hours = delta / (60 * 60 * 1000) | 0
  if (Math.abs(hours) > 0) {
    return rtl.format(hours, 'hour')
  }

  const minutes = delta / (60 * 1000) | 0
  return rtl.format(minutes, 'minute')
}

/**
 * Formats a relative date and time like "in 5 Minuten" or "vor 10 Minuten"
 * @param {Date} date
 * @returns {string}
 */
export function formatFriendlyRelativeTime (date) {
  const startOfDay = new Date()
  startOfDay.setHours(0)
  startOfDay.setMinutes(0)
  startOfDay.setSeconds(0)
  startOfDay.setMilliseconds(0)

  const deltaFromNow = date.getTime() - Date.now()
  const deltaFromStartOfDay = date.getTime() - startOfDay.getTime()

  // when the event is more than 24h away, use the start of the day as a reference
  // (because that is how humans measure time, apparently)
  if (Math.abs(deltaFromNow) < 86400000) {
    return formatFriendlyTimeDelta(deltaFromNow)
  } else if (deltaFromNow > 0) {
    return formatFriendlyTimeDelta(deltaFromStartOfDay)
  } else {
    return formatFriendlyTimeDelta(deltaFromStartOfDay - 86400000)
  }
}

/**
 * Formats a relative date and time like "5 min"
 * @param {Date|string} datetime
 * @returns {string}
 */
export function formatRelativeMinutes (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  const minutes = Math.max(Math.floor((datetime.getTime() - Date.now()) / 60000), 0)
  return `${minutes} min`
}

/**
 * Formats a date like "2020-10-01"
 * @param {Date} date
 * @returns {string}
 */
export function formatISODate (date) {
  return date.getFullYear().toString().padStart(4, '0') + '-' +
    (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
    date.getDate().toString().padStart(2, '0')
}

/**
 * Formats a time like "08:15"
 * @param {Date} date
 * @returns {string}
 */
export function formatISOTime (date) {
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
}

/**
 * Returns the start of the week
 * https://stackoverflow.com/a/4156516
 * @param {Date} date
 * @returns {string}
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
 * @param {Date} date
 * @returns {string}
 */
export function getWeek (date) {
  const start = getMonday(date)
  const end = getMonday(date)
  end.setDate(end.getDate() + 7)
  return [start, end]
}

/**
 * Adds weeks to a date
 * @param {Date} date
 * @param {number} delta
 * @returns {Date}
 */
export function addWeek (date, delta) {
  date = new Date(date)
  date.setDate(date.getDate() + delta * 7)
  return date
}

/**
 * Formats a date like 'Nächste Woche' or '17.5. – 23.5.'
 * @param {Date} date
 * @returns {string}
 */
export function getFriendlyWeek (date) {
  const [currStart, currEnd] = getWeek(new Date())
  const [nextStart, nextEnd] = getWeek(addWeek(new Date(), 1))
  if (date >= currStart && date < currEnd) {
    return t('common.dates.thisWeek')
  } else if (date >= nextStart && date < nextEnd) {
    return t('common.dates.nextWeek')
  } else {
    const monday = getMonday(date)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)

    return monday.toLocaleString(getAdjustedLocale(), { day: 'numeric', month: 'numeric' }) +
      ' – ' + sunday.toLocaleString(getAdjustedLocale(), { day: 'numeric', month: 'numeric' })
  }
}

/**
 * Returns true if the given date is a weekend day
 * @param {Date} date
 * @returns {boolean}
 */
export function isWeekend (date) {
  return date.getDay() === 0 || date.getDay() === 6
}

/**
 * Returns the given day on working days or the next working day if the given date is a weekend day
 * @param {Date} date
 * @returns {Date}
 */
export function getAdjustedDay (date) {
  if (isWeekend(date)) {
    return getMonday(addWeek(date, 1))
  }
  return date
}

/**
 * Returns true if the given dates are on the same day
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 **/
export function isSameDay (a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * Combines the date from one Date object and the time from another Date object
 * @param {Date} date
 * @param {Date} time
 * @returns {Date}
 */
export function combineDateTime (date, time) {
  date = new Date(date)
  time = new Date(time)
  date.setHours(time.getHours())
  date.setMinutes(time.getMinutes())
  date.setSeconds(time.getSeconds())
  date.setMilliseconds(time.getMilliseconds())
  return date
}

function t (...args) {
  return i18n.t(...args, { ns: 'common' })
}
