import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Connect to the Backend WebSocket
const socket = io('http://localhost:3001');

export default function App() {
  const [code, setCode] = useState<string>('print("Hello Socket")');
  const [language, setLanguage] = useState<'python' | 'javascript'>('python');
  const [output, setOutput] = useState<string>('Ready to run...');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen for connection success
    socket.on('connect', () => {
      console.log('Connected to WebSocket Server');
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
    };
  }, []);

  // 2. Listen for Job Updates whenever the JobID changes
  useEffect(() => {
    if (!jobId) return;

    const eventName = `Job: ${jobId}`; // Must match Backend exactly!
    console.log(`Listening for event: "${eventName}"`);

    const handleJobFinish = (data: any) => {
      console.log('Received Result:', data);

      // Clean up the listener so we don't listen forever
      socket.off(eventName);

      // Extract the result (reusing your nesting logic)
      if (data.status === 'completed') {
        const resultObj = data.result;

        if (resultObj.stderr) {
          setOutput(`Error:\n${resultObj.stderr}`);
        } else if (resultObj.stdout) {
          setOutput(resultObj.stdout);
        } else {
          setOutput(JSON.stringify(resultObj, null, 2));
        }
      } else {
        setOutput(`Execution Failed: ${data.error}`);
      }

      setIsLoading(false);
      setJobId(null);
    };

    socket.on(eventName, handleJobFinish);

    return () => {
      socket.off(eventName);
    };
  }, [jobId]);

  const runCode = async () => {
    if (isLoading) return;
    setOutput('Job Queued... Waiting for stream...');
    setIsLoading(true);

    try {
      const { data } = await axios.post('http://localhost:3001/execute', {
        language,
        code,
      });

      // Just set the ID. The useEffect above handles the rest!
      setJobId(data.jobId.toString());

    } catch (error: any) {
      setOutput(`Error: ${error.response?.data?.message || error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* HEADER */}
      <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">CodeRunner v2 (Real-Time)</h1>

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
            {isLoading ? 'Running...' : 'Run Code ▶'}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-gray-700">
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>
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