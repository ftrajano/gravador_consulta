import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const consultas = await prisma.consulta.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        titulo: true,
        createdAt: true,
      },
    });

    return NextResponse.json(consultas);
  } catch (error) {
    console.error("Erro ao buscar consultas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico de consultas." },
      { status: 500 }
    );
  }
}
