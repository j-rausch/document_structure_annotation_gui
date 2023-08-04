const { exec } = require('child_process')
const { join } = require('path')

function pdf2jsonPDFminer (filename) {
  return new Promise(function (resolve, reject) {
    const command = 'pdf2txt.py -t xml ' + filename + ' | ' + join('helpers', 'pdf2json.py') + ' -w'
    exec(command, { maxBuffer: 1024 * 8000 }, function (err, stdout, stderr) {
      if (err) {
        return reject(new Error('Error: ' + err))
      }
      return resolve(stdout)
    })
  })
}



module.exports = pdf2jsonPDFminer
