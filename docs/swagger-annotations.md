# Annotations Swagger et build

La documentation de l'API (`/docs`, `/swagger`) est générée par `adonis-autoswagger`
à partir des annotations des contrôleurs. Le `Dockerfile` du backend lance
`node ace docs:generate` : **une annotation invalide fait échouer le build de l'image,
donc le déploiement**, alors que `yarn typecheck`, `yarn lint`, `yarn build` et
`yarn test` ne signalent rien. Symptôme typique : la PR est verte, le déploiement
échoue, et l'API continue de servir l'ancienne image (les nouvelles routes répondent 404).

## Le piège principal : `null` dans un exemple

`adonis-autoswagger` lit les exemples avec son propre parseur, pas `JSON.parse`. Sur
toute valeur de `typeof === 'object'`, il appelle `Object.keys(value)`. Un
`"maxHistoryDays": null` dans un `@responseBody` lève donc
`TypeError: Cannot convert undefined or null to object`.

- **Aucun `null` dans un exemple** : décris le cas dans `@description`, ou omets la clé.
- Méfie-toi aussi des virgules dans une valeur texte.

La route `/swagger` utilise le même parseur : une annotation cassée fait aussi tomber
`/docs` et le serveur MCP, qui génère ses outils depuis ce spec.

## Avant de pousser

```bash
cd backend
node ace docs:generate   # silencieux = OK
```

La CI lance la même commande sur chaque PR. `swagger.json` et `swagger.yml` sont
versionnés et changent à chaque génération : committe-les avec la modification.
