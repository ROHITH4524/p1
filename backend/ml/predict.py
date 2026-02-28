import os
import pickle
import pandas as pd
import numpy as np

def predict_grade(mid_term: float, assignment: float):
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "grade_model.pkl")
    
    if not os.path.exists(model_path):
        return {"error": "Model not trained yet."}
        
    with open(model_path, "rb") as f:
        model = pickle.load(f)
        
    # Create input format matching training data
    features = pd.DataFrame({
        'mid_term': [mid_term],
        'assignment': [assignment]
    })
    
    # Predict grade
    predicted_grade = model.predict(features)[0]
    
    # Get probability/confidence
    probabilities = model.predict_proba(features)[0]
    confidence_percentage = round(float(np.max(probabilities)) * 100, 2)
    
    return {
        "predicted_grade": str(predicted_grade),
        "confidence_percentage": confidence_percentage
    }

