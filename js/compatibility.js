  const body = document.body;
  if (!body) {
    return;
  }

  const pageType = body.getAttribute('data-page');
  const STORAGE_KEY = 'tarotCompatibilitySubmission';
  const SUBMISSION_TTL = 1000 * 60 * 30; // 30 minutes

  const prefersReducedMotionQuery =
    typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  const prefersReducedMotion = () => (prefersReducedMotionQuery ? prefersReducedMotionQuery.matches : false);

  const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');

  const readStoredSubmission = () => {
    if (!('sessionStorage' in window)) {
      return null;
    }

    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      if (parsed.createdAt && Date.now() - parsed.createdAt > SUBMISSION_TTL) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  };

  const writeStoredSubmission = (data) => {
    if (!('sessionStorage' in window)) {
      return;
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // noop
    }
  };

  const clearStoredSubmission = () => {
    if (!('sessionStorage' in window)) {
      return;
    }

    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // noop
    }
  };

  const getRandomInt = (min, max) => {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
  };

  const drawCards = (count, deck) => {
    const selected = [];
    const usedIndexes = new Set();

    if (!Array.isArray(deck) || !deck.length) {
      return selected;
    }

    while (selected.length < count && usedIndexes.size < deck.length) {
      const index = getRandomInt(0, deck.length - 1);
      if (usedIndexes.has(index)) {
        continue;
      }

      usedIndexes.add(index);
      const card = deck[index];
      selected.push({
        name: card.name,
        img: card.img,
        description: card.meta_description,
        uprightMeaning: typeof card.meta_upright === 'string' ? card.meta_upright.trim() : '',
        reversedMeaning: typeof card.meta_reversed === 'string' ? card.meta_reversed.trim() : '',
        isReversed: Math.random() < 0.5
      });
    }

    return selected;
  };

  const cardsWord = (count) => {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return 'карту';
    }
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
      return 'карты';
    }
    return 'карт';
  };

  const createSummary = (cards, userName, partnerName) => {
    const pair = `${userName} и ${partnerName}`;
    const score = cards.reduce((total, card) => total + (card.isReversed ? -1 : 1), 0);
    const base = `Колода выбрала ${cards.length} ${cardsWord(cards.length)} для ${pair}. `;

    if (score >= 4) {
      return base + 'Энергия союза сияет: чувства взаимны, а потенциал отношений очень высок.';
    }
    if (score >= 2) {
      return base + 'Расклад благоприятен — между вами много поддержки, понимания и искренней симпатии.';
    }
    if (score >= 1) {
      return base + 'В паре ощущается здоровый баланс, хотя вам важно бережно относиться к чувствам друг друга.';
    }
    if (score === 0) {
      return base + 'Сейчас энергии уравновешены: итог отношений зависит от того, как вы распределите ответственность и внимание.';
    }
    if (score >= -2) {
      return base + 'Карты показывают несколько напряжённых моментов. Откровенный разговор и готовность к компромиссам помогут их сгладить.';
    }
    return base + 'Расклад предупреждает о серьёзных испытаниях. Не бойтесь обсуждать сложные темы и устанавливать ясные границы.';
  };

  const formatCardsList = (cards, getMeaning) => cards.map((card) => `${card.name} — ${getMeaning(card)}`).join('; ');

  const createAdvice = (cards) => {
    const positives = cards.filter((card) => !card.isReversed);
    const challenges = cards.filter((card) => card.isReversed);
    const adviceParts = [];

    if (positives.length) {
      adviceParts.push(`Опирайтесь на ${formatCardsList(positives, (card) => card.uprightMeaning)}. Эти карты усиливают вашу связь.`);
    } else {
      adviceParts.push('Сейчас ключ к гармонии — создание позитивных ритуалов и поддерживающих привычек в отношениях.');
    }

    if (challenges.length) {
      adviceParts.push(`Будьте внимательны к ${formatCardsList(challenges, (card) => card.reversedMeaning)}. Их энергия намекает на темы, требующие совместных решений.`);
    } else {
      adviceParts.push('Перевёрнутых карт нет, поэтому препятствий немного — используйте момент, чтобы укрепить доверие.');
    }

    return adviceParts.join(' ');
  };

  const renderHighlights = (cards, highlightsNode) => {
    if (!highlightsNode) {
      return;
    }

    highlightsNode.innerHTML = '';

    const positives = cards.filter((card) => !card.isReversed);
    const challenges = cards.filter((card) => card.isReversed);

    const positivesItem = document.createElement('li');
    positivesItem.textContent = positives.length
      ? `Сильные стороны: ${positives.map((card) => card.name).join(', ')}.`
      : 'Сильные стороны пока не проявлены — создайте их сами общими усилиями.';
    highlightsNode.appendChild(positivesItem);

    const challengesItem = document.createElement('li');
    challengesItem.textContent = challenges.length
      ? `Зоны роста: ${challenges.map((card) => card.name).join(', ')}.`
      : 'Сложные карты не выпали — серьёзных препятствий не видно.';
    highlightsNode.appendChild(challengesItem);

    cards.forEach((card) => {
      const cardItem = document.createElement('li');
      const orientation = card.isReversed ? 'Перевёрнутое положение' : 'Прямое положение';
      const meaning = card.isReversed ? card.reversedMeaning : card.uprightMeaning;
      cardItem.textContent = `${card.name}: ${orientation}. ${meaning}`;
      highlightsNode.appendChild(cardItem);
    });
  };

  const renderCards = (cards, container) => {
    if (!container) {
      return;
    }

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const createdElements = [];

    cards.forEach((card) => {
      const article = document.createElement('article');
      article.className = 'tarot-card';
      article.classList.add('tarot-card--hidden');

      const figure = document.createElement('figure');
      figure.className = 'tarot-card__figure';

      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'tarot-card__image';
      if (card.isReversed) {
        imageWrapper.classList.add('tarot-card__image--reversed');
      }

      const image = document.createElement('img');
      image.src = card.img;
      image.loading = 'lazy';
      image.alt = card.isReversed ? `${card.name} — перевёрнутое положение` : `${card.name}`;

      imageWrapper.appendChild(image);
      figure.appendChild(imageWrapper);

      const caption = document.createElement('figcaption');
      caption.className = 'tarot-card__caption';

      const nameEl = document.createElement('span');
      nameEl.className = 'tarot-card__name';
      nameEl.textContent = card.name;

      const orientationEl = document.createElement('span');
      orientationEl.className = 'tarot-card__orientation';
      orientationEl.textContent = card.isReversed ? 'Перевёрнутое положение' : 'Прямое положение';

      caption.appendChild(nameEl);
      caption.appendChild(orientationEl);
      figure.appendChild(caption);

      article.appendChild(figure);

      const keywords = document.createElement('p');
      keywords.className = 'tarot-card__keywords';
      keywords.textContent = card.isReversed ? card.reversedMeaning : card.uprightMeaning;
      article.appendChild(keywords);

      const description = document.createElement('p');
      description.className = 'tarot-card__description';
      description.textContent = card.description;
      article.appendChild(description);

      fragment.appendChild(article);
      createdElements.push(article);
    });

    container.appendChild(fragment);

    if (prefersReducedMotion()) {
      createdElements.forEach((element) => element.classList.remove('tarot-card--hidden'));
      return;
    }

    createdElements.forEach((element, index) => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          element.classList.remove('tarot-card--hidden');
        }, index * 150);
      });
    });
  };

  const revealResultsPanel = (section) => {
    if (!section) {
      return;
    }

    if (section.hidden) {
      section.hidden = false;
    }

    if (!prefersReducedMotion()) {
      section.classList.remove('is-visible');
      void section.offsetWidth;
      section.classList.add('is-visible');
    } else {
      section.classList.add('is-visible');
    }
  };

  const formatBirthday = (value) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    try {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return value;
    }
  };

  const runFormPage = () => {
    const form = document.getElementById('compatibility-form');
    if (!form) {
      return;
    }

    const hint = document.querySelector('[data-hint]');
    const drawButton = form.querySelector('button[type="submit"]');
    const resultsPage = form.getAttribute('data-results-page') || 'reading-result.html';

    const triggerDrawAnimation = () => {
      if (!drawButton) {
        return;
      }

      drawButton.classList.remove('cta-button--drawing');
      void drawButton.offsetWidth;
      drawButton.classList.add('cta-button--drawing');
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const userName = sanitize(form.userName.value);
      const partnerName = sanitize(form.partnerName.value);
      const userBirthday = form.userBirthday.value;
      const partnerBirthday = form.partnerBirthday.value;

      if (!userName || !partnerName || !userBirthday || !partnerBirthday) {
        if (hint) {
          hint.textContent = 'Пожалуйста, заполните все поля — именно так карты смогут отразить вашу историю.';
        }
        return;
      }

      if (hint) {
        hint.textContent = 'Подготавливаем магию расклада...';
      }

      triggerDrawAnimation();

      const submission = {
        userName,
        partnerName,
        userBirthday,
        partnerBirthday,
        createdAt: Date.now()
      };

      clearStoredSubmission();
      writeStoredSubmission(submission);

      const redirectDelay = prefersReducedMotion() ? 60 : 420;
      window.setTimeout(() => {
        window.location.href = resultsPage;
      }, redirectDelay);
    });
  };

  const runResultsPage = () => {
    const resultsSection = document.getElementById('compatibilityResult');
    const summaryEl = document.getElementById('compatibility-summary');
    const highlightsEl = document.getElementById('compatibility-highlights');
    const cardsContainer = document.getElementById('cards-container');
    const adviceEl = document.getElementById('compatibility-advice');
    const namesEl = document.querySelector('[data-pair-names]');
    const datesEl = document.querySelector('[data-pair-dates]');
    const messageEl = document.querySelector('[data-results-hint]');

    const deck = typeof rider_waite_cards !== 'undefined' && Array.isArray(rider_waite_cards) ? rider_waite_cards : [];

    const submission = readStoredSubmission();
    if (!submission) {
      if (messageEl) {
        messageEl.textContent = 'Сначала заполните форму совместимости, чтобы получить новый расклад.';
      }
      window.setTimeout(() => {
        window.location.href = 'reading.html';
      }, 2500);
      return;
    }

    const { userName, partnerName, userBirthday, partnerBirthday } = submission;

    if (namesEl) {
      namesEl.textContent = `${userName} и ${partnerName}`;
    }

    if (datesEl) {
      const formattedUser = formatBirthday(userBirthday);
      const formattedPartner = formatBirthday(partnerBirthday);
      if (formattedUser || formattedPartner) {
        datesEl.textContent = `Дата рождения: ${formattedUser || '—'} • ${formattedPartner || '—'}`;
      } else {
        datesEl.textContent = '';
      }
    }

    if (!deck.length) {
      if (messageEl) {
        messageEl.textContent = 'Не удалось загрузить колоду Таро. Обновите страницу или попробуйте позже.';
      }
      return;
    }

    let cards = Array.isArray(submission.cards) ? submission.cards : [];
    if (!cards.length) {
      const cardsToDraw = getRandomInt(3, 5);
      cards = drawCards(cardsToDraw, deck);
      writeStoredSubmission({
        ...submission,
        cards,
        generatedAt: Date.now()
      });
    }

    if (messageEl) {
      messageEl.textContent = 'Расклад готов!';
    }

    if (summaryEl) {
      summaryEl.textContent = createSummary(cards, userName, partnerName);
    }

    renderHighlights(cards, highlightsEl);
    renderCards(cards, cardsContainer);

    if (adviceEl) {
      adviceEl.textContent = createAdvice(cards);
    }

    revealResultsPanel(resultsSection);

    if (resultsSection) {
      const scrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
      resultsSection.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }
  };

  if (pageType === 'compatibility-form') {
    runFormPage();
  }

  if (pageType === 'compatibility-results') {
    runResultsPage();
  }
