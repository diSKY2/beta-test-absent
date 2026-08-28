const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8');

const target = `  useEffect(() => {
    fetch(API_BASE_URL + '/api/app-version')`;

const replacement = `  useEffect(() => {
    const isNativeAndroid = (window as any).Capacitor?.isNativePlatform() && navigator.userAgent.toLowerCase().includes('android');
    if (!isNativeAndroid) return; // Prevent iOS PWA or Web from seeing APK update prompts

    fetch(API_BASE_URL + '/api/app-version')`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/EmployeePortal.tsx', content);
