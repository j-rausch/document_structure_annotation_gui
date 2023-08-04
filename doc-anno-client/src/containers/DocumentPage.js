import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  fetchDocumentIfNeeded,
  fetchAnnotationsIfNeeded,
  changePage,
  modifyAnnotations,
  updateAnnotation,
  updateAnnotations,
  storeAnnotations,
  attachHandler,
  addAnnotation,
  addAnnotations,
  markAnnotation,
  deleteAnnotation,
  resetErrorMessage,
  copyAnnotations,
  changeVersion,
  addStructure,
  addStructures,
  updateStructure
} from '../actions'
import { connect } from 'react-redux'
import Page from '../components/Page'
import Tree from '../components/Tree'
import { getTreeFromFlatData, getFlatDataFromTree } from 'react-sortable-tree'
import Navigation from '../components/Navigation'
import {
  Container,
  Loader,
  Input,
  Button,
  Icon,
  Label,
  Header,
  Segment,
  Grid,
  Message,
  Dropdown,
  Form
} from 'semantic-ui-react'

const KEYCODE_DEL = 46
const KEYCODE_ESC = 27
const KEYCODE_SHIFT = 16
const KEYCODE_J = 74
const KEYCODE_K = 75
const KEYCODE_I = 73
const KEYCODE_L = 76
const KEYCODE_C = 67
const KEYCODE_V = 86
const KEYCODE_Q = 81
const KEYCODE_E = 69
const KEYCODE_A = 65
const KEYCODE_S = 83
const KEYCODE_D = 68
const KEYCODE_W = 87

const categories = [
  'none',
  'meta',
  'document',
  'subject',
  'author',
  'date',
  'abstract',
  'affiliation',
  'bibliography',
  'bib_block',
  'page_nr',
  'head',
  'foot',
  'side',
  'index',
  'section',
  'heading',
  'paragraph',
  'content_block',
  'content_line',
  'content_lines',
  'itemize',
  'item',
  'equation',
  'equation_formula',
  'equation_label',
  'header',
  'line',
  'code',
  'footnote',
  'word',
  'character',
  'image',
  'figure',
  'figure_caption',
  'figure_graphic',
  'table',
  'table_caption',
  'tabular',
  'table_cell',
  'table_col',
  'table_row',
  'table_footnote'
].map(c => ({ key: c, value: c, text: c }))

const arrayToObject = (array, ident) =>
  array.reduce((obj, item) => {
    obj[ident(item)] = item
    return obj
  }, {})

const overlap = (bbox, selection) =>
  (bbox[0] + bbox[2] >= selection[0] && bbox[1] + bbox[3] >= selection[1]) &&
    (bbox[0] <= selection[0] + selection[2] && bbox[1] <= selection[1] + selection[3])

const union = bboxes => {
  // return minimum bounding rectangle of list of bounding boxes
  const x = bboxes.reduce((prev, curr) => prev < curr[0] ? prev : curr[0], undefined)
  const y = bboxes.reduce((prev, curr) => prev < curr[1] ? prev : curr[1], undefined)
  const width = bboxes.reduce((prev, curr) => prev > curr[0] + curr[2] ? prev : curr[0] + curr[2], undefined) - x
  const height = bboxes.reduce((prev, curr) => prev > curr[1] + curr[3] ? prev : curr[1] + curr[3], undefined) - y
  return [x, y, width, height]
}

// remove all "expanded" attributes that are added by React Sortable Tree when saving annotations
const clean = annotations => annotations.map(a => {
  const { expanded, ...cleaned } = a
  return cleaned
})

const newID = annotations => {
  // return new not previously existing ID
  const highest = annotations.reduce(function (a, b) { return a.id > b.id ? a : b })
  return highest.id + 1
}

