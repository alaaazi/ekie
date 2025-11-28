from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys

# Ajoute le répertoire courant au sys.path pour s'assurer que les imports fonctionnent correctement
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.gemini_service import analyze_contract, ask_document_question

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)
# Activer CORS pour autoriser les requêtes depuis le frontend React (qui tourne sur un port différent)
CORS(app)

# -------------------------------------------------------------------------
# ROUTES : Analyse IA
# -------------------------------------------------------------------------

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Endpoint pour analyser un contrat.
    Reçoit un fichier (base64) et un message du client.
    Retourne une analyse structurée (JSON) générée par Gemini.
    """
    data = request.json
    if not data:
        return jsonify({"error": "Aucune donnée fournie"}), 400
        
    required_fields = ['fileBase64', 'mimeType', 'clientMessage']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Champ manquant : {field}"}), 400

    try:
        # Appeler le service Gemini pour traiter le document
        result = analyze_contract(
            data['fileBase64'],
            data['mimeType'],
            data['clientMessage']
        )
        return jsonify(result)
    except Exception as e:
        print(f"Erreur dans analyze : {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Endpoint pour poser des questions sur un document spécifique.
    Maintient le contexte du document mais traite actuellement chaque question de manière indépendante
    (l'historique pourrait être étendu).
    """
    data = request.json
    if not data:
        return jsonify({"error": "Aucune donnée fournie"}), 400

    required_fields = ['question', 'fileBase64', 'mimeType']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Champ manquant : {field}"}), 400

    try:
        response = ask_document_question(
            data['question'],
            data['fileBase64'],
            data['mimeType'],
            data.get('history', []),
            data.get('analysisContext')
        )
        return jsonify({"response": response})
    except Exception as e:
        print(f"Erreur dans chat : {e}")
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------------------------
# ROUTES : Gestion des Dossiers (Base de données simulée)
# -------------------------------------------------------------------------
# Dans une vraie application de production, cela se connecterait à une base de données comme PostgreSQL ou MongoDB.
# Ici, nous utilisons une liste en mémoire pour la simplicité durant la phase de prototype.

cases = []

@app.route('/api/cases', methods=['GET'])
def get_cases():
    """Récupérer tous les dossiers."""
    return jsonify(cases)

@app.route('/api/cases', methods=['POST'])
def create_case():
    """Créer un nouveau dossier."""
    new_case = request.json
    # S'assurer qu'il est au début de la liste (le plus récent en premier)
    cases.insert(0, new_case)
    return jsonify(new_case), 201

@app.route('/api/cases/<case_id>', methods=['PUT'])
def update_case(case_id):
    """Mettre à jour un dossier existant (ex: changer le statut)."""
    updated_case = request.json
    for i, c in enumerate(cases):
        if c['id'] == case_id:
            cases[i] = updated_case
            return jsonify(updated_case)
    return jsonify({"error": "Dossier non trouvé"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
