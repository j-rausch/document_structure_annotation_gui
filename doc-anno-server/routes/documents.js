const express = require('express')
const router = express.Router()
const fs = require('fs')
const { join } = require('path')
const PDFImage = require('../helpers/pdf-image').PDFImage
const pdf2jsonPDFminer = require('../helpers/pdf2json')

const documentsPath = join('public', 'documents')
const defaultLimit = 100
const isDirectory = source => (fs.lstatSync(source).isDirectory() | fs.lstatSync(source).isSymbolicLink())

const createFiles = (fileJSON, filePDF, fileAnnotationsDefault, fileAnnotationsPDFMiner, document) => {
  if (!fs.existsSync(fileJSON)) {
    const pdfImage = new PDFImage(filePDF)
    pdfImage.numberOfPages().then(function (pages) {
      const fd = fs.openSync(fileJSON, 'w')
      const buf = Buffer.from(JSON.stringify(
        {
          'id': document,
          'title': document,
          'pages': pages || 100
        }
      ))
      fs.writeSync(fd, buf)
      fs.closeSync(fd)
    }, function (err) {
      console.log('Error reading PDF: ' + err)
    })
    console.log('checking for empty file..: ' + document)
    if (!fs.existsSync(fileAnnotationsDefault)) {
      console.log('Generating empty annotation file: ' + document)
      var contents = [
        {"id": 1, "category": "unk", "parent": null},
        {"id": 2, "category": "meta", "parent": null},
        {"id": 3, "category": "document", "parent": null}
      ];
      var jsonContent = JSON.stringify(contents)
      const fd = fs.openSync(fileAnnotationsDefault, 'w')
      fs.writeSync(fd, jsonContent)
      fs.closeSync(fd)
    }
    if (!fs.existsSync(fileAnnotationsPDFMiner)) {
      pdf2jsonPDFminer(filePDF).then(contents => {
        console.log('Generated PDFMiner annotations: ' + document)
        if (contents.length > 0) {
          const fd = fs.openSync(fileAnnotationsPDFMiner, 'w')
          const buf = Buffer.from(contents)
          fs.writeSync(fd, buf)
          fs.closeSync(fd)
        }
      }, err => {
        console.log('Error generating PDFMiner annotations: ' + err)
      })
    }

  }
}


//const updateTitles = (fileJSON, titles) => {


router.get('/', function (req, res, next) {
  fs.readdir(documentsPath, (err, files) => {
    if (err) {
      return res.status(500).send('Documents directory not found')
    }
    const titles = []
    let datasets = files.filter(name => isDirectory(join(documentsPath, name)))
    if (req.query.dataset) {
      datasets = datasets.filter(name => name === req.query.dataset)
    }
    for (const dataset of datasets) {
      try {
        const files = fs.readdirSync(join(documentsPath, dataset))
          .filter(name => !req.query.search || name.includes(req.query.search))
          .slice(0, parseInt(req.query.limit) || defaultLimit)
        const documents = files.filter(name => isDirectory(join(documentsPath, dataset, name)))
        for (const document of documents) {
          try {
            const filePDF = join(documentsPath, dataset, document, document + '.pdf')
            const fileJSON = join(documentsPath, dataset, document, document + '.json')
            const fileAnnotationsDefault = join(documentsPath, dataset, document, document + '-default.json')
            const fileAnnotationsPDFMiner = join(documentsPath, dataset, document, document + '-pdfminer.json')
//            if (!fs.existsSync(filePDF)) {
//              console.log('Empty folder: ' + document)
//              continue
//            }
           // createFiles(fileJSON, filePDF, fileAnnotationsDefault, fileAnnotationsPDFMiner, document)
            //updateTitles()
            const file = fs.readFileSync(fileJSON)
            const metadata = JSON.parse(file)
            // delete metadata.annotations;
            const files = fs.readdirSync(join(documentsPath, dataset, document))
            metadata.id = document
            metadata.dataset = dataset
            metadata.versions = files.filter(
              name => RegExp(document + '-[A-Za-z0-9.\\-_]+\\.json').test(name)
            ).map(
              name => name.match(RegExp(document + '-([A-Za-z0-9\\.-]+)\\.json'))[1]
            )
            titles.push(metadata)
          } catch (err) {
            console.log(err)
          }
        }
      } catch (err) {
        console.log(err)
      }
    }

    res.json(titles)
  })
})

router.get('/datasets', function (req, res) {
  fs.readdir(documentsPath, (err, files) => {
    if (err) {
      return res.status(500).send('Documents directory not found')
    }
    const datasets = files.filter(name => isDirectory(join(documentsPath, name)))
    res.json(datasets)
  })
})

router.get(/\/([A-Za-z0-9.\-_]+)\/([A-Za-z0-9.\-_]+)\/pages$/i, function (req, res) {
  const dataset = req.params[0]
  const document = req.params[1]
  const pdfPath = join(documentsPath, dataset, document, document + '.pdf')
  const pdfImage = new PDFImage(pdfPath)

  pdfImage.numberOfPages().then(function (pages) {
    res.json({ pages: pages })
  }, function (err) {
    res.status(500).send(err)
  })
})

router.get(/\/([A-Za-z0-9.\-_]+)\/([A-Za-z0-9.\-_]+)\/pdfminer/i, function (req, res) {
  const dataset = req.params[0]
  const document = req.params[1]
  const path = join(documentsPath, dataset, document, document + '.pdf')
  pdf2jsonPDFminer(path).then(content => {
    res.send(content)
  }, err => {
    res.status(500).send(err)
  })
})

router.get(/\/([A-Za-z0-9.\-_]+)\/([A-Za-z0-9.\-_]+)$/i, function (req, res, next) {
  fs.readFile(join(documentsPath, req.params[0], req.params[1], req.params[1] + '.json'), function (err, data) {
    const dataset = req.params[0]
    const document = req.params[1]
    if (err) {
      return res.status(404).send('Not Found')
    }

    const path = join(documentsPath, dataset, document)
    const pdfImage = new PDFImage(join(path, document + '.pdf'))
    pdfImage.convertFile().then(function (imagePaths) {
      console.log('Converted PDF "' + document + '": ' + imagePaths)
    }, function (err) {
      console.log(err)
    })

    const metadata = JSON.parse(data)
    const files = fs.readdirSync(path)
    metadata.id = document
    metadata.dataset = dataset
    metadata.versions = files.filter(
      name => RegExp(document + '-[A-Za-z0-9.\\-_]+\\.json').test(name)
    ).map(
      name => name.match(RegExp(document + '-([A-Za-z0-9.\\-_]+)\\.json'))[1]
    )
    metadata.id = document
    res.json(metadata)
  })
})

router.put(/\/([A-Za-z0-9.\-_]+)\/([A-Za-z0-9.\-_]+)\/([A-Za-z0-9.\-_]+)$/i, function (req, res, next) {
  if (req.params[2] === 'original' || req.params[2] === 'pdfminer' || req.params[2] === 'v2') {
    return res.status(403).send('Overwriting original/pdfminer not allowed')
  }
  fs.writeFile(
    join(documentsPath, req.params[0], req.params[1], req.params[1] + '-' + req.params[2] + '.json'),
    JSON.stringify(req.body),
    function (err) {
      if (err) {
        return res.status(500).send('Write failed')
      }

      res.json({})
    })
})

module.exports = router
