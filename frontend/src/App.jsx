import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!file || !jobDescription.trim()) {
      setError('Please upload a resume and paste a job description.')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_description', jobDescription)

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Something went wrong on the server.')
      }

      const data = await response.json()
      setResult(data.analysis)
    } catch (err) {
      setError(err.message || 'Failed to analyze resume.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Resume Analyzer</h1>
      <p>Upload your resume and paste a job description to see how well you match.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label><strong>Resume (PDF):</strong></label><br />
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>Job Description:</strong></label><br />
          <textarea
            rows="8"
            style={{ width: '100%', padding: '8px' }}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Match Score: {result.match_score}/100</h2>

          <h3>Missing Skills</h3>
          <ul>
            {result.missing_skills?.map((skill, i) => <li key={i}>{skill}</li>)}
          </ul>

          <h3>Strengths</h3>
          <ul>
            {result.strengths?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>

          <h3>Suggestions</h3>
          <ul>
            {result.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App