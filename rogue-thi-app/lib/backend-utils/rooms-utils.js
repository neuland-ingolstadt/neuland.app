import API from '../backend/authenticated-api'

import { formatISODate, getWeek } from '../date-utils'
import { getFriendlyTimetable } from './timetable-utils'
import { i18n } from 'next-i18next'
import roomDistances from '../../data/room-distances.json'

const IGNORE_GAPS = 15

export const BUILDINGS = ['A', 'B', 'BN', 'C', 'CN', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'M', 'P', 'W', 'Z']
export const BUILDINGS_ALL = 'Alle'
export const ROOMS_ALL = 'Alle'
export const DURATION_PRESET = '01:00'
export const SUGGESTION_DURATION_PRESET = 90
export const TUX_ROOMS = ['G308']

/**
 * Adds minutes to a date object.
 * @param {Date} date
 * @param {number} minutes
 * @returns {Date}
 */
export function addMinutes (date, minutes) {
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

/**
 * Returns the earlier of two dates.
 * @param {Date} a
 * @param {Date} b
 * @returns {Date}
 */
function minDate (a, b) {
  return a < b ? a : b
}

/**
 * Returns the later of two dates.
 * @param {Date} a
 * @param {Date} b
 * @returns {Date}
 */
function maxDate (a, b) {
  return a > b ? a : b
}

/**
 * Checks whether a room is in a certain building.
 * @param {string} room Room name (e.g. `G215`)
 * @param {string} building Building name (e.g. `G`)
 * @returns {boolean}
 */
function isInBuilding (room, building) {
  return new RegExp(`${building}\\d+`, 'i').test(room)
}

/**
 * Converts the room plan for easier processing.
 * @param rooms rooms array as described in thi-rest-api.md
 * @param {Date} date Date to filter for
 * @returns {object}
 */
export function getRoomOpenings (rooms, date) {
  date = formatISODate(date)
  const openings = {}
  // get todays rooms
  rooms.filter(room => room.datum.startsWith(date))
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
      stunde.raeume
        .map(([,, room]) => ({
          // 0 indicates that every room is free
          room: room === 0 ? ROOMS_ALL : room,
          type: stunde.type,
          from: new Date(stunde.von),
          until: new Date(stunde.bis),
          capacity: stunde.raeume
        }))
    )
    // iterate over every room
    .forEach(({ room, type, from, until, capacity }) => {
      const capResult = capacity.find(entry => entry[2] === room)
      capacity = capResult ? capResult[3] : null

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
        roomOpenings.push({ type, from, until, capacity })
      }
    })
  return openings
}

/**
 * Get a suitable preset for the time selector.
 * If outside the opening hours, this will skip to the time the university opens.
 * @returns {Date}
 */
export function getNextValidDate () {
  const startDate = new Date()

  if (startDate.getDay() === 0 || startDate.getHours() > 20) { // sunday or after 9pm
    startDate.setDate(startDate.getDate() + 1)
    startDate.setHours(8)
    startDate.setMinutes(15)
  } else if (startDate.getHours() < 8) { // before 6am
    startDate.setHours(8)
    startDate.setMinutes(15)
  }

  return startDate
}

/**
 * Filters suitable room openings.
 * @param {string} date Start date as an ISO string
 * @param {string} time Start time
 * @param {string} [building] Building name
 * @param {string} [duration] Minimum opening duration
 * @returns {object[]}
 */
export async function filterRooms (date, time, building = BUILDINGS_ALL, duration = DURATION_PRESET) {
  const beginDate = new Date(date + 'T' + time)
  const endDate = addSearchDuration(beginDate, duration)

  return searchRooms(beginDate, endDate, building)
}

/**
 * Add the duration given as a string to the given date.
 * @param {Date} date The date to add the duration to
 * @param {string} duration Duration as a string in the format `HH:MM`
 * @returns
 */
export function addSearchDuration (date, duration = DURATION_PRESET) {
  const [durationHours, durationMinutes] = duration.split(':').map(x => parseInt(x, 10))
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours() + durationHours,
    date.getMinutes() + durationMinutes,
    date.getSeconds(),
    date.getMilliseconds()
  )
}

