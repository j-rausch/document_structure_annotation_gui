import React, { Component } from 'react'
import { Transformer } from 'react-konva'
import PropTypes from 'prop-types'

class Handler extends Component {
  componentDidMount () {
    const stage = this.transformer.getStage()
    const annotation = stage.findOne('.' + this.props.annotation)
    if (annotation) {
      this.transformer.attachTo(annotation)
      this.transformer.getLayer().batchDraw()
    }
  }

  componentDidUpdate () {
    const stage = this.transformer.getStage()
    const annotation = stage.findOne('.' + this.props.annotation)
    if (annotation) {
      this.transformer.attachTo(annotation)
      this.transformer.getLayer().batchDraw()
    }
  }

  render () {
    return (
      <Transformer
        ref={node => {
          this.transformer = node
        }}
        rotateEnabled={false}
        keepRatio={false}
      />
    )
  }
}

Handler.propTypes = {
  annotation: PropTypes.node.isRequired
}

export default Handler
