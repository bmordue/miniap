# Contributing to MiniAP

Thank you for your interest in contributing to MiniAP! This document provides guidelines and information for contributors.

## Getting Started

### Development Environment Setup

1. **Prerequisites**:
   - Node.js v18 or higher
   - npm (comes with Node.js)
   - Git
   - A text editor or IDE (VS Code recommended)

2. **Fork and Clone**:
   ```bash
   # Fork the repository on GitHub, then:
   git clone https://github.com/your-username/miniap.git
   cd miniap
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Verify Setup**:
   ```bash
   # Build the project
   npm run build
   
   # Run tests (note: many are currently skipped)
   npm test
   
   # Start the development server
   npm start
   ```

### Project Architecture

MiniAP is a TypeScript Node.js application implementing the ActivityPub protocol. Key components:

- **`src/server.ts`**: Main Express server with route definitions
- **`src/services/`**: Business logic services (database, activities, users, etc.)
- **`src/types.ts`**: ActivityPub type definitions
- **SQLite Database**: File-based storage with schema in `src/services/schema.sql`

## How to Contribute

### Priority Areas

We're actively looking for contributions in these areas:

1. **🔴 Critical - Testing Infrastructure**
   - Un-skip and fix existing tests (53 out of 65 are currently skipped)
   - Add integration tests for API endpoints
   - Improve test isolation and setup

2. **🟡 High Priority - Architecture**
   - Extract routes from monolithic `server.ts`
   - Implement proper dependency injection
   - Fix database connection management (currently creates new connection per request)

3. **🟡 High Priority - Security**
   - Implement HTTP signatures for ActivityPub federation
   - Add input validation middleware
   - Implement proper authentication system

4. **🟢 Medium Priority - Documentation**
   - API endpoint documentation
   - Code comments and inline documentation
   - Usage examples and tutorials

### Types of Contributions

- **Bug Fixes**: Fix existing issues or failing tests
- **Features**: Implement new ActivityPub features or improve existing ones
- **Documentation**: Improve README, add API docs, create guides
- **Testing**: Add tests, fix skipped tests, improve test coverage
- **Refactoring**: Improve code structure and maintainability
- **Performance**: Optimize database queries, caching, etc.

## Development Workflow

### 1. Before You Start

- Check existing issues to avoid duplicate work
- Create an issue to discuss major changes
- Review the [Architecture Assessment](ARCHITECTURE_ASSESSMENT.md) for improvement priorities

### 2. Making Changes

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number
   ```

2. **Write code**:
   - Follow existing code style and patterns
   - Add TypeScript types for new functionality
   - Include tests for new features (when possible)
   - Keep changes focused and atomic

3. **Test your changes**:
   ```bash
   # Run existing tests
   npm test
   
   # Build to check for TypeScript errors
   npm run build
   
   # Start the server to test manually
   npm start
   ```

### 3. Submitting Changes

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**:
   - Use the GitHub interface to create a PR
   - Provide a clear description of changes
   - Reference any related issues
   - Include testing instructions if applicable

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript with strict type checking
- Prefer `const` over `let`, avoid `var`
- Use async/await over Promises where possible
- Follow existing naming conventions:
  - Files: camelCase (e.g., `userService.ts`)
  - Classes: PascalCase (e.g., `DbService`)
  - Functions/variables: camelCase
  - Constants: UPPER_CASE

### Code Organization

- Keep functions small and focused
- Separate concerns (database, business logic, HTTP handling)
- Use meaningful variable and function names
- Add comments for complex business logic
- Follow existing patterns in the codebase

### Database

- Use parameterized queries to prevent SQL injection
- Follow the existing schema patterns
- Consider migration scripts for schema changes

## Testing Guidelines

### Current Testing Issues

⚠️ **Important**: Most tests are currently skipped due to setup issues. Fixing these is a high priority!

### When Adding Tests

1. **Unit Tests**: Test individual functions and services
2. **Integration Tests**: Test API endpoints end-to-end (when infrastructure allows)
3. **Use proper test isolation**: Don't rely on shared state
4. **Mock external dependencies**: Database, HTTP calls, etc.

### Test Structure

```typescript
describe('ServiceName', () => {
  beforeEach(() => {
    // Setup for each test
  });

  it('should do something specific', async () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = await serviceMethod(input);
    
    // Assert
    expect(result).toEqual(expectedOutput);
  });
});
```

## Issue and PR Guidelines

### Creating Issues

- Use clear, descriptive titles
- Include steps to reproduce for bugs
- Add relevant labels
- Reference related issues or PRs
- Provide context about your environment

### Pull Request Guidelines

- Keep PRs focused on a single concern
- Include a clear description of changes
- Reference related issues
- Include testing instructions
- Update documentation if needed
- Ensure CI checks pass

### Review Process

- All PRs require review before merging
- Address feedback promptly and professionally
- Keep discussions focused on the code
- Be open to suggestions and improvements

## Working with ActivityPub

### Key Concepts

- **Actors**: Users or services (identified by URLs)
- **Activities**: Actions like Create, Update, Delete, Like, Follow
- **Objects**: Things that activities act upon (Notes, Images, etc.)
- **Collections**: Ordered lists of items (inbox, outbox, followers, etc.)

### Testing Federation

- Use ActivityPub test servers for integration testing
- Validate JSON-LD format for activities
- Test HTTP signature verification
- Check compliance with ActivityPub spec

## Resources

### Project Resources

- [Architecture Assessment](ARCHITECTURE_ASSESSMENT.md) - Current state and improvement plans
- [Roadmap](ROADMAP.md) - Planned features and technical debt

### ActivityPub Resources

- [ActivityPub Specification](https://www.w3.org/TR/activitypub/)
- [ActivityStreams 2.0](https://www.w3.org/TR/activitystreams-core/)
- [Mastodon API Documentation](https://docs.joinmastodon.org/api/) - For API compatibility

### Development Tools

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## Getting Help

- **GitHub Issues**: For bugs, feature requests, and questions
- **Discussions**: Use GitHub Discussions for general questions
- **Code Review**: Request review on your PRs for feedback

## Recognition

Contributors are recognized in several ways:

- Git commit history preserves your contributions
- Significant contributors may be added to a CONTRIBUTORS.md file
- We appreciate all contributions, no matter how small!

Thank you for contributing to MiniAP! 🎉