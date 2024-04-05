import API from '../backend/authenticated-api'

const redactGrades = process.env.NEXT_PUBLIC_REDACT_GRADES === 'true' || false

function simplifyName(x) {
  return x.replace(/\W|und|u\./g, '').toLowerCase()
}

/**
 * Fetches and parses the grade list
 * @returns {object[]}
 */
async function getGradeList() {
  const gradeList = await API.getGrades()

  gradeList.forEach((x) => {
    if (x.anrech === '*' && x.note === '') {
      x.note = 'E*'
    }
    if (
      x.note === '' &&
      gradeList.some((y) => x.pon === y.pon && y.note !== '')
    ) {
      x.note = 'E'
    }
  })

  /**
   * Set NEXT_PUBLIC_REDACT_GRADES to true to redact your grades (e.g. for screenshots)
   */
  if (redactGrades) {
    gradeList.forEach((x) => {
      if (parseFloat(x.note)) {
        x.note = '1.0'
      }
    })
  }

  return gradeList
}

/**
 * Fetches, parses and filters the grade list
 * @returns {object}
 */
export async function loadGrades() {
  const gradeList = await getGradeList()

  const duplicateGrades = gradeList.filter((x, i) =>
    gradeList.some((y, j) => i !== j && x.titel.trim() === y.titel.trim())
  )

  // group by title and keep the one with the highest ECTS
  const groupedDuplicates = duplicateGrades.reduce((acc, curr) => {
    const existing = acc.find((x) => x.titel.trim() === curr.titel.trim())
    if (existing) {
      if (existing.ects < curr.ects) {
        existing.ects = curr.ects
      }
    } else {
      acc.push(curr)
    }
    return acc
  }, [])

  const deduplicatedGrades = gradeList
    .filter(
      (x) => !groupedDuplicates.some((y) => x.titel.trim() === y.titel.trim())
    )
    .concat(groupedDuplicates)

  // sort by original index
  const sortedGrades = deduplicatedGrades.sort(
    (a, b) => gradeList.indexOf(a) - gradeList.indexOf(b)
  )

  const finishedGrades = sortedGrades.filter((x) => x.note)
  const missingGrades = sortedGrades.filter(
    (x) => !finishedGrades.some((y) => x.titel.trim() === y.titel.trim())
  )

  return {
    finished: finishedGrades,
    missing: missingGrades,
  }
}

/**
 * This Function is to calculate the number of ETCS a User has.
 * @returns {Promise<number>}
 */
export async function calculateECTS() {
  const { finished } = await loadGrades()

  let j = 0
  for (let i = finished.length - 1; i >= 0; i--) {
    j = j + parseInt(finished[i].ects)
  }

  return j
}

/**
 * Calculates the approximate grade average based on automatically extracted SPO data
 * @param {object} courseSPOs - The SPO data retrieved from the asset server
 * @returns {object}
 */
export async function loadGradeAverage(courseSPOs) {
  const gradeList = await getGradeList()
  const spoName = await API.getSpoName()
  if (!spoName || !courseSPOs[spoName]) {
    return
  }

  const average = {
    result: -1,
    missingWeight: 0,
    entries: [],
  }

  gradeList.forEach((x) => {
    const grade = x.note ? parseFloat(x.note.replace(',', '.')) : null
    if (grade && spoName && courseSPOs[spoName]) {
      const spo = courseSPOs[spoName]
      const name = simplifyName(x.titel)
      const spoEntries = spo.filter((y) => simplifyName(y.name) === name)
      const entry = spoEntries.find((y) => !!y.weight) || spoEntries[0]
      const other = average.entries.find((y) => y.simpleName === name)

      if (other) {
        other.grade = other.grade || grade
      } else if (entry) {
        average.entries.push({
          simpleName: name,
          name: entry.name,
          weight: typeof entry.weight === 'number' ? entry.weight : null,
          grade,
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
          grade,
        })
        average.missingWeight++
        console.log('Unknown lecture:', x.titel)
      }
    }
  })

  average.entries.sort((a, b) => (b.grade ? 1 : 0) - (a.grade ? 1 : 0))

  const relevantEntries = average.entries.filter(
    (curr) => curr.grade && curr.grade < 5
  )
  function calculateAverage(defaultWeight) {
    const result = relevantEntries.reduce(
      (acc, curr) => acc + (curr.weight || defaultWeight) * curr.grade,
      0
    )
    const weight = relevantEntries.reduce(
      (acc, curr) => acc + (curr.weight || defaultWeight),
      0
    )
    return Math.floor((result / weight) * 10) / 10
  }
  average.result = calculateAverage(1)
  const avgP5 = calculateAverage(0.5)
  const avg4 = calculateAverage(4)
  average.resultMin = Math.min(avgP5, avg4)
  average.resultMax = Math.max(avgP5, avg4)

  return average
}
