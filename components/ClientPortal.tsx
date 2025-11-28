import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientRequest } from '../types';
import { UploadIcon, FileIcon, CheckCircleIcon } from './ui/Icons';

interface Props {
  onSubmit: (request: Omit<ClientRequest, 'id' | 'status' | 'submittedAt' | 'chatHistory'>) => void;
}

export const ClientPortal: React.FC<Props> = ({ onSubmit }) => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    clientName: 'Sophie Dubois',
    clientEmail: 'sophie.dubois@email.com',
    message: 'Bonjour Maître, je viens de signer ce contrat. Je travaille actuellement à Paris mais je prévois de déménager à Bordeaux dans 6 mois. Est-ce que ce contrat me permet de le faire sans renégocier ? Merci.',
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileBase64) return;

    onSubmit({
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      message: formData.message,
      fileName: file.name,
      fileType: file.type,
      fileBase64: fileBase64,
    });
    setStep(2);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center items-center p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-ekie-100/50 to-transparent -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-ekie-200/20 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-3xl z-10">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-serif font-bold text-ekie-900 mb-3 tracking-tight"
          >
            Ekie
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg font-light tracking-wide"
          >
            L'excellence juridique, simplifiée.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="form"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-ekie-900/5 p-10 border border-white"
            >
              <h2 className="text-2xl font-serif font-semibold text-ekie-900 mb-8 border-l-4 border-ekie-500 pl-4">Nouvelle consultation</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-ekie-600 transition-colors">Votre nom</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-ekie-500 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Jean Dupont"
                      value={formData.clientName}
                      onChange={e => setFormData({...formData, clientName: e.target.value})}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-ekie-600 transition-colors">Votre email</label>
                    <input
                      required
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-ekie-500 outline-none transition-all placeholder:text-slate-300"
                      placeholder="jean.dupont@exemple.com"
                      value={formData.clientEmail}
                      onChange={e => setFormData({...formData, clientEmail: e.target.value})}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-ekie-600 transition-colors">Votre situation</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-ekie-500 outline-none transition-all resize-none placeholder:text-slate-300"
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    placeholder="Décrivez votre situation juridique en quelques phrases..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">Document (Contrat, Lettre, etc.)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative overflow-hidden group border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${file ? 'border-ekie-500 bg-ekie-50/50' : 'border-slate-200 hover:border-ekie-400 hover:bg-slate-50'}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    {file ? (
                      <div className="flex flex-col items-center justify-center text-ekie-900 relative z-10">
                        <div className="bg-white p-3 rounded-full shadow-md mb-3">
                            <FileIcon />
                        </div>
                        <span className="font-semibold text-lg">{file.name}</span>
                        <span className="mt-2 text-xs font-bold tracking-widest bg-ekie-600 text-white px-3 py-1 rounded-full uppercase">Document Prêt</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center relative z-10">
                        <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                            <UploadIcon />
                        </div>
                        <p className="mb-1 text-base font-medium text-slate-600">Glissez votre fichier ici</p>
                        <p className="text-sm text-slate-400">ou cliquez pour parcourir vos dossiers</p>
                      </div>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!file}
                  className="w-full bg-ekie-900 hover:bg-ekie-800 text-white text-lg font-medium py-4 rounded-xl shadow-xl shadow-ekie-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  Soumettre le dossier
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-white/50"
            >
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <CheckCircleIcon />
                </motion.div>
              </div>
              <h2 className="text-3xl font-serif font-bold text-ekie-900 mb-4">Dossier transmis</h2>
              <p className="text-slate-600 mb-10 text-lg leading-relaxed max-w-md mx-auto">
                Votre avocat a bien reçu votre demande et votre document. L'intelligence artificielle Ekie prépare déjà une première analyse.
              </p>
              <button 
                onClick={() => {
                   setStep(1);
                   setFile(null);
                   setFileBase64('');
                }}
                className="text-ekie-600 font-semibold hover:text-ekie-800 transition-colors border-b-2 border-transparent hover:border-ekie-600 pb-1"
              >
                Envoyer un nouveau document
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};