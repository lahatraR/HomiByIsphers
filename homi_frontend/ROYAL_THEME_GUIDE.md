# 👑 Homi - Royal Digital Palace Theme

## Guide d'utilisation du Design System Royal

### 🎨 Palette de Couleurs Nobles

#### Or Royal
```css
--royal-gold: #FFD700;          /* Or principal - Boutons primaires */
--royal-gold-light: #FFF4C4;    /* Or clair - Hover states */
--royal-gold-bright: #FFED4E;   /* Or brillant - Accents */
--royal-gold-dark: #C9A400;     /* Or foncé - Bordures */
```

#### Pourpre Impérial
```css
--royal-purple: #6B3FA0;        /* Pourpre principal */
--royal-purple-dark: #4A1F70;   /* Pourpre foncé - Titres */
--royal-purple-deep: #2E1545;   /* Pourpre profond */
--royal-purple-black: #1A0D2E;  /* Pourpre noir - Backgrounds */
```

#### Bleu Royal
```css
--royal-blue: #1E40AF;          /* Bleu principal */
--royal-blue-navy: #0C1E4A;     /* Bleu marine */
--royal-blue-midnight: #050B1F; /* Bleu minuit */
```

#### Ivoire & Marbre
```css
--ivory: #FFFEF9;               /* Ivoire - Backgrounds clairs */
--marble-white: #EAE7D6;        /* Marbre blanc */
--marble-gray: #C9C5B5;         /* Marbre gris - Bordures */
```

---

## 🔘 Système de Boutons Hiérarchisé

### Niveau 1 - Primary (Actions principales)
```html
<button class="btn btn-primary">Créer une tâche</button>
<button type="submit">Sauvegarder</button>
```
**Usage:** Actions principales, soumissions de formulaires, CTAs importants

### Niveau 2 - Secondary (Actions secondaires)
```html
<button class="btn btn-secondary">Voir les détails</button>
```
**Usage:** Actions secondaires, navigation, options alternatives

### Niveau 3 - Ghost/Outline (Actions tertiaires)
```html
<button class="btn btn-ghost">Annuler</button>
<button class="btn btn-outline">En savoir plus</button>
```
**Usage:** Annulation, retour, actions moins importantes

### Variantes Spéciales
```html
<button class="btn btn-danger">Supprimer</button>   <!-- Rouge -->
<button class="btn btn-success">Valider</button>    <!-- Vert -->
<button class="btn btn-info">Information</button>   <!-- Bleu -->
```

### Tailles
```html
<button class="btn btn-primary btn-sm">Petit</button>
<button class="btn btn-primary">Normal</button>
<button class="btn btn-primary btn-lg">Grand</button>
```

### États
```html
<button class="btn btn-primary" disabled>Désactivé</button>
<button class="btn btn-icon">🔍</button> <!-- Icon only -->
```

---

## 📦 Cartes (Cards)

### Card Standard
```html
<div class="card">
  <h3>Titre de la carte</h3>
  <p>Contenu de la carte...</p>
</div>
```

### Card Royale Premium
```html
<div class="card card-royal">
  <!-- Contenu premium avec sceau royal -->
</div>
```

### Card Sombre
```html
<div class="card card-dark">
  <!-- Pour les sections sombres -->
</div>
```

### Stat Card (Dashboard)
```html
<div class="stat-card">
  <div class="stat-card-icon">📊</div>
  <div class="stat-card-value">42</div>
  <div class="stat-card-label">Tâches complétées</div>
</div>
```

### Task Card
```html
<div class="task-card">
  <div class="task-card-header">
    <div class="task-card-title">Nom de la tâche</div>
    <div class="task-card-meta">
      <span class="badge badge-gold">Urgent</span>
      <span>2h</span>
    </div>
  </div>
</div>
```

---

## 📝 Formulaires

