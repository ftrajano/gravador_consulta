"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Consulta {
  id: string;
  titulo: string | null;
  createdAt: string;
}

export default function Historico() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConsultas() {
      try {
        const response = await fetch("/api/consultas");
        if (!response.ok) {
          throw new Error("Erro ao carregar histórico");
        }
        const data = await response.json();
        setConsultas(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    }

    fetchConsultas();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Histórico de Consultas</h1>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Nova Gravação
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex justify-center py-12">
            <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!isLoading && !error && consultas.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">Nenhuma consulta gravada ainda.</p>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Gravar primeira consulta
            </Link>
          </div>
        )}

        {!isLoading && !error && consultas.length > 0 && (
          <div className="bg-white rounded-lg shadow divide-y">
            {consultas.map((consulta) => (
              <Link
                key={consulta.id}
                href={`/consulta/${consulta.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {consulta.titulo || "Consulta sem título"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(consulta.createdAt)}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
