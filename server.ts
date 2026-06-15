import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { DISEASE_METADATA } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Tomato Leaf Engine" });
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      // Check if Python FastAPI server is running on port 8000 (DenseNet h5 model)
      try {
        console.log("Checking if Python FastAPI backend is available on port 8000...");
        
        let binaryBuffer: Buffer;
        let mimeType = "image/jpeg";
        let rawBase64 = image;
        if (image.includes(";base64,")) {
          const parts = image.split(";base64,");
          rawBase64 = parts[1];
          mimeType = parts[0].split(":")[1] || "image/jpeg";
        }
        binaryBuffer = Buffer.from(rawBase64, 'base64');
        
        const formData = new FormData();
        const blob = new Blob([binaryBuffer], { type: mimeType });
        formData.append('file', blob, 'leaf.jpg');
        
        const fastApiResponse = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          body: formData
        });
        
        if (fastApiResponse.ok) {
          const fastApiData = (await fastApiResponse.json()) as any;
          console.log("✅ Diagnostic completed offline via FastAPI local DenseNet.h5 model!");
          
          const matchedKey = Object.keys(DISEASE_METADATA).find(
            key => key.toLowerCase() === (fastApiData.disease_name || "").toLowerCase()
          ) ?? "Healthy";
          
          const metadata = DISEASE_METADATA[matchedKey];
          const isMock = fastApiData.is_mock === true;
          
          return res.json({
            diseaseName: matchedKey,
            confidence: fastApiData.confidence_score ?? 0.8,
            recommendedProduct: metadata.product,
            naturalTreatment: metadata.treatment,
            explanation: isMock
              ? `Offline Diagnosis: Model unavailable – showing safe default. For accurate results please ensure the ML model is properly loaded.`
              : `Offline Diagnosis: Classified using the local Python DenseNet neural network.`,
            cause: metadata.cause,
            productUrl: metadata.productUrl,
            isMock,
          });
        }
      } catch (fastApiErr: any) {
        console.log("ℹ️ FastAPI local server not active/available on port 8000. Proceeding with primary pipelines...");
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.ENGINE_API_KEY;
      if (!apiKey) {
        console.warn("⚠️ API keys missing on backend. Falling back to frontend heuristic pipelines...");
        return res.json({ error: "API_KEY_MISSING", fallback: true });
      }

      const ai = new GoogleGenAI({ apiKey });
      const validDiseases = Object.keys(DISEASE_METADATA).join(", ");
      
      const prompt = `You are a professional Tomato Crop Pathologist.
      Task: Identify the disease in the uploaded tomato leaf image.
      
      Instructions:
      1. First, verify if the image contains a tomato plant leaf. If not, return "Not a Tomato Leaf".
      2. Analyze visual symptoms: spots, blights, molds, stippling, curling, or mosaic patterns.
      3. Choose the MOST accurate category from this list only: [${validDiseases}].
      4. Provide a confidence score between 0.0 and 1.0.
      5. Provide a brief visual reasoning for your diagnosis.
    
      Return the response strictly as valid JSON:
      {
        "diseaseName": "Matched Name from List",
        "confidence": 0.95,
        "reasoning": "Observed concentric rings with yellow halos on older leaves..."
      }`;

      // Extract raw base64 data regardless of prefix
      let rawBase64 = image;
      let mimeType = "image/jpeg";
      
      if (image.includes(";base64,")) {
        const parts = image.split(";base64,");
        rawBase64 = parts[1];
        mimeType = parts[0].split(":")[1] || "image/jpeg";
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: rawBase64,
                mimeType: mimeType,
              },
            },
          ],
        },
        config: {
          responseMimeType: "application/json"
        },
      });

      const responseText = response.text || "{}";
      const analysis = JSON.parse(responseText);
      
      const matchedKey = Object.keys(DISEASE_METADATA).find(
        key => key.toLowerCase() === (analysis.diseaseName || "").toLowerCase()
      ) ?? "Healthy";

      const metadata = DISEASE_METADATA[matchedKey];
      const isNotTomato = matchedKey === "Not a Tomato Leaf";
      
      return res.json({
        diseaseName: matchedKey,
        confidence: isNotTomato ? 0.0 : (analysis.confidence ?? 0.8),
        recommendedProduct: metadata.product,
        naturalTreatment: metadata.treatment,
        explanation: analysis.reasoning || metadata.explanation,
        cause: metadata.cause,
        productUrl: metadata.productUrl
      });
      
    } catch (err: any) {
      console.error("Backend diagnosis error:", err);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: err.message, fallback: true });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
