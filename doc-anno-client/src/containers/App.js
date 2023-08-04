import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  fetchDatasets,
  requestDocuments,
  fetchDocuments,
  resetErrorMessage
} from '../actions'
import Documents from '../components/Documents'
import {
  Container,
  Dimmer,
  Loader
} from 'semantic-ui-react'
import Navigation from '../components/Navigation'

const DEFAULT_DATASET = 'demo'

export class App extends Component {
  componentDidMount () {
    const { dispatch, documentFilter } = this.props
    // fetch list of datasets and list of documents of default dataset on start
    dispatch(fetchDatasets())
    dispatch(fetchDocuments(documentFilter, DEFAULT_DATASET))
  }

  componentDidUpdate (prevProps) {
    const { dispatch, documentFilter, datasetFilter } = this.props
    // fetch document list again if filter changes
    if (prevProps.documentFilter !== documentFilter || prevProps.datasetFilter !== datasetFilter) {
      dispatch(fetchDocuments(documentFilter, datasetFilter))
    }
  }

  handleChange = nextDocument => {
    const { dispatch, datasetFilter } = this.props
    dispatch(requestDocuments(nextDocument, datasetFilter))
  };

  handleSelect = dataset => {
    const { dispatch, documentFilter } = this.props
    dispatch(requestDocuments(documentFilter, dataset))
  };

  handleDismissClick = e => {
    this.props.dispatch(resetErrorMessage())
    e.preventDefault()
  };

  renderErrorMessage () {
    const { error } = this.props
    if (!error) {
      return null
    }

    return (
      <p style={{ backgroundColor: '#e99', padding: 10 }}>
        <b>{error}</b>{' '}
        <button onClick={this.handleDismissClick}>Dismiss</button>
      </p>
    )
  }

  render () {
    const { documentFilter, datasetFilter, annotationsByDocument, documents, datasets, isFetching } = this.props
    const isEmpty = documents.length === 0
    const filteredDocuments = Object.values(documents).filter(
      d => (documentFilter === '' || d.id.includes(documentFilter) || d.title.includes(documentFilter)) &&
        d.dataset === datasetFilter
    )
    return (
      <div>
        <Navigation
          documentFilter={documentFilter}
          datasetFilter={datasetFilter}
          annotationsByDocument={annotationsByDocument}
          datasets={datasets}
          onChange={this.handleChange}
          onSelect={this.handleSelect} />
        <Container style={{ marginTop: '7em' }}>
          {this.renderErrorMessage()}
          {isEmpty ? (
            isFetching ? (
              <Dimmer active>
                <Loader size='massive' />
              </Dimmer>
            ) : (
              <h2>Empty.</h2>
            )
          ) : (
            <div style={{ opacity: isFetching ? 0.5 : 1 }}>
              <Documents documents={filteredDocuments} />
            </div>
          )}
        </Container>
      </div>
    )
  }
}

const mapStateToProps = state => {
  const { documentFilter, datasetFilter, annotationsByDocument, documents, datasets, error } = state

  return {
    documentFilter,
    datasetFilter,
    annotationsByDocument,
    documents,
    datasets,
    isFetching: false,
    error
  }
}

App.propTypes = {
  dispatch: PropTypes.func.isRequired,
  documentFilter: PropTypes.string.isRequired,
  datasetFilter: PropTypes.string.isRequired,
  annotationsByDocument: PropTypes.object.isRequired,
  documents: PropTypes.object.isRequired,
  datasets: PropTypes.array.isRequired,
  isFetching: PropTypes.bool.isRequired,
  error: PropTypes.string
}

export default connect(mapStateToProps)(App)
