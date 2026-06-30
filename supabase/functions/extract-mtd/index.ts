// Extract MTD motor data from one or more invoice/Excel images using Lovable AI Gateway (vision)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MTD_TYPES = [
  'CAVACO','CT','ELEVADOR','ESPALHADOR','FORNALHA','MPL','REDLER',
  'REGISTRO_MOTORIZADO','TH','THV','TORRADOR','TRIPPER','VALVULA_ROTATIVA',
];

const SYSTEM_PROMPT = `Você é um assistente que extrai dados de motorredutores (MTD) a partir de imagens de Notas Fiscais ou planilhas Excel.

Sua tarefa: identificar TODOS os motores listados na imagem (podem ser de 1 a 30 motores) e retornar APENAS um JSON válido no formato:
{
  "motors": [
    {
      "code": "string (código/patrimônio do motor, ex: 039000137)",
      "description": "string (descrição completa do motor)",
      "mtdType": "REDLER" | "ELEVADOR" | "THV" | "CT" | "MPL" | "CAVACO" | "TRIPPER" | "TH" | "VALVULA_ROTATIVA" | "TORRADOR" | "ESPALHADOR" | "REGISTRO_MOTORIZADO" | "FORNALHA",
      "quantity": number,
      "cliente": "string (nome do cliente/fornecedor, se visível)",
      "notaFiscal": "string (nº da NF, se visível)",
      "ofNumber": "string (nº da Ordem de Fabricação, se visível)",
      "portaria": "string (nº da portaria, se visível)",
      "condicao": "Novo" | "Usado" | "Recondicionado" | "Revisado" | "Danificado" | ""
    }
  ]
}

Regras:
- Inferir o mtdType a partir da descrição (ex: descrição contendo "REDLER" -> "REDLER", "ELEVADOR" -> "ELEVADOR", etc). Se não conseguir inferir, use "REDLER".
- Se um campo não estiver visível, use string vazia "" (ou 1 para quantity).
- Se a mesma NF/cliente se aplica a todos os motores da imagem, repita o valor em cada item.
- NUNCA invente dados. Se a imagem não contém motores, retorne { "motors": [] }.
- Retorne SOMENTE o JSON, sem texto adicional, sem markdown, sem \`\`\`.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { images } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "Envie ao menos uma imagem em 'images'." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: any[] = [
      { type: "text", text: "Extraia os dados de todos os motorredutores das imagens a seguir e retorne o JSON conforme instruído." },
      ...images.map((url: string) => ({ type: "image_url", image_url: { url } })),
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de uso da IA atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos em Cloud → Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI Gateway: ${resp.status} ${errText}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    let raw: string = data?.choices?.[0]?.message?.content ?? "";
    raw = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    let parsed: any = {};
    try { parsed = JSON.parse(raw); }
    catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch { parsed = { motors: [] }; } }
    }

    const motors = Array.isArray(parsed?.motors) ? parsed.motors : [];
    const sanitized = motors.map((m: any) => ({
      code: String(m?.code ?? "").trim(),
      description: String(m?.description ?? "").trim(),
      mtdType: MTD_TYPES.includes(String(m?.mtdType)) ? String(m?.mtdType) : "REDLER",
      quantity: Math.max(1, Number(m?.quantity) || 1),
      cliente: String(m?.cliente ?? "").trim(),
      notaFiscal: String(m?.notaFiscal ?? "").trim(),
      ofNumber: String(m?.ofNumber ?? "").trim(),
      portaria: String(m?.portaria ?? "").trim(),
      condicao: String(m?.condicao ?? "").trim(),
    }));

    return new Response(JSON.stringify({ motors: sanitized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Erro inesperado." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
