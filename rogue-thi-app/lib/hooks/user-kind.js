import { useEffect, useState } from 'react'

export const USER_STUDENT = 'student'
export const USER_EMPLOYEE = 'employee'
export const USER_GUEST = 'guest'

export function useUserKind () {
  const [userKind, setUserKind] = useState(USER_GUEST)

  useEffect(() => {
    if (localStorage.session === 'guest2') {
      setUserKind(USER_GUEST)
    } else if (localStorage.isStudent === 'false') {
      setUserKind(USER_EMPLOYEE)
    } else {
      setUserKind(USER_STUDENT)
    }
  }, [])

  return userKind
}
