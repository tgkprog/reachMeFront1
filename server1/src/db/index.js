// src/db/index.js
const maria = require('./maria');
const sqlite = require('./sqlite');

const dbType = process.env.RUNTIME_DB;

module.exports = dbType === 'sqlite' ? sqlite : maria;
