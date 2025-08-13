# Project Improvement Roadmap

This document outlines key areas for improving the MiniAP project. While a feature roadmap exists, this document focuses on foundational improvements to enhance stability, maintainability, and scalability. Addressing these areas will accelerate future feature development.

## 1. Address Technical Debt and Improve Code Quality

The highest priority is to improve the overall health of the codebase.

- **Enable and Fix Tests:** The existing test suites are currently skipped. We must:
    - Un-skip all existing tests.
    - Fix any failing tests to establish a reliable baseline.
    - Increase test coverage for critical services like `userService` and `inboxService`.
    - Enforce a policy that all new code must be accompanied by tests.

- **Refactor `server.ts`:** The main `server.ts` file has become a monolith containing all route definitions.
    - **Action:** Create a `src/routes` directory.
    - **Action:** Move related routes into separate files (e.g., `src/routes/users.ts`, `src/routes/notes.ts`).
    - **Action:** Use an Express `Router` in each file and import them into `server.ts`.

- **Implement Efficient Database Connection Management:** The current implementation creates a new database connection for nearly every HTTP request, which is highly inefficient.
    - **Action:** Refactor `DbService` to be a singleton that manages a single, persistent database connection for the application lifecycle.
    - **Action:** Pass the `DbService` instance to services and route handlers through dependency injection.

- **Externalize Configuration:** Hardcoded values, especially the database file path, make the application inflexible.
    - **Action:** Introduce a `.env` file for environment-specific configuration.
    - **Action:** Use a library like `dotenv` to load these variables.
    - **Action:** Move the database path, port, and other configurable values to the `.env` file.

## 2. Strengthen the Database and Data Model

The current schema is a good start but needs to be more robust to support a federated system.

- **Improve the Database Schema:**
    - **Action:** Create a generic `activities` table to store all incoming and outgoing activities (e.g., `Like`, `Announce`, `Create`). This provides a clear audit trail and simplifies activity processing.
    - **Action:** Re-evaluate the `followers` and `following` tables. A single `relationships` table might be more efficient for tracking follows, blocks, and mutes.

- **Introduce Database Migrations:** There is currently no mechanism for managing schema changes.
    - **Action:** Integrate a simple database migration tool (e.g., a lightweight, custom script or a library like `db-migrate`).
    - **Action:** Create an initial migration based on the current `schema.sql`. All future schema changes must be made through new migration files.

## 3. Prioritize Foundational ActivityPub Features

While the existing roadmap is comprehensive, we should prioritize features that are essential for basic federation and a solid user experience.

- **Implement HTTP Signatures:** Proper signing of all outgoing activities is critical for security and federation. This should be the top feature priority.
- **Implement WebFinger:** Actor discovery is a fundamental part of ActivityPub. Implementing the WebFinger protocol is essential for users to be found by other instances.
- **Job Queue for Federation:** Sending activities to followers should be handled by a background job queue (e.g., using a simple in-memory queue for now, or a more robust solution like BullMQ later). _Note: In-memory queues are not suitable for production, as jobs will be lost on application restart. For production deployments, use a persistent queue solution (such as BullMQ with Redis or another durable queue system) to ensure reliability._ This will prevent blocking the main request thread and handle delivery failures gracefully.

## 4. Improve Project Documentation

Good documentation is essential for maintainability and attracting new contributors.

- **Developer Guide:** Create a `CONTRIBUTING.md` with instructions on:
    - How to set up the development environment.
    - How to run the application and the test suite.
    - Coding conventions.
- **API Documentation:** Add a simple `API.md` file that documents the available API endpoints, expected request/response formats, and authentication requirements.
