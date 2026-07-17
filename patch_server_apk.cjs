const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const apkRoute = `  // Explicit route for APK download to prevent downloading as .zip
  app.get("*.apk", (req, res) => {
    const fileName = path.basename(req.path);
    const publicPath = path.join(process.cwd(), 'public', fileName);
    const distPath = path.join(process.cwd(), 'dist', fileName);
    
    // Set headers explicitly
    const options = {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="' + fileName + '"'
      }
    };

    res.sendFile(publicPath, options, (err) => {
      if (err) {
        res.sendFile(distPath, options, (err2) => {
          if (err2) {
            res.status(404).send("File APK tidak ditemukan. Harap pastikan file APK sudah di-upload ke folder public atau dist.");
          }
        });
      }
    });
  });

  // Vite middleware for development`;

code = code.replace(/  \/\/ Vite middleware for development/, apkRoute);

fs.writeFileSync('server.ts', code);
console.log("Done patching server.ts for APK downloads");
