import React, { useContext } from 'react'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { DashboardContext, ShowDashboardModal } from './_app'
import DashboardModal from '../components/modal/DashboardModal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { faPen } from '@fortawesome/free-solid-svg-icons'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import styles from '../styles/Home.module.css'

/**
 * Main page.
 */
export default function Home () {
  const [, setShowDashboardModal] = useContext(ShowDashboardModal)

  // page state
  const {
    shownDashboardEntries,
    hideDashboardEntry
  } = useContext(DashboardContext)

  return (
    <AppContainer>
      <AppNavbar title="neuland.app" showBack={false}>
        <AppNavbar.Button onClick={() => setShowDashboardModal(true)}>
          <FontAwesomeIcon title="Personalisieren" icon={faPen} fixedWidth />
        </AppNavbar.Button>
      </AppNavbar>

      <AppBody>
        <div className={styles.cardDeck}>
          {shownDashboardEntries.map(entry => entry.card(hideDashboardEntry))}
        </div>
        <DashboardModal/>
      </AppBody>

      <AppTabbar/>
    </AppContainer>
  )
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'dashboard',
      'mobility',
      'common'
    ]))
  }
})
