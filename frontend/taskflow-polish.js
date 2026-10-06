(() => {
  const icons = {
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    tasks: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    today: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h5"/></svg>',
    priority: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7L21 9.6l-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
    analytics: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/></svg>',
    focus: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    bot: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M8 13h.01M16 13h.01M9 17h6"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4V19a2 2 0 0 1-4 0v-.2A2 2 0 0 0 5.8 17l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 10.8H1.5a2 2 0 0 1 0-4h.2A2 2 0 0 0 3 3.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.2 1.6V1.5a2 2 0 0 1 4 0v.2A2 2 0 0 0 16.6 3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a2 2 0 0 0 1.4 3.4h.2a2 2 0 0 1 0 4h-.2a2 2 0 0 0-1.4 3.4Z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.8 7.2L21 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z"/></svg>'
  };

  const sidebar = document.createElement('aside');
  sidebar.className = 'tf-sidebar';
  sidebar.id = 'tfSidebar';
  sidebar.innerHTML = `
    <div class="tf-side-brand">
      <div class="tf-side-logo">TF</div>
      <div><strong>TaskFlow</strong><small>FOCUS · PLAN · PROGRESS</small></div>
    </div>
    <div class="tf-side-section">
      <span>WORKSPACE</span>
      <button class="tf-nav active" data-action="overview">${icons.grid}<b>Overview</b></button>
      <button class="tf-nav" data-action="tasks">${icons.tasks}<b>Tasks</b></button>
      <button class="tf-nav" data-action="today">${icons.today}<b>Today</b></button>
      <button class="tf-nav" data-action="priority">${icons.priority}<b>Priority</b></button>
      <button class="tf-nav" data-action="analytics">${icons.analytics}<b>Analytics</b></button>
    </div>
    <div class="tf-side-section">
      <span>PRODUCTIVITY</span>
      <button class="tf-nav" data-action="focus">${icons.focus}<b>Focus</b></button>
      <a class="tf-nav tf-vaani" href="https://vaani-ai-workspace.vercel.app" target="_blank" rel="noopener">${icons.bot}<b>Ask Vaani</b><i>↗</i></a>
    </div>
    <div class="tf-side-bottom">
      <button class="tf-nav" data-action="profile">${icons.profile}<b>Profile</b></button>
      <button class="tf-nav" data-action="settings">${icons.settings}<b>Settings</b></button>
      <div class="tf-side-status"><span></span><div><b>Workspace online</b><small>Synced with API</small></div></div>
    </div>`;

  document.body.insertBefore(sidebar, document.body.firstChild);

  const overlay = document.createElement('div');
  overlay.className = 'tf-sidebar-overlay';
  overlay.id = 'tfSidebarOverlay';
  document.body.insertBefore(overlay, document.body.firstChild);

  const toggle = document.createElement('button');
  toggle.className = 'tf-sidebar-toggle';
  toggle.id = 'tfSidebarToggle';
  toggle.setAttribute('aria-label', 'Toggle sidebar');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(toggle);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({behavior:'smooth', block:'start'});
  const toast = msg => window.toast ? window.toast(msg, 'success') : null;

  document.querySelectorAll('.tf-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-nav').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.target;
      const action = btn.dataset.action;
      if (target) scrollTo(target);
      if (action === 'overview') window.__tfSetView?.('overview');
      if (action === 'tasks') window.__tfSetView?.('tasks');
      if (action === 'today') window.__tfSetView?.('today');
      if (action === 'priority') window.__tfSetView?.('priority');
      if (action === 'analytics') window.__tfSetView?.('analytics');
      if (action === 'focus') window.__tfSetView?.('focus');
      if (action === 'profile') window.__tfSetView?.('profile');
      if (action === 'settings') window.__tfSetView?.('settings');
      if (action === 'today') { scrollTo('taskList'); const f=document.getElementById('statusFilter'); if(f) f.value='all'; window.renderTasks?.(); toast('Today view ready'); }
      if (action === 'priority') { scrollTo('taskList'); toast('Priority view — high-priority tasks'); document.querySelectorAll('.task-card').forEach(c=>c.classList.add('tf-priority-pulse')); setTimeout(()=>document.querySelectorAll('.task-card').forEach(c=>c.classList.remove('tf-priority-pulse')),1300); }
      if (action === 'analytics') { scrollTo('workspace'); toast('Analytics panel is coming with the productivity upgrade'); }
      if (action === 'focus') { document.getElementById('newTaskBtn')?.focus(); toast('Focus mode ready'); }
      if (action === 'profile') { document.getElementById('profileAvatar')?.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:420}); }
      if (action === 'settings') { toast('Settings will be added with preferences'); }
      sidebar.classList.remove('mobile-open'); overlay.classList.remove('show');
    });
  });

  toggle.addEventListener('click', () => { sidebar.classList.toggle('mobile-open'); overlay.classList.toggle('show'); });
  overlay.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('show'); });

  const syncAuth = () => {
    const auth = document.getElementById('authView');
    const workspace = document.getElementById('workspace');
    const visible = workspace && !workspace.classList.contains('hidden');
    sidebar.classList.toggle('hidden', !visible);
    toggle.classList.toggle('hidden', !visible);
  };
  new MutationObserver(syncAuth).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  syncAuth();
})();