//TODO: make this fully recursive
const cover = annotationsObject => {
  // add to structure elements all bounding boxes of annotations elements it contains one-level deep
  const result = { ...annotationsObject }
  for (const annotation of Object.values(annotationsObject).filter(a => a.bbox)) {
    let structure = result[annotation.parent]
    if (result[annotation.parent]) {
      result[annotation.parent] = {
        ...result[annotation.parent],
        bboxes: {
          ...(structure && structure.bboxes),
          [annotation.page]: [...((structure && structure.bboxes && structure.bboxes[annotation.page]) || []), annotation.bbox]
        }
      }
    }
    structure = structure && result[structure.parent]
    if (structure && result[structure.parent]) {
      result[structure.parent] = {
        ...result[structure.parent],
        bboxes: {
          ...(structure && structure.bboxes),
          [annotation.page]: [...((structure && structure.bboxes && structure.bboxes[annotation.page]) || []), annotation.bbox]
        }
      }
    }
  }
  return Object.values(result)
}

class DocumentPage extends Component {
  constructor () {
    super()
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleKeyUnpress = this.handleKeyUnpress.bind(this)
    this.state = { highlight: [], selections: {}, copiedAnns: [], category: 'none', column: 1, row: 1, cell: false, row_insert:false, col_insert:false, shift: false, mousePos: Array(2) }
  }

  componentDidMount () {
    // fetch document metadata and annotations if not yet retrieved from server
    const { dispatch, dataset, document: doc, identifier } = this.props
    dispatch(fetchDocumentIfNeeded(dataset + '/' + doc))
    dispatch(fetchAnnotationsIfNeeded(identifier))
    document.addEventListener('keydown', this.handleKeyPress)
    document.addEventListener('keyup', this.handleKeyUnpress)
  }

  componentWillUnmount () {
    document.removeEventListener('keydown', this.handleKeyPress)
    document.removeEventListener('keyup', this.handleKeyUnpress)
  }

