const fs = require('fs');

exports.writeJson = (filePath, jsonData) => {
  fs.writeFile(filePath, JSON.stringify(jsonData), (err) => {
    if (err) {
      throw new Error('Error writing entrypoints.json', err.message);
    }
  })
};