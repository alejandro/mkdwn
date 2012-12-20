/*global define chrome console App*/
define('app/fs', function (){
  function errorHandler(){
    console.error('[ERROR]', arguments)
  }
  function save(fileEntry, content) {
    fileEntry.createWriter(function (fileWriter){
      fileWriter.onwriteend = function (){
        fileWriter.onwriteend = null
        fileWriter.truncate(content.length)
      }
      fileWriter.onerror = function (e){
        console.log('Write failed: ' + e.toString())
      }
      var blob = new Blob([content], {'type': 'text/plain'})
      fileWriter.write(blob)
    }, errorHandler)
  }

  function saveFile(content, fileName) {
    window.webkitRequestFileSystem(1, 1024*1024, function (fs){
      fs.root.getFile(fileName, {create: true}, function (fileEntry){
        save(fileEntry, content)
      }, errorHandler)
    }, errorHandler)
  }

  function saveFileAs(content) {
    chrome.fileSystem.chooseEntry({'type': 'saveFile'}, function (fileEntry){
      save(fileEntry, content || App.e.textContent)
    })
  }

  return {
    save: saveFileAs
  }
})
