import React from 'react'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { useDashboard } from '../lib/hooks/dashboard'

import styles from '../styles/Home.module.css'

/**
 * Main page.
 */
export default function Home () {
  // page state
  const {
    shownDashboardEntries,
    hideDashboardEntry
  } = useDashboard()

  return (
    <AppContainer>
      <AppNavbar title="neuland.app" showBack={false}>
      </AppNavbar>

      <AppBody>
        <div className={styles.cardDeck}>
          {shownDashboardEntries.map(entry => entry.card(hideDashboardEntry))}
        </div>
      </AppBody>

      <AppTabbar/>
    </AppContainer>
  )
}
