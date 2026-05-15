import React from 'react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const atsTips = [
    { title: 'Standard Fonts Only', desc: 'ATS systems struggle with custom or non-web-safe fonts. Stick to Arial, Calibri, or Roboto.', icon: 'text_format' },
    { title: 'Single Column Layout', desc: 'Avoid complex grids or side-by-side columns; they can confuse the machine reading order.', icon: 'view_agenda' },
    { title: 'No Images or Charts', desc: 'Graphics are often ignored by crawlers. Keep your skills and data in plain text.', icon: 'image_not_supported' },
    { title: 'Standard Headings', desc: 'Use clear, conventional headings like "Experience" and "Education" for better parsing.', icon: 'title' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 transition-all">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Success Center</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Everything you need to beat the machine.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
          
          {/* ATS Tips Grid */}
          <section>
            <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 px-1">ATS Essentials</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {atsTips.map((tip, i) => (
                <div key={i} className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900/50 transition-all group">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <span className="material-symbols-rounded text-xl">{tip.icon}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">{tip.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Logic Section */}
          <section className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[32px] border border-blue-100 dark:border-blue-900/20">
             <div className="flex items-start gap-4 mb-4">
                <span className="material-symbols-rounded text-blue-600 dark:text-blue-400">psychology</span>
                <h3 className="font-bold text-slate-900 dark:text-white">How does Resumify calculate my score?</h3>
             </div>
             <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Our AI analyzes two critical factors: **Readability** (formatting issues that confuse ATS) and **Matching** (keyword density compared to your target role). A high score means your resume is both easy for machines to read and highly relevant to the hiring manager's needs.
             </p>
             <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold shadow-sm">Keyword Mapping</span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold shadow-sm">Semantic Context</span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold shadow-sm">Parsing Logic</span>
             </div>
          </section>

          {/* Contact Support */}
          <section className="text-center pt-4 pb-2">
             <h4 className="font-bold text-slate-900 dark:text-white mb-4">Still need help?</h4>
             <a 
               href="mailto:support@resumify.ai" 
               className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
             >
               <span className="material-symbols-rounded text-xl">mail</span>
               Contact Support
             </a>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpModal;
