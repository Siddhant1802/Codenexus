import React, { useState } from 'react';
import { Play, Download, Copy, Settings, Code2, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

const languages = [
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', icon: 'JS' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚡' },
  { id: 'ruby', name: 'Ruby', icon: '💎' },
  { id: 'go', name: 'Go', icon: '🔵' },
  { id: 'rust', name: 'Rust', icon: '⚙️' },
  { id: 'php', name: 'PHP', icon: '🐘' },
  { id: 'swift', name: 'Swift', icon: '🦅' },
  { id: 'csharp', name: 'C#', icon: '#' },
];

function App() {
  const [code, setCode] = useState('# Write your code here\nprint("Hello, CodeNexus!")');
  const [output, setOutput] = useState('');
  const [selectedLang, setSelectedLang] = useState('python');
  const [theme, setTheme] = useState('dark');

  const handleRunCode = () => {
    setOutput('');
    const dots = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    
    const loadingInterval = setInterval(() => {
      setOutput(prev => prev + dots[i] + ' Executing...\n');
      i = (i + 1) % dots.length;
    }, 100);

    setTimeout(() => {
      clearInterval(loadingInterval);
      setOutput('Program output:\nHello, CodeNexus!\n\nExecution completed successfully ✨');
    }, 1500);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col`}>
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 shadow-lg"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
          >
            <Terminal className="h-8 w-8" />
            <h1 className="text-2xl font-bold">CodeNexus</h1>
          </motion.div>
          <nav className="hidden md:flex space-x-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              Toggle Theme
            </motion.button>
          </nav>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Left Half - Code Editor */}
        <div className="w-1/2 flex">
          {/* Language Selector Sidebar */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4"
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedLang(lang.id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                  selectedLang === lang.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {lang.icon}
              </motion.button>
            ))}
          </motion.div>

          {/* Code Editor */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} flex-1 flex flex-col`}>
              <div className="border-b border-gray-700 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-semibold">
                    {languages.find(l => l.id === selectedLang)?.name}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRunCode}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
                  >
                    <Play className="h-4 w-4" />
                    <span>Run</span>
                  </motion.button>
                </div>
                <div className="flex items-center space-x-2">
                  {[Download, Copy, Settings].map((Icon, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.button>
                  ))}
                </div>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`flex-1 w-full p-4 font-mono text-sm focus:outline-none ${
                  theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
                }`}
                spellCheck="false"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Half - Output Panel */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`w-1/2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-l border-gray-700`}
        >
          <div className="border-b border-gray-700 p-4">
            <h2 className="font-semibold">Output</h2>
          </div>
          <div className={`p-4 font-mono text-sm whitespace-pre-wrap h-[calc(100vh-8.5rem)] overflow-auto ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            {output || 'Run your code to see the output here...'}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-4">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 CodeNexus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;