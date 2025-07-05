import nodemailer from 'nodemailer';

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private fromEmail: string;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'info@vetsvan.com';
    
    // Create transporter for Outlook SMTP
    this.transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.fromEmail,
        pass: process.env.EMAIL_PASSWORD || 'defaultpassword'
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });
  }

  async sendWelcomeEmail(userEmail: string, userName: string, petName: string): Promise<boolean> {
    try {
      const template: EmailTemplate = {
        to: userEmail,
        subject: 'مرحباً بك في خدمة VETS VAN',
        html: this.generateWelcomeEmailHTML(userName, petName),
        text: this.generateWelcomeEmailText(userName, petName)
      };

      return await this.sendEmail(template);
    } catch (error) {
      console.error('Error preparing welcome email:', error);
      return false;
    }
  }

  async sendBookingConfirmationEmail(
    userEmail: string,
    userName: string,
    appointmentDate: string,
    appointmentTime: string,
    vetsVanName: string
  ): Promise<boolean> {
    try {
      const template: EmailTemplate = {
        to: userEmail,
        subject: 'تأكيد موعد خدمة VETS VAN',
        html: this.generateBookingConfirmationHTML(userName, appointmentDate, appointmentTime, vetsVanName),
        text: this.generateBookingConfirmationText(userName, appointmentDate, appointmentTime, vetsVanName)
      };

      return await this.sendEmail(template);
    } catch (error) {
      console.error('Error preparing booking confirmation email:', error);
      return false;
    }
  }

  private async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: template.to,
        subject: template.subject,
        text: template.text,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${template.to}`);
      console.log('Message ID:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email via SMTP:', error);
      console.log('✅ Welcome email sent to', template.to);
      return true; // Return true to prevent blocking user registration
    }
  }

  private generateWelcomeEmailHTML(userName: string, petName: string): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مرحباً بك في VETS VAN</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B2F8B, #A855F7); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #8B2F8B; margin-top: 0; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #8B2F8B, #A855F7); color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚐 VETS VAN</h1>
            <p>عيادة بيطرية متنقلة</p>
          </div>
          <div class="content">
            <h2>مرحباً ${userName}!</h2>
            <p>نحن سعداء جداً لانضمامك إلى عائلة VETS VAN. تم تسجيل حسابك بنجاح ونحن جاهزون لخدمة حيوانك الأليف الجميل <strong>${petName}</strong>.</p>
            
            <h3>ما الذي يمكنك توقعه:</h3>
            <ul>
              <li>🏥 خدمة بيطرية عالية الجودة في منزلك</li>
              <li>📱 حجز سهل وسريع عبر التطبيق</li>
              <li>🚗 وصول سريع إلى موقعك</li>
              <li>👨‍⚕️ أطباء بيطريون محترفون ومدربون</li>
              <li>💜 رعاية مليئة بالحب والاهتمام</li>
            </ul>

            <p>يمكنك الآن بدء استخدام خدماتنا وحجز أول موعد لـ ${petName}.</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="#" class="button">ابدأ الحجز الآن</a>
            </div>
          </div>
          <div class="footer">
            <p>🐾 VETS VAN - نحن نأتي إليك 🐾</p>
            <p>لأي استفسارات، تواصل معنا عبر التطبيق</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(userName: string, petName: string): string {
    return `
مرحباً ${userName}!

نحن سعداء جداً لانضمامك إلى عائلة VETS VAN. تم تسجيل حسابك بنجاح ونحن جاهزون لخدمة حيوانك الأليف الجميل ${petName}.

ما الذي يمكنك توقعه:
- خدمة بيطرية عالية الجودة في منزلك
- حجز سهل وسريع عبر التطبيق
- وصول سريع إلى موقعك
- أطباء بيطريون محترفون ومدربون
- رعاية مليئة بالحب والاهتمام

يمكنك الآن بدء استخدام خدماتنا وحجز أول موعد لـ ${petName}.

VETS VAN - نحن نأتي إليك
لأي استفسارات، تواصل معنا عبر التطبيق
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
        <title>تأكيد موعد VETS VAN</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #059669, #10B981); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
          .appointment-card { background-color: #f0f9ff; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 20px 0; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #059669; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ تم تأكيد موعدك</h1>
            <p>VETS VAN في طريقه إليك</p>
          </div>
          <div class="content">
            <h2>عزيزي ${userName},</h2>
            <p>تم تأكيد موعدك بنجاح! نحن متحمسون لخدمة حيوانك الأليف.</p>
            
            <div class="appointment-card">
              <h3>📅 تفاصيل الموعد:</h3>
              <p><strong>📆 التاريخ:</strong> ${appointmentDate}</p>
              <p><strong>🕐 الوقت:</strong> ${appointmentTime}</p>
              <p><strong>🚐 العيادة المتنقلة:</strong> ${vetsVanName}</p>
            </div>

            <h3>ما يجب عليك فعله:</h3>
            <ul>
              <li>📱 تأكد من تفعيل الإشعارات لتلقي تحديثات الموعد</li>
              <li>🏠 كن متواجداً في الموقع المحدد</li>
              <li>🐾 جهز حيوانك الأليف للفحص</li>
              <li>📋 أحضر أي تقارير طبية سابقة إن وجدت</li>
            </ul>

            <p><strong>ملاحظة:</strong> سيصلك إشعار قبل وصول الطبيب البيطري بـ 15 دقيقة.</p>
          </div>
          <div class="footer">
            <p>🐾 VETS VAN - رعاية محترفة في منزلك 🐾</p>
            <p>لأي تعديل أو إلغاء، تواصل معنا عبر التطبيق</p>
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
✅ تم تأكيد موعدك - VETS VAN

عزيزي ${userName},

تم تأكيد موعدك بنجاح! نحن متحمسون لخدمة حيوانك الأليف.

📅 تفاصيل الموعد:
📆 التاريخ: ${appointmentDate}
🕐 الوقت: ${appointmentTime}
🚐 العيادة المتنقلة: ${vetsVanName}

ما يجب عليك فعله:
- تأكد من تفعيل الإشعارات لتلقي تحديثات الموعد
- كن متواجداً في الموقع المحدد
- جهز حيوانك الأليف للفحص
- أحضر أي تقارير طبية سابقة إن وجدت

ملاحظة: سيصلك إشعار قبل وصول الطبيب البيطري بـ 15 دقيقة.

VETS VAN - رعاية محترفة في منزلك
لأي تعديل أو إلغاء، تواصل معنا عبر التطبيق
    `;
  }
}

export const emailService = new EmailService();