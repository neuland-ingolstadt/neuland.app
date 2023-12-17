import React, { useEffect, useState } from 'react'

import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import {
  faExternalLink,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import {
  formatFriendlyDateTimeRange,
  formatFriendlyRelativeTime,
} from '../lib/date-utils'
import NeulandAPI from '../lib/backend/neuland-api'
import { useTime } from '../lib/hooks/time-hook'

import styles from '../styles/Calendar.module.css'

import clubs from '../data/clubs.json'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['events', 'common'])),
  },
})

/**
 * Page containing the CL events.
 */
export default function Events() {
  const now = useTime()
  const [events, setEvents] = useState(null)

  const { t } = useTranslation('events')

  useEffect(() => {
    async function load() {
      const campusLifeEvents = await NeulandAPI.getCampusLifeEvents()

      const newEvents = campusLifeEvents
        .map((x) => ({
          ...x,
          begin: x.begin ? new Date(x.begin) : null,
          end: x.end ? new Date(x.end) : null,
        }))
        .filter((x) => x.end === null || x.end > new Date())

      setEvents(newEvents)
    }
    load()
  }, [])

  return (
    <AppContainer>
      <AppNavbar title={t('events.appbar.title')} />

      <AppBody className={styles.container}>
        <ListGroup variant="flush">
          <ReactPlaceholder
            type="text"
            rows={10}
            ready={events}
          >
            {events && events.length === 0 && (
              <ListGroup.Item className={styles.item}>
                {t('events.noEvents')}
              </ListGroup.Item>
            )}
            {events &&
              events.map((item, idx) => {
                const club = clubs.find((club) => club.club === item.organizer)
                return (
                  <ListGroup.Item
                    key={idx}
                    className={styles.item}
                  >
                    <div className={styles.left}>
                      {!item.url && item.title}
                      {item.url && (
                        <a
                          href={item.url}
                          className={styles.eventUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.title}{' '}
                          <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </a>
                      )}
                      <div className={styles.details}>
                        <span>
                          {club != null && (
                            <>
                              {club.website != null && (
                                <a
                                  href={club.website}
                                  className={styles.eventUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {item.organizer}{' '}
                                  <FontAwesomeIcon
                                    icon={faExternalLink}
                                    fixedWidth
                                  />
                                </a>
                              )}
                              {club.instagram != null && (
                                <a
                                  href={club.instagram}
                                  className={styles.eventUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FontAwesomeIcon
                                    icon={faInstagram}
                                    fixedWidth
                                  />
                                </a>
                              )}
                            </>
                          )}
                          {club == null && <>{item.organizer}</>}
                        </span>
                        <br />
                        {item.begin &&
                          formatFriendlyDateTimeRange(item.begin, item.end)}
                      </div>
                    </div>
                    <div className={styles.details}>
                      {item.end && item.begin < now
                        ? `${t(
                            'events.dates.until'
                          )} ${formatFriendlyRelativeTime(item.end)}`
                        : formatFriendlyRelativeTime(item.begin)}
                    </div>
                  </ListGroup.Item>
                )
              })}
          </ReactPlaceholder>
        </ListGroup>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
