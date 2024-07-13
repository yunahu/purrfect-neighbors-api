import "dotenv/config.js";

import fs from 'fs';
import path from 'path';
import mysql from 'mysql';

// Convert __dirname to work in ES modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const schemaPath = path.join(__dirname, 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }

    console.log('Connected to MySQL');

    const queries = schema.split(';').map(query => query.trim()).filter(query => query.length);

    const executeQuery = (index) => {
        if (index >= queries.length) {
            console.log('Database setup completed');
            db.end();
            return;
        }

        db.query(queries[index], (err, results) => {
            if (err) {
                console.error(`Error executing query: ${queries[index]}`, err);
                db.end();
                return;
            }

            executeQuery(index + 1);
        });
    };

    executeQuery(0);
});
