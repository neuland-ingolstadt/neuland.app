import React, { useEffect, useMemo, useState } from 'react'

import ListGroup from 'react-bootstrap/ListGroup'

import {
  Calendar,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  ExternalLink,
  Globe,
  Instagram,
  MapPin,
  Users,
} from 'lucide-react'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import {
  formatFriendlyDateTimeRange,
  formatFriendlyRelativeTime,
  getLocalizedWeekday,
} from '../lib/date-utils'
import NeulandAPI from '../lib/backend/neuland-api'
import { useTime } from '../lib/hooks/time-hook'

import styles from '../styles/Calendar.module.css'

import SwipeableTabs, { SwipeableTab } from '../components/SwipeableTabs'
import Button from 'react-bootstrap/Button'
import Link from 'next/link'
import Modal from 'react-bootstrap/Modal'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { useUserKind } from '../lib/hooks/user-kind'

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const TABS = ['events', 'sports']
const CAMPUSES = ['Ingolstadt', 'Neuburg']

export const getServerSideProps = async ({ locale }) => {
  const initialCampusEvents = await NeulandAPI.getCampusLifeEvents()
  const sportsEvents = await NeulandAPI.getUniversitySports()

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'events'])),
      initialCampusEvents: initialCampusEvents.clEvents,
      sportsEvents: sportsEvents.universitySports.sort((a, b) => {
        return WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday)
      }),
    },
  }
}

/**
 * Page containing the CL events.
 */
