from flask import Flask, render_template, request
import pickle
from flask import jsonify


app = Flask(__name__)
history = []

# Load model & vectorizer
model = pickle.load(open("model/sentiment_model.pkl", "rb"))
vectorizer = pickle.load(open("model/vectorizer.pkl", "rb"))

label_map = {
    0: "NEGATIF",
    1: "POSITIF"
}

emoji_map = {
    "POSITIF": "😊",
    "NEGATIF": "😡"
}

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    text = data.get("text", "")

    if len(text.split()) < 3:
        return jsonify({
            "error": "Teks terlalu pendek"
        })

    text_vec = vectorizer.transform([text])
    prediction = model.predict(text_vec)[0]
    probability = model.predict_proba(text_vec).max()

    result = label_map[prediction]
    emoji = emoji_map[result]
    confidence = round(probability * 100, 2)

    history.insert(0, {
        "text": text,
        "result": result,
        "confidence": confidence,
        "emoji": emoji
    })
    history[:] = history[:5]

    return jsonify({
        "result": result,
        "emoji": emoji,
        "confidence": confidence,
        "history": history
    })


@app.route("/about")
def about():
    return render_template("about.html")

if __name__ == "__main__":
    app.run()