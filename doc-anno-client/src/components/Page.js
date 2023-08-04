import React, { Component } from 'react'
import { Stage, Layer, Rect, Line, Image } from 'react-konva'
import PropTypes from 'prop-types'
import Annotation from './Annotation'
import Handler from './Handler'

const ANNOTATION_MIN_X = 2
const ANNOTATION_MIN_Y = 2

function overlap (bbox, selection) {
  // return whether selection overlaps bounding box of annotation
  return (bbox[0] + bbox[2] >= selection[0] && bbox[1] + bbox[3] >= selection[1]) &&
    (bbox[0] <= selection[0] + selection[2] && bbox[1] <= selection[1] + selection[3])
}

function getScaledPointerPosition (stage) {
  // scale mouse position depending on dimensions of stage
  const pointerPosition = stage.getPointerPosition()
  const stageAttrs = stage.attrs
  const x = (pointerPosition.x - stageAttrs.x) / stageAttrs.scaleX
  const y = (pointerPosition.y - stageAttrs.y) / stageAttrs.scaleY
  return { x: x, y: y }
}

class Page extends Component {
  constructor (props) {
    super(props)
    // store bounding box of selection and whether user is in process of dragging mouse
    this.state = { selection: {start_pos: [0,0], bbox: [0, 0, 0, 0], dragging: false } }
    this.image = new window.Image()
    this.imgFittingScale = 620/this.image.width 
  }

  componentDidMount () {
    this.image.src = this.props.image
    this.image.onload = () => {
      if (this.imageNode) { this.imageNode.getLayer().batchDraw()
          this.imgFittingScale = 620/this.image.width }
    }
  }

  componentDidUpdate () {
    this.image.src = this.props.image
    this.image.onload = () => {
      if (this.imageNode) { this.imageNode.getLayer().batchDraw() 
          this.imgFittingScale = 620/this.image.width }
    }
  }

  handleAnnotationClick (id) {
    this.setState({
      selection: {
        start_pos: [0, 0],
        bbox: [0, 0, 0, 0],
        dragging: false
      }
    })
    this.props.onClick(id)
  }

  render () {
    const { annotations, handler, highlight, page, scale, selection, insertMode, onChange, onClick, onMouseup, onSelection, onMousemove } = this.props
    return (
      <div style={{ display: 'inline-block' }}>
        <Stage
          x={0}
          y={0}
          width={620 * scale}
          height={620 / 0.7 * scale}
          scaleX={scale * this.imgFittingScale}
          scaleY={scale * this.imgFittingScale}
          ref={node => { this.stage = node }}>
          <Layer>
            <Image
              image={this.image}
              x={0}
              y={0}
              strokeWidth={1}
              stroke='black'
              onClick={() => onClick(null)}
              //onDblclick={() => onDblclick(getScaledPointerPosition(this.imageNode.getStage())['x'], getScaledPointerPosition(this.imageNode.getStage())['y'])}
              onMousedown={() => {
                const x = getScaledPointerPosition(this.imageNode.getStage())['x']
                const y = getScaledPointerPosition(this.imageNode.getStage())['y']
                if (insertMode || annotations.filter(a => a.bbox).every(a => a.bbox && !(x >= a.bbox[0] && y >= a.bbox[1] && x <= a.bbox[0] + a.bbox[2] && y <= a.bbox[1] + a.bbox[3]))) {
                  this.setState({
                    selection: {
                      start_pos: [x, y],
                      bbox: [x, y, 0, 0],
                      dragging: true
                    }
                  })
                }
              }}
              onMousemove={() => {
                if (this.state.selection.dragging) {
                  const current_pos_x = getScaledPointerPosition(this.imageNode.getStage())['x']
                  const current_pos_y = getScaledPointerPosition(this.imageNode.getStage())['y']
                  const min_x = Math.min(this.state.selection.start_pos[0], current_pos_x)
                  const max_x = Math.max(this.state.selection.start_pos[0], current_pos_x)
                  const min_y = Math.min(this.state.selection.start_pos[1], current_pos_y)
                  const max_y = Math.max(this.state.selection.start_pos[1], current_pos_y)
                  this.setState({
                    selection: {
                      ...this.state.selection,
                      bbox: [
                        min_x,
                        min_y,
                        max_x - min_x,
                        max_y - min_y
                      ]
                    },
                  }
                  )
                }
                onMousemove(
                  getScaledPointerPosition(this.imageNode.getStage())['x'],
                  getScaledPointerPosition(this.imageNode.getStage())['y'])
              }}
              onMouseup={() => {
                if (this.state.selection.bbox[2] >= ANNOTATION_MIN_X && this.state.selection.bbox[3] >= ANNOTATION_MIN_Y) {
                  if (insertMode) {
                    onMouseup(this.state.selection.bbox[0], this.state.selection.bbox[1], this.state.selection.bbox[2], this.state.selection.bbox[3])
                  } else {
                    onSelection(this.state.selection.bbox)
                  }
                } else {
                  onSelection(undefined)
                }
                this.setState({
                  selection: {
                    ...this.state.selection,
                    dragging: false
                  }
                })
              }}
              ref={node => {
                this.imageNode = node
              }}/>
            {this.state.selection.dragging ? (
              <Rect key="selection" x={this.state.selection.bbox[0]} y={this.state.selection.bbox[1]}
                width={this.state.selection.bbox[2]} height={this.state.selection.bbox[3]}
                stroke="black" strokeWidth={1} dash={[2, 2]} listening={false}/>
            ) : null}
            {handler ? <Handler annotation={handler}/> : null}
            {annotations.filter(a => a.bbox).map(a => {
              return (
                <Annotation
                  key={a.id}
                  id={a.id}
                  category={a.category}
                  bbox={a.bbox}
                  highlight={highlight.includes(a.id)}
                  selected={overlap(a.bbox, selection || [0, 0, 0, 0])}
                  listening={!insertMode && !this.state.selection.dragging}
                  onChange={onChange}
                  onClick={id => this.handleAnnotationClick(id)}
                />
              )
            })}
          </Layer>
        </Stage>
      </div>
    )
  }
}

Page.propTypes = {
  image: PropTypes.string.isRequired,
  annotations: PropTypes.array.isRequired,
  handler: PropTypes.node,
  highlight: PropTypes.node,
  page: PropTypes.number.isRequired,
  scale: PropTypes.number.isRequired,
  selection: PropTypes.array,
  insertMode: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  //onDblclick: PropTypes.func.isRequired,
  onMouseup: PropTypes.func.isRequired,
  onSelection: PropTypes.func.isRequired,
  onMousemove: PropTypes.func.isRequired
}

export default Page
