import { NextResponse } from "next/server";

export async function GET() {
  // Retorna lista vazia para teste (sem banco de dados)
  return NextResponse.json([]);
}
