const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

// Update handleCapturePhoto
code = code.replace(/const handleCapturePhoto = async \(setter: \(val: string\) => void\) => \{[\s\S]*?\} else \{/m, 
`const handleCapturePhoto = async (setter: (val: string) => void) => {
    if (isNative) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 50,
          width: 800,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          direction: 'REAR' as any
        });
        if (image.dataUrl) {
           setter(image.dataUrl);
           triggerToast('Foto berhasil ditangkap!');
        }
      } catch (e: any) {
        console.error("Native camera error:", e);
      }
    } else {`);

// Update handleNativeCamera
code = code.replace(/const handleNativeCamera = async \(\) => \{[\s\S]*?setCameraError\("Gagal mengambil foto dari kamera sistem\."\);\n    \}\n  \};/m,
`const handleNativeCamera = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 50,
        width: 800,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: 'FRONT' as any
      });
      if (image.dataUrl) {
         setSelfiePreview(image.dataUrl);
         setCameraError(null);
      }
    } catch (e: any) {
      console.error("Native camera error:", e);
      setCameraError("Gagal mengambil foto dari kamera sistem.");
    }
  };`);

// Update handleFileChange
code = code.replace(/const handleFileChange = async \(e: React\.ChangeEvent<HTMLInputElement>, setter: \(val: string\) => void\) => \{[\s\S]*?reader\.readAsDataURL\(file\);\n    \}\n  \};/m,
`const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setter(reader.result as string);
        triggerToast('Berkas foto berhasil diunggah!');
      };
      reader.readAsDataURL(file);
    }
  };`);

// Update captureSelfie (web canvas)
code = code.replace(/const captureSelfie = async \(\) => \{[\s\S]*?canvas\.height\);\n        const dataUrl = canvas\.toDataURL\('image\/jpeg'\);\n        const compressed = await compressImageToDataURL\(dataUrl, 200\);\n        setSelfiePreview\(compressed\);\n        if \(cameraStream\) \{/m,
`const captureSelfie = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setSelfiePreview(dataUrl);
        if (cameraStream) {`);

fs.writeFileSync('src/pages/EmployeePortal.tsx', code);
console.log("Done patching camera and file methods");
