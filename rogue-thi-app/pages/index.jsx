import React, { useCallback, useState } from 'react'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import AnnouncementPrompt from '../components/cards/AnnouncementPrompt'
import DashboardModal from '../components/modal/DashboardModal'
import NeulandAPI from '../lib/backend/neuland-api'
import { Pencil } from 'lucide-react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import styles from '../styles/Home.module.css'
import { useDashboard } from '../lib/providers/DashboardProvider'
import { useModals } from '../lib/providers/ModalProvider'

/**
 * Main page.
 */
export default function Home({ announcements }) {
  const [shownAnnouncements, setShownAnnouncements] = useState(
    announcements.map((a) => ({
      ...a,
      startDateTime: new Date(a.startDateTime),
      endDateTime: new Date(a.endDateTime),
    }))
  )

  const onHideAnnouncement = useCallback((announcement) => {
    // add announcement to cookie to ignore on next request
    // get current cookie with key 'hiddenAnnouncements'
    const hiddenAnnouncements = JSON.parse(
      document.cookie
        .split(';')
        .find((c) => c.includes('hiddenAnnouncements'))
        ?.split('=')[1] ?? '[]'
    )

    // add announcement to hiddenAnnouncements
    hiddenAnnouncements.push(announcement.id)

    // update cookie
    document.cookie = `hiddenAnnouncements=${JSON.stringify(
      hiddenAnnouncements
    )}; path=/; expires=${new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 365 // 1 year
    ).toUTCString()}`

    setShownAnnouncements((prev) =>
      prev.filter((a) => a.id !== announcement.id)
    )
  }, [])

  const { setShowDashboardModal } = useModals()
  // page state
  const { shownDashboardEntries, hideDashboardEntry } = useDashboard()

  return (
    <AppContainer>
      <AppNavbar
        title="neuland.app"
        showBack={false}
      >
        <AppNavbar.Button onClick={() => setShowDashboardModal(true)}>
          <Pencil
            size={18}
            floodColor={'white'}
          />
        </AppNavbar.Button>
      </AppNavbar>

      <AppBody>
        <div className={styles.cardDeck}>
          {shownAnnouncements.slice(0, 2).map((announcement) => (
            <AnnouncementPrompt
              key={announcement.id}
              announcement={announcement}
              onHide={() => onHideAnnouncement(announcement)}
            />
          ))}
        </div>
        <div className={styles.cardDeck}>
          {shownDashboardEntries.map((entry) => entry.card(hideDashboardEntry))}
        </div>
        <DashboardModal />
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}

export const getServerSideProps = async ({ locale, req }) => {
  const data = await NeulandAPI.getAnnouncements()

  const hiddenAnnouncements = JSON.parse(
    req.headers.cookie
      ?.split(';')
      .find((c) => c.includes('hiddenAnnouncements'))
      ?.split('=')[1] ?? '[]'
  )

  const announcements = data.announcements
    .map((a) => ({
      ...a,
      startDateTime: new Date(Number(a.startDateTime)),
      endDateTime: new Date(Number(a.endDateTime)),
    }))
    // filter out hidden announcements
    .filter((a) => !hiddenAnnouncements.includes(a.id))
    // filter by current date
    .filter(
      (a) =>
        a.startDateTime <= new Date() && new Date(a.endDateTime) >= new Date()
    )
    // sort by priority
    .sort((a, b) => b.priority - a.priority)
    // serialize dates
    .map((a) => ({
      ...a,
      startDateTime: a.startDateTime.toISOString(),
      endDateTime: a.endDateTime.toISOString(),
    }))

  return {
    props: {
      announcements,
      ...(await serverSideTranslations(locale ?? 'en', [
        'dashboard',
        'common',
      ])),
    },
  }
}
