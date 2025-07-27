import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import type { Database as SqliteDatabase } from 'sqlite';

dotenv.config();

const DB_PATH = process.env.SQLITE_DB_PATH || './social_media_data.db';

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
    Post_Date: string; // Keep as string for YYYY-MM-DD
}


let dbInstance: SqliteDatabase | null = null;

export async function connectDb(): Promise<void> {
    if (dbInstance) {
        console.log('Database already connected.');
        return;
    }
    try {
        dbInstance = await open({
            filename: DB_PATH,
            driver: sqlite3.Database,
        });
        console.log(`Connected to SQLite database: ${DB_PATH}`);
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1); // Exit process if cannot connect to DB
    }
}

export async function disconnectDb(): Promise<void> {
    if (dbInstance) {
        try {
            await dbInstance.close();
            console.log('Disconnected from SQLite database.');
            dbInstance = null;
        } catch (err) {
            console.error('Database disconnection error:', err);
        }
    }
}

export async function createPostsTable(): Promise<void> {
    if (!dbInstance) {
        throw new Error('Database not connected. Call connectDb() first.');
    }
    try {
        await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        Post_ID TEXT PRIMARY KEY,
        Platform TEXT,
        Hashtag TEXT,
        Content_Type TEXT,
        Region TEXT,
        Views INTEGER,
        Likes INTEGER,
        Shares INTEGER,
        Comments INTEGER,
        Engagement_Level TEXT,
        Post_Date TEXT
      );
    `);
        console.log('Posts table ensured.');
    } catch (err) {
        console.error('Error creating posts table:', err);
    }
}

export async function insertPost(post: SocialMediaPost): Promise<void> {
    if (!dbInstance) {
        throw new Error('Database not connected. Call connectDb() first.');
    }
    const query = `
    INSERT INTO posts (
      Post_ID, Platform, Hashtag, Content_Type, Region, Views, Likes, Shares, Comments, Engagement_Level, Post_Date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(Post_ID) DO NOTHING;
  `;
    const values = [
        post.Post_ID,
        post.Platform,
        post.Hashtag,
        post.Content_Type,
        post.Region,
        post.Views,
        post.Likes,
        post.Shares,
        post.Comments,
        post.Engagement_Level,
        post.Post_Date,
    ];
    try {
        await dbInstance.run(query, values);
        // console.log('Inserted post:', post.Post_ID);
    } catch (err) {
        console.error(`Error inserting post ${post.Post_ID}:`, err);
    }
}

export async function checkPostTable(): Promise<boolean> {
    if (!dbInstance) {
        throw new Error('Database not connected. Call connectDb() first.');
    }
    try {
        const tableResult = await dbInstance.get<{ name: string }>(
            `SELECT name FROM sqlite_master WHERE type='table' AND name='posts';`
        );
        if (!tableResult) {
            return false;
        }
        const countResult = await dbInstance.get<{ count: number }>(
            `SELECT COUNT(*) as count FROM posts;`
        );
        console.log('count of table', countResult)
        return (countResult?.count ?? 0) > 0;
    } catch (err) {
        console.error('Error checking posts table existence or content:', err);
        return false;
    }
}

export async function getAllPosts(): Promise<SocialMediaPost[]> {
    if (!dbInstance) {
        throw new Error('Database not connected. Call connectDb() first.');
    }
    try {
        const rows = await dbInstance.all<SocialMediaPost[]>('SELECT * FROM posts');
        return rows;
    } catch (err) {
        console.error('Error fetching posts:', err);
        return [];
    }
}

export async function getAllQueriedPosts(searchQueryForPosts: string): Promise<SocialMediaPost[]> {
    if (!dbInstance) {
        throw new Error('Database not connected. Call connectDb() first.');
    }
    try {
        console.log('the', searchQueryForPosts)
        const rows = await dbInstance.all<SocialMediaPost[]>(searchQueryForPosts);
        return rows;
    } catch (err) {
        console.error('Error fetching posts:', err);
        return [];
    }
}