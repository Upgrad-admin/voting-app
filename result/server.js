const express = require('express');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const pool = new Pool({
  user: 'postgres',
  host: 'db',
  database: 'votesdb',
  password: 'postgres',
  port: 5432,
});

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Client connected to results');
});

setInterval(async () => {
  try {
    const res = await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        voter_id VARCHAR,
        vote VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      SELECT option, COUNT(*) as count 
      FROM votes 
      GROUP BY option;
    `);
    
    const votes = { Cats: 0, Dogs: 0 };
    res.rows.forEach(row => votes[row.option] = parseInt(row.count));
    
    const total = Object.values(votes).reduce((a, b) => a + b, 0);
    const catsPct = total ? Math.round((votes.Cats / total) * 100) : 0;
    const dogsPct = total ? Math.round((votes.Dogs / total) * 100) : 0;
    
    io.emit('votesUpdate', { cats: catsPct, dogs: dogsPct, total });
  } catch (err) {
    console.error('DB Error:', err);
  }
}, 1000);

server.listen(80, () => console.log('Results app on port 80'));
