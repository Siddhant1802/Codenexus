import { useState, useEffect, useRef } from 'react';
import { Play, Download, Copy, Upload, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

type APIResponse = {
    execution_output: string,
    execution_error: string,
    static_analysis_output: string,
    static_analysis_error: string
}

const languages = [
    { id: 'python', name: 'Python', src: '/python-logo.svg', ext: 'py' },
    {
        id: 'javascript',
        name: 'JavaScript',
        src: '/javascript-logo.svg',
        ext: 'js',
    },
    { id: 'java', name: 'Java', src: '/java-icon.svg', ext: 'java' },
    { id: 'cpp', name: 'C++', src: '/cpp.svg', ext: 'cpp' },
    { id: 'go', name: 'Go', src: 'go-gopher.svg', ext: 'go' },
];

const starterTemplates = {
    python: `# Python Online Compiler
# Write your Python code here and click Run to execute

message = "Try CodeNexus"
print(message)`,

    javascript: `// JavaScript Online Compiler
// Write your JavaScript code here and click Run to execute

const message = "Try CodeNexus";
console.log(message);`,

    java: `// Java Online Compiler
// Write your Java code here and click Run to execute

class Main {
    public static void main(String[] args) {
        String message = "Try CodeNexus";
        System.out.println(message);
    }
}`,

    cpp: `// C++ Online Compiler
// Write your C++ code here and click Run to execute

#include <iostream>
using namespace std;

int main() {
    string message = "Try CodeNexus";
    cout << message << endl;
    return 0;
}`,

    go: `// Go Online Compiler
// Write your Go code here and click Run to execute

package main

import "fmt"

func main() {
    message := "Try CodeNexus"
    fmt.Println(message)
}`,
};

function App() {
    const [selectedLang, setSelectedLang] = useState('python');
    const [code, setCode] = useState(starterTemplates.python);
    const [output, setOutput] = useState('');
    const [theme, setTheme] = useState('dark');
    const preRef = useRef<HTMLPreElement>(null);

    // States for handling file upload functionality
    const [error, setError] = useState('');
    const allowedExtensions = ['py', 'js', 'java', 'cpp', 'go'];
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLanguageChange = (langId: string) => {
        setSelectedLang(langId);
        setCode(starterTemplates[langId as keyof typeof starterTemplates]);
    };

    const handleRunCode = async () => {
        setOutput('');
        const dots = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;

        const loadingInterval = setInterval(() => {
            setOutput(() => dots[i] + ' Executing...\n');
            i = (i + 1) % dots.length;
        }, 100);

        const ext = languages.find((lang) => lang.id === selectedLang)?.ext;
        const fileName = `code.${ext}`;
        const blob = new Blob([code], { type: 'text/plain' }); // optionally use more accurate MIME type
        const file = new File([blob], fileName, { type: 'text/plain' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', selectedLang);

        try {
            const res = await fetch('http://code-nexus-alb-134423841.us-east-2.elb.amazonaws.com/execute_code', {
                method: 'POST',
                body: formData,
            });

            const result: APIResponse = await res.json();
            console.log('Execution result:', result);
            setOutput(result.execution_output + result.static_analysis_output)
        } catch (err) {
            console.error('Upload failed:', err);
            setOutput(JSON.stringify(err))
        }

        clearInterval(loadingInterval);
    };

    const handleCopyCode = () => {
        navigator.clipboard
            .writeText(code)
            .then(() => {
                alert('Code copied to clipboard!');
            })
            .catch((err) => {
                console.error('Failed to copy: ', err);
            });
    };

    const handleDownloadCode = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${selectedLang}-code.${
            languages.find((lang) => lang.id === selectedLang)?.ext
        }`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) return;

        const extension = file.name.split('.').pop();
        if (!allowedExtensions.includes(extension || '')) {
            setError(
                `Only the following file types are allowed: ${allowedExtensions.join(
                    ', '
                )}`
            );
            return;
        }

        setError('');
        setSelectedLang('');
        const extensionToLanguage = (ext: string) =>
            ({
                py: 'python',
                js: 'javascript',
                java: 'java',
                cpp: 'cpp',
                go: 'go',
            }[ext] || 'plaintext');
        setSelectedLang(extensionToLanguage(file.name.split('.').pop() || ''));

        const reader = new FileReader();
        reader.onload = (e) => {
            setCode(e.target?.result as string);
        };
        reader.readAsText(file);

        event.target.value = '';
    };

    useEffect(() => {
        if (preRef.current) {
            const commentRegex =
                selectedLang === 'python' || selectedLang === 'ruby'
                    ? /(#.+)$/gm
                    : /(\/\/.+)$/gm;

            const highlightedCode = code.replace(
                commentRegex,
                '<span class="comment">$1</span>'
            );
            preRef.current.innerHTML = highlightedCode;
        }
    }, [code, selectedLang]);

    return (
        <div
            className={`min-h-screen ${
                theme === 'dark'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-900'
            } flex flex-col`}
        >
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 shadow-lg"
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
                            onClick={() =>
                                setTheme(theme === 'dark' ? 'light' : 'dark')
                            }
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
                                onClick={() => handleLanguageChange(lang.id)}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                                    selectedLang === lang.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <img
                                    src={lang.src}
                                    alt={lang.name}
                                    width={30}
                                />
                            </motion.button>
                        ))}
                    </motion.div>

                    {/* Code Editor */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col"
                    >
                        <div
                            className={`${
                                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                            } flex-1 flex flex-col`}
                        >
                            <div className="border-b border-gray-700 p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-semibold">
                                        {
                                            languages.find(
                                                (l) => l.id === selectedLang
                                            )?.name
                                        }
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
                                    {[Download, Copy, Upload].map((Icon, i) => {
                                        const onClick =
                                            Icon === Download
                                                ? handleDownloadCode
                                                : Icon === Copy
                                                ? handleCopyCode
                                                : Icon === Upload
                                                ? handleUploadClick
                                                : undefined;
                                        return (
                                            <motion.button
                                                key={i}
                                                onClick={onClick}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`p-2 rounded-lg ${
                                                    theme === 'dark'
                                                        ? 'hover:bg-gray-700'
                                                        : 'hover:bg-gray-100'
                                                } transition`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </motion.button>
                                        );
                                    })}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".py,.js,.java,.cpp,.go"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                    {error && (
                                        <p className="text-red-500">{error}</p>
                                    )}
                                </div>
                            </div>
                            <div className="code-editor flex-1">
                                <textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className={`w-full h-full p-4 font-mono text-sm focus:outline-none ${
                                        theme === 'dark'
                                            ? 'text-gray-100'
                                            : 'text-gray-900'
                                    }`}
                                    spellCheck="false"
                                />
                                <pre
                                    ref={preRef}
                                    className={`font-mono text-sm ${
                                        theme === 'dark'
                                            ? 'bg-gray-800'
                                            : 'bg-white'
                                    }`}
                                ></pre>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Half - Output Panel */}
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`w-1/2 ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    } border-l border-gray-700`}
                >
                    <div className="border-b border-gray-700 p-4">
                        <h2 className="font-semibold">Output</h2>
                    </div>
                    <div
                        className={`p-4 font-mono text-sm whitespace-pre-wrap h-[calc(100vh-8.5rem)] overflow-auto ${
                            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                        }`}
                    >
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
