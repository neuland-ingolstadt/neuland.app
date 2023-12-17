import React, { useEffect, useState } from 'react'
import ReactPlaceholder from 'react-placeholder'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import {
  NoSessionError,
  UnavailableSessionError,
} from '../lib/backend/thi-session-handler'
import { loadGradeAverage, loadGrades } from '../lib/backend-utils/grades-utils'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

import { getAdjustedLocale } from '../lib/locale-utils'
import styles from '../styles/Grades.module.css'

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['grades', 'common'])),
  },
})

const GRADE_REGEX = /\d+[.,]\d+/

/**
 * Page showing the users grades.
 */
export default function Grades() {
  const router = useRouter()
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)
  const [gradeAverage, setGradeAverage] = useState(null)

  const { t } = useTranslation('grades')

  const formatNum = new Intl.NumberFormat(getAdjustedLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format

  function getLocalizedGrade(grade) {
    const match = grade.match(GRADE_REGEX)
    if (!match) {
      return grade
    }

    const num = parseFloat(match[0].replace(',', '.'))
    return grade
      .replace(match[0], formatNum(num))
      .replace(/\*/g, t('grades.credited'))
  }

  useEffect(() => {
    async function load() {
      try {
        const { finished, missing } = await loadGrades()
        setGrades(finished)
        setMissingGrades(missing)
        const average = await loadGradeAverage()
        setGradeAverage(average)
      } catch (e) {
        if (
          e instanceof NoSessionError ||
          e instanceof UnavailableSessionError
        ) {
          router.replace('/login?redirect=grades')
        } else if (e.message === 'Query not possible') {
          // according to the original developers,
          // { status: -102, data: "Query not possible" }
          // means that the transcripts are currently being updated

          console.error(e)
          alert(t('grades.alerts.temporarilyUnavailable'))
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [router, t])

  /**
   * Copies the formula for calculating the grade average to the users clipboard.
   */
  async function copyGradeFormula() {
    if (!gradeAverage) {
      return
    }

    const relevantEntries = gradeAverage.entries.filter(
      (curr) => curr.grade && curr.grade < 5
    )
    const weight = relevantEntries.reduce(
      (acc, curr) => acc + (curr.weight || 1),
      0
    )
    const inner = relevantEntries
      .map((entry) =>
        entry.weight && entry.weight !== 1
          ? `${entry.weight} * ${entry.grade}`
          : entry.grade.toString()
      )
      .join(' + ')

    await navigator.clipboard.writeText(`(${inner}) / ${weight}`)
    alert(t('grades.alerts.copyToClipboard'))
  }

  /**
   * Downloads the users grades as a CSV file.
   */
  function downloadGradeCSV() {
    alert(t('grades.alerts.notImplemented'))
  }

  /**
   * A spoiler component that hides its children until clicked.
   * @param {Object} props
   * @param {string} props.className
   * @param {React.ReactNode} props.children
   * @returns {React.ReactElement} The spoiler component.
   */
  function Spoiler({ className, children }) {
    const [show, setShow] = useState(false)

    function getStyle(visible) {
      return visible ? styles.spoilerVisible : styles.spoilerHidden
    }

    return (
      <ListGroup.Item
        className={`${styles.spoiler} ${className}`}
        onClick={() => setShow(!show)}
      >
        <div className={getStyle(show)}>{children}</div>

        <div className={`${styles.spoilerPlaceholder} ${getStyle(!show)}`}>
          {t('grades.spoiler.reveal')}
        </div>
      </ListGroup.Item>
    )
  }

  return (
    <AppContainer>
      <AppNavbar title={t('grades.appbar.title')}>
        <AppNavbar.Overflow>
          <AppNavbar.Overflow.Link
            variant="link"
            onClick={() => copyGradeFormula()}
          >
            {t('grades.appbar.overflow.copyFormula')}
          </AppNavbar.Overflow.Link>
          <AppNavbar.Overflow.Link
            variant="link"
            onClick={() => downloadGradeCSV()}
          >
            {t('grades.appbar.overflow.exportCsv')}
          </AppNavbar.Overflow.Link>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody>
        <ReactPlaceholder
          type="text"
          rows={3}
          ready={!!gradeAverage}
        >
          {gradeAverage && gradeAverage.entries.length > 0 && (
            <>
              <h4 className={styles.heading}>{t('grades.summary.title')}</h4>
              <ListGroup>
                <Spoiler className={styles.gradeAverageContainer}>
                  <span className={styles.gradeAverage}>
                    {gradeAverage.resultMin !== gradeAverage.resultMax && '~'}
                    {formatNum(gradeAverage.result)}
                  </span>

                  {gradeAverage.resultMin !== gradeAverage.resultMax && (
                    <span className={styles.gradeAverageDisclaimer}>
                      {t('grades.summary.disclaimer', {
                        minAverage: formatNum(gradeAverage.resultMin),
                        maxAverage: formatNum(gradeAverage.resultMax),
                      })}
                    </span>
                  )}
                </Spoiler>
              </ListGroup>
            </>
          )}
        </ReactPlaceholder>

        <h4 className={styles.heading}>{t('grades.gradesList.title')}</h4>
        <ListGroup>
          <ReactPlaceholder
            type="text"
            rows={10}
            ready={grades}
          >
            {grades &&
              grades.map((item, idx) => (
                <ListGroup.Item
                  key={idx}
                  className={styles.item}
                >
                  <div className={styles.left}>
                    {item.titel}
                    <br />
                    <small className={styles.details}>
                      {t('grades.ects')}: {item.ects || t('grades.none')}
                    </small>
                  </div>

                  <div className={styles.grade}>
                    {getLocalizedGrade(item.note)}
                    <br />
                    <small className={styles.details}>
                      {t('grades.grade')}
                    </small>
                  </div>
                </ListGroup.Item>
              ))}
          </ReactPlaceholder>
        </ListGroup>

        <h4 className={styles.heading}>{t('grades.pendingList.title')}</h4>
        <ListGroup>
          <ReactPlaceholder
            type="text"
            rows={10}
            ready={missingGrades}
          >
            {missingGrades &&
              missingGrades.map((item, idx) => (
                <ListGroup.Item
                  key={idx}
                  className={styles.item}
                >
                  <div className={styles.left}>
                    {item.titel} ({item.stg}) <br />
                    <div className={styles.details}>
                      <small>
                        {t('grades.deadline')}: {item.frist || t('grades.none')}
                        <br />
                        {t('grades.ects')}: {item.ects || t('grades.none')}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
          </ReactPlaceholder>
        </ListGroup>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
