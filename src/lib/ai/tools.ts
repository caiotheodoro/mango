import { tool } from "ai";
import { z } from "zod";
import { searchKnowledge } from "@/lib/knowledge/search";
import { getImages } from "@/lib/images/unsplash";

// Tool definitions for the chatbot
export const chatTools = {
  searchKnowledge: tool({
    description: "Search the Brazilian mango knowledge base for factual information. Use this for any factual question about mangos, varieties, nutrition, seasons, exports, etc.",
    inputSchema: z.object({
      query: z.string().describe("The search query - be specific about what information you need"),
      category: z.enum(["varieties", "nutrition", "seasons", "exports", "cultivation", "general"])
        .optional()
        .describe("Optional category to narrow down the search"),
    }),
    execute: async ({ query, category }) => {
      const results = await searchKnowledge(query, { category });
      return {
        success: true,
        results: results.map((r) => ({
          content: r.content,
          source: r.metadata.source,
          sourceUrl: r.metadata.sourceUrl || null,
          confidence: r.score > 0.8 ? "HIGH" : r.score > 0.5 ? "MEDIUM" : "LOW",
          score: r.score,
          dataDate: r.metadata.dataDate || "2024",
        })),
        totalResults: results.length,
      };
    },
  }),

  getMangoImages: tool({
    description:
      "Call this when the user asks to see, show, or get images, pictures, or photos of mangos. Returns mango images that are displayed in the chat. Use generic mango search only.",
    inputSchema: z.object({
      count: z.number().min(1).max(5).default(3).describe("Number of images to return"),
    }),
    inputExamples: [{ input: { count: 3 } }],
    execute: async ({ count = 3 }) => {
      // Simple, reliable search - just "mangoes"
      const query = "mangoes fresh fruit";
      
      const images = await getImages(query, count);
      
      // Filter out any non-mango images by checking alt descriptions
      const mangoImages = images.filter(img => {
        const alt = (img.alt_description || "").toLowerCase();
        // Exclude if it mentions other fruits
        const excludedFruits = ["jackfruit", "passion fruit", "papaya", "pineapple", "durian", "banana", "coconut", "avocado"];
        return !excludedFruits.some(fruit => alt.includes(fruit));
      });
      
      return {
        success: true,
        images: mangoImages.map((img) => ({
          url: img.urls.regular,
          thumbnail: img.urls.thumb,
          alt: img.alt_description || "Fresh mango",
          credit: {
            name: img.user.name,
            link: img.user.links.html,
          },
        })),
      };
    },
  }),

  compareVarieties: tool({
    description: "Compare two or more Brazilian mango varieties. Use when user asks to compare mangos.",
    inputSchema: z.object({
      varieties: z.array(z.string()).min(2).max(4).describe("List of mango varieties to compare"),
    }),
    execute: async ({ varieties }) => {
      // Search for each variety
      const comparisons = await Promise.all(
        varieties.map(async (variety) => {
          const results = await searchKnowledge(`${variety} mango characteristics`, {
            category: "varieties",
          });
          return {
            variety,
            data: results[0] || null,
          };
        })
      );

      return {
        success: true,
        comparisons: comparisons.map((c) => ({
          variety: c.variety,
          info: c.data?.content || "No data found for this variety",
          source: c.data?.metadata.source || null,
          sourceUrl: c.data?.metadata.sourceUrl || null,
        })),
      };
    },
  }),
};

export type ChatTools = typeof chatTools;
