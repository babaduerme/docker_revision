(function () {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const TYPE_LABELS = { qcm: "QCM", relier: "À relier", taper: "Réponse à taper", vf: "Vrai / Faux", trou: "Texte à trous" };
  const state = { questions: [], index: 0, score: 0, answers: [], timerId: null, seconds: 0, timer: false };
  let storage = {};
  try { storage = JSON.parse(localStorage.getItem("docker-revision") || "{}"); } catch (error) { storage = {}; }

  function save() {
    try { localStorage.setItem("docker-revision", JSON.stringify(storage)); } catch (error) { /* stockage indisponible : le quiz reste utilisable */ }
  }
  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }
  function route() {
    const name = (location.hash || "#accueil").slice(1).split("?")[0] || "accueil";
    $$(".view").forEach((view) => view.classList.toggle("active", view.id === name));
    if (name === "cours") renderCourse();
    if (name === "flashcards") renderFlashcards();
    if (name === "revision" && !state.questions.length) $("#quiz-setup").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateHomeStats() {
    const best = Number(storage.best || 0);
    $("#best-score").textContent = best ? `${best}%` : "—";
    $("#total-answered").textContent = Number(storage.total || 0);
    $("#missed-count").textContent = (storage.missed || []).length;
  }
  function renderCourse() {
    const content = $("#course-content");
    const query = normalize($("#course-search").value);
    $("#course-toc").innerHTML = COURSE_SECTIONS.map((section) => `<a href="#${section.id}">${section.title}<small>${section.pages}</small></a>`).join("");
    content.innerHTML = COURSE_SECTIONS.map((section) => {
      const blocks = section.blocks.filter((block) => !query || normalize(`${block.title} ${block.text}`).includes(query));
      if (query && !blocks.length) return "";
      return `<article class="course-section" id="${section.id}"><div class="section-title"><span>${section.title.split(".")[0].padStart(2, "0")}</span><div><h2>${section.title.substring(3)}</h2><p>${section.summary} · ${section.pages}</p></div></div>${blocks.map((block) => {
        const extra = courseExample(block.title);
        return `<div class="course-block"><h3>${escapeHtml(block.title)}</h3><p>${escapeHtml(block.text)}</p>${extra}</div>`;
      }).join("")}</article>`;
    }).join("") || `<p class="empty">Aucune notion ne correspond à « ${escapeHtml(query)} ».</p>`;
  }
  function courseExample(title) {
    const examples = {
      "Docker en une phrase": ["📦 → 🚀", "Une image est comme un modèle de boîte. Le conteneur est la boîte utilisée.", "docker run nginx"],
      "Conteneur, image et machine virtuelle": ["💻 | 📦 | 📦", "Les conteneurs partagent le noyau de la machine hôte ; une VM embarque un OS complet.", "image nginx → conteneur web-1 + conteneur web-2"],
      "Cycle et commandes essentielles": ["📄 → 🏗️ → 📦 → 🚀", "On écrit la recette, on fabrique l'image, puis on démarre le conteneur.", "docker build -t mon-site:1.0 .\ndocker run mon-site:1.0"],
      "Volumes et ports": ["💻 :8080 🚪 → 🐳 :80", "8080 est la porte de ton ordinateur ; 80 est la porte écoutée dans le conteneur.", "docker run -d -p 8080:80 nginx"],
      "Images et registre": ["💻 ↔ ☁️ Docker Hub", "pull télécharge une image ; push publie ton image dans le registre.", "docker pull nginx\ndocker push monlogin/mon-api:1.0"],
      "Structure et bonnes pratiques": ["1️⃣ FROM  2️⃣ COPY  3️⃣ RUN  4️⃣ CMD", "Une bonne recette commence avec une base légère, versionnée, et ne contient aucun secret.", "FROM node:22-alpine\nCOPY package*.json ./\nRUN npm ci"],
      "Instructions principales": ["FROM 🧱  COPY 📄  WORKDIR 📁", "FROM choisit la base, COPY apporte les fichiers et WORKDIR choisit le dossier de travail.", "WORKDIR /app\nCOPY . .\nUSER node"],
      "RUN, CMD et ENTRYPOINT": ["RUN 🏗️ | CMD ▶️ | ENTRYPOINT 🔒", "RUN agit pendant la fabrication ; CMD et ENTRYPOINT agissent au démarrage.", "RUN apk add --no-cache curl\nCMD [\"node\", \"server.js\"]"],
      "Cache et contexte": ["📦 stable → 💻 changeant", "Copier package.json avant le code évite de réinstaller les dépendances à chaque modification.", "COPY package*.json ./\nRUN npm ci\nCOPY . ."],
      "ARG et ENV": ["ARG 🏗️ / ENV 🚀", "ARG sert au build ; ENV reste disponible dans le conteneur. Aucun des deux ne protège un secret.", "ARG GREET=Bonjour\nENV APP_ENV=production"],
      "Rôle de Compose": ["🌐 + ⚙️ + 🗄️ = 🏠", "Compose démarre plusieurs conteneurs ensemble avec une seule commande.", "docker compose up -d"],
      "Anatomie de compose.yaml": ["services:\n  web:\n  api:\n  db:", "Chaque nom sous services devient le nom d'un service sur le réseau privé.", "services:\n  web:\n    image: nginx:alpine\n  api:\n    build: ./api"],
      "Ports, variables et secrets": ["🔐 .env → ${DB_PASSWORD}", "Le fichier .env garde les valeurs sensibles hors de compose.yaml.", "environment:\n  - DB_HOST=db\n  - DB_PASSWORD=${DB_PASSWORD}"],
      "Volumes et cycle de vie": ["📁 hôte ↔ 🐳 /var/www\n🗄️ volume nommé", "Le bind mount est pratique en développement ; le volume nommé conserve les données d'une base.", "volumes:\n  - db-data:/var/lib/postgresql/data"],
      "Réseau et résilience": ["web ↔ api ↔ db", "Les services se contactent par leur nom, par exemple DB_HOST=db. depends_on organise le démarrage.", "depends_on:\n  db:\n    condition: service_healthy\nrestart: unless-stopped"]
    };
    const item = examples[title];
    if (!item) return "";
    return `<div class="course-example"><div class="example-visual">${escapeHtml(item[0])}</div><div><strong>Exemple simple</strong><p>${escapeHtml(item[1])}</p><pre><code>${escapeHtml(item[2])}</code></pre></div></div>`;
  }
  function startQuiz(part = "all", type = "all", count = 10, timer = false) {
    let pool = QUESTIONS.filter((question) => (part === "all" || question.partie === part) && (type === "all" || question.type === type));
    if (!pool.length) { window.alert("Aucune question ne correspond à ces filtres."); return; }
    state.questions = shuffle(pool).slice(0, Math.min(Number(count), pool.length));
    state.index = 0; state.score = 0; state.answers = []; state.seconds = 0; state.timer = timer;
    clearInterval(state.timerId);
    if (timer) state.timerId = setInterval(() => { state.seconds += 1; $("#timer").textContent = formatTime(state.seconds); }, 1000);
    $("#quiz-setup").classList.add("hidden"); $("#quiz-panel").classList.remove("hidden");
    location.hash = "#revision"; renderQuestion();
  }
  function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
  function renderQuestion() {
    const question = state.questions[state.index];
    if (!question) return finishQuiz();
    $("#quiz-label").textContent = `Question ${state.index + 1} / ${state.questions.length} · ${TYPE_LABELS[question.type]}`;
    $("#progress-bar").style.width = `${(state.index / state.questions.length) * 100}%`;
    $("#live-score").textContent = `${state.score} pt${state.score > 1 ? "s" : ""}`;
    const card = $("#question-card");
    card.innerHTML = `<p class="question-meta">Partie ${question.partie === "fondamentaux" ? "1" : question.partie === "dockerfile" ? "2" : "3"} · page ${question.slide}</p><h2>${escapeHtml(question.enonce)}</h2><div class="answer-area">${answerMarkup(question)}</div><div class="feedback" id="feedback"></div>`;
    if (question.type === "qcm" || question.type === "vf") {
      $$(".choice", card).forEach((button) => button.addEventListener("click", () => selectChoice(button, question)));
    } else if (question.type === "taper" || question.type === "trou") {
      $("#answer-submit").addEventListener("click", () => submitText(question));
      $("#answer-input").addEventListener("keydown", (event) => { if (event.key === "Enter") submitText(question); });
      $("#answer-show").addEventListener("click", () => showAnswer(question));
    } else {
      setupMatching(question);
    }
  }
  function answerMarkup(question) {
    if (question.type === "qcm") return `<p class="hint">Une ou plusieurs bonnes réponses</p><div class="choices">${shuffle(question.choix).map((choice) => `<button class="choice" type="button" data-value="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`).join("")}</div><button class="button primary validate-choice" type="button">Valider</button>`;
    if (question.type === "vf") return `<p class="hint">Choisissez une réponse puis justifiez-la mentalement.</p><div class="choices">${question.choix.map((choice) => `<button class="choice" type="button" data-value="${choice}">${choice}</button>`).join("")}</div>`;
    if (question.type === "relier") {
      const left = shuffle(question.paires.map((pair) => pair[0])); const right = shuffle(question.paires.map((pair) => pair[1]));
      return `<div class="matching"><div class="match-col">${left.map((item) => `<button class="match-item left" type="button" data-item="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}</div><div class="match-col">${right.map((item) => `<button class="match-item right" type="button" data-item="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}</div></div><p class="match-status">Sélectionnez un élément dans chaque colonne.</p>`;
    }
    return `<label class="sr-only" for="answer-input">Votre réponse</label><input id="answer-input" class="answer-input" autocomplete="off" placeholder="Votre réponse…"><div class="answer-actions"><button id="answer-submit" class="button primary" type="button">Valider</button><button id="answer-show" class="button ghost" type="button">Voir la réponse</button></div>`;
  }
  function selectChoice(button, question) {
    if (question.type === "qcm") {
      const selected = button.classList.toggle("selected");
      button.setAttribute("aria-pressed", String(selected));
    }
    else { $$(".choice").forEach((item) => item.classList.remove("selected")); button.classList.add("selected"); }
    const validate = $(".validate-choice");
    if (validate) { validate.onclick = () => { const selected = $$(".choice.selected").map((item) => item.dataset.value); grade(question, selected.length === question.bonnes_reponses.length && selected.every((item) => question.bonnes_reponses.includes(item)), selected.join(", ")); }; }
    if (question.type === "vf" && button.classList.contains("selected")) grade(question, question.bonnes_reponses.includes(button.dataset.value), button.dataset.value);
  }
  function submitText(question) {
    const answer = $("#answer-input").value;
    if (!answer.trim()) return;
    grade(question, question.reponses_acceptees.some((accepted) => normalize(answer) === normalize(accepted)), answer);
  }
  function showAnswer(question) {
    const feedback = $("#feedback");
    feedback.className = "feedback info";
    feedback.innerHTML = `<strong>Réponse attendue :</strong>${correctionMarkup(question)}<p>${escapeHtml(question.explication)}</p><a href="#cours" data-course-link="${question.section_cours}">Revoir dans le cours</a>`;
  }
  function correctionMarkup(question) {
    const answers = question.type === "relier"
      ? question.paires.map((pair) => `${pair[0]} → ${pair[1]}`)
      : question.type === "qcm" || question.type === "vf"
        ? question.bonnes_reponses
        : question.reponses_acceptees;
    return `<ul class="correction-list">${answers.map((answer) => `<li>${escapeHtml(answer)}</li>`).join("")}</ul>`;
  }
  function setupMatching(question) {
    let selectedLeft = null; const pairs = [];
    $$(".match-item.left").forEach((button) => button.addEventListener("click", () => { $$(".match-item.left").forEach((item) => item.classList.remove("selected")); selectedLeft = button; button.classList.add("selected"); }));
    $$(".match-item.right").forEach((button) => button.addEventListener("click", () => {
      if (!selectedLeft) return;
      const pair = [selectedLeft.dataset.item, button.dataset.item]; pairs.push(pair);
      selectedLeft.classList.add("matched"); button.classList.add("matched"); selectedLeft.disabled = true; button.disabled = true; selectedLeft = null;
      $(".match-status").textContent = `${pairs.length} / ${question.paires.length} associations`;
      if (pairs.length === question.paires.length) grade(question, pairs.every((pair) => question.paires.some((correct) => correct[0] === pair[0] && correct[1] === pair[1])), "Associations terminées");
    }));
  }
  function grade(question, correct, answer) {
    if ($("#feedback").dataset.done) return;
    $("#feedback").dataset.done = "true";
    if (correct) state.score += 1;
    state.answers.push({ question, correct, answer });
    const feedback = $("#feedback"); feedback.className = `feedback ${correct ? "success" : "error"}`;
    const expected = correctionMarkup(question);
    const expectedLabel = question.type === "relier" ? "Associations correctes :" : "Réponses correctes :";
    feedback.innerHTML = `<strong>${correct ? "Bonne réponse !" : "À revoir"}</strong>${correct ? "" : `<div class="correction"><b>Correction :</b><span class="correction-label">${expectedLabel}</span>${expected}</div>`}<p>${escapeHtml(question.explication)}</p><a href="#cours" data-course-link="${question.section_cours}">Revoir dans le cours →</a><button class="button primary next-button" type="button">${state.index + 1 === state.questions.length ? "Voir les résultats" : "Question suivante →"}</button>`;
    $(".next-button").addEventListener("click", () => { state.index += 1; renderQuestion(); });
    storage.total = Number(storage.total || 0) + 1;
    if (!correct) { storage.missed = Array.from(new Set([...(storage.missed || []), question.id])); }
    save(); updateHomeStats();
    $$("[data-course-link]").forEach((link) => link.addEventListener("click", () => { setTimeout(() => { const target = $(`#${link.dataset.courseLink}`); if (target) target.scrollIntoView(); }, 100); }));
  }
  function finishQuiz() {
    clearInterval(state.timerId); $("#progress-bar").style.width = "100%";
    const percent = Math.round((state.score / state.questions.length) * 100);
    storage.best = Math.max(Number(storage.best || 0), percent); save(); updateHomeStats();
    const errors = state.answers.filter((answer) => !answer.correct);
    $("#results-card").innerHTML = `<div class="result-score"><strong>${percent}%</strong><span>${state.score} / ${state.questions.length} bonnes réponses · ${formatTime(state.seconds)}</span></div><h2>${errors.length ? "Notions à revoir" : "Bravo, sans erreur !"}</h2><div class="error-list">${errors.map((item) => `<article><span>${TYPE_LABELS[item.question.type]}</span><p>${escapeHtml(item.question.enonce)}</p><a href="#cours">Revoir la partie ${item.question.partie}</a></article>`).join("") || "<p>Votre session est parfaite.</p>"}</div><div class="result-actions">${errors.length ? '<button id="retry-errors" class="button primary" type="button">Refaire mes erreurs</button>' : ""}<a class="button ghost" href="#accueil">Nouvelle session</a></div>`;
    $("#quiz-panel").classList.add("hidden"); location.hash = "#resultats";
    if (errors.length) $("#retry-errors").addEventListener("click", () => { state.questions = shuffle(errors.map((item) => item.question)); state.index = 0; state.score = 0; state.answers = []; location.hash = "#revision"; $("#quiz-panel").classList.remove("hidden"); renderQuestion(); });
  }
  function renderFlashcards() {
    $("#flashcard-list").innerHTML = QUESTIONS.filter((question) => question.type === "qcm").slice(0, 12).map((question) => `<button class="flashcard" type="button"><span>${escapeHtml(question.enonce)}</span><strong>${escapeHtml(question.bonnes_reponses.join(" · "))}</strong><small>Cliquer pour retourner</small></button>`).join("");
    $$(".flashcard").forEach((card) => card.addEventListener("click", () => card.classList.toggle("flipped")));
  }
  $("#count-range").addEventListener("input", (event) => { $("#count-output").textContent = event.target.value; });
  $("#start-button").addEventListener("click", () => startQuiz($("#part-select").value, $("#type-select").value, $("#count-range").value, $("#timer-toggle").checked));
  $("#quick-start").addEventListener("click", () => startQuiz("all", "all", 10, false));
  $("#course-search").addEventListener("input", renderCourse);
  $("#theme-toggle").addEventListener("click", () => { document.body.classList.toggle("light-theme"); $("#theme-toggle").textContent = document.body.classList.contains("light-theme") ? "☀" : "☾"; });
  window.addEventListener("hashchange", route);
  updateHomeStats(); route();
})();
