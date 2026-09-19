/* Legacy compatibility shim.
 * Cart navigation is handled by the global [data-go] click handler in index.html.
 * Keep this file side-effect free to avoid duplicate touch/pointer/click navigation.
 */
(function(){
  if(location.pathname.startsWith('/cms')) return;
  document.documentElement.classList.add('rc-cart-nav-ready');
})();