+  const form = document.getElementById('compatibility-form');
+  const hint = document.querySelector('[data-hint]');
+  const resultsSection = document.getElementById('compatibilityResult');
+  const summaryEl = document.getElementById('compatibility-summary');
+  const highlightsEl = document.getElementById('compatibility-highlights');
+  const cardsContainer = document.getElementById('cards-container');
+  const adviceEl = document.getElementById('compatibility-advice');
+  const drawButton = form?.querySelector('button[type="submit"]') ?? null;
+  const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
+
+  if (!form) {
+    return;
+  }
+
+  const sanitize = (value) => value.trim();
+
+  const getRandomInt = (min, max) => {
+    const minCeil = Math.ceil(min);
+    const maxFloor = Math.floor(max);
+    return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
+  };
+
+  const drawCards = (count) => {
+    const selected = [];
+    const usedIndexes = new Set();
+
+    while (selected.length < count) {
+      const index = getRandomInt(0, rider_waite_cards.length - 1);
+      if (usedIndexes.has(index)) {
+        continue;
+      }
+      usedIndexes.add(index);
+      const card = rider_waite_cards[index];
+      selected.push({
+        name: card.name,
+        img: card.img,
+        description: card.meta_description,
+        uprightMeaning: card.meta_upright?.trim() ?? '',
+        reversedMeaning: card.meta_reversed?.trim() ?? '',
+        isReversed: Math.random() < 0.5
+      });
+    }
+
+    return selected;
+  };
+
+  const cardsWord = (count) => {
+    const mod10 = count % 10;
+    const mod100 = count % 100;
+
+    if (mod10 === 1 && mod100 !== 11) {
+      return 'карту';
+    }
+    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
+      return 'карты';
+    }
+    return 'карт';
+  };
+
+  const createSummary = (cards, userName, partnerName) => {
+    const pair = `${userName} и ${partnerName}`;
+    const score = cards.reduce((total, card) => total + (card.isReversed ? -1 : 1), 0);
+    const base = `Колода выбрала ${cards.length} ${cardsWord(cards.length)} для ${pair}. `;
+
+    if (score >= 4) {
+      return base + 'Энергия союза сияет: чувства взаимны, а потенциал отношений очень высок.';
+    }
+    if (score >= 2) {
+      return base + 'Расклад благоприятен — между вами много поддержки, понимания и искренней симпатии.';
+    }
+    if (score >= 1) {
+      return base + 'В паре ощущается здоровый баланс, хотя вам важно бережно относиться к чувствам друг друга.';
+    }
+    if (score === 0) {
+      return base + 'Сейчас энергии уравновешены: итог отношений зависит от того, как вы распределите ответственность и внимание.';
+    }
+    if (score >= -2) {
+      return base + 'Карты показывают несколько напряжённых моментов. Откровенный разговор и готовность к компромиссам помогут их сгладить.';
+    }
+    return base + 'Расклад предупреждает о серьёзных испытаниях. Не бойтесь обсуждать сложные темы и устанавливать ясные границы.';
+  };
+
+  const formatCardsList = (cards, getMeaning) => {
+    return cards.map((card) => `${card.name} — ${getMeaning(card)}`).join('; ');
+  };
+
+  const createAdvice = (cards) => {
+    const positives = cards.filter((card) => !card.isReversed);
+    const challenges = cards.filter((card) => card.isReversed);
+    const adviceParts = [];
+
+    if (positives.length) {
+      adviceParts.push(`Опирайтесь на ${formatCardsList(positives, (card) => card.uprightMeaning)}. Эти карты усиливают вашу связь.`);
+    } else {
+      adviceParts.push('Сейчас ключ к гармонии — создание позитивных ритуалов и поддерживающих привычек в отношениях.');
+    }
+
+    if (challenges.length) {
+      adviceParts.push(`Будьте внимательны к ${formatCardsList(challenges, (card) => card.reversedMeaning)}. Их энергия намекает на темы, требующие совместных решений.`);
+    } else {
+      adviceParts.push('Перевёрнутых карт нет, поэтому препятствий немного — используйте момент, чтобы укрепить доверие.');
+    }
+
+    return adviceParts.join(' ');
+  };
+
+  const renderHighlights = (cards, highlightsNode) => {
+    highlightsNode.innerHTML = '';
+
+    const positives = cards.filter((card) => !card.isReversed);
+    const challenges = cards.filter((card) => card.isReversed);
+
+    const positivesItem = document.createElement('li');
+    positivesItem.textContent = positives.length
+      ? `Сильные стороны: ${positives.map((card) => card.name).join(', ')}.`
+      : 'Сильные стороны пока не проявлены — создайте их сами общими усилиями.';
+    highlightsNode.appendChild(positivesItem);
+
+    const challengesItem = document.createElement('li');
+    challengesItem.textContent = challenges.length
+      ? `Зоны роста: ${challenges.map((card) => card.name).join(', ')}.`
+      : 'Сложные карты не выпали — серьёзных препятствий не видно.';
+    highlightsNode.appendChild(challengesItem);
+
+    cards.forEach((card) => {
+      const cardItem = document.createElement('li');
+      const orientation = card.isReversed ? 'Перевёрнутое положение' : 'Прямое положение';
+      const meaning = card.isReversed ? card.reversedMeaning : card.uprightMeaning;
+      cardItem.textContent = `${card.name}: ${orientation}. ${meaning}`;
+      highlightsNode.appendChild(cardItem);
+    });
+  };
+
+  const revealResultsPanel = () => {
+    if (!resultsSection) {
+      return;
+    }
+
+    if (resultsSection.hidden) {
+      resultsSection.hidden = false;
+    }
+
+    if (!prefersReducedMotionQuery.matches) {
+      resultsSection.classList.remove('is-visible');
+      void resultsSection.offsetWidth;
+      resultsSection.classList.add('is-visible');
+    } else {
+      resultsSection.classList.add('is-visible');
+    }
+  };
+
+  const triggerDrawAnimation = () => {
+    if (!drawButton) {
+      return;
+    }
+
+    drawButton.classList.remove('cta-button--drawing');
+    void drawButton.offsetWidth;
+    drawButton.classList.add('cta-button--drawing');
+  };
+
+  const renderCards = (cards, container) => {
+    container.innerHTML = '';
+    const fragment = document.createDocumentFragment();
+    const createdElements = [];
+
+    cards.forEach((card) => {
+      const article = document.createElement('article');
+      article.className = 'tarot-card';
+      article.classList.add('tarot-card--hidden');
+
+      const figure = document.createElement('figure');
+      figure.className = 'tarot-card__figure';
+
+      const imageWrapper = document.createElement('div');
+      imageWrapper.className = 'tarot-card__image';
+      if (card.isReversed) {
+        imageWrapper.classList.add('tarot-card__image--reversed');
+      }
+
+      const image = document.createElement('img');
+      image.src = card.img;
+      image.loading = 'lazy';
+      image.alt = card.isReversed ? `${card.name} — перевёрнутое положение` : `${card.name}`;
+
+      imageWrapper.appendChild(image);
+      figure.appendChild(imageWrapper);
+
+      const caption = document.createElement('figcaption');
+      caption.className = 'tarot-card__caption';
+
+      const nameEl = document.createElement('span');
+      nameEl.className = 'tarot-card__name';
+      nameEl.textContent = card.name;
+
+      const orientationEl = document.createElement('span');
+      orientationEl.className = 'tarot-card__orientation';
+      orientationEl.textContent = card.isReversed ? 'Перевёрнутое положение' : 'Прямое положение';
+
+      caption.append(nameEl, orientationEl);
+      figure.appendChild(caption);
+
+      article.appendChild(figure);
+
+      const keywords = document.createElement('p');
+      keywords.className = 'tarot-card__keywords';
+      keywords.textContent = card.isReversed ? card.reversedMeaning : card.uprightMeaning;
+      article.appendChild(keywords);
+
+      const description = document.createElement('p');
+      description.className = 'tarot-card__description';
+      description.textContent = card.description;
+      article.appendChild(description);
+
+      fragment.appendChild(article);
+      createdElements.push(article);
+    });
+
+    container.appendChild(fragment);
+
+    if (prefersReducedMotionQuery.matches) {
+      createdElements.forEach((element) => element.classList.remove('tarot-card--hidden'));
+      return;
+    }
+
+    createdElements.forEach((element, index) => {
+      requestAnimationFrame(() => {
+        setTimeout(() => {
+          element.classList.remove('tarot-card--hidden');
+        }, index * 150);
+      });
+    });
+  };
+
+  const handleSubmit = (event) => {
+    event.preventDefault();
+
+    const userName = sanitize(form.userName.value);
+    const partnerName = sanitize(form.partnerName.value);
+    const userBirthday = form.userBirthday.value;
+    const partnerBirthday = form.partnerBirthday.value;
+
+    if (!userName || !partnerName || !userBirthday || !partnerBirthday) {
+      if (hint) {
+        hint.textContent = 'Пожалуйста, заполните все поля — именно так карты смогут отразить вашу историю.';
+      }
+      if (resultsSection) {
+        resultsSection.hidden = true;
+        resultsSection.classList.remove('is-visible');
+      }
+      return;
+    }
+
+    triggerDrawAnimation();
+
+    if (hint) {
+      hint.textContent = '';
+    }
+
+    const cardsToDraw = getRandomInt(3, 5);
+    const drawnCards = drawCards(cardsToDraw);
+
+    summaryEl.textContent = createSummary(drawnCards, userName, partnerName);
+    renderHighlights(drawnCards, highlightsEl);
+    renderCards(drawnCards, cardsContainer);
+    adviceEl.textContent = createAdvice(drawnCards);
+
+    revealResultsPanel();
+
+    if (resultsSection) {
+      const scrollBehavior = prefersReducedMotionQuery.matches ? 'auto' : 'smooth';
+      resultsSection.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
+    }
+  };
+
+  form.addEventListener('submit', handleSubmit);
