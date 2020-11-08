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

/**
 * Converts the room plan for easier processing.
 * @param rooms rooms array as described in thi-rest-api.md
 * @returns { [room]: { from, until } }
 */
export function getRoomOpenings (rooms, date) {
  const openings = {}
  // get todays rooms
  rooms.filter(room => room.datum === date)
    // unpack
    .flatMap(room => room.rtypes)
    .flatMap(rtype =>
      // flatten
      Object.values(rtype.stunden)
        .flatMap(stunde =>
          stunde.raeume.split(', ')
            .map(room => {
              const from = new Date(date + 'T' + stunde.von)
              const until = new Date(date + 'T' + stunde.bis)
              return { room, type: rtype.raumtyp, from, until }
            })
        )
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
