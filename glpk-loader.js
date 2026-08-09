// glpk-loader.js — loads glpk from local vendor first, then CDNs with fallback and exposes window.__glpkReady promise
(function(){
  if (window.__glpkReady) return; // already installed

  window.__glpkReady = (async function(){
    function addScript(src){
      return new Promise(function(resolve, reject){
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function(){
          console.info('glpk script loaded from', src);
          resolve(window.glpk);
        };
        s.onerror = function(ev){
          reject(new Error('Failed to load ' + src));
        };
        document.head.appendChild(s);
      });
    }

    const candidates = [
      '/glpk.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/glpk.js/4.0.1/glpk.min.js',
      'https://cdn.jsdelivr.net/npm/glpk.js@4.0.1/dist/glpk.min.js'
    ];

    for (let i = 0; i < candidates.length; i++){
      const src = candidates[i];
      try {
        const glpk = await addScript(src);
        if (window.glpk) {
          console.info('GLPK available:', !!window.glpk);
          return window.glpk;
        }
      } catch (e) {
        console.warn('glpk load failed for', src, e);
      }
    }

    throw new Error('Could not load glpk from local path or CDNs');
  })();
})();
