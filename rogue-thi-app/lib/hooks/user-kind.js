import { useEffect, useState } from 'react'
import API from '../../lib/backend/authenticated-api'

export const USER_STUDENT = 'student'
export const USER_EMPLOYEE = 'employee'
export const USER_GUEST = 'guest'

const NEUBURG_FACULTIES = ['Nachhaltige Infrastruktur']

export function useUserKind() {
  const [userKind, setUserKind] = useState(USER_GUEST)
  const [userFaculty, setUserFaculty] = useState(null)
  const [userCampus, setUserCampus] = useState(null)

  useEffect(() => {
    async function loadFaculty() {
      return await API.getFaculty()
    }

    async function load() {
      if (localStorage.session === 'guest2') {
        setUserKind(USER_GUEST)
      } else if (localStorage.isStudent === 'false') {
        setUserKind(USER_EMPLOYEE)
      } else {
        setUserKind(USER_STUDENT)

        if (localStorage.isStudent === 'true') {
          setUserFaculty(await loadFaculty())
        }
      }
    }

    load()
  }, [])

  useEffect(() => {
    const campus = NEUBURG_FACULTIES.includes(userFaculty)
      ? 'Neuburg'
      : 'Ingolstadt'

    setUserCampus(campus)
  }, [userFaculty])

  return { userKind, userFaculty, userCampus }
}
