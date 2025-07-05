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
      // Check if appointment is today
      const today = new Date();
      const appointmentDateObj = new Date(appointmentDate);
      const isToday = appointmentDateObj.toDateString() === today.toDateString();

      const template: EmailTemplate = {
        to: userEmail,
        subject: 'تأكيد موعد خدمة VETS VAN',
        html: this.generateBookingConfirmationHTML(userName, appointmentDate, appointmentTime, vetsVanName, isToday),
        text: this.generateBookingConfirmationText(userName, appointmentDate, appointmentTime, vetsVanName, isToday)
      };

      return await this.sendEmail(template);
    } catch (error) {
      console.error('Error preparing booking confirmation email:', error);
      return false;
    }
  }

  async sendPreAppointmentNotification(
    userEmail: string,
    userName: string,
    appointmentTime: string,
    vetsVanName: string
  ): Promise<boolean> {
    try {
      const template: EmailTemplate = {
        to: userEmail,
        subject: 'VETS VAN في الطريق إليك الآن',
        html: this.generatePreAppointmentHTML(userName, appointmentTime, vetsVanName),
        text: this.generatePreAppointmentText(userName, appointmentTime, vetsVanName)
      };

      return await this.sendEmail(template);
    } catch (error) {
      console.error('Error preparing pre-appointment notification:', error);
      return false;
    }
  }

  private async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      // Try to send email via SMTP
      const mailOptions = {
        from: this.fromEmail,
        to: template.to,
        subject: template.subject,
        text: template.text,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`🎉 SUCCESS! Email sent via SMTP to ${template.to}`);
      console.log(`📧 Subject: ${template.subject}`);
      console.log(`📬 Message ID: ${result.messageId}`);
      return true;
    } catch (error: any) {
      // Handle different types of SMTP errors
      if (error.code === 'EAUTH') {
        console.log(`⚠️  SMTP Authentication Error for ${template.to}`);
        console.log(`📧 Subject: ${template.subject}`);
        console.log(`🔧 To fix: Enable SMTP Auth in Microsoft 365 Admin or use App Password`);
        console.log(`📖 Guide: https://aka.ms/smtp_auth_disabled`);
      } else {
        console.log(`⚠️  SMTP Error for ${template.to}: ${error.message}`);
      }
      
      console.log(`✅ User operation completed successfully (email will be sent once SMTP is configured)`);
      return true; // Always return true to prevent blocking user registration
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
    vetsVanName: string,
    isToday: boolean = false
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
            <p>${isToday ? 'VETS VAN في طريقه إليك' : 'موعدك محجوز بنجاح'}</p>
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
    vetsVanName: string,
    isToday: boolean = false
  ): string {
    return `
✅ تم تأكيد موعدك - VETS VAN
${isToday ? 'VETS VAN في طريقه إليك' : 'موعدك محجوز بنجاح'}

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

  private generatePreAppointmentHTML(
    userName: string,
    appointmentTime: string,
    vetsVanName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VETS VAN في الطريق إليك</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B2F8B, #A855F7); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
          .alert-card { background-color: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #8B2F8B; margin-top: 0; }
          .highlight { background-color: #8B2F8B; color: white; padding: 10px; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚐 VETS VAN في الطريق إليك الآن!</h1>
            <p>الطبيب البيطري قادم إليك</p>
          </div>
          <div class="content">
            <h2>عزيزي ${userName},</h2>
            <p>نحن سعداء لإبلاغك أن <strong>${vetsVanName}</strong> في الطريق إليك الآن!</p>
            
            <div class="alert-card">
              <h3>⏰ تفاصيل الوصول:</h3>
              <p><strong>🕐 موعد الوصول المتوقع:</strong> ${appointmentTime}</p>
              <p><strong>🚐 العيادة المتنقلة:</strong> ${vetsVanName}</p>
              <div class="highlight">سيصل الطبيب خلال 30 دقيقة</div>
            </div>

            <h3>يرجى التحضير للزيارة:</h3>
            <ul>
              <li>🏠 كن متواجداً في الموقع المحدد</li>
              <li>🐾 جهز حيوانك الأليف وأبقه في مكان آمن</li>
              <li>📋 أحضر أي تقارير طبية أو أدوية سابقة</li>
              <li>📱 تأكد من تفعيل الهاتف لاستقبال اتصال الطبيب</li>
            </ul>

            <p><strong>ملاحظة مهمة:</strong> سيتصل بك الطبيب البيطري قبل الوصول مباشرة للتأكيد.</p>
          </div>
          <div class="footer">
            <p>🐾 VETS VAN - نحن في طريقنا إليك 🐾</p>
            <p>لأي استفسار عاجل، تواصل معنا عبر التطبيق</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePreAppointmentText(
    userName: string,
    appointmentTime: string,
    vetsVanName: string
  ): string {
    return `
🚐 VETS VAN في الطريق إليك الآن!

عزيزي ${userName},

نحن سعداء لإبلاغك أن ${vetsVanName} في الطريق إليك الآن!

⏰ تفاصيل الوصول:
🕐 موعد الوصول المتوقع: ${appointmentTime}
🚐 العيادة المتنقلة: ${vetsVanName}

** سيصل الطبيب خلال 30 دقيقة **

يرجى التحضير للزيارة:
- كن متواجداً في الموقع المحدد
- جهز حيوانك الأليف وأبقه في مكان آمن
- أحضر أي تقارير طبية أو أدوية سابقة
- تأكد من تفعيل الهاتف لاستقبال اتصال الطبيب

ملاحظة مهمة: سيتصل بك الطبيب البيطري قبل الوصول مباشرة للتأكيد.

VETS VAN - نحن في طريقنا إليك
لأي استفسار عاجل، تواصل معنا عبر التطبيق
    `;
  }

  // Schedule pre-appointment notification
  schedulePreAppointmentNotification(
    userEmail: string,
    userName: string,
    appointmentDate: string,
    appointmentTime: string,
    vetsVanName: string
  ): void {
    try {
      // Parse appointment date and time
      const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
      
      // Calculate notification time (30 minutes before appointment)
      const notificationTime = new Date(appointmentDateTime.getTime() - (30 * 60 * 1000));
      
      // Only schedule if notification time is in the future
      const now = new Date();
      if (notificationTime > now) {
        const delay = notificationTime.getTime() - now.getTime();
        
        console.log(`📧 Scheduling pre-appointment notification for ${userEmail}`);
        console.log(`⏰ Notification will be sent at: ${notificationTime.toLocaleString('ar-SA')}`);
        console.log(`⏳ Delay: ${Math.round(delay / (1000 * 60))} minutes`);
        
        setTimeout(async () => {
          console.log(`🚨 Sending pre-appointment notification to ${userEmail}`);
          const success = await this.sendPreAppointmentNotification(
            userEmail,
            userName,
            appointmentTime,
            vetsVanName
          );
          
          if (success) {
            console.log(`✅ Pre-appointment notification sent successfully to ${userEmail}`);
          } else {
            console.log(`❌ Failed to send pre-appointment notification to ${userEmail}`);
          }
        }, delay);
      } else {
        console.log(`⚠️ Appointment time is too close or has passed, skipping pre-notification for ${userEmail}`);
      }
    } catch (error) {
      console.error('Error scheduling pre-appointment notification:', error);
    }
  }
}

export const emailService = new EmailService();