# 📊 Analyse des Statistiques Minecraft

Ce dossier contient tous les outils et notebooks pour analyser les statistiques de connexions aux serveurs Minecraft.

## 🚀 Installation et Configuration

### 1. Installation des dépendances

```bash
# Installer les dépendances Python
pip install -r requirements.txt

# Ou avec conda
conda install --file requirements.txt
```

### 2. Préparation des données

Vous avez deux options pour charger vos données :

#### Option A : Utiliser le script d'extraction (recommandé)
```bash
# Extraire les données du dump SQL
python extract_data.py
```

#### Option B : Connexion directe à la base de données
Si vous avez accès à la base SQLite directement, modifiez le chemin dans le notebook.

## 📓 Utilisation du Notebook

### 1. Lancer Jupyter
```bash
jupyter notebook
```

### 2. Ouvrir le notebook
Ouvrez `minecraft_stats_analysis.ipynb` dans Jupyter.

### 3. Exécuter l'analyse
Le notebook est structuré en sections :

- **Configuration** : Import des bibliothèques
- **Chargement des données** : Connexion et extraction
- **Nettoyage** : Préparation des données
- **Analyse générale** : Statistiques descriptives
- **Visualisations temporelles** : Évolution dans le temps
- **Analyse par serveur** : Performance individuelle
- **Analyse par catégorie** : Comparaisons par type
- **Croissance** : Tendances de développement
- **Patterns** : Comportements récurrents
- **Stabilité** : Fiabilité des serveurs
- **Corrélations** : Relations entre variables
- **Résumé** : Insights et recommandations

## 📊 Types d'Analyses Disponibles

### 1. **Analyse Temporelle**
- Évolution du nombre de joueurs dans le temps
- Patterns horaires et quotidiens
- Saisonnalité et tendances

### 2. **Performance des Serveurs**
- Classement des serveurs les plus populaires
- Taux d'occupation et capacité
- Stabilité et variabilité

### 3. **Analyse par Catégorie**
- Comparaison entre types de serveurs
- Popularité des différentes catégories
- Croissance par segment

### 4. **Croissance et Développement**
- Tendances de croissance hebdomadaire/mensuelle
- Serveurs en expansion vs déclin
- Prévisions basées sur les tendances

### 5. **Insights Comportementaux**
- Heures de pointe et creuses
- Patterns de connexion par jour
- Corrélations entre variables

## 📈 Visualisations Incluses

- **Graphiques temporels** : Évolution des connexions
- **Heatmaps** : Patterns horaires et quotidiens
- **Graphiques en barres** : Comparaisons de performance
- **Graphiques circulaires** : Répartition par catégorie
- **Nuages de points** : Analyse de stabilité
- **Matrices de corrélation** : Relations entre variables

## 📋 Structure des Données

### Tables Principales

#### `server_stats`
- `id` : Identifiant unique
- `server_id` : Référence au serveur
- `player_count` : Nombre de joueurs connectés
- `max_count` : Capacité maximale
- `created_at` : Timestamp de la mesure

#### `servers`
- `id` : Identifiant unique
- `name` : Nom du serveur
- `address` : Adresse IP/domaine
- `version` : Version Minecraft
- `motd` : Message du jour

#### `server_growth_stats`
- `server_id` : Référence au serveur
- `weekly_growth` : Croissance hebdomadaire (%)
- `monthly_growth` : Croissance mensuelle (%)
- `last_week_average` : Moyenne de la semaine dernière

#### `categories`
- `id` : Identifiant unique
- `name` : Nom de la catégorie

## 🎯 Insights Principaux

Le notebook génère automatiquement :

1. **Statistiques générales** : Moyennes, médianes, écarts-types
2. **Tendances temporelles** : Évolution des connexions
3. **Performance comparative** : Classements et benchmarks
4. **Patterns comportementaux** : Heures de pointe, saisonnalité
5. **Recommandations** : Actions à entreprendre

## 📤 Export des Résultats

Le notebook exporte automatiquement :

- **Rapport Excel** : 5 onglets avec analyses détaillées
- **Graphiques interactifs** : Visualisations Plotly
- **Statistiques résumées** : Métriques clés

## 🔧 Personnalisation

### Modifier les analyses
Vous pouvez facilement adapter le notebook :

1. **Changer les périodes** : Modifier les filtres de dates
2. **Ajouter des métriques** : Créer de nouveaux calculs
3. **Personnaliser les graphiques** : Ajuster les styles et couleurs
4. **Intégrer d'autres données** : Ajouter de nouvelles sources

### Variables configurables
```python
# Période d'analyse
START_DATE = "2024-01-01"
END_DATE = "2024-12-31"

# Seuils de performance
MIN_PLAYERS = 10
MAX_OCCUPATION = 95

# Catégories d'intérêt
INTERESTING_CATEGORIES = ["Survival", "PvP", "Creative"]
```

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de connexion à la base**
   - Vérifiez le chemin vers le fichier SQLite
   - Assurez-vous que les permissions sont correctes

2. **Données manquantes**
   - Le notebook gère automatiquement les valeurs NULL
   - Vérifiez la qualité des données source

3. **Mémoire insuffisante**
   - Réduisez la période d'analyse
   - Utilisez l'échantillonnage pour les gros datasets

### Support
Pour toute question ou problème, consultez :
- La documentation des bibliothèques utilisées
- Les commentaires dans le code
- Les logs d'erreur détaillés

## 📚 Ressources Additionnelles

- **Pandas** : Manipulation des données
- **Plotly** : Visualisations interactives
- **Seaborn** : Graphiques statistiques
- **NumPy** : Calculs numériques

---

**Note** : Ce notebook est conçu pour être exécuté de manière autonome et génère des insights immédiatement exploitables pour optimiser vos serveurs Minecraft. 