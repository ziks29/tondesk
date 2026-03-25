const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');
content = content.replace(
  /import \{ FileText, Globe, Loader2, Plus, Settings, Trash2, Upload \} from 'lucide-react';/,
  `import { FileText, Globe, Loader2, Plus, Settings, Trash2, Upload, X } from 'lucide-react';`
);
fs.writeFileSync('src/app/page.tsx', content);
