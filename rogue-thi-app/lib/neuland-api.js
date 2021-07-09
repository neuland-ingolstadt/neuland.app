class NeulandAPIClient {
  async getMensaPlan () {
    const resp = await fetch('/api/mensa')

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + await resp.text())
    }
  }

  async getBusPlan (station) {
    const resp = await fetch('/api/bus/' + encodeURIComponent(station))

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + await resp.text())
    }
  }

  async getTrainPlan (station) {
    const resp = await fetch('/api/train/' + encodeURIComponent(station))

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + await resp.text())
    }
  }

  async getParkingData () {
    const resp = await fetch('/api/parking')

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + await resp.text())
    }
  }

  async getCharingStationData () {
    const resp = await fetch('/api/charging-stations')

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + await resp.text())
    }
  }

  async getCampusLifeEvents () {
    const resp = await fetch('/api/cl-events')

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + await resp.text())
    }
  }

  async getThiEvents () {
    const resp = await fetch('/api/thi-events')

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + await resp.text())
    }
  }
}

export default new NeulandAPIClient()
