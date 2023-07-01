import API from '../backend/authenticated-api'

/**
 * Converts the seat list for easier processing.
 * @returns {object}
 */
export async function getFriendlyAvailableLibrarySeats () {
  const available = await API.getAvailableLibrarySeats()
  return available
    .map(day => {
      const date = day.date.substring(0, 10)
      return {
        date,
        resource: day.resource.map(slot => {
          // the actual timestamp has to be combined
          // from the date and from attributes
          const from = new Date(date)
          const brokenFrom = new Date(slot.from)
          from.setHours(brokenFrom.getHours())
          from.setMinutes(brokenFrom.getMinutes())
          from.setSeconds(brokenFrom.getSeconds())
          const to = new Date(date)
          const brokenTo = new Date(slot.to)
          to.setHours(brokenTo.getHours())
          to.setMinutes(brokenTo.getMinutes())
          to.setSeconds(brokenTo.getSeconds())

          return {
            ...slot,
            from,
            to
          }
        })
      }
    })
}
