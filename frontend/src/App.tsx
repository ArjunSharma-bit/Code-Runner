import { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const MAX_POLL_RETRIES = 20; // 20 attempts * 500ms = 10 seconds max wait

export default function App() {
  const [code, setCode] = useState<string>('print("Hello World")');
  const [language, setLanguage] = useState<'python' | 'javascript'>('python');
  const [output, setOutput] = useState<string>('Ready to run...');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // --- THE CORE LOGIC ---
  const runCode = async () => {
    // 1. Prevent Spam: Don't run if already running
    if (isLoading) return;

    // 2. Clear previous output & Lock UI
    setOutput('Job Queued...');
    setIsLoading(true);

    try {
      // 3. Send the Job
      const { data } = await axios.post('http://localhost:3001/execute', {
        language,
        code,
      });

      const jobId = data.jobId;
      console.log(`Job Created: ${jobId}`);

      // 4. Start Polling (The Safe Way)
      pollJobStatus(jobId);

    } catch (error: any) {
      setOutput(`Error: ${error.response?.data?.message || error.message}`);
      setIsLoading(false); // Unlock if initial request fails
    }
  };

  const pollJobStatus = async (jobId: string, attempts = 0) => {
    if (attempts >= MAX_POLL_RETRIES) {
      setOutput('Error: Job timed out. The server took too long to respond.');
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(`http://localhost:3001/execute/${jobId}`);

      // DEBUG: Look at this in your Browser Console (F12)
      console.log(`Poll ${attempts + 1} Raw Data:`, data);

      if (data.state === 'completed') {

        // Backend returns: { result: { stdout: "Hello", stderr: "" } }
        const resultObj = data.res?.result || data.result;

        // 1. Check if we have stderr (Error)
        if (resultObj.stderr) {
          setOutput(`Error:\n${resultObj.stderr}`);
        }
        // 2. Check if we have stdout (Success)
        else if (resultObj.stdout) {
          setOutput(resultObj.stdout);
        }
        // 3. Fallback (Empty or weird structure)
        else {
          setOutput(JSON.stringify(resultObj, null, 2));
        }

        setIsLoading(false);

      } else if (data.state === 'failed') {
        setOutput(`Execution Failed: ${data.error}`);
        setIsLoading(false);
      } else {
        setTimeout(() => pollJobStatus(jobId, attempts + 1), 500);
      }

    } catch (error) {
      console.error(error);
      setOutput('Polling Error');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">

      {/* HEADER */}
      <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">CodeRunner v1</h1>

        <div className="flex gap-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none"
          >
            <option value="python">Python 3</option>
            <option value="javascript">Node.js</option>
          </select>

          <button
            onClick={runCode}
            disabled={isLoading}
            className={`px-6 py-1 rounded font-bold transition-colors ${isLoading
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
          >
            {isLoading ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: EDITOR */}
        <div className="w-1/2 border-r border-gray-700">
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* RIGHT: TERMINAL */}
        <div className="w-1/2 flex flex-col bg-black">
          <div className="p-2 bg-gray-800 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-700">
            Terminal Output
          </div>
          <pre className="flex-1 p-4 font-mono text-sm text-green-400 whitespace-pre-wrap overflow-auto">
            {output}
          </pre>
        </div>

      </div>
    </div>
  );
}