import pandas as pd
import re
import pickle

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# =============================
# 1. Load Dataset
# =============================
df = pd.read_csv("dataset/reviews.csv", engine="python")

# Sesuaikan nama kolom jika berbeda
X = df["review"]
y = df["sentiment"]

# =============================
# 2. Cleaning Teks
# =============================
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z\s]", "", text)
    return text

X = X.apply(clean_text)

# =============================
# 3. Split Data
# =============================
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

# =============================
# 4. Vectorizer (TF-IDF)
# =============================
vectorizer = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1, 2),
    stop_words="english"
)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# =============================
# 5. Train Model
# =============================
model = LogisticRegression(
    max_iter=1000
)
model.fit(X_train_vec, y_train)

# =============================
# 6. Evaluasi
# =============================
y_pred = model.predict(X_test_vec)
accuracy = accuracy_score(y_test, y_pred)

print("Akurasi model:", accuracy)

# =============================
# 7. Simpan Model & Vectorizer
# =============================
with open("model/sentiment_model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("model/vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("Model dan vectorizer berhasil disimpan!")
