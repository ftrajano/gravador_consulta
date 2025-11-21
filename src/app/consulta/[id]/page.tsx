"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface Consulta {
  id: string;
  titulo: string | null;
  audioUrl: string;
  transcricao: string;
  createdAt: string;
}

export default function ConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchConsulta() {
      try {
        const response = await fetch(`/api/consultas/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Consulta não encontrada");
          }
          throw new Error("Erro ao carregar consulta");
        }
        const data = await response.json();
        setConsulta(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    }

    fetchConsulta();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = async () => {
    if (!consulta) return;

    try {
      await navigator.clipboard.writeText(consulta.transcricao);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea");
      textArea.value = consulta.transcricao;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Detalhes da Consulta</h1>
          <div className="flex gap-4">
            <Link
              href="/historico"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Histórico
            </Link>
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Nova Gravação
            </Link>
          </div>
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
            <Link
              href="/historico"
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
            >
              Voltar ao histórico
            </Link>
          </div>
        )}

        {!isLoading && !error && consulta && (
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                {consulta.titulo || "Consulta sem título"}
              </h2>
              <p className="text-sm text-gray-500">
                {formatDate(consulta.createdAt)}
              </p>
            </div>

            {/* Player de áudio */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Áudio</h3>
              <audio controls src={consulta.audioUrl} className="w-full" />
            </div>

            {/* Transcrição */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">Transcrição</h3>
                <button
                  onClick={copyToClipboard}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copiado!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copiar texto
                    </>
                  )}
                </button>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {consulta.transcricao}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
