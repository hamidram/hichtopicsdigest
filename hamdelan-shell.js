/* Wraps the existing app in Hamdelan branding. Needs config.js loaded first. */
(function(){
  var c=window.APP_CONFIG, d=document, root=d.documentElement;
  var layout=(new URLSearchParams(location.search).get("layout")||c.LAYOUT);   // ?layout=original to preview
  root.dataset.layout=(layout==="original")?"original":"community";
  d.title=c.SITE_NAME+" · "+c.ORG;
  var ic=d.querySelector('link[rel~=icon]')||d.head.appendChild(d.createElement("link"));
  ic.rel="icon"; ic.href="https://hamdelan.org.au/assets/favicon.png";

  function build(){
    var mail="mailto:"+c.FEEDBACK_EMAIL+"?subject="+encodeURIComponent(c.SITE_NAME+" feedback");
    var h=d.createElement("header"); h.className="hd-header";
    h.innerHTML='<a class="hd-logo" href="'+c.HOME_URL+'" aria-label="Back to hamdelan.org.au"><img src="'+c.LOGO+'" alt="Hamdelan Iranian Cultural House"></a>'
      +'<div class="hd-title">'+c.SITE_NAME+' · '+c.SITE_NAME_FA+'<small>'+c.ORG+'</small></div>'
      +'<nav class="hd-nav"><a href="'+c.HOME_URL+'">hamdelan.org.au</a><a href="'+mail+'">Feedback</a></nav>';
    var f=d.createElement("footer"); f.className="hd-footer";
    f.innerHTML=c.ORG+' · <a href="'+mail+'">Send feedback to '+c.FEEDBACK_EMAIL+'</a> · <a href="'+c.HOME_URL+'">hamdelan.org.au</a>';
    var app=d.createElement("div"); app.id="hd-app";
    while(d.body.firstChild) app.appendChild(d.body.firstChild);   // move existing app inside wrapper
    d.body.append(h,app,f);
  }
  if(d.readyState==="loading") d.addEventListener("DOMContentLoaded",build); else build();
})();
