# MiniAP API Documentation

This document describes the HTTP API endpoints available in the MiniAP ActivityPub server.

## Base Information

- **Base URL**: `http://localhost:3000` (configurable via PORT environment variable)
- **Content Type**: Most endpoints expect and return `application/activity+json` or `application/ld+json`
- **Rate Limiting**: 100 requests per 15 minutes per IP address

## Core ActivityPub Endpoints

These endpoints implement the core ActivityPub specification.

### Actor/User Management

#### Get User Profile
```
GET /users/:username
```
Returns the ActivityPub Actor object for the specified user.

**Response**: `200 OK`
```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Person",
  "id": "http://localhost:3000/users/alice",
  "preferredUsername": "alice",
  "name": "Alice Smith",
  "inbox": "http://localhost:3000/users/alice/inbox",
  "outbox": "http://localhost:3000/users/alice/outbox",
  "followers": "http://localhost:3000/users/alice/followers",
  "following": "http://localhost:3000/users/alice/following"
}
```

#### Get Followers Collection
```
GET /users/:username/followers
```
Returns the collection of actors following this user.

**Response**: `200 OK`
```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "totalItems": 42,
  "orderedItems": [
    "http://example.com/users/bob",
    "http://example.com/users/charlie"
  ]
}
```

#### Get Following Collection
```
GET /users/:username/following
```
Returns the collection of actors this user is following.

**Response**: `200 OK` (same format as followers)

### Activity Processing

#### User Inbox (Federation)
```
POST /users/:username/inbox
```
Receives activities from other ActivityPub servers (federation endpoint).

**Request Body**: ActivityPub Activity object
```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "id": "http://example.com/activities/123",
  "actor": "http://example.com/users/bob",
  "object": {
    "type": "Note",
    "id": "http://example.com/notes/456",
    "content": "Hello, world!",
    "attributedTo": "http://example.com/users/bob"
  }
}
```

**Response**: `202 Accepted` (activity queued for processing)

#### User Outbox
```
GET /users/:username/outbox
```
Returns the user's outbox collection containing their activities.

**Response**: `200 OK`
```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "totalItems": 10,
  "orderedItems": [
    {
      "type": "Create",
      "id": "http://localhost:3000/activities/123",
      "actor": "http://localhost:3000/users/alice",
      "object": {
        "type": "Note",
        "id": "http://localhost:3000/notes/456",
        "content": "My first post!"
      }
    }
  ]
}
```

```
POST /users/:username/outbox
```
Create a new activity (typically a Note).

**Request Body**:
```json
{
  "type": "Note",
  "content": "This is my new post",
  "to": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

**Response**: `201 Created` with the created activity

### Notes/Posts Management

#### Get Note
```
GET /users/:username/notes/1
```
Retrieve a specific note by the user.

**Response**: `200 OK`
```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "http://localhost:3000/users/alice/notes/1",
  "attributedTo": "http://localhost:3000/users/alice",
  "content": "This is a note",
  "published": "2023-01-01T12:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

#### Update Note
```
PUT /users/:username/notes/:noteId
```
Update an existing note.

**Request Body**: Updated Note object
**Response**: `200 OK` with updated note

#### Delete Note
```
DELETE /users/:username/notes/:noteId
```
Delete a note.

**Response**: `204 No Content`

## Social Activity Endpoints

### Likes
```
POST /users/:username/likes
```
Like an object (note, post, etc.).

**Request Body**:
```json
{
  "object": "http://example.com/notes/123"
}
```

**Response**: `201 Created` with Like activity

### Announces (Reposts/Boosts)
```
POST /users/:username/announces
```
Announce (repost/boost) an object.

**Request Body**:
```json
{
  "object": "http://example.com/notes/123"
}
```

**Response**: `201 Created` with Announce activity

### Undo Activities
```
POST /users/:username/undo
```
Undo a previous activity (unlike, unannounce, etc.).

**Request Body**:
```json
{
  "object": {
    "type": "Like",
    "id": "http://localhost:3000/activities/456"
  }
}
```

**Response**: `201 Created` with Undo activity

## Additional API Endpoints

### Thread Context
```
GET /api/v1/statuses/:id/context
```
Get the conversation context for a status/note (replies, ancestors).

**Response**: `200 OK`
```json
{
  "ancestors": [],
  "descendants": [
    {
      "id": "reply-1",
      "content": "This is a reply",
      "in_reply_to_id": "original-id"
    }
  ]
}
```

### Create Reply
```
POST /api/v1/statuses/:id/reply
```
Reply to a specific status/note.

**Request Body**:
```json
{
  "content": "This is my reply to your post"
}
```

**Response**: `201 Created` with created reply

### Activity Distribution
```
POST /users/:username/notify
```
Internal endpoint for distributing activities to followers.

**Note**: This is an internal endpoint used by the system for federation.

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
Invalid request format or missing required fields.
```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

### 404 Not Found
Requested resource does not exist.
```json
{
  "error": "Not Found",
  "message": "User not found"
}
```

### 429 Too Many Requests
Rate limit exceeded.
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later."
}
```

### 500 Internal Server Error
Server encountered an unexpected error.
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Authentication

**Current State**: No authentication is currently implemented. All endpoints are publicly accessible.

**Planned**: JWT-based authentication with user registration/login system.

## Content Types

- **Request**: `application/activity+json` or `application/ld+json`
- **Response**: `application/activity+json`

## Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: Rate limit information is not currently provided in response headers (planned improvement)

## Federation Notes

### HTTP Signatures
**Status**: Not yet implemented (critical priority)

HTTP signatures are required for proper ActivityPub federation security. All outgoing activities should be signed, and incoming activities should be verified.

### WebFinger
**Status**: Not yet implemented (planned)

WebFinger protocol support for actor discovery (e.g., finding `alice@example.com`).

## Development and Testing

### Testing Endpoints

For development, you can test endpoints using curl:

```bash
# Get user profile
curl -H "Accept: application/activity+json" http://localhost:3000/users/alice

# Create a note
curl -X POST -H "Content-Type: application/activity+json" \
     -d '{"type": "Note", "content": "Hello world"}' \
     http://localhost:3000/users/alice/outbox
```

### Database State

The API operates on data stored in SQLite. The database schema includes tables for:
- `actors` - User/actor information
- `notes` - Post/note content
- `followers` / `following` - Social relationships
- `outbox` - User activity collections

See `src/services/schema.sql` for the complete database schema.

---

**Note**: This API is under active development. Some endpoints may change, and new authentication/security features will be added. Check the project roadmap for planned improvements.