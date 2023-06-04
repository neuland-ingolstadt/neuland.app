import BaseCard from './cards/BaseCard'
import CalendarCard from './cards/CalendarCard'
import EventsCard from './cards/EventsCard'
import FoodCard from './cards/FoodCard'
import InstallPrompt from './cards/InstallPrompt'
import MobilityCard from './cards/MobilityCard'
import RoomCard from './cards/RoomCard'
import TimetableCard from './cards/TimetableCard'

import {
  faBook,
  faScroll,
  faUser,
  faUserGraduate
} from '@fortawesome/free-solid-svg-icons'

import { USER_EMPLOYEE, USER_GUEST, USER_STUDENT } from '../lib/hooks/user-kind'

export const PLATFORM_DESKTOP = 'desktop'
export const PLATFORM_MOBILE = 'mobile'
export const ALL_DASHBOARD_CARDS = [
  {
    key: 'install',
    label: 'Installation',
    removable: true,
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
    removable: true,
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE],
    card: () => <TimetableCard key="timetable" />
  },
  {
    key: 'mensa',
    label: 'Essen',
    removable: true,
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <FoodCard key="mensa" />
  },
  {
    key: 'mobility',
    label: 'Mobilität',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <MobilityCard key="mobility" />
  },
  {
    key: 'calendar',
    label: 'Termine',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <CalendarCard key="calendar" />
  },
  {
    key: 'events',
    label: 'Veranstaltungen',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <EventsCard key="events" />
  },
  {
    key: 'rooms',
    label: 'Raumplan',
    removable: true,
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <RoomCard key="rooms" />
  },
  {
    key: 'library',
    label: 'Bibliothek',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE],
    card: () => (
      <BaseCard
        key="library"
        icon={faBook}
        i18nKey="library"
        link="/library"
      />
    )
  },
  {
    key: 'grades',
    label: 'Noten & Fächer',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT],
    card: () => (
      <BaseCard
        key="grades"
        icon={faScroll}
        i18nKey="grades"
        link="/grades"
      />
    )
  },
  {
    key: 'personal',
    label: 'Profil',
    removable: false,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => (
      <BaseCard
        key="personal"
        icon={faUser}
        i18nKey="personal"
        link="/personal"
      />
    )
  },
  {
    key: 'lecturers',
    label: 'Dozenten',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE],
    card: () => (
      <BaseCard
        key="lecturers"
        icon={faUserGraduate}
        i18nKey="lecturers"
        link="/lecturers"
      />
    )
  }
]
