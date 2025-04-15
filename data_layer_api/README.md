# Data Layer API

The data layer handles the storage and retrieval of data. It is responsible for the following:

1. Listening at endpoints in order to perform all relevant database operations
2. Embedding any data that should be vectorized

## Telemetry

Metrics and Traces can be found out grafana ui located at localhost:3000 

In general we meter and trace all http requests. We also track user_ids when available on request (which is most critical when users post data). This is used to track API usage and recognize any possible bad actors.
- Metrics are avaliable via prometheus data source in grafana.
- Traces are available via tempo data source in grafana.

## Database Operations

#### Query Courses

For a query vector $q$ and a course vector $c$, the ranking score is calculated as:

$$\text{Score} = w_s \times \text{Similarity}(q, c) + (1 - w_s) \times \text{NormalizedEffectiveRating}(c)$$

Where:

- $w_s$ is the similarity weight (default: 0.85)
- $\text{Similarity}(q, c)$ is the cosine similarity between query and course vectors (range: 0-1)
- $\text{NormalizedEffectiveRating}(c)$ is calculated based on the source of ratings:

For courses with internal reviews:

$$\text{NormalizedEffectiveRating}_{\text{internal}}(c) = \frac{\text{internalRating}}{5} \times \frac{\log(1 + \text{internalNumRatings})}{\log(1 + \text{maxInternalNumRatings})}$$

For courses with only external reviews:

$$\text{NormalizedEffectiveRating}_{\text{external}}(c) = \frac{\text{externalRating}}{5} \times \frac{\log(1 + \text{externalNumRatings})}{\log(1 + \text{maxExternalNumRatings})}$$

This formula balances the semantic relevance of search results with their quality and popularity, ensuring that users find both relevant and reputable courses. By normalizing internal and external ratings separately, we prevent skewing of results due to differences in rating volumes between platforms. We make use of the following parameters to fine tune the formula as we learn more about the data and user preferences.

#### Parameters

- **threshold**: Minimum similarity score for inclusion in results (default: 0.5)
- **limit**: Maximum number of results to return (default: 10)
- **similarity_weight**: Weight given to vector similarity vs. rating (default: 0.85)

## Flags

The Data Layer API can be configured through various environment variables that modify its behavior. These flags can be set in the `docker-compose.yml` file or provided at runtime.

### Database Configuration

- **DB_IMPLEMENTATION**: Selects the database backend to use
  - `sqlite` (default): Uses SQLite with vector extensions for local development
  - `postgres`: Uses PostgreSQL with pgvector for production deployments

- **DB_PATH**: Path to the SQLite database file (only used when `DB_IMPLEMENTATION=sqlite`)
  - Default: `/server/data_layer_api/database/vectors.db`
  - Not likely to be changed as we move away from our proof of concept SQLite test database and towards testing a more robust PostgreSQL database

#### PostgreSQL Connection Parameters

When using PostgreSQL (`DB_IMPLEMENTATION=postgres`), the following connection parameters are defaulted:

- **DB_HOST**: PostgreSQL server hostname (default: `postgres`)
- **DB_PORT**: PostgreSQL server port (default: `5432`)
- **DB_USER**: PostgreSQL username (default: `postgres`)
- **DB_PASSWORD**: PostgreSQL password (default: `postgres`)
- **DB_NAME**: PostgreSQL database name (default: `course_data_etl`)


##### Example Usage

To start the service with SQLite (also defualt behavior so can be omitted):
```bash
DB_IMPLEMENTATION=sqlite docker-compose up data_layer_api
```

To start the service with PostgreSQL:
```bash
DB_IMPLEMENTATION=postgres docker-compose up data_layer_api
```