# Secret Santa Generator

Application web moderne pour générer automatiquement les attributions de Secret Santa avec gestion des exclusions.

![React](https://img.shields.io/badge/React-18.x-blue)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)
![License](https://img.shields.io/badge/license-MIT-green)

## Fonctionnalités

- **Import Excel** : Chargez vos participants et exclusions depuis un fichier Excel
- **Gestion manuelle** : Ajoutez/supprimez participants et exclusions via l'interface
- **Onglets organisés** : Interface claire avec onglets séparés pour participants et exclusions
- **Génération automatique** : Algorithme intelligent qui respecte toutes les contraintes
- **Export Excel** : Téléchargez les résultats au format Excel
- **Interface moderne** : Design responsive et convivial

## Prérequis

- **Node.js** version 20.19+ ou 22.12+ ([Télécharger](https://nodejs.org/))
- **npm** (inclus avec Node.js)
- **Git** ([Télécharger](https://git-scm.com/))

## Installation sur un nouveau poste

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/secret-santa.git
cd secret-santa
```

### 2. Installer les dépendances

```bash
# Installer toutes les dépendances listées dans package.json
npm install
```

Cette commande va :
- Créer le dossier `node_modules/`
- Générer automatiquement `package-lock.json`
- Installer React, Vite, et toutes les bibliothèques nécessaires

### 3. Lancer l'application en développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Scripts disponibles

```bash
# Développement (avec hot-reload)
npm run dev

# Build pour production
npm run build

# Prévisualiser le build de production
npm run preview

# Linter (vérifier le code)
npm run lint
```

## Utilisation avec Docker

### Construire l'image

```bash
docker build -t secret-santa .
```

### Lancer le conteneur

```bash
docker run -d -p 8080:80 --name secret-santa-app secret-santa
```

Accédez à l'application sur `http://localhost:8080`

### Commandes Docker utiles

```bash
# Arrêter le conteneur
docker stop secret-santa-app

# Redémarrer
docker start secret-santa-app

# Voir les logs
docker logs secret-santa-app

# Supprimer le conteneur
docker rm secret-santa-app

# Supprimer l'image
docker rmi secret-santa
```

## Structure du projet

```
secret-santa/
├── src/
│   ├── App.jsx           # Composant principal
│   ├── main.jsx          # Point d'entrée
│   └── App.css           # Styles globaux
├── public/               # Fichiers statiques
├── index.html            # Template HTML
├── package.json          # Dépendances du projet
├── Dockerfile            # Configuration Docker
├── nginx.conf            # Configuration Nginx
├── .dockerignore         # Fichiers ignorés par Docker
└── README.md             # Ce fichier
```

## Format du fichier Excel

### Onglet 1 - Participants

| Nom    |
|--------|
| Alice  |
| Bob    |
| Claire |
| David  |

### Onglet 2 - Exclusions

| Donneur | Ne peut pas offrir à |
|---------|---------------------|
| Alice   | Bob                 |
| Bob     | Alice               |
| Claire  | David               |

## Utilisation

1. **Importer un fichier Excel** ou ajouter des participants manuellement
2. **Définir les exclusions** (couples, famille, etc.)
3. **Générer le Secret Santa** en un clic
4. **Télécharger les résultats** au format Excel

## Technologies utilisées

- **React 18** - Framework JavaScript
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS (via CDN)
- **SheetJS (xlsx)** - Lecture/écriture Excel
- **Lucide React** - Icônes modernes
- **Nginx** - Serveur web (pour Docker)

## Résolution de problèmes

### Erreur "Node.js version required"

Mettez à jour Node.js vers la version 20.19+ ou 22.12+ :

```bash
# Avec nvm
nvm install --lts
nvm use --lts
```

### Erreur "Cannot find module"

Réinstallez les dépendances :

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur SSL lors de l'accès Docker

Utilisez **HTTP** et non HTTPS :
- ✅ `http://localhost:8080`
- ❌ `https://localhost:8080`

### Impossible de générer un Secret Santa valide

Si l'algorithme ne trouve pas de solution après 1000 tentatives :
- Réduisez le nombre d'exclusions
- Vérifiez qu'il n'y a pas de conflits circulaires
- Assurez-vous d'avoir au moins 3 participants

## License

MIT License - Libre d'utilisation et modification

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## Support

Si ce projet vous a été utile, n'hésitez pas à lui donner une étoile sur GitHub !

---

**Joyeuses fêtes ! 🎄🎁**