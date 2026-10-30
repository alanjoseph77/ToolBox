export async function callAi<T = string>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "AI request failed.");
  return data.result as T;
}
