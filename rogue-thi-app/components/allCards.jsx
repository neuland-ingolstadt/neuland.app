import BaseCard from './cards/BaseCard'
import CalendarCard from './cards/CalendarCard'
import EventsCard from './cards/EventsCard'
import ExamsCard from './cards/ExamsCard'
import FoodCard from './cards/FoodCard'
import InstallPrompt from './cards/InstallPrompt'
import MobilityCard from './cards/MobilityCard'
import RoomCard from './cards/RoomCard'
import TimetableCard from './cards/TimetableCard'

import {
  faBook,
  faMap,
  faScroll,
  faUser,
  faUserGraduate,
} from '@fortawesome/free-solid-svg-icons'

import { USER_EMPLOYEE, USER_GUEST, USER_STUDENT } from '../lib/hooks/user-kind'

export const PLATFORM_DESKTOP = 'desktop'
export const PLATFORM_MOBILE = 'mobile'
export const ALL_DASHBOARD_CARDS = [
  {
    key: 'install',
    removable: true,
    default: [PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: ({ hidePromptCard }) => (
      <InstallPrompt
        key="install"
        onHide={() => hidePromptCard('install')}
      />
    ),
  },
  {
    key: 'exams',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT],
    card: () => <ExamsCard key="exams" />,
  },
  {
    key: 'timetable',
    removable: true,
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE],
    card: () => <TimetableCard key="timetable" />,
  },
  {
    key: 'mensa',
    removable: true,
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <FoodCard key="mensa" />,
  },
  {
    key: 'mobility',
    removable: true,
    default: [
      PLATFORM_DESKTOP,
      PLATFORM_MOBILE,
      USER_STUDENT,
      USER_EMPLOYEE,
      USER_GUEST,
    ],
    card: () => <MobilityCard key="mobility" />,
  },
  {
    key: 'calendar',
    removable: true,
    default: [
      PLATFORM_DESKTOP,
      PLATFORM_MOBILE,
      USER_STUDENT,
      USER_EMPLOYEE,
      USER_GUEST,
    ],
    card: () => <CalendarCard key="calendar" />,
  },
  {
    key: 'events',
    removable: true,
    default: [
      PLATFORM_DESKTOP,
      PLATFORM_MOBILE,
      USER_STUDENT,
      USER_EMPLOYEE,
      USER_GUEST,
    ],
    card: () => <EventsCard key="events" />,
  },
  {
    key: 'rooms',
    removable: true,
    default: [
      PLATFORM_DESKTOP,
      PLATFORM_MOBILE,
      USER_STUDENT,
      USER_EMPLOYEE,
      USER_GUEST,
    ],
    card: ({ roomDistances }) => (
      <RoomCard
        key="rooms"
        roomDistances={roomDistances}
      />
    ),
  },
  {
    key: 'roomplan',
    removable: true,
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => (
      <BaseCard
        key="roomplan"
        icon={faMap}
        i18nKey="roomplan"
        link="/rooms"
      />
    ),
  },
  {
    key: 'library',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE],
    card: () => (
      <BaseCard
        key="library"
        icon={faBook}
        i18nKey="library"
        link="/library"
      />
    ),
  },
  {
    key: 'grades',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT],
    card: () => (
      <BaseCard
        key="grades"
        icon={faScroll}
        i18nKey="grades"
        link="/grades"
      />
    ),
  },
  {
    key: 'personal',
    removable: false,
    default: [
      PLATFORM_DESKTOP,
      PLATFORM_MOBILE,
      USER_STUDENT,
      USER_EMPLOYEE,
      USER_GUEST,
    ],
    card: () => (
      <BaseCard
        key="personal"
        icon={faUser}
        i18nKey="personal"
        link="/personal"
      />
    ),
  },
  {
    key: 'lecturers',
    removable: true,
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE],
    card: () => (
      <BaseCard
        key="lecturers"
        icon={faUserGraduate}
        i18nKey="lecturers"
        link="/lecturers"
      />
    ),
  },
]
