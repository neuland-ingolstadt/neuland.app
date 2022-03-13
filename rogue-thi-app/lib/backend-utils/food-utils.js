import NeulandAPI from '../backend/neuland-api'
import { formatISODate } from '../date-utils'

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

  const days = entries.flatMap(r => r.map(x => x.timestamp))
  const uniqueDays = [...new Set(days)]

  return uniqueDays.map(day => {
    const dayEntries = entries.flatMap(r => r.find(x => x.timestamp === day)?.meals || [])
    return {
      timestamp: day,
      meals: dayEntries
    }
  })
}
