import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';

// Microsoft Graph configuration
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`
  }
};

const msalInstance = new ConfidentialClientApplication(msalConfig);

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@vetsvan.com';
  }

  async sendWelcomeEmail(userEmail: string, userName: string, petName: string): Promise<boolean> {
    if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET || !process.env.AZURE_TENANT_ID) {
      console.log('Microsoft Graph API credentials not configured, skipping email send');
      return false;
    }

    const template: EmailTemplate = {
      to: userEmail,
      subject: 'مرحباً بك في VetsVan - خدمة الطبيب البيطري المتنقل',
      html: this.generateWelcomeEmailHTML(userName, petName),
      text: this.generateWelcomeEmailText(userName, petName)
    };

    return this.sendEmail(template);
  }

  async sendBookingConfirmationEmail(
    userEmail: string, 
    userName: string, 
    appointmentDate: string, 
    appointmentTime: string,
    vetsVanName: string
  ): Promise<boolean> {
    if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET || !process.env.AZURE_TENANT_ID) {
      console.log('Microsoft Graph API credentials not configured, skipping email send');
      return false;
    }

    const template: EmailTemplate = {
      to: userEmail,
      subject: 'تأكيد موعد الطبيب البيطري - VetsVan',
      html: this.generateBookingConfirmationHTML(userName, appointmentDate, appointmentTime, vetsVanName),
      text: this.generateBookingConfirmationText(userName, appointmentDate, appointmentTime, vetsVanName)
    };

    return this.sendEmail(template);
  }

  private async getAccessToken(): Promise<string> {
    try {
      const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      };

      const response = await msalInstance.acquireTokenByClientCredential(clientCredentialRequest);
      if (!response || !response.accessToken) {
        throw new Error('Failed to acquire access token');
      }
      return response.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  private async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      
      const emailData = {
        message: {
          subject: template.subject,
          body: {
            contentType: 'HTML',
            content: template.html
          },
          toRecipients: [
            {
              emailAddress: {
                address: template.to
              }
            }
          ],
          from: {
            emailAddress: {
              address: this.fromEmail
            }
          }
        }
      };

      const response = await axios.post(
        'https://graph.microsoft.com/v1.0/me/sendMail',
        emailData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Email sent successfully to ${template.to}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending email via Microsoft Graph:', error);
      return false;
    }
  }

  private generateWelcomeEmailHTML(userName: string, petName: string): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مرحباً بك في VetsVan</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B2F8B, #A855F7); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px; }
          .highlight { color: #8B2F8B; font-weight: bold; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background: linear-gradient(135deg, #8B2F8B, #A855F7); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🚐 VetsVan</div>
            <h1>مرحباً بك ${userName}!</h1>
            <p>خدمة الطبيب البيطري المتنقل</p>
          </div>
          
          <div class="content">
            <h2>أهلاً وسهلاً بك في عائلة VetsVan! 🎉</h2>
            
            <p>نحن سعداء جداً بانضمامك إلينا. الآن يمكنك الحصول على أفضل خدمات الطب البيطري لحيوانك الأليف <span class="highlight">${petName}</span> في راحة منزلك.</p>
            
            <h3>ما يمكنك فعله الآن:</h3>
            <ul>
              <li>📅 حجز موعد مع طبيب بيطري متنقل</li>
              <li>🏥 الحصول على فحص شامل لحيوانك الأليف</li>
              <li>💉 خدمات التطعيم والعلاج</li>
              <li>✂️ خدمات التجميل والنظافة</li>
              <li>📞 استشارات طبية على مدار الساعة</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="#" class="button">احجز موعدك الأول الآن</a>
            </div>
            
            <p><strong>نصائح مهمة للبداية:</strong></p>
            <ul>
              <li>تأكد من وجود مكان آمن ومريح لحيوانك الأليف أثناء الزيارة</li>
              <li>أحضر أي تقارير طبية سابقة إن وجدت</li>
              <li>تأكد من توفر رقم هاتفك للتواصل معك</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>🚐 VetsVan - خدمة الطبيب البيطري المتنقل</p>
            <p>نحن هنا لخدمتك وخدمة حيوانك الأليف على مدار الساعة</p>
            <p style="font-size: 12px; color: #999;">هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(userName: string, petName: string): string {
    return `
      مرحباً ${userName}!
      
      أهلاً وسهلاً بك في VetsVan - خدمة الطبيب البيطري المتنقل
      
      نحن سعداء جداً بانضمامك إلينا. الآن يمكنك الحصول على أفضل خدمات الطب البيطري لحيوانك الأليف ${petName} في راحة منزلك.
      
      ما يمكنك فعله الآن:
      - حجز موعد مع طبيب بيطري متنقل
      - الحصول على فحص شامل لحيوانك الأليف
      - خدمات التطعيم والعلاج
      - خدمات التجميل والنظافة
      - استشارات طبية على مدار الساعة
      
      نصائح مهمة للبداية:
      - تأكد من وجود مكان آمن ومريح لحيوانك الأليف أثناء الزيارة
      - أحضر أي تقارير طبية سابقة إن وجدت
      - تأكد من توفر رقم هاتفك للتواصل معك
      
      VetsVan - نحن هنا لخدمتك وخدمة حيوانك الأليف على مدار الساعة
    `;
  }

  private generateBookingConfirmationHTML(
    userName: string, 
    appointmentDate: string, 
    appointmentTime: string,
    vetsVanName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تأكيد موعد الطبيب البيطري</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B2F8B, #A855F7); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px; }
          .highlight { color: #8B2F8B; font-weight: bold; }
          .appointment-card { background-color: #f8f9fa; border-right: 4px solid #8B2F8B; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .success-icon { font-size: 48px; color: #28a745; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🚐 VetsVan</div>
            <h1>تم تأكيد موعدك!</h1>
            <p>خدمة الطبيب البيطري المتنقل</p>
          </div>
          
          <div class="content">
            <div class="success-icon">✅</div>
            
            <h2>عزيزي ${userName}</h2>
            <p>تم تأكيد موعدك مع الطبيب البيطري بنجاح!</p>
            
            <div class="appointment-card">
              <h3>📅 تفاصيل الموعد:</h3>
              <p><strong>التاريخ:</strong> <span class="highlight">${appointmentDate}</span></p>
              <p><strong>الوقت:</strong> <span class="highlight">${appointmentTime}</span></p>
              <p><strong>العيادة المتنقلة:</strong> <span class="highlight">${vetsVanName}</span></p>
            </div>
            
            <h3>ما يجب فعله قبل الموعد:</h3>
            <ul>
              <li>🏠 تأكد من تنظيف المكان المخصص للفحص</li>
              <li>📋 اجمع أي تقارير طبية سابقة</li>
              <li>📱 تأكد من أن هاتفك متاح للاتصال</li>
              <li>🧼 تأكد من نظافة حيوانك الأليف</li>
              <li>😌 حافظ على هدوء حيوانك الأليف</li>
            </ul>
            
            <div style="background-color: #e3f2fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p><strong>💡 ملاحظة مهمة:</strong> سيتصل بك الطبيب البيطري قبل الوصول بـ 15-20 دقيقة لتأكيد موقعك.</p>
            </div>
            
            <p>نتطلع لخدمتك وخدمة حيوانك الأليف. إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
          </div>
          
          <div class="footer">
            <p>🚐 VetsVan - خدمة الطبيب البيطري المتنقل</p>
            <p>نحن هنا لخدمتك وخدمة حيوانك الأليف على مدار الساعة</p>
            <p style="font-size: 12px; color: #999;">هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateBookingConfirmationText(
    userName: string, 
    appointmentDate: string, 
    appointmentTime: string,
    vetsVanName: string
  ): string {
    return `
      تم تأكيد موعدك!
      
      عزيزي ${userName}
      
      تم تأكيد موعدك مع الطبيب البيطري بنجاح!
      
      تفاصيل الموعد:
      التاريخ: ${appointmentDate}
      الوقت: ${appointmentTime}
      العيادة المتنقلة: ${vetsVanName}
      
      ما يجب فعله قبل الموعد:
      - تأكد من تنظيف المكان المخصص للفحص
      - اجمع أي تقارير طبية سابقة
      - تأكد من أن هاتفك متاح للاتصال
      - تأكد من نظافة حيوانك الأليف
      - حافظ على هدوء حيوانك الأليف
      
      ملاحظة مهمة: سيتصل بك الطبيب البيطري قبل الوصول بـ 15-20 دقيقة لتأكيد موقعك.
      
      VetsVan - نحن هنا لخدمتك وخدمة حيوانك الأليف على مدار الساعة
    `;
  }
}

export const emailService = new EmailService();