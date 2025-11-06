# Améliorations de la carte d'équipements

## ✅ Améliorations implémentées

### 1. **Popup amélioré** 
- ❌ **Supprimé** : Status (open/closed/maintenance) - information inutile
- ✅ **Ajouté** : Miniature de photo de l'équipement
- ✅ **Amélioré** : Mise en avant du type de gaz
- ✅ **Ajouté** : Icône de localisation pour le bâtiment

**Fonctionnement** :
1. Clic sur un équipement → popup instantané avec infos de base
2. Chargement automatique de la photo depuis l'API
3. Si photo disponible → affichage d'une miniature (h-32)
4. Si pas de photo → popup simplifié sans image

### 2. **Légende des gaz**
- ✅ Position : Bas gauche de la carte
- ✅ Style : Transparent avec backdrop blur
- ✅ Contenu : Tous les types de gaz avec leurs couleurs
- ✅ Affichage : Uniquement quand des équipements sont visibles

**Types de gaz inclus** :
- Oxygen (O₂) - Rouge (#ef4444)
- Medical Air - Violet (#9333ea)
- Vacuum - Vert (#22c55e)
- Nitrogen (N₂) - Bleu (#3b82f6)
- Nitrous Oxide (N₂O) - Orange (#f97316)
- Carbon Dioxide (CO₂) - Gris (#6b7280)
- Compressed Air - Violet clair (#8b5cf6)

### 3. **Identification rapide**
- ✅ Couleurs distinctives pour chaque type de gaz
- ✅ Légende toujours visible
- ✅ Type de gaz mis en évidence dans le popup

## 🔮 Fonctionnalités futures

### Highlight des bâtiments impactés
**Concept** : En cliquant sur une vanne, mettre en évidence les bâtiments qui seraient impactés par sa fermeture.

**Approche suggérée** :
1. **Données requises** :
   - Graph de dépendances : quelle vanne alimente quels bâtiments
   - Table de relations : `valve_impacts` ou via les connexions

2. **Implémentation** :
   ```typescript
   // Dans le popup click handler
   if (props.nodeType === 'valve') {
     // Récupérer les bâtiments impactés
     const impactedBuildings = await fetch(
       `/api/synoptics/valves/${props.elementId}/impacts`
     );
     
     // Ajouter des layers Mapbox pour les highlights
     map.addLayer({
       id: 'impacted-buildings',
       type: 'fill',
       source: 'buildings',
       paint: {
         'fill-color': '#ff0000',
         'fill-opacity': 0.3
       },
       filter: ['in', ['get', 'id'], ...impactedBuildingIds]
     });
   }
   ```

3. **UI** :
   - Badge dans le popup : "⚠️ 3 buildings impacted"
   - Overlay transparent rouge sur les bâtiments
   - Animation de pulse pour attirer l'attention

## 📊 Composants créés

- `MapGasLegend.tsx` - Légende des types de gaz
- `EquipmentMapView.tsx` - Vue carte améliorée avec popup photo

## 🎨 UX améliorée

**Avant** :
- Status inutile très visible
- Pas de contexte visuel sur les gaz
- Popup basique texte seulement

**Après** :
- Identification rapide par couleur + légende
- Photo de l'équipement pour confirmation visuelle
- Information pertinente (gaz, type, localisation)
- Pas d'information superflue

## 🔄 Compatibilité

- ✅ Fonctionne avec les filtres existants
- ✅ Pas de réinitialisation de la carte
- ✅ Chargement asynchrone des photos
- ✅ Fallback graceful si pas de photo
