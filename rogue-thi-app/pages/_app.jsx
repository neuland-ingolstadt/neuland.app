import { React, createContext } from 'react'

import { appWithTranslation } from 'next-i18next'

import PropTypes from 'prop-types'

import '../styles/globals.css'

import DashboardProvider from '../lib/providers/DashboardProvider'
import FoodFilterProvider from '../lib/providers/FoodFilterProvider'
import ModalProvider from '../lib/providers/ModalProvider'
import StyleProvider from '../lib/providers/StyleProvider'
import ThemeProvider from '../lib/providers/ThemeProvider'

export const DashboardContext = createContext({})

function MyApp({ Component, pageProps }) {
  return (
    <ModalProvider>
      <ThemeProvider>
        <FoodFilterProvider>
          <DashboardProvider>
            <StyleProvider>
              <Component {...pageProps} />
            </StyleProvider>
          </DashboardProvider>
        </FoodFilterProvider>
      </ThemeProvider>
    </ModalProvider>
  )
}

MyApp.propTypes = {
  Component: PropTypes.any,
  pageProps: PropTypes.any,
  theme: PropTypes.string,
}

export default appWithTranslation(MyApp)
