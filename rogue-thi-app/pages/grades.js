import React, { useEffect, useState } from 'react'
import ReactPlaceholder from 'react-placeholder'
import { useRouter } from 'next/router'

import Dropdown from 'react-bootstrap/Dropdown'
import ListGroup from 'react-bootstrap/ListGroup'

import AppBody from '../components/AppBody'
import AppContainer from '../components/AppContainer'
import AppNavbar from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'

import API from '../lib/thi-backend/authenticated-api'
import { NoSessionError } from '../lib/thi-backend/thi-session-handler'

import courseSPOs from '../data/spo-grade-weights.json'

import styles from '../styles/Grades.module.css'

export default function Grades () {
  const router = useRouter()
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)
  const [gradeAverage, setGradeAverage] = useState(null)

  const formatNum = (new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })).format

  function simplifyName (x) {
    return x.replace(/\W/g, '').toLowerCase()
  }

  useEffect(() => {
    async function load () {
      try {
        // load and enhance grade list
        const gradeList = await API.getGrades()
        gradeList.forEach(x => {
          if (x.anrech === '*' && x.note === '') {
            x.note = 'E*'
          }
          if (x.note === '' && gradeList.some(y => x.pon === y.pon && y.note !== '')) {
            x.note = 'E'
          }
        })
        const deduplicatedGrades = gradeList
          .filter((x, i) => x.ects || !gradeList.some((y, j) => i !== j && x.titel.trim() === y.titel.trim()))

        const finishedGrades = deduplicatedGrades.filter(x => x.note)
        setGrades(finishedGrades)
        setMissingGrades(
          deduplicatedGrades.filter(x => !finishedGrades.some(y => x.titel.trim() === y.titel.trim()))
        )

        // calculate grade average
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
              }
            } else {
              average.entries.push({
                simpleName: name,
                name: x.titel,
                weight: null,
                grade
              })
              average.missingWeight++
            }
          }
        })

        average.entries.sort((a, b) => (b.grade ? 1 : 0) - (a.grade ? 1 : 0))
        const result = average.entries
          .reduce((acc, curr) => acc + (curr.weight || 1) * (curr.grade || 0), 0)
        const weight = average.entries
          .filter(curr => curr.grade)
          .reduce((acc, curr) => acc + (curr.weight || 1), 0)
        average.result = result / weight

        setGradeAverage(average)
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login')
        } else if (e.message === 'Query not possible') {
          // according to the original developers,
          // { status: -102, data: "Query not possible" }
          // means that the transcripts are currently being updated

          console.error(e)
          alert('Noten sind vorübergehend nicht verfügbar.')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [router])

  async function copyGradeFormula () {
    if (!gradeAverage) {
      return
    }

    const weight = gradeAverage.entries
      .filter(curr => curr.grade)
      .reduce((acc, curr) => acc + (curr.weight || 1), 0)
    const inner = gradeAverage.entries
      .map(entry => entry.weight && entry.weight !== 1
        ? `${entry.weight} * ${entry.grade}`
        : entry.grade.toString()
      )
      .join(' + ')

    await navigator.clipboard.writeText(`(${inner}) / ${weight}`)
    alert('Copied to Clipboard!')
  }

  function downloadGradeCSV () {
    alert('Not yet implemented :(')
  }

  return (
    <AppContainer>
      <AppNavbar title="Noten & Fächer">
        <Dropdown.Item variant="link" onClick={() => copyGradeFormula()}>
          Notenschnitt Formel kopieren
        </Dropdown.Item>
        <Dropdown.Item variant="link" onClick={() => downloadGradeCSV()}>
          Noten als CSV exportieren
        </Dropdown.Item>
      </AppNavbar>

      <AppBody>
        <ReactPlaceholder type="text" rows={3} ready={!!gradeAverage}>
          {gradeAverage && (
            <ListGroup>
              <h4 className={styles.heading}>
                Notenschnitt
              </h4>

              <ListGroup.Item>
                <span className={styles.gradeAverage}>{formatNum(gradeAverage.result)}</span>
                {gradeAverage.missingWeight / gradeAverage.entries.length > 0.2 && (
                  <span className={styles.details}>
                    Achtung: {gradeAverage.missingWeight} von {gradeAverage.entries.length} Noten haben
                    eine unbekannte Gewichtung. Der angezeigte Schnitt ist eventuell nicht korrekt.
                  </span>
                )}
              </ListGroup.Item>
            </ListGroup>
          )}
        </ReactPlaceholder>

        <ListGroup>
          <h4 className={styles.heading}>
            Noten
          </h4>

          <ReactPlaceholder type="text" rows={10} ready={grades}>
            {grades && grades.map((item, idx) =>
              <ListGroup.Item key={idx} className={styles.item}>
                <div className={styles.left}>
                  {item.titel}<br />

                  <div className={styles.details}>
                    Note: {item.note.replace('*', ' (angerechnet)')}<br />
                    ECTS: {item.ects || '(keine)'}
                  </div>
                </div>
              </ListGroup.Item>
            )}
          </ReactPlaceholder>
        </ListGroup>

        <ListGroup>
          <h4 className={styles.heading}>
            Ausstehende Fächer
          </h4>

          <ReactPlaceholder type="text" rows={10} ready={missingGrades}>
            {missingGrades && missingGrades.map((item, idx) =>
              <ListGroup.Item key={idx} className={styles.item}>
                <div className={styles.left}>
                  {item.titel} ({item.stg}) <br />

                  <div className={styles.details}>
                    Frist: {item.frist || '(keine)'}<br />
                    ECTS: {item.ects || '(keine)'}
                  </div>
                </div>
              </ListGroup.Item>
            )}
          </ReactPlaceholder>
        </ListGroup>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
