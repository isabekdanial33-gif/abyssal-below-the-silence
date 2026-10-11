// Сборка macOS-версии (запускать на Mac): node tools/package-mac.cjs <arm64|x64> <версия>
const { packager } = require('@electron/packager');
const arch = process.argv[2] || 'arm64';
const other = arch === 'arm64' ? 'x64' : 'arm64';
packager({
  dir: '.', name: 'ABYSSAL', platform: 'darwin', arch, out: 'release', overwrite: true,
  appVersion: process.argv[3] || '1.0.0', icon: 'electron/icon.icns',
  appBundleId: 'com.abyssal.belowthesilence', appCategoryType: 'public.app-category.games',
  osxSign: false,
  asar: { unpackDir: '**/node_modules/steamworks.js/dist' },
  ignore: [/^\/(src|public|tools|release|site|steam|\.git|\.github|index\.html|vite\.config\.js|\.env\.fish|VOICE_.*|LISTEN_.*)/, /^\/node_modules\/(?!steamworks\.js)/, /steamworks\.js\/dist\/(linux64|win64)/, new RegExp('steamworksjs\\.darwin-' + other)]
}).then((p) => console.log('ok', p));
