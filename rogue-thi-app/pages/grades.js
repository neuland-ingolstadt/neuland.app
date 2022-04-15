import React, { useEffect, useState } from 'react'
import ReactPlaceholder from 'react-placeholder'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { loadGradeAverage, loadGrades } from '../lib/backend-utils/grades-utils'
import { NoSessionError } from '../lib/backend/thi-session-handler'

import styles from '../styles/Grades.module.css'

const formatNum = (new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })).format

export default function Grades () {
  const router = useRouter()
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)
  const [gradeAverage, setGradeAverage] = useState(null)

  useEffect(() => {
    async function load () {
      try {
        const { finished, missing } = await loadGrades()
        setGrades(finished)
        setMissingGrades(missing)
        const average = await loadGradeAverage()
        setGradeAverage(average)
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login?redirect=grades')
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
        <AppNavbar.Overflow>
          <AppNavbar.Overflow.Link variant="link" onClick={() => copyGradeFormula()}>
            Notenschnitt Formel kopieren
          </AppNavbar.Overflow.Link>
          <AppNavbar.Overflow.Link variant="link" onClick={() => downloadGradeCSV()}>
            Noten als CSV exportieren
          </AppNavbar.Overflow.Link>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody>
        <ReactPlaceholder type="text" rows={3} ready={!!gradeAverage}>
          {gradeAverage && gradeAverage.entries.length > 0 && (
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
