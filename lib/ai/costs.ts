export function calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  const providerLower = provider.toLowerCase();
  const modelLower = model.toLowerCase();
  const modelKey = `${providerLower}/${modelLower}`;
  
  let inputRate = 0.15; // per million tokens (default to gpt-4o-mini rates)
  let outputRate = 0.60; // per million tokens
  
  if (modelKey.includes("gpt-4o-mini")) {
    inputRate = 0.15;
    outputRate = 0.60;
  } else if (modelKey.includes("gpt-4o")) {
    inputRate = 2.50;
    outputRate = 10.00;
  } else if (modelKey.includes("claude-3-5-sonnet") || modelKey.includes("sonnet")) {
    inputRate = 3.00;
    outputRate = 15.00;
  } else if (modelKey.includes("claude-3-haiku") || modelKey.includes("haiku")) {
    inputRate = 0.25;
    outputRate = 1.25;
  } else if (modelKey.includes("gemini-1.5-flash") || modelKey.includes("flash") || modelKey.includes("gemini-2")) {
    inputRate = 0.075;
    outputRate = 0.30;
  } else if (modelKey.includes("gemini-1.5-pro") || modelKey.includes("pro")) {
    inputRate = 1.25;
    outputRate = 5.00;
  }
  
  const cost = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
  return Number(cost.toFixed(6));
}
