import { useState, useEffect, useRef } from 'react';
import { Play, Download, Copy, Upload, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { UseQueryResult, useQuery, useQueries } from '@tanstack/react-query';

type SubmitAPIResponse = {
    submission_id: string;
    job: {
        submission_id: string;
        language: string;
        code_key: string;
        input_key: string | null;
    };
    status: string;
};

type ExecAPIResponse = {
    language: string;
    status: string;
    success: boolean;
    stdout: string;
    stderr: string;
};

type StaticAnaAPIResponse = {
    success: boolean;
    language: string;
    tool: string;
    timestamp: string;
    analysis: {
        errors: [];
        generated_at: string;
        metrics: {
            './code.py': {
                'CONFIDENCE.HIGH': number;
                'CONFIDENCE.LOW': number;
                'CONFIDENCE.MEDIUM': number;
                'CONFIDENCE.UNDEFINED': number;
                'SEVERITY.HIGH': number;
                'SEVERITY.LOW': number;
                'SEVERITY.MEDIUM': number;
                'SEVERITY.UNDEFINED': number;
                loc: number;
                nosec: number;
                skipped_tests: number;
            };
            _totals: {
                'CONFIDENCE.HIGH': number;
                'CONFIDENCE.LOW': number;
                'CONFIDENCE.MEDIUM': number;
                'CONFIDENCE.UNDEFINED': number;
                'SEVERITY.HIGH': number;
                'SEVERITY.LOW': number;
                'SEVERITY.MEDIUM': number;
                'SEVERITY.UNDEFINED': number;
                loc: number;
                nosec: number;
                skipped_tests: number;
            };
        };
        results: [];
    };
};

const languages = [
    { id: 'python', name: 'Python', src: '/python-logo.svg', ext: 'py' },
    { id: 'java', name: 'Java', src: '/java-icon.svg', ext: 'java' },
    { id: 'cpp', name: 'C++', src: '/cpp.svg', ext: 'cpp' },
    { id: 'go', name: 'Go', src: 'go-gopher.svg', ext: 'go' },
];

const starterTemplates = {
    python: `# Python Online Compiler
# Write your Python code here and click Run to execute

message = "Try CodeNexus"
print(message)`,

    java: `// Java Online Compiler
// Write your Java code here and click Run to execute

class Code {
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
    const [userInput, setUserInput] = useState('');
    const [output, setOutput] = useState('');
    const [showStaticAnalysisOutput, setShowStaticAnalysisOutput] = useState(false);
    const [theme, setTheme] = useState('dark');
    const preRef = useRef<HTMLPreElement>(null);

    const loadingIntervalRef = useRef<number | null>(null);

    // States for handling file upload functionality
    const [fileError, setFileError] = useState('');
    const allowedExtensions = ['py', 'java', 'cpp', 'go'];
    const codeFileInputRef = useRef<HTMLInputElement>(null);
    const inputFileInputRef = useRef<HTMLInputElement>(null);

    const handleLanguageChange = (langId: string) => {
        setSelectedLang(langId);
        setCode(starterTemplates[langId as keyof typeof starterTemplates]);
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

    const handleCodeUploadClick = () => {
        codeFileInputRef.current?.click();
    };

    const handleCodeFileUpload = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) return;

        const extension = file.name.split('.').pop();
        if (!allowedExtensions.includes(extension || '')) {
            setFileError(
                `Only the following file types are allowed: ${allowedExtensions.join(
                    ', '
                )}`
            );
            return;
        }

        setFileError('');
        setSelectedLang('');
        const extensionToLanguage = (ext: string) =>
            ({
                py: 'python',
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

    const handleInputUploadClick = () => {
        inputFileInputRef.current?.click();
    };

    const handleInputFileUpload = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setUserInput(e.target?.result as string);
        };
        reader.readAsText(file);

        event.target.value = '';
    };

    function needsInput(code: string) {
        const inputPatterns: { [key: string]: RegExp } = {
            python: /\binput\s*\(/,
            java: /new\s+Scanner\s*\(\s*System\.in\s*\)/,
            cpp: /cin\s*>>|getline\s*\(\s*cin/,
            go: /bufio\.NewReader\s*\(\s*os\.Stdin\s*\)/,
        };

        const regex = inputPatterns[selectedLang];

        if (regex.test(code) && userInput.length === 0) {
            alert('Please add an input file!');
        } else {
            refetch();
        }
    }

    const handleSubmitCode = async () => {
        const ext = languages.find((lang) => lang.id === selectedLang)?.ext;
        const fileName = `code.${ext}`;
        const blob = new Blob([code], { type: 'text/plain' });
        const file = new File([blob], fileName, { type: 'text/plain' });

        const formData = new FormData();
        formData.append('code', file);
        formData.append('language', selectedLang);

        if (userInput.length > 0) {
            const inputBlob = new Blob([userInput], { type: 'text/plain' });
            const inputFile = new File([inputBlob], fileName, {
                type: 'text/plain',
            });
            formData.append('stdin', inputFile);
        }

        try {
            // Submit API
            const res = await fetch(
                'http://code-nexus-alb-617173639.us-east-2.elb.amazonaws.com/submit',
                {
                    method: 'POST',
                    body: formData,
                }
            );
            const result = await res.json();
            console.log('Submit Result:', result);
            return result;
        } catch (err) {
            console.error('Upload failed:', err);
            setOutput(JSON.stringify(err));
        }
    };

    const {
        isFetching,
        data,
        isError,
        error,
        isSuccess,
        refetch,
    }: UseQueryResult<SubmitAPIResponse, Error> = useQuery({
        queryKey: ['SubmitData', selectedLang],
        queryFn: handleSubmitCode,
        enabled: false,
        refetchOnWindowFocus: false,
    });

    const submissionId = data?.submission_id;

    const results = useQueries({
        queries: [
            // Query to get Execution Result
            {
                queryKey: ['executionResult', submissionId],
                queryFn: async () => {
                    const execRes = await fetch(
                        `http://code-nexus-alb-617173639.us-east-2.elb.amazonaws.com/results/${submissionId}`
                    );
                    if (!execRes.ok) {
                        throw new Error('Execution result not ready yet');
                    }
                    return execRes.json();
                },
                enabled: !!submissionId,
                retry: 12,
                retryDelay: 10000,
                refetchOnWindowFocus: false,
            },
            //   Query to get Static Analysis Result
            {
                queryKey: ['staticAnalysisResult', submissionId],
                queryFn: async () => {
                    const anaRes = await fetch(
                        `http://code-nexus-alb-617173639.us-east-2.elb.amazonaws.com/analysis/${submissionId}`
                    );
                    if (!anaRes.ok) {
                        throw new Error('Static analysis result not ready yet');
                    }
                    return anaRes.json();
                },
                enabled: !!submissionId,
                retry: 12,
                retryDelay: 10000,
                refetchOnWindowFocus: false,
            },
        ],
    }) as [
        UseQueryResult<ExecAPIResponse>,
        UseQueryResult<StaticAnaAPIResponse>
    ];

    useEffect(() => {
        if (isFetching || results[0].isFetching || results[1].isFetching) {
            setOutput('');
            const dots = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            let i = 0;

            loadingIntervalRef.current = setInterval(() => {
                setOutput(`${dots[i]} Executing...\n`);
                i = (i + 1) % dots.length;
            }, 100);
        }

        return () => {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
                loadingIntervalRef.current = null;
            }
        };
    }, [isFetching, results[0].isFetching, results[1].isFetching]);

    useEffect(() => {
        if (isSuccess && results[0].isSuccess && results[1].isSuccess) {
            console.log(results[0].data);
            console.log(results[1].data);

            if (results[0].data.status === 'success') {
                setOutput(results[0].data.stdout);
            } else {
                setOutput(results[0].data.stderr);
            }
        }
        setShowStaticAnalysisOutput(true);
    }, [isSuccess, results[0].isSuccess, results[1].isSuccess]);

    useEffect(() => {
        if (isError || results[0].isError || results[1].isError) {
            setOutput(
                'There was an error:\n' +
                    (error ? error : '') +
                    results[0].error +
                    '\n' +
                    results[1].error
            );
        }
    }, [isError, results[0].isError, results[1].isError]);

    useEffect(() => {
        if (preRef.current) {
            const commentRegex =
                selectedLang === 'python' ? /(#.+)$/gm : /(\/\/.+)$/gm;

            const highlightedCode = code.replace(
                commentRegex,
                '<span class="comment">$1</span>'
            );
            preRef.current.innerHTML = highlightedCode;
            setUserInput('');
            setOutput('');
            setShowStaticAnalysisOutput(false);
        }
    }, [code, selectedLang]);

    const staticAnalysisOutput = (language: string) => {
        if (
            results[0].isSuccess &&
            results[0].data.status === 'success' &&
            results[1].isSuccess &&
            results[1].data.success
        ) {
            if (language === 'python') {
                return (
                    <div className="space-y-8 mt-8 border-t pt-2">
                        <div>
                            <h3 className="text-lg font-bold">
                                Static Analysis Metrics
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Confidence Levels
                                    </h4>
                                    <ul className="list-disc list-inside">
                                        <li>
                                            High:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'CONFIDENCE.HIGH'
                                                ]
                                            }
                                        </li>
                                        <li>
                                            Medium:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'CONFIDENCE.MEDIUM'
                                                ]
                                            }
                                        </li>
                                        <li>
                                            Low:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'CONFIDENCE.LOW'
                                                ]
                                            }
                                        </li>
                                        <li>
                                            Undefined:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'CONFIDENCE.UNDEFINED'
                                                ]
                                            }
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Severity Levels
                                    </h4>
                                    <ul className="list-disc list-inside">
                                        <li>
                                            High:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'SEVERITY.HIGH'
                                                ]
                                            }
                                        </li>
                                        <li>
                                            Medium:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'SEVERITY.MEDIUM'
                                                ]
                                            }
                                        </li>
                                        <li>
                                            Low:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'SEVERITY.LOW'
                                                ]
                                            }
                                        </li>
                                        <li>
                                            Undefined:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'SEVERITY.UNDEFINED'
                                                ]
                                            }
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Other Metrics
                                    </h4>
                                    <ul className="list-disc list-inside">
                                        <li>
                                            Lines of Code (LOC):{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py']['loc']
                                            }
                                        </li>
                                        <li>
                                            Nosec Tags:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'nosec'
                                                ]
                                            }
                                        </li>
                                        <li>
                                            Skipped Tests:{' '}
                                            {
                                                results[1].data.analysis
                                                    .metrics['./code.py'][
                                                    'skipped_tests'
                                                ]
                                            }
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div>
                            <h3 className="text-lg font-bold">
                                Overall Totals
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Total Confidence
                                    </h4>
                                    <ul className="list-disc list-inside">
                                        <li>
                                            High:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals['CONFIDENCE.HIGH']
                                            }
                                        </li>
                                        <li>
                                            Medium:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals[
                                                    'CONFIDENCE.MEDIUM'
                                                ]
                                            }
                                        </li>
                                        <li>
                                            Low:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals['CONFIDENCE.LOW']
                                            }
                                        </li>
                                        <li>
                                            Undefined:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals[
                                                    'CONFIDENCE.UNDEFINED'
                                                ]
                                            }
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Total Severity
                                    </h4>
                                    <ul className="list-disc list-inside">
                                        <li>
                                            High:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals['SEVERITY.HIGH']
                                            }
                                        </li>
                                        <li>
                                            Medium:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals['SEVERITY.MEDIUM']
                                            }
                                        </li>
                                        <li>
                                            Low:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals['SEVERITY.LOW']
                                            }
                                        </li>
                                        <li>
                                            Undefined:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals[
                                                    'SEVERITY.UNDEFINED'
                                                ]
                                            }
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Other Totals
                                    </h4>
                                    <ul className="list-disc list-inside">
                                        <li>
                                            Total LOC:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals['loc']
                                            }
                                        </li>
                                        <li>
                                            Total Nosec Tags:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals['nosec']
                                            }
                                        </li>
                                        <li>
                                            Total Skipped Tests:{' '}
                                            {
                                                results[1].data.analysis.metrics
                                                    ._totals['skipped_tests']
                                            }
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className='mt-8 border-t pt-2'>
                        <h3 className="text-lg font-bold">
                            Static Analysis Results
                        </h3>
                        <pre>
                            {/* @ts-ignore */}
                            {results[1].data.analysis.raw_output}
                        </pre>
                    </div>
                );
            }
        }
        return;
    };

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
                            {/* Sub-header */}
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
                                        onClick={() => needsInput(code)}
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
                                                ? handleCodeUploadClick
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
                                        ref={codeFileInputRef}
                                        type="file"
                                        accept=".py,.java,.cpp,.go"
                                        onChange={handleCodeFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                    {fileError && (
                                        <p className="text-red-500">
                                            {fileError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Top - Code */}
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

                            {/* Bottom - Input */}
                            <div className="h-1/3 border-t border-r flex flex-col">
                                <div className="ml-auto px-2 py-1">
                                    <motion.button
                                        onClick={() => handleInputUploadClick()}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`flex gap-2 border border-slate-600 py-1 px-2 rounded-lg ${
                                            theme === 'dark'
                                                ? 'hover:bg-gray-700'
                                                : 'hover:bg-gray-100'
                                        } transition`}
                                    >
                                        Input File <Upload />
                                    </motion.button>
                                    <input
                                        ref={inputFileInputRef}
                                        type="file"
                                        accept=".txt"
                                        onChange={handleInputFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                <pre>{userInput}</pre>
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
                        {showStaticAnalysisOutput && staticAnalysisOutput(selectedLang)}
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
