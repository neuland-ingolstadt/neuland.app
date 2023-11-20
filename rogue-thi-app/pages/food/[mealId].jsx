import { loadFoodEntries } from '../../lib/backend-utils/food-utils'
import { useTranslation } from 'next-i18next'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Food ({ meal }) {
  const { t } = useTranslation('food')

  return (
    <AppContainer>
      <AppNavbar title={t('list.titles.meals')} showBack={'desktop-only'}/>

      <AppBody>
        <h1>{meal?.name.de}</h1>

        <br/>

      </AppBody>

      <AppTabbar/>
    </AppContainer>
  )
}

export const getServerSideProps = async ({ locale, params }) => {
  const mealId = params.mealId

  const data = await loadFoodEntries()
  const day = mealId.split('-').slice(0, 3).join('-')
  const dayData = data.find(dayData => dayData.timestamp === day).meals || []
  const meal = dayData.find(meal => meal.id === mealId)

  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', [
        'food',
        'common'
      ])),
      meal
    }
  }
}
