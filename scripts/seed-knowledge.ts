/**
 * Knowledge Base Seeding Script
 * 
 * Reads markdown files from the content directory and uploads them
 * to Upstash Vector for RAG (Retrieval Augmented Generation).
 * 
 * Usage: npx tsx scripts/seed-knowledge.ts
 */

import { Index } from "@upstash/vector";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Initialize Upstash Vector client
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

const CONTENT_DIR = path.join(__dirname, "../src/lib/knowledge/content");

interface KnowledgeChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    sourceUrl: string;
    category: string;
    content: string;
    dataDate: string;
  };
}

/**
 * Split markdown into chunks by heading
 */
function splitByHeading(content: string, source: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const lines = content.split("\n");
  
  let currentHeading = "";
  let currentContent: string[] = [];
  let chunkIndex = 0;
  
  // Determine category from filename
  const category = source.replace(".md", "");

  // Extract data date from content if present
  const dataDateMatch = content.match(/Data Date:\s*(\d{4}(?:-\d{4})?)/);
  const dataDate = dataDateMatch ? dataDateMatch[1] : "2024";

  // Extract source URL from content if present
  const sourceUrlMatch = content.match(/Source URL:\s*(https?:\/\/[^\s]+)/);
  const sourceUrl = sourceUrlMatch ? sourceUrlMatch[1] : "";

  for (const line of lines) {
    // Check for heading
    if (line.startsWith("## ")) {
      // Save previous chunk if exists
      if (currentContent.length > 0 && currentHeading) {
        const chunkContent = currentContent.join("\n").trim();
        if (chunkContent.length > 50) { // Skip very small chunks
          chunks.push({
            id: `${category}-${chunkIndex}`,
            content: chunkContent,
            metadata: {
              source,
              sourceUrl,
              category,
              content: chunkContent,
              dataDate,
            },
          });
          chunkIndex++;
        }
      }
      currentHeading = line.replace("## ", "").trim();
      currentContent = [line];
    } else if (line.startsWith("# ")) {
      // Main heading - include as context
      currentHeading = line.replace("# ", "").trim();
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  // Don't forget last chunk
  if (currentContent.length > 0 && currentHeading) {
    const chunkContent = currentContent.join("\n").trim();
    if (chunkContent.length > 50) {
      chunks.push({
        id: `${category}-${chunkIndex}`,
        content: chunkContent,
        metadata: {
          source,
          sourceUrl,
          category,
          content: chunkContent,
          dataDate,
        },
      });
    }
  }

  return chunks;
}

/**
 * Main seeding function
 */
async function seedKnowledgeBase() {
  console.log("🥭 Starting knowledge base seeding...\n");

  // Check for required env vars
  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    throw new Error("Missing Upstash Vector credentials in .env.local");
  }

  // Read all markdown files
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  console.log(`📁 Found ${files.length} content files: ${files.join(", ")}\n`);

  let totalChunks = 0;
  const allChunks: KnowledgeChunk[] = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const chunks = splitByHeading(content, file);
    
    console.log(`  📄 ${file}: ${chunks.length} chunks`);
    allChunks.push(...chunks);
    totalChunks += chunks.length;
  }

  console.log(`\n📊 Total chunks to upload: ${totalChunks}\n`);

  // Clear existing data (optional - comment out to append)
  console.log("🗑️  Clearing existing data...");
  try {
    await vectorIndex.reset();
    console.log("   Done.\n");
  } catch {
    console.log("   No existing data to clear.\n");
  }

  // Upload in batches
  const BATCH_SIZE = 10;
  const batches = [];
  
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    batches.push(allChunks.slice(i, i + BATCH_SIZE));
  }

  console.log(`📤 Uploading ${batches.length} batches...\n`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    // Prepare vectors for upsert
    const vectors = batch.map((chunk) => ({
      id: chunk.id,
      data: chunk.content, // Text will be embedded by Upstash
      metadata: chunk.metadata,
    }));

    try {
      await vectorIndex.upsert(vectors);
      console.log(`   Batch ${i + 1}/${batches.length} uploaded (${batch.length} chunks)`);
    } catch (error) {
      console.error(`   ❌ Error uploading batch ${i + 1}:`, error);
      throw error;
    }

    // Small delay to respect rate limits
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log("\n✅ Knowledge base seeding complete!");
  console.log(`   Total chunks indexed: ${totalChunks}`);
  
  // Verify by running a test query
  console.log("\n🔍 Running verification query...");
  const testResults = await vectorIndex.query({
    data: "typical brazilian mango",
    topK: 3,
    includeMetadata: true,
  });
  
  console.log(`   Found ${testResults.length} results for test query`);
  if (testResults.length > 0) {
    console.log(`   Top result score: ${testResults[0].score?.toFixed(4)}`);
    console.log(`   Source: ${(testResults[0].metadata as { source?: string })?.source || 'unknown'}`);
  }
}

// Run the script
seedKnowledgeBase()
  .then(() => {
    console.log("\n🎉 All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
