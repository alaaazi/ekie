import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaseStatus, ClientRequest, AnalysisResult, ChatMessage } from '../types';
import { analyzeContract, askDocumentQuestion } from '../services/geminiService';
import { RobotIcon, FileIcon, AlertIcon, CheckCircleIcon, SparklesIcon, ChatIcon, SendIcon } from './ui/Icons';

interface Props {
  cases: ClientRequest[];
  onUpdateCase: (updatedCase: ClientRequest) => void;
}

export const LawyerDashboard: React.FC<Props> = ({ cases, onUpdateCase }) => {
  const [selectedCase, setSelectedCase] = useState<ClientRequest | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedCase?.chatHistory, activeTab]);

  const handleAnalyze = async (c: ClientRequest) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeContract(c.fileBase64, c.fileType, c.message);
      const updatedCase: ClientRequest = {
        ...c,
        status: CaseStatus.PROCESSED,
        analysis: result,
      };
      onUpdateCase(updatedCase);
      setSelectedCase(updatedCase);
      setActiveTab('analysis');
    } catch (error) {
      alert("Erreur lors de l'analyse : " + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedCase) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: new Date() };
    const updatedHistory = [...selectedCase.chatHistory, userMsg];
    
    // Optimistic update
    const caseWithUserMsg = { ...selectedCase, chatHistory: updatedHistory };
    onUpdateCase(caseWithUserMsg);
    setSelectedCase(caseWithUserMsg);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const aiResponseText = await askDocumentQuestion(
        userMsg.text, 
        selectedCase.fileBase64, 
        selectedCase.fileType, 
        updatedHistory, 
        selectedCase.analysis
      );

      const botMsg: ChatMessage = { role: 'model', text: aiResponseText, timestamp: new Date() };
      const finalCase = { ...selectedCase, chatHistory: [...updatedHistory, botMsg] };
      
      onUpdateCase(finalCase);
      setSelectedCase(finalCase);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-cream-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-ekie-900 text-white flex flex-col shadow-2xl z-20 border-r border-white/10">
        <div className="p-8 border-b border-white/10">
          <h1 className="text-3xl font-serif font-bold tracking-tight text-white">Ekie.</h1>
          <p className="text-xs text-ekie-300 mt-1 uppercase tracking-widest">Espace Avocat</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 space-y-2">
          <div className="px-8 mb-4 text-xs font-bold text-ekie-400 uppercase tracking-widest">Dossiers en cours</div>
          {cases.length === 0 && (
             <div className="px-8 py-4 text-sm text-ekie-200 italic opacity-50">Aucun dossier en attente.</div>
          )}
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className={`w-full px-8 py-4 flex items-start text-left transition-all duration-200 relative group ${
                selectedCase?.id === c.id 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'
              }`}
            >
              {selectedCase?.id === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-ekie-400 shadow-[0_0_10px_rgba(122,158,248,0.5)]" />}
              <div className="flex-1">
                <h3 className={`font-medium text-sm ${selectedCase?.id === c.id ? 'text-white' : 'text-ekie-100'}`}>{c.clientName}</h3>
                <p className="text-xs text-ekie-400 mt-1 truncate">{c.fileName}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-ekie-500 font-mono">{new Date(c.submittedAt).toLocaleDateString()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                    c.status === CaseStatus.NEW ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                  }`}>
                    {c.status === CaseStatus.NEW ? 'Nouveau' : 'Analysé'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-ekie-400 to-purple-400"></div>
                <div>
                    <p className="text-sm font-medium text-white">Me. Martin</p>
                    <p className="text-xs text-ekie-400">Cabinet Martin & Associés</p>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50">
        {selectedCase ? (
          <div className="flex flex-1 h-full overflow-hidden">
            
            {/* Left Column: Context & Document (Static) */}
            <div className="w-5/12 flex flex-col border-r border-slate-200 bg-white shadow-xl z-10">
              <div className="p-8 border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-ekie-900">{selectedCase.clientName}</h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Reçu le {new Date(selectedCase.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                {/* Client Message */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-slate-300"></span> Message du client
                  </h3>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-slate-700 italic leading-relaxed relative">
                    <span className="absolute top-4 left-4 text-4xl text-ekie-100 font-serif opacity-50">"</span>
                    <p className="relative z-10 pl-4">{selectedCase.message}</p>
                  </div>
                </div>

                {/* Document Preview */}
                <div className="flex flex-col h-[800px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-slate-300"></span> Pièce jointe
                        </h3>
                        <button 
                            onClick={() => {
                                const win = window.open();
                                if(win) {
                                    win.document.write(
                                        '<iframe src="' + selectedCase.fileBase64 + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'
                                    );
                                }
                            }}
                            className="text-xs font-medium text-ekie-600 hover:text-ekie-800 flex items-center gap-1 hover:underline"
                        >
                            Ouvrir dans un nouvel onglet ↗
                        </button>
                    </div>
                    
                    <div className="flex-1 bg-slate-200 rounded-2xl border border-slate-300 overflow-hidden shadow-inner relative group">
                        {selectedCase.fileType === 'application/pdf' ? (
                             <iframe 
                                src={selectedCase.fileBase64} 
                                className="w-full h-full bg-white"
                                title="Aperçu du document"
                             />
                        ) : selectedCase.fileType.startsWith('image/') ? (
                            <img 
                                src={selectedCase.fileBase64} 
                                alt="Document" 
                                className="w-full h-full object-contain bg-slate-900"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-6 text-center">
                                <div className="bg-slate-700 p-4 rounded-full mb-4">
                                    <FileIcon />
                                </div>
                                <p className="font-medium text-white mb-2">{selectedCase.fileName}</p>
                                <p className="text-sm opacity-70 mb-6">Ce format de fichier ne peut pas être prévisualisé directement.</p>
                                <button 
                                    onClick={() => {
                                         const link = document.createElement('a');
                                         link.href = selectedCase.fileBase64;
                                         link.download = selectedCase.fileName;
                                         link.click();
                                    }}
                                    className="px-6 py-3 bg-ekie-500 hover:bg-ekie-400 text-white text-sm font-semibold rounded-xl transition-colors"
                                >
                                    Télécharger le fichier
                                </button>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>

            {/* Right Column: Intelligence (Tabs: Analysis & Chat) */}
            <div className="w-7/12 bg-cream-50 flex flex-col h-full overflow-hidden relative">
                {/* Header / Tabs */}
                <div className="px-8 pt-6 pb-0 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm flex justify-between items-center">
                   <div className="flex gap-6">
                        <button 
                            onClick={() => setActiveTab('analysis')}
                            className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all relative ${
                                activeTab === 'analysis' ? 'text-ekie-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <span className="flex items-center gap-2"><SparklesIcon /> Analyse Juridique</span>
                            {activeTab === 'analysis' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-ekie-600" />}
                        </button>
                        <button 
                             onClick={() => setActiveTab('chat')}
                             className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all relative ${
                                activeTab === 'chat' ? 'text-ekie-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                             <span className="flex items-center gap-2"><ChatIcon /> Assistant IA</span>
                             {activeTab === 'chat' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-ekie-600" />}
                        </button>
                   </div>
                   
                   {/* Action Button */}
                   {selectedCase.status === CaseStatus.NEW && !isAnalyzing && activeTab === 'analysis' && (
                      <button 
                        onClick={() => handleAnalyze(selectedCase)}
                        className="mb-3 flex items-center gap-2 bg-ekie-900 hover:bg-ekie-800 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg shadow-ekie-900/20 transition-all transform hover:-translate-y-0.5"
                      >
                        <SparklesIcon />
                        <span>Lancer l'analyse</span>
                      </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {/* VIEW: ANALYSIS */}
                        {activeTab === 'analysis' && (
                            <motion.div 
                                key="analysis"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="h-full overflow-y-auto p-8 space-y-8 pb-20"
                            >
                                {isAnalyzing ? (
                                    <div className="h-full flex flex-col items-center justify-center text-ekie-600">
                                        <div className="w-16 h-16 border-4 border-ekie-100 border-t-ekie-600 rounded-full animate-spin mb-4"></div>
                                        <p className="font-serif text-xl animate-pulse">L'IA analyse le contrat...</p>
                                    </div>
                                ) : !selectedCase.analysis ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                        <div className="bg-slate-100 p-6 rounded-full mb-4">
                                            <RobotIcon />
                                        </div>
                                        <p className="font-serif text-xl text-slate-600">En attente d'analyse</p>
                                        <p className="text-sm max-w-xs text-center mt-2">Cliquez sur le bouton pour extraire les clauses et risques.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Summary */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-ekie-500"></div>
                                            <h3 className="font-serif font-bold text-lg text-ekie-900 mb-3">Synthèse du dossier</h3>
                                            <p className="text-slate-600 leading-relaxed">{selectedCase.analysis.summary}</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            {/* Key Points */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h3 className="font-serif font-bold text-lg text-ekie-900 mb-4 flex items-center gap-2">
                                                    Points Clés
                                                </h3>
                                                <ul className="space-y-3">
                                                    {selectedCase.analysis.keyPoints.map((point, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                                                        <div className="mt-1 flex-shrink-0"><CheckCircleIcon /></div>
                                                        <span className="text-sm leading-relaxed">{point}</span>
                                                    </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Risks */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h3 className="font-serif font-bold text-lg text-ekie-900 mb-4 flex items-center gap-2">
                                                    <span className="text-red-500"><AlertIcon /></span>
                                                    Risques détectés
                                                </h3>
                                                <div className="space-y-4">
                                                    {selectedCase.analysis.risks.map((risk, idx) => (
                                                    <div key={idx} className={`p-4 rounded-xl border-l-4 flex flex-col gap-1 ${
                                                        risk.severity === 'Élevé' ? 'bg-red-50/50 border-red-500' :
                                                        risk.severity === 'Moyen' ? 'bg-orange-50/50 border-orange-400' :
                                                        'bg-yellow-50/50 border-yellow-400'
                                                    }`}>
                                                        <div className="flex justify-between items-center">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                                                                risk.severity === 'Élevé' ? 'bg-red-100 text-red-700' : 
                                                                risk.severity === 'Moyen' ? 'bg-orange-100 text-orange-700' : 
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>{risk.severity}</span>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-800 mt-1">{risk.description}</p>
                                                    </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="bg-ekie-50 p-6 rounded-2xl border border-ekie-100">
                                            <h3 className="font-serif font-bold text-lg text-ekie-900 mb-3">Recommandations</h3>
                                            <ul className="list-disc list-inside text-sm text-ekie-800 space-y-2 ml-1">
                                                {selectedCase.analysis.actions.map((action, idx) => (
                                                    <li key={idx}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Draft */}
                                        <div className="bg-slate-900 text-slate-200 p-8 rounded-2xl shadow-xl">
                                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                                <h3 className="font-serif font-bold text-white">Projet de réponse</h3>
                                                <button className="text-xs bg-ekie-600 hover:bg-ekie-500 text-white px-3 py-1.5 rounded transition">Copier</button>
                                            </div>
                                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed opacity-90">{selectedCase.analysis.draftResponse}</pre>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* VIEW: CHAT */}
                        {activeTab === 'chat' && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="h-full flex flex-col"
                            >
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {selectedCase.chatHistory.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                            <ChatIcon />
                                            <p className="mt-4 text-sm font-medium">Posez une question sur le document</p>
                                        </div>
                                    ) : (
                                        selectedCase.chatHistory.map((msg, idx) => (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={idx} 
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                    msg.role === 'user' 
                                                        ? 'bg-ekie-900 text-white rounded-tr-sm' 
                                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                                                }`}>
                                                    {msg.text}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                    {isChatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex items-center gap-2">
                                                <span className="w-2 h-2 bg-ekie-400 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-ekie-400 rounded-full animate-bounce delay-100"></span>
                                                <span className="w-2 h-2 bg-ekie-400 rounded-full animate-bounce delay-200"></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                
                                <div className="p-4 bg-white border-t border-slate-100">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Posez votre question à l'assistant..."
                                            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-ekie-500 focus:border-transparent outline-none transition-all"
                                        />
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={!chatInput.trim() || isChatLoading}
                                            className="absolute right-2 top-2 p-1.5 bg-ekie-900 text-white rounded-lg hover:bg-ekie-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <SendIcon />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-center text-slate-400 mt-2">L'IA peut faire des erreurs. Vérifiez les informations importantes.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="w-24 h-24 bg-white shadow-xl rounded-full flex items-center justify-center mb-6 z-10">
                <span className="text-4xl">⚖️</span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-ekie-900 mb-2 z-10">Bienvenue sur Ekie</h2>
            <p className="text-slate-500 z-10">Sélectionnez un dossier pour commencer l'analyse.</p>
          </div>
        )}
      </main>
    </div>
  );
};