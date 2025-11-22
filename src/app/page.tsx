"use client";

import { useState } from "react";
import Link from "next/link";
import { useRecorder } from "@/hooks/useRecorder";

export default function Home() {
  const { status, audioBlob, error, startRecording, stopRecording, resetRecording } = useRecorder();

  const [titulo, setTitulo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [transcricao, setTranscricao] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "consulta.webm");
      if (titulo.trim()) {
        formData.append("titulo", titulo.trim());
      }

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar transcrição");
      }

      // Mostrar transcrição na página
      setTranscricao(data.transcricao);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro ao enviar áudio");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Gravador de Consultas</h1>
          <Link
            href="/historico"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ver Histórico
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Nova Gravação</h2>

          {/* Campo de título */}
          <div className="mb-6">
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
              Título da consulta (opcional)
            </label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Consulta - João Silva"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={status === "recording" || isUploading}
            />
          </div>

          {/* Controles de gravação */}
          <div className="flex flex-col items-center gap-4">
            {status === "idle" && (
              <button
                onClick={startRecording}
                className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <span className="w-3 h-3 bg-white rounded-full"></span>
                Iniciar Gravação
              </button>
            )}

            {status === "recording" && (
              <>
                <div className="flex items-center gap-2 text-red-600">
                  <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                  <span className="font-medium">Gravando...</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors"
                >
                  Parar Gravação
                </button>
              </>
            )}

            {status === "stopped" && audioBlob && (
              <div className="w-full space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Áudio gravado:</p>
                  <audio
                    controls
                    src={URL.createObjectURL(audioBlob)}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetRecording}
                    disabled={isUploading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Nova Gravação
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Processando...
                      </>
                    ) : (
                      "Transcrever"
                    )}
                  </button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={resetRecording}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>

          {/* Erro de upload */}
          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}

          {/* Transcrição */}
          {transcricao && (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-900 mb-3">Transcrição:</h3>
              <div className="max-h-[500px] overflow-y-auto bg-white p-4 rounded border border-green-200">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{transcricao}</p>
              </div>
              <button
                onClick={() => {
                  setTranscricao(null);
                  resetRecording();
                }}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Nova Gravação
              </button>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Como usar:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Clique em &quot;Iniciar Gravação&quot; para começar</li>
            <li>Permita o acesso ao microfone quando solicitado</li>
            <li>Grave a consulta normalmente</li>
            <li>Clique em &quot;Parar Gravação&quot; quando terminar</li>
            <li>Revise o áudio e clique em &quot;Transcrever&quot;</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
