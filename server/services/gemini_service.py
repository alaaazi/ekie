import os
import json
import base64
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# -------------------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------------------

# Charger les variables d'environnement depuis .env.local à la racine de l'application
env_path = Path(__file__).resolve().parent.parent.parent / '.env.local'
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("API_KEY")

# Vérifier VITE_API_KEY ou GOOGLE_API_KEY si API_KEY est manquant
if not API_KEY:
    API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    API_KEY = os.getenv("VITE_API_KEY")
if not API_KEY:
    API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    print("Attention : API_KEY non trouvée dans les variables d'environnement")

genai.configure(api_key=API_KEY)

# Le modèle utilisé pour l'analyse.
# Nous utilisons 'flash' pour la rapidité et l'efficacité des coûts, mais 'pro' pourrait être utilisé pour un raisonnement plus approfondi.
MODEL_ID = "gemini-2.5-flash"

# -------------------------------------------------------------------------
# FONCTIONS PRINCIPALES
# -------------------------------------------------------------------------

def analyze_contract(file_base64, mime_type, client_message):
    """
    Analyse un contrat en utilisant Google Gemini.
    
    Args:
        file_base64 (str): Le contenu du fichier encodé en Base64.
        mime_type (str): Le type MIME du fichier (ex: 'application/pdf').
        client_message (str): Le contexte ou la question spécifique de l'utilisateur.
        
    Returns:
        dict: Un objet JSON contenant le résumé, les risques, les points clés et un projet de réponse.
    """
    
    # Le Prompt.
    # Nous imposons une structure JSON pour la sortie afin de faciliter l'analyse côté frontend.
    prompt = f"""
    Tu es un assistant juridique expert pour le cabinet "Ekie".
    
    CONTEXTE :
    Un client a envoyé un contrat de travail (joint) et un message expliquant sa situation.
    Message du client : "{client_message}"
    
    TA MISSION :
    1. Analyse le contrat joint en profondeur.
    2. Réponds spécifiquement aux interrogations du client (notamment sur la mobilité/déménagement si mentionné).
    3. Identifie les clauses clés et les risques potentiels.
    4. Propose des actions concrètes.
    5. Rédige un projet de réponse formelle et empathique pour l'avocat.

    FORMAT DE RÉPONSE ATTENDU (JSON) :
    - summary: Une synthèse claire de la situation et du contrat (max 3 phrases).
    - keyPoints: Liste des points juridiques essentiels extraits du document (ex: clause de mobilité, période d'essai, non-concurrence).
    - risks: Liste des risques ou points d'attention. Chaque risque a une sévérité (Faible, Moyen, Élevé) et une description.
    - actions: Liste des recommandations concrètes pour l'avocat ou le client.
    - draftResponse: Un email COMPLET, PARFAITEMENT MIS EN FORME et PRÊT À L'ENVOI. 
      IMPORTANT : Tu dois utiliser des sauts de ligne (\\n\\n) pour bien séparer les paragraphes. Le texte ne doit PAS être un bloc compact.
      Structure imposée :
      Objet : [Sujet clair]
      
      [Formule d'appel (ex: Chère Madame,)]
      
      [Introduction accusant réception et empathique]
      
      [Corps de la réponse : Analyse juridique détaillée mais accessible, structurée en plusieurs paragraphes aérés]
      
      [Recommandations pratiques]
      
      [Conclusion et invitation à prendre rendez-vous]
      
      [Formule de politesse]
      
      [Signature : Maître [Nom], Cabinet Ekie]
    """

    # Configuration pour forcer le modèle à retourner un JSON valide
    generation_config = {
        "response_mime_type": "application/json",
        "response_schema": {
            "type": "OBJECT",
            "properties": {
                "summary": {"type": "STRING"},
                "keyPoints": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                },
                "risks": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "severity": {"type": "STRING", "enum": ['Faible', 'Moyen', 'Élevé']},
                            "description": {"type": "STRING"},
                        },
                        "required": ['severity', 'description'],
                    },
                },
                "actions": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                },
                "draftResponse": { 
                    "type": "STRING",
                    "description": "L'email complet avec sauts de ligne, prêt à l'envoi."
                },
            },
            "required": ['summary', 'keyPoints', 'risks', 'actions', 'draftResponse'],
        },
    }

    model = genai.GenerativeModel(MODEL_ID)

    # Nettoyer la chaîne base64 si elle a un en-tête (ex: "data:application/pdf;base64,...")
    if ',' in file_base64:
        file_base64 = file_base64.split(',')[1]
        
    try:
        file_data = base64.b64decode(file_base64)
    except Exception as e:
        raise ValueError(f"Données base64 invalides : {e}")

    try:
        # Envoyer le prompt et le fichier à Gemini
        response = model.generate_content(
            contents=[
                prompt,
                {
                    "mime_type": mime_type,
                    "data": file_data
                }
            ],
            generation_config=generation_config
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Erreur dans generate_content : {e}")
        raise

def ask_document_question(question, file_base64, mime_type, history, analysis_context):
    """
    Permet à l'utilisateur de poser des questions de suivi sur le document.
    """
    system_prompt = f"""Tu es l'assistant IA d'un avocat chez Ekie. 
    Tu as accès au document ci-joint.
    
    CONTEXTE DE L'ANALYSE PRÉCÉDENTE (Si disponible):
    {json.dumps(analysis_context) if analysis_context else "Aucune analyse préalable."}
    
    L'avocat te pose une question spécifique sur le document ou le dossier.
    Réponds de manière précise, juridique et concise. Cite les articles ou clauses du document si possible."""

    model = genai.GenerativeModel(MODEL_ID)
    
    if ',' in file_base64:
        file_base64 = file_base64.split(',')[1]
        
    try:
        file_data = base64.b64decode(file_base64)
    except Exception as e:
        raise ValueError(f"Données base64 invalides : {e}")

    try:
        response = model.generate_content(
            contents=[
                system_prompt,
                {
                    "mime_type": mime_type,
                    "data": file_data
                },
                f"Question de l'avocat: {question}"
            ]
        )
        return response.text
    except Exception as e:
        print(f"Erreur dans chat : {e}")
        return "Désolé, une erreur est survenue lors du traitement de votre question."
