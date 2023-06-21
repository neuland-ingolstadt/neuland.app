import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

import SwipeableTabs, { SwipeableTab } from '../components/SwipeableTabs'
import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { USER_GUEST, USER_STUDENT, useUserKind } from '../lib/hooks/user-kind'
import { calendar, loadExamList } from '../lib/backend-utils/calendar-utils'
import {
  formatFriendlyDateRange,
  formatFriendlyDateTime,
  formatFriendlyDateTimeRange,
  formatFriendlyRelativeTime
} from '../lib/date-utils'
import { NoSessionError } from '../lib/backend/thi-session-handler'
import { useTime } from '../lib/hooks/time-hook'

import styles from '../styles/Calendar.module.css'

import { Trans, useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

/**
 * Page containing the semester and exam dates.
 */
export default function Calendar () {
  const router = useRouter()
  const now = useTime()
  const [exams, setExams] = useState(null)
  const [focusedExam, setFocusedExam] = useState(null)
  const userKind = useUserKind()

  const { i18n, t } = useTranslation('calendar')

  useEffect(() => {
    async function load () {
      try {
        const examList = await loadExamList()
        setExams(examList)
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login?redirect=calendar')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }

    if (userKind === USER_STUDENT) {
      load()
    }
  }, [router, userKind])

  function InformationNotice () {
    return (
      <Trans
        i18nKey="calendar.notice"
        ns="calendar"
        components={{
          a: i18n.languages[0] === 'de' ? <a href="https://www.thi.de/studium/pruefung/semestertermine/" target="_blank" rel="noreferrer"/> : <a href="https://www.thi.de/en/international/studies/examination/semester-dates/" target="_blank" rel="noreferrer"/>
        }}
      />
    )
  }

  return (
    <AppContainer>
      <AppNavbar title={t('calendar.appbar.title')} />

      <AppBody className={styles.container}>
        <Modal show={!!focusedExam} onHide={() => setFocusedExam(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{focusedExam && focusedExam.titel}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <strong>{t('calendar.modals.exams.type')}</strong>: {focusedExam && focusedExam.pruefungs_art}<br />
            <strong>{t('calendar.modals.exams.room')}</strong>: {focusedExam && (focusedExam.exam_rooms || 'TBD')}<br />
            <strong>{t('calendar.modals.exams.seat')}</strong>: {focusedExam && (focusedExam.exam_seat || 'TBD')}<br />
            <strong>{t('calendar.modals.exams.date')}</strong>: {focusedExam && (focusedExam.date ? formatFriendlyDateTime(focusedExam.date) : 'TBD')}<br />
            <strong>{t('calendar.modals.exams.notes')}</strong>: {focusedExam && focusedExam.anmerkung}<br />
            <strong>{t('calendar.modals.exams.examiner')}</strong>: {focusedExam && focusedExam.pruefer_namen}<br />
            <strong>{t('calendar.modals.exams.course_of_studies')}</strong>: {focusedExam && focusedExam.stg}<br />
            <strong>{t('calendar.modals.exams.register_date')}</strong>: {focusedExam && formatFriendlyDateTime(focusedExam.anmeldung)}<br />
            <strong>{t('calendar.modals.exams.tools')}</strong>:
              <ul>
                {focusedExam && focusedExam.allowed_helpers.map((helper, i) =>
                <li key={i}>{helper}</li>)}
              </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setFocusedExam(null)}>
              {t('calendar.modals.exams.actions.close')}
            </Button>
          </Modal.Footer>
        </Modal>

        <SwipeableTabs>
          <SwipeableTab className={styles.tab} title={t('calendar.tabs.semester')}>
            <ListGroup variant="flush">
              {calendar.map((item, idx) =>
                <ListGroup.Item key={idx} className={styles.item}>
                  <div className={styles.left}>
                    {!item.url && item.name}
                    {item.url && (
                      <a href={item.url} className={styles.eventUrl} target="_blank" rel="noreferrer">
                        {item.name}
                        {' '}
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                      </a>
                    )}
                    <br />
                    <div className={styles.details}>
                      {item.hasHours
                        ? formatFriendlyDateTimeRange(item.begin, item.end)
                        : formatFriendlyDateRange(item.begin, item.end)}
                    </div>
                  </div>
                  <div className={styles.details}>
                    {(item.end && item.begin < now)
                      ? `${t('calendar.dates.until')} ${formatFriendlyRelativeTime(item.end)}`
                      : formatFriendlyRelativeTime(item.begin)}
                  </div>
                </ListGroup.Item>
              )}
            </ListGroup>
            <div className="text-muted">
              <small>
                <InformationNotice />
              </small>
            </div>
          </SwipeableTab>

          <SwipeableTab className={styles.tab} title={t('calendar.tabs.exams')}>
            <ListGroup variant="flush">
              <ReactPlaceholder type="text" rows={4} ready={exams || userKind === USER_GUEST}>
                {exams && exams.length === 0 && (
                  <ListGroup.Item>
                    {t('calendar.no_exams')}
                  </ListGroup.Item>
                )}
                {exams && exams.map((item, idx) =>
                  <ListGroup.Item key={idx} className={styles.item} action onClick={() => setFocusedExam(item)}>
                    <div className={styles.left}>
                      {item.titel} ({item.stg})<br />

                      <div className={styles.details}>
                        {item.date && <>
                          {formatFriendlyDateTime(item.date)}
                          {' '}({formatFriendlyRelativeTime(item.date)})
                          <br />
                        </>}
                        {t('calendar.modals.exams.room')}: {item.exam_rooms || 'TBD'}<br />
                        {item.exam_seat && `${t('calendar.modals.exams.seat')}: ${item.exam_seat}`}
                      </div>
                    </div>
                  </ListGroup.Item>
                )}
                {userKind === USER_GUEST && (
                  <ListGroup.Item>
                    {t('calendar.guest_notice')}
                  </ListGroup.Item>
                )}
              </ReactPlaceholder>
            </ListGroup>
            <div className="text-muted">
              <small>
                <InformationNotice />
              </small>
            </div>
          </SwipeableTab>
        </SwipeableTabs>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'calendar',
      'common'
    ]))
  }
})
