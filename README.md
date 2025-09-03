# MiniAP - Minimal ActivityPub Server

A lightweight ActivityPub server implementation built with Node.js and TypeScript, designed for decentralized social networking.

## Features

- **ActivityPub Protocol Support**: Core ActivityPub activities (Create, Update, Delete, Like, Announce)
- **User Management**: Actor creation and profile management
- **Federation**: Inbox/Outbox activity processing for federated communication
- **Notes**: Create, read, update, and delete notes/posts
- **Social Features**: Following, followers, likes, and reposts (announces)
- **Thread Support**: Reply chains and conversation context
- **SQLite Database**: Lightweight, file-based data storage

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bmordue/miniap.git
   cd miniap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` (or the port specified in the `PORT` environment variable).

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

**Note**: Currently, many tests are skipped and need to be fixed. This is a known issue tracked in our roadmap.

### Building

```bash
npm run build
```

### Project Structure

```
src/
├── server.ts              # Main Express server and route definitions
├── types.ts               # ActivityPub type definitions
└── services/
    ├── activityService.ts    # Handle Like, Announce, Undo activities
    ├── collectionService.ts  # Manage outbox collections
    ├── dbService.ts          # Database operations and schema
    ├── inboxService.ts       # Process incoming activities
    ├── noteService.ts        # CRUD operations for notes
    ├── userService.ts        # User/Actor management
    └── ...
```

## API Endpoints

### Core ActivityPub Endpoints

- `GET /users/:username` - Get user/actor profile
- `GET /users/:username/followers` - Get followers collection
- `GET /users/:username/following` - Get following collection  
- `GET /users/:username/outbox` - Get user's outbox
- `POST /users/:username/inbox` - Receive activities (federation)
- `POST /users/:username/outbox` - Create new activities

### Notes/Posts

- `GET /users/:username/notes/1` - Get a specific note
- `POST /users/:username/outbox` - Create a new note
- `PUT /users/:username/notes/:noteId` - Update a note
- `DELETE /users/:username/notes/:noteId` - Delete a note

### Social Activities

- `POST /users/:username/likes` - Like an object
- `POST /users/:username/announces` - Announce/Repost an object
- `POST /users/:username/undo` - Undo a previous activity

### Additional Features

- `GET /api/v1/statuses/:id/context` - Get thread context
- `POST /api/v1/statuses/:id/reply` - Reply to a status

## Configuration

Currently, configuration is mostly hardcoded. See the [Architecture Assessment](ARCHITECTURE_ASSESSMENT.md) for planned improvements to externalize configuration.

### Database

The application uses SQLite with the database file located at `../activitypub.db` relative to the project root. The database schema is automatically initialized from `src/services/schema.sql`.

## Known Issues & Roadmap

This project is actively being improved. Key areas being addressed:

### Critical Issues
- Most tests are currently skipped (53 out of 65)
- Database connections are created per request (inefficient)
- Missing HTTP signatures for proper federation security
- No environment-based configuration

### Planned Improvements
- Route extraction and dependency injection
- Proper connection pooling
- Input validation and security headers
- Comprehensive test coverage

See [ROADMAP.md](ROADMAP.md) and [ARCHITECTURE_ASSESSMENT.md](ARCHITECTURE_ASSESSMENT.md) for detailed improvement plans.

## Contributing

We welcome contributions! Key areas where help is needed:

1. **Testing**: Un-skip and fix existing tests
2. **Documentation**: API documentation and guides
3. **Federation**: HTTP signatures implementation
4. **Performance**: Database optimization

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Build the project: `npm run build`
6. Submit a pull request

### Code Style

- TypeScript with strict type checking
- Consistent naming conventions
- Add tests for new functionality
- Follow existing architectural patterns

## License

This project is licensed under the ISC License.

## ActivityPub Resources

- [ActivityPub Specification](https://www.w3.org/TR/activitypub/)
- [ActivityStreams 2.0](https://www.w3.org/TR/activitystreams-core/)
- [ActivityPub Primer](https://github.com/tootsuite/documentation/blob/master/Running-Mastodon/Tuning.md)

## Support

For questions, issues, or contributions, please use the GitHub issue tracker.