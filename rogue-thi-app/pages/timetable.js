import React, { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import Link from 'next/link'
import { useRouter } from 'next/router'

import SwipeableViews from 'react-swipeable-views'
import { virtualize } from 'react-swipeable-views-utils'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { NoSessionError, UnavailableSessionError } from '../lib/backend/thi-session-handler'
import { OS_IOS, useOperatingSystem } from '../lib/hooks/os-hook'
import { addWeek, formatFriendlyTime, getFriendlyWeek, getWeek } from '../lib/date-utils'
import { getFriendlyTimetable, getTimetableEntryName } from '../lib/backend-utils/timetable-utils'

import styles from '../styles/Timetable.module.css'

import { Trans, i18n, useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

const VirtualizeSwipeableViews = virtualize(SwipeableViews)

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'timetable',
      'common'
    ]))
  }
})

/**
 * Groups timetable entries by date.
 * @param {object[]} timetable
 */
function groupTimetableEntries (timetable) {
  // get all available dates and remove duplicates
  const dates = timetable
    .map(x => x.datum)
    .filter((v, i, a) => a.indexOf(v) === i)

  // get events for each date
  const groups = dates.map(date => ({
    date,
    items: timetable.filter(x => x.datum === date)
  }))

  return groups
}

/**
 * Checks whether a date is today.
 * @param {Date} date
 * @returns {boolean}
 */
function isToday (date) {
  return new Date(date).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)
}

/**
 * Checks whether a date is in a particular week.
 * @param {Date} date
 * @param {Date} start Start of the week
 * @param {Date} end End of the week
 * @returns {boolean}
 */
function isInWeek (date, start, end) {
  date = new Date(date)
  return date > start && date < end
}

/**
 * Formats a day as a number.
 * @param {Date} date
 * @returns {string}
 */
function getDay (date) {
  return new Date(date).toLocaleDateString(i18n.language, { day: 'numeric' })
}

/**
 * Formats a weekday as an abbreviation like 'Fr'.
 * @param {Date} date
 * @returns {string}
 */
function getWeekday (date) {
  return new Date(date).toLocaleDateString(i18n.language, { weekday: 'short' })
}

/**
 * Page displaying the users timetable.
 */
