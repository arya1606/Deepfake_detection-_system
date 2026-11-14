    import React, {useState} from 'react'
    import UploadPanel from './components/UploadPanel'
    import ResultPanel from './components/ResultPanel'

    export default function App(){
      const [result, setResult] = useState(null)
      const [file, setFile] = useState(null)
      const [frames, setFrames] = useState([])

      const onResult = (r, f, extractedFrames) => { setResult(r); setFile(f); setFrames(extractedFrames || []) }

      return (
        <div className="min-h-screen text-slate-100 p-6">
          <div className="max-w-6xl mx-auto">
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#8A2BE2,#00e5ff)'}}>
                  <span className="font-bold">DG</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold neon">DeepGuard AI</h1>
                  <div className="text-slate-400 text-sm">Advanced Deepfake Detection</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="btn-secondary">History</button>
                <button className="btn-primary">Account</button>
              </div>
            </header>

            <div className="grid lg:grid-cols-4 gap-4 mb-6">
              <div className="glass p-4 rounded-lg">
                <div className="text-sm text-slate-400">Accuracy</div>
                <div className="text-2xl font-bold">98.7%</div>
              </div>
              <div className="glass p-4 rounded-lg">
                <div className="text-sm text-slate-400">Avg Analysis Time</div>
                <div className="text-2xl font-bold">2.4s</div>
              </div>
              <div className="glass p-4 rounded-lg">
                <div className="text-sm text-slate-400">Deepfakes Detected</div>
                <div className="text-2xl font-bold">12,489</div>
              </div>
              <div className="glass p-4 rounded-lg">
                <div className="text-sm text-slate-400">Active Users</div>
                <div className="text-2xl font-bold">5,327</div>
              </div>
            </div>

... (truncated to save space) ...
