const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add new state variables for editing
content = content.replace(
  /const \[editKbText, setEditKbText\] = useState\(''\);/,
  `const [editKbText, setEditKbText] = useState('');
  const [editSystemPrompt, setEditSystemPrompt] = useState('');
  const [editWelcomeMessage, setEditWelcomeMessage] = useState('');
  const [editUrls, setEditUrls] = useState<string[]>(['']);
  const [editFiles, setEditFiles] = useState<File[]>([]);

  const addEditUrl = () => setEditUrls([...editUrls, '']);
  const updateEditUrl = (index: number, value: string) => {
    const next = [...editUrls];
    next[index] = value;
    setEditUrls(next);
  };
  const removeEditUrl = (index: number) => setEditUrls(editUrls.filter((_, i) => i !== index));

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditFiles(Array.from(e.target.files));
    }
  };
  const removeEditFile = (index: number) => setEditFiles(editFiles.filter((_, i) => i !== index));`
);

// 2. Update startEditingBot to reset new states
content = content.replace(
  /const startEditingBot = \(bot: any\) => \{\n\s+setEditingBotId\(bot.id\);\n\s+setEditKbText\(bot.knowledgeBaseText \|\| ''\);\n\s+\};/,
  `const startEditingBot = (bot: any) => {
    setEditingBotId(bot.id);
    setEditKbText(bot.knowledgeBaseText || '');
    setEditSystemPrompt(bot.systemPrompt || '');
    setEditWelcomeMessage(bot.welcomeMessage || '');
    setEditUrls(['']);
    setEditFiles([]);
  };`
);

// 3. Update cancelEditingBot
content = content.replace(
  /const cancelEditingBot = \(\) => \{\n\s+setEditingBotId\(null\);\n\s+setEditKbText\(''\);\n\s+\};/,
  `const cancelEditingBot = () => {
    setEditingBotId(null);
    setEditKbText('');
    setEditSystemPrompt('');
    setEditWelcomeMessage('');
    setEditUrls(['']);
    setEditFiles([]);
  };`
);

// 4. Update saveBotEdits to send FormData
content = content.replace(
  /const saveBotEdits = async \(botId: string\) => \{\n\s+if \(!walletAddress\) return;\n\s+setIsSavingEdit\(true\);\n\s+try \{\n\s+const res = await fetch\('\/api\/bots\/edit', \{\n\s+method: 'POST',\n\s+headers: \{ 'Content-Type': 'application\/json' \},\n\s+body: JSON.stringify\(\{\n\s+botId,\n\s+ownerWallet: walletAddress,\n\s+knowledgeBaseText: editKbText\.trim\(\),\n\s+\}\),\n\s+\}\);/,
  `const saveBotEdits = async (botId: string) => {
    if (!walletAddress) return;
    setIsSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append('botId', botId);
      formData.append('ownerWallet', walletAddress);
      formData.append('knowledgeBaseText', editKbText.trim());
      if (editSystemPrompt) formData.append('systemPrompt', editSystemPrompt);
      if (editWelcomeMessage) formData.append('welcomeMessage', editWelcomeMessage);

      const validUrls = editUrls.filter(u => u.trim());
      if (validUrls.length > 0) {
        formData.append('urls', JSON.stringify(validUrls));
      }

      for (const file of editFiles) {
        formData.append('files', file);
      }

      const res = await fetch('/api/bots/edit', {
        method: 'POST',
        body: formData,
      });`
);

// 5. Update saveBotEdits success callback
content = content.replace(
  /setMyBots\(myBots.map\(b => \(b.id === botId \? \{ \.\.\.b, knowledgeBaseText: data\.bot\.knowledgeBaseText \} : b\)\)\);/,
  `setMyBots(myBots.map(b => (b.id === botId ? { ...b, knowledgeBaseText: data.bot.knowledgeBaseText, systemPrompt: data.bot.systemPrompt, welcomeMessage: data.bot.welcomeMessage } : b)));`
);

// 6. Replace edit modal UI
const oldEditUI = `<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Edit Knowledge Base
                        </label>
                        <textarea
                          rows={6}
                          className={\`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] \${isDarkMode ? 'border-slate-800 bg-slate-800/50 text-white' : 'border-slate-200 bg-white/50 text-slate-900'}\`}
                          value={editKbText}
                          onChange={e => setEditKbText(e.target.value)}
                        />
                        <div className="flex gap-2">`;

const newEditUI = `<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Edit System Prompt (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="You are a helpful assistant..."
                          className={\`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] \${isDarkMode ? 'border-slate-800 bg-slate-800/50 text-white' : 'border-slate-200 bg-white/50 text-slate-900'}\`}
                          value={editSystemPrompt}
                          onChange={e => setEditSystemPrompt(e.target.value)}
                        />

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Edit Welcome Message (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Hi! How can I help you today?"
                          className={\`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] \${isDarkMode ? 'border-slate-800 bg-slate-800/50 text-white' : 'border-slate-200 bg-white/50 text-slate-900'}\`}
                          value={editWelcomeMessage}
                          onChange={e => setEditWelcomeMessage(e.target.value)}
                        />

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Edit Manual Knowledge Base
                        </label>
                        <textarea
                          rows={6}
                          className={\`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] \${isDarkMode ? 'border-slate-800 bg-slate-800/50 text-white' : 'border-slate-200 bg-white/50 text-slate-900'}\`}
                          value={editKbText}
                          onChange={e => setEditKbText(e.target.value)}
                        />

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Add More Documentation URLs
                        </label>
                        <div className="space-y-2">
                          {editUrls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="url"
                                placeholder="https://docs.example.com"
                                className={\`flex-1 rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] \${isDarkMode ? 'border-slate-800 bg-slate-800/50 text-white' : 'border-slate-200 bg-white/50 text-slate-900'}\`}
                                value={url}
                                onChange={(e) => updateEditUrl(index, e.target.value)}
                              />
                              {editUrls.length > 1 && (
                                <button type="button" onClick={() => removeEditUrl(index)} className="rounded-xl px-2 py-1 text-slate-400 hover:text-red-500 transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button type="button" onClick={addEditUrl} className={\`text-xs font-semibold transition-colors \${isDarkMode ? 'text-[#0088cc] hover:text-[#00aaee]' : 'text-[#0088cc] hover:text-[#00aaee]'}\`}>
                            + Add another URL
                          </button>
                        </div>

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Add More Knowledge Base Files
                        </label>
                        <div>
                          <input
                            type="file"
                            multiple
                            accept=".txt,.pdf,.md"
                            onChange={handleEditFileChange}
                            className={\`block w-full text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-[#0088cc]/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0088cc] hover:file:bg-[#0088cc]/20 \${isDarkMode ? 'text-slate-400' : 'text-slate-500'}\`}
                          />
                          {editFiles.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {editFiles.map((file, i) => (
                                <div key={i} className={\`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] \${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}\`}>
                                  <span className="truncate pr-2">{file.name}</span>
                                  <button type="button" onClick={() => removeEditFile(i)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">`;

content = content.replace(oldEditUI, newEditUI);

fs.writeFileSync('src/app/page.tsx', content);
