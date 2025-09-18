import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import os

# --- 1. DATA GENERATION ---
np.random.seed(42)
num_students = 100
student_ids = [f'S{i+1:03d}' for i in range(num_students)]
names = [f'Student_{i+1}' for i in range(num_students)]
classes = np.random.choice(['A', 'B', 'C'], size=num_students, p=[0.4, 0.3, 0.3])
comprehension = np.random.randint(50, 100, size=num_students)
attention = np.random.randint(40, 95, size=num_students)
focus = np.random.randint(45, 90, size=num_students)
retention = np.random.randint(40, 95, size=num_students)
engagement_time = np.random.uniform(5, 20, size=num_students).round(1)

weights = {'comprehension': 0.3, 'attention': 0.2, 'focus': 0.25, 'retention': 0.15}
score_raw = (
    comprehension * weights['comprehension'] + attention * weights['attention'] +
    focus * weights['focus'] + retention * weights['retention'] +
    engagement_time * 2.5 + np.random.normal(0, 5, size=num_students)
)
assessment_score = np.clip(score_raw.round(0), 0, 100).astype(int)

df = pd.DataFrame({
    'student_id': student_ids, 'name': names, 'class': classes,
    'comprehension': comprehension, 'attention': attention, 'focus': focus,
    'retention': retention, 'assessment_score': assessment_score,
    'engagement_time': engagement_time
})

# --- 2. CLUSTERING (Learning Personas) ---
scaler = MinMaxScaler()
clustering_features = ['comprehension', 'attention', 'focus', 'retention', 'engagement_time']
df_scaled = scaler.fit_transform(df[clustering_features])
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
df['persona_cluster'] = kmeans.fit_predict(df_scaled)

persona_names = {0: 'Balanced Average', 1: 'High-Skill Achiever', 2: 'Low Engagement/Struggler'}
df['learning_persona'] = df['persona_cluster'].map(persona_names)

# --- 3. EXPORT DATA FOR NEXT.JS ---
public_dir = 'public'
if not os.path.exists(public_dir):
    os.makedirs(public_dir) # This creates the public folder if it doesn't exist

df_output = df.drop(columns=['persona_cluster'])
df_output.to_json(os.path.join(public_dir, 'student_data.json'), orient='records', indent=4)

print("✅ Analysis Complete. 'student_data.json' saved to the 'public' folder.")