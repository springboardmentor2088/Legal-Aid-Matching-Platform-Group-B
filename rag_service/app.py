from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json
import numpy as np
import os

app = Flask(__name__)

# Load Model
model_name = 'all-MiniLM-L6-v2'
print(f"Loading model {model_name}...")
model = SentenceTransformer(model_name)
print("Model loaded.")

# Load Knowledge Base
knowledge_file = 'knowledge.json'
knowledge_base = []
# Cache embeddings: keys are rolenames, values are (embeddings, items)
role_cache = {}

def load_knowledge_base():
    global knowledge_base, role_cache
    if os.path.exists(knowledge_file):
        with open(knowledge_file, 'r') as f:
            knowledge_base = json.load(f)
        
        # Group by role and pre-compute embeddings
        roles = set(item.get('role', 'CITIZEN') for item in knowledge_base)
        
        for role in roles:
            role_items = [item for item in knowledge_base if item.get('role') == role]
            if role_items:
                questions = [item['question'] for item in role_items]
                print(f"Embedding {len(questions)} items for role {role}...")
                embeddings = model.encode(questions)
                role_cache[role] = {
                    'embeddings': embeddings,
                    'items': role_items
                }
    else:
        print("Warning: knowledge.json not found.")

load_knowledge_base()

@app.route('/rag/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message', '')
    user_role = data.get('role', 'CITIZEN').upper() # Default to CITIZEN if not provided

    if not user_query:
        return jsonify({"answer": "Please ask a question.", "confidence": 0.0})

    if user_role not in role_cache:
         # Fallback to Citizen or return generic
         user_role = 'CITIZEN'

    role_data = role_cache.get(user_role)
    if not role_data:
         return jsonify({"answer": "I don't have information for your role.", "confidence": 0.0})

    kb_embeddings = role_data['embeddings']
    role_items = role_data['items']

    # Embed user query
    query_embedding = model.encode([user_query])

    # Calculate similarity
    if len(kb_embeddings) > 0:
        similarities = cosine_similarity(query_embedding, kb_embeddings)[0]
        best_match_idx = np.argmax(similarities)
        best_match_score = float(similarities[best_match_idx])

        if best_match_score > 0.35: # Slightly lower threshold
            best_answer = role_items[best_match_idx]['answer']
            best_action = role_items[best_match_idx].get('action') # Get action if exists
            
            # If action exists, add autoTrigger flag to indicate it's a direct response to a user command
            if best_action:
                best_action = best_action.copy() # Avoid modifying cache
                best_action['autoTrigger'] = True

            print(f"Role: {user_role} | Query: {user_query} | Match: {role_items[best_match_idx]['question']} | Score: {best_match_score}")
            return jsonify({
                "answer": best_answer,
                "confidence": best_match_score,
                "action": best_action
            })
    
    return jsonify({
        "answer": "Please contact support or check your dashboard for this information.",
        "confidence": 0.0
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8001))
    app.run(host='0.0.0.0', port=port, debug=False)
