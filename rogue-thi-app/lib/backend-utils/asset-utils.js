const ASSET_SERVER_URL = 'https://assets.neuland.app/generated/'

export async function getRoomDistances() {
  const roomDistances = await fetch(`${ASSET_SERVER_URL}room-distances.json`)
  return roomDistances.json()
}

export async function getSpoGradeWeights() {
  const spoGradeWeights = await fetch(
    `${ASSET_SERVER_URL}spo-grade-weights.json`
  )
  return spoGradeWeights.json()
}
