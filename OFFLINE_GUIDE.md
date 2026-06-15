# TomatoGuard AI: Offline Diagnostic Setup

This project features a 3-tier pathological diagnostic engine. To enable the **Neural Core** (High-precision local machine learning) for offline use:

## 1. Prerequisites
- The application uses **TensorFlow.js**.
- You need a trained model in **JSON layers format** (not a single `.h5` file).
- The model should expect `[224, 224, 3]` input dimensions.

## 2. Directory Structure (Mandatory)
Vite serves static assets from the `public` folder. You MUST create the following structure in your project root:
```text
project-root/
├── public/
│   └── model/
│       ├── model.json          <-- The architecture file
│       ├── group1-shard1of1.bin <-- The weight shard
│       └── ... (other shards)
```

## 3. How to Verify Activation
1. Run the project in VS Code (`npm run dev`).
2. Open your browser and press **F12** (Developer Tools).
3. Switch to the **Console** tab.
4. Look for the message: `✅ Neural Core initialized successfully.`

## 4. Troubleshooting
- **If you see "Neural Core not found"**: Check that `public/model/model.json` exists and is accessible. Try visiting `http://localhost:3000/model/model.json` in your browser directly; if it downloads, the path is correct.
- **If you see "Heuristic Baseline active"**: This means the system is using basic color analysis because it couldn't find your ML model files.
- **Always Healthy?**: If the heuristic always says healthy, ensure your photo has good lighting and clearly visible brown or yellow spots.

