import React, { useEffect, useState } from 'react'

import {
  faBook,
  faDoorOpen,
  faScroll,
  faUser,
  faUserGraduate
} from '@fortawesome/free-solid-svg-icons'
import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'
import BaseCard from '../components/cards/BaseCard'
import CalendarCard from '../components/cards/CalendarCard'
import EventsCard from '../components/cards/EventsCard'
import FoodCard from '../components/cards/FoodCard'
import InstallPrompt from '../components/cards/InstallPrompt'
import MobilityCard from '../components/cards/MobilityCard'
import TimetableCard from '../components/cards/TimetableCard'
import styles from '../styles/Home.module.css'

export const CTF_URL = process.env.NEXT_PUBLIC_CTF_URL

export const PLATFORM_DESKTOP = 'desktop'
export const PLATFORM_MOBILE = 'mobile'
export const USER_STUDENT = 'student'
export const USER_EMPLOYEE = 'employee'
export const USER_GUEST = 'guest'
export const ALL_DASHBOARD_CARDS = [
  {
    key: 'install',
    label: 'Installation',
    default: [PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: hidePromptCard => (
      <InstallPrompt
        key="install"
        onHide={() => hidePromptCard('install')}
      />
    )
  },
  {
    key: 'timetable',
    label: 'Stundenplan',
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE],
    card: () => <TimetableCard key="timetable"/>
  },
  {
    key: 'mensa',
    label: 'Essen',
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <FoodCard key="mensa"/>
  },
  {
    key: 'mobility',
    label: 'Mobilität',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <MobilityCard key="mobility"/>
  },
  {
    key: 'calendar',
    label: 'Termine',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <CalendarCard key="calendar"/>
  },
  {
    key: 'events',
    label: 'Veranstaltungen',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <EventsCard key="events"/>
  },
  {
    key: 'rooms',
    label: 'Raumplan',
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => (
      <BaseCard
        key="rooms"
        icon={faDoorOpen}
        title="Räume"
        link="/rooms"
      />
    )
  },
  {
    key: 'library',
    label: 'Bibliothek',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT],
    card: () => (
      <BaseCard
        key="library"
        icon={faBook}
        title="Bibliothek"
        link="/library"
      />
    )
  },
  {
    key: 'grades',
    label: 'Noten & Fächer',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT],
    card: () => (
      <BaseCard
        key="grades"
        icon={faScroll}
        title="Noten & Fächer"
        link="/grades"
      />
    )
  },
  {
    key: 'personal',
    label: 'Dein Profil',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT],
    card: () => (
      <BaseCard
        key="personal"
        icon={faUser}
        title="Dein Profil"
        link="/personal"
      />
    )
  },
  {
    key: 'lecturers',
    label: 'Dozenten',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE],
    card: () => (
      <BaseCard
        key="lecturers"
        icon={faUserGraduate}
        title="Dozenten"
        link="/lecturers"
      />
    )
  }
]

/**
 * Get the default order of shown and hidden dashboard entries
 */
export function getDefaultDashboardOrder () {
  const platform = window.matchMedia('(max-width: 768px)').matches
    ? PLATFORM_MOBILE
    : PLATFORM_DESKTOP

  let personGroup = USER_STUDENT
  if (localStorage.session === 'guest') {
    personGroup = USER_GUEST
  } else if (localStorage.isStudent === 'false') {
    personGroup = USER_EMPLOYEE
  }

  const filter = x => x.default.includes(platform) && x.default.includes(personGroup)
  return {
    shown: ALL_DASHBOARD_CARDS.filter(filter),
    hidden: ALL_DASHBOARD_CARDS.filter(x => !filter(x))
  }
}

export function loadDashboardEntries () {
  if (localStorage.personalizedDashboard) {
    const entries = JSON.parse(localStorage.personalizedDashboard)
      .map(key => ALL_DASHBOARD_CARDS.find(x => x.key === key))
      .filter(x => !!x)
    const hiddenEntries = JSON.parse(localStorage.personalizedDashboardHidden)
      .map(key => ALL_DASHBOARD_CARDS.find(x => x.key === key))
      .filter(x => !!x)

    ALL_DASHBOARD_CARDS.forEach(card => {
      if (!entries.find(x => x.key === card.key) && !hiddenEntries.find(x => x.key === card.key)) {
        // new (previosly unknown) card
        entries.splice(0, 0, card)
      }
    })

    return {
      shownDashboardEntries: entries,
      hiddenDashboardEntries: hiddenEntries
    }
  } else {
    const entries = getDefaultDashboardOrder()
    return {
      shownDashboardEntries: entries.shown,
      hiddenDashboardEntries: entries.hidden
    }
  }
}

/**
 * Main page.
 */
export default function Home () {
  // page state
  const [shownDashboardEntries, setShownDashboardEntries] = useState([])

  useEffect(() => {
    async function load () {
      const entries = await loadDashboardEntries()
      setShownDashboardEntries(entries.shownDashboardEntries)
    }
    load()
  }, [])

  return (
    <AppContainer>
      <AppNavbar title="neuland.app" showBack={false}>
      </AppNavbar>

      <AppBody>
        <div className={styles.cardDeck}>
          {shownDashboardEntries.map(entry => entry.card())}
        </div>
      </AppBody>

      <AppTabbar/>
    </AppContainer>
  )
}
