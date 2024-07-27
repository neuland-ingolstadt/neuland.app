import React, { useEffect, useState } from 'react'
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
  Bug,
  ChevronRight,
  ExternalLink,
  Gavel,
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react'

import {
  NoSessionError,
  UnavailableSessionError,
  forgetSession,
} from '../lib/backend/thi-session-handler'
import {
  USER_EMPLOYEE,
  USER_GUEST,
  USER_STUDENT,
  useUserKind,
} from '../lib/hooks/user-kind'
import { calculateECTS, loadGrades } from '../lib/backend-utils/grades-utils'
import API from '../lib/backend/authenticated-api'

import styles from '../styles/Personal.module.css'
import themes from '../data/themes.json'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

import { TextBlock } from 'react-placeholder/lib/placeholders'
import { useFoodFilter } from '../lib/providers/FoodFilterProvider'
import { useModals } from '../lib/providers/ModalProvider'
import { useTheme } from '../lib/providers/ThemeProvider'

const PRIVACY_URL = process.env.NEXT_PUBLIC_PRIVACY_URL
const SYSTEM_STATUS_URL = process.env.NEXT_PUBLIC_SYSTEM_STATUS_URL

export default function Personal() {
  const [userdata, setUserdata] = useState(null)
  const [ects, setEcts] = useState(null)
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)
  const [showDebug, setShowDebug] = useState(false)
  const { setShowFoodFilterModal } = useFoodFilter()
  const {
    setShowDashboardModal,
    setShowPersonalDataModal,
    setShowThemeModal,
    setShowLanguageModal,
  } = useModals()
  const { theme } = useTheme()
  const router = useRouter()
  const { t, i18n } = useTranslation('personal')

  const { userKind } = useUserKind()

  const CopyableField = ({ label, value }) => {
    // Only the value is clickable to copy it to the clipboard.

    const handleCopy = async () => {
      await navigator.clipboard.writeText(value)
      alert(t('personal.overview.copiedToClipboard', { label }))
    }

    return (
      <span
        onClick={(e) => {
          if (!value) {
            e.preventDefault()
            return
          }
          e.stopPropagation()
        }}
      >
        {label}:{' '}
        {value ? (
          <>
            <span
              style={{ cursor: 'pointer' }}
              onClick={handleCopy}
            >
              {value}
            </span>
          </>
        ) : null}
      </span>
    )
  }

  useEffect(() => {
    async function load() {
      try {
        const response = await API.getPersonalData()
        const data = response.persdata
        data.pcounter = response.pcounter
        setUserdata(data)

        const { finished, missing } = await loadGrades()
        setGrades(finished)
        setMissingGrades(missing)

        const j = await calculateECTS()
        setEcts(j)
      } catch (e) {
        if (
          e instanceof NoSessionError ||
          e instanceof UnavailableSessionError
        ) {
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

  const placeholder = (
    <>
      <ListGroup.Item action>
        <TextBlock
          rows={2}
          className={styles.placeholder}
        />
      </ListGroup.Item>
      <ListGroup.Item action>
        <TextBlock
          rows={2}
          className={styles.placeholder}
        />
      </ListGroup.Item>
      <ListGroup.Item action>
        <TextBlock
          rows={1}
          className={styles.placeholder}
        />
      </ListGroup.Item>
    </>
  )

  return (
    <AppContainer>
      <AppNavbar
        title={t('personal.title')}
        showBack={'desktop-only'}
      />

      <AppBody>
        <ReactPlaceholder
          ready={userdata || userKind !== USER_STUDENT}
          customPlaceholder={placeholder}
        >
          {userKind === USER_STUDENT && (
            <ListGroup>
              <ListGroup.Item
                action
                onClick={() => setShowPersonalDataModal(true)}
              >
                <div className={styles.name_interaction_icon}>
                  <ChevronRight
                    className="text-muted"
                    size={22}
                  />
                </div>
                {userdata && userdata.name + ', ' + userdata.vname}
                <br />
                {userdata && userdata.fachrich}
              </ListGroup.Item>

              <ListGroup.Item className="text-muted">
                <span
                  className={
                    userdata
                      ? styles.personal_value
                      : styles.personal_value_loading
                  }
                >
                  {userdata && `${userdata.stgru}. ${t('personal.semester')}`}
                  <br />
                </span>
                {userdata && (
                  <>
                    <CopyableField
                      label={t('personal.overview.matriculationNumber')}
                      value={userdata.mtknr}
                    />{' '}
                    <br />
                    <CopyableField
                      label={t('personal.overview.libraryNumber')}
                      value={userdata.bibnr}
                    />
                  </>
                )}
              </ListGroup.Item>

              <ListGroup.Item
                action
                onClick={() => router.push('/grades')}
              >
                <div className={styles.interaction_icon}>
                  <span className="text-muted">
                    {grades &&
                      missingGrades &&
                      grades.length +
                        '/' +
                        (grades.length + missingGrades.length)}
                    {` ${t('personal.overview.grades')} `}
                    <ChevronRight
                      className="text-muted"
                      size={22}
                    />
                  </span>
                </div>
                <span className="text-muted">
                  {ects !== null && `${ects} ${t('personal.overview.ects')} `}
                </span>
              </ListGroup.Item>
            </ListGroup>
          )}

          <PersonalDataModal userdata={userdata} />
        </ReactPlaceholder>

        <br />

        <ListGroup>
          {themes
            .filter((item) => item.style === theme)
            .map((item) => (
              <ListGroup.Item
                action
                onClick={() => setShowThemeModal(true)}
                key={item.style}
              >
                <div className={styles.interaction_icon}>
                  <span className="text-muted">
                    {`${item.name[i18n.languages[0]]} `}
                    <ChevronRight
                      className="text-muted"
                      size={22}
                    />
                  </span>
                </div>
                {t('personal.theme')}
              </ListGroup.Item>
            ))}

          <ListGroup.Item
            action
            onClick={() => setShowDashboardModal(true)}
          >
            <div className={styles.interaction_icon}>
              <ChevronRight
                className="text-muted"
                size={22}
              />
            </div>
            {t('personal.dashboard')}
          </ListGroup.Item>

          <ListGroup.Item
            action
            onClick={() => setShowLanguageModal(true)}
          >
            <div className={styles.interaction_icon}>
              <ChevronRight
                className="text-muted"
                size={22}
              />
            </div>
            {t('personal.language')}
          </ListGroup.Item>

          <ListGroup.Item
            action
            onClick={() => setShowFoodFilterModal(true)}
          >
            <div className={styles.interaction_icon}>
              <ChevronRight
                className="text-muted"
                size={22}
              />
            </div>
            {t('personal.foodPreferences')}
          </ListGroup.Item>
        </ListGroup>

        <br />

        <ListGroup>
          <ListGroup.Item
            action
            className={styles.interaction_row}
            onClick={() =>
              window.open(
                'https://www3.primuss.de/cgi-bin/login/index.pl?FH=fhin',
                '_blank'
              )
            }
          >
            <ExternalLink
              size={20}
              className={styles.interaction_icon}
            />
            Primuss
          </ListGroup.Item>

          <ListGroup.Item
            action
            className={styles.interaction_row}
            onClick={() =>
              window.open('https://moodle.thi.de/moodle', '_blank')
            }
          >
            <ExternalLink
              size={20}
              className={styles.interaction_icon}
            />
            Moodle
          </ListGroup.Item>

          <ListGroup.Item
            action
            className={styles.interaction_row}
            onClick={() => window.open('https://outlook.thi.de/', '_blank')}
          >
            <ExternalLink
              size={20}
              className={styles.interaction_icon}
            />
            E-Mail
          </ListGroup.Item>

          {userKind === USER_EMPLOYEE && (
            <ListGroup.Item
              action
              onClick={() => window.open('https://mythi.de', '_blank')}
            >
              <ExternalLink
                size={20}
                className={styles.interaction_icon}
              />
              MyTHI
            </ListGroup.Item>
          )}
        </ListGroup>

        <br />

        <ListGroup>
          {showDebug && (
            <ListGroup.Item
              action
              className={styles.interaction_row}
              onClick={() => router.push('/debug')}
            >
              <Bug
                size={20}
                className={styles.interaction_icon}
              />
              {t('personal.debug')}
            </ListGroup.Item>
          )}
          <ListGroup.Item
            action
            className={styles.interaction_row}
            onClick={() => window.open(PRIVACY_URL, '_blank')}
          >
            <Shield
              size={20}
              className={styles.interaction_icon}
            />
            {t('personal.privacy')}
          </ListGroup.Item>

          <ListGroup.Item
            action
            className={styles.interaction_row}
            onClick={() => router.push('/imprint')}
          >
            <Gavel
              size={20}
              className={styles.interaction_icon}
            />
            {t('personal.imprint')}
          </ListGroup.Item>
          <ListGroup.Item
            action
            className={styles.interaction_row}
            onClick={() => window.open(SYSTEM_STATUS_URL, '_blank')}
          >
            <ExternalLink
              size={20}
              className={styles.interaction_icon}
            />
            System Status
          </ListGroup.Item>
        </ListGroup>

        <br />

        <div className={styles.logout_button}>
          {userKind === USER_GUEST && (
            <Button
              className={styles.logout_button}
              variant={'success'}
              onClick={() => forgetSession(router)}
            >
              {`${t('personal.login')} `}
              <LogIn size={18} />
            </Button>
          )}
          {userKind !== USER_GUEST && (
            <Button
              className={styles.logout_button}
              variant={'danger'}
              onClick={() => forgetSession(router)}
            >
              {`${t('personal.logout')} `}
              <LogOut size={18} />
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
    </AppContainer>
  )
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['personal', 'common'])),
  },
})
