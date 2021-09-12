import React, { useEffect, useState } from 'react'
import ReactPlaceholder from 'react-placeholder'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

import { faQuestion, faQuestionCircle, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AppBody from '../components/AppBody'
import AppContainer from '../components/AppContainer'
import AppNavbar from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'

import API from '../lib/thi-backend/authenticated-api'
import { NoSessionError } from '../lib/thi-backend/thi-session-handler'

import courseSPOs from '../data/spo-grade-weights.json'
import courseShorts from '../data/course-short-names.json'

import styles from '../styles/Grades.module.css'

// flag to temporarily disable averages until they are finished
const ENABLE_AVERAGES = !!process.env.NEXT_PUBLIC_ENABLE_AVERAGES

export default function Grades () {
  const router = useRouter()
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)
  const [gradeAverages, setGradeAverages] = useState(null)

  const hasMultipleCourses = gradeAverages && Object.keys(gradeAverages).length > 1
  const formatNum = (new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })).format

  function simplifyName (x) {
    return x.replace(/\W/g, '').toLowerCase()
  }

  useEffect(() => {
    async function load () {
      try {
        const gradeList = await API.getGrades()
        const averages = {}

        gradeList.forEach(x => {
          if (!averages[x.stg]) {
            averages[x.stg] = {
              result: -1,
              entries: []
            }
          }
          const average = averages[x.stg]

          const faculty = Object.keys(courseShorts).find(faculty => courseShorts[faculty][x.stg])
          const spoName = courseShorts[faculty][x.stg]
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
            } else {
              average.entries.push({
                simpleName: name,
                name: x.titel,
                weight: null,
                grade
              })
            }
          }

          if (x.anrech === '*' && x.note === '') {
            x.note = 'E*'
          }
          if (x.note === '' && gradeList.some(y => x.pon === y.pon && y.note !== '')) {
            x.note = 'E'
          }
        })

        Object.keys(averages).forEach(stg => {
          const entries = averages[stg].entries
          entries.sort((a, b) => (b.grade ? 1 : 0) - (a.grade ? 1 : 0))
          const result = entries.reduce((acc, curr) => acc + (curr.weight || 1) * (curr.grade || 0), 0)
          const weight = entries.filter(curr => curr.grade).reduce((acc, curr) => acc + (curr.weight || 1), 0)
          averages[stg].result = Math.floor(result / weight * 10) / 10 // truncate after first decimal place
        })
        setGradeAverages(averages)

        const deduplicatedGrades = gradeList
          .filter((x, i) => x.ects || !gradeList.some((y, j) => i !== j && x.titel.trim() === y.titel.trim()))

        const finishedGrades = deduplicatedGrades.filter(x => x.note)
        setGrades(finishedGrades)

        setMissingGrades(
          deduplicatedGrades.filter(x => !finishedGrades.some(y => x.titel.trim() === y.titel.trim()))
        )
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

  async function copyFormula (entries) {
    const weight = entries.filter(curr => curr.grade).reduce((acc, curr) => acc + (curr.weight || 1), 0)
    const inner = entries
      .map(entry => entry.weight && entry.weight !== 1
        ? `${entry.weight} * ${entry.grade}`
        : entry.grade.toString()
      )
      .join(' + ')

    await navigator.clipboard.writeText(`(${inner}) / ${weight}`)
    console.log('copied!')
  }

  return (
    <AppContainer>
      <AppNavbar title="Noten & Fächer" />

      <AppBody>
        {ENABLE_AVERAGES && (
          <ReactPlaceholder type="text" rows={3} ready={gradeAverages}>
            {gradeAverages && Object.entries(gradeAverages).map(([stg, average], idx) =>
              <ListGroup key={idx}>
              <h4 className={styles.heading}>
                Notenschnitt{hasMultipleCourses && ` (${stg})`}
              </h4>

                <ListGroup.Item>
                  <span className={styles.gradeAverage}>{formatNum(average.result)}</span>
                  {average.entries.map((entry, jdx) =>
                    <>
                      {jdx !== 0 && <>
                        <span className={styles.spacer}></span>
                        {'+'}
                        <span className={styles.spacer}></span>
                      </>}
                      <OverlayTrigger
                        key={jdx}
                        placement="top"
                        overlay={
                          <Tooltip id={`${stg}-${jdx}`}>
                            {entry.name}
                          </Tooltip>
                        }
                      >
                        <Button variant="text">
                          {entry.weight
                            ? <b>{formatNum(entry.weight)}</b>
                            : <FontAwesomeIcon icon={faQuestionCircle} />
                          }
                          {' '}
                          <FontAwesomeIcon icon={faTimes} />
                          {' '}
                          {entry.grade
                            ? <b>{formatNum(entry.grade)}</b>
                            : <FontAwesomeIcon icon={faQuestion} />
                          }
                        </Button>
                      </OverlayTrigger>
                    </>
                  )}
                  <Button variant="link" onClick={() => copyFormula(average.entries)}>Formel kopieren</Button>
                </ListGroup.Item>
              </ListGroup>
            )}
          </ReactPlaceholder>
        )}

        <ListGroup>
          <h4 className={styles.heading}>
            Noten
          </h4>

          <ReactPlaceholder type="text" rows={10} ready={grades}>
            {grades && grades.map((item, idx) =>
              <ListGroup.Item key={idx} className={styles.item}>
                <div className={styles.left}>
                  {item.titel}{hasMultipleCourses && ` (${item.stg})`}<br />

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
