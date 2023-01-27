import API from '../backend/authenticated-api'

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