export default function Events({ initialCampusEvents, sportsEvents }) {
  const now = useTime()
  const router = useRouter()

  const tab = router.query.tab || TABS[0]
  const defaultPage = TABS.indexOf(tab) || 0

  const { userCampus } = useUserKind()

  const [filterCampus, setFilterCampus] = useState(userCampus)
  useEffect(() => {
    setFilterCampus(userCampus)
  }, [userCampus])

  const [focusedSport, setFocusedSport] = useState(null)

  const campusLifeEvents = useMemo(() => {
    return initialCampusEvents
      .map((x) => ({
        ...x,
        begin: x.begin ? new Date(Number(x.begin)) : null,
        end: x.end ? new Date(Number(x.end)) : null,
      }))
      .filter((x) => x.end === null || x.end > new Date())
  }, [initialCampusEvents])

  const weekdaySports = useMemo(
    () =>
      sportsEvents.reduce((acc, event) => {
        if (event.campus !== filterCampus) {
          return acc
        }

        if (!acc[event.weekday]) {
          acc[event.weekday] = []
        }
        acc[event.weekday].push({
          ...event,
          startTime: event.startTime.split(':').slice(0, 2).join(':'),
          endTime: event.endTime?.split(':').slice(0, 2).join(':'),
        })
        return acc
      }, {}),
    [sportsEvents, filterCampus]
  )

  const { i18n, t } = useTranslation('events')
  const locale = useMemo(() => i18n.languages[0], [i18n])

  return (
    <AppContainer>
      <AppNavbar title={t('events.appbar.title')} />

      {/* SPORTS DETAILS MODAL */}
      <Modal
        show={!!focusedSport}
        onHide={() => setFocusedSport(null)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {focusedSport && focusedSport.title[locale]}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <strong>{t('events.sports.modal.details.weekday')}</strong>
          <p>{focusedSport && getLocalizedWeekday(focusedSport.weekday)}</p>

          <strong>{t('events.sports.modal.details.time')}</strong>
          <p>
            {focusedSport && focusedSport.startTime}
            {focusedSport &&
              focusedSport.endTime &&
              ` - ${focusedSport.endTime}`}
          </p>

          <strong>{t('events.sports.modal.details.location')}</strong>
          <p>{focusedSport && focusedSport.location}</p>
          {focusedSport && focusedSport.description[locale] && (
            <>
              <strong>{t('events.sports.modal.details.description')}</strong>
              <p className={styles.description}>
                {focusedSport.description[locale]}
              </p>
            </>
          )}

          <h4 className={styles.modalHeader}>
            {t('events.sports.modal.registration.header')}
          </h4>
          {focusedSport && (
            <span className={styles.registration}>
              {focusedSport && focusedSport.requiresRegistration ? (
                <>
                  <CircleAlert
                    size={16}
                    className={styles.required}
                  />
                  <span>{t('events.sports.modal.registration.required')}</span>
                </>
              ) : (
                <>
                  <CircleCheck
                    size={16}
                    className={styles.notRequired}
                  />
                  <span>
                    {t('events.sports.modal.registration.notRequired')}
                  </span>
                </>
              )}
            </span>
          )}

          {focusedSport && focusedSport.eMail && (
            <>
              <strong>{t('events.sports.modal.registration.email')}</strong>
              <p>
                <Link
                  href={`mailto:${focusedSport.eMail}`}
                  rel="noreferrer"
                  className={styles.item}
                >
                  {focusedSport.eMail.toLowerCase()}
                </Link>
              </p>
            </>
          )}

          {focusedSport && focusedSport.invitationLink && (
            <>
              <strong>
                {t('events.sports.modal.registration.invitationLink')}
              </strong>
              <p>
                <a
                  href={focusedSport.invitationLink}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.item}
                >
                  {focusedSport.invitationLink} <ExternalLink size={16} />
                </a>
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setFocusedSport(null)}
          >
            {t('events.sports.modal.close')}
          </Button>
        </Modal.Footer>
      </Modal>

      <AppBody className={styles.container}>
        <SwipeableTabs
          defaultPage={defaultPage}
          onPageChange={(idx) => router.replace(`/events?tab=${TABS[idx]}`)}
        >
          <SwipeableTab
            className={styles.tab}
            title={t('events.events.tab')}
          >
            <ListGroup variant="flush">
              {campusLifeEvents && campusLifeEvents.length === 0 && (
                <ListGroup.Item className={styles.item}>
                  {t('events.events.noEvents')}
                </ListGroup.Item>
              )}
              {campusLifeEvents &&
                campusLifeEvents.map((item, idx) => {
                  return (
                    <ListGroup.Item
                      key={idx}
                      className={styles.item}
                    >
                      <div className={styles.left}>
                        {!item.url && item.title[locale]}
                        {item.url && (
                          <a
                            href={item.url}
                            className={styles.eventUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.title} <ExternalLink size={16} />
                          </a>
                        )}
                        <div className={styles.details}>
                          <span className={styles.eventDetails}>
                            {item.host != null ? (
                              <>
                                {item.host.name != null && (
                                  <a
                                    href={item.host.website}
                                    className={styles.eventUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Users size={16} />
                                    {` ${item.host.name} `}
                                  </a>
                                )}
                              </>
                            ) : (
                              item.host &&
                              item.host.name != null && (
                                <>
                                  <Users
                                    size={16}
                                    className={styles.icon}
                                  />
                                  {item.host.name}
                                </>
                              )
                            )}
                          </span>

                          {item.begin && (
                            <span className={styles.eventDetails}>
                              <Calendar
                                size={16}
                                className={styles.icon}
                              />
                              {formatFriendlyDateTimeRange(
                                item.begin,
                                item.end
                              )}
                            </span>
                          )}

                          {item.location && (
                            <span className={styles.eventDetails}>
                              <MapPin
                                size={16}
                                className={styles.icon}
                              />
                              {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`${styles.details} ${styles.rightDetails}`}
                      >
                        {item.end && item.begin < now
                          ? `${t(
                              'events.dates.until'
                            )} ${formatFriendlyRelativeTime(item.end)}`
                          : formatFriendlyRelativeTime(item.begin)}

                        <span style={{ flex: 1 }}></span>
                        <span className={styles.socials}>
                          {item.host != null && item.host.website != null && (
                            <a
                              href={item.host.website}
                              className={styles.eventUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Globe size={20} />
                            </a>
                          )}
                          {item.host != null && item.host.instagram != null && (
                            <a
                              href={item.host.instagram}
                              className={styles.eventUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Instagram size={20} />
                            </a>
                          )}
                        </span>
                      </div>
                    </ListGroup.Item>
                  )
                })}
            </ListGroup>
          </SwipeableTab>

          <SwipeableTab
            className={styles.tab}
            title={t('events.sports.tab')}
          >
            <div>
              <strong>{t('events.sports.filterByCampus')}</strong>
              <div className={styles.campusFilter}>
                {CAMPUSES.map((campus, idx) => (
                  <Button
                    key={idx}
                    onClick={() => setFilterCampus(campus)}
                    variant={
                      filterCampus === campus
                        ? 'secondary'
                        : 'outline-secondary'
                    }
                  >
                    {campus}
                  </Button>
                ))}
              </div>
            </div>

            <ListGroup variant="flush">
              {sportsEvents && sportsEvents.length === 0 && (
                <ListGroup.Item className={styles.item}>
                  {t('events.sports.noSports')}
                </ListGroup.Item>
              )}
              {Object.entries(weekdaySports).map(([weekday, sports], idx) => (
                <ListGroup.Item key={idx}>
                  <div className={styles.item}>
                    <Calendar
                      size={16}
                      className={styles.icon}
                    />
                    <strong>{getLocalizedWeekday(weekday)}</strong>
                  </div>
                  <ListGroup variant="flush">
                    {sports.map((item, idx) => (
                      <ListGroup.Item
                        key={idx}
                        className={`${styles.item} ${styles.sportsItem}`}
                        onClick={() => setFocusedSport(item)}
                      >
                        <div className={styles.left}>
                          {item.title[locale]}
                          <div className={styles.details}>
                            <span
                              className={`${styles.eventDetails} ${styles.location}`}
                            >
                              <MapPin
                                size={14}
                                className={styles.icon}
                              />
                              <span>{item.location}</span>
                            </span>

                            <span className={styles.eventDetails}>
                              <Clock
                                size={14}
                                className={styles.icon}
                              />
                              {item.startTime}

                              {item.endTime && <>{` - ${item.endTime}`}</>}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`${styles.details} ${styles.rightDetails}`}
                        >
                          <ChevronRight size={18} />
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </SwipeableTab>
        </SwipeableTabs>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
