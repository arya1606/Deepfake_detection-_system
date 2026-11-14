import React, { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [file, setFile] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [reportPath, setReportPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // helper: normalize metric to 0-100
  const normalize = (v) => {
    if (v == null) return 0;
    if (typeof v === "string" && v.includes("%"))
      return parseFloat(v.replace("%", ""));
    if (typeof v === "number") {
      return v <= 1 ? Math.round(v * 100) : Math.round(v);
    }
    if (typeof v === "object" && v.value != null) return normalize(v.value);
    return 0;
  };

  // Upload
  const onChooseFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setAnalysis(null);
    setReportPath(null);

    const formData = new FormData();
    formData.append("file", f);

    try {
      const resp = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      if (data.status === "success") {
        setFileMeta(
          data.metadata || {
            filename: f.name,
            filesize: (f.size / 1024 / 1024).toFixed(2),
            dimensions: "—",
          }
        );
        setFile({ ...f, serverPath: data.filepath });
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + (err.message || err));
    }
  };

  // Analyze
  const analyze = async () => {
    if (!file?.serverPath) return alert("Upload a file first.");
    setLoading(true);
    setAnalysis(null);
    try {
      const resp = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath: file.serverPath }),
      });
      const data = await resp.json();
      if (data.status === "success") {
        setAnalysis(data.results);
      } else {
        alert("Analysis failed");
      }
    } catch (err) {
      console.error(err);
      alert("Analysis failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Generate Report
  const generateReport = async () => {
    if (!analysis) return alert("Run analysis first.");
    try {
      const resp = await fetch(`${API_BASE}/generate_report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: analysis }),
      });
      const data = await resp.json();
      if (data.status === "success") {
        setReportPath(data.report_path);
        alert("Report generated!");
      } else {
        alert("Report generation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate report: " + err.message);
    }
  };

  // Download
  const downloadReport = () => {
    if (!reportPath) return alert("No report ready");
    window.open(
      `${API_BASE}/download_report?path=${encodeURIComponent(reportPath)}`,
      "_blank"
    );
  };

  // History fetch
  const fetchHistory = async () => {
    try {
      const resp = await fetch(`${API_BASE}/history`);
      const data = await resp.json();
      if (data.status === "success" && Array.isArray(data.history)) {
        setHistory(data.history);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch history");
    }
  };

  // load a history entry into analysis view
  const loadHistoryItem = (entry) => {
    if (!entry || !entry.results) return;
    setAnalysis(entry.results);
  };

  // charts sample fallback
  const radarData = analysis
    ? Object.entries(analysis.metrics || {}).map(([k, v]) => ({
        metric: k.replace(/_/g, " "),
        score: normalize(v) / 100,
      }))
    : [
        { metric: "Face", score: 0.8 },
        { metric: "Audio", score: 0.6 },
        { metric: "Lighting", score: 0.7 },
        { metric: "Artifacts", score: 0.9 },
        { metric: "Sync", score: 0.65 },
      ];

  // Probability Bar Graph
  const probBarData = [
    {
      name: "Real",
      value: analysis ? 100 - normalize(analysis.confidence) : 50,
    },
    { name: "Fake", value: analysis ? normalize(analysis.confidence) : 50 },
  ];

  // Indicators mapping (title + description)
  const indicatorDescriptions = {
    "Blink pattern irregularities detected":
      "Analysis of blink patterns shows irregular blink frequency that doesn’t match human behavior. Average blink rate is inconsistent, a common artifact of AI-generated content.",
    "Lighting inconsistencies found":
      "Multiple light sources detected that don’t correspond to the environment. Shadow analysis reveals inconsistencies in facial shading, suggesting tampering.",
    "GAN artifacts near hairline":
      "Detected GAN-related visual artifacts around the hairline. These are typical traces of deepfake generation algorithms, especially at high detail areas.",
    "Frequency-domain anomalies":
      "FFT analysis indicates unusual frequency patterns in the facial regions compared to the background. This mismatch suggests potential manipulation.",
  };

  return (
    <div className="app">
      <header className="navbar">
        <h1 className="logo">DeepScan AI</h1>
        <div className="nav-buttons">
          <button className="btn secondary" onClick={fetchHistory}>
            History
          </button>
        </div>
      </header>

      <main>
        {/* Hero + Upload */}
        <section className="upload hero">
          <h2>Advanced Deepfake Detection</h2>
          <p className="subtitle">
            Upload media and get a technical analysis with frame-level evidence.
          </p>

          <div className="upload-box">
            <div className="upload-drag">
              <div className="upload-icon">📤</div>
              <p className="upload-cta">
                <strong>Drag & Drop your file here</strong>
              </p>
              <p className="upload-hint">
                Supported: JPG, PNG, MP4, MOV, AVI — Max 500MB
              </p>

              <label className="select-btn">
                Select File for Analysis
                <input
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={onChooseFile}
                />
              </label>
            </div>
          </div>

          {fileMeta && (
            <div className="file-details">
              <div className="file-grid">
                <div className="file-card">
                  <div className="file-label">Filename</div>
                  <div className="file-val">{fileMeta.filename}</div>
                </div>
                <div className="file-card">
                  <div className="file-label">File Type</div>
                  <div className="file-val">{fileMeta.filetype || "—"}</div>
                </div>
                <div className="file-card">
                  <div className="file-label">File Size</div>
                  <div className="file-val">{fileMeta.filesize} MB</div>
                </div>
                <div className="file-card">
                  <div className="file-label">Dimensions</div>
                  <div className="file-val">{fileMeta.dimensions}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <button className="btn primary" onClick={analyze} disabled={loading}>
              {loading ? "Analyzing..." : "Start Analysis"}
            </button>
          </div>
        </section>

        {/* ✅ Updated Results area */}
        {analysis && (
          <section className="results-panel">
            <div className="analysis-results">
              <div className="analysis-header">
                <h3>Analysis Results</h3>
                <span
                  className={`verdict-pill ${
                    (analysis.verdict || "").toLowerCase() === "real"
                      ? "real"
                      : "manipulated"
                  }`}
                >
                  {analysis.verdict ?? "UNKNOWN"}
                </span>
              </div>

              <div className="confidence-title">Confidence level</div>
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{ width: `${normalize(analysis.confidence)}%` }}
                />
              </div>
              <div className="confidence-caption">
                {normalize(analysis.confidence)}% confidence
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">
                    {normalize(analysis.confidence)}%
                  </div>
                  <div className="stat-label">Fake Probability</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {100 - normalize(analysis.confidence)}%
                  </div>
                  <div className="stat-label">Real Probability</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {(analysis.frames || []).length}
                  </div>
                  <div className="stat-label">Frames Analyzed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {analysis.processing_time ?? "—"}s
                  </div>
                  <div className="stat-label">Processing Time</div>
                </div>
              </div>
            </div>

            {/* Technical Analysis */}
            <div className="technical">
              <h3>Technical Analysis</h3>

              <div className="chart-row">
                <div className="chart-card">
                  <div className="chart-title">Detection Metrics</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis domain={[0, 1]} />
                      <Radar
                        dataKey="score"
                        stroke="#b84cff"
                        fill="#b84cff"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Probability Bar Graph */}
                <div className="chart-card">
                  <div className="chart-title">Probability Distribution</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={probBarData}>
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="value">
                        {probBarData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.name === "Real" ? "#4cff8f" : "#ff4c4c"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="detailed-metrics">
                <h4>Detailed Metrics</h4>
                <div className="metric-list">
                  {Object.entries(analysis.metrics || {}).map(([k, v]) => {
                    const pct = normalize(v);
                    let color = "#ff4c4c";
                    if (pct >= 75) color = "#4cff8f";
                    else if (pct >= 45) color = "#ffcc00";

                    return (
                      <div className="metric-row" key={k}>
                        <div className="metric-name">
                          {k ? k.replace(/_/g, " ") : "Unknown"}
                        </div>
                        <div className="metric-progress" title={`${pct}%`}>
                          <div
                            className="metric-fill"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${color}, rgba(0,0,0,0.15))`,
                            }}
                          />
                        </div>
                        <div className="metric-value" style={{ color }}>
                          {pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Frame-by-frame */}
            {analysis.frames?.length > 0 && (
              <div className="frames-section">
                <h4>Frame-by-Frame Analysis</h4>
                <div className="frame-grid">
                  {analysis.frames.map((f, i) => (
                    <div key={i} className="frame-item">
                      <img src={`${API_BASE}${f}`} alt={`frame-${i}`} />
                      <div className="frame-caption">Frame {i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indicators */}
            {analysis.indicators?.length > 0 && (
              <div className="indicators-section">
                <h4>Indicators of Manipulation</h4>
                {analysis.indicators.map((ind, i) => {
                  const desc =
                    indicatorDescriptions[ind] ||
                    "Potential manipulation detected.";
                  return (
                    <div className="indicator-card" key={i}>
                      <div className="indicator-title">{ind}</div>
                      <div className="indicator-desc">{desc}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Report actions */}
            <div className="report-actions">
              <button className="btn primary" onClick={generateReport}>
                Generate PDF
              </button>
              <button className="btn secondary" onClick={downloadReport}>
                Download PDF
              </button>
              <button
                className="btn secondary"
                onClick={() =>
                  navigator.clipboard.writeText(
                    JSON.stringify(analysis, null, 2)
                  )
                }
              >
                Export JSON
              </button>
            </div>
          </section>
        )}

        {/* History */}
        {history?.length > 0 && (
          <section className="history-panel">
            <h3>History</h3>
            <div className="history-list">
              {history.map((h) => (
                <div
                  className="history-item"
                  key={h.id}
                  onClick={() => loadHistoryItem(h)}
                >
                  <div className="hist-left">
                    <strong>{h.filename}</strong>
                    <div className="hist-small">{h.timestamp}</div>
                  </div>
                  <div className="hist-right">
                    <div className="hist-verdict">
                      {h.results?.verdict ?? "—"}
                    </div>
                    <div className="hist-confidence">
                      {normalize(h.results?.confidence)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        © 2025 <strong>ADYPU Students</strong>. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
