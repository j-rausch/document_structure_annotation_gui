import React from 'react'
import { Rect, Group } from 'react-konva'
import PropTypes from 'prop-types'

const Annotation = ({ id, category, bbox, highlight, selected, listening = true, onChange, onClick }) => (
  <Group key={id + '_group'} onClick={() => onClick(id)}>
    <Rect
      key={id.toString()}
      name={id.toString()}
      stroke={selected ? 'blue' : 'red'}
      strokeWidth={highlight ? 4 : 1}
      strokeScaleEnabled={false}
      x={bbox[0]}
      y={bbox[1]}
      scaleX={1}
      scaleY={1}
      width={bbox[2]}
      height={bbox[3]}
      draggable
      listening={listening}
      onDragEnd={e =>
        {
//        console.log('arrow fct event (drag)');
//        console.log(e);
        if (e.target.scaleX < 0 || e.target.scaleY < 0) {
        }
        else {
          const newWidth = Math.round(e.target.scaleX() * e.target.width())
          const newHeight = Math.round(e.target.scaleY() * e.target.height())
          onChange(id,
          Math.round(e.target.x()),
          Math.round(e.target.y()),
          newWidth,
          newHeight 
          )
        }
       }
      }

      onTransformEnd={e =>
        {
        console.log('arrow fct event (transform)');
        console.log(e);
        console.log(e.target.scaleX())
//        if (e.target.scaleX < 0 || e.target.scaleY < 0) {
//        }
//        else {
          const newWidth = Math.round(e.target.scaleX() * e.target.width())
          const newHeight = Math.round(e.target.scaleY() * e.target.height())
          onChange(id,
          Math.round(e.target.x()),
          Math.round(e.target.y()),
          newWidth,
          newHeight 
          )
       }
      }

_useStrictMode
    />
  </Group>
)

Annotation.propTypes = {
  id: PropTypes.node.isRequired,
  category: PropTypes.string.isRequired,
  bbox: PropTypes.array.isRequired,
  selected: PropTypes.bool.isRequired,
  highlight: PropTypes.bool.isRequired,
  listening: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired
}

export default Annotation
