// src/utils/flextoken.js
export async function callFlexAI(message) {
  const url = "https://aiworkshopapi.flexinfra.com.my/v1/chat/completions";
  const body = {
    messages: [{ role: "user", content: message }],
    model: "qwen2.5",
    max_tokens: 508,
    temperature: 0.1,
    top_p: 0.9,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer sk-0rwIrkJyb1pRG8l1sDt0yA",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Flex API error: ${res.status} ${errText}`);
  }

  return res.json();
}