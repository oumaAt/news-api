## Technologies

- NestJS avec typeORM
- MySQL
- Puppeteer pour le scraping des articles
- Elasticsearch pour la recherche rapide
- Redis pour le caching

## .ENV

NODE_ENV=dev
PORT=3000
DATABASE_NAME=news_db
DATABASE_PORT=3306
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
REDIS_HOST=localhost
REDIS_PORT=6379

## Project setup

```bash
$ npm install @nestjs/typeorm typeorm mysql2 dotenv @nestjs/config puppeteer class-validator class-transformer @elastic/elasticsearch redis @nestjs/swagger
```

## Run migrations

```bash
$ npm run migration:run
```

## Revert migrations

```bash
$ npm run migration:revert
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Docker Compose

### Construire et démarrer les services

```bash
$ docker-compose up --build
```

## API Documentation

La documentation complète de l'API est disponible via Swagger. Vous pouvez y accéder en utilisant l'URL suivante :
http://localhost:3000/api-docs

## Problèmes identifiés

\*\*\* Problèmes de stockage

- Taille de la base de données : Plus d'articles et de commentaires signifient une augmentation de la taille des tables, ce qui peut ralentir les requêtes si elles ne sont pas bien indexées.

- Gestion des fichiers médias : Si les articles contiennent des images ou des vidéos, leur stockage peut engendrer un problème.

\*\*\* Problèmes de performance

- Manque d'indexation( Si les bonnes colonnes ne sont pas indexées, la recherche, le tri et la jointure des données peuvent être très lents.)
- Temps de requêtes long : avec l'augmentation des articles, les requêtes peuvent devenir lentes surtout lors des recherches.
- Requêtes SQL non optimisées : les requêtes SQL complexes ou mal optimisées peuvent ralentir les performances, en particulier surtout sur bases de données de volume énorme.

## Optimisations :

J'ai essayé d'appliquer ces solutions :

- Indexation Efficace : Pour la recherche par titre, j'ai déjà utilisé un index type fulltext sur cette colonne afin d'accélérer la recherche.
  J'ai aussi opter pour la création de deux index sur la source et la date de publication puisque elles sont souvent utilisées dans le tri et le filtre.

- Utilisation d Elasticsearch : Pour les recherches d'articles par titre, auteur ou contenu, intégrez Elasticsearch. Il est conçu pour gérer des volumes de données plus importants et permet une recherche rapide.

- Pagination : Charger les articles par lots pour éviter de récupérer trop de données d’un coup.

- Cache : Utilisation de Redis pour sauvegarder les articles récents car ils sont généralement les plus consultés

Autres optimisations qu'on peut appliquer :

- Partitionnement des tables : Si la base devient très grande, partitionner par date ou source peut aider.

- Utilisation du Bucket S3 de AWS pour sauvegarder les fichiers médias, et sauvegarder seulement leurs urls dans la base de données.
- Archivage des anciens articles.

## Elasticsearch configuration

1- Verifiez que Docker est installé et en cours d’exécution
2- Dans le terminal exécuter :
docker run --name elasticsearch -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.5.0
3- vérifier que elasticsearch fonctionne bien
curl -X GET http://localhost:9200/

## Redis configuration

J'utilise Windows donc j'ai du exécuter ces commandes sur PowerShell ( en tant que Admin)
wsl --install
sudo apt update
sudo apt install redis-server
sudo service redis-server start
redis-cli
