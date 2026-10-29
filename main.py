import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

model = joblib.load("Mental_health_Model.pkl")

app = FastAPI()

# First Pydantic model
class StudentData(BaseModel):
    Age                     :int
    Gender                  :str
    Country                 :str
    Academic_Level          :str
    Most_Used_Platform      :str
    Purpose_Of_Use          :str
    Avg_Daily_Usage_Hours   :float
    Daily_Unlocks           :int
    Study_Hours             :float
    Physical_Activity_Hours :float
    Sleep_Hours_Per_Night   :float
    Stress_Level            :str

top_countries= ["Other","India","USA","Canada","Australia","UK","Germany","Mexico","Turkey","France", ]          
            
@app.get('/')
def greet():
    return {'Welcome to Mental Health Model'}

@app.post('/predict')
def predict(data : StudentData):
    country_group =data.Country if data.Country in top_countries else "Other"
    input_row=pd.DataFrame([{
        'Age'                       :data.age,
        'Gender'                    :data.Gender,
        'Country'                   :data.Country,
        'Academic_Level'            :data.Academic_Level,
        'Most_Used_Platform'        :data.Most_Used_Platform,
        'Purpose_Of_Use'            :data.Purpose_Of_Use,
        'Avg_Daily_Usage_Hours'     :data.Avg_Daily_Usage_Hours,
        'Daily_Unlocks'             :data.Daily_Unlocks,
        'Study_Hours'               :data.Study_Hours,
        'Physical_Activity_Hours'   :data.Physical_Activity_Hours,
        'Sleep_Hours_Per_Night'     :data.Sleep_Hours_Per_Night,
        'Stress_Level'              :data.Stress_Level,
        "Grouped_countries"         :country_group
    }])

    prediction = model.predict(input_row)[0]