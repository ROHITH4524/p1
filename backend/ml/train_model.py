import os
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

from database import engine

def train_student_model():
    print("Loading marks data from MySQL database...")
    # SQL query to load data directly from DB
    query = "SELECT mid_term, assignment, grade FROM marks WHERE mid_term IS NOT NULL AND assignment IS NOT NULL AND grade IS NOT NULL"
    df = pd.read_sql(query, con=engine)
    
    if len(df) < 10:
        print(f"Warning: Only {len(df)} records found. Model may not be accurate. Add more records.")
        # Proceed anyway for demo
        
    print(f"Loaded {len(df)} records.")
    
    # Features & Target
    X = df[['mid_term', 'assignment']]
    y = df['grade']
    
    # Needs at least 2 samples to split
    if len(df) > 1:
        # Split Data (80/20)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    else:
        # Extremely small dataset fallback
        X_train, X_test, y_train, y_test = X, X, y, y
        
    print("Training RandomForestClassifier...")
    # Initialize and Train Model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Predict & Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy Score: {accuracy * 100:.2f}%")
    
    # Save Model
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "grade_model.pkl")
    
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
        
    print(f"Model saved successfully to {model_path}")
    return accuracy

if __name__ == "__main__":
    train_student_model()

