const apiKey = process.env.VITE_GEMINI_API_KEY || "SUA_CHAVE_AQUI";
async function list() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  const models = data.models || [];
  models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
}
list().catch(console.error);
