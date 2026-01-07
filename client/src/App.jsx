import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, done, error
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const pollInterval = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      resetState();
    }
  };

  const resetState = () => {
    setStatus('idle');
    setJobId(null);
    setProgress(0);
    setErrorMsg('');
    if (pollInterval.current) clearInterval(pollInterval.current);
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/upload', formData);
      setJobId(res.data.jobId);
      setStatus('processing');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg('上传失败，请稍后重试。');
    }
  };

  // Polling effect
  useEffect(() => {
    if (status === 'processing' && jobId) {
      pollInterval.current = setInterval(async () => {
        try {
          const res = await axios.get(`/api/job/${jobId}`);
          const job = res.data;

          if (job.status === 'processing' || job.status === 'pending') {
            setProgress(job.progress || 0);
          } else if (job.status === 'completed') {
            setStatus('done');
            setProgress(100);
            clearInterval(pollInterval.current);
          } else if (job.status === 'failed') {
            setStatus('error');
            setErrorMsg(`处理失败: ${job.error}`);
            clearInterval(pollInterval.current);
          }
        } catch (err) {
          console.error('Polling error', err);
          // Don't stop polling on transient network errors immediately, 
          // but maybe logic to stop after N retries. For now keep simple.
        }
      }, 1000);
    }

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [status, jobId]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">My IP Abuse Finder</h1>
          <p className="text-blue-100">上传 Excel，自动检测 IP 风险</p>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">

          {/* Upload Area */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-xl p-10 hover:border-blue-500 transition-colors bg-slate-800/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
            />
            <p className="mt-2 text-sm text-gray-400">支持 .xlsx, .xls 格式</p>
          </div>

          {/* Action Button */}
          <div className="flex flex-col items-center space-y-4">
            {status === 'idle' && file && (
              <button
                onClick={handleUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
              >
                开始检测
              </button>
            )}

            {status === 'uploading' && (
              <div className="animate-pulse text-blue-400 font-semibold">上传中...</div>
            )}

            {status === 'processing' && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-purple-300 mb-1">
                  <span>正在分析 IP 数据...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {status === 'done' && jobId && (
              <a
                href={`/api/download/${jobId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>下载处理后的 Excel</span>
              </a>
            )}

            {status === 'error' && (
              <div className="text-red-500 text-center">
                <p>{errorMsg}</p>
                <button onClick={resetState} className="mt-2 text-sm underline hover:text-red-400">重试</button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-900/50 p-4 text-center text-slate-500 text-sm border-t border-slate-700">
          Powered by ip2location.io • Secure Processing
        </div>
      </div>
    </div>
  );
}

export default App;
