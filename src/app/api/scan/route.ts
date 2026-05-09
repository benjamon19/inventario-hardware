import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `Eres un experto extractor de datos de hardware informático. Analiza el contenido entregado (texto de QR, código de barras o imagen de etiqueta) y extrae:
1. El modelo exacto del equipo (laptop, monitor, impresora, etc.)
2. El número de serie si está presente
3. Tu nivel de confianza del 0 al 100
4. Una breve explicación de tu análisis (máx 100 chars)

REGLAS IMPORTANTES:
- Si el input es una URL, analiza su ruta para deducir el equipo. NO devuelvas la URL como modelo.
- Limpia el modelo: Marca + Línea + Referencia (ej: "Lenovo ThinkPad T14").
- Busca números de serie bajo S/N, Serial, SN.
- Si no puedes identificar un modelo ni serie válida, retorna null para ambos.

Responde ESTRICTAMENTE con un objeto JSON válido con esta estructura exacta:
{"modelo": string | null, "numero_serie": string | null, "confianza": number, "razonamiento": string}`;

export async function POST(request: Request) {
  try {
    const { mode, payload } = await request.json();

    if (!mode || !payload) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    let contents: any;

    if (mode === 'qr') {
      contents = `Texto escaneado del QR: ${payload}`;
    } else if (mode === 'ocr') {
      contents = [
        { inlineData: { data: payload, mimeType: 'image/jpeg' } },
        'Analiza esta imagen de una etiqueta de equipo informático y extrae los datos.',
      ];
    } else {
      return NextResponse.json({ error: 'Modo inválido' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Respuesta vacía de Gemini');

    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error procesando scan con Gemini:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
