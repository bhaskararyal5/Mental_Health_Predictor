# 🧠 MindScore: Student Mental Health Predictor

A full-stack machine learning project that predicts a student's **mental health score (0–10)** from their social media habits and lifestyle. It combines a scikit-learn model, a **FastAPI** backend, and a responsive **HTML/CSS/JavaScript** frontend.

> ⚠️ **Disclaimer:** This project is for educational purposes only. It is **not** a medical or diagnostic tool. If you or someone you know is struggling, please reach out to a qualified mental health professional.

---

## ✨ Features

- 📊 End-to-end ML workflow: EDA, preprocessing, model comparison, hyperparameter tuning
- 🌲 Random Forest regression pipeline saved with `joblib`
- ⚡ FastAPI REST API with Pydantic input validation
- 🎨 Modern frontend with sliders, animated score gauge, dark/light theme and mobile layout
- 💡 Personalised insights based on the user's inputs (sleep, usage, stress, activity)
- 🟢 Live API connection indicator and configurable API URL

---

## 🗂️ Project Structure

```
mindscore/
├── index.html                  # Frontend page
├── style.css                   # Styling (light/dark themes, responsive)
├── script.js                   # Form logic, API calls, result rendering
├── main.py                     # FastAPI backend
├── Mental_health_Model.pkl     # Trained scikit-learn pipeline
├── ML_project.ipynb            # Data analysis & model training notebook
├── Student_Social_Media_And_Mental_Health_Impact.csv   # Dataset
└── README.md
```

---

## 📈 Model

**Target:** `Mental_Health_Score` (continuous, roughly 3.6 to 9.4 in the data)
**Dataset:** 5,000 student records, 12 input features

| Type | Features |
|------|----------|
| Numeric | Age, Avg_Daily_Usage_Hours, Daily_Unlocks, Physical_Activity_Hours, Sleep_Hours_Per_Night |
| Skewed numeric (log + scale) | Study_Hours |
| Ordinal | Stress_Level (Low < Medium < High < Very High) |
| Nominal (one-hot) | Gender, Academic_Level, Most_Used_Platform, Purpose_Of_Use, Grouped_countries |

**Preprocessing highlights**
- Duplicates dropped and negative `Physical_Activity_Hours` clipped to 0
- Countries outside the top 10 grouped into `Other`
- Everything wrapped in a single `ColumnTransformer` + `Pipeline`, so raw input can go straight to `model.predict()`

**Results (30% hold-out test set)**

| Model | R² | MAE | RMSE |
|-------|----|-----|------|
| Linear Regression | 0.740 | 0.536 | 0.676 |
| **Random Forest (default), deployed** | **0.878** | **0.347** | **0.464** |
| Random Forest (tuned, RandomizedSearchCV) | 0.865 | 0.369 | 0.487 |

The default Random Forest scored best on the test set and is the model saved to `Mental_health_Model.pkl`.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- A modern web browser

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Install dependencies
```bash
pip install fastapi uvicorn pandas scikit-learn joblib numpy
```
> Use the same `scikit-learn` version that was used to train the model, otherwise loading the `.pkl` may fail or warn.

### 3. Start the API
```bash
uvicorn main:app --reload
```
The API runs at `http://127.0.0.1:8000`. Interactive docs are at `http://127.0.0.1:8000/docs`.

### 4. Open the frontend
Open `index.html` in your browser. If you want to serve it instead:
```bash
python -m http.server 5500
# then visit http://localhost:5500
```

If your API runs on a different address, change it under **⚙️ API settings** in the page footer.

---

## 🔌 API Reference

### `GET /`
Health check.
```json
{ "message": "Welcome to Mental Health Model" }
```

### `POST /predict`

**Request body**
```json
{
  "Age": 21,
  "Gender": "Male",
  "Country": "India",
  "Academic_Level": "Undergraduate",
  "Most_Used_Platform": "Instagram",
  "Purpose_Of_Use": "Entertainment",
  "Avg_Daily_Usage_Hours": 5.0,
  "Daily_Unlocks": 170,
  "Study_Hours": 3.0,
  "Physical_Activity_Hours": 1.7,
  "Sleep_Hours_Per_Night": 6.6,
  "Stress_Level": "Medium"
}
```

**Response**
```json
{ "predicted_mental_health_score": 6.42 }
```

**Allowed values**

| Field | Values |
|-------|--------|
| Gender | `Male`, `Female` |
| Academic_Level | `High School`, `Undergraduate`, `Graduate` |
| Most_Used_Platform | `Facebook`, `LinkedIn`, `Instagram`, `Snapchat`, `Twitter`, `YouTube`, `TikTok`, `LINE`, `KakaoTalk`, `VKontakte`, `WhatsApp`, `WeChat` |
| Purpose_Of_Use | `Networking`, `Education`, `Entertainment`, `News` |
| Stress_Level | `Low`, `Medium`, `High`, `Very High` |
| Age | integer, 10 to 100 |
| Hours fields | float, 0 to 24 |

**Example with cURL**
```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"Age":21,"Gender":"Male","Country":"India","Academic_Level":"Undergraduate","Most_Used_Platform":"Instagram","Purpose_Of_Use":"Entertainment","Avg_Daily_Usage_Hours":5,"Daily_Unlocks":170,"Study_Hours":3,"Physical_Activity_Hours":1.7,"Sleep_Hours_Per_Night":6.6,"Stress_Level":"Medium"}'
```

---

## 🛠️ Tech Stack

- **ML:** Python, pandas, NumPy, scikit-learn, seaborn, matplotlib
- **Backend:** FastAPI, Pydantic, Uvicorn
- **Frontend:** HTML5, CSS3, vanilla JavaScript

---

## ⚠️ Limitations

- The dataset only covers ages **18–24**, so predictions outside that range are less reliable.
- The default Random Forest shows a gap between training R² (0.98) and test R² (0.88), which suggests some overfitting.
- The data appears to be survey-style or synthetic; results should not be generalised to real-world populations.
- The model finds correlations, not causes.

---

## 🔮 Future Improvements

- Deploy the backend (Render, Railway, etc.) and the frontend (GitHub Pages, Netlify)
- Add feature importance / SHAP explanations to the result panel
- Try gradient boosting models (XGBoost, LightGBM)
- Add Docker support and unit tests for the API

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.


