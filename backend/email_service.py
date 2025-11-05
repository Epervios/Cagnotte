import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
import os
import logging

logger = logging.getLogger(__name__)

# Email configuration
SMTP_HOST = "smtp.wizardaring.ch"
SMTP_PORT = 587
SMTP_USER = "cagnotte@wizardaring.ch"
SMTP_PASSWORD = "Q15~s3v3x"
FROM_EMAIL = "cagnotte@wizardaring.ch"

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email using SMTP"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email envoyé à {to_email}")
        return True
    except Exception as e:
        logger.error(f"Erreur envoi email à {to_email}: {str(e)}")
        return False

def send_payment_reminder(participant_name: str, participant_email: str, mois: str, montant: float, devise: str) -> bool:
    """Send payment reminder email"""
    subject = f"Rappel - Paiement Cagnotte Cadre SIC ({mois})"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0F5C4C 0%, #0a4739 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
            .amount {{ font-size: 28px; font-weight: bold; color: #0F5C4C; text-align: center; margin: 20px 0; }}
            .button {{ display: inline-block; background: #0F5C4C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Rappel de Paiement</h1>
                <p>Cagnotte Cadre SIC</p>
            </div>
            <div class="content">
                <p>Bonjour {participant_name},</p>
                
                <p>Nous vous rappelons que votre contribution pour le mois de <strong>{mois}</strong> n'a pas encore été enregistrée.</p>
                
                <div class="amount">{montant:.2f} {devise}</div>
                
                <p><strong>Méthodes de paiement :</strong></p>
                <ul>
                    <li>TWINT</li>
                    <li>Virement bancaire</li>
                </ul>
                
                <p>Une fois le versement effectué, pensez à le déclarer sur la plateforme.</p>
                
                <div style="text-align: center;">
                    <a href="https://wizardaring.ch" class="button">Accéder à la plateforme</a>
                </div>
                
                <p>Merci pour votre participation !</p>
            </div>
            <div class="footer">
                <p>Cagnotte Cadre SIC - wizardaring.ch</p>
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(participant_email, subject, html_content)

def send_admin_monthly_summary(admin_email: str, stats: dict) -> bool:
    """Send monthly summary to admin"""
    subject = f"Résumé Mensuel - Cagnotte Cadre SIC ({datetime.now().strftime('%B %Y')})"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0F5C4C 0%, #0a4739 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
            .stat-box {{ background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #0F5C4C; }}
            .stat-label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
            .stat-value {{ font-size: 24px; font-weight: bold; color: #0F5C4C; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th {{ background: #0F5C4C; color: white; padding: 10px; text-align: left; }}
            td {{ padding: 10px; border-bottom: 1px solid #ddd; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Résumé Mensuel</h1>
                <p>Cagnotte Cadre SIC</p>
            </div>
            <div class="content">
                <div class="stat-box">
                    <div class="stat-label">Total Confirmé</div>
                    <div class="stat-value">{stats.get('total_confirme', 0):.2f} CHF</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-label">En Attente</div>
                    <div class="stat-value">{stats.get('total_en_attente', 0):.2f} CHF</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-label">Participants en Retard</div>
                    <div class="stat-value">{stats.get('nb_retards', 0)}</div>
                </div>
                
                <h3>Détail par Participant</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.get('details_html', '')}
                    </tbody>
                </table>
            </div>
            <div class="footer">
                <p>Cagnotte Cadre SIC - wizardaring.ch</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(admin_email, subject, html_content)
