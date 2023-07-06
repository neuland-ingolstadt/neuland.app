import API from '../backend/authenticated-api'
import rawCalendar from '../../data/calendar.json'

export const compileTime = new Date()
export const calendar = rawCalendar.map(x => ({
  ...x,
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
    .map(exam => ({
      name: exam.titel,
      type: exam.pruefungs_art,
      room: exam.exam_rooms,
      seat: exam.exam_seat,
      notes: exam.anmerkung,
      examiners: exam.pruefer_namen,
      date: new Date(exam.exam_ts),
      enrollment: new Date(exam.anm_ts),
      aids: exam.hilfsmittel?.filter((v, i, a) => a.indexOf(v) === i) || []
    }))
    // sort list in chronologically order
    .sort((a, b) => a.date - b.date)
}
