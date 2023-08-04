export const RECEIVE_DATASETS = 'RECEIVE_DATASETS'
export const FAIL_DATASETS = 'FAIL_DATASETS'

export const REQUEST_DOCUMENTS = 'REQUEST_DOCUMENTS'
export const RECEIVE_DOCUMENTS = 'RECEIVE_DOCUMENTS'
export const FAIL_DOCUMENTS = 'FAIL_DOCUMENTS'
export const REQUEST_DOCUMENT = 'REQUEST_DOCUMENT'
export const RECEIVE_DOCUMENT = 'RECEIVE_DOCUMENT'
export const FAIL_DOCUMENT = 'FAIL_DOCUMENT'

export const REQUEST_ANNOTATIONS = 'REQUEST_ANNOTATIONS'
export const RECEIVE_ANNOTATIONS = 'RECEIVE_ANNOTATIONS'
export const FAIL_ANNOTATIONS = 'FAIL_ANNOTATIONS'
export const INVALIDATE_ANNOTATIONS = 'INVALIDATE_ANNOTATIONS'
export const MODIFY_ANNOTATIONS = 'MODIFY_ANNOTATIONS'
export const COPY_ANNOTATIONS = 'COPY_ANNOTATIONS'

export const ADD_STRUCTURE = 'ADD_STRUCTURE'
export const ADD_STRUCTURES = 'ADD_STRUCTURES'
export const UPDATE_STRUCTURE = 'UPDATE_STRUCTURE'
export const ADD_ANNOTATION = 'ADD_ANNOTATION'
export const ADD_ANNOTATIONS = 'ADD_ANNOTATIONS'
export const UPDATE_ANNOTATION = 'UPDATE_ANNOTATION'
export const UPDATE_ANNOTATIONS = 'UPDATE_ANNOTATIONS'
export const DELETE_ANNOTATION = 'DELETE_ANNOTATION'
export const MARK_ANNOTATION = 'MARK_ANNOTATION'
export const SELECT_ANNOTATIONS = 'SELECT_ANNOTATIONS'
export const ATTACH_HANDLER = 'ATTACH_HANDLER'

export const CHANGE_PAGE = 'CHANGE_PAGE'
export const CHANGE_VERSION = 'CHANGE_VERSION'
export const RESET_ERROR_MESSAGE = 'RESET_ERROR_MESSAGE'

const arrayToObject = (array, ident) =>
  array.reduce((obj, item) => {
    obj[ident(item)] = item
    return obj
  }, {})

const handleErrors = response => {
  if (!response.ok) {
    throw Error(response.statusText)
  }
  return response
}

export const receiveDatasets = json => ({
  type: RECEIVE_DATASETS,
  json,
  receivedAt: Date.now()
})

export const failDatasets = error => ({
  type: FAIL_DATASETS,
  error: error.message,
  receivedAt: Date.now()
})

export const fetchDatasets = () => dispatch => {
  return fetch(`/api/documents/datasets`)
    .then(handleErrors)
    .then(response => response.json())
    .then(json => dispatch(receiveDatasets(json)))
    .catch(error => dispatch(failDatasets(error)))
}

export const requestDocuments = (name, dataset) => ({
  type: REQUEST_DOCUMENTS,
  name,
  dataset
})

export const receiveDocuments = (identifier, json) => ({
  type: RECEIVE_DOCUMENTS,
  json: arrayToObject(json, item => item['dataset'] + '/' + item['id']),
  receivedAt: Date.now()
})

export const failDocuments = (name, error) => ({
  type: FAIL_DOCUMENTS,
  name,
  error: error.message,
  receivedAt: Date.now()
})

export const fetchDocuments = (name, dataset) => dispatch => {
  return fetch(`/api/documents/?search=${name}&dataset=${dataset}`)
    .then(handleErrors)
    .then(response => response.json())
    .then(json => dispatch(receiveDocuments(name, json)))
    .catch(error => dispatch(failDocuments(name, error)))
}

export const requestDocument = identifier => ({
  type: REQUEST_DOCUMENT,
  identifier
})

export const receiveDocument = (identifier, json) => ({
  type: RECEIVE_DOCUMENT,
  identifier,
  json,
  receivedAt: Date.now()
})

export const failDocument = (identifier, error) => ({
  type: FAIL_DOCUMENT,
  identifier,
  error: error.message,
  receivedAt: Date.now()
})

export const fetchDocument = identifier => dispatch => {
  const [dataset, document] = identifier.split('/')
  return fetch(`/api/documents/${dataset}/${document}`)
    .then(handleErrors)
    .then(response => response.json())
    .then(json => dispatch(receiveDocument(identifier, json)))
    .catch(error => dispatch(failDocument(identifier, error)))
}

