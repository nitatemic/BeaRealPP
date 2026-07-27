# 📸 BeReal Profile Picture Downloader

Une application web 100% client (React, Vite, Tailwind CSS) permettant de rechercher, d'afficher en grand format et de télécharger la photo de profil de n'importe quel utilisateur BeReal.

A 100% client-side web application built with React, Vite, and Tailwind CSS to search, enlarge, and download any BeReal user's profile picture.

---

## ✨ Fonctionnalités / Features

- 🇫🇷 **Détection automatique de la langue** : Français si le navigateur est configuré en français, Anglais par défaut pour toutes les autres langues. Un bouton de bascule manuel (FR/EN) est également disponible dans l'en-tête.
- 🇬🇧 **Automatic Language Detection**: Defaults to French if the browser is in French, and English for any other browser language. A manual language toggle (FR/EN) is also available in the header.
- ⚡ **100% Client-side (No backend required)** : Scraping HTML en temps réel via des proxys CORS gratuits et parsing `DOMParser` (`og:image`, `twitter:image`, JSON-LD, etc.).
- 💾 **Téléchargement direct (Blob)** : Force le téléchargement de l'image au format `.jpg` sur l'appareil sans ouvrir de nouvel onglet.
- 🔍 **Agrandissement Lightbox** : Cliquez sur la photo de profil pour l'afficher en grand écran.
- 🕒 **Historique de recherche** : Conserve les derniers pseudos recherchés dans le stockage local (`localStorage`).
- 🎨 **Design épuré et réactif** : Interface sobre, moderne et adaptée aux mobiles.

---

## 🛠️ Stack Technique / Tech Stack

- **Framework** : [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **CSS / Styling** : [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons** : [Lucide React](https://lucide.dev/)
- **Animations** : `canvas-confetti`

---

## 🚀 Installation & Lancement local

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- `npm` ou `yarn`

### Commandes

```bash
# 1. Cloner ou ouvrir le dossier du projet
cd BeaRealPPDownie

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement local
npm run dev
```

Ouvrez ensuite votre navigateur sur `http://localhost:5173`.

---

## 📦 Build de Production

Pour générer le bundle de production optimisé :

```bash
npm run build
```

Les fichiers statiques seront générés dans le dossier `dist/` et prêts à être hébergés sur Vercel, Netlify, GitHub Pages ou n'importe quel serveur web statique.

---

## ⚖️ Avertissement / Disclaimer

Ce projet est un outil indépendant développé à des fins éducatives. Il n'est pas affilié, associé, autorisé ou approuvé par BeReal Inc. de quelque manière que ce soit.

This project is an independent tool developed for educational purposes. It is not affiliated, associated, authorized, endorsed by, or in any way officially connected with BeReal Inc.
