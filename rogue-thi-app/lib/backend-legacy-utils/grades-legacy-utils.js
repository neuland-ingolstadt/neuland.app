import LegacyAPI from '../backend/authenticated-legacy-api'

const redactGrades = process.env.NEXT_PUBLIC_REDACT_GRADES === 'true' || false

/**
 * Fetches and parses the grade list
 * @returns {object[]}
 */
export async function getLegacyGradeList () {
  const gradeList = await LegacyAPI.getGrades()

  gradeList.forEach(x => {
    if (x.anrech === '*' && x.note === '') {
      x.note = 'E*'
    }
    if (x.note === '' && gradeList.some(y => x.pon === y.pon && y.note !== '')) {
      x.note = 'E'
    }
  })

  /**
   * Set NEXT_PUBLIC_REDACT_GRADES to true to redact your grades (e.g. for screenshots)
   */
  if (redactGrades) {
    gradeList.forEach(x => {
      if (parseFloat(x.note)) {
        x.note = '1.0'
      }
    })
  }

  return gradeList
}
