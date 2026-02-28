import pandas as pd
from sklearn.cluster import KMeans

def cluster_students(data: list):
    if not data:
        return []
        
    df = pd.DataFrame(data)
    
    # We need at least 3 students to form 3 clusters
    n_clusters = 3 if len(df) >= 3 else len(df)
    
    if n_clusters == 0:
        return []
        
    if n_clusters == 1:
        # If only 1 or 2 students, just return them as "Medium" or similar
        return [{"id": row['id'], "name": row['name'], "total": row['total'], "performance_label": "Medium"} for _, row in df.iterrows()]
        
    # Features for clustering
    X = df[['total']]
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
    df['cluster'] = kmeans.fit_predict(X)
    
    # Map clusters to High/Medium/Low based on average total
    cluster_centers = df.groupby('cluster')['total'].mean().sort_values()
    
    if n_clusters == 3:
        label_map = {
            cluster_centers.index[0]: 'Low',
            cluster_centers.index[1]: 'Medium',
            cluster_centers.index[2]: 'High'
        }
    else:
        label_map = {
            cluster_centers.index[0]: 'Low',
            cluster_centers.index[1]: 'High'
        }
        
    df['performance_label'] = df['cluster'].map(label_map)
    
    # Convert back to dict
    result = df[['id', 'name', 'total', 'performance_label']].to_dict('records')
    return result

