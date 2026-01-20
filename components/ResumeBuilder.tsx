import React, { useState, useEffect } from 'react';
import { ResumeData, User } from '../types';
import { INITIAL_RESUME_STATE } from '../constants';
import { generateResumeAI } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { Save, Sparkles, Download, Plus, Trash2, FileText, Check } from 'lucide-react';

interface ResumeBuilderProps {
    user?: User | null; // User might be null initially
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ user }) => {
  const [formData, setFormData] = useState<ResumeData>(INITIAL_RESUME_STATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');

  // Load existing resume on mount
  useEffect(() => {
    if (!user) return;
    
    const loadResume = async () => {
        const { data } = await supabase.from('resumes').select('*').eq('user_id', user.id).single();
        if (data) {
            setFormData(data.content_json);
            setGeneratedMarkdown(data.resume_text || '');
        }
    };
    loadResume();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
    const newExp = [...formData.experience];
    // @ts-ignore
    newExp[index][field] = value;
    setFormData(prev => ({ ...prev, experience: newExp }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { role: '', company: '', duration: '', details: '' }]
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateResumeAI(formData);
    setGeneratedMarkdown(result);
    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    // Check if resume exists
    const { data: existing } = await supabase.from('resumes').select('id').eq('user_id', user.id).single();

    let error;
    if (existing) {
        // Update
        const { error: err } = await supabase.from('resumes').update({
            content_json: formData,
            resume_text: generatedMarkdown
        }).eq('user_id', user.id);
        error = err;
    } else {
        // Insert
        const { error: err } = await supabase.from('resumes').insert({
            user_id: user.id,
            content_json: formData,
            resume_text: generatedMarkdown
        });
        error = err;
    }

    setIsSaving(false);
    if (!error) {
        setLastSaved(new Date());
    } else {
        alert("Failed to save resume");
        console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
        <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            Resume Details
          </h2>
          <p className="text-sm text-slate-500 mt-1">Enter your details to generate an ATS-optimized resume.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                name="fullName" value={formData.fullName} onChange={handleInputChange} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input 
                name="email" value={formData.email} onChange={handleInputChange} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="john@example.com"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Skills (Comma Separated)</label>
              <input 
                name="skills" value={formData.skills} onChange={handleInputChange} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="React, Node.js, Project Management..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Professional Summary Draft</label>
            <textarea 
              name="summary" value={formData.summary} onChange={handleInputChange} 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 resize-none"
              placeholder="Briefly describe your career goals and key achievements..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-slate-700">Experience</label>
              <button onClick={addExperience} className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1 font-medium">
                <Plus size={14} /> Add Role
              </button>
            </div>
            <div className="space-y-4">
              {formData.experience.map((exp, idx) => (
                <div key={idx} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 relative group">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      placeholder="Job Role" value={exp.role} onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                    />
                    <input 
                      placeholder="Company" value={exp.company} onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm"
                    />
                  </div>
                  <textarea 
                    placeholder="Key responsibilities and achievements..." value={exp.details} onChange={(e) => handleExperienceChange(idx, 'details', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm h-20 resize-none"
                  />
                  {idx > 0 && (
                    <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-between items-center">
            <div className="text-xs text-slate-400">
                {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
            </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate AI Resume
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-white font-medium flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            Resume Preview (Markdown)
          </h2>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
              <Download size={18} />
            </button>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-green-400 transition-colors flex items-center gap-1"
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <textarea
            className="w-full h-full bg-slate-800 text-slate-300 p-6 font-mono text-sm resize-none outline-none leading-relaxed"
            value={generatedMarkdown}
            onChange={(e) => setGeneratedMarkdown(e.target.value)}
            placeholder="Your AI-generated resume will appear here..."
          />
          {!generatedMarkdown && !isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
              <Sparkles size={48} className="mb-4 opacity-50" />
              <p>Fill the form and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;