/**
 * Filters suitable room openings.
 * @param {Date} beginDate Start date as Date object
 * @param {Date} endDate End date as Date object
 * @param {string} [building] Building name (e.g. `G`), defaults to all buildings
 * @returns {object[]}
 */
export async function searchRooms (beginDate, endDate, building = BUILDINGS_ALL) {
  const data = await API.getFreeRooms(beginDate)

  const openings = getRoomOpenings(data, beginDate)
  return Object.keys(openings)
    .flatMap(room =>
      openings[room].map(opening => ({
        room,
        type: opening.type,
        from: opening.from,
        until: opening.until,
        capacity: opening.capacity
      }))
    )
    .filter(opening =>
      (building === BUILDINGS_ALL || isInBuilding(opening.room.toLowerCase(), building)) &&
      beginDate >= opening.from &&
      endDate <= opening.until
    )
    .sort((a, b) => a.room.localeCompare(b.room))
}

/**
 * Filters suitable room openings.
 * @param {Date} day Start date as Date object
 * @returns {object[]}
 */
export async function getRoomAvailability (day = new Date()) {
  day.setHours(0, 0, 0, 0)

  const data = await API.getFreeRooms(day)

  // get todays rooms openings
  const openings = getRoomOpenings(data, day)

  // filter for requested rooms
  const roomOpenings = Object.fromEntries(Object.entries(openings))

  // combine openings that are less than IGNORE_GAPS (= 15 minutes) minutes apart
  const processedOpenings = Object.fromEntries(Object.entries(roomOpenings).map(([room, openings]) => {
    const processedOpenings = []
    let lastOpening = null
    for (let index = 0; index < openings.length; index++) {
      const opening = openings[index]
      if (lastOpening === null) {
        lastOpening = opening
        continue
      }

      if (addMinutes(lastOpening.until, IGNORE_GAPS) > opening.from) {
        lastOpening.until = opening.until
      } else {
        processedOpenings.push(lastOpening)
        lastOpening = opening
      }
    }

    if (lastOpening !== null) {
      processedOpenings.push(lastOpening)
    }

    return [room, processedOpenings]
  }))

  return processedOpenings
}

/**
 * Filters room capacities.
 * @param {Date} day Start date as Date object
 * @returns {object[]}
 */
export async function getRoomCapacity (day = new Date()) {
  const data = await API.getFreeRooms(day)
  const openings = await getRoomOpenings(data, day)

  const roomCapacityData = Object.fromEntries(Object.entries(openings).map(([key, value]) => [key, value[0].capacity]))

  return roomCapacityData
  // Same length for every week?
  // 27.11.2023: length = 94;
  // 03.12.2023: length = 93;
}

/**
 * Returns the most common element in an array.
 * @param {Array} arr Array
 * @returns {*} Most common element
 */
function mode (arr) {
  return arr.reduce(
    (a, b, _, arr) =>
      (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b),
    null)
}

/**
 * Sorts rooms by distance to the given room.
 * @param {string} room Room name (e.g. `G215`)
 * @param {Array} rooms Array of timetable entries as returned by `searchRooms`
 * @returns {Array}
 */
function sortRoomsByDistance (room, rooms) {
  const distances = getRoomDistances(room)

  // sort by distance
  rooms = rooms.sort((a, b) => {
    return (distances[a?.room] ?? Infinity) - (distances[b?.room] ?? Infinity)
  })
  return rooms
}

/**
 * Returns all buildings filtered by Neuburg or Ingolstadt using the timetable.
 */
export async function getAllUserBuildings () {
  const majorityRoom = await getMajorityRoom()

  if (majorityRoom) {
    return BUILDINGS.filter(building => building.includes('N') === majorityRoom.includes('N'))
  }

  return BUILDINGS
}

/**
 * Finds rooms that are close to the given room and are available for the given time.
 * @param {string} room Room name (e.g. `G215`)
 * @param {Date} startDate Start date as Date object
 * @param {Date} endDate End date as Date object
 * @returns {Array}
 **/
