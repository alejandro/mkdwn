/*global App, define, require, $, marked, Rainbow*/ /*jshint devel:true*/
define('app/reader', function(){'use strict';

  var _ = require('app/helpers')

  App.Reader = function Reader(name) {
    if (!(this instanceof App.Reader)) return new App.Reader(name)
    App.e.on('change', this.parse.bind(this))
    this.el = $('[name="' + (name || 'output') + '"]')
    this.active = true
  }
  App.Reader.prototype.html = function () {
    var md = App.editor.textContent
    try {
      md = marked(md)
    } catch(ex){
      console.log('[ERROR] EPARSINGER')
    }
    return md
  }
  App.Reader.prototype.parse = function (){
    if (!App.UI.read) return

    _.nextTick(function (){
      this.el.html(this.html())
      this.last = +new Date()
      this.el.find('code').each(function (i, el){
        var $el = $(el)
          , html = $el.html()
          , classes
      
        html = // cleanup html
          html
            .replace(/‘/g, '\'').replace(/’/g, '\'')
            .replace(/“/g, '\"').replace(/”/g, '\"')

        $el.html(html)

        classes = el.className.split(/\s+/)
        classes.forEach(function(klass){
          if (klass.indexOf('lang-') !== -1) {
                var language = klass.substring('lang-'.length)
                $el.attr('data-language', language)
          }
        })
        try { Rainbow.color() } catch(ex) {}
      })
      
    }, this)
  } /* eof Reader */
  return App.Reader
})

