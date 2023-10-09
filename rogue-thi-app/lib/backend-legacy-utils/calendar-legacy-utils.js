import LegacyAPI from '../backend/authenticated-legacy-api'
import { parse as parsePostgresArray } from 'postgres-array'

/**
 * Fetches and parses the exam list
 * @returns {object[]}
 */
export async function loadLegacyExamList () {
  const examList = await LegacyAPI.getExams()

  return examList
    // Modus 2 seems to be an indicator for "not real" exams like internships, which still got listed in API.getExams()
    .filter((x) => x.modus !== '2')
    .map(x => {
      if (x.exm_date && x.exam_time) {
        const [, day, month, year] = x.exm_date.match(/(\d{1,})\.(\d{1,})\.(\d{4})/)
        x.date = new Date(`${year}-${month}-${day}T${x.exam_time}`)
      } else {
        x.date = null
      }

      x.anmeldung = new Date(x.anm_date + 'T' + x.anm_time)
      // hilfsmittel is returned as a string in postgres array syntax
      x.allowed_helpers = parsePostgresArray(x.hilfsmittel)
        .filter((v, i, a) => a.indexOf(v) === i)

      console.log(Object.keys(x))

      return {
        name: x.titel,
        type: x.pruefungs_art,
        rooms: x.exam_rooms,
        seat: x.exam_seat,
        notes: x.anmerkung,
        examiners: x.pruefer_namen,
        date: x.date,
        enrollment: x.anmeldung,
        aids: x.allowed_helpers
      }
    })
    // sort list in chronologically order
    .sort((a, b) => a.date - b.date)
}
