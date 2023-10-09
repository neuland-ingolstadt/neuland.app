import LegacyAPI from '../backend/authenticated-legacy-api'

import { BUILDINGS_ALL, addMinutes, isInBuilding, maxDate, minDate } from '../backend-utils/rooms-utils'
import { formatISODate } from '../date-utils'

const IGNORE_GAPS = 15

function getLegacyRoomOpenings (rooms, date) {
  date = formatISODate(date)
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

export async function searchLegacyRooms (beginDate, endDate, building = BUILDINGS_ALL) {
  const data = await LegacyAPI.getFreeRooms(beginDate)

  const openings = getLegacyRoomOpenings(data.rooms, beginDate)
  return Object.keys(openings)
    .flatMap(room =>
      openings[room].map(opening => ({
        room,
        type: opening.type,
        from: opening.from,
        until: opening.until
      }))
    )
    .filter(opening =>
      (building === BUILDINGS_ALL || isInBuilding(opening.room.toLowerCase(), building)) &&
      beginDate >= opening.from &&
      endDate <= opening.until
    )
    .sort((a, b) => a.room.localeCompare(b.room))
}

export async function getFreeRoomsLegacy () {
  const now = new Date()
  const data = await LegacyAPI.getFreeRooms(now)

  const days = data.rooms.map(day => {
    const result = {}
    result.date = new Date(day.datum)
    result.hours = {}

    day.rtypes.forEach(roomType => Object.entries(roomType.stunden).forEach(([hIndex, hour]) => {
      const to = new Date(hour.bis)
      if (to < now) { return }

      if (!result.hours[hIndex]) {
        result.hours[hIndex] = {
          from: new Date(day.datum + 'T' + hour.von),
          to: new Date(day.datum + 'T' + hour.bis),
          roomTypes: {}
        }
      }

      result.hours[hIndex].roomTypes[roomType.raumtyp] = hour.raeume.split(', ')
    }))

    return result
  })
    .filter(day => Object.entries(day.hours) !== 0)

  return days
}
