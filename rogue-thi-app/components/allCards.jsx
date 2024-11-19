import BaseCard from './cards/BaseCard'
import CalendarCard from './cards/CalendarCard'
import EventsCard from './cards/EventsCard'
import ExamsCard from './cards/ExamsCard'
import FoodCard from './cards/FoodCard'
import InstallPrompt from './cards/InstallPrompt'
import RoomCard from './cards/RoomCard'
import TimetableCard from './cards/TimetableCard'

import { GraduationCap, Library, Map, Scroll, User } from 'lucide-react'

import { USER_EMPLOYEE, USER_GUEST, USER_STUDENT } from '../lib/hooks/user-kind'
// import ElectionPrompt from './cards/ElectionPrompt'

export const PLATFORM_DESKTOP = 'desktop'
export const PLATFORM_MOBILE = 'mobile'
export const ALL_DASHBOARD_CARDS = [
  {
    key: 'install2',
    removable: true,
    default: [PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: (hidePromptCard) => (
      <InstallPrompt
        key="install2"
        onHide={() => hidePromptCard('install2')}
      />
    ),
  },
  // {
  //   key: 'election',
  //   label: 'Jetzt wählen!',
  //   removable: true,
  //   default: [PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
  //   card: (hidePromptCard) => (
  //     <ElectionPrompt onHide={() => hidePromptCard('election')} />
  //   ),
  // },
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
    card: () => <RoomCard key="rooms" />,
  },
  {
    key: 'roomplan',
    removable: true,
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => (
      <BaseCard
        key="roomplan"
        icon={Map}
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
        icon={Library}
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
        icon={Scroll}
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
        icon={User}
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
        icon={GraduationCap}
        i18nKey="lecturers"
        link="/lecturers"
      />
    ),
  },
]
