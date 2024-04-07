import { createContext, useContext, useState } from 'react'

const initialState = {
  showLanguageModal: false,
  setShowLanguageModal: () => {},
  showDashboardModal: false,
  setShowDashboardModal: () => {},
  showThemeModal: false,
  setShowThemeModal: () => {},
  showPersonalDataModal: false,
  setShowPersonalDataModal: () => {},
}

const ModalContext = createContext(initialState)

export default function ModalProvider({ children }) {
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showDashboardModal, setShowDashboardModal] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showPersonalDataModal, setShowPersonalDataModal] = useState(false)

  const value = {
    showLanguageModal,
    setShowLanguageModal,
    showDashboardModal,
    setShowDashboardModal,
    showThemeModal,
    setShowThemeModal,
    showPersonalDataModal,
    setShowPersonalDataModal,
  }

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

export const useModals = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModals must be used within a ModalProvider')
  }
  return context
}
