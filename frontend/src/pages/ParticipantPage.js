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
import { ArrowRight, Download, LogOut, Shield } from 'lucide-react';

function ParticipantPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [kpi, setKpi] = useState({ total_confirme_annee: 0, en_attente_annee: 0, reste_mois: 0 });
  const [paiements, setPaiements] = useState([]);
  const [config, setConfig] = useState({ montant_mensuel: '50', devise: 'CHF' });
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [mois, setMois] = useState('');
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState('TWINT');
  
  // Filters
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [hideFuture, setHideFuture] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedIsAdmin = localStorage.getItem('is_admin') === 'true';
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAdmin(storedIsAdmin);
    }
    
    // Set default month
    const now = new Date();
    setMois(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    
    loadData();
  }, []);

  // Update montant when config changes
  useEffect(() => {
    if (config.montant_mensuel && !montant) {
      setMontant(config.montant_mensuel);
    }
  }, [config]);

  const loadData = async () => {
    try {
      const [kpiRes, paiementsRes, configRes] = await Promise.all([
        axios.get(`${API}/kpi/participant`),
        axios.get(`${API}/paiements`),
        axios.get(`${API}/config`)
      ]);
      
      setKpi(kpiRes.data);
      setPaiements(paiementsRes.data);
      
      const configObj = {};
      configRes.data.forEach(item => {
        configObj[item.key] = item.value;
      });
      setConfig(configObj);
      setMontant(configObj.montant_mensuel || '50');
    } catch (error) {
      toast.error('Erreur de chargement');
    }
  };

  const handleDeclare = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/paiements`, {
        mois,
        montant: parseFloat(montant),
        methode,
        raison: null
      });
      
      toast.success('Versement déclaré avec succès');
      loadData();
      
      // Reset to next month
      const now = new Date();
      setMois(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      setMontant(config.montant_mensuel || '50');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la déclaration');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API}/export/csv/${user.id}`);
      const blob = new Blob([response.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paiements_${user.nom}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Export réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  // Check if duplicate exists
  const hasDuplicate = paiements.some(p => p.mois === mois);
  
  // Filter paiements
  const filteredPaiements = paiements.filter(p => {
    if (!p.mois.startsWith(filterYear)) return false;
    if (hideFuture) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return p.mois <= currentMonth;
    }
    return true;
  });
  
  // Check if in retard
  const isEnRetard = (paiement) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return paiement.mois < currentMonth && paiement.statut !== 'confirme';
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Cagnotte Cadre SIC</h1>
            <p className="text-gray-600 mt-1">Bienvenue, {user.nom}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                data-testid="switch-to-admin-button"
              >
                <Shield className="w-4 h-4 mr-2" />
                Vue Admin
              </Button>
            )}
            <Button onClick={handleLogout} variant="outline" data-testid="logout-button">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Confirmé (Année)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600" data-testid="kpi-total-confirme">
                {kpi.total_confirme_annee.toFixed(2)} {config.devise}
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">En Attente (Année)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600" data-testid="kpi-en-attente">
                {kpi.en_attente_annee.toFixed(2)} {config.devise}
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Reste du Mois</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-800" data-testid="kpi-reste-mois">
                {kpi.reste_mois.toFixed(2)} {config.devise}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Declare Payment Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Déclarer un Versement</CardTitle>
            <CardDescription>Déclarez votre contribution mensuelle</CardDescription>
          </CardHeader>
          <CardContent>
            {hasDuplicate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4" data-testid="duplicate-warning">
                <p className="text-yellow-800 font-medium">⚠️ Un versement existe déjà pour ce mois</p>
              </div>
            )}
            
            <form onSubmit={handleDeclare} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="mois">Mois</Label>
                <Input
                  id="mois"
                  type="month"
                  value={mois}
                  onChange={(e) => setMois(e.target.value)}
                  required
                  data-testid="declare-mois-input"
                />
              </div>
              
              <div>
                <Label htmlFor="montant">Montant ({config.devise})</Label>
                <Input
                  id="montant"
                  type="number"
                  step="0.01"
                  min="0"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  required
                  data-testid="declare-montant-input"
                />
              </div>
              
              <div>
                <Label htmlFor="methode">Méthode</Label>
                <Select value={methode} onValueChange={setMethode}>
                  <SelectTrigger id="methode" data-testid="declare-methode-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWINT">TWINT</SelectItem>
                    <SelectItem value="VIREMENT">Virement</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                  disabled={loading || hasDuplicate}
                  data-testid="declare-submit-button"
                >
                  {loading ? 'Déclaration...' : 'Déclarer'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Paiements Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Mes Paiements</CardTitle>
                <CardDescription>Historique de vos versements</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExportCSV} variant="outline" size="sm" data-testid="export-csv-button">
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
            
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
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
              
              <div className="flex items-end">
                <Button
                  variant={hideFuture ? "default" : "outline"}
                  onClick={() => setHideFuture(!hideFuture)}
                  size="sm"
                  data-testid="hide-future-button"
                >
                  {hideFuture ? 'Afficher futur' : 'Masquer futur'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Montant</th>
                    <th>Méthode</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Raison</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaiements.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-500 py-8">
                        Aucun paiement trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredPaiements.map(p => (
                      <tr key={p.id} data-testid={`paiement-row-${p.id}`}>
                        <td>{p.mois}</td>
                        <td>{p.montant.toFixed(2)} {config.devise}</td>
                        <td>{p.methode}</td>
                        <td>
                          {isEnRetard(p) ? (
                            <Badge variant="destructive" data-testid="badge-retard">En Retard</Badge>
                          ) : p.statut === 'confirme' ? (
                            <Badge className="bg-green-100 text-green-800" data-testid="badge-confirme">Confirmé</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800" data-testid="badge-attente">En Attente</Badge>
                          )}
                        </td>
                        <td>{new Date(p.date).toLocaleDateString('fr-CH')}</td>
                        <td>{p.raison || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ParticipantPage;