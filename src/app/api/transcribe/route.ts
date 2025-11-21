import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Verificar se a chave da OpenAI está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API OpenAI não configurada no servidor." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const titulo = formData.get("titulo") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo de áudio enviado." },
        { status: 400 }
      );
    }

    // Validar tipo do arquivo
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "O arquivo enviado não é um áudio válido." },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const fileId = uuidv4();
    const extension = file.type.includes("webm") ? "webm" : "mp4";
    const fileName = `${fileId}.${extension}`;
    const filePath = join(process.cwd(), "public", "uploads", fileName);

    // Salvar arquivo no sistema de arquivos
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Chamar API da OpenAI para transcrição
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const model = process.env.OPENAI_MODEL || "gpt-4o-transcribe";
    const language = process.env.OPENAI_LANGUAGE || "pt";

    // Criar um File object para a OpenAI
    const audioFile = new File([buffer], fileName, { type: file.type });

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: model,
      language: language,
      response_format: "json",
    });

    // Salvar no banco de dados
    const consulta = await prisma.consulta.create({
      data: {
        titulo: titulo || `Consulta ${new Date().toLocaleString("pt-BR")}`,
        audioUrl: `/uploads/${fileName}`,
        transcricao: transcription.text,
      },
    });

    return NextResponse.json({
      id: consulta.id,
      titulo: consulta.titulo,
      audioUrl: consulta.audioUrl,
      transcricao: consulta.transcricao,
      createdAt: consulta.createdAt,
    });
  } catch (error) {
    console.error("Erro ao processar transcrição:", error);

    // Tratar erros específicos da OpenAI
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Limite de requisições excedido. Tente novamente em alguns minutos." },
          { status: 429 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Chave da API OpenAI inválida." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `Erro da API OpenAI: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao processar a transcrição. Tente novamente." },
      { status: 500 }
    );
  }
}
