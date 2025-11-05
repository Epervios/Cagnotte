import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { User, LogOut, Plus, Edit, Trash2, CheckCircle, Download, BarChart3 } from 'lucide-react';

function AdminPage() {
  const [user, setUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [config, setConfig] = useState({ montant_mensuel: '50', devise: 'CHF', titre: 'Cagnotte Cadre SIC' });
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialogs
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showDepense, setShowDepense] = useState(false);
  const [showEditConfig, setShowEditConfig] = useState(false);
  
  // Forms
  const [newParticipant, setNewParticipant] = useState({ nom: '', email: '', password: '' });
  const [depenseForm, setDepenseForm] = useState({
    participants: [],
    montant_total: '',
    raison: '',
    repartition: 'egale',
    poids: {}
  });
  const [editingPaiement, setEditingPaiement] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [participantsRes, paiementsRes, kpisRes, configRes] = await Promise.all([
        axios.get(`${API}/participants`),
        axios.get(`${API}/paiements/all`),
        axios.get(`${API}/kpi/admin`),
        axios.get(`${API}/config`)
      ]);
      
      setParticipants(participantsRes.data);
      setPaiements(paiementsRes.data);
      setKpis(kpisRes.data);
      
      const configObj = {};
      configRes.data.forEach(item => {
        configObj[item.key] = item.value;
      });
      setConfig(configObj);
    } catch (error) {
      toast.error('Erreur de chargement');
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/participants`, newParticipant);
      toast.success('Participant ajouté');
      setShowAddParticipant(false);
      setNewParticipant({ nom: '', email: '', password: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipant = async (id) => {
    if (!window.confirm('Désactiver ce participant ?')) return;
    
    try {
      await axios.delete(`${API}/participants/${id}`);
      toast.success('Participant désactivé');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdatePaiement = async () => {
    if (!editingPaiement) return;
    
    try {
      await axios.put(`${API}/paiements/${editingPaiement.id}`, {
        montant: parseFloat(editingPaiement.montant),
        methode: editingPaiement.methode,
        statut: editingPaiement.statut
      });
      toast.success('Paiement mis à jour');
      setEditingPaiement(null);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeletePaiement = async (id) => {
    if (!window.confirm('Supprimer ce paiement ?')) return;
    
    try {
      await axios.delete(`${API}/paiements/${id}`);
      toast.success('Paiement supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleConfirmMonth = async () => {
    if (!filterMonth) {
      toast.error('Sélectionnez un mois');
      return;
    }
    
    if (!window.confirm(`Confirmer tous les paiements en attente pour ${filterMonth} ?`)) return;
    
    try {
      const response = await axios.post(`${API}/paiements/confirm-month?mois=${filterMonth}`);
      toast.success(`${response.data.modified} paiement(s) confirmé(s)`);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleCreateDepense = async (e) => {
    e.preventDefault();
    
    if (depenseForm.participants.length === 0) {
      toast.error('Sélectionnez au moins un participant');
      return;
    }
    
    if (!depenseForm.raison.trim()) {
      toast.error('La raison est obligatoire');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(`${API}/depenses`, {
        participants: depenseForm.participants,
        montant_total: parseFloat(depenseForm.montant_total),
        raison: depenseForm.raison,
        repartition: depenseForm.repartition,
        poids: depenseForm.poids
      });
      
      toast.success('Dépense créée');
      setShowDepense(false);
      setDepenseForm({
        participants: [],
        montant_total: '',
        raison: '',
        repartition: 'egale',
        poids: {}
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleParticipant = (participantId) => {
    setDepenseForm(prev => ({
      ...prev,
      participants: prev.participants.includes(participantId)
        ? prev.participants.filter(id => id !== participantId)
        : [...prev.participants, participantId]
    }));
  };

  const handleSelectAllParticipants = () => {
    setDepenseForm(prev => ({
      ...prev,
      participants: participants.filter(p => p.actif).map(p => p.id)
    }));
  };

  const handleDeselectAllParticipants = () => {
    setDepenseForm(prev => ({ ...prev, participants: [] }));
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await Promise.all([
        axios.put(`${API}/config/montant_mensuel`, config.montant_mensuel, {
          headers: { 'Content-Type': 'text/plain' }
        }),
        axios.put(`${API}/config/devise`, config.devise, {
          headers: { 'Content-Type': 'text/plain' }
        }),
        axios.put(`${API}/config/titre`, config.titre, {
          headers: { 'Content-Type': 'text/plain' }
        })
      ]);
      
      toast.success('Configuration mise à jour');
      setShowEditConfig(false);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Filter paiements
  const filteredPaiements = paiements.filter(p => {
    if (searchTerm) {
      const participant = participants.find(part => part.id === p.participant_id);
      if (participant && !participant.nom.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }
    if (filterYear && !p.mois.startsWith(filterYear)) return false;
    if (filterMonth && p.mois !== filterMonth) return false;
    return true;
  });

  // Calculate monthly stats for chart
  const monthlyStats = {};
  paiements.filter(p => p.statut === 'confirme' && p.mois.startsWith(filterYear)).forEach(p => {
    if (!monthlyStats[p.mois]) monthlyStats[p.mois] = 0;
    monthlyStats[p.mois] += p.montant;
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return `${filterYear}-${String(month).padStart(2, '0')}`;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{config.titre} - Admin</h1>
            <p className="text-gray-600 mt-1">Gestion de la cagnotte</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/participant')}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              data-testid="switch-to-participant-button"
            >
              <User className="w-4 h-4 mr-2" />
              Vue Participant
            </Button>
            <Button onClick={handleLogout} variant="outline" data-testid="logout-button">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Filters & Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtres et Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="filterYear">Année</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger id="filterYear">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="filterMonth">Mois</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger id="filterMonth">
                    <SelectValue placeholder="Tous les mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les mois</SelectItem>
                    {months.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="search">Rechercher participant</Label>
                <Input
                  id="search"
                  placeholder="Nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="search-participant-input"
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleConfirmMonth}
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                  disabled={!filterMonth}
                  data-testid="confirm-month-button"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer mois
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="add-participant-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter Participant
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouveau Participant</DialogTitle>
                    <DialogDescription>Ajoutez un nouveau membre à la cagnotte</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddParticipant} className="space-y-4">
                    <div>
                      <Label htmlFor="nom">Nom</Label>
                      <Input
                        id="nom"
                        value={newParticipant.nom}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, nom: e.target.value }))}
                        required
                        data-testid="new-participant-nom-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newParticipant.email}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                        required
                        data-testid="new-participant-email-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Mot de passe (optionnel)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newParticipant.password}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Auto-généré si vide"
                        data-testid="new-participant-password-input"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading} data-testid="submit-new-participant-button">
                      {loading ? 'Ajout...' : 'Ajouter'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showDepense} onOpenChange={setShowDepense}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="create-depense-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer Dépense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nouvelle Dépense</DialogTitle>
                    <DialogDescription>Créez une dépense répartie entre les participants</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateDepense} className="space-y-4">
                    <div>
                      <Label>Participants</Label>
                      <div className="flex gap-2 mb-2">
                        <Button type="button" size="sm" onClick={handleSelectAllParticipants} data-testid="select-all-participants-button">
                          Tous
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={handleDeselectAllParticipants} data-testid="deselect-all-participants-button">
                          Aucun
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                        {participants.filter(p => p.actif).map(p => (
                          <div key={p.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`participant-${p.id}`}
                              checked={depenseForm.participants.includes(p.id)}
                              onCheckedChange={() => handleToggleParticipant(p.id)}
                              data-testid={`checkbox-participant-${p.id}`}
                            />
                            <Label htmlFor={`participant-${p.id}`} className="text-sm cursor-pointer">{p.nom}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="montant_total">Montant Total ({config.devise})</Label>
                      <Input
                        id="montant_total"
                        type="number"
                        step="0.01"
                        min="0"
                        value={depenseForm.montant_total}
                        onChange={(e) => setDepenseForm(prev => ({ ...prev, montant_total: e.target.value }))}
                        required
                        data-testid="depense-montant-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="raison">Raison (obligatoire)</Label>
                      <Input
                        id="raison"
                        value={depenseForm.raison}
                        onChange={(e) => setDepenseForm(prev => ({ ...prev, raison: e.target.value }))}
                        placeholder="Ex: Repas du mardi soir"
                        required
                        data-testid="depense-raison-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="repartition">Répartition</Label>
                      <Select
                        value={depenseForm.repartition}
                        onValueChange={(value) => setDepenseForm(prev => ({ ...prev, repartition: value }))}
                      >
                        <SelectTrigger id="repartition" data-testid="depense-repartition-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="egale">Parts égales</SelectItem>
                          <SelectItem value="ponderee">Pondérée (prochainement)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading} data-testid="submit-depense-button">
                      {loading ? 'Création...' : 'Créer Dépense'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showEditConfig} onOpenChange={setShowEditConfig}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="edit-config-button">
                    <Edit className="w-4 h-4 mr-2" />
                    Configuration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configuration</DialogTitle>
                    <DialogDescription>Paramètres de la cagnotte</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateConfig} className="space-y-4">
                    <div>
                      <Label htmlFor="titre">Titre</Label>
                      <Input
                        id="titre"
                        value={config.titre}
                        onChange={(e) => setConfig(prev => ({ ...prev, titre: e.target.value }))}
                        required
                        data-testid="config-titre-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="montant_mensuel">Montant Mensuel</Label>
                      <Input
                        id="montant_mensuel"
                        type="number"
                        step="0.01"
                        value={config.montant_mensuel}
                        onChange={(e) => setConfig(prev => ({ ...prev, montant_mensuel: e.target.value }))}
                        required
                        data-testid="config-montant-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="devise">Devise</Label>
                      <Input
                        id="devise"
                        value={config.devise}
                        onChange={(e) => setConfig(prev => ({ ...prev, devise: e.target.value }))}
                        required
                        data-testid="config-devise-input"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading} data-testid="submit-config-button">
                      {loading ? 'Mise à jour...' : 'Mettre à jour'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* KPIs by Participant */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>KPI par Participant</CardTitle>
            <CardDescription>Vue d'ensemble de la progression</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Confirmé ({filterYear})</th>
                    <th>En Attente</th>
                    <th>Manquant</th>
                    <th>Progression</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.map(kpi => (
                    <tr key={kpi.participant_id} data-testid={`kpi-row-${kpi.participant_id}`}>
                      <td className="font-medium">{kpi.nom}</td>
                      <td>{kpi.confirme_annee.toFixed(2)} {config.devise}</td>
                      <td>{kpi.en_attente.toFixed(2)} {config.devise}</td>
                      <td>{kpi.manquant.toFixed(2)} {config.devise}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full"
                              style={{ width: `${Math.min(kpi.progression, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{kpi.progression.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        {kpi.en_retard ? (
                          <Badge variant="destructive" data-testid="kpi-badge-retard">En Retard</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800" data-testid="kpi-badge-ok">À jour</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Chart */}
        {Object.keys(monthlyStats).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Graphique Mensuel - {filterYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(monthlyStats).sort().map(([month, total]) => (
                  <div key={month} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-20">{month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-emerald-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(total / Math.max(...Object.values(monthlyStats))) * 100}%`, minWidth: '60px' }}
                      >
                        <span className="text-xs text-white font-medium">{total.toFixed(2)} {config.devise}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participants Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Gestion des Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => (
                    <tr key={p.id} data-testid={`participant-row-${p.id}`}>
                      <td>{p.nom}</td>
                      <td>{p.email}</td>
                      <td>
                        <Badge className={p.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {p.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteParticipant(p.id)}
                          data-testid={`delete-participant-${p.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Paiements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tous les Paiements</CardTitle>
            <CardDescription>{filteredPaiements.length} paiement(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Mois</th>
                    <th>Montant</th>
                    <th>Méthode</th>
                    <th>Statut</th>
                    <th>Raison</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaiements.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-gray-500 py-8">
                        Aucun paiement trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredPaiements.map(p => {
                      const participant = participants.find(part => part.id === p.participant_id);
                      return (
                        <tr key={p.id} data-testid={`paiement-row-${p.id}`}>
                          <td>{participant?.nom || 'Inconnu'}</td>
                          <td>{p.mois}</td>
                          <td>{p.montant.toFixed(2)} {config.devise}</td>
                          <td>{p.methode}</td>
                          <td>
                            {p.statut === 'confirme' ? (
                              <Badge className="bg-green-100 text-green-800">Confirmé</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">En Attente</Badge>
                            )}
                          </td>
                          <td>{p.raison || '-'}</td>
                          <td className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingPaiement(p)}
                              data-testid={`edit-paiement-${p.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePaiement(p.id)}
                              data-testid={`delete-paiement-${p.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Paiement Dialog */}
        {editingPaiement && (
          <Dialog open={!!editingPaiement} onOpenChange={() => setEditingPaiement(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Éditer Paiement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-montant">Montant</Label>
                  <Input
                    id="edit-montant"
                    type="number"
                    step="0.01"
                    value={editingPaiement.montant}
                    onChange={(e) => setEditingPaiement(prev => ({ ...prev, montant: e.target.value }))}
                    data-testid="edit-paiement-montant-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-methode">Méthode</Label>
                  <Select
                    value={editingPaiement.methode}
                    onValueChange={(value) => setEditingPaiement(prev => ({ ...prev, methode: value }))}
                  >
                    <SelectTrigger id="edit-methode" data-testid="edit-paiement-methode-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TWINT">TWINT</SelectItem>
                      <SelectItem value="VIREMENT">Virement</SelectItem>
                      <SelectItem value="AUTRE">Autre</SelectItem>
                      <SelectItem value="DEPENSE">Dépense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-statut">Statut</Label>
                  <Select
                    value={editingPaiement.statut}
                    onValueChange={(value) => setEditingPaiement(prev => ({ ...prev, statut: value }))}
                  >
                    <SelectTrigger id="edit-statut" data-testid="edit-paiement-statut-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_attente">En Attente</SelectItem>
                      <SelectItem value="confirme">Confirmé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdatePaiement} className="w-full" data-testid="submit-edit-paiement-button">
                  Mettre à jour
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default AdminPage;