### Form Royal
```html
<form class="form-royal">
  <h2 class="form-title">Créer un compte</h2>
  
  <div class="form-group">
    <label for="name" class="required">Nom complet</label>
    <input type="text" id="name" placeholder="Jean Dupont" />
  </div>
  
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" class="success" />
  </div>
  
  <div class="form-actions">
    <button type="submit" class="btn btn-primary">S'inscrire</button>
    <button type="button" class="btn btn-ghost">Annuler</button>
  </div>
</form>
```

### Input avec Icon
```html
<div class="input-group">
  <span class="input-group-icon">🔍</span>
  <input type="text" placeholder="Rechercher..." />
</div>
```

### États d'input
```html
<input type="text" />                      <!-- Normal -->
<input type="text" class="error" />        <!-- Erreur -->
<input type="text" class="success" />      <!-- Succès -->
<input type="text" disabled />             <!-- Désactivé -->
```

---

## 🎭 Modales

```html
<div class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h2 class="modal-title">Titre de la modale</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">
      <p>Contenu de la modale...</p>
    </div>
  </div>
</div>
```

---

## 📊 Tables

```html
<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Date</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tâche 1</td>
        <td>28/01/2026</td>
        <td><span class="badge badge-success">Complété</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🏷️ Badges

```html
<span class="badge badge-gold">Premium</span>
<span class="badge badge-royal">VIP</span>
<span class="badge badge-success">Actif</span>
<span class="badge badge-danger">Urgent</span>
<span class="badge badge-info">Info</span>
<span class="badge badge-warning">Attention</span>
```

---

## 🚨 Alertes

```html
<div class="alert alert-success">Opération réussie !</div>
<div class="alert alert-warning">Attention, vérifiez vos données.</div>
<div class="alert alert-error">Une erreur s'est produite.</div>
<div class="alert alert-info">Information importante.</div>
```

---

## 🎯 Navigation

### Navbar
```html
<nav class="navbar">
  <a href="/" class="nav-link">Accueil</a>
  <a href="/tasks" class="nav-link active">Tâches</a>
  <a href="/profile" class="nav-link">Profil</a>
</nav>
```

### Sidebar
```html
<aside class="sidebar">
  <a href="/dashboard" class="sidebar-link active">
    📊 Dashboard
  </a>
  <a href="/tasks" class="sidebar-link">
    ✅ Tâches
  </a>
</aside>
```

### Breadcrumbs
```html
<nav class="breadcrumb">
  <a href="/" class="breadcrumb-item">Accueil</a>
  <span class="breadcrumb-separator">›</span>
  <a href="/tasks" class="breadcrumb-item">Tâches</a>
  <span class="breadcrumb-separator">›</span>
  <span class="breadcrumb-item active">Détails</span>
</nav>
```

---

## 📑 Tabs

```html
<div class="tabs">
  <button class="tab active">Général</button>
  <button class="tab">Paramètres</button>
  <button class="tab">Notifications</button>
</div>
```

---

## 📈 Progress Bar

```html
<div class="progress-bar">
  <div class="progress-bar-fill" style="width: 65%;"></div>
</div>
```

---

## 📄 Pagination

```html
<div class="pagination">
  <button class="pagination-btn" disabled>‹</button>
  <button class="pagination-btn active">1</button>
  <button class="pagination-btn">2</button>
  <button class="pagination-btn">3</button>
  <button class="pagination-btn">›</button>
</div>
```

---

## 🎨 Classes Utilitaires

### Layout
```html
<div class="container">Contenu centré max 1400px</div>
<div class="container-fluid">Pleine largeur</div>

<div class="grid grid-cols-3">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>

<div class="flex flex-between">
  <div>Gauche</div>
  <div>Droite</div>
