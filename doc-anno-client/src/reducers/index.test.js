import reducer from '.'
import { ADD_ANNOTATION, RECEIVE_ANNOTATIONS, REQUEST_DOCUMENTS, RESET_ERROR_MESSAGE } from '../actions'

const initialState = {
  documentFilter: '',
  newVersion: '',
  documents: {},
  annotationsByDocument: {},
  error: null
}

const annotationsState = {
  documentFilter: '',
  newVersion: '',
  documents: {},
  annotationsByDocument: {
    'demo/example/original': {
      isFetching: false,
      didInvalidate: false,
      items: [
        { id: 1, category: 'meta', expanded: true, parent: null }
      ],
      handler: null,
      marked: null,
      dirty: false,
      page: 0,
      lastUpdated: 1536136713564
    }
  },
  error: null
}

it('should return the initial state', () => {
  expect(reducer(undefined, {})).toEqual(initialState)
})

it('should handle REQUEST_DOCUMENTS', () => {
  expect(
    reducer(initialState, {
      type: REQUEST_DOCUMENTS,
      name: 'Name'
    })
  ).toEqual({
    ...initialState,
    documentFilter: 'Name'
  })
})

it('should handle errors', () => {
  expect(
    reducer(initialState, {
      error: 'Error Message'
    })
  ).toEqual({
    ...initialState,
    error: 'Error Message'
  })

  expect(
    reducer(initialState, {
      type: RESET_ERROR_MESSAGE
    })
  ).toEqual({
    ...initialState,
    error: null
  })
})

it('should handle RECEIVE_ANNOTATIONS', () => {
  expect(
    reducer(initialState, {
      type: RECEIVE_ANNOTATIONS,
      annotations: [
        { id: 1, category: 'meta', expanded: true, parent: null }
      ],
      identifier: 'demo/example/original',
      receivedAt: 1536136713564
    })
  ).toEqual({
    ...initialState,
    annotationsByDocument: {
      'demo/example/original': {
        isFetching: false,
        didInvalidate: false,
        items: [
          { id: 1, category: 'meta', expanded: true, parent: null }
        ],
        handler: null,
        marked: null,
        dirty: false,
        page: 0,
        lastUpdated: 1536136713564
      }
    }
  })
})

it('should handle ADD_ANNOTATION', () => {
  expect(
    reducer(annotationsState, {
      type: ADD_ANNOTATION,
      identifier: 'demo/example/original',
      x: 120,
      y: 180,
      width: 100,
      height: 20
    })
  ).toEqual({
    ...annotationsState,
    annotationsByDocument: {
      'demo/example/original': {
        ...annotationsState['annotationsByDocument']['demo/example/original'],
        items: [
          { id: 1, category: 'meta', expanded: true, parent: null },
          {
            id: new Date() / 1000 | 0,
            parent: null,
            page: 0,
            category: 'box',
            bbox: [120, 180, 100, 20]
          }
        ],
        handler: new Date() / 1000 | 0,
        dirty: true
      }
    }
  })
})
