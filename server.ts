import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Helper for Gemini AI instance
  const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Form Generator Endpoint
  app.post("/api/generate-form", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getAi();
      if (!ai) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured in server environment.",
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Generate a full Google Form structure based on this user prompt: "${prompt}".
Create a comprehensive form with realistic questions. Return 4 to 8 questions with realistic options and varying question types (MULTIPLE_CHOICE, CHECKBOXES, SHORT_ANSWER, PARAGRAPH, DROPDOWN, RATING, LINEAR_SCALE).
If it's a quiz, test, or assessment, set isQuiz to true, and provide points (e.g. 5 or 10) and the correct answer string for auto-grading.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              isQuiz: { type: Type.BOOLEAN },
              theme: {
                type: Type.OBJECT,
                properties: {
                  primaryColor: { type: Type.STRING },
                  fontStyle: { type: Type.STRING },
                },
                required: ["primaryColor"],
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    required: { type: Type.BOOLEAN },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    scaleMin: { type: Type.NUMBER },
                    scaleMax: { type: Type.NUMBER },
                    scaleMinLabel: { type: Type.STRING },
                    scaleMaxLabel: { type: Type.STRING },
                    points: { type: Type.NUMBER },
                    correctAnswer: { type: Type.STRING },
                  },
                  required: ["type", "title"],
                },
              },
            },
            required: ["title", "description", "questions"],
          },
        },
      });

      const jsonText = response.text || "{}";
      const formData = JSON.parse(jsonText);
      res.json(formData);
    } catch (err: any) {
      console.error("Error generating form with AI:", err);
      res.status(500).json({ error: err.message || "Failed to generate form" });
    }
  });

  // Vite Middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Google Forms App listening on http://localhost:${PORT}`);
  });
}

startServer();
