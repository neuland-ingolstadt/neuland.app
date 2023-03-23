import NeulandAPI from '../backend/neuland-api'
import { formatISODate } from '../date-utils'

/**
 * Fetches and parses the meal plan
 * @param {string[]} restaurants Requested restaurants (`mensa` or `reimanns`)
 * @returns {object[]}
 */
export async function loadFoodEntries (restaurants) {
  const entries = []

  if (restaurants.includes('mensa')) {
    const data = await NeulandAPI.getMensaPlan()
    data.forEach(day => day.meals.forEach(entry => {
      entry.restaurant = 'Mensa'
    }))
    entries.push(data)
  }

  if (restaurants.includes('reimanns')) {
    const data = await NeulandAPI.getReimannsPlan()

    const startOfToday = new Date(formatISODate(new Date())).getTime()
    const filteredData = data.filter(x => (new Date(x.timestamp)).getTime() >= startOfToday)

    filteredData.forEach(day => day.meals.forEach(entry => {
      entry.restaurant = 'Reimanns'
    }))
    entries.push(filteredData)
  }

  // get start of this week (monday) or next monday if isWeekend
  const startOfThisWeek = new Date()
  const isWeekend = startOfThisWeek.getDay() === 0 || startOfThisWeek.getDay() === 6
  const daysToMonday = isWeekend ? (startOfThisWeek.getDay() === 0 ? 1 : 2) : 1 - startOfThisWeek.getDay()
  startOfThisWeek.setDate(startOfThisWeek.getDate() + daysToMonday)

  // create day entries for next 12 days (current and next week including the weekend) starting from monday
  let days = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(startOfThisWeek.getTime())
    date.setDate(date.getDate() + i)
    return date
  })

  // remove weekend
  days = days.filter(x => x.getDay() !== 0 && x.getDay() !== 6)

  // map to ISO date
  days = days.map(x => formatISODate(x))

  // map entries to daysTest
  return days.map(day => {
    const dayEntries = entries.flatMap(r => r.find(x => x.timestamp === day)?.meals || [])
    return {
      timestamp: day,
      meals: dayEntries
    }
  })
}
