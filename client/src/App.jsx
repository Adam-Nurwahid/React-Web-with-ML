import { useState } from 'react'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 1. Handle saat user memilih file dari galeri/folder
  const onFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      // Membuat URL gambar sementara untuk preview
      setPreview(URL.createObjectURL(file))
      // Reset hasil sebelumnya jika ganti gambar
      setResult(null)
      setError(null)
    }
  }

  // 2. Kirim gambar ke Flask saat tombol ditekan
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Pilih gambar dulu mas!")
      return
    }

    setLoading(true)
    setError(null)

    // Gunakan FormData untuk mengirim file (Wajib untuk upload file)
    const formData = new FormData()
    formData.append('file', selectedFile) 
    // 'file' adalah key yang akan dibaca oleh Flask (request.files['file'])

    try {
      const response = await fetch('http://localhost:8080/api/predict', {
        method: 'POST',
        body: formData,
        // Penting: Jangan set 'Content-Type' header secara manual saat pakai FormData
        // Browser akan otomatis mengaturnya.
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Gagal memproses gambar")
      }
    } catch (err) {
      console.error(err)
      setError("Gagal terhubung ke server Flask. Pastikan backend nyala!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>♻️ Deteksi Jenis Sampah</h1>
      <p>Upload gambar sampah untuk dideteksi oleh AI</p>

      {/* Area Upload */}
      <div className="upload-box">
        <input 
          type="file" 
          onChange={onFileChange} 
          accept="image/*" 
        />
      </div>

      {/* Area Preview Gambar */}
      {preview && (
        <div className="preview-container">
          <img src={preview} alt="Preview Sampah" className="image-preview" />
        </div>
      )}

      {/* Tombol Deteksi */}
      <button 
        onClick={handleUpload} 
        disabled={loading || !selectedFile}
        className="btn-predict"
      >
        {loading ? 'Sedang Menganalisa...' : '🔍 Deteksi Sekarang'}
      </button>

      {/* Area Hasil Prediksi */}
      {result && (
        <div className="result-card">
          <h3>Hasil Prediksi:</h3>
          <div className="prediction-text">{result.prediction}</div>
          <div className="confidence-text">Akurasi: {result.confidence}</div>
        </div>
      )}

      {/* Area Error */}
      {error && (
        <div className="error-card">
          <p>⚠️ {error}</p>
        </div>
      )}
    </div>
  )
}

export default App