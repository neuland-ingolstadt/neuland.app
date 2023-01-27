import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Nav from 'react-bootstrap/Nav'
import SwipeableViews from 'react-swipeable-views'

/**
 * A `Tabs`-like component that is swipable on mobile.
 * @param {string} className Class name to attach to the entire object
 * @param {object} children Array of `SwipeableTab` objects
 */
export default function SwipeableTabs ({ className, children }) {
  const [page, setPage] = useState(0)

  return (
    <div className={className}>
      <Nav variant="pills" activeKey={page.toString()} onSelect={key => setPage(parseInt(key))}>
        {children.map((child, idx) =>
          <Nav.Item key={idx}>
            <Nav.Link eventKey={idx.toString()}>
              {child.props.title}
            </Nav.Link>
          </Nav.Item>
        )}
      </Nav>
      <SwipeableViews index={page} onChangeIndex={idx => setPage(idx)}>
        {children}
      </SwipeableViews>
    </div>
  )
}
SwipeableTabs.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any
}

/**
 * Object to be used as a child of `SwipeableTabs`.
 * @param {string} className Class name to attach to the tab
 */
export function SwipeableTab ({ className, children }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
SwipeableTab.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.any
}
