const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Approvals.tsx', 'utf8');

// Add selectedImage state
code = code.replace(/const \[searchHistory, setSearchHistory\] = useState\(''\);/,
`const [searchHistory, setSearchHistory] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);`);

// Replace the photoUrl link
code = code.replace(/<a href=\{req\.photoUrl\} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2">/g,
`<button onClick={() => setSelectedImage(req.photoUrl)} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2 cursor-pointer">`);
code = code.replace(/<\/a>/g, `</button>`);

// Add modal before the last </div>
const modalCode = `
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Bukti Foto" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          <button 
            className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}`;

code = code.replace(/<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*\}/, `</div>
      </div>
      )}` + modalCode);

fs.writeFileSync('src/pages/admin/Approvals.tsx', code);
console.log("Done patching Approvals.tsx");
