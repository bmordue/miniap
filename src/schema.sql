CREATE TABLE actors (
    id TEXT PRIMARY KEY,
    preferredUsername TEXT NOT NULL,
    name TEXT NOT NULL,
    inbox TEXT NOT NULL,
    outbox TEXT NOT NULL,
    following TEXT NOT NULL,
    followers TEXT NOT NULL
);

CREATE TABLE followers (
    username TEXT NOT NULL,
    follower TEXT NOT NULL,
    PRIMARY KEY (username, follower)
);

CREATE TABLE following (
    username TEXT NOT NULL,
    following TEXT NOT NULL,
    PRIMARY KEY (username, following)
);

CREATE TABLE outbox (
    username TEXT NOT NULL,
    outbox TEXT NOT NULL,
    PRIMARY KEY (username)
);

CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    attributedTo TEXT NOT NULL,
    content TEXT NOT NULL,
    published TEXT NOT NULL,
    toActor TEXT NOT NULL,
    visibility TEXT NOT NULL
);
