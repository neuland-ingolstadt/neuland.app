import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

import { faArrowRight, faCalendar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import { NoSessionError, UnavailableSessionError } from '../../lib/backend/thi-session-handler'
import { formatFriendlyTime, isSameDay } from '../../lib/date-utils'

import { SUGGESTION_DURATION_PRESET, TUX_ROOMS, findSuggestedRooms, getAllUserBuildings, getEmptySuggestions, getTranslatedRoomFunction, getTranslatedRoomName } from '../../lib/backend-utils/rooms-utils'

import styles from '../../styles/RoomsSearch.module.css'

import { USER_GUEST, useUserKind } from '../../lib/hooks/user-kind'
import { getFriendlyTimetable, getTimetableEntryName, getTimetableGaps } from '../../lib/backend-utils/timetable-utils'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import { Trans, useTranslation } from 'next-i18next'
import { useBuildingFilter } from '../../lib/hooks/building-filter'

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'rooms',
      'api-translations',
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
  const [showEditDuration, setShowEditDuration] = useState(false)
  const [buildings, setBuildings] = useState([])

  const { buildingPreferences, setBuildingPreferences, saveBuildingPreferences } = useBuildingFilter()

  const userKind = useUserKind()

  const { t } = useTranslation('rooms')

  async function getSuggestions () {
    // get timetable and filter for today
    const timetable = await getFriendlyTimetable(new Date(), false)
    const today = timetable.filter(x => isSameDay(x.startDate, new Date()))

    if (today.length < 1) {
      // no lectures today -> general room search
      return await getEmptySuggestions(true)
    }

    const gaps = getTimetableGaps(today)
    if (gaps.length < 1) {
      return await getEmptySuggestions(true)
    }

    const suggestions = await Promise.all(gaps.map(async (gap) => {
      const room = gap.endLecture.rooms[0] || gap.endLecture.raum || undefined

      // if there is no room, we can't suggest anything
      if (!room) {
        return
      }

      const rooms = await findSuggestedRooms(room, gap.startDate, gap.endDate)

      return (
        {
          gap,
          room,
          rooms: rooms.slice(0, 4)
        }
      )
    }))

    // if there are no suggestions, show empty suggestions
    if (!suggestions[0]?.gap) {
      return await getEmptySuggestions(true)
    }

    // if first gap is in too far in the future (now + suggestion duration), show empty suggestions as well
    const deltaTime = suggestions[0].gap.startDate.getTime() - new Date().getTime()
    const suggestionDuration = parseInt(localStorage.getItem('suggestion-duration') ?? `${SUGGESTION_DURATION_PRESET}`)

    if (deltaTime > suggestionDuration * 60 * 1000) {
      const emptySuggestions = await getEmptySuggestions(true)
      suggestions.unshift(emptySuggestions[0])
    }

    return suggestions
  }

  useEffect(() => {
    async function load () {
      try {
        // load buildings
        setBuildings(await getAllUserBuildings())

        setSuggestions(await getSuggestions())
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

  /**
   * Closes the modal and saves the preferences.
   */
  async function closeModal () {
    setShowEditDuration(false)
    saveBuildingPreferences()

    const suggestions = await getSuggestions()
    setSuggestions(suggestions)
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
            from: result.gap.startLecture ? getTimetableEntryName(result.gap.startLecture).shortName : t('rooms.suggestions.gaps.now'),
            until: getTimetableEntryName(result.gap.endLecture).shortName,
            room: result.room
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
            from: result.gap.startLecture ? formatFriendlyTime(result.gap.startLecture.endDate) : t('rooms.suggestions.gaps.now').toLowerCase(),
            until: formatFriendlyTime(result.gap.endLecture.startDate),
            room: result.room
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
            until: formatFriendlyTime(result.gap.endDate),
            duration: Math.ceil((result.gap.endDate.getTime() - result.gap.startDate.getTime()) / 1000 / 60)
          }}
        />
      )
    }
  }

  /**
   * A button to select a duration.
   * @param {int} duration Duration in minutes
   * @returns {JSX.Element} Button
   */
  function DurationButton ({ duration }) {
    const variant = (localStorage.getItem('suggestion-duration') ?? `${SUGGESTION_DURATION_PRESET}`) === `${duration}` ? 'primary' : 'outline-primary'
    return (
      <Button
        variant={variant}
        onClick={async () => {
          localStorage.setItem('suggestion-duration', duration)

          const suggestions = await getSuggestions()
          setSuggestions(suggestions)
        } }
      >
        <h3>
          {duration}
        </h3>
        {t('rooms.suggestions.modals.suggestionPreferences.minutes')}
      </Button>
    )
  }

  return (
    <AppContainer>
      <AppNavbar title={t('rooms.suggestions.appbar.title')}>
        <AppNavbar.Overflow>
          <AppNavbar.Overflow.Link variant="link" onClick={() => setShowEditDuration(true)}>
            {t('rooms.suggestions.appbar.overflow.suggestionPreferences')}
          </AppNavbar.Overflow.Link>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody>
        <Modal size="lg" show={showEditDuration} onHide={closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>{t('rooms.suggestions.modals.suggestionPreferences.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {t('rooms.suggestions.modals.suggestionPreferences.description')}
            <br />
            <br />
            <h4>
              {t('rooms.suggestions.modals.suggestionPreferences.duration')}
            </h4>

            <Container>
              <ButtonGroup className={['w-100', styles.container]}>
                <DurationButton duration={30} />
                <DurationButton duration={60} />
                <DurationButton duration={90} />
                <DurationButton duration={120} />
              </ButtonGroup>
            </Container>

            <h4>
              {t('rooms.suggestions.modals.suggestionPreferences.preferredBuildings')}
            </h4>
            <Container>
              <Form className={styles.container}>
                {buildings.map((building, idx) =>
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    id={`building-${building}`}
                    label={building}
                    checked={buildingPreferences[building] || false}
                    onChange={e => setBuildingPreferences({ ...buildingPreferences, [building]: e.target.checked })}
                  />
                )}
              </Form>
            </Container>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              {t('rooms.suggestions.modals.suggestionPreferences.close')}
            </Button>
          </Modal.Footer>
        </Modal>

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
                        {getTranslatedRoomName(roomResult.room)}
                      </Link>
                      {TUX_ROOMS.includes(roomResult.room) && <> <FontAwesomeIcon title="Linux" icon={faLinux} /></>}
                      <div className={styles.details}>
                        {getTranslatedRoomFunction(roomResult.type)}
                      </div>
                    </div>
                    <div className={styles.right}>
                      <Trans
                        i18nKey="rooms.common.availableFromUntil"
                        ns='rooms'
                        values={{
                          from: formatFriendlyTime(roomResult.from),
                          until: formatFriendlyTime(roomResult.until)
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
                    {t('rooms.suggestions.noAvailableRooms')}
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
            {t('rooms.suggestions.noSuggestions')}
          </div>
        }
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
