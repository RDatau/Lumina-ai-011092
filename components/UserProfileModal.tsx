import React, { useState, useRef } from 'react';
import { UserProfile, GlobalAppearance } from '../types';
import { Eye, EyeOff, Key, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onLoadGlobal: () => Promise<UserProfile | null>;
  onSignOut?: () => void;
  appearance: GlobalAppearance;
  themeHex?: string;
  isEmbeddedPage?: boolean;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, profile, onSave, onLoadGlobal, onSignOut, appearance, themeHex, isEmbeddedPage = false }) => {
  const [name, setName] = useState(profile.name || '');
  const [personalityInfo, setPersonalityInfo] = useState(profile.personalityInfo || '');
  const [profilePic, setProfilePic] = useState<string | null>(profile.profilePic || null);
  const [isDraggingImport, setIsDraggingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state with props when modal opens or profile changes
  React.useEffect(() => {
    if (isOpen) {
      setName(profile.name || '');
      setPersonalityInfo(profile.personalityInfo || '');
      setProfilePic(profile.profilePic || null);
    }
  }, [isOpen, profile.name, profile.personalityInfo, profile.profilePic]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      ...profile,
      name,
      personalityInfo,
      profilePic
    });
    onClose();
  };

  const handleExport = () => {
    const data = {
      name,
      personalityInfo,
      profilePic,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile_${name.toLowerCase().replace(/\s+/g, '_') || 'user'}_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.name !== undefined) setName(data.name);
          if (data.personalityInfo !== undefined) setPersonalityInfo(data.personalityInfo);
          if (data.profilePic !== undefined) setProfilePic(data.profilePic);
          alert("Profil berhasil di-import! Jangan lupa klik Simpan ya sayang.. 💦");
        } catch (err) {
          alert("Gagal baca file profil. Pastikan formatnya bener ya..");
        }
      };
      reader.readAsText(file);
    }
  };

  const onDragOverImport = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImport(true);
  };

  const onDragLeaveImport = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImport(false);
  };

  const onDropImport = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImport(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.json')) {
      handleImport(file);
    }
  };

  const handleSyncGlobal = async () => {
    const globalProfile = await onLoadGlobal();
    if (globalProfile) {
      setName(globalProfile.name || '');
      setPersonalityInfo(globalProfile.personalityInfo || '');
      setProfilePic(globalProfile.profilePic || null);
      alert("Profil berhasil disinkronkan dengan data global! Mmmh, makin kenal deh.. 💦");
    } else {
      alert("Belum ada profil global yang tersimpan sayang..");
    }
  };

  const isDark = appearance.isBackgroundDark;
  const glassOpacity = (appearance?.transparency ?? 0) / 100;
  
  const dynamicTextColor = isDark ? 'text-white' : 'text-zinc-900';
  const dynamicMutedTextColor = isDark ? 'text-white/70' : 'text-zinc-500';
  const dynamicBorderColor = isDark ? 'border-white/20' : 'border-black/5';

  const getContrastColor = (hex?: string) => {
    if (!hex) return 'white';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
  };

  const themeContrastColor = getContrastColor(themeHex);
  const themeTextClass = themeContrastColor === 'black' ? 'text-black' : 'text-white';

  const contentNode = (
    <div 
      className={`relative w-full ${isEmbeddedPage ? 'h-full rounded-none border-none shadow-none pb-[85px] md:pb-0 overflow-y-auto custom-scrollbar' : 'max-w-lg rounded-[40px] shadow-2xl max-h-[90vh] border ' + dynamicBorderColor} ${isDark ? 'bg-zinc-950/90' : 'bg-white/90'} backdrop-blur-2xl overflow-hidden animate-in fade-in duration-300 flex flex-col`}
      onContextMenu={(e) => {
        // Biarkan event context menu naik ke window agar ditangani oleh App.tsx
        // Jangan stopPropagation di sini
      }}
      style={{
        backdropFilter: (appearance?.blur ?? 40) === 0 ? 'none' : `blur(${appearance?.blur ?? 40}px)`,
        WebkitBackdropFilter: (appearance?.blur ?? 40) === 0 ? 'none' : `blur(${appearance?.blur ?? 40}px)`
      }}
    >
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-5 rounded-full`} style={{ backgroundColor: themeHex || '#6366f1' }} />
            <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${dynamicTextColor}`}>Profil Kamu</h2>
          </div>
          {!isEmbeddedPage && (
            <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'} transition-all ${dynamicMutedTextColor}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
          {/* 1. Profile Picture & Name */}
          <section className="space-y-4">
            <label className={`text-[10px] font-black ${dynamicMutedTextColor} uppercase tracking-[0.3em] ml-1 select-none`}>Foto Profil & Nama</label>
            <div className={`p-6 rounded-[32px] border ${dynamicBorderColor} bg-black/20 relative overflow-hidden`}>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div 
                    className={`w-20 h-20 rounded-[28px] overflow-hidden border-2 shadow-xl bg-black/40 transition-all duration-500 ${isDark ? 'border-white/10' : 'border-black/10'}`}
                  >
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500/20">
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                    )}
                  </div>
                  <label 
                    className="absolute -bottom-1 -right-1 p-2 rounded-xl cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-lg border border-white/20"
                    style={{ backgroundColor: themeHex || '#6366f1' }}
                  >
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                    <svg className={`h-3 w-3 ${themeTextClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  </label>
                </div>
                
                <div className="flex-1 space-y-1">
                  <input 
                    type="text" 
                    className={`w-full bg-transparent border-none p-0 outline-none font-black ${dynamicTextColor} text-xl placeholder:${isDark ? 'text-white/10' : 'text-black/10'} select-none`} 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Nama Kamu..." 
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeHex || '#6366f1' }}></span>
                    <p className={`text-[9px] font-bold ${dynamicMutedTextColor} uppercase tracking-widest`}>User Aktif</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Personality Info */}
          <section className="space-y-4">
            <label className={`text-[10px] font-black ${dynamicMutedTextColor} uppercase tracking-[0.3em] ml-1 select-none`}>Tentang Kamu (Personality Info)</label>
            <textarea 
              className={`w-full h-32 ${isDark ? 'bg-white/5' : 'bg-black/5'} border ${dynamicBorderColor} rounded-2xl px-5 py-4 outline-none resize-none text-sm font-medium custom-scrollbar ${isDark ? 'text-white/80' : 'text-black/80'} shadow-inner leading-relaxed select-none`} 
              placeholder="Ceritain dikit tentang kamu biar Agen lebih kenal..."
              value={personalityInfo} 
              onChange={(e) => setPersonalityInfo(e.target.value)} 
            />
            <p className={`text-[9px] leading-relaxed ${isDark ? 'text-white/30' : 'text-black/30'} px-1`}>
              Info ini bakal dipake Agen buat nyesuaiin gaya ngobrol dan ngenalin kamu lebih deket.
            </p>
          </section>

          {/* 4. Import / Export */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between select-none">
              <label className={`text-[10px] font-black ${dynamicMutedTextColor} uppercase tracking-[0.3em] ml-1`}>Backup & Restore Profil</label>
              <button 
                onClick={handleSyncGlobal}
                className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${dynamicBorderColor} ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white' : 'bg-black/5 hover:bg-black/10 text-black/40 hover:text-black'} transition-all`}
              >
                Sync Global
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExport}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border ${dynamicBorderColor} ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-black/5 hover:bg-black/10 text-black/80'} transition-all text-[10px] font-black uppercase tracking-widest`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export
              </button>
              <button 
                onClick={() => importInputRef.current?.click()}
                onDragOver={onDragOverImport}
                onDragLeave={onDragLeaveImport}
                onDrop={onDropImport}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${isDraggingImport ? 'bg-indigo-500/20 border-indigo-500 scale-[1.05] shadow-xl' : `${dynamicBorderColor} ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-black/5 hover:bg-black/10 text-black/80'}`}`}
              >
                <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDraggingImport ? 'text-indigo-500 animate-bounce' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isDraggingImport ? 'Lepas Profil' : 'Import'}
              </button>
            </div>
          </section>

          {/* 5. Account Actions - Removed Sign Out */}
        </div>

        {/* Footer */}
        <div className="p-6 flex gap-3">
          <button 
            onClick={onClose}
            className={`flex-1 py-4 rounded-[25px] font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 ${isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10'}`}
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            className={`flex-1 text-white font-black py-4 rounded-[25px] shadow-xl active:scale-[0.98] transition-all uppercase tracking-[0.3em] text-[10px] opacity-90 hover:opacity-100`}
            style={{ backgroundColor: themeHex || '#6366f1' }}
          >
            Simpan
          </button>
        </div>
      </div>
  );

  if (isEmbeddedPage) {
    return contentNode;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      {contentNode}
    </div>
  );
};

export default UserProfileModal;

