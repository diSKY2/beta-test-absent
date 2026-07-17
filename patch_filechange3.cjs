const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

code = code.replace(/const handleFileChange = async \(e: React\.ChangeEvent<HTMLInputElement>, setter: \(val: string\) => void\) => \{[\s\S]*?reader\.readAsDataURL\(file\);\n    \}\n  \};/m,
`const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         const dataUrl = reader.result as string;
         const img = new Image();
         img.onload = () => {
             const canvas = document.createElement('canvas');
             let width = img.width;
             let height = img.height;
             const MAX = 1024;
             if (width > MAX) {
                 height = Math.round(height * MAX / width);
                 width = MAX;
             }
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 ctx.drawImage(img, 0, 0, width, height);
                 setter(canvas.toDataURL('image/jpeg', 0.6));
                 triggerToast('Berkas foto berhasil diunggah!');
             } else {
                 setter(dataUrl);
             }
         };
         img.onerror = () => setter(dataUrl);
         img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };`);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
console.log("Done patching HTML");