</div>
```

### Typographie
```html
<p class="text-sm">Petit texte</p>
<p class="text-lg">Grand texte</p>
<p class="font-bold">Texte gras</p>
<p class="text-center">Centré</p>
<p class="text-gold">Texte doré</p>
<p class="text-royal">Texte royal</p>
```

### Espacement
```html
<div class="space-y">Espacement vertical entre enfants</div>
<div class="space-y-lg">Grand espacement</div>
```

### Backgrounds
```html
<div class="bg-gold">Fond doré</div>
<div class="bg-royal">Fond royal</div>
<div class="bg-dark">Fond sombre</div>
```

### Ombres
```html
<div class="shadow-sm">Ombre légère</div>
<div class="shadow-md">Ombre moyenne</div>
<div class="shadow-xl">Ombre forte</div>
<div class="shadow-gold">Ombre dorée</div>
```

### Bordures
```html
<div class="rounded-lg">Coins arrondis</div>
<div class="border-gold">Bordure dorée</div>
```

### Animations
```html
<div class="animate-fade-in">Apparition en fondu</div>
<div class="animate-shimmer">Effet brillant</div>
<div class="animate-float">Flottement</div>
<div class="hover-lift">Lift au hover</div>
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### Classes responsives
```html
<div class="hide-mobile">Caché sur mobile</div>
<div class="show-mobile">Visible uniquement sur mobile</div>
```

### Grid responsive auto
```html
<div class="grid grid-cols-4">
  <!-- 4 colonnes desktop, 2 tablet, 1 mobile -->
</div>
```

### Boutons pleine largeur mobile
```html
<div class="btn-group btn-group-mobile-full">
  <button class="btn btn-primary">Bouton 1</button>
  <button class="btn btn-secondary">Bouton 2</button>
</div>
```

---

## 🎯 Best Practices

### 1. Hiérarchie des Boutons
- **Primary:** 1 par écran (action principale)
- **Secondary:** 2-3 maximum
- **Ghost:** Actions d'annulation/retour

### 2. Contraste
- Texte foncé sur fond clair
- Texte clair sur fond foncé
- Ratio de contraste minimum 4.5:1

### 3. Touch Targets
- Minimum 44x44px pour mobile
- Espacement suffisant entre éléments cliquables

### 4. Animations
- Durée max 400ms
- Désactivées avec `prefers-reduced-motion`

### 5. Accessibilité
- Labels sur tous les inputs
- Focus visible avec outline doré
- Alt text sur images
- Sémantique HTML correcte

---

## 🎭 Exemples de Pages Complètes

### Dashboard
```html
<div class="page-royal">
  <div class="hero-royal">
    <h1 class="hero-title">Bienvenue, Votre Majesté</h1>
    <p class="hero-subtitle">Gérez votre royaume numérique</p>
  </div>
  
  <div class="dashboard-grid">
    <div class="stat-card">
      <div class="stat-card-icon">✅</div>
      <div class="stat-card-value">42</div>
      <div class="stat-card-label">Tâches complétées</div>
    </div>
    <!-- Plus de stat cards... -->
  </div>
</div>
```

### Page de connexion
```html
<div class="page-royal">
  <div class="container">
    <form class="form-royal">
      <h2 class="form-title">Connexion Royale</h2>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="votre@email.com" />
      </div>
      
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input type="password" id="password" />
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary btn-lg">
          Se connecter
        </button>
      </div>
    </form>
  </div>
</div>
```

---

## 🎨 Personnalisation

### Modifier les couleurs
Éditez les variables CSS dans `index.css` :

```css
:root {
  --royal-gold: #VOTRE_COULEUR;
  --royal-purple: #VOTRE_COULEUR;
  /* etc... */
}
```

### Modifier les espacements
```css
:root {
  --spacing-md: 1.5rem; /* au lieu de 1rem */
}
```

### Ajouter des animations custom
```css
@keyframes mon-animation {
  /* ... */
}

.ma-classe {
  animation: mon-animation 1s ease-in-out;
}
```

---

## 📚 Support & Ressources

- **Palette de couleurs:** Inspirée des palais royaux européens
- **Typographie:** Cinzel (titres), Inter (corps)
- **Icons:** Utilisez des émojis ou intégrez Font Awesome / Heroicons
- **Responsive:** Mobile-first approach avec clamp()

---

**Version:** 2.0  
**Date:** Janvier 2026  
**Thème:** Royal Digital Palace  
**Créé pour:** Homi - Application de gestion de tâches à domicile

👑 **"Une interface digne d'un roi"**
