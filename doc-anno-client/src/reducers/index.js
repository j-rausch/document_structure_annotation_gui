import { combineReducers } from 'redux'
import history from '../history'
import {
  RECEIVE_DATASETS,
  REQUEST_DOCUMENTS,
  RECEIVE_DOCUMENTS,
  REQUEST_DOCUMENT,
  RECEIVE_DOCUMENT,
  FAIL_DOCUMENT,
  REQUEST_ANNOTATIONS,
  RECEIVE_ANNOTATIONS,
  FAIL_ANNOTATIONS,
  INVALIDATE_ANNOTATIONS,
  MODIFY_ANNOTATIONS,
  COPY_ANNOTATIONS,
  ADD_STRUCTURE,
  ADD_STRUCTURES,
  UPDATE_STRUCTURE,
  ADD_ANNOTATION,
  ADD_ANNOTATIONS,
  UPDATE_ANNOTATION,
  UPDATE_ANNOTATIONS,
  DELETE_ANNOTATION,
  CHANGE_PAGE,
  RESET_ERROR_MESSAGE,
  ATTACH_HANDLER,
  MARK_ANNOTATION,
  SELECT_ANNOTATIONS,
  CHANGE_VERSION,
  receiveDocument
} from '../actions'

const documentFilter = (state = '', action) => {
  switch (action.type) {
    case REQUEST_DOCUMENTS:
      return action.name
    default:
      return state
  }
}

const datasetFilter = (state = 'demo', action) => {
  switch (action.type) {
    case REQUEST_DOCUMENTS:
      return action.dataset
    default:
      return state
  }
}

const newVersion = (state = '', action) => {
  switch (action.type) {
    case CHANGE_VERSION:
      return action.version
    default:
      return state
  }
}

const document = (
  state = {
    isFetching: false,
    didInvalidate: false
  },
  action
) => {
  switch (action.type) {
    case REQUEST_DOCUMENT:
      return {
        ...state,
        isFetching: true,
        didInvalidate: false
      }
    case RECEIVE_DOCUMENT:
      return {
        ...state,
        isFetching: false,
        didInvalidate: false,
        ...action.json,
        lastUpdated: action.receivedAt
      }
    case FAIL_DOCUMENT:
      return {
        ...state,
        isFetching: false
      }
    default:
      return state
  }
}

const documents = (state = {}, action) => {
  switch (action.type) {
    case REQUEST_DOCUMENT:
    case RECEIVE_DOCUMENT:
    case FAIL_DOCUMENT:
      return {
        ...state,
        [action.identifier]: document(
          state[action.identifier],
          action
        )
      }
    case RECEIVE_DOCUMENTS:
      return {
        ...state,
        ...Object.keys(action.json).reduce((prev, curr) => {
          prev[curr] = document(
            state[action.json[curr]['dataset'] + '/' + action.json[curr]['id']],
            receiveDocument(action.json[curr]['dataset'] + '/' + action.json[curr]['id'], action.json[curr])
          )
          return prev
        }, {})
      }
    default:
      return state
  }
}

