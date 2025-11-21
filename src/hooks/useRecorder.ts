"use client";

import { useState, useRef, useCallback } from "react";

export type RecorderStatus = "idle" | "recording" | "stopped" | "error";

interface UseRecorderReturn {
  status: RecorderStatus;
  audioBlob: Blob | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export function useRecorder(): UseRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // Verificar suporte do navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Seu navegador não suporta gravação de áudio. Por favor, use um navegador moderno como Chrome, Firefox ou Edge."
        );
      }

      // Solicitar permissão e obter stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Verificar suporte ao MediaRecorder
      if (!window.MediaRecorder) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("MediaRecorder não é suportado neste navegador.");
      }

      // Determinar o melhor formato suportado
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setStatus("stopped");

        // Parar todas as tracks do stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.onerror = () => {
        setError("Erro durante a gravação.");
        setStatus("error");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setStatus("recording");
      setError(null);
    } catch (err) {
      let errorMessage = "Erro ao iniciar gravação.";

      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          errorMessage =
            "Permissão de microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador.";
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          errorMessage =
            "Nenhum microfone encontrado. Por favor, conecte um microfone.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setStatus("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    setStatus("idle");
    setAudioBlob(null);
    setError(null);
    chunksRef.current = [];
  }, []);

  return {
    status,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
