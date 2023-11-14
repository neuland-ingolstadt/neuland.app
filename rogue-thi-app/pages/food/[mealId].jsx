import { useRouter } from 'next/router'

export default function Food () {
  const router = useRouter()
  const mealId = router.query.mealId

  return (
    <div>
      <h1>Food</h1>
      <h1>{mealId}</h1>
    </div>
  )
}
