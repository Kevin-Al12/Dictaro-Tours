import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Eres el asistente virtual de D'Itaros Tours, una agencia de viajes premium en República Dominicana.
Tu nombre es "Ita" y tu objetivo es ayudar a los clientes con información sobre:

- **Destinos internacionales**: París, Dubái, Cancún, Roma, Tokio, Bali, Nueva York y más.
- **Paquetes**: precios, qué incluyen, fechas de salida, duración.
- **Hoteles nacionales**: en Santo Domingo, Punta Cana, La Romana, Samaná, Puerto Plata, Bayahibe y más.
- **Excursiones**: Isla Saona, Los 27 Charcos, Los Haitises, Avistamiento de Ballenas, Safari 4x4, etc.
- **Requisitos de viaje**: pasaportes, visas, vacunas, equipaje.
- **Promociones**: códigos de descuento activos.
- **Reservas**: cómo reservar, formas de pago, política de cancelación.

Responde siempre en español, de forma amigable, profesional y entusiasta.
Cuando el cliente pregunte precios, menciona que son referenciales y que un asesor confirmará el precio final.
Si el cliente quiere reservar, invítalo a usar el formulario de reservas en la web o a contactar por WhatsApp al +1 (809) 555-1234.
Respuestas concisas (máximo 150 palabras), amables y con emojis ocasionales.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role:    m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'Lo siento, hay un problema con el asistente. Por favor contáctanos por WhatsApp al +1 (809) 555-1234.' },
      { status: 200 }
    );
  }
}
