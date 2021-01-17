function parseGermanDate (str) {
  const match = str.match(/^\w+ (\d{2}).(\d{2}).(\d{4})$/)
  const [, day, month, year] = match
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

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
