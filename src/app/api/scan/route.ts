import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Inicializa el cliente con la variable de entorno
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `Eres un experto extractor de datos. Analiza el contenido entregado (texto de QR, código de barras o imagen) y extrae la información más relevante para registrar el elemento en un inventario:
1. Un título o nombre del elemento (modelo, nombre del producto, etc.). Si no es hardware, usa el nombre más descriptivo posible.
2. El número de serie, código identificador, o cualquier número de referencia si está presente.
3. Una descripción detallada con cualquier otro dato relevante encontrado (color, características, marca, dimensiones, etc.).
4. Una breve explicación de tu análisis (máx 100 chars).

REGLAS IMPORTANTES:
- Si el input es una URL, analiza su ruta para deducir de qué elemento se trata. NO devuelvas la URL como nombre.
- Limpia el nombre/modelo para que sea profesional y claro.
- Si no puedes identificar el elemento, retorna null para el nombre.

Responde ESTRICTAMENTE con JSON válido con esta estructura exacta, sin backticks:
{"modelo": "string o null", "numero_serie": "string o null", "descripcion": "string o null", "razonamiento": "string"}`;

const ENHANCE_PROMPT = `Eres un asistente de gestión de inventario de hardware TI. 
Tu tarea es convertir una nota breve en una descripción profesional y clara para el registro de un equipo.

REGLAS:
- Máximo 200 caracteres en la respuesta
- Usa lenguaje técnico-administrativo formal en español
- No inventes datos que no estén en la nota original, solo expándela
- Si la nota menciona una acción (ingreso, mantención, baja, préstamo), inclúyela con contexto
- Responde ÚNICAMENTE con el texto de la descripción, sin comillas ni formato extra`;

// ── Helper: clasifica el error de Gemini ───────────────────
function classifyGeminiError(error: unknown): { status: number; code: string; message: string } {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
    return { status: 429, code: 'QUOTA_EXCEEDED', message: 'Límite de uso de IA alcanzado. Intenta en unos minutos.' };
  }
  if (msg.includes('403') || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('permission')) {
    return { status: 403, code: 'AUTH_ERROR', message: 'Error de autenticación con el servicio de IA.' };
  }
  if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
    return { status: 503, code: 'NETWORK_ERROR', message: 'Sin conexión al servicio de IA. Verifica tu conexión.' };
  }
  return { status: 500, code: 'IA_ERROR', message: 'Error interno del servicio de IA.' };
}

export async function POST(request: Request) {
  // ── Validar que la API key esté configurada ────────────────
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Servicio de IA no configurado.', code: 'NO_API_KEY' },
      { status: 503 }
    );
  }

  let body: { mode?: string; payload?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const { mode, payload } = body;

  if (!mode || !payload || typeof payload !== 'string' || payload.trim().length === 0) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  try {
    // ── Modo enhance: mejora una descripción corta ──────────
    if (mode === 'enhance') {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: ENHANCE_PROMPT,
        generationConfig: { temperature: 0.4 }
      });
      const result = await model.generateContent(`Nota original: "${payload}"`);
      const text = result.response.text().trim().replace(/^["']|["']$/g, '');

      if (!text) {
        return NextResponse.json({ error: 'La IA no generó una respuesta.', code: 'EMPTY_RESPONSE' }, { status: 502 });
      }

      return NextResponse.json({ descripcion: text.substring(0, 200) });
    }

    // ── Modos QR / OCR ──────────────────────────────────────
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    let result;

    if (mode === 'qr') {
      result = await model.generateContent(`Texto escaneado: ${payload}`);
    } else if (mode === 'ocr') {
      const imageParts = [{ inlineData: { data: payload, mimeType: 'image/jpeg' } }];
      result = await model.generateContent(['Analiza esta imagen y extrae los datos solicitados en formato JSON.', ...imageParts]);
    } else {
      return NextResponse.json({ error: 'Modo no soportado.', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const text = result.response.text();
    if (!text) {
      return NextResponse.json({ error: 'La IA no generó una respuesta.', code: 'EMPTY_RESPONSE' }, { status: 502 });
    }

    const cleanJSON = text.replace(/```json|```/g, '').trim();

    try {
      return NextResponse.json(JSON.parse(cleanJSON));
    } catch {
      console.error(`[scan/${mode}] JSON inválido de Gemini:`, cleanJSON);
      return NextResponse.json({ error: 'Respuesta de IA con formato inválido.', code: 'PARSE_ERROR' }, { status: 502 });
    }

  } catch (error) {
    const { status, code, message } = classifyGeminiError(error);
    console.error(`[scan/${mode}] ${code}:`, error);
    return NextResponse.json({ error: message, code }, { status });
  }
}