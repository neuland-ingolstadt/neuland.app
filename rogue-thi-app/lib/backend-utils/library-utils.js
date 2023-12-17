import API from '../backend/authenticated-api'
import { combineDateTime } from '../date-utils'

/**
 * Converts the seat list for easier processing.
 * @returns {object}
 */
export async function getFriendlyAvailableLibrarySeats() {
  const available = await API.getAvailableLibrarySeats()
  return available.map((day) => {
    const date = day.date.substring(0, 10)
    return {
      date,
      resource: day.resource.map((slot) => {
        const from = combineDateTime(date, slot.from)
        const to = combineDateTime(date, slot.to)

        return {
          ...slot,
          from,
          to,
        }
      }),
    }
  })
}
