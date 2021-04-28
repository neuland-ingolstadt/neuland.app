export async function getMensaPlan () {
  const resp = await fetch('/api/mensa')

  if (resp.status === 200) {
    return await resp.json()
  } else {
    throw new Error('API returned an error: ' + await resp.text())
  }
}

export async function getBusPlan (station) {
  const resp = await fetch('/api/bus/' + encodeURIComponent(station))

  if (resp.status === 200) {
    return await resp.json()
  } else {
    throw new Error('API returned an error: ' + await resp.text())
  }
}

export async function getTrainPlan (station) {
  const resp = await fetch('/api/train/' + encodeURIComponent(station))

  if (resp.status === 200) {
    return await resp.json()
  } else {
    throw new Error('API returned an error: ' + await resp.text())
  }
}

export async function getParkingData () {
  const resp = await fetch('/api/parking')

  if (resp.status === 200) {
    return await resp.json()
  } else {
    throw new Error('API returned an error: ' + await resp.text())
  }
}

export async function getCharingStationData () {
  const resp = await fetch('/api/charging-stations')

  if (resp.status === 200) {
    return await resp.json()
  } else {
    throw new Error('API returned an error: ' + await resp.text())
  }
}

export async function getCampusliveEvents () {
  const resp = await fetch('/api/events')

  if (resp.status === 200) {
    return await resp.json()
  } else {
    throw new Error('API returned an error: ' + await resp.text())
  }
}
