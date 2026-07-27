const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Monitoring.tsx', 'utf8');

if (!code.includes('selectedPhoto')) {
  code = code.replace("const [expandedSubDepts, setExpandedSubDepts] = useState<Record<string, boolean>>({});", "const [expandedSubDepts, setExpandedSubDepts] = useState<Record<string, boolean>>({});\n  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);");
}

code = code.replace(/<a href=\{([^}]+)\} target="_blank" rel="noopener noreferrer" className="([^"]+)">\s*<img src=\{([^}]+)\} alt="([^"]+)" referrerPolicy="no-referrer" className="([^"]+)" \/>\s*<\/a>/g, 
  `<button onClick={() => setSelectedPhoto($1)} className="$2 cursor-pointer">\n                                                            <img src={$3} alt="$4" referrerPolicy="no-referrer" className="$5" />\n                                                          </button>`);

const modalCode = `
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button 
              className="absolute -top-4 -right-4 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-red-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
            >
              ×
            </button>
            <img src={selectedPhoto} alt="Bukti Foto Besar" referrerPolicy="no-referrer" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border-4 border-white/10" />
            <div className="mt-4 text-white font-mono text-sm uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full border border-white/20">
              Bukti Foto Absensi
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

code = code.replace(/    <\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/, `    </div>\n      </div>\n${modalCode}`);

fs.writeFileSync('src/pages/admin/Monitoring.tsx', code);
