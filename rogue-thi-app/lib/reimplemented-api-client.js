export async function getMensaPlan () {
  return fetch('/api/mensa')
    .then(res => res.json())
}

export async function getBusPlan (station) {
  return fetch('/api/bus/' + encodeURIComponent(station))
    .then(res => res.json())
}
