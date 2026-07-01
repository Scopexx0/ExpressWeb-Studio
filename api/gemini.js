export default async function handler(req, res) {
    // 1. Esto lee la variable de entorno de Vercel (secreta y segura)
    const apiKey = process.env.GEM_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key no configurada en el servidor" });
    }

    // 2. Recibimos el prompt del frontend
    const { prompt } = req.body;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Error conectando con Gemini" });
    }
}