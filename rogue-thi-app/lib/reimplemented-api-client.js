export async function getMensaPlan () {
  return fetch('/api/mensa')
    .then(res => res.json())
}