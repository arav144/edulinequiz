const fs = require('fs');
const path = 'c:/Users/USER/Desktop/112/Quiz-System/frontend/components/StudentRegistrationModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Colors replacement map
const replacements = [
  { search: /bg-amber-100 text-amber-700/g, replace: 'bg-[#2d7995]/10 text-[#2d7995]' },
  { search: /focus:border-amber-600 focus:ring-4 focus:ring-amber-100/g, replace: 'focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/20' },
  { search: /bg-amber-50\/70/g, replace: 'bg-[#2d7995]/5' },
  { search: /border-amber-200\/80/g, replace: 'border-[#2d7995]/20' },
  { search: /text-amber-700/g, replace: 'text-[#2d7995]' },
  { search: /bg-amber-600/g, replace: 'bg-[#2d7995]' },
  { search: /text-amber-600/g, replace: 'text-[#2d7995]' },
  { search: /border-amber-600/g, replace: 'border-[#2d7995]' },
  { search: /bg-amber-50/g, replace: 'bg-[#2d7995]/5' },
  { search: /text-amber-900/g, replace: 'text-[#2d7995]' },
  { search: /bg-amber-100\/70/g, replace: 'bg-[#2d7995]/10' },
  { search: /focus:ring-amber-500/g, replace: 'focus:ring-[#2d7995]' },
  { search: /bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700/g, replace: 'bg-[#2d7995] hover:bg-[#2d7995]/90' },
  { search: /bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700/g, replace: 'bg-[#2d7995] hover:bg-[#2d7995]/90' },
  { search: /bg-amber-600 hover:bg-amber-700/g, replace: 'bg-[#2d7995] hover:bg-[#2d7995]/90' },
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync(path, content, 'utf8');
console.log('Replacements done successfully!');
