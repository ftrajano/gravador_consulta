import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Retorna não encontrado para teste (sem banco de dados)
  return NextResponse.json(
    { error: "Consulta não encontrada." },
    { status: 404 }
  );
}
