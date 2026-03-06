const apiKey = process.env.VITE_GEMINI_API_KEY || "SUA_CHAVE_AQUI";

async function testTemp() {
  const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
  const reqBody = {
      contents: [{ parts: [{ text: "Teste" }] }],
      generationConfig: {
          temperature: 0.3,
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
      }
  };
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reqBody) });
  if (!response.ok) {
      console.log("Error:", response.status, await response.text());
  } else {
      console.log("Success with temperature 0.3!");
  }
}
testTemp().catch(console.error);
