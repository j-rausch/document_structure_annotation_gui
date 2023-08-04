import React from 'react'
import PropTypes from 'prop-types'
import SortableTree, {
  changeNodeAtPath,
  addNodeUnderParent
} from 'react-sortable-tree'
import 'react-sortable-tree/style.css'

const categoryGroups = [
  'General',
  'Main',
  'Document',
  'Text',
  'Equation',
  'Image',
  'Table',
  'Itemize',
//  'ContentBlock'
]

const categories = {
  General: [
    'unk',
    'meta',
    'document'
  ],
  Main: [
    'subject',
    'author',
    'date',
    'abstract',
    'affiliation',
    'bibliography',
    'page_nr',
    'head',
    'foot',
    'side'
  ],
  Document: [
    'index',
    'section',
    'heading'
  ],
  Text: [
    'paragraph',
    'content_block',
    'content_line',
    'content_lines',
    'bib_block',
    'itemize',
    'equation',
    'item',
    'header',
    'line',
    'code',
    'footnote',
    'word',
    'character'
  ],
  Equation: [
    'equation_formula',
    'equation_label'
  ],
  Image: [
    'image',
    'figure',
    'figure_caption',
    'figure_graphic'
  ],
  Table: [
    'table',
    'table_caption',
    'tabular',
    'table_cell',
    'table_col',
    'table_row',
    'table_footnote'
  ],
  Itemize: [
    'item',
    'itemize'
  ],
//  ContentBlock: [
//    'content_block',
//    'content_line'
//  ]
  
}

const allowedCategories = {
  null: ['unk', 'meta', 'document'],
  meta: ['unk', 'subject', 'author', 'date', 'affiliation', 'bibliography', 'page_nr', 'head', 'foot', 'side', 'bib_block'],
  document: ['unk', 'index', 'author', 'date', 'affiliation','section', 'heading', 'abstract', 'paragraph', 'itemize', 'equation', 'line', 'code', 'figure', 'image', 'table', 'footnote', 'content_line', 'content_lines', 'word', 'bibliography', 'content_block', 'bib_block', 'figure_graphic', 'figure_caption', 'tabular', 'table_caption'],
  section: ['unk', 'index', 'section', 'heading', 'paragraph', 'bibliography', 'itemize', 'equation', 'line', 'code', 'figure', 'image', 'table', 'footnote', 'content_line', 'content_lines', 'content_block', 'word', 'figure_graphic', 'figure_caption', 'tabular', 'table_caption'],
  content_line: ['unk', 'word'],
  word: ['unk', 'character'],
  equation: ['unk', 'equation_formula', 'equation_label', 'content_line', 'content_lines'],
  figure: ['unk', 'figure', 'image', 'figure_caption', 'figure_graphic'],
  table: ['unk', 'tabular', 'table_cell', 'table_col', 'table_row', 'table_caption', 'content_line', 'content_lines', 'table_footnote'],
  tabular: ['unk', 'table_cell', 'table_col', 'table_row', 'content_line', 'content_block'],
  itemize: ['item', 'unk', 'equation', 'heading'],
  content_block: ['content_block', 'content_line', 'content_lines', 'equation', 'unk']
  
}

const getNodeKey = ({ treeIndex }) => treeIndex

const idSearchMethod = ({ node, searchQuery }) =>
  searchQuery &&
    node.id === searchQuery

const canDrop = ({ node, nextParent, prevPath, nextPath }) => {
  // disallow dropping of nodes as children on leaves
  return !(nextParent && nextParent.page !== undefined)
}

function getChildrenIDs (treeData) {
  // recursively find all IDs of children
  const traverse = node => {
    if (
      !node.children ||
            typeof node.children === 'function'
    ) {
      return [node.id]
    }

    return (
      [
        ...[node.id],
        ...node.children.reduce(
          (ids, currentNode) => [...ids, ...traverse(currentNode)], []
        )
      ]
    )
  }

  return treeData.reduce(
    (ids, currentNode) => [...ids, ...traverse(currentNode)], []
  )
}

const newID = annotations => {
  // return new not previously existing ID
  const highest = annotations.reduce(function (a, b) { return a.id > b.id ? a : b })
  return highest.id + 1
}

const Tree = ({ treeData, annotations, annotationsObject, page, handler, focus, onRemove, onChange, onClick, onMouseOver }) => {
  // render tree with nodes that look and act differently depending on whether they are structure/annotation nodes
  return (
    <SortableTree
      treeData={treeData}
      onChange={treeData => { onChange(treeData) }}
      searchMethod={idSearchMethod}
      searchFocusOffset={focus ? 0 : null}
      searchQuery={handler}
      canDrop={canDrop}
      generateNodeProps={({ node, path }) => ({
        title: (node.bbox ? (
          <span title={node.bbox}><input key={node.id + '_text'} value={node.text} size={8}
            onChange={event => {
              onChange(
                changeNodeAtPath({
                  treeData,
                  path,
                  getNodeKey,
                  newNode: { ...node, text: event.target.value }
                })
              )
            }}/> {node.category}</span>
        ) : [
          <select key={node.id + '_category'}
            style={{ fontSize: '1.1rem' }}
            value={node.category}
            size={1}
            onChange={event => {
              onChange(
                changeNodeAtPath({
                  treeData,
                  path,
                  getNodeKey,
                  newNode: { ...node, category: event.target.value }
                })
              )
            }}>
            {categoryGroups.map(
              g => <optgroup key={g + '_category_group'} label={g}>
                {categories[g].filter(
                  c => (!node.parent && allowedCategories[null].includes(c)) ||
                    (node.parent && (!allowedCategories[annotationsObject[node.parent].category] ||
                    allowedCategories[annotationsObject[node.parent].category].includes(c)))
                ).map(
                  c => <option key={c + '_category'} value={c}>{c}</option>
                )}
              </optgroup>)}
          </select>,
          (node.category === 'table_cell' ? <input key={node.id + '_properties'} value={node.properties} size={6}
            onChange={event => {
              onChange(
                changeNodeAtPath({
                  treeData,
                  path,
                  getNodeKey,
                  newNode: { ...node, properties: event.target.value }
                })
              )
            }}/> : null)
        ]
        ),
        subtitle: node.page !== undefined ? ' [Page ' + (node.page + 1) + ']' : '',
        onClick: e => { if (e.target.tagName !== 'BUTTON') onClick(node.id, node.page) },
        onMouseOver: () => onMouseOver(() => getChildrenIDs([node])),
        onMouseOut: () => onMouseOver(() => []),
        buttons: [
          <button
            key={node.id + '_delete'}
            onClick={() =>
              onRemove(
                node.id
              )
            }
          >
          Delete
          </button>,
          (node.page !== undefined ? null : <button
            key={node.id + '_add'}
            onClick={() => {
              onChange(
                addNodeUnderParent({
                  treeData,
                  parentKey: path[path.length - 1],
                  expandParent: true,
                  getNodeKey,
                  newNode: {
                    id: newID(annotations),
                    category: ''
                  }
                }).treeData
              )
            }
            }
          >
          Add
          </button>)
        ]
      })}
    />
  )
}

Tree.propTypes = {
  treeData: PropTypes.array.isRequired,
  annotations: PropTypes.array.isRequired,
  annotationsObject: PropTypes.object.isRequired,
  page: PropTypes.number,
  handler: PropTypes.node,
  focus: PropTypes.bool,
  onRemove: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  onMouseOver: PropTypes.func.isRequired
}

export default Tree
