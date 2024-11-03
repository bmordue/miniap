import { Pool } from 'pg';
import { Actor, OrderedCollection, Note } from './types';

const pool = new Pool({
  user: 'your_db_user',
  host: 'localhost',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
});

export const getActorFromDB = async (username: string): Promise<Actor | null> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM actors WHERE preferredUsername = $1', [username]);
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0];
  } finally {
    client.release();
  }
};

export const getFollowersFromDB = async (username: string): Promise<OrderedCollection | null> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM followers WHERE username = $1', [username]);
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0];
  } finally {
    client.release();
  }
};

export const getFollowingFromDB = async (username: string): Promise<OrderedCollection | null> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM following WHERE username = $1', [username]);
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0];
  } finally {
    client.release();
  }
};

export const getOutboxFromDB = async (username: string): Promise<OrderedCollection | null> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM outbox WHERE username = $1', [username]);
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0];
  } finally {
    client.release();
  }
};

export const getNoteFromDB = async (username: string): Promise<Note | null> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM notes WHERE username = $1', [username]);
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0];
  } finally {
    client.release();
  }
};

export const addFollowerToDB = async (username: string, follower: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('INSERT INTO followers (username, follower) VALUES ($1, $2)', [username, follower]);
  } finally {
    client.release();
  }
};
