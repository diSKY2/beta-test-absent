const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// Add compressImageToDataURL import
if (!code.includes('compressImageToDataURL')) {
    code = code.replace("import { cn } from '../lib/utils';", "import { cn, compressImageToDataURL } from '../lib/utils';");
}

code = code.replace(/const handleFileChange = \([\s\S]*?\}\;/m, 
`const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImageToDataURL(reader.result as string, 200);
        setter(compressed);
        triggerToast('Berkas foto berhasil diunggah!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapturePhoto = async (setter: (val: string) => void) => {
    if (isNative) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          direction: 'REAR' as any
        });
        if (image.dataUrl) {
           const compressed = await compressImageToDataURL(image.dataUrl, 200);
           setter(compressed);
           triggerToast('Foto berhasil ditangkap!');
        }
      } catch (e: any) {
        console.error("Native camera error:", e);
      }
    } else {
      // Fallback for web if they can't use native: use a hidden input with capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e: any) => handleFileChange(e, setter);
      input.click();
    }
  };`);

// Update reportPhoto input to use handleCapturePhoto
code = code.replace(/<label className="px-4 py\.5 bg-slate-900 border border-slate-800 rounded-xl text-\[10px\] font-black uppercase tracking-widest text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm">\s*<Camera className="w-4 h-4 text-\[\#14B8A6\]" \/>\s*<span>Ambil Foto<\/span>\s*<input\s*type="file"\s*accept="image\/\*"\s*className="hidden"\s*onChange=\{\(e\) => handleFileChange\(e, setReportPhoto\)\}\s*\/>\s*<\/label>/gm,
`<button type="button" onClick={() => handleCapturePhoto(setReportPhoto)} className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm">
  <Camera className="w-4 h-4 text-[#14B8A6]" />
  <span>Ambil Foto</span>
</button>`);

// Update captureSelfie to also compress
code = code.replace(/const captureSelfie = \(\) => \{[\s\S]*?setSelfiePreview\(dataUrl\);/m, 
`const captureSelfie = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const compressed = await compressImageToDataURL(dataUrl, 200);
        setSelfiePreview(compressed);`);

// Update handleNativeCamera to also compress
code = code.replace(/setSelfiePreview\(image\.dataUrl\);/, 
`const compressed = await compressImageToDataURL(image.dataUrl, 200);
         setSelfiePreview(compressed);`);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
console.log("Done patching file change and capture logic");
