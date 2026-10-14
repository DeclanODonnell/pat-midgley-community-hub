const body = document.body;
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');

const redirectInviteToken = () => {
  const { hash, search, pathname } = window.location;
  const tokenSource = `${hash}${search}`;
  const isInvite = /invite_token=|confirmation_token=|recovery_token=/i.test(tokenSource);
  if (!isInvite) return;

  if (pathname.startsWith('/admin')) {
    if (!hash && search) {
      const token = `#${search.replace(/^\?/, '')}`;
      window.location.replace(`/admin/${token}`);
    }
    return;
  }

  const token = hash ? hash : `#${search.replace(/^\?/, '')}`;
  window.location.replace(`/admin/${token}`);
};

redirectInviteToken();

const closeNav = () => {
  body.classList.remove('nav-open');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
  }
};

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('click', (event) => {
    if (!body.classList.contains('nav-open')) return;
    if (nav.contains(event.target) || navToggle.contains(event.target)) return;
    closeNav();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeNav();
    }
  });
}

const syncNavState = () => {
  if (window.innerWidth > 900) {
    closeNav();
  }
};

window.addEventListener('resize', syncNavState, { passive: true });
syncNavState();

const onScroll = () => {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 10);
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

let revealObserver;

const observeReveals = (targets) => {
  if (!targets || targets.length === 0) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
  }

  targets.forEach((target) => revealObserver.observe(target));
};

observeReveals(document.querySelectorAll('.reveal'));

const fetchJSON = (path, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(path, { cache: 'no-store', signal: controller.signal })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
      }
      return response.json();
    })
    .finally(() => clearTimeout(timer));
};

const oneOffGrid = document.querySelector('[data-one-off-events]');
const weeklyScheduleGrid = document.querySelector('[data-weekly-schedule]');

if (oneOffGrid || weeklyScheduleGrid) {
  const setEventStatus = (container, message) => {
    if (!container) return;
    container.innerHTML = '';
    const status = document.createElement('p');
    status.className = 'meta schedule-status';
    status.textContent = message;
    container.appendChild(status);
  };

  const formatEventDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const normalizeItem = (item, kind) => {
    if (!item) return {};
    const fields = item.fields || item;
    return { ...fields, kind: kind || item.kind || item.type || fields.kind || fields.type };
  };

  const sortOneOffEvents = (items) =>
    [...items].sort((a, b) => {
      const aDate = a && a.date ? new Date(a.date) : null;
      const bDate = b && b.date ? new Date(b.date) : null;
      const aTime = aDate && !Number.isNaN(aDate.getTime()) ? aDate.getTime() : 0;
      const bTime = bDate && !Number.isNaN(bDate.getTime()) ? bDate.getTime() : 0;
      return aTime - bTime;
    });

  const normalizeWhatsOnData = (data) => {
    const legacyItems = Array.isArray(data.items) ? data.items : [];
    const legacyWeekly = legacyItems
      .filter((item) => {
        const type = item && (item.type || item.kind);
        return type !== 'one_time';
      })
      .map((item) => normalizeItem(item, 'weekly'));
    const legacyOneOff = legacyItems
      .filter((item) => {
        const type = item && (item.type || item.kind);
        return type === 'one_time';
      })
      .map((item) => normalizeItem(item, 'one_time'));

    const weeklySchedule = (
      Array.isArray(data.weekly_schedule)
        ? data.weekly_schedule
        : Array.isArray(data.weekly)
          ? data.weekly
          : legacyWeekly
    ).map((item) => normalizeItem(item, 'weekly'));

    const oneOffEvents = sortOneOffEvents(
      (
        Array.isArray(data.one_off_events)
          ? data.one_off_events
          : Array.isArray(data.one_time)
            ? data.one_time
            : legacyOneOff
      ).map((item) => normalizeItem(item, 'one_time'))
    );

    return { oneOffEvents, weeklySchedule };
  };

  const buildEventCard = (item, index) => {
    const data = normalizeItem(item);
    const card = document.createElement('article');
    card.className = 'schedule-card reveal';
    if (index > 0) {
      const delay = Math.min(index * 0.05, 0.3).toFixed(2);
      card.style.setProperty('--delay', `${delay}s`);
    }

    if (data.image) {
      const media = document.createElement('div');
      media.className = 'schedule-media';
      const img = document.createElement('img');
      img.src = data.image;
      img.alt = data.title ? `${data.title} event` : 'Event photo';
      img.loading = 'lazy';
      media.appendChild(img);
      card.appendChild(media);
    }

    const label = data.kind === 'one_time' ? formatEventDate(data.date) : data.day || '';

    if (label) {
      const day = document.createElement('span');
      day.className = 'day-pill';
      day.textContent = label;
      card.appendChild(day);
    }

    const title = document.createElement('h3');
    title.textContent = data.title || '';
    card.appendChild(title);

    const time = document.createElement('p');
    time.className = 'time';
    time.textContent = data.time || '';
    card.appendChild(time);

    const desc = document.createElement('p');
    desc.textContent = data.description || '';
    card.appendChild(desc);

    return card;
  };

  const renderEventCollection = (container, items, emptyMessage) => {
    if (!container) return;
    if (!items || items.length === 0) {
      setEventStatus(container, emptyMessage);
      return;
    }

    container.innerHTML = '';
    const cards = items.map(buildEventCard);
    cards.forEach((card) => container.appendChild(card));
    observeReveals(cards);
  };

  fetchJSON('data/whats-on.json')
    .then((data) => {
      const { oneOffEvents, weeklySchedule } = normalizeWhatsOnData(data);
      renderEventCollection(
        oneOffGrid,
        oneOffEvents,
        'No one-off events listed right now. Please check Facebook for updates.'
      );
      renderEventCollection(
        weeklyScheduleGrid,
        weeklySchedule,
        'No weekly sessions listed yet. Please check Facebook for updates.'
      );
    })
    .catch(() => {
      setEventStatus(oneOffGrid, 'One-off events are unavailable right now. Please check Facebook for updates.');
      setEventStatus(
        weeklyScheduleGrid,
        'Weekly timetable unavailable right now. Please check Facebook for updates.'
      );
    });
}

