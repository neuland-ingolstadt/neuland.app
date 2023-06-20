import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'
import DashboardModal from '../components/modal/DashboardModal'
import FilterFoodModal from '../components/modal/FilterFoodModal'
import LanguageModal from '../components/modal/LanguageModal'
import PersonalDataModal from '../components/modal/PersonalDataModal'
import ThemeModal from '../components/modal/ThemeModal'

import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faBug,
  faChevronRight,
  faExternalLink,
  faGavel,
  faShield
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { FoodFilterContext, ShowDashboardModal, ShowLanguageModal, ShowPersonalDataModal, ShowThemeModal, ThemeContext } from './_app'
import { NoSessionError, UnavailableSessionError, forgetSession } from '../lib/backend/thi-session-handler'
import { USER_EMPLOYEE, USER_GUEST, USER_STUDENT, useUserKind } from '../lib/hooks/user-kind'
import { calculateECTS, loadGradeAverage, loadGrades } from '../lib/backend-utils/grades-utils'
import API from '../lib/backend/authenticated-api'

import styles from '../styles/Personal.module.css'
import themes from '../data/themes.json'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

const PRIVACY_URL = process.env.NEXT_PUBLIC_PRIVACY_URL

export default function Personal () {
  const [userdata, setUserdata] = useState(null)
  const [average, setAverage] = useState(null)
  const [ects, setEcts] = useState(null)
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)
  const [showDebug, setShowDebug] = useState(false)
  const [, setShowDashboardModal] = useContext(ShowDashboardModal)
  const { setShowFoodFilterModal } = useContext(FoodFilterContext)
  const [, setShowPersonalDataModal] = useContext(ShowPersonalDataModal)
  const [, setShowThemeModal] = useContext(ShowThemeModal)
  const [, setShowLanguageModal] = useContext(ShowLanguageModal)
  const theme = useContext(ThemeContext)
  const router = useRouter()
  const { t, i18n } = useTranslation('personal')

  const userKind = useUserKind()

  const CopyableField = ({ label, value }) => {
    // Only the value is clickable to copy it to the clipboard.

    const handleCopy = async () => {
      await navigator.clipboard.writeText(value)
      alert(`${label} in die Zwischenablage kopiert.`)
    }

    return (
      <span onClick={e => {
        if (!value) {
          e.preventDefault()
          return
        }
        e.stopPropagation()
      }}>
        {label}:{' '}
        {value
          ? (
            <>
              <span style={{ cursor: 'pointer' }} onClick={handleCopy}>
                {value}
              </span>
            </>
            )
          : null}
      </span>
    )
  }

  useEffect(() => {
    async function load () {
      try {
        const response = await API.getPersonalData()
        const data = response.persdata
        data.pcounter = response.pcounter
        setUserdata(data)

        const average = await loadGradeAverage()
        setAverage(average)

        const { finished, missing } = await loadGrades()
        setGrades(finished)
        setMissingGrades(missing)

        const j = await calculateECTS()
        setEcts(j)
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=personal')
        } else {
          console.error(e)
          // students who are not enrolled (anymore) get 'Service not available (-112)'
          // remove the popup temporarily until we figure out a better way to handle this
          // alert(e)
        }
      }
    }

    if (localStorage.debugUnlocked) {
      setShowDebug(true)
    }
    if (userKind === USER_STUDENT) {
      load()
    }
  }, [router, userKind])

  return (<AppContainer>
    <AppNavbar title={t('personal.title')} />

    <AppBody>
      <ReactPlaceholder type="text" rows={10} ready={userdata || userKind !== USER_STUDENT}>

        {userKind === USER_STUDENT &&
          <ListGroup>
            <ListGroup.Item action onClick={() => setShowPersonalDataModal(true)}>
              <div className={styles.name_interaction_icon}>
                <FontAwesomeIcon icon={faChevronRight} className="text-muted" />
              </div>
              {userdata && userdata.name + ', ' + userdata.vname}<br />
              {userdata && userdata.fachrich}
            </ListGroup.Item>

            <ListGroup.Item className="text-muted">
              <span className={userdata ? styles.personal_value : styles.personal_value_loading}>
                {userdata && userdata.stgru + '. Semester'}<br />
              </span>
              {userdata && (
                <>
                  <CopyableField label="Mat.-Nr" value={userdata.mtknr} /> <br />
                  <CopyableField label="Bib.-Nr" value={userdata.bibnr} />
                </>
              )}

            </ListGroup.Item>

            <ListGroup.Item action onClick={() => router.push('/grades')}>
              <div className={styles.interaction_icon}>
                <span className="text-muted">
                  {grades && missingGrades && grades.length + '/' + (grades.length + missingGrades.length)}
                  {' Noten '}
                  <FontAwesomeIcon icon={faChevronRight} />
                </span>
              </div>
              <span className="text-muted">
                {ects !== null && ects + ' ECTS'}
                {!isNaN(average?.result) && ' · '}
                {!isNaN(average?.result) && '∅ ' + average.result.toFixed(2).toString().replace('.', ',')}
                {average?.missingWeight === 1 && ` (${average.missingWeight} ${t('personal.grades.missingWeight_single')})`}
                {average?.missingWeight > 1 && ` (${average.missingWeight} ${t('personal.grades.missingWeight_multiple')})`}
              </span>
            </ListGroup.Item>
          </ListGroup>
        }

        <PersonalDataModal userdata={userdata} />
      </ReactPlaceholder>

      <br />

      <ListGroup>

        {themes.filter(item => item.style.includes(theme[0])).map(item => (
          <ListGroup.Item action onClick={() => setShowThemeModal(true)} key={item.style}>
            <div className={styles.interaction_icon}>
              <span className="text-muted">
                {`${item.name[i18n.language]} `}
                <FontAwesomeIcon icon={faChevronRight} />
              </span>
            </div>
            {t('personal.theme')}
          </ListGroup.Item>
        ))}

        <ListGroup.Item action onClick={() => setShowDashboardModal(true)}>
          <div className={styles.interaction_icon}>
            <span className="text-muted">
              <FontAwesomeIcon icon={faChevronRight} />
            </span>
          </div>
          {t('personal.dashboard')}
        </ListGroup.Item>

        <ListGroup.Item action onClick={() => setShowLanguageModal(true)}>
          <div className={styles.interaction_icon}>
            <span className="text-muted">
              <FontAwesomeIcon icon={faChevronRight} />
            </span>
          </div>
          {t('personal.language')}
        </ListGroup.Item>

        <ListGroup.Item action onClick={() => setShowFoodFilterModal(true)}>
          <div className={styles.interaction_icon}>
            <span className="text-muted">
              <FontAwesomeIcon icon={faChevronRight} />
            </span>
          </div>
          {t('personal.food_preferences')}
        </ListGroup.Item>

      </ListGroup>

      <br />

      <ListGroup>

        <ListGroup.Item action
          onClick={() => window.open('https://www3.primuss.de/cgi-bin/login/index.pl?FH=fhin', '_blank')}>
          <FontAwesomeIcon icon={faExternalLink} className={styles.interaction_icon} />
          Primuss
        </ListGroup.Item>

        <ListGroup.Item action onClick={() => window.open('https://moodle.thi.de/moodle', '_blank')}>
          <FontAwesomeIcon icon={faExternalLink} className={styles.interaction_icon} />
          Moodle
        </ListGroup.Item>

        <ListGroup.Item action onClick={() => window.open('https://outlook.thi.de/', '_blank')}>
          <FontAwesomeIcon icon={faExternalLink} className={styles.interaction_icon} />
          E-Mail
        </ListGroup.Item>

        {userKind === USER_EMPLOYEE &&
          <ListGroup.Item action onClick={() => window.open('https://mythi.de', '_blank')}>
            <FontAwesomeIcon icon={faExternalLink} className={styles.interaction_icon} />
            MyTHI
          </ListGroup.Item>
        }
      </ListGroup>

      <br />

      <ListGroup>

        {showDebug && (
          <ListGroup.Item action onClick={() => router.push('/debug')}>
            <FontAwesomeIcon icon={faBug} className={styles.interaction_icon} />
            {t('personal.debug')}
          </ListGroup.Item>
        )}

        <ListGroup.Item action onClick={() => window.open(PRIVACY_URL, '_blank')}>
          <FontAwesomeIcon icon={faShield} className={styles.interaction_icon} />
          {t('personal.privacy')}
        </ListGroup.Item>

        <ListGroup.Item action onClick={() => router.push('/imprint')}>
          <FontAwesomeIcon icon={faGavel} className={styles.interaction_icon} />
          {t('personal.imprint')}
        </ListGroup.Item>

      </ListGroup>

      <br />

      <div className={styles.logout_button}>
        {userKind === USER_GUEST && (
          <Button
            variant={'success'}
            onClick={() => forgetSession(router)}>
            {`${t('personal.login')} `}
            <FontAwesomeIcon icon={faArrowRightToBracket} />
          </Button>
        )}
        {userKind !== USER_GUEST && (
          <Button
            variant={'danger'}
            onClick={() => forgetSession(router)}>
            {`${t('personal.logout')} `}
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </Button>
        )}
      </div>

      <PersonalDataModal userdata={userdata} />
      <DashboardModal />
      <FilterFoodModal />
      <ThemeModal />
      <LanguageModal />
      <AppTabbar />
    </AppBody>
  </AppContainer>)
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'personal',
      'common'
    ]))
  }
})
