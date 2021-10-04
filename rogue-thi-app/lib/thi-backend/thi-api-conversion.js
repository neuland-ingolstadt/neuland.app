const IGNORE_GAPS = 15

function addMinutes (date, minutes) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes() + minutes,
    date.getSeconds(),
    date.getMilliseconds()
  )
}

function minDate (a, b) {
  return a < b ? a : b
}

function maxDate (a, b) {
  return a > b ? a : b
}

function parseGermanDate (str) {
  const match = str.match(/^\w+ (\d{2}).(\d{2}).(\d{4})$/)
  const [, day, month, year] = match
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

/**
 * Converts an original THI mensa plan to the format used by /api/mensa
 */
export function convertThiMensaPlan (plan) {
  return plan.map(x => ({
    timestamp: parseGermanDate(x.tag).toISOString(),
    meals: Object.values(x.gerichte).map(meal => ({
      name: meal.name[1],
      prices: meal.name.slice(2, 5).map(x => parseFloat(x.replace(',', '.'))),
      allergenes: meal.zusatz.split(',')
    }))
  }))
}

/**
 * Converts the room plan for easier processing.
 * @param rooms rooms array as described in thi-rest-api.md
 * @returns { [room]: { from, until } }
 */
export function getRoomOpenings (rooms, date) {
  const openings = {}
  // get todays rooms
  rooms.filter(room => room.datum === date)
    // flatten room types
    .flatMap(room => room.rtypes)
    // flatten time slots
    .flatMap(rtype =>
      Object.values(rtype.stunden)
        .map(stunde => ({
          type: rtype.raumtyp,
          ...stunde
        }))
    )
    // flatten room list
    .flatMap(stunde =>
      stunde.raeume.split(', ')
        .map(room => ({
          room,
          type: stunde.type,
          from: new Date(date + 'T' + stunde.von),
          until: new Date(date + 'T' + stunde.bis)
        }))
    )
    // iterate over every room
    .forEach(({ room, type, from, until }) => {
      // initialize room
      const roomOpenings = openings[room] = openings[room] || []
      // find overlapping opening
      // ignore gaps of up to IGNORE_GAPS minutes since the time slots don't line up perfectly
      const opening = roomOpenings.find(opening =>
        from <= addMinutes(opening.until, IGNORE_GAPS) &&
        until >= addMinutes(opening.from, -IGNORE_GAPS)
      )
      if (opening) {
        // extend existing opening
        opening.from = minDate(from, opening.from)
        opening.until = maxDate(until, opening.until)
      } else {
        // create new opening
        roomOpenings.push({ type, from, until })
      }
    })
  return openings
}

export function extractFacultyFromPersonalData (data) {
  const split = data?.persdata?.po_url?.split('/').filter(x => x.length > 0)

  if (split.length > 2) {
    return split[split.length - 3]
      .replace('satzungen-', '')
      .replace('fakultaet-', '')
      .replace('campus-', '')
  } else {
    return null
  }
}

export function extractSpoFromPersonalData (data) {
  if (!data || !data.persdata || !data.persdata.po_url) {
    return null
  }

  const split = data.persdata.po_url.split('/').filter(x => x.length > 0)
  return split[split.length - 1]
}
