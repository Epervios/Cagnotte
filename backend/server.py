from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
from decimal import Decimal, ROUND_UP
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============

class UserBase(BaseModel):
    nom: str
    email: EmailStr
    actif: bool = True
    mois_debut: Optional[str] = None  # Format YYYY-MM

class UserCreate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: User
    is_admin: bool

class PaiementBase(BaseModel):
    mois: str  # Format YYYY-MM
    montant: float
    methode: str  # TWINT, VIREMENT, AUTRE, DEPENSE
    raison: Optional[str] = None

class PaiementCreate(PaiementBase):
    pass

class Paiement(PaiementBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    participant_id: str
    statut: str  # en_attente, confirme
    date: str

class PaiementUpdate(BaseModel):
    montant: Optional[float] = None
    methode: Optional[str] = None
    statut: Optional[str] = None
    raison: Optional[str] = None

class ConfigItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    value: str

class DepenseRequest(BaseModel):
    participants: List[str]  # Liste d'IDs
    montant_total: float
    raison: str
    repartition: str  # "egale" ou "ponderee"
    poids: Optional[Dict[str, float]] = None  # Pour répartition pondérée

class KPIResponse(BaseModel):
    total_confirme_annee: float
    en_attente_annee: float
    reste_mois: float

class KPIParticipant(BaseModel):
    participant_id: str
    nom: str
    confirme_annee: float
    en_attente: float
    manquant: float
    progression: float
    en_retard: bool

# ============ UTILITIES ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Token invalide")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.participants.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user or not user.get('actif', True):
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé ou inactif")
    return user

async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    admin_emails_str = os.environ.get('ADMIN_EMAILS', 'eric.savary@lausanne.ch')
    admin_emails = [e.strip() for e in admin_emails_str.split(',')]
    if user['email'] not in admin_emails:
        raise HTTPException(status_code=403, detail="Accès administrateur requis")
    return user

def arrondir_005(montant: float) -> float:
    """Arrondir au 0.05 supérieur"""
    return math.ceil(montant * 20) / 20

# ============ AUTH ROUTES ============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await db.participants.find_one({"email": request.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not user.get('actif', True):
        raise HTTPException(status_code=401, detail="Compte désactivé")
    
    if not verify_password(request.password, user['password']):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Check if admin
    admin_emails_str = os.environ.get('ADMIN_EMAILS', 'eric.savary@lausanne.ch')
    admin_emails = [e.strip() for e in admin_emails_str.split(',')]
    is_admin = user['email'] in admin_emails
    
    token = create_token(user['id'], user['email'])
    user_response = User(**{k: v for k, v in user.items() if k != 'password'})
    
    return LoginResponse(token=token, user=user_response, is_admin=is_admin)

@api_router.get("/auth/me", response_model=User)
async def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return User(**{k: v for k, v in user.items() if k != 'password'})

# ============ CONFIG ROUTES ============

@api_router.get("/config", response_model=List[ConfigItem])
async def get_config():
    configs = await db.config.find({}, {"_id": 0}).to_list(100)
    return configs

@api_router.put("/config/{key}")
async def update_config(key: str, value: str, _: Dict[str, Any] = Depends(require_admin)):
    await db.config.update_one(
        {"key": key},
        {"$set": {"value": value}},
        upsert=True
    )
    return {"success": True}

# ============ PARTICIPANT ROUTES ============

@api_router.get("/participants", response_model=List[User])
async def get_participants(_: Dict[str, Any] = Depends(require_admin)):
    participants = await db.participants.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return participants

@api_router.post("/participants", response_model=User)
async def create_participant(participant: UserCreate, _: Dict[str, Any] = Depends(require_admin)):
    # Check if email exists
    existing = await db.participants.find_one({"email": participant.email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email existe déjà")
    
    # Generate password if not provided
    password = participant.password or str(uuid.uuid4())[:8]
    hashed_pw = hash_password(password)
    
    user_data = {
        "id": str(uuid.uuid4()),
        "nom": participant.nom,
        "email": participant.email,
        "password": hashed_pw,
        "actif": participant.actif,
        "mois_debut": participant.mois_debut or datetime.now(timezone.utc).strftime("%Y-%m"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.participants.insert_one(user_data)
    return User(**{k: v for k, v in user_data.items() if k != 'password'})

@api_router.put("/participants/{participant_id}", response_model=User)
async def update_participant(participant_id: str, update: UserCreate, _: Dict[str, Any] = Depends(require_admin)):
    update_data = {"nom": update.nom, "email": update.email, "actif": update.actif, "mois_debut": update.mois_debut}
    
    if update.password:
        update_data["password"] = hash_password(update.password)
    
    await db.participants.update_one({"id": participant_id}, {"$set": update_data})
    updated = await db.participants.find_one({"id": participant_id}, {"_id": 0, "password": 0})
    return User(**updated)

@api_router.put("/participants/{participant_id}/password")
async def change_password(participant_id: str, data: dict, user: Dict[str, Any] = Depends(get_current_user)):
    # Users can change their own password, or admin can change any password
    admin_emails_str = os.environ.get('ADMIN_EMAILS', 'eric.savary@lausanne.ch')
    admin_emails = [e.strip() for e in admin_emails_str.split(',')]
    is_admin = user['email'] in admin_emails
    
    if participant_id != user['id'] and not is_admin:
        raise HTTPException(status_code=403, detail="Vous ne pouvez changer que votre propre mot de passe")
    
    if not data.get('new_password'):
        raise HTTPException(status_code=400, detail="Nouveau mot de passe requis")
    
    # If changing own password, verify current password
    if participant_id == user['id'] and not is_admin:
        if not data.get('current_password'):
            raise HTTPException(status_code=400, detail="Mot de passe actuel requis")
        if not verify_password(data['current_password'], user['password']):
            raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    
    # Update password
    new_hashed = hash_password(data['new_password'])
    await db.participants.update_one({"id": participant_id}, {"$set": {"password": new_hashed}})
    
    return {"success": True, "message": "Mot de passe modifié avec succès"}

@api_router.delete("/participants/{participant_id}")
async def delete_participant(participant_id: str, user: Dict[str, Any] = Depends(require_admin)):
    # Check if trying to delete self
    if participant_id == user['id']:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous supprimer vous-même")
    
    # Check if it's the last admin
    participant = await db.participants.find_one({"id": participant_id}, {"_id": 0})
    if not participant:
        raise HTTPException(status_code=404, detail="Participant non trouvé")
    
    admin_emails_str = os.environ.get('ADMIN_EMAILS', 'eric.savary@lausanne.ch')
    admin_emails = [e.strip() for e in admin_emails_str.split(',')]
    
    if participant['email'] in admin_emails:
        # Count active admins
        active_admins = await db.participants.find({"email": {"$in": admin_emails}, "actif": True}).to_list(1000)
        if len(active_admins) <= 1:
            raise HTTPException(status_code=400, detail="Impossible de supprimer le dernier administrateur")
    
    # Soft delete
    await db.participants.update_one({"id": participant_id}, {"$set": {"actif": False}})
    return {"success": True}

# ============ PAIEMENT ROUTES ============

@api_router.get("/paiements", response_model=List[Paiement])
async def get_paiements(user: Dict[str, Any] = Depends(get_current_user)):
    paiements = await db.paiements.find({"participant_id": user['id']}, {"_id": 0}).to_list(1000)
    return paiements

@api_router.get("/paiements/all", response_model=List[Paiement])
async def get_all_paiements(_: Dict[str, Any] = Depends(require_admin)):
    paiements = await db.paiements.find({}, {"_id": 0}).to_list(10000)
    return paiements

@api_router.post("/paiements", response_model=Paiement)
async def create_paiement(paiement: PaiementCreate, user: Dict[str, Any] = Depends(get_current_user)):
    # Check for duplicate
    existing = await db.paiements.find_one({
        "participant_id": user['id'],
        "mois": paiement.mois
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Un versement existe déjà pour ce mois")
    
    paiement_data = {
        "id": str(uuid.uuid4()),
        "participant_id": user['id'],
        "mois": paiement.mois,
        "montant": paiement.montant,
        "methode": paiement.methode,
        "raison": paiement.raison,
        "statut": "en_attente",
        "date": datetime.now(timezone.utc).isoformat()
    }
    
    await db.paiements.insert_one(paiement_data)
    return Paiement(**paiement_data)

@api_router.put("/paiements/{paiement_id}", response_model=Paiement)
async def update_paiement(paiement_id: str, update: PaiementUpdate, _: Dict[str, Any] = Depends(require_admin)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    await db.paiements.update_one({"id": paiement_id}, {"$set": update_data})
    updated = await db.paiements.find_one({"id": paiement_id}, {"_id": 0})
    return Paiement(**updated)

@api_router.delete("/paiements/{paiement_id}")
async def delete_paiement(paiement_id: str, _: Dict[str, Any] = Depends(require_admin)):
    await db.paiements.delete_one({"id": paiement_id})
    return {"success": True}

@api_router.post("/paiements/confirm-month")
async def confirm_month_paiements(mois: str, _: Dict[str, Any] = Depends(require_admin)):
    result = await db.paiements.update_many(
        {"mois": mois, "statut": "en_attente"},
        {"$set": {"statut": "confirme"}}
    )
    return {"success": True, "modified": result.modified_count}

# ============ DEPENSE ROUTES ============

@api_router.post("/depenses")
async def create_depense(depense: DepenseRequest, _: Dict[str, Any] = Depends(require_admin)):
    if not depense.raison or not depense.raison.strip():
        raise HTTPException(status_code=400, detail="La raison est obligatoire")
    
    nb_participants = len(depense.participants)
    if nb_participants == 0:
        raise HTTPException(status_code=400, detail="Sélectionnez au moins un participant")
    
    # Calculate individual shares
    if depense.repartition == "egale":
        montant_par_personne = arrondir_005(depense.montant_total / nb_participants)
    else:  # pondérée
        if not depense.poids:
            raise HTTPException(status_code=400, detail="Poids requis pour répartition pondérée")
        
        total_poids = sum(depense.poids.get(pid, 1) for pid in depense.participants)
        shares = {}
        for pid in depense.participants:
            poids = depense.poids.get(pid, 1)
            share = (poids / total_poids) * depense.montant_total
            shares[pid] = arrondir_005(share)
    
    # Get current month
    mois_actuel = datetime.now(timezone.utc).strftime("%Y-%m")
    
    # Create paiements for each participant
    created_paiements = []
    for participant_id in depense.participants:
        montant = shares[participant_id] if depense.repartition == "ponderee" else montant_par_personne
        
        paiement_data = {
            "id": str(uuid.uuid4()),
            "participant_id": participant_id,
            "mois": mois_actuel,
            "montant": montant,
            "methode": "DEPENSE",
            "raison": depense.raison,
            "statut": "confirme",
            "date": datetime.now(timezone.utc).isoformat()
        }
        
        await db.paiements.insert_one(paiement_data)
        created_paiements.append(paiement_data)
    
    return {"success": True, "paiements_created": len(created_paiements)}

# ============ KPI ROUTES ============

@api_router.get("/kpi/participant", response_model=KPIResponse)
async def get_participant_kpi(user: Dict[str, Any] = Depends(get_current_user)):
    # Get config for montant mensuel
    config_montant = await db.config.find_one({"key": "montant_mensuel"})
    montant_mensuel = float(config_montant['value']) if config_montant else 50.0
    
    annee_actuelle = datetime.now(timezone.utc).year
    mois_actuel = datetime.now(timezone.utc).strftime("%Y-%m")
    
    # Get all paiements for current year
    paiements = await db.paiements.find({
        "participant_id": user['id'],
        "mois": {"$regex": f"^{annee_actuelle}"}
    }, {"_id": 0}).to_list(1000)
    
    total_confirme_annee = sum(p['montant'] for p in paiements if p['statut'] == 'confirme')
    en_attente_annee = sum(p['montant'] for p in paiements if p['statut'] == 'en_attente')
    
    # Calculate reste mois
    paiements_mois = [p for p in paiements if p['mois'] == mois_actuel and p['statut'] == 'confirme']
    total_mois = sum(p['montant'] for p in paiements_mois)
    reste_mois = max(0, montant_mensuel - total_mois)
    
    return KPIResponse(
        total_confirme_annee=total_confirme_annee,
        en_attente_annee=en_attente_annee,
        reste_mois=reste_mois
    )

@api_router.get("/kpi/admin", response_model=List[KPIParticipant])
async def get_admin_kpi(_: Dict[str, Any] = Depends(require_admin)):
    # Get config
    config_montant = await db.config.find_one({"key": "montant_mensuel"})
    montant_mensuel = float(config_montant['value']) if config_montant else 50.0
    
    annee_actuelle = datetime.now(timezone.utc).year
    mois_actuel_num = datetime.now(timezone.utc).month
    
    participants = await db.participants.find({"actif": True}, {"_id": 0, "password": 0}).to_list(1000)
    kpis = []
    
    for participant in participants:
        paiements = await db.paiements.find({
            "participant_id": participant['id'],
            "mois": {"$regex": f"^{annee_actuelle}"}
        }, {"_id": 0}).to_list(1000)
        
        confirme_annee = sum(p['montant'] for p in paiements if p['statut'] == 'confirme')
        en_attente = sum(p['montant'] for p in paiements if p['statut'] == 'en_attente')
        
        # Get participant start month
        mois_debut = participant.get('mois_debut', f"{annee_actuelle}-01")
        mois_debut_year, mois_debut_month = map(int, mois_debut.split('-'))
        
        # Calculate expected amount from start month to current month
        if mois_debut_year == annee_actuelle:
            start_month = mois_debut_month
        elif mois_debut_year < annee_actuelle:
            start_month = 1
        else:
            start_month = mois_actuel_num + 1  # Start in future, no expectation yet
        
        nb_mois_attendus = max(0, mois_actuel_num - start_month + 1)
        attendu = montant_mensuel * nb_mois_attendus
        manquant = max(0, attendu - confirme_annee)
        progression = (confirme_annee / attendu * 100) if attendu > 0 else 0
        
        # Check for retard (any past month after start without confirmation)
        en_retard = False
        for mois_num in range(start_month, mois_actuel_num):
            mois_str = f"{annee_actuelle}-{mois_num:02d}"
            paiement_mois = next((p for p in paiements if p['mois'] == mois_str), None)
            if not paiement_mois or paiement_mois['statut'] != 'confirme':
                en_retard = True
                break
        
        kpis.append(KPIParticipant(
            participant_id=participant['id'],
            nom=participant['nom'],
            confirme_annee=confirme_annee,
            en_attente=en_attente,
            manquant=manquant,
            progression=progression,
            en_retard=en_retard
        ))
    
    return kpis

# ============ EXPORT ROUTES ============

@api_router.get("/export/csv/{participant_id}")
async def export_csv_participant(participant_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    # Check access
    admin_emails_str = os.environ.get('ADMIN_EMAILS', 'eric.savary@lausanne.ch')
    admin_emails = [e.strip() for e in admin_emails_str.split(',')]
    is_admin = user['email'] in admin_emails
    
    if not is_admin and user['id'] != participant_id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    paiements = await db.paiements.find({"participant_id": participant_id}, {"_id": 0}).to_list(10000)
    
    # Generate CSV
    csv_lines = ["Mois,Montant,Méthode,Statut,Date,Raison"]
    for p in paiements:
        raison = p.get('raison', '').replace(',', ';') if p.get('raison') else ''
        csv_lines.append(f"{p['mois']},{p['montant']},{p['methode']},{p['statut']},{p['date']},{raison}")
    
    return {"csv": "\n".join(csv_lines)}

@api_router.get("/export/csv-all")
async def export_csv_all(_: Dict[str, Any] = Depends(require_admin)):
    # Get all participants
    participants_dict = {}
    participants = await db.participants.find({}, {"_id": 0}).to_list(1000)
    for p in participants:
        participants_dict[p['id']] = p['nom']
    
    # Get all paiements
    paiements = await db.paiements.find({}, {"_id": 0}).to_list(10000)
    
    # Sort by date
    paiements_sorted = sorted(paiements, key=lambda x: (x['mois'], x['date']))
    
    # Generate CSV
    csv_lines = ["Participant,Mois,Montant,Méthode,Statut,Date,Raison"]
    for p in paiements_sorted:
        participant_nom = participants_dict.get(p['participant_id'], 'Inconnu')
        raison = p.get('raison', '').replace(',', ';') if p.get('raison') else ''
        csv_lines.append(f"{participant_nom},{p['mois']},{p['montant']},{p['methode']},{p['statut']},{p['date']},{raison}")
    
    return {"csv": "\n".join(csv_lines)}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Initialize default config
    config_exists = await db.config.find_one({"key": "montant_mensuel"})
    if not config_exists:
        await db.config.insert_one({"key": "montant_mensuel", "value": "50"})
        await db.config.insert_one({"key": "devise", "value": "CHF"})
        await db.config.insert_one({"key": "titre", "value": "Cagnotte Cadre SIC"})
    
    # Create default admin if not exists
    admin_email = "eric.savary@lausanne.ch"
    admin_exists = await db.participants.find_one({"email": admin_email})
    if not admin_exists:
        admin_data = {
            "id": str(uuid.uuid4()),
            "nom": "Eric Savary",
            "email": admin_email,
            "password": hash_password("admin123"),
            "actif": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.participants.insert_one(admin_data)
        logger.info(f"Admin créé: {admin_email} / password: admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()