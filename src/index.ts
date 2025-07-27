// src/main.ts
import express from 'express';

import {
  connectDb,
  createPostsTable,
  insertPost,
  getAllPosts,
  getAllQueriedPosts,
  checkPostTable
} from './DB/db';
import { parse } from 'csv-parse';
import * as fs from 'fs';


// Create an Express application
const app = express();

// Add middleware to parse JSON bodies
app.use(express.json());

const port = 3000;

// This should be consistent across your db.ts and main.ts
export interface SocialMediaPost {
  Post_ID: string;
  Platform: string;
  Hashtag: string;
  Content_Type: string;
  Region: string;
  Views: number;
  Likes: number;
  Shares: number;
  Comments: number;
  Engagement_Level: string;
  Post_Date: string; // YYYY-MM-DD
}

async function readCsvFile(filePath: string): Promise<SocialMediaPost[]> {
  return new Promise((resolve, reject) => {
    const records: SocialMediaPost[] = [];
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        if (['Views', 'Likes', 'Shares', 'Comments'].includes(context.column as string)) {
          return parseInt(value, 10);
        }
        return value;
      }
    });

    const stream = fs.createReadStream(filePath);

    stream.pipe(parser);

    parser.on('readable', function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record as SocialMediaPost);
      }
    });

    parser.on('end', function () {
      resolve(records);
    });

    parser.on('error', function (err) {
      reject(err);
    });
  });
}

async function initializeDatabase() {
  await connectDb(); // Connects to SQLite DB
  await createPostsTable(); // Ensures table exists

  if (await checkPostTable() === false) {
    console.log('Post table is not available')

    // --- Import data from CSV ---
    const csvFilePath = 'src/DB/data/Cleaned_Viral_Social_Media_Trends.csv';
    try {
      const postsToImport = await readCsvFile(csvFilePath); // Await the async function!
      console.log(`Found ${postsToImport.length} posts in CSV. Importing to SQLite...`);

      let insertedCount = 0;
      for (const post of postsToImport) {
        await insertPost(post); // Insert into DB
        insertedCount++;
      }
      console.log(`Successfully imported ${insertedCount} posts.`);

    } catch (error) {
      console.error('Error reading or importing CSV data:', error);
    }
  }

  // --- Fetch and Log Data ---
  const postsFromDb = await getAllPosts();
  console.log('--- All Posts from SQLite first one ---');
  console.log(postsFromDb.slice(0, 1));
  console.log(`Total posts in DB: ${postsFromDb.length}`);

  // Don't disconnect here - keep the database connection open for the server
  console.log('Database initialization completed.');
}

var allPosts: SocialMediaPost[] = [];

app.get('/', (_req, res) => {
  res.send('Hello working 💪');
});


app.get('/allposts', (_req, res) => {
  res.json(allPosts.slice(0, 5));
});

app.post('/allquery', async (req, res) => {
  console.log('=== POST /allquery endpoint hit! ===');

  const { query } = req.body;
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query is required in request body and must be a non-empty string' });
  }
  try {
    const queriedPosts = await getAllQueriedPosts(query);
    console.log('✅ Query successful, returning', queriedPosts.length, 'posts');
    res.json(queriedPosts);
  } catch (error) {
    console.error('❌ Error fetching queried posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// simple test endpoint
app.post('/test', (req, res) => {
  console.log('=== POST /test endpoint hit! ===');
  console.log('Request body:', req.body);
  res.json({
    message: 'Test endpoint working!',
    receivedBody: req.body,
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  // Initialize database first
  await initializeDatabase();

  // allPosts = await getAllPosts();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();