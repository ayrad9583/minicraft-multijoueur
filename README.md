# Mini Craft Multijoueur

Version multijoueur de **Mini Craft** (monde en blocs façon Minecraft dans le navigateur).

## Fonctionnalités multijoueur

- **Même seed** de monde pour tous les joueurs d’une salle
- **Blocs partagés** : poser / casser est synchronisé en temps réel
- **Positions** des autres joueurs (avatars bleus)
- **Chat** partagé (touche `T`)
- Mode **Solo** toujours disponible

## Lancer en local

```bash
cd mini-craft-mp
npm install
npm start
```

Ouvre http://localhost:3000

1. Choisis **Multijoueur** (bouton Solo / Multijoueur)
2. Entre un **pseudo** et une **salle** (ex. `default` ou `amis`)
3. Clique **Jouer**

Tous les joueurs dans la **même salle** partagent le monde.

## Déployer sur Render (via GitHub)

### 1. Pousser sur GitHub

```bash
cd mini-craft-mp
git init
git add .
git commit -m "Mini Craft multiplayer"
git branch -M main
git remote add origin https://github.com/TON_USER/mini-craft-mp.git
git push -u origin main
```

### 2. Créer un service sur Render

1. Va sur [https://render.com](https://render.com) → **New** → **Web Service**
2. Connecte le dépôt GitHub `mini-craft-mp`
3. Réglages :
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance** : Free (ou plus)
4. **Create Web Service**

Render donne une URL du type `https://mini-craft-mp.onrender.com`.

Partage cette URL : les joueurs ouvrent le site, activent **Multijoueur**, mettent la même **salle**, et jouent ensemble.

### Notes Render (plan gratuit)

- Le service s’endort après ~15 min d’inactivité (premier chargement un peu long).
- L’état du monde (blocs posés) est **en mémoire** : un redémarrage du serveur réinitialise les modifications (le terrain généré reste le même seed jusqu’au prochain redémarrage serveur).

## Structure

```
mini-craft-mp/
  package.json
  server.js          # Express + Socket.io
  public/
    index.html       # Jeu + client multijoueur
  README.md
```

## Limites actuelles

- Pas de persistance disque du monde (redémarrage = blocs custom perdus)
- Inventaire / mode / dimension restent locaux
- Pas de combat PvP ni sync des mobs
- Un seul processus serveur (OK pour quelques joueurs)

Tu peux étendre le serveur (Mongo/Redis, auth, etc.) selon tes besoins.
