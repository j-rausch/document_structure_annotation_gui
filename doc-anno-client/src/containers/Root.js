import React from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import { Router, Route } from 'react-router-dom'
import App from './App'
import DocumentPage from './DocumentPage'
import history from '../history'

const Root = ({ store }) => (
  <Provider store={store}>
    <Router history={history}>
      <div>
        <Route exact path="/" component={App}/>
        <Route path="/:dataset/:document/:version" component={DocumentPage}/>
      </div>
    </Router>
  </Provider>
)

Root.propTypes = {
  store: PropTypes.object.isRequired,
  history: PropTypes.object
}

export default Root
