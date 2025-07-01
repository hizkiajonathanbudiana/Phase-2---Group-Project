const OpenAI = require("openai");

class aiController {
  static async generateChat(req, res, next) {
    try {
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENAI_API_KEY,
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "WeiMood",
        },
      });
      // const profile = await Profile.findOne({ //   where: { userId: 1 }, // }); // if (!profile) { //   return res.status(404).json({ error: "Profile not found" }); // }

      const promptString = `
---
[CONTEXT FOR AI]
You are a quiz generator AI.

Your task: Generate ONE simple general knowledge question.

Respond ONLY with a JavaScript object like this:
{ "question": "Your question here", "answer": "onewordanswer" }

Rules:
- The "answer" MUST be a single word (no spaces).
- Do NOT explain anything.
- Do NOT include markdown, extra text, or formatting.
- Just return the object. Nothing else.
`;

      console.log("response");

      const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-r1-0528:free",

        messages: [
          {
            role: "user", // profile: profile,

            content: promptString,
          },
        ],
      });

      console.log(response);

      const question = response.choices[0].message.content;

      res.status(201).json({ question });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}

module.exports = aiController;
