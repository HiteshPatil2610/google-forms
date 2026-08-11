import React from 'react';
import { X, Image, Palette, Type, Check } from 'lucide-react';
import { FormTheme } from '../types';
import { DEFAULT_THEME_COLORS } from '../data/initialData';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: FormTheme;
  onUpdateTheme: (updatedTheme: Partial<FormTheme>) => void;
  darkMode?: boolean;
}

const PRESET_HEADER_IMAGES = [
  { name: 'Abstract Purple', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Tech & Code',     url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Conference',      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Workspace',       url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Geometric',       url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80' },
];

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  isOpen, onClose, theme, onUpdateTheme, darkMode = false,
}) => {
  if (!isOpen) return null;
  const dm = darkMode;

  return (
    <div className={`fixed right-0 top-16 bottom-0 w-80 border-l shadow-xl z-30 flex flex-col overflow-y-auto transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <h3 className={`font-semibold ${dm ? 'text-gray-100' : 'text-gray-800'}`}>Theme options</h3>
        </div>
        <button onClick={onClose} className={`p-1 rounded-full transition-colors ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Header Banner */}
        <div>
          <div className={`flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            <Image className="w-4 h-4 text-purple-600" /><span>Header Banner</span>
          </div>
          <div className="space-y-2">
            <label className={`block text-xs font-medium ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Image URL</label>
            <input type="text" value={theme.headerImage || ''} onChange={(e) => onUpdateTheme({ headerImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className={`w-full p-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-200 ${dm ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-200'}`} />
            <p className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Or pick from preset banners:</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_HEADER_IMAGES.map((img, idx) => (
                <button key={idx} onClick={() => onUpdateTheme({ headerImage: img.url })}
                  className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${theme.headerImage === img.url ? 'border-purple-600 ring-2 ring-purple-300' : dm ? 'border-gray-600' : 'border-transparent'}`}>
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] truncate px-1 py-0.5 text-center">{img.name}</span>
                </button>
              ))}
            </div>
            {theme.headerImage && (
              <button onClick={() => onUpdateTheme({ headerImage: '' })} className="text-xs text-red-600 hover:text-red-800 font-medium pt-1">Remove Header Image</button>
            )}
          </div>
        </div>

        {/* Color palette */}
        <div className={`border-t pt-4 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className={`flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            <Palette className="w-4 h-4 text-purple-600" /><span>Theme Color</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {DEFAULT_THEME_COLORS.map((color) => (
              <button key={color.primary}
                onClick={() => onUpdateTheme({ primaryColor: color.primary, backgroundColor: color.bg })}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer relative shadow-xs"
                style={{ backgroundColor: color.primary }} title={color.name}>
                {theme.primaryColor === color.primary && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Font style */}
        <div className={`border-t pt-4 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className={`flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            <Type className="w-4 h-4 text-purple-600" /><span>Text Font Style</span>
          </div>
          <div className="space-y-1.5">
            {(['Roboto','Decorative','Formal','Playful'] as const).map((font) => (
              <button key={font} onClick={() => onUpdateTheme({ fontStyle: font })}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${theme.fontStyle === font ? (dm ? 'bg-purple-900/40 text-purple-300 font-semibold' : 'bg-purple-50 text-purple-700 font-semibold') : (dm ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}`}>
                <span>{font}</span>
                {theme.fontStyle === font && <Check className="w-3.5 h-3.5 text-purple-600" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
