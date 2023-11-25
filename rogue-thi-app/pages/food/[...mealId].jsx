import { getDayFromHash, loadFoodEntries } from '../../lib/backend-utils/food-utils'
import { useTranslation } from 'next-i18next'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'
import { FoodFilterContext } from '../_app'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useContext } from 'react'
import { useRouter } from 'next/router'

import { containsSelectedAllergen, containsSelectedPreference, formatGram, formatPrice, getAdjustedFoodLocale, getCategoryIcon, getUserSpecificPrice } from '../../lib/food-utils'
import allergenMap from '../../data/allergens.json'
import flagMap from '../../data/mensa-flags.json'

import styles from '../../styles/Meals.module.css'

import { faBolt, faCaretUp, faCubesStacked, faDrumstickBite, faEgg, faExclamationTriangle, faHeartCircleCheck, faUser, faUserGraduate, faUserTie, faWheatAwn } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useUserKind } from '../../lib/hooks/user-kind'

import Link from 'next/link'

export default function Food ({ meal }) {
  const router = useRouter()
  const { t, i18n } = useTranslation('food')
  const { userKind } = useUserKind()

  const {
    selectedLanguageFood,
    preferencesSelection,
    allergenSelection
  } = useContext(FoodFilterContext)

  if (!meal && typeof window !== 'undefined') {
    router.replace('/food')
    return null
  }

  const currentLocale = getAdjustedFoodLocale(selectedLanguageFood, i18n)
  const isTranslated = meal?.originalLanguage !== currentLocale && !meal.static

  function PriceCard ({ icon, category, price }) {
    return (
      <div className={`${styles.cardContainer} ${styles.priceCard} ${styles.card}`}>
        <FontAwesomeIcon icon={icon} className={styles.cardIcon}/>

        <div className={styles.priceCard}>
          <div className={styles.price}>{price}</div>
          <div className={styles.category}>{category}</div>
        </div>
      </div>
    )
  }

  function NutritionCard ({ icon, title, value, subTitle, subValue }) {
    return (
      <div className={`${styles.cardContainer}  ${styles.card}`}>
        <FontAwesomeIcon icon={icon} className={styles.cardIcon}/>

        <div className={styles.cardBody}>
          <div className={styles.nutritionRow}>
            <div className={styles.nutritionTitle}>{title}</div>
            <div className={styles.nutritionValue}>{value}</div>
          </div>
          <div className={styles.secondaryNutritionRow}>
            <div className={styles.nutritionTitle}>{subTitle}</div>
            <div className={styles.nutritionValue}>{subValue}</div>
          </div>
        </div>
      </div>
    )
  }

  function VariantCard ({ variant }) {
    return (
      <Link href={`/food/${variant.id}`}>
        <a className={'text-decoration-none text-reset'}>
          <div className={`${styles.cardContainer} ${styles.card}`}>
            <FontAwesomeIcon icon={getCategoryIcon(variant)} className={styles.cardIcon}/>

            <div className={styles.cardBody}>
              <div className={styles.price}>{`${variant.additional ? '+ ' : ''}${variant.name[currentLocale]}`}</div>
              <div className={styles.category}>{t('foodDetails.variants.click')}</div>
            </div>

            {`${variant.additional ? '+ ' : ''}${getUserSpecificPrice(variant, userKind)}`}
          </div>
        </a>
      </Link>

    )
  }

  return (
    <AppContainer>
      <AppNavbar title={t('list.titles.meals')}/>

      <AppBody className={styles.appBody}>
        {/* name */}
        <div>
          <h4>{meal?.name[currentLocale]}</h4>
          {meal?.parent && (
            <Link href={`/food/${meal.parent.id}`}>
              <a className={'text-decoration-none text-reset'}>
                <div className={styles.parentMeal}>
                  <FontAwesomeIcon icon={getCategoryIcon(meal)}/>
                  <p>{meal?.parent.name[currentLocale]}</p>

                </div>
              </a>
            </Link>
          )}
        </div>

        {/* tags (allergies, match, etc.) */}
        <div className={styles.indicator}>
          {containsSelectedAllergen(meal?.allergens, allergenSelection) && (
            <span className={`${styles.box} ${styles.warn}`}>
              <FontAwesomeIcon title={t('warning.unknownIngredients.iconTitle')} icon={faExclamationTriangle} className={styles.icon}/>
              {t('preferences.warn')}
            </span>
          )}
          {!containsSelectedAllergen(meal?.allergens, allergenSelection) && containsSelectedPreference(meal?.flags, preferencesSelection) && (
            <span className={`${styles.box} ${styles.match}`}>
              <FontAwesomeIcon title={t('preferences.iconTitle')} icon={faHeartCircleCheck} className={styles.icon}/>
              {t('preferences.match')}
            </span>
          )}
        </div>

        {/* prices */}
        <div className={styles.prices}>
          <PriceCard icon={faUserGraduate} category={t('foodDetails.prices.students')} price={formatPrice(meal?.prices.student)}/>
          <PriceCard icon={faUserTie} category={t('foodDetails.prices.employees')} price={formatPrice(meal?.prices.employee)}/>
          <PriceCard icon={faUser} category={t('foodDetails.prices.guests')} price={formatPrice(meal?.prices.guest)}/>
        </div>

        {/* variants */}
        {meal?.variants && meal?.variants.length > 0 && (
          <>
            <h6>{t('foodDetails.variants.title')}</h6>
            {meal?.variants.map((variant, i) => (
              <VariantCard key={i} variant={variant}/>
            ))}
          </>
        )}

        {/* notes */}
        <h6>{t('foodDetails.flags.title')}</h6>
        <div className={`${styles.cardContainer} ${styles.cardColumn} ${styles.card}`}>
          {meal?.flags === null && (
            <span className={styles.unknown}>
              {t('foodDetails.flags.unknown')}
            </span>
          )}

          {meal?.allergens?.length === 0 && `${t('foodDetails.flags.empty')}`}
          <ul>
            {meal?.flags?.map(flag => (
              <li key={flag} className={containsSelectedPreference([flag], preferencesSelection) ? styles.goodColor : ''}>
                <strong>{flag}</strong>
                {' – '}
                {flagMap[flag]?.[i18n.languages[0]] || `${t('foodDetails.allergens.fallback')}`}
              </li>
            ))}
          </ul>
        </div>

        {/* allergenes */}
        <h6>{t('foodDetails.allergens.title')}</h6>
        <div className={`${styles.cardContainer} ${styles.cardColumn} ${styles.card}`}>
          {meal?.allergens === null && (
            <span className={styles.unknown}>
              {t('foodDetails.allergens.unknown')}
            </span>
          )}
          {meal?.allergens?.length === 0 && `${t('foodDetails.allergens.empty')}`}
          <ul>
            {meal?.allergens?.map(key => (
              <li key={key} className={containsSelectedAllergen([key], allergenSelection) ? styles.warnColor : ''}>
                <strong>{key}</strong>
                {' – '}
                {allergenMap[key]?.[i18n.languages[0]] || `${t('foodDetails.allergens.fallback')}`}
              </li>
            ))}
          </ul>
        </div>

        {/* nutrition */}
        <h6>{t('foodDetails.nutrition.title')}</h6>
        {meal?.nutrition && (
          <div className={styles.nutrition}>
            <NutritionCard
              icon={faBolt}
              title={t('foodDetails.nutrition.energy.title')}
              value={`${meal?.nutrition.kj ? meal?.nutrition.kj + ' kJ' : ''} / ${meal?.nutrition.kcal ? meal?.nutrition.kcal + ' kcal' : ''}`}
            />
            <NutritionCard
              icon={faDrumstickBite}
              title={t('foodDetails.nutrition.fat.title')}
              value={formatGram(meal?.nutrition.fat)}
              subTitle={t('foodDetails.nutrition.fat.saturated')}
              subValue={formatGram(meal?.nutrition.fatSaturated)}
            />
            <NutritionCard
              icon={faCubesStacked}
              title={t('foodDetails.nutrition.carbohydrates.title')}
              value={formatGram(meal?.nutrition.carbs)}
              subTitle={t('foodDetails.nutrition.carbohydrates.sugar')}
              subValue={formatGram(meal?.nutrition.sugar)}
            />
            <NutritionCard
              icon={faWheatAwn}
              title={t('foodDetails.nutrition.fiber.title')}
              value={formatGram(meal?.nutrition.fiber)}
            />
            <NutritionCard
              icon={faEgg}
              title={t('foodDetails.nutrition.protein.title')}
              value={formatGram(meal?.nutrition.protein)}
            />
            <NutritionCard
              icon={faCaretUp}
              title={t('foodDetails.nutrition.salt.title')}
              value={formatGram(meal?.nutrition.salt)}
            />
          </div>)
        }
        {meal?.nutrition === null && (
          <div className={`${styles.cardContainer} ${styles.cardColumn} ${styles.card}`}>
            <span className={styles.unknown}>
              {t('foodDetails.allergens.unknown')}
            </span>
          </div>
        )}

        {/* disclaimer section */}
        <div>
          <p>
            <h6>{t('foodDetails.warning.title')}</h6>
            {`${isTranslated ? `${t('foodDetails.translation.warning')} ` : ''}${t('foodDetails.warning.text')}`}
          </p>

          {isTranslated && (
            <ul>
              <li>
                <strong>{t('foodDetails.translation.originalName')}</strong>:{' '}
                {meal?.name[meal.originalLanguage]}
              </li>
              <li>
                <strong>{t('foodDetails.translation.translatedName')}</strong>:{' '}
                {meal?.name[currentLocale]}
              </li>
            </ul>
          )}
        </div>

      </AppBody>

      <AppTabbar/>
    </AppContainer>
  )
}

export const getStaticProps = async ({ locale, params }) => {
  async function findMeal () {
    const mealId = params.mealId.join('/')

    const data = await loadFoodEntries()
    const day = getDayFromHash(mealId)
    const dayData = data.find(dayData => dayData.timestamp === day)

    if (!dayData) return null

    // flatten variants
    const variants = dayData.meals.flatMap(meal => meal.variants || [])
    const meals = [...dayData.meals, ...variants]

    return meals.find(meal => meal.id === mealId)
  }

  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', [
        'food',
        'common'
      ])),
      meal: await findMeal()
    },
    revalidate: 60 * 60 * 24 // 24 hours
  }
}

export async function getStaticPaths () {
  async function getBuildMeals () {
    const getData = async () => {
      try {
        const data = await loadFoodEntries()
        return data
      } catch (e) {
        console.error(e)
        return []
      }
    }

    // flatten variants
    const dayMeals = (await getData())
      .flatMap(day => day.meals)
    const variants = dayMeals.flatMap(meal => meal.variants || [])

    const meals = [...dayMeals, ...variants]

    return meals.map(meal => `/food/${meal.id}`)
  }

  return {
    paths: await getBuildMeals(),
    fallback: 'blocking'
  }
}
