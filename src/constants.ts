export const USERNAME = 'alice';
export const DOMAIN = process.env.DOMAIN || 'localhost';
export const PORT = process.env.PORT || 3000;
export const BASE_URL = `https://${DOMAIN}/users/${USERNAME}`;
export const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017';
export const DATABASE_NAME = process.env.DATABASE_NAME || 'activitypub';