const newsGrid = document.querySelector('[data-news]');
if (newsGrid) {
  const setNewsStatus = (message) => {
    newsGrid.innerHTML = '';
    const status = document.createElement('p');
    status.className = 'meta schedule-status';
    status.textContent = message;
    newsGrid.appendChild(status);
  };

  const buildNewsCard = (post, index) => {
    const card = document.createElement('article');
    card.className = 'news-card reveal';
    if (index > 0) {
      const delay = Math.min(index * 0.05, 0.3).toFixed(2);
      card.style.setProperty('--delay', `${delay}s`);
    }

    if (post.image) {
      const img = document.createElement('img');
      img.src = post.image;
      img.alt = post.title ? post.title : 'News update';
      img.loading = 'lazy';
      card.appendChild(img);
    }

    const body = document.createElement('div');
    body.className = 'news-card-body';

    if (post.date_label) {
      const meta = document.createElement('p');
      meta.className = 'card-meta';
      meta.textContent = post.date_label;
      body.appendChild(meta);
    }

    const title = document.createElement('h3');
    title.textContent = post.title || '';
    body.appendChild(title);

    const bodyText = post.summary || post.body || '';
    let paragraphs = [];
    if (bodyText) {
      paragraphs = bodyText
        .split(/\n\s*\n/)
        .map((text) => text.trim())
        .filter(Boolean);
    } else if (Array.isArray(post.paragraphs)) {
      paragraphs = post.paragraphs
        .map((entry) =>
          typeof entry === 'string' ? entry : entry && entry.text ? entry.text : ''
        )
        .map((text) => text.trim())
        .filter(Boolean);
    }

    paragraphs.forEach((text) => {
      const p = document.createElement('p');
      p.textContent = text;
      body.appendChild(p);
    });

    card.appendChild(body);
    return card;
  };

  const renderNews = (posts) => {
    if (!posts || posts.length === 0) {
      setNewsStatus('No news updates available right now.');
      return;
    }

    newsGrid.innerHTML = '';
    const cards = posts.map(buildNewsCard);
    cards.forEach((card) => newsGrid.appendChild(card));
    observeReveals(cards);
  };

  fetchJSON('data/news.json')
    .then((data) => {
      renderNews(data.posts);
    })
    .catch(() => {
      setNewsStatus('News updates unavailable right now. Please check Facebook for updates.');
    });
}

