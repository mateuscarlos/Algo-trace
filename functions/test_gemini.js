const apiKey = process.env.VITE_GEMINI_API_KEY || "SUA_CHAVE_AQUI";
async function test() {
  const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
  const reqBody = {
      contents: [{ parts: [{ text: "Olá, este é um teste de áudio." }] }],
      generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
      }
  };
  console.log("Fetching...");
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reqBody) });
  if (!response.ok) {
      console.log("Error:", response.status, await response.text());
      return;
  }
  const data = await response.json();
  const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  console.log("Success! inlineData present?", !!inlineData);
  if (inlineData) {
      console.log("MimeType:", inlineData.mimeType, "Data snippet length:", inlineData.data.length);
  }
}
test().catch(console.error);
