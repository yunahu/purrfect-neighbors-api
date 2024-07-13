import "dotenv/config.js";

import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { db, connectToMySQL } from "./services/mysql.js";
import { promisify } from 'util';

// Convert __dirname to work in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = path.join(__dirname, 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

const queries = schema.split(';').map(query => query.trim()).filter(query => query.length);

const setup = async () => {
    await connectToMySQL();

    const executeQuery = promisify(db.query).bind(db);
    
    try {
        for (const query of queries) {
            await executeQuery(query);
        }

        console.log('Database setup completed');
    } catch (err) {
        console.error('Database setup failed:', err);
    } finally {
        db.end((err) => {
            if (err) {
                console.error('Error closing the database connection:', err);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

setup();
