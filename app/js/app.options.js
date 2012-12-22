/*global Proxy, require, console*/
!function(){

  var $ = function (el){ return document.querySelector(el) }
    , $$ = function (el) { return document.querySelectorAll(el) }
    , _  = require('app/helpers')
    , cfg = _.Storage('cfg')
    , ref = {}
    , sels = $$('select'), sel = {}

var proxy = Proxy.create({
  get: function (prox, name){
    return ref[name]
  },
  set: function (o, p, val){
    ref[p] = val.toLowerCase()
    cfg.set(ref)
    return ref
  }
})
  
  // set a reference for each option in <select>s so we can use it later
  // with its index
  for (var key in sels) {
    var s = sels[key], sid = sel[s.id] = {}
    for (var val in s) {
      if (!isNaN(val))
        sid[s.options.item(val).text.toLowerCase()] = val
    }
  }

  function actions(target, ev) {
    var el =  ev.target
    proxy[target] = el.value
  }
  // copy the actual config to the proxy
  window.cfg = cfg
  cfg.keys.forEach(function(it){
    proxy[it] = cfg.get(it)
    console.log(sel[it], cfg.get(it))
    $('#' + it).options.selectedIndex = sel[it][cfg.get(it)]
  })

  ;['keyboard', 'theme'].forEach(function (id){
    $('#' + id).addEventListener('click', actions.bind(this, id))
  })
}()
