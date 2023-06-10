import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import { faArrowRight, faCalendar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import { NoSessionError, UnavailableSessionError } from '../../lib/backend/thi-session-handler'
import { formatFriendlyTime, isSameDay } from '../../lib/date-utils'

import { findSuggestedRooms, getEmptySuggestions } from '../../lib/backend-utils/rooms-utils'

import styles from '../../styles/RoomsSearch.module.css'

import { USER_GUEST, useUserKind } from '../../lib/hooks/user-kind'
import { getFriendlyTimetable, getTimetableEntryName, getTimetableGaps } from '../../lib/backend-utils/timetable-utils'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import { Trans, useTranslation } from 'next-i18next'

const TUX_ROOMS = ['G308']

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'rooms',
      'common'
    ]))
  }
})

/**
 * Page containing the room search.
 */
export default function RoomSearch () {
  const router = useRouter()

  const [suggestions, setSuggestions] = useState(null)

  const userKind = useUserKind()

  const { t } = useTranslation('rooms')

  useEffect(() => {
    async function load () {
      try {
        // get timetable and filter for today
        const timetable = await getFriendlyTimetable(new Date(), false)
        const today = timetable.filter(x => isSameDay(x.startDate, new Date()))

        if (today.length < 1) {
          // no lectures today -> general room search
          const suggestions = await getEmptySuggestions(true)
          setSuggestions(suggestions)
          return
        }

        const gaps = getTimetableGaps(today)
        if (gaps.length < 1) {
          const suggestions = await getEmptySuggestions(true)
          setSuggestions(suggestions)
          return
        }

        const suggestions = await Promise.all(gaps.map(async (gap) => {
          const rooms = await findSuggestedRooms(gap.endLecture.raum, gap.startDate, gap.endDate)

          return (
            {
              gap,
              rooms: rooms.slice(0, 4)
            }
          )
        }))

        setSuggestions(suggestions)
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=rooms%2Fsuggestions')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }

    if (userKind !== USER_GUEST) {
      load()
    }
  }, [router, userKind])

  return (
    <AppContainer>
      <AppNavbar title={t('rooms.suggestions.appbar.title')} />

      <AppBody>
        <ReactPlaceholder type="text" rows={20} ready={suggestions || userKind === USER_GUEST}>
          {suggestions && suggestions.map((result, idx) =>
            <div key={idx}>
              <div className={styles.suggestion}>
                <GapHeader result={result} />

                <div className={styles.time}>
                  <GapSubtitle result={result} />
                </div>
              </div>
              <ListGroup>
                {result.rooms.map((roomResult, idx) =>
                  <ListGroup.Item key={idx} className={styles.item}>
                    <div className={styles.left}>
                      <Link href={`/rooms?highlight=${roomResult.room}`}>
                        {roomResult.room}
                      </Link>
                      {TUX_ROOMS.includes(roomResult.room) && <> <FontAwesomeIcon title="Linux" icon={faLinux} /></>}
                      <div className={styles.details}>
                        {roomResult.type}
                      </div>
                    </div>
                    <div className={styles.right}>
                      <Trans
                        i18nKey="rooms.common.available_from_until"
                        ns='rooms'
                        values={{
                          from: formatFriendlyTime(result.from),
                          until: formatFriendlyTime(result.until)
                        }}
                        components={{
                          br: <br />
                        }}
                      />
                    </div>
                  </ListGroup.Item>
                )}
                {result.rooms.length === 0 &&
                  <ListGroup.Item className={styles.item}>
                    {t('rooms.suggestions.no_available_rooms')}
                  </ListGroup.Item>
                }
              </ListGroup>
            </div>
          )}
        </ReactPlaceholder>

        {(userKind === USER_GUEST || suggestions?.length === 0) &&
          <div className={styles.noSuggestions}>
            <FontAwesomeIcon icon={faCalendar} size="xl" style={ { marginBottom: '15px' } } />
            <br />
            {t('rooms.suggestions.no_suggestions')}
          </div>
        }
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}

/**
 * Returns the header for the given result like `Jetzt -> KI_ML3 (K015)`
 * @param {object} result Gap result object
 * @returns {JSX.Element} Header
 */
function GapHeader ({ result }) {
  if (result.gap.endLecture) {
    return (
      <Trans
        i18nKey="rooms.suggestions.gaps.header.specific"
        ns='rooms'
        components={{
          arrow: <FontAwesomeIcon icon={faArrowRight} className={styles.icon} />
        }}
        values={{
          from: result.gap.startLecture ? getTimetableEntryName(result.gap.startLecture).shortName : 'Jetzt',
          until: getTimetableEntryName(result.gap.endLecture).shortName,
          room: result.gap.endLecture.raum
        }}
      />
    )
  } else {
    return (
      <Trans
        i18nKey="rooms.suggestions.gaps.header.general"
        ns='rooms'
      />
    )
  }
}

/**
 * Returns the subtitle for the given result like `Pause von 10:00 bis 10:15`
 * @param {object} result Gap result object
 * @returns {JSX.Element} Subtitle
 **/
function GapSubtitle ({ result }) {
  if (result.gap.endLecture) {
    return (
      <Trans
        i18nKey="rooms.suggestions.gaps.subtitle.specific"
        ns='rooms'
        values={{
          from: result.gap.startLecture ? formatFriendlyTime(result.gap.startLecture.endDate) : 'Jetzt',
          until: formatFriendlyTime(result.gap.endLecture.startDate)
        }}
      />
    )
  } else {
    return (
      <Trans
        i18nKey="rooms.suggestions.gaps.subtitle.general"
        ns='rooms'
        values={{
          from: formatFriendlyTime(result.gap.startDate),
          until: formatFriendlyTime(result.gap.endDate)
        }}
      />
    )
  }
}
