export default async function handler(req, res) {
    // 1. Esto lee la variable de entorno de Vercel (secreta y segura)
    const apiKey = process.env.GEM_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key no configurada en el servidor" });
    }

    // 2. Recibimos el prompt del frontend
    const { prompt } = req.body;

    try {
        const modelCandidates = [
            'gemini-2.0-flash',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest',
            'gemini-1.5-flash'
        ];

        let lastError = null;

        for (const model of modelCandidates) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7
                        }
                    })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    return res.status(200).json(data);
                }

                lastError = data?.error?.message || `Model ${model} failed with status ${response.status}`;

                if (response.status !== 404 && response.status !== 400) {
                    break;
                }
            } catch (error) {
                lastError = error.message;
            }
        }

        return res.status(502).json({
            error: 'No se pudo contactar a Gemini con ningún modelo disponible.',
            details: lastError || 'Sin detalle disponible.'
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error conectando con Gemini', details: error.message });
    }
}