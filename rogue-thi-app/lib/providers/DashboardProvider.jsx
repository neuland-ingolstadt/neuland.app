import { createContext, useContext, useEffect, useState } from 'react'
import { useUserKind } from '../hooks/user-kind'

import {
  ALL_DASHBOARD_CARDS,
  PLATFORM_DESKTOP,
  PLATFORM_MOBILE,
} from '../../components/allCards'

const initialState = {}

const DashboardContext = createContext(initialState)

/**
 * Check whether to display this card by default property e.g. user kind or current platform
 */
function shouldDisplayCardByDefault(card, userKind) {
  const platform = window.matchMedia('(max-width: 768px)').matches
    ? PLATFORM_MOBILE
    : PLATFORM_DESKTOP

  return card.default.includes(platform) && card.default.includes(userKind)
}

/**
 * Get the default order of shown and hidden dashboard entries
 */
function getDefaultDashboardOrder(userKind) {
  return {
    shown: ALL_DASHBOARD_CARDS.filter((x) =>
      shouldDisplayCardByDefault(x, userKind)
    ),
    hidden: ALL_DASHBOARD_CARDS.filter(
      (x) => !shouldDisplayCardByDefault(x, userKind)
    ),
  }
}

export default function DashboardProvider({ children }) {
  const [shownDashboardEntries, setShownDashboardEntries] = useState([])
  const [hiddenDashboardEntries, setHiddenDashboardEntries] = useState([])
  const [unlockedThemes, setUnlockedThemes] = useState([])
  const { userKind } = useUserKind()

  useEffect(() => {
    async function load() {
      if (localStorage.personalizedDashboard) {
        const entries = JSON.parse(localStorage.personalizedDashboard)
          .map((key) => ALL_DASHBOARD_CARDS.find((x) => x.key === key))
          .filter((x) => !!x)
        const hiddenEntries = JSON.parse(
          localStorage.personalizedDashboardHidden
        )
          .map((key) => ALL_DASHBOARD_CARDS.find((x) => x.key === key))
          .filter((x) => !!x)

        ALL_DASHBOARD_CARDS.forEach((card) => {
          if (
            !entries.find((x) => x.key === card.key) &&
            !hiddenEntries.find((x) => x.key === card.key) &&
            shouldDisplayCardByDefault(card, userKind)
          ) {
            // new (previously unknown) card
            entries.splice(0, 0, card)
          }
        })

        setShownDashboardEntries(entries)
        setHiddenDashboardEntries(hiddenEntries)
      } else {
        const entries = getDefaultDashboardOrder(userKind)
        setShownDashboardEntries(entries.shown)
        setHiddenDashboardEntries(entries.hidden)
      }

      if (localStorage.unlockedThemes) {
        setUnlockedThemes(JSON.parse(localStorage.unlockedThemes))
      }
    }

    load()
  }, [userKind])

  /**
   * Persists the dashboard settings.
   * @param {object[]} entries Displayed entries
   * @param {object[]} hiddenEntries Hidden entries
   */
  function changeDashboardEntries(entries, hiddenEntries) {
    localStorage.personalizedDashboard = JSON.stringify(
      entries.map((x) => x.key)
    )
    localStorage.personalizedDashboardHidden = JSON.stringify(
      hiddenEntries.map((x) => x.key)
    )
    setShownDashboardEntries(entries)
    setHiddenDashboardEntries(hiddenEntries)
  }

  /**
   * Moves a dashboard entry to a new position.
   * @param {number} oldIndex Old position
   * @param {number} diff New position relative to the old position
   */
  function moveDashboardEntry(oldIndex, diff) {
    const newIndex = oldIndex + diff
    if (newIndex < 0 || newIndex >= shownDashboardEntries.length) {
      return
    }

    const entries = shownDashboardEntries.slice(0)
    const entry = entries[oldIndex]
    entries.splice(oldIndex, 1)
    entries.splice(newIndex, 0, entry)

    changeDashboardEntries(entries, hiddenDashboardEntries)
  }

  /**
   * Hides a dashboard entry.
   * @param {string} key Entry key
   */
  function hideDashboardEntry(key) {
    const entries = shownDashboardEntries.slice(0)
    const hiddenEntries = hiddenDashboardEntries.slice(0)

    const index = entries.findIndex((x) => x.key === key)
    if (index >= 0) {
      hiddenEntries.push(entries[index])
      entries.splice(index, 1)
    }

    changeDashboardEntries(entries, hiddenEntries)
  }

  /**
   * Unhides a dashboard entry.
   * @param {number} index Entry position
   */
  function bringBackDashboardEntry(index) {
    const entries = shownDashboardEntries.slice(0)
    const hiddenEntries = hiddenDashboardEntries.slice(0)

    entries.push(hiddenEntries[index])
    hiddenEntries.splice(index, 1)

    changeDashboardEntries(entries, hiddenEntries)
  }

  /**
   * Resets which dashboard entries are shown and their order to default
   */
  function resetOrder() {
    const defaultEntries = getDefaultDashboardOrder(userKind)
    setShownDashboardEntries(defaultEntries.shown)
    setHiddenDashboardEntries(defaultEntries.hidden)
    changeDashboardEntries(defaultEntries.shown, defaultEntries.hidden)
  }

  const value = {
    shownDashboardEntries,
    hiddenDashboardEntries,
    unlockedThemes,
    moveDashboardEntry,
    hideDashboardEntry,
    bringBackDashboardEntry,
    resetOrder,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