export default function Timetable () {
  const { t } = useTranslation('timetable')

  const router = useRouter()
  const os = useOperatingSystem()
  const [timetable, setTimetable] = useState(null)
  const [focusedEntry, setFocusedEntry] = useState(null)
  const [isDetailedData, setIsDetailedData] = useState(false)
  const [showTimetableExplanation, setShowTimetableExplanation] = useState(false)
  const [showICalExplanation, setShowICalExplanation] = useState(false)

  // page (0 = current week)
  const [page, setPage] = useState(0)
  const [fetchedWeek, setFetchedWeek] = useState(null)

  const effectiveDate = useMemo(() => {
    const date = new Date()
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1)
    }
    return date
  }, [])

  // week for the caption
  const week = useMemo(() => {
    const [currStart, currEnd] = getWeek(effectiveDate)
    return [addWeek(currStart, page), addWeek(currEnd, page)]
  }, [page, effectiveDate])

  useEffect(() => {
    async function load (currWeek) {
      // we need to load data only if we have not done it yet or if we have no
      // detailed data but want to display an entry in detail
      if (currWeek === fetchedWeek && (!focusedEntry || isDetailedData)) {
        return
      }

      try {
        const detailed = !!focusedEntry
        const ungroupedData = await getFriendlyTimetable(currWeek, detailed)
        const groupedData = groupTimetableEntries(ungroupedData)
        setFetchedWeek(currWeek)
        setTimetable(groupedData)
        setIsDetailedData(detailed)

        if (focusedEntry) {
          // find the focused entry in the new data
          const detailedEntry = groupedData
            .map(group => group.items.find(x =>
              x.datum === focusedEntry.datum &&
              x.veranstaltung === focusedEntry.veranstaltung)
            )
            .find(x => x)

          if (detailedEntry) {
            setFocusedEntry(detailedEntry)
          } else {
            // just keep the old entry. The user wont see goals, content or literature
            console.error('could not find the focused timetable entry in new detailed data')
          }
        }
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=timetable')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load(week[0])
  }, [router, timetable, focusedEntry, isDetailedData, week, fetchedWeek])

  /**
   * Renderer for `react-swipeable-views` that displays the timetable for a particular week
   * @see {@link https://react-swipeable-views.com/api/api/#virtualize}
   */
  function timetableRenderer ({ key, index }) {
    const [start, end] = getWeek(effectiveDate).map(date => addWeek(date, index))
    const current = timetable && timetable.filter(group => isInWeek(group.date, start, end))

    return (
      <div key={key}>
        {current && current.map((group, idx) =>
          <div key={idx} className={`${styles.day} ${isToday(group.date) && styles.today}`}>
            <div className={`text-muted ${styles.heading}`}>
              <div className={styles.date}>
                {getDay(group.date)}
              </div>
              <div className={styles.weekday}>
                {getWeekday(group.date)}
              </div>
            </div>

            <ListGroup className={styles.items} variant="flush">
              {group.items.map((item, idx) =>
                <ListGroup.Item key={idx} className={styles.item} onClick={() => setFocusedEntry(item)} action>
                  <div className={styles.left}>
                    <div className={styles.name}>
                      {getTimetableEntryName(item).name}
                    </div>
                    <div className={styles.room}>
                      {item.rooms.map((room, i) => /^[A-Z](G|[0-9E]\.)?\d*$/.test(room)
                        ? <Link key={i} href={`/rooms?highlight=${room}`} onClick={e => e.stopPropagation()}>{room}</Link>
                        : <span key={i}>{room}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.right}>
                    {formatFriendlyTime(item.startDate)} <br />
                    {formatFriendlyTime(item.endDate)}
                  </div>
                </ListGroup.Item>
              )}
            </ListGroup>
          </div>
        )}
        {current && current.length === 0 &&
          <div className={`text-muted ${styles.notice}`}>
          <p>
            {t('timetable.overview.no_lectures')}
          </p>
          <p>
            <Trans
              i18nKey="timetable.overview.configure_timetable"
              ns="timetable"
              components={{ a: <a href="https://www3.primuss.de/stpl/login.php?FH=fhin&Lang=de"/> }}
            />
          </p>
          </div>
        }
      </div>
    )
  }

  function ExplanationListElement ({ i18nKey }) {
    return (
      <li>
        <Trans
          i18nKey={`timetable.modals.${i18nKey}`}
          ns="timetable"
          components={{ em: <em/> }}
        />
      </li>
    )
  }

  return (
    <AppContainer>
      <AppNavbar title={t('timetable.appbar.title')} showBack={'desktop-only'}>
        <AppNavbar.Overflow>
          <AppNavbar.Overflow.Link variant="link" onClick={() => setShowTimetableExplanation(true)}>
            {t('timetable.overflow.edit_lectures')}
          </AppNavbar.Overflow.Link>
          <AppNavbar.Overflow.Link variant="link" onClick={() => setShowICalExplanation(true)}>
            {t('timetable.overflow.subscribe_calendar')}
          </AppNavbar.Overflow.Link>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody>
        <Modal size="lg" show={showTimetableExplanation} onHide={() => setShowTimetableExplanation(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{t('timetable.modals.timetable_explanation.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {t('timetable.modals.timetable_explanation.body.header')}
            <ul>
              <ExplanationListElement i18nKey="timetable_explanation.body.login"/>
              <ExplanationListElement i18nKey="timetable_explanation.body.subjects"/>
              <ExplanationListElement i18nKey="timetable_explanation.body.course_of_studies"/>
              <ExplanationListElement i18nKey="timetable_explanation.body.study_groups"/>
              <ExplanationListElement i18nKey="timetable_explanation.body.semester_group"/>
              <ExplanationListElement i18nKey="timetable_explanation.body.click_on_study"/>
              <ExplanationListElement i18nKey="timetable_explanation.body.select_subjects"/>
            </ul>

            {/* TODO: Video? */}
          </Modal.Body>
          <Modal.Footer>
            <a href="https://www3.primuss.de/stpl/login.php?FH=fhin&Lang=de" target="_blank" rel="noreferrer">
              <Button variant="primary">
                {t('timetable.modals.timetable_explanation.actions.to_my_timetable')}
              </Button>
            </a>
            <Button variant="secondary" onClick={() => setShowTimetableExplanation(false)}>
              {t('timetable.modals.timetable_explanation.actions.close')}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal size="lg" show={showICalExplanation} onHide={() => setShowICalExplanation(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{t('timetable.modals.subscription_explanation.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              {t('timetable.modals.subscription_explanation.body.header')}
            </p>
            <p>
            {t('timetable.modals.subscription_explanation.body.url')}
              <ul>
                <ExplanationListElement i18nKey="subscription_explanation.body.login" />
                <ExplanationListElement i18nKey="subscription_explanation.body.timetable" />
                <ExplanationListElement i18nKey="subscription_explanation.body.external_calendar" />
                <ExplanationListElement i18nKey="subscription_explanation.body.subscribe" />
              </ul>
            </p>
            {os === OS_IOS &&
              <p>
                {t('timetable.modals.subscription_explanation.body.ios.header')}
                <ul>
                  <ExplanationListElement i18nKey="subscription_explanation.body.ios.open_settings" />
                  <ExplanationListElement i18nKey="subscription_explanation.body.ios.add_calendar_subscription" />
                  <ExplanationListElement i18nKey="subscription_explanation.body.ios.paste_url" />
                  <ExplanationListElement i18nKey="subscription_explanation.body.ios.save" />
                </ul>
              </p>
            }
          </Modal.Body>
          <Modal.Footer>
            <a href="https://www3.primuss.de/stpl/login.php?FH=fhin&Lang=de" target="_blank" rel="noreferrer">
              <Button variant="primary">
                {t('timetable.modals.subscription_explanation.actions.to_my_timetable')}
              </Button>
            </a>
            <Button variant="secondary" onClick={() => setShowICalExplanation(false)}>
              {t('timetable.modals.subscription_explanation.actions.close')}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal size="lg" show={!!focusedEntry} onHide={() => setFocusedEntry(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{focusedEntry && getTimetableEntryName(focusedEntry).name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>{t('timetable.modals.lecture_details.general')}</h5>
            <p>
              <strong>{t('timetable.modals.lecture_details.lecturer')}</strong>: {focusedEntry && focusedEntry.dozent}<br />
              <strong>{t('timetable.modals.lecture_details.abbreviation')}</strong>: {focusedEntry && getTimetableEntryName(focusedEntry).shortName}<br />
              <strong>{t('timetable.modals.lecture_details.exam')}</strong>: {focusedEntry && focusedEntry.pruefung}<br />
              <strong>{t('timetable.modals.lecture_details.course_of_studies')}</strong>: {focusedEntry && focusedEntry.stg}<br />
              <strong>{t('timetable.modals.lecture_details.study_group')}</strong>: {focusedEntry && focusedEntry.stgru}<br />
              <strong>{t('timetable.modals.lecture_details.semester_weekly_hours')}</strong>: {focusedEntry && focusedEntry.sws}<br />
              <strong>{t('timetable.modals.lecture_details.ects')}</strong>: {focusedEntry && focusedEntry.ectspoints}<br />
            </p>

            <h5>{t('timetable.modals.lecture_details.goal')}</h5>
            <ReactPlaceholder type="text" rows={5} ready={isDetailedData}>
              {focusedEntry && focusedEntry.ziel && (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.ziel) }}></div>
              )}
              {focusedEntry && !focusedEntry.ziel && (
                <p>{t('timetable.modals.lecture_details.not_specified')}</p>
              )}
            </ReactPlaceholder>

            <h5>{t('timetable.modals.lecture_details.content')}</h5>
            <ReactPlaceholder type="text" rows={5} ready={isDetailedData}>
              {focusedEntry && focusedEntry.inhalt && (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.inhalt) }}></div>
              )}
              {focusedEntry && !focusedEntry.inhalt && (
                <p>{t('timetable.modals.lecture_details.not_specified')}</p>
              )}
            </ReactPlaceholder>

            <h5>{t('timetable.modals.lecture_details.literature')}</h5>
            <ReactPlaceholder type="text" rows={5} ready={isDetailedData}>
              {focusedEntry && focusedEntry.literatur && (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.literatur) }}></div>
              )}
              {focusedEntry && !focusedEntry.literatur && (
                <p>{t('timetable.modals.lecture_details.not_specified')}</p>
              )}
            </ReactPlaceholder>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setFocusedEntry(null)}>
              {t('timetable.modals.lecture_details.actions.close')}
            </Button>
          </Modal.Footer>
        </Modal>

        <div className={styles.weekSelector}>
          <Button className={styles.prevWeek} variant="link" onClick={() => setPage(idx => idx - 1)}>
            <FontAwesomeIcon title="Woche zurück" icon={faChevronLeft} />
          </Button>
          <div className={styles.currentWeek}>
            {getFriendlyWeek(week[0])}
          </div>
          <Button className={styles.nextWeek} variant="link" onClick={() => setPage(idx => idx + 1)}>
            <FontAwesomeIcon title="Woche vor" icon={faChevronRight} />
          </Button>
        </div>

        <ReactPlaceholder type="text" rows={20} ready={timetable}>
          <VirtualizeSwipeableViews
            className={styles.slide}
            slideRenderer={timetableRenderer}
            index={page}
            onChangeIndex={idx => setPage(idx)}
          />
        </ReactPlaceholder>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
