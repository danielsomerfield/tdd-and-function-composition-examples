# An example of simple Dependency Injection with Typescript

# Instructions

## Running the unit tests

    npm test:unit

## Running the integration tests

    npm test:integration

# Points of interest

- Each typescript module defines a type with its own dependent functions.
- At the top level of the DI module the index.ts does the binding
- Rather than constructors for components, typescript modules expose a factory function that takes dependencies and
  returns either a "configured" function or component.