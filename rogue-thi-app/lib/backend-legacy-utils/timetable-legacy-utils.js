import LegacyAPI from '../backend/authenticated-legacy-api'

export async function getFriendlyLegacyTimetable (date, detailed) {
  const { timetable } = await LegacyAPI.getTimetable(date, detailed)

  return timetable
    .map(x => {
      // parse dates
      x.startDate = new Date(`${x.datum}T${x.von}`)
      x.endDate = new Date(`${x.datum}T${x.bis}`)

      // normalize room order
      if (x.raum) {
        x.rooms = x.raum
          .split(',')
          .map(x => x.trim().toUpperCase())
          .sort()
        x.raum = x.rooms.join(', ')
      } else {
        x.rooms = []
        x.raum = ''
      }

      return {
        date: x.datum,
        startDate: x.startDate,
        endDate: x.endDate,
        name: x.fach,
        shortName: x.veranstaltung,
        rooms: x.rooms,
        lecturer: x.dozent,
        exam: x.pruefung,
        course: x.stg,
        studyGroup: x.stgru,
        sws: x.sws,
        ects: x.ectspoints,
        objective: x.ziel,
        contents: x.inhalt,
        literature: x.literatur
      }
    })
    .filter(x => x.endDate > date)
    .sort((a, b) => a.startDate - b.startDate)
}
