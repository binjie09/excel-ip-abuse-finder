import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, done, error
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMsg('');
      setDownloadUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('processing');
      // Axios responseType blob is crucial for file downloads
      const response = await axios.post('/api/upload', formData, {
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          // We could show upload progress here
        }
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);
      setStatus('done');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg('处理失败，请检查文件格式或稍后再试。');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
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
          <div className="flex justify-center">
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
              <div className="flex items-center space-x-2 text-purple-400 font-semibold">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>正在分析 IP 数据 (请稍候)...</span>
              </div>
            )}

            {status === 'done' && downloadUrl && (
              <a
                href={downloadUrl}
                download={`enriched_${file.name}`}
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
                <button onClick={() => setStatus('idle')} className="mt-2 text-sm underline hover:text-red-400">重试</button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-900/50 p-4 text-center text-slate-500 text-sm border-t border-slate-700">
          Powered by IPAPI.is • Secure Processing
        </div>
      </div>
    </div>
  );
}

export default App;
