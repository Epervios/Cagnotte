import { jsPDF } from 'jspdf';

export function exportMonthlyReportPDF(data) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFillColor(15, 92, 76);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('Cagnotte Cadre SIC', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(`Rapport Mensuel - ${data.month}`, pageWidth / 2, 32, { align: 'center' });
  
  // Body
  doc.setTextColor(0, 0, 0);
  let y = 55;
  
  // KPI Section
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Statistiques Globales', 20, y);
  y += 10;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Confirmé: ${data.totalConfirme.toFixed(2)} ${data.devise}`, 25, y);
  y += 8;
  doc.text(`En Attente: ${data.totalEnAttente.toFixed(2)} ${data.devise}`, 25, y);
  y += 8;
  doc.text(`Participants à jour: ${data.onTimeCount}/${data.totalParticipants}`, 25, y);
  y += 8;
  doc.text(`Taux de ponctualité: ${data.ponctualityRate.toFixed(1)}%`, 25, y);
  y += 15;
  
  // Participants Section
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Détail par Participant', 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  // Table headers
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
  doc.text('Nom', 25, y);
  doc.text('Confirmé', 80, y);
  doc.text('En Attente', 120, y);
  doc.text('Statut', 160, y);
  y += 10;
  
  // Table rows
  data.participants.forEach((p, index) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
    }
    
    doc.text(p.nom, 25, y);
    doc.text(`${p.confirme.toFixed(2)} ${data.devise}`, 80, y);
    doc.text(`${p.enAttente.toFixed(2)} ${data.devise}`, 120, y);
    doc.setTextColor(p.enRetard ? 200 : 0, p.enRetard ? 0 : 150, 0);
    doc.text(p.enRetard ? 'En retard' : 'À jour', 160, y);
    doc.setTextColor(0, 0, 0);
    y += 8;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - wizardaring.ch`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Save
  doc.save(`rapport_cagnotte_${data.month}.pdf`);
}
