import { useEffect, useState } from 'react'
import API from '../../lib/backend/authenticated-api'

export const USER_STUDENT = 'student'
export const USER_EMPLOYEE = 'employee'
export const USER_GUEST = 'guest'

export function useUserKind () {
  const [userKind, setUserKind] = useState(USER_GUEST)
  const [userFaculty, setUserFaculty] = useState(null)

  useEffect(() => {
    async function loadFaculty () {
      // return 'Nachhaltige Infrastruktur'
      return await API.getFaculty()
    }

    async function load () {
      if (localStorage.session === 'guest2') {
        setUserKind(USER_GUEST)
      } else if (localStorage.isStudent === 'false') {
        setUserKind(USER_EMPLOYEE)
      } else {
        setUserKind(USER_STUDENT)
        setUserFaculty(await loadFaculty())
      }
    }

    load()
  }, [])

  return { userKind, userFaculty }
}
