const COURSE_SECTIONS = [
  {
    id: "fondamentaux",
    title: "1. Les fondamentaux",
    pages: "pages 5 à 24",
    summary: "Comprendre les conteneurs, les images, les volumes, les ports et la CLI quotidienne.",
    blocks: [
      { title: "Docker en une phrase", text: "Docker empaquette une application avec tout ce dont elle a besoin, puis la lance à l'identique sur n'importe quelle machine. Le résultat est reproductible, léger et isolé (p. 6)." },
      { title: "Conteneur, image et machine virtuelle", text: "Un conteneur est un processus isolé qui partage le noyau de l'hôte. Une image est un modèle figé en lecture seule ; un conteneur est une instance en cours d'exécution avec une couche modifiable. Une VM embarque un OS complet, alors que les conteneurs partagent le noyau (p. 8-10)." },
      { title: "Cycle et commandes essentielles", text: "Le Dockerfile est la recette, docker build construit l'image, docker run démarre un conteneur, puis docker push publie l'image dans un registre. docker ps liste, docker logs observe, docker exec lance une commande dans un conteneur déjà démarré, docker stop arrête et docker rm supprime (p. 11, 17-21)." },
      { title: "Volumes et ports", text: "Sans volume, les écritures disparaissent avec le conteneur. Un bind mount relie un chemin de l'hôte à un chemin du conteneur. La publication se lit -p hôte:conteneur : par exemple -p 8080:80 rend le port 80 accessible sur localhost:8080 (p. 15-16)." },
      { title: "Images et registre", text: "docker pull récupère une image (latest si aucun tag n'est donné), docker images les affiche et docker rmi en supprime. Docker Hub est un registre public ; docker login authentifie, docker tag prépare un nom utilisateur/image:tag et docker push publie (p. 19-20)." }
    ]
  },
  {
    id: "dockerfile",
    title: "2. Le Dockerfile",
    pages: "pages 25 à 41",
    summary: "Décrire une image versionnée, lisible et reconstructible.",
    blocks: [
      { title: "Structure et bonnes pratiques", text: "Un Dockerfile liste ligne par ligne les instructions de construction. Commencez par une image officielle légère et versionnée, n'installez que le nécessaire, ne mettez jamais de secret dans l'image, et ordonnez les instructions du plus stable au plus changeant (p. 26-28)." },
      { title: "Instructions principales", text: "FROM choisit la base et doit être la première instruction. LABEL ajoute des métadonnées. WORKDIR définit le dossier courant. COPY transfère des fichiers du contexte. USER change l'utilisateur. EXPOSE documente un port mais ne le publie pas (p. 29, 34-35)." },
      { title: "RUN, CMD et ENTRYPOINT", text: "RUN s'exécute pendant le build et crée une couche. CMD définit la commande par défaut, remplaçable par docker run. ENTRYPOINT fixe le programme ; CMD fournit alors ses arguments par défaut. La forme exec est recommandée pour CMD et ENTRYPOINT afin que le processus reçoive correctement les signaux (p. 30-31)." },
      { title: "Cache et contexte", text: "Chaque instruction crée une couche. Si une couche change, les suivantes sont reconstruites. Copiez d'abord package*.json, lancez npm ci, puis copiez le code afin de préserver le cache des dépendances. Le contexte est le dossier envoyé au démon ; .dockerignore peut exclure node_modules, .git et *.log (p. 27, 32)." },
      { title: "ARG et ENV", text: "ARG existe uniquement pendant la construction. ENV est présente dans l'image et les conteneurs qui en découlent, et peut être surchargée avec -e. Ni ARG ni ENV ne convient à un secret : la valeur reste lisible dans l'historique de l'image (p. 36-37)." }
    ]
  },
  {
    id: "compose",
    title: "3. Docker Compose",
    pages: "pages 42 à 53",
    summary: "Décrire une stack de plusieurs conteneurs dans un fichier YAML.",
    blocks: [
      { title: "Rôle de Compose", text: "Compose décrit plusieurs conteneurs, leurs réseaux et leurs volumes dans un fichier YAML, puis les démarre ensemble. docker compose up -d construit si nécessaire, crée le réseau et rend la main (p. 43-45)." },
      { title: "Anatomie de compose.yaml", text: "services liste les conteneurs et chaque clé devient le nom du service sur le réseau. image vient du registre ; build construit depuis un Dockerfile. volumes et networks se déclarent à la racine puis se référencent. L'ancienne clé version n'a plus d'effet et l'indentation YAML se fait avec des espaces (p. 44-46)." },
      { title: "Ports, variables et secrets", text: "ports est l'équivalent de -p et se lit hôte:conteneur. environment est l'équivalent de -e. Les mots de passe doivent venir d'un fichier .env non versionné et être référencés avec ${DB_PASSWORD}, jamais écrits en dur dans compose.yaml (p. 47)." },
      { title: "Volumes et cycle de vie", text: "Un bind mount comme ./html:/var/www/html est idéal en développement. Un volume nommé, déclaré à la racine, convient aux données d'une base et survit à docker compose down. En revanche docker compose down -v supprime les volumes nommés et leurs données (p. 48)." },
      { title: "Réseau et résilience", text: "Compose crée un réseau privé et les services se joignent par leur nom, par exemple DB_HOST=db. depends_on fixe l'ordre de démarrage mais n'attend pas toujours que le service soit prêt ; condition: service_healthy permet d'attendre un état de santé. restart peut valoir no, on-failure, always ou unless-stopped (p. 49-50)." }
    ]
  }
];
