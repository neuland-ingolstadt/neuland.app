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
