// Simple client-side include loader
(function(){
  async function loadIncludes() {
    const nodes = document.querySelectorAll('[data-include]');
    for (const node of nodes) {
      const url = node.getAttribute('data-include');
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load ' + url);
        const html = await res.text();
        node.innerHTML = html;
      } catch (err) {
        console.error(err);
      }
    }

    // After injection, run small enhancers
    enhanceMenus();
    enhanceTabs();
  }

  function enhanceMenus() {
    const parents = document.querySelectorAll('.menu-parent');
    parents.forEach(btn => {
      if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
      });
    });
  }

  function enhanceTabs() {
    const tabsEl = document.querySelector('.tabs');
    if (!tabsEl) return;
    const buttons = Array.from(tabsEl.querySelectorAll('.tab-button'));
    const indicator = tabsEl.querySelector('.tabs-indicator') || (() => {
      const d = document.createElement('div'); d.className='tabs-indicator'; tabsEl.appendChild(d); return d;
    })();

    function updateIndicator(el){
      if(!el){indicator.style.width='0';return}
      const rect=el.getBoundingClientRect(); const pr=tabsEl.getBoundingClientRect();
      const left=rect.left-pr.left+tabsEl.scrollLeft; indicator.style.width=rect.width+'px'; indicator.style.transform=`translateX(${left}px)`;
    }

    function setActive(i, focus){
      buttons.forEach((b, idx) => {
        b.classList.toggle('active', idx===i);
        b.setAttribute('aria-selected', String(idx===i));
        b.setAttribute('tabindex', idx===i ? '0' : '-1');
      });
      updateIndicator(buttons[i]);
      if(focus) buttons[i].focus();
    }

    buttons.forEach((b, i)=>{
      b.setAttribute('role','tab');
      b.addEventListener('click', ()=> setActive(i,false));
      b.addEventListener('keydown', (e)=>{
        let next=null;
        if(e.key==='ArrowRight') next=(i+1)%buttons.length;
        else if(e.key==='ArrowLeft') next=(i-1+buttons.length)%buttons.length;
        else if(e.key==='Home') next=0;
        else if(e.key==='End') next=buttons.length-1;
        if(next!==null){e.preventDefault(); setActive(next,true); buttons[next].scrollIntoView({behavior:'smooth',inline:'center'});} 
      });
    });

    setTimeout(()=> setActive(buttons.findIndex(b=>b.classList.contains('active'))||0,false),50);
    window.addEventListener('resize', ()=> updateIndicator(document.querySelector('.tab-button.active')));
    tabsEl.addEventListener('scroll', ()=> updateIndicator(document.querySelector('.tab-button.active')));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadIncludes);
  else loadIncludes();
})();
