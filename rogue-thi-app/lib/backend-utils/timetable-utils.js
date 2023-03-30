import API from '../backend/authenticated-api'
import { getNextValidDate } from './rooms-utils'

/**
 * Extracts regular, short and full names for a lecture.
 * @param {object} item Timetable item
 * @returns {object}
 */
export function getTimetableEntryName (item) {
  const match = item.veranstaltung.match(/^[A-Z]{2}\S*/)
  if (match) {
    const [shortName] = match
    return {
      name: item.fach,
      shortName,
      fullName: `${shortName} - ${item.fach}`
    }
  } else {
    // fallback for weird entries like
    //    "veranstaltung": "„Richtige Studienorganisation und Prüfungsplanung“_durchgeführt von CSS und SCS",
    //    "fach": "fiktiv für Raumbelegung der Verwaltung E",
    const name = `${item.veranstaltung} - ${item.fach}`
    const shortName = name.length < 10 ? name : name.substr(0, 10) + '…'
    return {
      name,
      shortName,
      fullName: name
    }
  }
}

/**
 * Get all gaps between lectures.
 * Each gap is an object with a start and end date as well as start and end lecture.
 * @param {object[]} timetable Timetable
 * @returns {object[]}
 **/
export function getTimetableGaps (timetable) {
  const gaps = []
  for (let i = 0; i < timetable.length - 1; i++) {
    const gap = {
      startDate: timetable[i].endDate,
      endDate: timetable[i + 1].startDate,
      startLecture: timetable[i],
      endLecture: timetable[i + 1]
    }

    gaps.push(gap)
  }

  if (new Date().getTime() < timetable[0].startDate.getTime()) {
    // add gap between now and first lecture
    gaps.unshift({
      startDate: getNextValidDate(),
      endDate: timetable[0].startDate,
      endLecture: timetable[0]
    })
  }

  return gaps
}

/**
 * Fetches and parses timetable data.
 * @param {Date} date Date to fetch
 * @param {boolean} detailed Fetch lecture descriptions
 * @returns {object[]}
 */
export async function getFriendlyTimetable (date, detailed) {
  const { timetable } = await API.getTimetable(date, detailed)

  return timetable
    .map(x => {
      // parse dates
      x.startDate = new Date(`${x.datum}T${x.von}`)
      x.endDate = new Date(`${x.datum}T${x.bis}`)

      // normalize room order
      if (x.raum) {
        x.rooms = x.raum
          .split(',')
          .map(x => x.trim().toUpperCase())
          .sort()
        x.raum = x.rooms.join(', ')
      } else {
        x.rooms = []
        x.raum = ''
      }

      return x
    })
    .filter(x => x.endDate > date)
    .sort((a, b) => a.startDate - b.startDate)
}
