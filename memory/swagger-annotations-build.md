---
name: swagger-annotations-build
description: Une annotation @responseBody invalide casse le build Docker du backend — jamais de `null` dans les exemples
metadata:
  type: project
---

Le `Dockerfile` du backend lance `node ace docs:generate` (étape « Générer la documentation »).
**Une annotation Swagger invalide y fait échouer le build de l'image**, donc le déploiement — sans
que `yarn typecheck`, `yarn lint`, `yarn build` ni `yarn test` n'aient rien signalé. Symptôme vu le
31/07/2026 : deux pushes sur `staging`, GitHub Actions « Build and Deploy Backend » en échec après
~50 s, et l'API de staging continue de servir l'ancienne image (les nouvelles routes répondent 404
alors que le code est bien sur `origin/staging`).

**Le piège concret** : `adonis-autoswagger` parse les exemples avec son propre parseur, pas
`JSON.parse`. Sur toute valeur de `typeof === 'object'` il appelle `Object.keys(value)` — donc
`"maxHistoryDays": null` dans un `@responseBody` lève `TypeError: Cannot convert undefined or null
to object`. **Aucun `null` dans un exemple** : décrire le cas en prose dans `@description`, ou
omettre la clé de l'exemple. Se méfier aussi des virgules dans une valeur texte.

La route `/swagger` utilise le même parseur : une annotation cassée fait aussi tomber `/docs` et le
serveur MCP (qui génère ses tools depuis le spec, cf. [[mcp-server]]).

**Réflexe avant de pousser un changement d'annotations** : `node ace docs:generate` (silencieux =
OK). Une étape « Generate API docs » a été ajoutée à `ci.yml` pour que l'erreur tombe sur la PR
plutôt qu'au déploiement. `swagger.json` / `swagger.yml` sont versionnés et changent à chaque
génération : les committer avec la modification.