  handleKeyPress (event) {
    const { dispatch, identifier, annotations, handler } = this.props
    if (event.keyCode === KEYCODE_DEL) {
      dispatch(deleteAnnotation(identifier, handler))
      for (const a of annotations) {
        if (a.bbox && this.state.selections[a.page] && overlap(a.bbox, this.state.selections[a.page])) {
          dispatch(deleteAnnotation(identifier, a.id))
        }
      }
    } else if (event.keyCode === KEYCODE_ESC) {
      dispatch(attachHandler(identifier, null))
      this.setState({ selections: {} })
    } else if (event.keyCode === KEYCODE_SHIFT) {
      this.setState({ shift: true })
      // move selected bboxes left
    } else if (event.keyCode === KEYCODE_J) {
      const movedAnnotations = []
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const movedAnn = {
            id: ann.id, bbox: [ann.bbox[0] - 1, ann.bbox[1], ann.bbox[2], ann.bbox[3]]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
      // move selected bboxes right
    } else if (event.keyCode === KEYCODE_L) {
      const movedAnnotations = []
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const movedAnn = {
            id: ann.id, bbox: [ann.bbox[0] + 1, ann.bbox[1], ann.bbox[2], ann.bbox[3]]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
      // move selected bboxes down
    } else if (event.keyCode === KEYCODE_K) {
      const movedAnnotations = []
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const movedAnn = {
            id: ann.id, bbox: [ann.bbox[0], ann.bbox[1] + 1, ann.bbox[2], ann.bbox[3]]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
      // move selected bboxes up
    } else if (event.keyCode === KEYCODE_I) {
      const movedAnnotations = []
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const movedAnn = {
            id: ann.id, bbox: [ann.bbox[0], ann.bbox[1] - 1, ann.bbox[2], ann.bbox[3]]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
      // copy all currently selected annotation bounding boxes for pasting them later
    } else if (event.keyCode === KEYCODE_C) {
      const newCopyAnns = []
      for (const a of annotations) {
        if ((a.id === handler) || (a.bbox && this.state.selections[a.page] && overlap(a.bbox, this.state.selections[a.page]))) {
          var parentProperties = null
          if (a.parent != null) {
            for (const p of annotations) {
              if (p.id === a.parent) {
                parentProperties = p.properties
              }
            }
          }
          newCopyAnns.push({ bbox: a.bbox.slice(), parentProperties: parentProperties })
        }
      }
      this.setState({ copiedAnns: newCopyAnns })
      // paste previously copied annotations at cursor position
    } else if (event.keyCode === KEYCODE_V) {
      const newCopyAnns = this.state.copiedAnns.slice()
      let minX = 10000
      let minY = 10000
      for (const ann of newCopyAnns) {
        const bbox = ann.bbox
        minX = bbox[0] < minX ? bbox[0] : minX
        minY = bbox[1] < minY ? bbox[1] : minY
      }
      const movedCopyAnnotations = newCopyAnns.map(
        (ann) => {
          const bbox = ann.bbox
          const newAnn = {
            x: bbox[0] - minX + this.state.mousePos[0],
            y: bbox[1] - minY + this.state.mousePos[1],
            width: bbox[2],
            height: bbox[3],
            page: this.props.page,
            parentProperties: ann.parentProperties
          }
          return newAnn
        }
      )
      this.handleAddAnnotations(movedCopyAnnotations)
      // extend all selected cells on the to the max and min X coordinates
    } else if (event.keyCode === KEYCODE_Q) {
      const movedAnnotations = []
      const movedAnnotationIds = new Set()
      let minX = 10000
      let maxX = 0
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const bbox = ann.bbox
          minX = bbox[0] < minX ? bbox[0] : minX
          maxX = bbox[0] + bbox[2] > maxX ? bbox[0] + bbox[2] : maxX
          movedAnnotationIds.add(ann.id)
        }
      }
      for (const ann of annotations) {
        if ((movedAnnotationIds.has(ann.id))) {
          const movedAnn = {
            id: ann.id, bbox: [minX, ann.bbox[1], maxX - minX, ann.bbox[3]]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
      // extend all selected cells on the to the max and min Y coordinates
    } else if (event.keyCode === KEYCODE_E) {
      const movedAnnotations = []
      const movedAnnotationIds = new Set()
      let minY = 10000
      let maxY = 0
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const bbox = ann.bbox
          minY = bbox[1] < minY ? bbox[1] : minY
          maxY = bbox[1] + bbox[3] > maxY ? bbox[1] + bbox[3] : maxY
          movedAnnotationIds.add(ann.id)
        }
      }
      for (const ann of annotations) {
        if ((movedAnnotationIds.has(ann.id))) {
          const movedAnn = {
            id: ann.id, bbox: [ann.bbox[0], minY, ann.bbox[2], maxY - minY]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
      // decrease width of all selected cells
    } else if (event.keyCode === KEYCODE_A) {
      const movedAnnotations = []
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const movedAnn = {
            id: ann.id, bbox: [ann.bbox[0], ann.bbox[1], ann.bbox[2] - 1, ann.bbox[3]]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
      // increase width of all selected cells
    } else if (event.keyCode === KEYCODE_D) {
      const movedAnnotations = []
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const movedAnn = {
            id: ann.id, bbox: [ann.bbox[0], ann.bbox[1], ann.bbox[2] + 1, ann.bbox[3]]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
      // decrease height of all selected cells
    } else if (event.keyCode === KEYCODE_W) {
      const movedAnnotations = []
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const movedAnn = {
            id: ann.id, bbox: [ann.bbox[0], ann.bbox[1], ann.bbox[2], ann.bbox[3] - 1]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
      // increase height of all selected cells
    } else if (event.keyCode === KEYCODE_S) {
      const movedAnnotations = []
      for (const ann of annotations) {
        if ((ann.id === handler) || (ann.bbox && this.state.selections[ann.page] && overlap(ann.bbox, this.state.selections[ann.page]))) {
          const movedAnn = {
            id: ann.id, bbox: [ann.bbox[0], ann.bbox[1], ann.bbox[2], ann.bbox[3] + 1]
          }
          movedAnnotations.push(movedAnn)
        }
      }
      dispatch(updateAnnotations(identifier, movedAnnotations))
    }
  }

  handleMouseMoved (x, y) {
    this.setState({ mousePos: [x, y] })
  }

  handleKeyUnpress (event) {
    if (event.keyCode === KEYCODE_SHIFT) {
      this.setState({ shift: false })
    }
  }

  renderErrorMessage () {
    const { error } = this.props
    if (!error) {
      return null
    }

    return (
      <Message negative>
        <Message.Header>{error}</Message.Header>
        <p><Button onClick={this.handleDismissClick}>Dismiss</Button></p>
      </Message>
    )
  }

  handleDismissClick = e => {
    this.props.dispatch(resetErrorMessage())
    e.preventDefault()
  }

  handlePageChange = page => {
    const { dispatch, identifier } = this.props
    dispatch(changePage(identifier, page))
  }

  handleAnnotationChange = (id, x, y, width, height) => {
    const { dispatch, identifier } = this.props
    dispatch(updateAnnotation(identifier, id, x, y, width, height))
  }

  handleAttachHandler = annotation => {
    const { dispatch, identifier } = this.props
    if (annotation != null) {
      dispatch(markAnnotation(identifier, annotation, true))
    }
    dispatch(attachHandler(identifier, annotation))
  }

  handleTreeChange = tree => {
    const { dispatch, identifier } = this.props
    const flatData = getFlatDataFromTree({
      treeData: tree,
      getNodeKey: ({ node }) => node.id,
      ignoreCollapsed: false
    }).map(({ node, path }) => ({
      id: node.id,
      category: node.category,
      page: node.page,
      bbox: node.bbox,
      properties: node.properties,
      text: node.text,
      expanded: node.expanded,
      parent: path.length > 1 ? path[path.length - 2] : null
    }))
    dispatch(modifyAnnotations(identifier, flatData))
  }

  handleTreeRemove = id => {
    const { dispatch, identifier } = this.props
    dispatch(deleteAnnotation(identifier, id))
  }

  handleTreeClick = (annotation, page) => {
    const { dispatch, identifier } = this.props
    if (page !== undefined && page !== this.props.page) {
      dispatch(changePage(identifier, page))
    }
    dispatch(markAnnotation(identifier, annotation))
    dispatch(attachHandler(identifier, annotation))
  }

  handleTreeMouseOver = annotations => {
    this.setState({ highlight: annotations() })
  }

  handleAnnotationCreation = (page, x, y) => {
    this.handleAddAnnotation(page, x, y, 100, 20)
  }

  handleAddAnnotation = (page, x, y, width, height) => {
    // add new annotation (with an appropriate structure element if in cell mode)
    const { dispatch, identifier, annotations, marked } = this.props
    const id = newID(annotations)
    if (this.state.category !== 'none') {
      dispatch(addStructure(identifier, id, this.state.category, marked))
      dispatch(addAnnotation(identifier, id + 1, page, x, y, width, height, id))
    } else {
      dispatch(addAnnotation(identifier, id, page, x, y, width, height, marked))
    }
  }

  handleAddAnnotations = (newAnnotations) => {
    const { dispatch, identifier, annotations, marked } = this.props
    const newHighestId = newID(annotations)
    const ids = Array.from({ length: newAnnotations.length }, (v, k) => k + newHighestId)

    if (this.state.category !== 'none') {
      var new_category = this.state.category
    
       
      const structIds = Array.from({ length: newAnnotations.length }, (v, k) => k + newHighestId + newAnnotations.length)
      dispatch(
        addStructures(
          identifier,
          newAnnotations.map(
            (ann, index) => {
              const newStruct = {
                id: structIds[index],
                category: new_category,
                parent: marked,
                properties: ann.parentProperties }
              return newStruct
            })
        )
      )
      dispatch(
        addAnnotations(
          identifier,
          newAnnotations.map(
            (ann, index) => {
              const newAnn = {
                identifier: identifier,
                id: ids[index],
                page: ann.page,
                x: ann.x,
                y: ann.y,
                width: ann.width,
                height: ann.height,
                parent: structIds[index]
              }
              return newAnn
            }
          )
        )
      )
    } else {
      dispatch(
        addAnnotations(
          identifier,
          newAnnotations.map(
            (ann, index) => {
              const newAnn = {
                identifier: identifier,
                id: ids[index],
                page: ann.page,
                x: ann.x,
                y: ann.y,
                width: ann.width,
                height: ann.height,
                parent: marked
              }
              return newAnn
            }
          )
        )
      )
    }
  }

  handleMergeAnnotations = annotations => {
    // merge multiple annotations to minimum bounding rectangle
    const { dispatch, identifier, annotationsObject } = this.props
    if (annotations.length > 1) {
      const bbox = union(annotations.map(a => annotationsObject[a].bbox))
      const text = annotations.map(a => annotationsObject[a].text).join(' ')
      for (const annotation of annotations.slice(1)) {
        dispatch(deleteAnnotation(identifier, annotation))
      }
      dispatch(updateAnnotation(identifier, annotations[0], bbox[0], bbox[1], bbox[2], bbox[3], undefined, text))
    }
  }

  handleAddStructure = (annotations, parent, category) => {
    // add annotations as children to existing or new (if non-null category) structure element
    const { dispatch, identifier, annotations: allAnnotations, annotationsObject } = this.props
    let id = parent
    if (category !== undefined) {
      id = newID(allAnnotations)
      dispatch(addStructure(identifier, id, category || 'unk', parent))
    }
    const structureParents = []
    for (const annotation of annotations) {
      structureParents.push(annotationsObject[annotation].parent)
    }
    let changeStructureParents = true
    for (const annotation of Object.values(annotationsObject)) {
      if (!annotations.includes(annotation.id) && structureParents.includes(annotation.parent)) {
        changeStructureParents = false
      }
    }

    if (changeStructureParents) {
      for (const annotation of structureParents) {
        dispatch(updateAnnotation(identifier, annotation, undefined, undefined, undefined, undefined, id))
      }
    } else {
      for (const annotation of annotations) {
        dispatch(updateAnnotation(identifier, annotation, undefined, undefined, undefined, undefined, id))
      }
    }
    this.setState({ selections: {} })
  }

  handleAddTable = (annotations, parent) => {
    // add new table_cell structure elements for each annotation element to a new table structure element
    const { dispatch, identifier, annotations: allAnnotations } = this.props
    let i = 0
    let ident = newID(allAnnotations)
    dispatch(addStructure(identifier, ident, 'table', parent, i))
    for (const annotation of annotations) {
      i++
      let id = ident + i
      dispatch(addStructure(identifier, id, 'table_cell', ident))
      dispatch(updateAnnotation(identifier, annotation, undefined, undefined, undefined, undefined, id))

    }
  }

  handleUpdateColumn = (annotations, number) => {
    // update number of column of all parent table_cell structure elements
    const { dispatch, identifier, annotationsObject } = this.props
    for (const annotation of annotations) {
      const cell = annotationsObject[annotationsObject[annotation].parent]
      if (cell.category === 'table_cell') {
        dispatch(updateStructure(identifier, cell.id, undefined, undefined, str => (str.split(',')[0] || '') + ',' + number))
      }
    }
  }

  handleUpdateRow = (annotations, number) => {
    // update number of row of all parent table_cell structure elements
    const { dispatch, identifier, annotationsObject } = this.props
    for (const annotation of annotations) {
      const cell = annotationsObject[annotationsObject[annotation].parent]
      if (cell.category === 'table_cell') {
        dispatch(updateStructure(identifier, cell.id, undefined, undefined, str => number + ',' + (str.split(',')[1] || '')))
      }
    }
  }

  handleSelection = (page, bbox, dragging) => {
    this.setState({
      selections: {
        ...this.state.selections,
        [page]: bbox
      }
    })
  }

  render () {
    const { dispatch, identifier, dataset, document, version, annotationsByDocument, annotations, annotationsObject, handler, markedFocus, marked, page, pages, title, newVersion, isFetching } = this.props
    // convert flat to tree structure for rendering with React Sortable Tree
    const treeData = annotations ? getTreeFromFlatData({
      flatData: annotations,
      getKey: node => node.id,
      getParentKey: node => node.parent,
      rootKey: null
    }) : null

    const image = p => '/documents/' + dataset + '/' + document + '/' + document + '-' + p + '.png'
    const annotationsCovered = cover(annotationsObject)
    // get all annotations inside selection
    const selection = annotations.filter(
      a => a.bbox && this.state.selections[a.page] && overlap(a.bbox, this.state.selections[a.page])
    ).map(a => a.id)
    const copiedAnns = this.state.copiedAnns
    return (
      <div>
        <Navigation annotationsByDocument={annotationsByDocument}/>
        <Container style={{ marginTop: '5em' }}>
          {this.renderErrorMessage()}
          {isFetching ? (
            <Loader inline='centered' size='massive'/>
          ) : (
            <div>
              <Segment>
                <Header as='h2'>
                  {title} <Label tag title="name of currently used annotation file">{version}</Label> 
                </Header>
                <Grid columns={2}>
                  <Grid.Column>
                    <input
                      id="page_number"
                      type="range"
                      min="1"
                      max={pages}
                      value={page + 1}
                      onChange={e => this.handlePageChange(e.target.value - 1)}
                      style={{ width: '256px' }}
                    />
                    <Label title='Number of currently selected page'>
                      Page
                      <Label.Detail>{page + 1}/{pages}</Label.Detail>
                    </Label>
                  </Grid.Column>
                  <Grid.Column width={6} floated='right'>
                    <Input id="copy_name" value={newVersion} onChange={e => dispatch(changeVersion(e.target.value))}
                      action
                        title='Specify name of new annotation file copy'
                        >
                      <input/>
                      <Button animated='vertical' onClick={() => dispatch(copyAnnotations(identifier, newVersion))}
                        title='Create a copy of the current annotation file with the user-specified name'
                      >
                        <Button.Content hidden>Copy</Button.Content>
                        <Button.Content visible>
                          <Icon name='copy'/>
                        </Button.Content>
                      </Button>
                    </Input>
                    <Button animated='vertical' onClick={() => dispatch(storeAnnotations(identifier, clean(annotations)))}
                        title='Save current changes to annotation file'>
                      <Button.Content hidden>Store</Button.Content>
                      <Button.Content visible>
                        <Icon name='save'/>
                      </Button.Content>
                    </Button>

                  </Grid.Column>
                </Grid>
              </Segment>
              <Grid columns={2}>
                <Grid.Column mobile={16} computer={9}>
                  <Grid.Row>
                    <Form onSubmit={() => this.handleAddStructure(selection, marked, this.state.category)}>
                      <Form.Field inline>
                        <Dropdown
                          placeholder='Category'
                          search
                          selection
                          onChange={(e, data) => this.setState({ category: data.value })}
                          value={this.state.category}
                          options={categories}
                          compact
                          style={{ width: '144px' }}
                          title='Add annotations as children of a new structure element (as specified in dropdown)'
                        />
                        <Button
                          icon='add circle'
                          disabled={false}
                          type='submit'
                          title='Add a structure element (as specified in dropdown) to the document tree'
                        />
                      </Form.Field>
                    </Form>
                    <Label color={selection.length > 0 ? 'yellow' : null} title='Number of selected annotations (multi-page)'>
                      <Icon name='expand' /> {selection.length}
                    </Label>
                    <Label color={copiedAnns.length > 0 ? 'blue' : null} title='Number of annotations in copy mode (press "c" button, paste with "v" button at cursor position)'>
                      clipboard: {copiedAnns.length}
                    </Label>
                    <Button
                      icon='add'
                      disabled={false}
                      onClick={() => this.handleAddStructure(selection, marked)}
                      title='Move selected boxes as children to currently selected structure element in tree view'
                    />
                    <Button
                      icon='compress'
                      disabled={false}
                      onClick={() => this.handleMergeAnnotations(selection)}
                      title='Merge annotations to minimum bounding rectangle'
                    />
                    &nbsp;
                    &nbsp;
                    &nbsp;
                    &nbsp;
                    &nbsp;
                    <Button
                      icon='table'
                      disabled={false}
                      onClick={() => this.handleAddTable(selection, marked)}
                      title='(Table annotation) Add all selected annotations cell structures to new parent table structure'
                    />
                    <div style={{ display: 'inline-block', width: '100px' }}>
                      <Input
                        disabled={false}
                        onChange={(e, data) => this.setState({ column: data.value })}
                        value={this.state.column}
                        fluid
                        action={{
                          icon: 'arrows alternate vertical',
                          onClick: () => this.handleUpdateColumn(selection, this.state.column),
                          title: '(Table annotation) Change column number of cells'
                        }}
                      />
                    </div>
                    <div style={{ display: 'inline-block', width: '100px' }}>
                      <Input
                        disabled={false}
                        onChange={(e, data) => this.setState({ row: data.value })}
                        value={this.state.row}
                        fluid
                        action={{
                          icon: 'arrows alternate horizontal',
                          onClick: () => this.handleUpdateRow(selection, this.state.row),
                          title: '(Table annotation) Change row number of cells'
                        }}
                      />
                    </div>
                  </Grid.Row>
                  <Grid.Row>
                    {[...Array(1).keys()].map(p => page + p).filter(p => p < pages).map(p => {// formulation could be used to return multi-page views
                      const annotationsPage = annotationsCovered.filter(a => a.page === p || (a.bboxes && (a.bboxes[p] || a.bboxes[p - 1] || a.bboxes[p + 1])))
                      return <Page
                        key={identifier + '_' + p}
                        page={p}
                        scale={1}//{1 / this.state.viewPages}
                        image={image(p)}
                        annotations={annotationsPage}
                        handler={handler}
                        onMousemove = {(x, y) => this.handleMouseMoved(x, y)}
                        highlight={this.state.highlight}
                        selection={this.state.selections[p]}
                        //copiedAnns={this.state.copiedAnns}
                        insertMode={this.state.shift}
                        onChange={this.handleAnnotationChange}
                        onClick={this.handleAttachHandler}
                        onSelection={bbox => this.handleSelection(p, bbox)}
                        onMouseup={(x, y, width, height) => this.handleAddAnnotation(p, x, y, width, height)} //handled in Page
                      />
                    })}
                  </Grid.Row>
                </Grid.Column>
                <Grid.Column mobile={16} computer={7}>
                  {treeData ? (
                    <div style={{ height: '100%' }}>
                      <Tree
                        treeData={treeData}
                        annotations={annotations}
                        annotationsObject={annotationsObject}
                        page={page}
                        handler={marked}
                        focus={markedFocus}
                        onRemove={this.handleTreeRemove}
                        onChange={this.handleTreeChange}
                        onClick={this.handleTreeClick}
                        onMouseOver={this.handleTreeMouseOver}
                      />
                    </div>) : null}
                </Grid.Column>
              </Grid>
            </div>
          )}
        </Container>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const dataset = ownProps.match.params.dataset
  const document = ownProps.match.params.document
  const version = ownProps.match.params.version
  const identifier = [dataset, document, version].join('/')

  const { documents, annotationsByDocument, newVersion, error } = state

  const { title, pages } = documents[dataset + '/' + document] || {
    title: '',
    pages: null
  }

  const {
    isFetching,
    items: annotations,
    handler,
    markedFocus,
    marked,
    page
  } = annotationsByDocument[identifier] || {
    isFetching: true,
    items: [],
  }

  const annotationsObject = arrayToObject(annotations, a => a.id)

  return {
    dataset,
    document,
    version,
    identifier,
    annotationsByDocument,
    title,
    isFetching,
    newVersion,
    error,
    annotations,
    annotationsObject,
    handler,
    markedFocus,
    marked,
    page,
    pages
  }
}

DocumentPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  dataset: PropTypes.string.isRequired,
  document: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,
  identifier: PropTypes.string.isRequired,
  annotationsByDocument: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  isFetching: PropTypes.bool.isRequired,
  newVersion: PropTypes.string.isRequired,
  error: PropTypes.string,
  annotations: PropTypes.array.isRequired,
  annotationsObject: PropTypes.object.isRequired,
  handler: PropTypes.node,
  markedFocus: PropTypes.bool,
  marked: PropTypes.node,
  selection: PropTypes.node,
  //copiedAnns: PropTypes.node,
  page: PropTypes.number,
  pages: PropTypes.number
}

export default connect(mapStateToProps)(DocumentPage)
