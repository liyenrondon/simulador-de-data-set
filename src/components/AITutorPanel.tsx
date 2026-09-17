import React, { useState } from 'react';
import { FeatureKey, SVMModelResult } from '../types';
import { FEATURES_METADATA } from '../data/housingDataset';
import { Bot, Send, Sparkles, RefreshCw, MessageSquare, Lightbulb } from 'lucide-react';

interface AITutorPanelProps {
  model: SVMModelResult;
  featureX: FeatureKey;
  featureY: FeatureKey;
  featureZ?: FeatureKey;
  priceThreshold: number;
  totalPoints: number;
  mode: string;
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  model,
  featureX,
  featureY,
  featureZ,
  priceThreshold,
  totalPoints,
  mode,
}) => {
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const metaX = FEATURES_METADATA[featureX];
  const metaY = FEATURES_METADATA[featureY];

  const quickQuestions = [
    '¿Por qué estas casas específicas son vectores de soporte y las demás no?',
    '¿Qué efecto tiene el valor actual de C en este modelo de viviendas?',
    '¿Qué significa el vector de pesos w en términos inmobiliarios?',
    '¿Cómo podemos saber si este modelo tiene sobreajuste (overfitting)?',
  ];

  const askTutor = async (question?: string) => {
    setLoading(true);
    setError(null);

    const q = question !== undefined ? question : userQuestion;

    const variables = [metaX.name, metaY.name];
    if (featureZ) variables.push(FEATURES_METADATA[featureZ].name);

    try {
      const res = await fetch('/api/explain-svm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variables,
          kernel: model.kernel,
          C: model.C,
          gamma: model.gamma,
          supportVectorsCount: model.totalSupportVectors,
          totalPoints,
          accuracy: model.accuracy,
          marginWidth: model.marginWidth,
          userQuestion: q,
          mode,
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo comunicar con el tutor de IA.');
      }

      const data = await res.json();
      setExplanation(data.explanation);
      if (question === undefined) setUserQuestion('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al solicitar explicación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Tutor Pedagógico de Machine Learning (Google Gemini AI)
            </h3>
            <p className="text-xs text-slate-400">
              Explicaciones didácticas en tiempo real adaptadas a los parámetros y vectores de soporte de tu simulación.
            </p>
          </div>
        </div>

        <button
          onClick={() => askTutor()}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Analizar Modelo Actual
        </button>
      </div>

      {/* Preguntas rápidas didácticas */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Preguntas sugeridas:
        </span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => askTutor(q)}
            disabled={loading}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Caja de respuesta didáctica */}
      {explanation && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line font-sans border-l-4 border-l-purple-500 shadow-inner">
          {explanation}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Input para consulta personalizada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (userQuestion.trim()) askTutor();
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Pregúntale al tutor de IA sobre hiperplanos, vectores de soporte, holguras o sobreajuste..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !userQuestion.trim()}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          Preguntar
        </button>
      </form>
    </div>
  );
};
