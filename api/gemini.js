export default async function handler(req, res) {
    const apiKeys = [
        process.env.GEM_API_KEY,
        process.env.GEMINI_API_KEY,
        process.env.GOOGLE_API_KEY,
        process.env.API_KEY
    ].filter(Boolean);

    if (apiKeys.length === 0) {
        return res.status(500).json({
            error: 'No hay API key configurada en Vercel',
            details: 'Agregá GEM_API_KEY, GEMINI_API_KEY o GOOGLE_API_KEY en Variables de entorno.'
        });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            body = {};
        }
    }

    const { prompt } = body || {};

    if (!prompt) {
        return res.status(400).json({ error: 'Falta el prompt' });
    }

    try {
        const modelCandidates = [
            'gemini-2.0-flash',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest',
            'gemini-1.5-flash'
        ];

        let lastError = null;

        for (const apiKey of apiKeys) {
            for (const model of modelCandidates) {
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.7
                            }
                        })
                    });

                    const data = await response.json().catch(() => ({}));

                    if (response.ok) {
                        return res.status(200).json(data);
                    }

                    const detail = data?.error?.message || data?.message || `Model ${model} failed with status ${response.status}`;
                    lastError = { model, status: response.status, detail };

                    if (response.status !== 404 && response.status !== 400) {
                        break;
                    }
                } catch (error) {
                    lastError = { model, detail: error.message };
                }
            }
        }

        return res.status(502).json({
            error: 'No se pudo contactar a Gemini con ningún modelo disponible.',
            details: lastError?.detail || 'Sin detalle disponible.',
            model: lastError?.model || null,
            status: lastError?.status || null
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error conectando con Gemini', details: error.message });
    }
}