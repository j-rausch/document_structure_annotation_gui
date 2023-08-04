import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Card, Icon, Image, Button, Label } from 'semantic-ui-react'

const Documents = ({ documents }) => (
  <div>
    <Card.Group>
      {documents.map(document => (
        <Card key={document.dataset + '/' + document.id}>
          <Image
            attached="true"
            label={{ color: 'blue', content: document.subject && document.subject[0], ribbon: true }}
            src={'/documents/' + document.dataset + '/' + document.id + '/' + document.id + '-0.png'} />
          <Card.Content attached="true">
            <Card.Header>{document.title}</Card.Header>
            <Card.Meta>
              <span className='date'>{document.date}</span>
            </Card.Meta>
            <Card.Description>
              {document.creator && document.creator.map(
                c => <Label key={document.dataset + '/' + document.id + '_' + c} size='mini'>
                  <Icon name='user' />{c}
                </Label>)
              }
              <p>
                {document.description}
              </p>
            </Card.Description>
          </Card.Content>
          <Button.Group attached='bottom'>
            [{document.versions && document.versions.map(
              version => <Link
                key={document.dataset + '/' + document.id + '/' + version}
                to={'/' + document.dataset + '/' + document.id + '/' + version}>
                <Button primary={version === 'original'}>{version}</Button>
              </Link>).reduce((prev, curr) => [prev, ', ', curr])}]
          </Button.Group>
        </Card>
      )
      )}
    </Card.Group>
  </div>
)

Documents.propTypes = {
  documents: PropTypes.array.isRequired
}

export default Documents
