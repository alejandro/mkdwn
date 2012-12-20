/*global Proxy*/
/*jshint asi:true, laxcomma:true, browser:true, es5:true*/
!function (){

  var $ = function (el){ return document.querySelector(el) }
    , $$ = function (el) { return document.querySelectorAll(el) }
    , _  = require('app/helpers')
    , cfg = _.Storage('cfg')
    , ref = {}
    , sels = $$('select'), sel = {}
    , proxy = 
    Proxy.create({
      get: function (prox, name){
        return ref[name]
      },
      set: function (o, p, val){
        console.log(val)
        ref[p] = val.toLowerCase()
        cfg.set(ref)
        return ref
      }
    })
  
  // set a reference for each option in selects so we can use it later
  // with its index
  for (var key in sels) {
    var s = sels[key], sid = sel[s.id] = {}
    for (var val in s) {
      if (!isNaN(val))
        sid[s.options.item(val).text.toLowerCase()] = val
    }
  }

  // copy the actual config to the proxy
  cfg.keys.forEach(function(it){
    proxy[it] = cfg.get(it)
    $('#' + it).options.selectedIndex = sel[it][cfg.get(it)]
  })
  // Object.keys(cfg.keys).forEach(function (it){
  //   if (Object.hasOwnProperty.call(cfg, it)) {
  //     proxy[it] = cfg[it],
  //     $('#' + it).options.selectedIndex = sel[it][cfg[it]]
  //   }
  // })
  cfg = proxy
  

  ;['keyboard', 'theme'].forEach(function (id){
    $('#' + id).addEventListener('click', actions.bind(this, id))
  })

  function actions(target, ev) {
    var el =  ev.target
    cfg[target] = el.value
  }
}()
