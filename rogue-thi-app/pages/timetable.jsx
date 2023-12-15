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
import { getRoomAvailability } from '../lib/backend-utils/rooms-utils'

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

import { Trans, useTranslation } from 'next-i18next'
import { getAdjustedLocale } from '../lib/locale-utils'
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
    .map(x => x.date)
    .filter((v, i, a) => a.indexOf(v) === i)

  // get events for each date
  const groups = dates.map(date => ({
    date,
    items: timetable.filter(x => x.date === date)
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
  return new Date(date).toLocaleDateString(getAdjustedLocale(), { day: 'numeric' })
}

/**
 * Formats a weekday as an abbreviation like 'Fr'.
 * @param {Date} date
 * @returns {string}
 */
function getWeekday (date) {
  return new Date(date).toLocaleDateString(getAdjustedLocale(), { weekday: 'short' })
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
  const [roomAvailabilityList, setRoomAvailabilityList] = useState({})

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

  if (Object.keys(roomAvailabilityList).length === 0) {
    loadRoomAvailability()
  }

  async function loadRoomAvailability () {
    const roomAvailabilityData = await getRoomAvailability()

    const roomAvailabilityList = Object.fromEntries(Object.entries(roomAvailabilityData).map(([room, openings]) => {
      const availability = openings
        .filter(opening =>
          new Date(opening.until) > new Date()
        )
      return [room, availability]
    }))

    setRoomAvailabilityList(roomAvailabilityList)
  }

  let roomAvailabilityTextCount = 0
  function roomAvailabilityText (room, lessonStart, lessonEnd) {
    const availForm = roomAvailabilityList?.[room]?.[0]?.['from']
    const availUntil = roomAvailabilityList?.[room]?.[0]?.['until']

    if (availForm && availUntil &&
      lessonStart > new Date() && // only if the information is still relevant
      roomAvailabilityTextCount === 0 // show only one information
    ) {
      roomAvailabilityTextCount++
      const availFormDate = availForm
      let availUntilDate = availUntil
      if (new Date(availUntil) - -10 * 60 * 1000 === lessonStart - 0) { // 10min offset bug fix
        availUntilDate = new Date(availUntil - -10 * 60 * 1000)
      }

      if (availFormDate > lessonStart) {
        return ` ${t('timetable.freeAtLectureStart')}`
      } else if (availFormDate > new Date()) {
        return ` ${t('timetable.availableFrom')} ${formatFriendlyTime(availFormDate)}`
      } else if (availUntilDate.getTime() === lessonStart.getTime()) {
        return ` ${t('timetable.alreadyAvailable')}`
      } else {
        return ` ${t('timetable.availableUntil')} ${formatFriendlyTime(availUntilDate)}`
      }
    } else {
      return ''
    }
  }

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
                      {item.rooms.map((room, i, array) => (
                        <>
                          {/^[A-Z](G|[0-9E]\.)?\d*$/.test(room)
                            ? (
                              <Link key={i} href={`/rooms?highlight=${room}`}>
                                <a onClick={(e) => e.stopPropagation()}>{room}</a>
                              </Link>
                            )
                            : (
                              <span key={i}>{room}</span>
                            )}
                          {isToday(group.date) && roomAvailabilityText(room, item.startDate, item.endDate)}
                          {i < array.length - 1 && ' '}
                        </>
                      ))}
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
              {t('timetable.overview.noLectures')}
            </p>
            <p>
              <Trans
                i18nKey="timetable.overview.configureTimetable"
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
            {t('timetable.overflow.editLectures')}
          </AppNavbar.Overflow.Link>
          <AppNavbar.Overflow.Link variant="link" onClick={() => setShowICalExplanation(true)}>
            {t('timetable.overflow.subscribeCalendar')}
          </AppNavbar.Overflow.Link>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody>
        <Modal size="lg" show={showTimetableExplanation} onHide={() => setShowTimetableExplanation(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{t('timetable.modals.timetableExplanation.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {t('timetable.modals.timetableExplanation.body.header')}
            <ul>
              <ExplanationListElement i18nKey="timetableExplanation.body.login"/>
              <ExplanationListElement i18nKey="timetableExplanation.body.subjects"/>
              <ExplanationListElement i18nKey="timetableExplanation.body.courseOfStudies"/>
              <ExplanationListElement i18nKey="timetableExplanation.body.studyGroups"/>
              <ExplanationListElement i18nKey="timetableExplanation.body.semesterGroup"/>
              <ExplanationListElement i18nKey="timetableExplanation.body.clickOnStudy"/>
              <ExplanationListElement i18nKey="timetableExplanation.body.selectSubjects"/>
            </ul>

            {/* TODO: Video? */}
          </Modal.Body>
          <Modal.Footer>
            <a href="https://www3.primuss.de/stpl/login.php?FH=fhin&Lang=de" target="_blank" rel="noreferrer">
              <Button variant="primary">
                {t('timetable.modals.timetableExplanation.actions.toMyTimetable')}
              </Button>
            </a>
            <Button variant="secondary" onClick={() => setShowTimetableExplanation(false)}>
              {t('timetable.modals.timetableExplanation.actions.close')}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal size="lg" show={showICalExplanation} onHide={() => setShowICalExplanation(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{t('timetable.modals.subscriptionExplanation.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              {t('timetable.modals.subscriptionExplanation.body.header')}
            </p>
            <p>
              {t('timetable.modals.subscriptionExplanation.body.url')}
              <ul>
                <ExplanationListElement i18nKey="subscriptionExplanation.body.login" />
                <ExplanationListElement i18nKey="subscriptionExplanation.body.timetable" />
                <ExplanationListElement i18nKey="subscriptionExplanation.body.externalCalendar" />
                <ExplanationListElement i18nKey="subscriptionExplanation.body.subscribe" />
              </ul>
            </p>
            {os === OS_IOS &&
              <p>
                {t('timetable.modals.subscriptionExplanation.body.ios.header')}
                <ul>
                  <ExplanationListElement i18nKey="subscriptionExplanation.body.ios.openSettings" />
                  <ExplanationListElement i18nKey="subscriptionExplanation.body.ios.addCalendarSubscription" />
                  <ExplanationListElement i18nKey="subscriptionExplanation.body.ios.pasteUrl" />
                  <ExplanationListElement i18nKey="subscriptionExplanation.body.ios.save" />
                </ul>
              </p>
            }
          </Modal.Body>
          <Modal.Footer>
            <a href="https://www3.primuss.de/stpl/login.php?FH=fhin&Lang=de" target="_blank" rel="noreferrer">
              <Button variant="primary">
                {t('timetable.modals.subscriptionExplanation.actions.toMyTimetable')}
              </Button>
            </a>
            <Button variant="secondary" onClick={() => setShowICalExplanation(false)}>
              {t('timetable.modals.subscriptionExplanation.actions.close')}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal size="lg" show={!!focusedEntry} onHide={() => setFocusedEntry(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{focusedEntry && getTimetableEntryName(focusedEntry).name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>{t('timetable.modals.lectureDetails.general')}</h5>
            <p>
              <strong>{t('timetable.modals.lectureDetails.lecturer')}</strong>: {focusedEntry && focusedEntry.lecturer}<br />
              <strong>{t('timetable.modals.lectureDetails.abbreviation')}</strong>: {focusedEntry && getTimetableEntryName(focusedEntry).shortName}<br />
              <strong>{t('timetable.modals.lectureDetails.exam')}</strong>: {focusedEntry && focusedEntry.exam}<br />
              <strong>{t('timetable.modals.lectureDetails.courseOfStudies')}</strong>: {focusedEntry && focusedEntry.course}<br />
              <strong>{t('timetable.modals.lectureDetails.studyGroup')}</strong>: {focusedEntry && focusedEntry.studyGroup}<br />
              <strong>{t('timetable.modals.lectureDetails.semesterWeeklyHours')}</strong>: {focusedEntry && focusedEntry.sws}<br />
              <strong>{t('timetable.modals.lectureDetails.ects')}</strong>: {focusedEntry && focusedEntry.ects}<br />
            </p>

            <h5>{t('timetable.modals.lectureDetails.goal')}</h5>
            <ReactPlaceholder type="text" rows={5} ready={isDetailedData}>
              {focusedEntry && focusedEntry.objective && (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.objective) }}></div>
              )}
              {focusedEntry && !focusedEntry.objective && (
                <p>{t('timetable.modals.lectureDetails.notSpecified')}</p>
              )}
            </ReactPlaceholder>

            <h5>{t('timetable.modals.lectureDetails.content')}</h5>
            <ReactPlaceholder type="text" rows={5} ready={isDetailedData}>
              {focusedEntry && focusedEntry.contents && (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.contents) }}></div>
              )}
              {focusedEntry && !focusedEntry.contents && (
                <p>{t('timetable.modals.lectureDetails.notSpecified')}</p>
              )}
            </ReactPlaceholder>

            <h5>{t('timetable.modals.lectureDetails.literature')}</h5>
            <ReactPlaceholder type="text" rows={5} ready={isDetailedData}>
              {focusedEntry && focusedEntry.literature && (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.literature) }}></div>
              )}
              {focusedEntry && !focusedEntry.literature && (
                <p>{t('timetable.modals.lectureDetails.notSpecified')}</p>
              )}
            </ReactPlaceholder>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setFocusedEntry(null)}>
              {t('timetable.modals.lectureDetails.actions.close')}
            </Button>
          </Modal.Footer>
        </Modal>

        <div className={styles.weekSelector}>
          <Button className={styles.prevWeek} variant="link" onClick={() => setPage(idx => idx - 1)}>
            <FontAwesomeIcon title={t('timetable.weekSelection.weekBack')} icon={faChevronLeft} />
          </Button>
          <div className={styles.currentWeek}>
            {getFriendlyWeek(week[0])}
          </div>
          <Button className={styles.nextWeek} variant="link" onClick={() => setPage(idx => idx + 1)}>
            <FontAwesomeIcon title={t('timetable.weekSelection.weekForward')} icon={faChevronRight} />
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
