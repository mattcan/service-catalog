# API Catalog

This is an API for a service catalog that supports a page for viewing,
filtering, and adding services. The structure is based on the @nestjs typescript
template.

## Setup

Prerequisites:

* Node 20 (`fnm` and `nvm` are supported)
* Docker Compose

1. Clone
    ```sh
    git clone https://github.com/mattcan/service-catalog.git matthewcantelon-svc-catalog
    cd matthewcantelon-svc-catalog
    ```
2. Install dependencies
    ```sh
    npm i
    ```
3. Setup environment
    ```sh
    cp .env.example .env
    ```
4. Start
    ```sh
    docker compose up -d && npm start
    ```

The example environment is preconfigured with credentials for local development.

## Testing

Tests can be run with `npm test`. This will execute both the unit tests and E2E
tests. E2E tests were prioritized because they validate the full request
lifecycle without mocking framework internals.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /services | list, search, sort, paginate |
| POST | /services | create |
| GET | /services/:id | fetch one (includes versions) |
| PATCH | /services/:id | update |
| DELETE | /services/:id | soft delete |
| GET | /services/:id/versions | list versions |
| POST | /services/:id/versions | create version |
| GET | /services/:id/versions/:vId | fetch one version |
| DELETE | /services/:id/versions/:vId | soft delete version |

### Service Listing query parameters

* Pagination:
    * `page` to set the current page
    * `pageSize` to set the number of items to return
    * returns the services for that page along with the following headers,
      matching the Gitlab API:
        * `x-page`
        * `x-next-page`
        * `x-prev-page`
        * `x-per-page`
        * `x-total`
        * `x-total-pages`
* Sorting:
    * `sort` which uses a Mongo-like mechanism of `+<fieldname>` for ASC and
      `-<fieldname>` for DESC
        * fields are in an allow list so only `name` and `description` can be
          used
* Filtering:
    * `search` takes a term or partial term and does an `ILIKE` match across
      `Service` `name` and `description`
        * This search is very simplistic and will not scale well for larger
          datasets, both in terms of performance and maintenance
        * In a production context, I would look towards Postgres full-text
          search or even a dedicated search system

## Data model

A `Service` is a model with a `name`, `description`, and a one-to-many
relationship with `Version`. In this API, a `Version` is a `tag` and a
`description`.

## Considerations/Trade-offs

### Security

Left off common security tools mainly to keep testing simple and reduce the
overhead of setting up the tooling. To really complete this project I would add
helmet, CORS, and CSRF configuration.

Rate limiting should be done at an infrastructure level and not at the service
level.

### Auth

Auth was prototyped using passport-http-bearer with a BearerStrategy, but was
removed before submission. A static bearer token works for a demo but is not
production-appropriate as it doesn't support token expiry, revocation, or
per-user identity. Given more time, I would implement JWT-based auth via
@nestjs/passport + passport-jwt, with a dedicated users table and a token
issuance endpoint. Authorization (e.g. scoping visibility or fine-grained RBAC)
would be enforced at the service layer using the user identity extracted from
the token. In a larger context, it would make sense to apply policies (eg Cerbos
or OPA) and have a separate Authorization service to work with.

### Database

The biggest gap is that I chose to use `synchronize: true` in the TypeORM setup.
This should absolutely be `false` and migrations should be used for all database
changes. Main reason for leaving this off is time.

There are no hard deletes in the system, which could increase query complexity.
TypeORM does a good job of masking this complexity with the `Repository`
pattern so we get the benefits of auditability while reducing the actual complexity.
The only concern going forward would be database size over the long term.

### Request Validation

I chose to use the `ValidationPipe` for request validation. The `whitelist` and
`transform` options allow for greater security by avoiding any mass-assignment
issues. These options also make the interface more secure by automatically
checking the typing and structure of requests against the schema (DTO).

## If there was more time

* Routes - using the default route as the start point for `Service`
* Auth - setting up an authorization service in Docker and applying policies
  would be more representative of an actual service
* Testing - reducing the E2E tests and looking for a few more edge cases,
  especially around search and sorting parameters
* Database - using migrations
* Security - as mentioned, the helmet + CORS + CSRF combo
* Responses - each handler is a little different, I'd like to clean them up to
  be structured more similarly
* Documentation - OpenAPI seems possible via plugin but I didn't investigate
  deeply
* Observability - structured logs, use different logging levels, and making sure
  trace IDs are available on every request