export async function findSuggestedRooms (room, startDate, endDate) {
  let rooms = await searchRooms(startDate, endDate)

  // hide Neuburg buildings if next lecture is not in Neuburg
  rooms = rooms.filter(x => x.room.includes('N') === room.includes('N'))

  // get distances to other rooms
  rooms = sortRoomsByDistance(room, rooms)

  return rooms
}

/**
 * Finds the room with the most lectures for the complete timetable.
 * @returns {string} Room name (e.g. `G215`)
 */
async function getMajorityRoom () {
  const date = new Date()
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1)
  }

  const week = getWeek(date)

  const timetable = await getFriendlyTimetable(week[0], false)
  const rooms = timetable.flatMap(x => x.rooms)

  return mode(rooms)
}

/**
 * Translates the room function to the current language.
 * @param {string} roomFunction Room function (e.g. `Seminarraum`)
 * @returns {string} Translated room function
 */
export function getTranslatedRoomFunction (roomFunction) {
  const roomFunctionCleaned = roomFunction?.replace(/\s+/g, ' ')?.trim() ?? ''

  const translatedRoomFunction = i18n.t(`apiTranslations.roomFunctions.${roomFunctionCleaned}`, { ns: 'api-translations' })
  return translatedRoomFunction === `apiTranslations.roomFunctions.${roomFunctionCleaned}` ? roomFunctionCleaned : translatedRoomFunction
}

/**
 * Translates the room name to the current language.
 * This is only used for some special cases like 'alle Räume'.
 * @param {string} room Room name (e.g. `G215`)
 * @returns {string} Translated room name
 */
export function getTranslatedRoomName (room) {
  switch (room) {
    case ROOMS_ALL:
      return i18n.t('rooms.allRooms', { ns: 'common' })
    default:
      return room
  }
}

/**
 * Finds empty rooms for the current time with the given duration.
 * @param {boolean} [asGap] Whether to return the result as a gap with start and end date or only the rooms
 * @param {number} [duration] Duration of the gap in minutes
 * @returns {Array}
 **/
export async function getEmptySuggestions (asGap = false) {
  const userDurationStorage = localStorage.getItem('suggestion-duration')
  const userDuration = userDurationStorage ? parseInt(userDurationStorage) : SUGGESTION_DURATION_PRESET

  const endDate = addMinutes(new Date(), userDuration)
  let rooms = await searchRooms(new Date(), endDate)

  const buildingFilter = localStorage.buildingPreferences

  if (buildingFilter) {
    // test if any of the rooms is in any of the user's preferred buildings
    const userBuildings = JSON.parse(buildingFilter)
    const filteredBuildings = Object.keys(userBuildings).filter(x => userBuildings[x])

    if (filteredBuildings.length !== 0) {
      const filteredRooms = rooms.filter(x => filteredBuildings.some(y => isInBuilding(x.room, y)))

      if (filteredRooms.length >= 4) {
        // enough rooms in preferred buildings -> filter out other buildings
        rooms = filteredRooms
      } else {
        // not enough rooms in preferred buildings -> show all rooms but sort by preferred buildings
        rooms = rooms.sort(x => filteredBuildings.some(y => isInBuilding(x.room, y)))
      }
    }
  }

  // no preferred buildings -> search rooms near majority room
  // preferred buildings -> filter by preferred buildings and sort by distance to majority room
  const majorityRoom = await getMajorityRoom()

  // if majority room is undefined -> do not filter
  if (majorityRoom) {
    rooms = sortRoomsByDistance(majorityRoom, rooms)

    // hide Neuburg buildings if next lecture is not in Neuburg
    rooms = rooms.filter(x => x.room.includes('N') === majorityRoom.includes('N'))
  }

  rooms = rooms.slice(0, 4)

  if (asGap) {
    if (rooms.length < 1) {
      return []
    }

    return [(
      {
        gap: (
          {
            startDate: new Date(),
            endDate
          }
        ),
        rooms
      }
    )]
  }

  return rooms
}

/**
 * Returns the distance to other rooms from the given room.
 * @param {string} room Room name (e.g. `G215`)
 * @returns {object}
 **/
export function getRoomDistances (room) {
  if (!room) {
    return {}
  }

  return roomDistances[room.toUpperCase()] || {}
}
