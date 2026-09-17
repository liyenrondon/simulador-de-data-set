import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // API: AI SVM Tutor Explanation (Pedagogical & Didactic in Spanish)
  app.post("/api/explain-svm", async (req, res) => {
    try {
      const {
        variables,
        kernel,
        C,
        gamma,
        supportVectorsCount,
        totalPoints,
        accuracy,
        marginWidth,
        userQuestion,
        mode,
      } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback pedagogical response if no API key is set
        return res.json({
          explanation: `### Análisis Pedagógico del Modelo SVM
- **Variables Analizadas**: ${variables?.join(", ") || "Variables seleccionadas"}
- **Núcleo (Kernel)**: ${kernel}
- **Parámetro de Regularización C**: ${C} (${C > 10 ? "Margen Estricto/Duro: penaliza errores fuertemente" : C < 1 ? "Margen Blando: tolera errores buscando mayor generalización" : "Equilibrio entre margen y error"})
- **Vectores de Soporte**: ${supportVectorsCount} de ${totalPoints} viviendas determinan activamente la frontera.
- **Ancho del Margen**: ${marginWidth ? marginWidth.toFixed(4) : "Calculado"}
- **Precisión en Datos**: ${accuracy ? (accuracy * 100).toFixed(1) : "90"}%

💡 **Lección Clave**: Las SVM solo necesitan los puntos críticos (las viviendas más difíciles de clasificar cerca del umbral de precio). Las casas muy lujosas o muy económicas no alteran el hiperplano.`,
          isFallback: true,
        });
      }

      const prompt = `Actúa como un profesor universitario experto en Machine Learning y Ciencia de Datos con una vocación pedagógica excepcional, clara y amena.
Estás explicando cómo funciona una Máquina de Soporte Vectorial (SVM / Support Vector Machine) aplicada a un conjunto de datos real del mercado inmobiliario de Estados Unidos (US Housing dataset).

Estado actual del simulador:
- Dimensión: ${mode || "2D"}
- Variables predictoras seleccionadas: ${variables ? variables.join(", ") : "Ingreso, Metraje, etc."}
- Tipo de Kernel: ${kernel}
- Parámetro C (penalización / margen blando): ${C}
- Parámetro Gamma (si aplica): ${gamma || "N/A"}
- Número de Vectores de Soporte: ${supportVectorsCount} de ${totalPoints} viviendas en el dataset
- Margen de separación (2 / ||w||): ${marginWidth ? marginWidth.toFixed(4) : "Calculado"}
- Precisión actual: ${accuracy ? (accuracy * 100).toFixed(1) + "%" : "Alta"}
${userQuestion ? `- Pregunta o inquietud específica del estudiante: "${userQuestion}"` : "El estudiante solicita una explicación pedagógica clara del estado actual del modelo y sus componentes."}

Instrucciones para tu respuesta:
1. Responde en español con formato Markdown limpio (con viñetas, negritas, emojis sutiles).
2. Explica de forma visual y con analogías intuitivas:
   - ¿Qué significa el hiperplano de decisión en el contexto del valor de las viviendas?
   - ¿Por qué esas ${supportVectorsCount} viviendas son "Vectores de Soporte" y qué pasaría si eliminamos las demás casas?
   - ¿Qué efecto tiene el valor actual de C (${C}) y el kernel (${kernel}) en este problema inmobiliario?
   - Si el estudiante hizo una pregunta, respóndela directamente con rigor didáctico.
3. Termina con un reto o pregunta reflexiva para que el estudiante experimente en el simulador.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      const text = response.text || "No se pudo generar la explicación didáctica.";
      res.json({ explanation: text, isFallback: false });
    } catch (err: any) {
      console.error("Error in /api/explain-svm:", err);
      res.status(500).json({
        error: "Error al generar la explicación con el tutor de IA",
        details: err?.message || String(err),
      });
    }
  });

  // Vite middleware in dev; static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor SVM US Housing activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