const pageDataEl = document.querySelector('[data-page-json]');
if (pageDataEl) {
  const getPath = (obj, path) =>
    path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

  const hydrateFields = (data) => {
    document.querySelectorAll('[data-field]').forEach((el) => {
      const value = getPath(data, el.getAttribute('data-field'));
      if (value === undefined || value === null || value === '') return;
      const attr = el.getAttribute('data-field-attr');
      if (attr) {
        el.setAttribute(attr, value);
      } else {
        el.textContent = value;
      }
    });
  };

  const buildParagraphs = (text) =>
    (text || '')
      .split(/\n\s*\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);

  const renderPricing = (container, tables) => {
    if (!container || !Array.isArray(tables) || !tables.length) return;
    container.innerHTML = '';
    const cards = tables.map((table, index) => {
      const card = document.createElement('div');
      card.className = 'pricing-card reveal';
      if (index > 0) card.style.setProperty('--delay', `${Math.min(index * 0.1, 0.3).toFixed(2)}s`);
      const title = document.createElement('h3');
      title.textContent = table.title || '';
      card.appendChild(title);
      const list = document.createElement('ul');
      (table.rates || []).forEach((rate) => {
        const li = document.createElement('li');
        li.textContent = rate.text || '';
        list.appendChild(li);
      });
      card.appendChild(list);
      return card;
    });
    cards.forEach((card) => container.appendChild(card));
    observeReveals(cards);
  };

  const renderCardGrid = (container, items, { withMiniAndLink } = {}) => {
    if (!container || !Array.isArray(items) || !items.length) return;
    container.innerHTML = '';
    const cards = items.map((item, index) => {
      const card = document.createElement('article');
      card.className = 'card reveal';
      if (index > 0) card.style.setProperty('--delay', `${Math.min(index * 0.05, 0.3).toFixed(2)}s`);
      if (item.tag) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = item.tag;
        card.appendChild(tag);
      }
      const title = document.createElement('h3');
      title.textContent = item.title || '';
      card.appendChild(title);
      if (item.description) {
        const desc = document.createElement('p');
        desc.textContent = item.description;
        card.appendChild(desc);
      }
      if (withMiniAndLink) {
        if (item.mini_text) {
          const mini = document.createElement('p');
          mini.className = 'mini';
          mini.textContent = item.mini_text;
          card.appendChild(mini);
        }
        if (item.link_text && item.link_url) {
          const link = document.createElement('a');
          link.className = 'text-link';
          link.href = item.link_url;
          link.textContent = item.link_text;
          card.appendChild(link);
        }
      }
      return card;
    });
    cards.forEach((card) => container.appendChild(card));
    observeReveals(cards);
  };

  const initials = (name) =>
    (name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');

  const buildTrusteeRow = (person, reverse) => {
    const row = document.createElement('article');
    row.className = `trustee-row reveal${reverse ? ' reverse' : ''}`;

    const photo = document.createElement('div');
    photo.className = 'trustee-photo';
    if (person.image) {
      const img = document.createElement('img');
      img.src = person.image;
      img.alt = person.name || '';
      photo.appendChild(img);
    } else {
      const avatar = document.createElement('div');
      avatar.className = 'trustee-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = initials(person.name);
      photo.appendChild(avatar);
    }
    row.appendChild(photo);

    const body = document.createElement('div');
    body.className = 'trustee-body';
    const name = document.createElement('h3');
    name.textContent = person.name || '';
    body.appendChild(name);
    if (person.role) {
      const role = document.createElement('p');
      role.className = 'trustee-role';
      role.textContent = person.role;
      body.appendChild(role);
    }
    buildParagraphs(person.bio).forEach((text) => {
      const p = document.createElement('p');
      p.textContent = text;
      body.appendChild(p);
    });
    row.appendChild(body);
    return row;
  };

  const renderTrustees = (container, people, { alternate } = {}) => {
    if (!container || !Array.isArray(people) || !people.length) return;
    container.innerHTML = '';
    const rows = people.map((person, index) => buildTrusteeRow(person, alternate && index % 2 === 0));
    rows.forEach((row) => container.appendChild(row));
    observeReveals(rows);
  };

  const renderContactRoutes = (container, routes) => {
    if (!container || !Array.isArray(routes) || !routes.length) return;
    container.innerHTML = '';
    const cards = routes.map((route, index) => {
      const info = document.createElement('div');
      info.className = 'contact-info reveal';
      if (index > 0) info.style.setProperty('--delay', `${Math.min(index * 0.05, 0.3).toFixed(2)}s`);
      if (route.eyebrow) {
        const eyebrow = document.createElement('p');
        eyebrow.className = 'eyebrow';
        eyebrow.textContent = route.eyebrow;
        info.appendChild(eyebrow);
      }
      const title = document.createElement('h3');
      title.textContent = route.title || '';
      info.appendChild(title);
      if (route.description) {
        const desc = document.createElement('p');
        desc.textContent = route.description;
        info.appendChild(desc);
      }
      if (route.email) {
        const email = document.createElement('p');
        const link = document.createElement('a');
        link.className = 'text-link';
        link.href = `mailto:${route.email}`;
        link.textContent = route.email;
        email.appendChild(link);
        info.appendChild(email);
      }
      if (route.phone) {
        const phone = document.createElement('p');
        phone.textContent = route.phone;
        info.appendChild(phone);
      }
      if (route.button_text && route.email) {
        const actions = document.createElement('div');
        actions.className = 'contact-actions';
        const btn = document.createElement('a');
        btn.className = index === 0 ? 'btn btn-primary' : 'btn btn-ghost';
        btn.href = `mailto:${route.email}`;
        btn.textContent = route.button_text;
        actions.appendChild(btn);
        info.appendChild(actions);
      }
      return info;
    });
    cards.forEach((card) => container.appendChild(card));
    observeReveals(cards);
  };

  fetchJSON(pageDataEl.getAttribute('data-page-json'))
    .then((data) => {
      hydrateFields(data);
      renderPricing(document.querySelector('[data-pricing-list]'), data.pricing);
      renderCardGrid(document.querySelector('[data-resource-cards]'), data.cards, { withMiniAndLink: true });
      renderCardGrid(document.querySelector('[data-partner-cards]'), data.partners, { withMiniAndLink: false });
      renderTrustees(document.querySelector('[data-hub-team]'), data.hub_team, { alternate: false });
      renderTrustees(document.querySelector('[data-trustee-list]'), data.trustees, { alternate: true });
      renderContactRoutes(document.querySelector('[data-contact-routes]'), data.routes);
    })
    .catch(() => {
      // Keep the page's existing static content if the JSON can't be loaded.
    });
}
