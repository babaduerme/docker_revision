# Docker Révision

Site de révision 100 % statique consacré au support **Docker — De zéro à Docker Compose**. Il fonctionne sans build, serveur, dépendance ou clé d'API.

## Publication sur GitHub Pages

1. Créez un dépôt GitHub et déposez tous les fichiers de ce dossier.
2. Ajoutez le PDF fourni par le cours sous `assets/cours-original.pdf`.
3. Dans **Settings > Pages**, choisissez **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`.
4. L'URL finale sera `https://VOTRE_UTILISATEUR.github.io/NOM-DU-DEPOT/`.

Le fichier `.nojekyll` évite que GitHub Pages applique le traitement Jekyll. Tous les chemins du site sont relatifs afin de fonctionner dans un dépôt projet.

## Modifier une question

Ouvrez `js/questions.js` et modifiez ou ajoutez un objet dans `const QUESTIONS = [...]`. Respectez les champs `id`, `type`, `partie`, `slide`, `enonce`, `explication` et `section_cours`. Pour un QCM, renseignez `choix` et `bonnes_reponses`; pour une question à taper ou un trou, utilisez `reponses_acceptees`; pour relier, utilisez cinq ou six paires dans `paires`. Les types disponibles sont `qcm`, `relier`, `taper`, `vf` et `trou`.

Le PDF n'est volontairement pas inclus dans ce dépôt : placez votre fichier original exactement à `assets/cours-original.pdf`.
