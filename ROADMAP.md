# ActivityPub Implementation Roadmap

## Phase 1: Core Social Features
### Outbox Implementation
- Add support for Create, Update, and Delete activities
- Implement proper activity distribution to followers
- Add support for public/private visibility settings
- Implement proper HTTP Signatures for outgoing activities

### Enhanced Inbox Processing
- Add support for Like, Announce (Boost), and Undo activities
- Implement threading for replies and conversations
- Add mention handling and notifications
- Implement rate limiting and abuse prevention

## Phase 2: Federation Improvements
### Actor Discovery & Interaction
- Implement WebFinger protocol support
- Add actor profile updates and management
- Implement proper HTTP caching headers
- Add support for moving accounts between instances

### Security & Authentication
- Implement OAuth for client authentication
- Add support for Blocked actors list
- Implement proper key rotation
- Add support for signed fetches
- Implement proper security headers

## Phase 3: Content & Media
### Media Handling
- Add support for image attachments
- Implement media upload endpoints
- Add support for alt text
- Implement media proxying
- Add basic media processing (thumbnails, optimization)

### Rich Content
- Add support for polls
- Implement custom emojis
- Add support for content warnings
- Implement hashtag handling

## Phase 4: Advanced Features
### Lists & Collections
- Implement Collections support
- Add support for Lists of actors
- Add Featured/Pinned posts
- Implement proper ordering and pagination

### Search & Discovery
- Add basic local search
- Implement hashtag indexing
- Add trending posts/tags
- Implement user directory

## Phase 5: Platform Features
### Moderation Tools
- Add report handling
- Implement domain blocks
- Add content filtering options
- Implement admin dashboard

### API & Client Support
- Implement a REST API for clients
- Add WebSocket support for real-time updates
- Add support for multiple client apps
- Implement proper rate limiting

## Technical Improvements (Ongoing)
- Implement proper database indexing
- Add comprehensive logging
- Implement proper job queuing
- Add metrics and monitoring
- Implement proper cache management

