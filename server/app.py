import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from PIL import Image
import numpy as np
import io

app = Flask(__name__)
CORS(app)

# ==========================================
# BAGIAN INI HARUS DISESUAIKAN DENGAN MODEL KAMU
# ==========================================

# 1. Nama file model .h5 kamu
MODEL_PATH = 'waste_classifier_model.h5' 

# 2. Ukuran input gambar saat training dulu (Sangat Penting!)
#    Coba ingat/cek coding trainingnya. Biasanya (224, 224) atau (150, 150)
TARGET_SIZE = (224, 224) 

# 3. Label kelas urut sesuai abjad/urutan training
#    Contoh: ['B3', 'Organik', 'Anorganik'] atau ['Kaca', 'Kertas', 'Plastik']
CLASS_LABELS = ['organik', 'anorganik', 'berbahaya'] 

# ==========================================

print("Sedang meload model... Tunggu sebentar...")
# Load model sekali saja saat server nyala
model = load_model(MODEL_PATH)
print("Model berhasil di-load! Siap memprediksi.")

def prepare_image(image, target_size):
    # Konversi ke RGB jika gambar grayscale/png transparan
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    # Resize gambar
    image = image.resize(target_size)
    image = img_to_array(image)
    
    # Normalisasi (biasanya dibagi 255.0). Sesuaikan jika trainingmu beda.
    image = image / 255.0 
    
    image = np.expand_dims(image, axis=0) # Tambah dimensi batch
    return image

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada file gambar'}), 400
    
    file = request.files['file']
    
    try:
        # Baca gambar dari memori
        image = Image.open(io.BytesIO(file.read()))
        
        # Preprocessing
        processed_image = prepare_image(image, TARGET_SIZE)
        
        # Prediksi
        prediction = model.predict(processed_image)
        result_index = np.argmax(prediction)
        
        # Ambil hasil
        result_label = CLASS_LABELS[result_index]
        confidence = float(np.max(prediction)) * 100
        
        return jsonify({
            'prediction': result_label,
            'confidence': f"{confidence:.2f}%"
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Gagal memproses gambar'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)