const shouldFetchDocument = (state, identifier) => {
  const documents = state.documents[identifier]
  if (!documents) {
    return true
  }
  if (documents.isFetching) {
    return false
  }
  return documents.didInvalidate
}

export const fetchDocumentIfNeeded = identifier => (
  dispatch,
  getState
) => {
  if (shouldFetchDocument(getState(), identifier)) {
    return dispatch(fetchDocument(identifier))
  }
}

export const requestAnnotations = (identifier) => ({
  type: REQUEST_ANNOTATIONS,
  identifier
})

export const receiveAnnotations = (identifier, json) => ({
  type: RECEIVE_ANNOTATIONS,
  identifier,
  annotations: json,
  receivedAt: Date.now()
})

export const modifyAnnotations = (identifier, json) => ({
  type: MODIFY_ANNOTATIONS,
  identifier,
  annotations: json
})

export const addStructure = (identifier, id, category, parent = null, properties = undefined) => ({
  type: ADD_STRUCTURE,
  identifier,
  id,
  category,
  parent,
  properties
})

export const addStructures = (identifier, structures) => ({
  type: ADD_STRUCTURES,
  identifier,
  structures
})

export const updateStructure = (identifier, id, category, parent = null, properties = undefined) => ({
  type: UPDATE_STRUCTURE,
  identifier,
  id,
  category,
  parent,
  properties
})

export const addAnnotation = (identifier, id, page, x, y, width = 100, height = 20, parent = null) => ({
  type: ADD_ANNOTATION,
  identifier,
  id,
  page,
  x,
  y,
  width,
  height,
  parent
})

export const addAnnotations = (identifier, annotations) => ({
  type: ADD_ANNOTATIONS,
  identifier,
  annotations
})

export const updateAnnotation = (
  identifier,
  id,
  x,
  y,
  width,
  height,
  parent,
  text
) => ({
  type: UPDATE_ANNOTATION,
  identifier,
  id,
  x,
  y,
  width,
  height,
  parent,
  text
})

export const updateAnnotations = (
  identifier,
  annotationUpdates
) => ({
  type: UPDATE_ANNOTATIONS,
  identifier,
  annotationUpdates
})

export const deleteAnnotation = (identifier, id) => ({
  type: DELETE_ANNOTATION,
  identifier,
  id
})

export const failAnnotations = (identifier, error) => ({
  type: FAIL_ANNOTATIONS,
  identifier,
  error: error.message || error,
  receivedAt: Date.now()
})

export const fetchAnnotations = identifier => dispatch => {
  const [dataset, document, version] = identifier.split('/')
  return fetch(`/documents/${dataset}/${document}/${document}-${version}.json`)
    .then(handleErrors)
    .then(response => response.json())
    .then(json => dispatch(receiveAnnotations(identifier, json)))
    .catch(error => dispatch(failAnnotations(identifier, error)))
}

const shouldFetchAnnotations = (state, identifier) => {
  const annotations =
        state.annotationsByDocument[identifier]
  if (!annotations) {
    return true
  }
  if (annotations.isFetching) {
    return false
  }
  return annotations.didInvalidate
}

export const fetchAnnotationsIfNeeded = (identifier) => (
  dispatch,
  getState
) => {
  if (shouldFetchAnnotations(getState(), identifier)) {
    return dispatch(fetchAnnotations(identifier))
  }
}

export const storeAnnotations = (identifier, json) => dispatch => {
  const [dataset, document, version] = identifier.split('/')
  return fetch(`/api/documents/${dataset}/${document}/${version}`, {
    method: 'PUT',
    body: JSON.stringify(json),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(handleErrors)
    .then(response => response.json())
    .then(() => dispatch(failAnnotations(identifier, 'Saved Annotations')))
    .catch(error => dispatch(failAnnotations(identifier, error)))
}

export const copyAnnotations = (identifier, asVersion) => {
  const [dataset, document] = identifier.split('/')
  const newIdentifier = [dataset, document, asVersion].join('/')
  return {
    type: COPY_ANNOTATIONS,
    identifier,
    newIdentifier
  }
}

export const changeVersion = version => ({
  type: CHANGE_VERSION,
  version
})

export const attachHandler = (identifier, annotation) => ({
  type: ATTACH_HANDLER,
  identifier,
  handler: annotation
})

export const markAnnotation = (identifier, annotation, focus = false) => ({
  type: MARK_ANNOTATION,
  identifier,
  annotation,
  focus
})

export const changePage = (identifier, page) => ({
  type: CHANGE_PAGE,
  identifier,
  page
})

export const resetErrorMessage = () => ({
  type: RESET_ERROR_MESSAGE
})
