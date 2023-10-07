import API from '../backend/authenticated-api'
import { parse as parsePostgresArray } from 'postgres-array'
import rawCalendar from '../../data/calendar.json'

export const compileTime = new Date()
export const calendar = rawCalendar.map(x => ({
  ...x,
  name: x.name.de,
  begin: new Date(x.begin),
  end: x.end && new Date(x.end)
}))
  .filter(x => (x.end && x.end > compileTime) || x.begin > compileTime)
  .sort((a, b) => a.end - b.end)
  .sort((a, b) => a.begin - b.begin)

/**
 * Fetches and parses the exam list
 * @returns {object[]}
 */
export async function loadExamList () {
  const examList = await API.getExams()
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

      return x
    })
    // sort list in chronologically order
    .sort((a, b) => a.date - b.date)
}
