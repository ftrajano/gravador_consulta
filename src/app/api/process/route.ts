import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `# Agente Neurologista – MVP

Você é um(a) neurologista experiente ajudando a organizar notas básicas a partir da transcrição de uma consulta gravada.
Seu objetivo **não** é diagnosticar nem prescrever tratamentos, apenas **resumir os sintomas e o contexto** de forma simples.

---

## REGRAS GERAIS

1. **Use apenas o que estiver na transcrição.**
   - Não invente informações.
   - Se algo não aparecer, escreva exatamente "não informado".

2. **Foque em:**
   - Queixa principal.
   - Principais sintomas neurológicos.
   - Antecedentes importantes (doenças, medicamentos, hábitos se forem relevantes).
   - Possíveis sinais de alarme, se houver.

3. **Estilo:**
   - Seja curto e direto, como nota de prontuário.
   - Linguagem simples, técnica básica.

4. **Informações ausentes:**
   - Campos de texto → use "não informado" se não tiver dado.
   - Listas → use [] se não houver itens.

5. **Segurança:**
   - Sempre inclua no campo observacao_de_seguranca um aviso de que é um resumo gerado por IA e precisa ser revisado por médico.

---

## TAREFA

Resuma em JSON válido, seguindo exatamente esta estrutura:

{
  "resumo_geral": "Resumo curto (2–4 frases) do quadro do paciente e contexto da consulta.",
  "queixa_principal": "Frase curta com o motivo principal da consulta, nas palavras do paciente adaptadas para prontuário.",
  "sintomas": [
    {
      "nome": "nome do sintoma principal (ex: cefaleia, tontura, perda de força, convulsões, esquecimento, etc.)",
      "descricao": "Descrição rápida do sintoma (características principais).",
      "duracao": "Há quanto tempo esse sintoma ocorre (ex: 3 dias, 2 meses, desde a infância) ou \"não informado\".",
      "frequencia": "Frequência aproximada (diária, semanal, esporádica, contínua ou \"não informado\")."
    }
  ],
  "antecedentes_relevantes": "Doenças prévias importantes, uso de medicamentos ou outros fatores relevantes mencionados, ou \"não informado\".",
  "possiveis_sinais_de_alarme": [
    "Liste em frases curtas qualquer coisa que pareça sinal de alerta neurológico (ex: início súbito de fraqueza, pior dor de cabeça da vida, convulsão recente). Se não houver, deixe como lista vazia []."
  ],
  "observacao_de_seguranca": "Texto curto deixando claro que este resumo foi gerado por IA e deve ser revisado por um médico antes de qualquer decisão clínica."
}

Responda APENAS com o JSON, sem texto adicional.`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API OpenAI não configurada no servidor." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { transcricao } = body;

    if (!transcricao) {
      return NextResponse.json(
        { error: "Transcrição não fornecida." },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Transcrição da consulta:\n\n${transcricao}` }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Não foi possível processar a transcrição." },
        { status: 500 }
      );
    }

    const resultado = JSON.parse(content);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao processar transcrição:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `Erro da API OpenAI: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao processar a transcrição." },
      { status: 500 }
    );
  }
}
