import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Inicializa el cliente con la variable de entorno
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `Eres un experto extractor de datos de hardware informático. Analiza el contenido entregado y extrae:
1. El modelo exacto del equipo (laptop, monitor, impresora, etc.)
2. El número de serie si está presente
3. Tu nivel de confianza del 0 al 100
4. Una breve explicación de tu análisis (máx 100 chars)

REGLAS IMPORTANTES:
- Si el input es una URL, analiza su ruta para deducir el equipo. NO devuelvas la URL.
- Limpia el modelo: Marca + Línea + Referencia (ej: "Lenovo ThinkPad T14").
- Busca números de serie bajo S/N, Serial, SN.
- Si no puedes identificar un modelo ni serie, retorna null para ambos.

Responde ESTRICTAMENTE con JSON válido con esta estructura exacta, sin backticks:
{"modelo": "string o null", "numero_serie": "string o null", "confianza": 90, "razonamiento": "string"}`;

const ENHANCE_PROMPT = `Eres un asistente de gestión de inventario de hardware TI. 
Tu tarea es convertir una nota breve en una descripción profesional y clara para el registro de un equipo.

REGLAS:
- Máximo 200 caracteres en la respuesta
- Usa lenguaje técnico-administrativo formal en español
- No inventes datos que no estén en la nota original, solo expándela
- Si la nota menciona una acción (ingreso, mantención, baja, préstamo), inclúyela con contexto
- Responde ÚNICAMENTE con el texto de la descripción, sin comillas ni formato extra`;

export async function POST(request: Request) {
  try {
    const { mode, payload } = await request.json();

    if (!mode || !payload) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // ── Modo enhance: mejora una descripción corta ──────────
    if (mode === 'enhance') {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: ENHANCE_PROMPT,
        generationConfig: { temperature: 0.4 }
      });
      const result = await model.generateContent(`Nota original: "${payload}"`);
      const text = result.response.text().trim().replace(/^["']|["']$/g, '');
      return NextResponse.json({ descripcion: text.substring(0, 200) });
    }

    // ── Modos QR / OCR ──────────────────────────────────────
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    let result;

    // Ejecutamos la petición dependiendo de si es texto (QR) o imagen (OCR)
    if (mode === 'qr') {
      result = await model.generateContent(`Texto escaneado: ${payload}`);
    } else if (mode === 'ocr') {
      const imageParts = [
        {
          inlineData: {
            data: payload,
            mimeType: 'image/jpeg'
          }
        }
      ];
      result = await model.generateContent(["Analiza esta imagen y extrae los datos solicitados en formato JSON.", ...imageParts]);
    } else {
      return NextResponse.json({ error: 'Modo no soportado' }, { status: 400 });
    }

    const response = await result.response;
    const text = response.text();

    // Doble validación para limpiar el JSON por si Gemini añade formato Markdown
    const cleanJSON = text.replace(/```json|```/g, '').trim();

    return NextResponse.json(JSON.parse(cleanJSON));

  } catch (error) {
    console.error('Error procesando scan con Gemini:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}