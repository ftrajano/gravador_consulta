import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const consulta = await prisma.consulta.findUnique({
      where: { id },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: "Consulta não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(consulta);
  } catch (error) {
    console.error("Erro ao buscar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao buscar consulta." },
      { status: 500 }
    );
  }
}
