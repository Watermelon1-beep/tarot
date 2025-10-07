diff --git a//dev/null b/js/compatibility.js
index 0000000000000000000000000000000000000000..9259c3b57f0eaa9001758f2976c0a967521ee71b 100644
--- a//dev/null
+++ b/js/compatibility.js
@@ -0,0 +1,278 @@
+(() => {
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
+})();