const annotations = (
  state = {
    isFetching: false,
    didInvalidate: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case INVALIDATE_ANNOTATIONS:
      return {
        ...state,
        didInvalidate: true
      }
    case REQUEST_ANNOTATIONS:
      return {
        ...state,
        isFetching: true,
        didInvalidate: false
      }
    case RECEIVE_ANNOTATIONS:
      return {
        ...state,
        isFetching: false,
        didInvalidate: false,
        items: action.annotations,
        handler: null,
        marked: null,
        markedFocus: false,
        dirty: false,
        page: 0,
        lastUpdated: action.receivedAt
      }
    case ADD_STRUCTURE:
      return {
        ...state,
        items: [...state.items, {
          id: action.id,
          parent: action.parent,
          category: action.category,
          properties: action.properties
        }],
        dirty: true
      }
    case ADD_STRUCTURES:
      var newStructArray = action.structures.map(
        (struct) => {
          var newStruct = {
            id: struct.id,
            parent: struct.parent ? struct.parent : null,
            category: struct.category || 'unk',
            properties: struct.properties
          }
          return newStruct
        }
      )
      return {
        ...state,
        items: [
          ...state.items,
          ...newStructArray
        ],
        dirty: true
      }

    case UPDATE_STRUCTURE:
      return {
        ...state,
        items: state.items.map(
          el =>
            el.id === action.id
              ? Object.assign(
                {}, el,
                action.category ? {
                  category: action.category
                } : {},
                action.parent ? {
                  parent: action.parent
                } : {},
                action.properties ? {
                  properties: action.properties(el.properties || '')
                } : {}
              )
              : el
        ),
        dirty: true
      }
    case ADD_ANNOTATION:
      return {
        ...state,
        items: [...state.items, {
          id: action.id,
          parent: action.parent,
          page: action.page,
          category: 'box',
          bbox: [action.x, action.y, action.width, action.height]
        }],
        handler: action.id,
        dirty: true
      }
    case ADD_ANNOTATIONS:
      var newAnnArray = action.annotations.map(
        (ann) => {
          var newAnn = {
            id: ann.id,
            parent: ann.parent ? ann.parent : null,
            page: ann.page,
            category: 'box',
            bbox: [ann.x, ann.y, ann.width, ann.height]
          }
          return newAnn
        }
      )
      return {
        ...state,
        items: [...state.items,
          ...newAnnArray
        ],
        dirty: true
      }
    case UPDATE_ANNOTATION:
      return {
        ...state,
        items: state.items.map(
          el =>
            el.id === action.id
              ? Object.assign(
                {}, el,
                action.x || action.y || action.width || action.height ? {
                  bbox: [action.x, action.y, action.width, action.height]
                } : {},
                action.parent ? {
                  parent: action.parent
                } : {},
                action.text ? {
                  text: action.text
                } : {}
              )
              : el
        ),
        dirty: true
      }

    case UPDATE_ANNOTATIONS:
      return {
        ...state,
        items: state.items.map(
          el => {
            for (const updateAnn of action.annotationUpdates) {
              if (el.id === updateAnn.id) {
                return Object.assign(
                  {}, el,
                  updateAnn.bbox ? {
                    bbox: updateAnn.bbox
                  } : {},
                  updateAnn.parent ? {
                    parent: updateAnn.parent
                  } : {},
                  updateAnn.text ? {
                    text: updateAnn.text
                  } : {}
                )
              }
            }
            return el
          }
        ),
        dirty: true
      }

    case DELETE_ANNOTATION:
      return {
        ...state,
        items: state.items.filter(el => el.id !== action.id),
        handler: action.id === state.handler ? null : state.handler,
        marked: action.id === state.marked ? null : state.marked,
        dirty: true
      }
    case FAIL_ANNOTATIONS:
      return {
        ...state,
        isFetching: false
      }
    case MODIFY_ANNOTATIONS:
      return {
        ...state,
        items: action.annotations
      }
    case ATTACH_HANDLER:
      return {
        ...state,
        handler: action.handler
      }
    case MARK_ANNOTATION:
      return {
        ...state,
        marked: action.annotation,
        markedFocus: action.focus
      }
    case CHANGE_PAGE:
      return {
        ...state,
        page: action.page,
        handler: null
      }
    default:
      return state
  }
}

const annotationsByDocument = (state = {}, action) => {
  switch (action.type) {
    case INVALIDATE_ANNOTATIONS:
    case RECEIVE_ANNOTATIONS:
    case REQUEST_ANNOTATIONS:
    case FAIL_ANNOTATIONS:
    case MODIFY_ANNOTATIONS:
    case ADD_STRUCTURE:
    case ADD_STRUCTURES:
    case UPDATE_STRUCTURE:
    case ADD_ANNOTATION:
    case ADD_ANNOTATIONS:
    case UPDATE_ANNOTATION:
    case UPDATE_ANNOTATIONS:
    case DELETE_ANNOTATION:
    case ATTACH_HANDLER:
    case MARK_ANNOTATION:
    case SELECT_ANNOTATIONS:
    case CHANGE_PAGE:
      return {
        ...state,
        [action.identifier]: annotations(
          state[action.identifier],
          action
        )
      }
    case COPY_ANNOTATIONS:
      history.push('/' + action.newIdentifier)
      return {
        ...state,
        [action.newIdentifier]: state[action.identifier]
      }
    default:
      return state
  }
}

const datasets = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_DATASETS:
      return action.json
    default:
      return state
  }
}

const error = (state = null, action) => {
  const { type, error } = action

  if (type === RESET_ERROR_MESSAGE) {
    return null
  } else if (error) {
    return error
  }

  return state
}

const rootReducer = combineReducers({
  documentFilter,
  datasetFilter,
  newVersion,
  documents,
  annotationsByDocument,
  datasets,
  error
})

export default rootReducer
