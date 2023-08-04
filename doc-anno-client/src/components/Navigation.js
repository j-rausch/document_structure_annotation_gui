import React from 'react'
import { Link } from 'react-router-dom'
import {
  Image,
  Menu,
  Input,
  Dropdown,
  Container
} from 'semantic-ui-react'
import PropTypes from 'prop-types'

const Navigation = ({ documentFilter, datasetFilter, annotationsByDocument, datasets, onChange, onSelect }) => (
  <Menu fixed='top' inverted>
    <Container>
      <Menu.Item header>
        <Image size='mini' src='/logo.png' style={{ width: '24px', height: '24px', marginRight: '1.5em' }} />
        <Link to='/'>
          Document Annotation
        </Link>
      </Menu.Item>
      <Menu.Item as={Link} to='/'>Home</Menu.Item>

      <Dropdown item simple text='Open Documents' error={Object.keys(annotationsByDocument).length < 1}>
        <Dropdown.Menu>
          {Object.keys(annotationsByDocument).map(key => <Dropdown.Item as={Link} to={'/' + key} key={key}>{key}</Dropdown.Item>)}
        </Dropdown.Menu>
      </Dropdown>
      {onChange
        ? (
          <Menu.Menu position='right'>
            <Dropdown
              placeholder='Dataset' item simple icon='database'
              options={datasets.map(key => ({ 'key': key, 'value': key, 'text': key }))}
              value={datasetFilter} onChange={(e, data) => { onSelect(data.value) }}>
            </Dropdown>
            <Menu.Item>
              <Input icon='search' onChange={e => onChange(e.target.value)} value={documentFilter}/>
            </Menu.Item>
          </Menu.Menu>
        ) : null}
    </Container>
  </Menu>
)

Navigation.propTypes = {
  documentFilter: PropTypes.string,
  datasetFilter: PropTypes.string,
  annotationsByDocument: PropTypes.object.isRequired,
  datasets: PropTypes.array,
  onChange: PropTypes.func,
  onSelect: PropTypes.func
}

export default Navigation
