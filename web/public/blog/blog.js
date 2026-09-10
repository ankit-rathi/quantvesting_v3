(() => {
  const cards = [...document.querySelectorAll('.journal-post')];
  const chips = [...document.querySelectorAll('.topic-chip')];
  const status = document.getElementById('filterStatus');
  const empty = document.getElementById('emptyFilter');
  const clear = document.getElementById('clearTopic');
  if (!cards.length || !chips.length) return;

  const setTopic = (topic, updateUrl = true) => {
    const selected = topic || 'all';
    let visible = 0;
    cards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(' ').filter(Boolean);
      const show = selected === 'all' || tags.includes(selected);
      card.hidden = !show;
      if (show) visible += 1;
    });

    chips.forEach((chip) => {
      const active = chip.dataset.topic === selected;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    if (status) status.textContent = selected === 'all'
      ? `Showing all ${cards.length} essays`
      : `Showing ${visible} ${visible === 1 ? 'essay' : 'essays'} tagged “${selected.replace(/-/g, ' ')}”`;
    if (empty) empty.classList.toggle('hidden', visible !== 0);
    if (clear) clear.disabled = selected === 'all';

    if (updateUrl) {
      const url = new URL(window.location.href);
      if (selected === 'all') url.searchParams.delete('topic');
      else url.searchParams.set('topic', selected);
      window.history.replaceState({}, '', url);
    }
  };

  chips.forEach((chip) => chip.addEventListener('click', () => setTopic(chip.dataset.topic)));
  clear?.addEventListener('click', () => setTopic('all'));

  const initial = new URLSearchParams(window.location.search).get('topic');
  const known = chips.some((chip) => chip.dataset.topic === initial);
  setTopic(known ? initial : 'all', false);
})();
