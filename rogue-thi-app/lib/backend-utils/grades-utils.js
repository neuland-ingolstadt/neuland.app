import API from '../backend/authenticated-api'
import courseSPOs from '../../data/spo-grade-weights.json'

function simplifyName (x) {
  return x.replace(/\W|und|u\./g, '').toLowerCase()
}

/**
 * Fetches and parses the grade list
 * @returns {object[]}
 */
async function getGradeList () {
  const gradeList = await API.getGrades()
  gradeList.forEach(x => {
    if (x.anrech === '*' && x.note === '') {
      x.note = 'E*'
    }
    if (x.note === '' && gradeList.some(y => x.pon === y.pon && y.note !== '')) {
      x.note = 'E'
    }
  })
  return gradeList
}

/**
 * Fetches, parses and filters the grade list
 * @returns {object}
 */
export async function loadGrades () {
  const gradeList = await getGradeList()

  const deduplicatedGrades = gradeList
    .filter((x, i) => x.ects || !gradeList.some((y, j) => i !== j && x.titel.trim() === y.titel.trim()))

  const finishedGrades = deduplicatedGrades.filter(x => x.note)
  const missingGrades = deduplicatedGrades.filter(x => !finishedGrades.some(y => x.titel.trim() === y.titel.trim()))

  return {
    finished: finishedGrades,
    missing: missingGrades
  }
}

/**
 * This Function is to calculate the number of ETCS a User has.
 * @returns {Promise<number>}
 */
export async function calculateECTS () {
  const { finished } = await loadGrades()

  let j = 0
  for (let i = finished.length - 1; i >= 0; i--) {
    j = j + parseInt(finished[i].ects)
  }

  return j
}

/**
 * Calculates the approximate grade average based on automatically extracted SPO data
 * @returns {object}
 */
export async function loadGradeAverage () {
  const gradeList = await getGradeList()
  const spoName = await API.getSpoName()
  if (!spoName || !courseSPOs[spoName]) {
    return
  }

  const average = {
    result: -1,
    missingWeight: 0,
    entries: []
  }

  gradeList.forEach(x => {
    const grade = x.note ? parseFloat(x.note.replace(',', '.')) : null
    if (grade && spoName && courseSPOs[spoName]) {
      const spo = courseSPOs[spoName]
      const name = simplifyName(x.titel)
      const entry = spo.find(y => simplifyName(y.name) === name)
      const other = average.entries.find(y => y.simpleName === name)

      if (other) {
        other.grade = other.grade || grade
      } else if (entry) {
        average.entries.push({
          simpleName: name,
          name: entry.name,
          weight: typeof entry.weight === 'number' ? entry.weight : null,
          grade
        })

        if (typeof entry.weight !== 'number') {
          average.missingWeight++
          console.log('Missing weight for lecture:', x.titel)
        }
      } else {
        average.entries.push({
          simpleName: name,
          name: x.titel,
          weight: null,
          grade
        })
        average.missingWeight++
        console.log('Unknown lecture:', x.titel)
      }
    }
  })

  average.entries.sort((a, b) => (b.grade ? 1 : 0) - (a.grade ? 1 : 0))
  const relevantEntries = average.entries.filter(curr => curr.grade && curr.grade < 5)
  const result = relevantEntries.reduce((acc, curr) => acc + (curr.weight || 1) * curr.grade, 0)
  const weight = relevantEntries.reduce((acc, curr) => acc + (curr.weight || 1), 0)
  average.result = Math.floor((result / weight) * 10) / 10

  return average
}
