const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateResponse = async (messages) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
      config: {
        systemInstruction: `
            
            Respond using markdown.

Use:
- headings
- bullet points
- numbered lists
- fenced code blocks
- tables when useful

Avoid raw HTML.

            `,
      },
    });
    return response.text;
  } catch (err) {
    console.log(err);
  }
};

module.exports = { generateResponse };
