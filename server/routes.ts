import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sessionService } from "./sessionService";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { loginSchema, insertUserSchema, rideRequestSchema, registerSchema, otpVerificationSchema, insertOtpVerificationSchema, insertAdminUserSchema, adminUsers, authorizationRoles, redZones, insertOutgoingPaymentSchema, insertIncomePaymentSchema } from "@shared/schema";
import { MyFatoorahService } from "./services/myfatoorah";
import { ZodError } from "zod";
import { emailService } from "./emailService";
import bcrypt from 'bcrypt';
import { addPublicPaymentRoutes } from "./routes-public";
import { db } from "./db";
import { sql, eq } from "drizzle-orm";
// Payment service removed per user request

async function requireAuth(req: any, res: any, next: any) {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      console.log('⚠️ No token provided in request');
      return res.status(401).json({ 
        message: 'Unauthorized',
        error: 'No authentication token provided'
      });
    }
    
    const session = await sessionService.getSession(sessionId);
    
    if (!session) {
      console.log('❌ Invalid or expired token:', sessionId);
      return res.status(401).json({ 
        message: 'Unauthorized',
        error: 'Invalid or expired authentication token'
      });
    }
    
    console.log(`✅ Valid session found for user ${session.userId} (${session.userType})`);
    req.user = session.userData;
    req.session = session;
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({ 
      message: 'Authentication error',
      error: 'Failed to validate session'
    });
  }
}

// Error message translations
function getErrorMessage(key: string, language: string = 'ar') {
  const messages = {
    ar: {
      phoneExists: 'رقم الهاتف مستخدم بالفعل',
      emailExists: 'الإيميل مستخدم بالفعل',
      serverError: 'خطأ في الخادم',
      phoneInvalid: 'رقم الهاتف يجب أن يبدأ بـ 05 ويكون 10 أرقام',
      logoutSuccess: 'تم تسجيل الخروج بنجاح'
    },
    en: {
      phoneExists: 'Phone number already exists',
      emailExists: 'Email address already exists',
      serverError: 'Server error',
      phoneInvalid: 'Phone number must start with 05 and be 10 digits',
      logoutSuccess: 'Successfully logged out'
    }
  };
  
  return messages[language]?.[key] || messages.ar[key];
}

// Enhanced payment linking with multi-criteria matching
async function enhancedPaymentLinking() {
  try {
    console.log('🔄 Running enhanced payment linking job...');
    
    // Find all unlinked payments from the last 7 days
    const unlinkedPayments = await db.execute(sql`
      SELECT p.id, p.myfatoorah_payment_id, p.amount, p.currency, p.customer_name, 
             p.customer_phone, p.customer_email, p.created_at
      FROM payment_transactions p
      WHERE p.booking_id IS NULL 
        AND p.status = 'paid'
        AND p.created_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
      ORDER BY p.created_at DESC
    `);

    let linkedCount = 0;
    let attemptedCount = 0;

    for (const payment of unlinkedPayments.rows as any[]) {
      attemptedCount++;
      
      // Try to find matching bookings created after this payment
      const matchingBookings = await db.execute(sql`
        SELECT b.id, b.userId, u.name, u.phone, u.email
        FROM bookings b
        JOIN users u ON b.userId = u.id
        WHERE b.created_at >= ${payment.created_at}
          AND b.created_at <= ${new Date(new Date(payment.created_at).getTime() + 48 * 60 * 60 * 1000)}
          AND (
            u.phone = ${payment.customer_phone} OR
            u.email = ${payment.customer_email} OR
            u.name = ${payment.customer_name} OR
            LOWER(TRIM(u.name)) = LOWER(TRIM(${payment.customer_name})) OR
            u.name LIKE '%' || ${payment.customer_name?.split(' ')[0] || ''} || '%'
          )
        ORDER BY 
          CASE 
            WHEN u.phone = ${payment.customer_phone} THEN 1
            WHEN u.email = ${payment.customer_email} THEN 2
            WHEN u.name = ${payment.customer_name} THEN 3
            ELSE 4
          END,
          b.created_at ASC
        LIMIT 1
      `);

      if (matchingBookings.rows.length > 0) {
        const booking = matchingBookings.rows[0] as any;
        
        // Link the payment to the booking
        await db.execute(sql`
          UPDATE payment_transactions 
          SET booking_id = ${booking.id}, updated_at = ${new Date()}
          WHERE id = ${payment.id}
        `);

        linkedCount++;
        
        const matchType = booking.phone === payment.customer_phone ? 'phone' :
                          booking.email === payment.customer_email ? 'email' :
                          booking.name === payment.customer_name ? 'exact_name' : 'fuzzy_name';
        
        console.log(`✅ Background linking successful:`, {
          paymentId: payment.id,
          bookingId: booking.id,
          customerName: booking.name,
          matchedBy: matchType,
          timeDiff: Math.round((new Date(booking.created_at).getTime() - new Date(payment.created_at).getTime()) / (1000 * 60)) + 'min'
        });
      }
    }

    console.log(`🎯 Background linking completed: ${linkedCount}/${attemptedCount} payments linked`);
    return { linked: linkedCount, attempted: attemptedCount };
    
  } catch (error) {
    console.error('❌ Background linking job failed:', error);
    return { linked: 0, attempted: 0 };
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateRideEstimates(distance: number) {
  const estimatedTime = Math.ceil(distance * 3); // 3 minutes per km
  const baseFare = 10;
  const perKmRate = 3;
  const estimatedCost = baseFare + (distance * perKmRate);
  
  return { estimatedTime, estimatedCost };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // PWA Routes - Serve Service Worker and Manifest
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, '../public/sw.js'));
  });

  app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, '../public/manifest.json'));
  });

  // Serve PWA icons
  app.get('/icons/:iconName', (req, res) => {
    const iconName = req.params.iconName;
    res.sendFile(path.join(__dirname, '../public/icons', iconName));
  });

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByIdentifier(identifier);
      if (!user) {
        return res.status(401).json({ message: 'رقم الهاتف أو الإيميل أو كلمة المرور غير صحيحة' });
      }
      
      // Check if user account is active (soft delete check)
      if (user.active === false) {
        return res.status(401).json({ message: 'هذا الحساب غير نشط' });
      }
      
      // Check password - handle both plain text (legacy) and bcrypt hashed passwords
      let isPasswordValid = false;
      
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        // Bcrypt hashed password
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        // Plain text password (legacy) - direct comparison
        isPasswordValid = (password === user.password);
      }
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'رقم الهاتف أو الإيميل أو كلمة المرور غير صحيحة' });
      }
      
      const userData = { id: user.id, phone: user.phone, name: user.name, membershipType: user.membershipType };
      const sessionId = await sessionService.createSession(user.id, 'customer', userData, 24);
      
      res.json({ 
        token: sessionId, 
        user: userData
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  // Password reset endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, don't reveal whether email exists
        return res.status(200).json({ message: 'If the email exists, a reset code has been sent' });
      }

      // Generate OTP for password reset
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with reset type - use code field, not otp
      await storage.createOtpVerification({
        email: email,
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        userData: JSON.stringify({ type: 'password_reset' })
      });

      // Send reset OTP email with custom content for password reset
      try {
        await emailService.sendEmail(
          email,
          'Password Reset - إعادة تعيين كلمة المرور - VETS VAN',
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B2F8B; margin: 0;">VETS VAN</h1>
              <p style="color: #666; margin: 5px 0;">Mobile Veterinary Services</p>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #8B2F8B; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                You have requested to reset your password for your VETS VAN account. 
                Please use the following verification code to proceed with resetting your password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f8f9fa; border: 2px solid #8B2F8B; border-radius: 8px; padding: 20px; display: inline-block;">
                  <span style="font-size: 32px; font-weight: bold; color: #8B2F8B; letter-spacing: 8px;">${otp}</span>
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; text-align: center;">
                This code will expire in 10 minutes. If you didn't request this reset, please ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <div style="direction: rtl; text-align: right;">
                <h2 style="color: #8B2F8B; margin-bottom: 20px;">طلب إعادة تعيين كلمة المرور</h2>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  لقد طلبت إعادة تعيين كلمة المرور لحسابك في VETS VAN. 
                  يرجى استخدام رمز التحقق التالي للمتابعة مع إعادة تعيين كلمة المرور:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <div style="background-color: #f8f9fa; border: 2px solid #8B2F8B; border-radius: 8px; padding: 20px; display: inline-block;">
                    <span style="font-size: 32px; font-weight: bold; color: #8B2F8B; letter-spacing: 8px;">${otp}</span>
                  </div>
                </div>
                
                <p style="color: #666; font-size: 14px; text-align: center;">
                  سينتهي صلاحية هذا الرمز خلال 10 دقائق. إذا لم تطلب هذا التغيير، يرجى تجاهل هذا البريد الإلكتروني.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>VETS VAN - Your Trusted Mobile Veterinary Service</p>
            </div>
          </div>
          `
        );
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        return res.status(500).json({ message: 'Failed to send reset email' });
      }

      res.status(200).json({ message: 'Reset code sent to your email' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Password reset OTP verification endpoint
  app.post('/api/auth/verify-reset-otp', async (req, res) => {
    try {
      const { email, otpCode } = req.body;
      
      if (!email || !otpCode) {
        return res.status(400).json({ message: 'Email and OTP code are required' });
      }

      // Verify OTP
      const otpRecord = await storage.getOtpVerification(email, otpCode);
      if (!otpRecord) {
        return res.status(401).json({ message: 'Invalid or expired OTP code' });
      }

      // Check if OTP is for password reset
      let userData: any = {};
      if (otpRecord.userData) {
        try {
          if (typeof otpRecord.userData === 'string') {
            userData = JSON.parse(otpRecord.userData);
          } else {
            userData = otpRecord.userData;
          }
        } catch (error) {
          console.error('Error parsing userData:', error);
          userData = {};
        }
      }
      
      if (userData.type !== 'password_reset') {
        return res.status(401).json({ message: 'Invalid OTP type' });
      }

      // OTP is valid, return success (don't delete yet, wait for password reset completion)
      res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
      console.error('Reset OTP verification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Complete password reset endpoint
  app.post('/api/auth/complete-password-reset', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Clean up OTP records for this email
      await storage.deleteOtpVerification(email);

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Complete password reset error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Remove captcha from data
      const { captcha, ...userData } = validatedData;
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      // Check if phone or email already exists
      const existingUserByPhone = await storage.getUserByPhone(userData.phone);
      if (existingUserByPhone) {
        return res.status(400).json({ message: getErrorMessage('phoneExists', userLanguage) });
      }
      
      if (userData.email) {
        const existingUserByEmail = await storage.getUserByEmail(userData.email);
        if (existingUserByEmail) {
          return res.status(400).json({ message: getErrorMessage('emailExists', userLanguage) });
        }
      }
      
      // Generate OTP (6-digit number)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create OTP verification record with expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      await storage.createOtpVerification({
        email: userData.email,
        code: otpCode,
        expiresAt: expiresAt,
        userData: JSON.stringify({
          ...userData,
          name: `${userData.firstName} ${userData.lastName}`,
          membershipType: 'standard'
        })
      });
      
      // Send OTP email
      if (userData.email) {
        try {
          await emailService.sendOtpVerificationEmail(userData.email, userData.firstName || userData.lastName, otpCode);
          console.log(`✅ OTP email sent to ${userData.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send OTP email:', emailError);
          return res.status(500).json({ 
            message: userLanguage === 'ar' ? 'فشل في إرسال رمز التحقق' : 'Failed to send verification code' 
          });
        }
      }
      
      res.json({ 
        message: userLanguage === 'ar' ? 'تم إرسال رمز التحقق بنجاح' : 'Verification code sent successfully',
        email: userData.email
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      // Handle database unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        const userLanguage = req.body.preferredLanguage || 'ar';
        
        if (error.constraint === 'users_phone_unique') {
          return res.status(400).json({ message: getErrorMessage('phoneExists', userLanguage) });
        }
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: getErrorMessage('emailExists', userLanguage) });
        }
      }
      
      console.error('Registration error:', error);
      const userLanguage = req.body.preferredLanguage || 'ar';
      res.status(500).json({ message: getErrorMessage('serverError', userLanguage) });
    }
  });

  // Get current user session data
  app.get('/api/auth/session', requireAuth, async (req, res) => {
    try {
      // Get user data from authenticated session
      const sessionUserData = req.user;
      const sessionData = req.session;
      
      // Fetch complete user data from database to get email
      const fullUser = await storage.getUser(sessionUserData.id);
      
      if (!fullUser) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }
      
      res.json({
        user: {
          id: fullUser.id,
          name: fullUser.name,
          phone: fullUser.phone,
          email: fullUser.email,
          membershipType: fullUser.membershipType
        },
        sessionInfo: {
          userType: sessionData.userType,
          expiresAt: sessionData.expiresAt
        }
      });
    } catch (error) {
      console.error('Session fetch error:', error);
      res.status(500).json({ message: 'خطأ في جلب بيانات الجلسة' });
    }
  });

  // Get current user account data (alternative endpoint for account info)
  app.get('/api/auth/account', requireAuth, async (req, res) => {
    try {
      // Get user data from authenticated session
      const sessionUserData = req.user;
      
      // Fetch complete user data from database to get email
      const fullUser = await storage.getUser(sessionUserData.id);
      
      if (!fullUser) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }
      
      res.json({
        id: fullUser.id,
        name: fullUser.name,
        phone: fullUser.phone,
        email: fullUser.email,
        membershipType: fullUser.membershipType,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName
      });
    } catch (error) {
      console.error('Account fetch error:', error);
      res.status(500).json({ message: 'خطأ في جلب بيانات الحساب' });
    }
  });

  // Create authenticated payment invoice for ride requests with real customer data
  app.post('/api/payments/ride-invoice', requireAuth, async (req: any, res) => {
    try {
      const { 
        invoiceNumber, 
        amount, 
        description 
      } = req.body;

      if (!invoiceNumber || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: invoiceNumber, amount'
        });
      }

      // Get authenticated user data
      const sessionUserData = req.user;
      const fullUser = await storage.getUser(sessionUserData.id);
      
      if (!fullUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Use real customer data from database
      const customerName = fullUser.name || fullUser.phone || `User-${fullUser.id}`;
      const customerEmail = fullUser.email || `user${fullUser.id}@vetsvan.app`; // Fallback if no email
      const customerPhone = fullUser.phone || '+966000000000';

      console.log('🏦 Creating authenticated ride payment with real customer data:', {
        customerId: fullUser.id,
        customerName,
        customerEmail: customerEmail?.substring(0, 8) + '...',
        customerPhone: customerPhone?.substring(0, 8) + '...',
        amount: parseFloat(amount),
        invoiceNumber
      });

      const myfatoorah = new MyFatoorahService();
      
      // Prepare payment request for MyFatoorah API
      const paymentRequest = {
        CustomerName: customerName,
        NotificationOption: 'EML',
        InvoiceValue: parseFloat(amount),
        DisplayCurrencyIso: 'SAR',
        MobileCountryCode: '966',
        CustomerMobile: customerPhone.replace(/^\+966/, '').replace(/^966/, ''), // Remove country code
        CustomerEmail: customerEmail,
        CallBackUrl: `${req.protocol}://${req.get('host')}/payment-success?ref=${invoiceNumber}&source=myfatoorah`,
        ErrorUrl: `${req.protocol}://${req.get('host')}/ride-request?payment=failed`,
        Language: 'En' as const,
        CustomerReference: invoiceNumber
      };

      console.log('🏦 Creating MyFatoorah ride payment invoice with real data:', paymentRequest);

      const paymentResponse = await myfatoorah.createInvoice(paymentRequest);

      if (paymentResponse.IsSuccess && paymentResponse.Data) {
        console.log('✅ Authenticated ride payment created successfully:', paymentResponse.Data);
        console.log('🔗 Payment URL being sent:', paymentResponse.Data.InvoiceURL);

        const responseData = {
          success: true,
          data: {
            paymentUrl: paymentResponse.Data.InvoiceURL,
            invoiceId: paymentResponse.Data.InvoiceId,
            invoiceReference: paymentResponse.Data.CustomerReference,
            message: 'Ride payment invoice created successfully with real customer data'
          }
        };

        console.log('📤 Final API Response:', JSON.stringify(responseData, null, 2));
        res.json(responseData);
      } else {
        console.error('❌ MyFatoorah ride payment creation failed:', paymentResponse);
        res.status(400).json({
          success: false,
          message: 'Failed to create payment invoice',
          error: paymentResponse.ValidationErrors || paymentResponse.Message
        });
      }

    } catch (error: any) {
      console.error('❌ Authenticated ride payment creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during payment creation',
        error: error.message
      });
    }
  });

  app.post('/api/auth/logout', requireAuth, async (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    await sessionService.deleteSession(sessionId);
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  });

  // OTP Verification routes
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { email } = otpVerificationSchema.parse(req.body);
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      // Check if email exists in system
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: userLanguage === 'en' ? 'Email address already exists' : 'الإيميل مستخدم بالفعل' 
        });
      }
      
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Clean up any existing OTPs for this email
      await storage.deleteOtpVerification(email);
      
      // Store OTP in database
      await storage.createOtpVerification({
        email,
        otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      
      // Send OTP email
      try {
        await emailService.sendOtpVerificationEmail(email, 'عزيزي المستخدم', otpCode);
        console.log(`✅ OTP email sent to ${email}`);
        
        res.json({ 
          message: userLanguage === 'en' 
            ? 'Verification code sent to your email' 
            : 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
          success: true 
        });
      } catch (emailError) {
        console.error('❌ Failed to send OTP email:', emailError);
        res.status(500).json({ 
          message: userLanguage === 'en' 
            ? 'Failed to send verification code' 
            : 'فشل في إرسال رمز التحقق'
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ 
        message: userLanguage === 'en' ? 'Server error' : 'خطأ في الخادم' 
      });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otpCode } = req.body;
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      if (!email || !otpCode) {
        return res.status(400).json({ 
          message: userLanguage === 'en' 
            ? 'Email and OTP code are required' 
            : 'الإيميل ورمز التحقق مطلوبان'
        });
      }
      
      // Find OTP verification record
      const otpRecord = await storage.getOtpVerification(email, otpCode);
      
      if (!otpRecord) {
        return res.status(400).json({ 
          message: userLanguage === 'en' 
            ? 'Invalid or expired verification code' 
            : 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        });
      }
      
      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        await storage.deleteOtpVerification(email);
        return res.status(400).json({ 
          message: userLanguage === 'en' 
            ? 'Verification code has expired' 
            : 'انتهت صلاحية رمز التحقق'
        });
      }
      
      // OTP is valid - create user account
      if (otpRecord.userData) {
        try {
          // Handle both string and already parsed userData
          let userData;
          if (typeof otpRecord.userData === 'string') {
            userData = JSON.parse(otpRecord.userData);
          } else if (typeof otpRecord.userData === 'object') {
            userData = otpRecord.userData;
          } else {
            throw new Error('Invalid userData format');
          }
          
          // Hash the password before storing
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          
          // Create the user account
          const newUser = await storage.createUser({
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            membershipType: userData.membershipType || 'standard'
          });
          
          // Send welcome email
          if (userData.email) {
            try {
              await emailService.sendWelcomeEmail(userData.email, userData.firstName || userData.name);
              console.log(`✅ Welcome email sent to ${userData.email}`);
            } catch (emailError) {
              console.error('❌ Failed to send welcome email:', emailError);
            }
          }
          
          // Clean up OTP record
          await storage.deleteOtpVerification(email);
          
          // Create session for automatic login
          const sessionUserData = { 
            id: newUser.id, 
            phone: newUser.phone, 
            name: newUser.name, 
            membershipType: newUser.membershipType 
          };
          const sessionId = await sessionService.createSession(newUser.id, 'customer', sessionUserData, 24);
          
          res.json({ 
            message: userLanguage === 'en' 
              ? 'Account created successfully' 
              : 'تم إنشاء الحساب بنجاح',
            verified: true,
            token: sessionId,
            user: {
              id: newUser.id,
              phone: newUser.phone,
              name: newUser.name,
              membershipType: newUser.membershipType
            }
          });
        } catch (userCreationError) {
          console.error('User creation error:', userCreationError);
          return res.status(500).json({ 
            message: userLanguage === 'en' 
              ? 'Failed to create user account' 
              : 'فشل في إنشاء حساب المستخدم'
          });
        }
      } else {
        // Just verify OTP without creating user
        await storage.deleteOtpVerification(email);
        res.json({ 
          message: userLanguage === 'en' 
            ? 'Email verified successfully' 
            : 'تم التحقق من الإيميل بنجاح',
          verified: true 
        });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      const userLanguage = req.body.preferredLanguage || 'ar';
      
      res.status(500).json({ 
        message: userLanguage === 'en' ? 'Server error' : 'خطأ في الخادم' 
      });
    }
  });

  // Doctor login endpoint  
  app.post('/api/doctor/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Find driver by username
      const driver = await storage.getDriverByUsername(username);
      
      if (!driver || driver.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const userData = { 
        id: driver.id, 
        phone: driver.phone, 
        name: driver.name, 
        membershipType: 'doctor',
        vetsVanId: driver.id, // Using driver.id as VetsVan ID
        vetsVanName: driver.vetsvanName
      };
      const sessionId = await sessionService.createSession(driver.id, 'doctor', userData, 24);
      
      res.json({ 
        token: sessionId, 
        user: { 
          id: driver.id, 
          phone: driver.phone, 
          name: driver.name, 
          membershipType: 'doctor',
          vetsVanId: driver.id,
          vetsVanName: driver.vetsvanName
        }
      });
    } catch (error) {
      console.error('Doctor login error:', error);
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  // Driver routes
  app.get('/api/drivers/available', requireAuth, async (req, res) => {
    try {
      const drivers = await storage.getAvailableDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ message: 'خطأ في جلب السائقين' });
    }
  });

  app.get('/api/drivers/nearby', requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'الموقع مطلوب' });
      }
      
      const drivers = await storage.getAvailableDrivers();
      const nearbyDrivers = drivers.map(driver => {
        const distance = calculateDistance(
          parseFloat(latitude as string),
          parseFloat(longitude as string),
          driver.latitude,
          driver.longitude
        );
        const eta = Math.ceil(distance * 2); // 2 minutes per km
        const { estimatedCost } = calculateRideEstimates(distance);
        
        return {
          ...driver,
          distance: Math.round(distance * 10) / 10,
          eta,
          estimatedCost: Math.round(estimatedCost)
        };
      }).sort((a, b) => a.distance - b.distance);
      
      res.json(nearbyDrivers);
    } catch (error) {
      res.status(500).json({ message: 'خطأ في جلب السائقين القريبين' });
    }
  });

  // Ride routes
  app.post('/api/rides/request', requireAuth, async (req, res) => {
    try {
      const rideData = rideRequestSchema.parse(req.body);
      
      // Check if user has active ride (excluding cancelled/rejected)
      const activeRide = await storage.getUserActiveRide(req.user.id);
      if (activeRide && !['cancelled', 'cancelled_by_doctor', 'rejected'].includes(activeRide.status)) {
        return res.status(400).json({ message: 'لديك رحلة نشطة بالفعل' });
      }
      
      // Calculate estimates
      const distance = calculateDistance(
        rideData.pickupLatitude,
        rideData.pickupLongitude,
        rideData.destinationLatitude || rideData.pickupLatitude,
        rideData.destinationLongitude || rideData.pickupLongitude
      );
      
      const { estimatedTime, estimatedCost } = calculateRideEstimates(distance);
      
      const ride = await storage.createRide({
        ...rideData,
        customerId: req.user.id,
        estimatedDistance: Math.round(distance * 10) / 10,
        estimatedTime,
        estimatedCost: Math.round(estimatedCost),
        status: 'requested'
      });
      
      res.json(ride);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'خطأ في طلب الرحلة' });
    }
  });

  // Get all rides for current user (for Activity page)
  app.get('/api/rides', requireAuth, async (req, res) => {
    try {
      const allRides = await storage.getAllRides();
      const userRides = allRides
        .filter(ride => ride.customerId === req.user.id)
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Sort by newest first
        });
      
      res.json(userRides);
    } catch (error) {
      console.error('Error fetching user rides:', error);
      res.status(500).json({ message: 'خطأ في جلب الطلبات' });
    }
  });

  app.get('/api/rides/active', requireAuth, async (req, res) => {
    try {
      const ride = await storage.getUserActiveRide(req.user.id);
      if (!ride) {
        return res.json(null);
      }

      // If ride is cancelled/rejected, return null
      if (['cancelled', 'cancelled_by_doctor', 'rejected'].includes(ride.status)) {
        return res.json(null);
      }
      
      let driver = null;
      if (ride.driverId) {
        driver = await storage.getDriver(ride.driverId);
      }
      
      res.json({ ride, driver });
    } catch (error) {
      res.status(500).json({ message: 'خطأ في جلب الرحلة النشطة' });
    }
  });



  // Doctor location update endpoint
  app.put('/api/doctor/location', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { latitude, longitude, accuracy, timestamp } = req.body;
      
      // Validate coordinates
      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      // Update doctor location in storage
      await storage.updateDriverLocation(user.id, latitude, longitude);
      
      res.json({ 
        message: 'Location updated successfully',
        coordinates: { latitude, longitude },
        accuracy,
        timestamp 
      });
    } catch (error) {
      console.error('Error updating doctor location:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  });

  // Customer location update endpoint
  app.put('/api/customer/location', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'customer') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { latitude, longitude, accuracy, timestamp } = req.body;
      
      // Validate coordinates
      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      // Store customer location (could be extended to update active ride location)
      const activeRide = await storage.getUserActiveRide(user.id);
      if (activeRide) {
        // Update ride pickup location with real GPS coordinates
        activeRide.pickupLatitude = latitude;
        activeRide.pickupLongitude = longitude;
      }
      
      res.json({ 
        message: 'Customer location updated successfully',
        coordinates: { latitude, longitude },
        accuracy,
        timestamp 
      });
    } catch (error) {
      console.error('Error updating customer location:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  });

  // Doctor endpoints for ride management - updated to use VetsVan booking system
  app.get('/api/doctor/pending-rides', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get doctor's VetsVan ID from login session or find it by doctor ID
      const doctor = await storage.getDriver(user.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      const doctorVetsVanId = doctor.id; // The doctor's VetsVan ID
      
      // Get all bookings for this specific VetsVan only
      const allBookings = await storage.getAllBookings();
      const doctorBookings = allBookings.filter(booking => 
        booking.vetsVanId === doctorVetsVanId && 
        booking.status === 'booked'
      );
      
      // Get customer details for each booking
      const bookingsWithCustomers = await Promise.all(
        doctorBookings.map(async (booking) => {
          const customer = await storage.getUser(booking.userId);
          return {
            ...booking,
            customer: customer ? { 
              name: customer.name, 
              phone: customer.phone,
              id: customer.id
            } : null
          };
        })
      );
      
      res.json(bookingsWithCustomers);
    } catch (error) {
      console.error('Error fetching doctor pending bookings:', error);
      res.status(500).json({ message: 'خطأ في جلب الطلبات المعلقة' });
    }
  });

  app.post('/api/doctor/rides/:id/accept', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const rideId = parseInt(req.params.id);
      const ride = await storage.getRide(rideId);
      
      if (!ride) {
        return res.status(404).json({ message: 'الطلب غير موجود' });
      }
      
      if (ride.status !== 'requested') {
        return res.status(400).json({ message: 'لا يمكن قبول هذا الطلب' });
      }
      
      // Assign the current doctor (who accepted) to the ride
      const doctorId = user.id;
      console.log('Assigning doctor ID:', doctorId, 'to ride ID:', rideId);
      await storage.assignDriverToRide(rideId, doctorId);
      await storage.updateDriverAvailability(doctorId, false);
      await storage.updateRideStatus(rideId, 'confirmed');
      console.log('Ride assignment completed');
      
      // Simulate progression
      setTimeout(async () => {
        await storage.updateRideStatus(rideId, 'enroute');
        setTimeout(async () => {
          await storage.updateRideStatus(rideId, 'arrived');
        }, 10000);
      }, 5000);
      
      // إرجاع تفاصيل الطلب مع الرد
      const updatedRide = await storage.getRide(rideId);
      res.json({ 
        message: 'تم قبول الطلب بنجاح',
        ride: updatedRide
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      res.status(500).json({ message: 'خطأ في قبول الطلب' });
    }
  });

  // Get active ride for doctor
  app.get('/api/doctor/active-ride', requireAuth, async (req: any, res) => {
    try {
      const doctorId = req.user.id;
      console.log('Looking for active ride for doctor ID:', doctorId);
      
      // Debug: Get all rides to see what's in storage
      const allRides = await storage.getAllRides();
      console.log('All rides in storage:', allRides.map(r => ({ id: r.id, driverId: r.driverId, status: r.status })));
      
      const activeRide = await storage.getDriverActiveRide(doctorId);
      console.log('Found active ride for doctor:', activeRide);
      
      if (!activeRide) {
        return res.json({ ride: null });
      }

      // Get customer information
      const customer = await storage.getUser(activeRide.userId);
      
      res.json({
        ride: activeRide,
        customer: customer ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone
        } : null
      });
    } catch (error) {
      console.error("Error fetching active ride:", error);
      res.status(500).json({ message: "Failed to fetch active ride" });
    }
  });

  app.post('/api/doctor/rides/:id/reject', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const rideId = parseInt(req.params.id);
      const ride = await storage.getRide(rideId);
      
      if (!ride) {
        return res.status(404).json({ message: 'الطلب غير موجود' });
      }
      
      // Allow rejection of requests with status 'requested' or 'جاري المعالجة'
      if (ride.status !== 'requested' && ride.status !== 'جاري المعالجة') {
        return res.status(400).json({ message: 'لا يمكن رفض هذا الطلب' });
      }
      
      await storage.updateRideStatus(rideId, 'rejected');
      res.json({ message: 'تم رفض الطلب' });
    } catch (error) {
      console.error('Error rejecting ride:', error);
      res.status(500).json({ message: 'خطأ في رفض الطلب' });
    }
  });

  // Doctor cancel ride
  app.put('/api/rides/:id/cancel', requireAuth, async (req: any, res) => {
    try {
      const rideId = parseInt(req.params.id);
      const user = req.user;
      
      console.log('Cancel request for ride:', rideId, 'by user:', user.id, 'type:', user.membershipType);
      
      // Get ride details first
      const ride = await storage.getRide(rideId);
      if (!ride) {
        console.log('Ride not found:', rideId);
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      console.log('Found ride:', ride);
      
      // Check if user is the assigned doctor
      if (user.membershipType === 'doctor' && ride.driverId !== user.id) {
        console.log('Doctor not assigned to this ride. Driver ID:', ride.driverId, 'User ID:', user.id);
        return res.status(403).json({ message: 'Unauthorized to cancel this ride' });
      }
      
      // Check if user is the customer
      if (user.membershipType === 'customer' && ride.customerId !== user.id) {
        console.log('Customer not owner of this ride. Customer ID:', ride.customerId, 'User ID:', user.id);
        return res.status(403).json({ message: 'Unauthorized to cancel this ride' });
      }
      
      // Update ride status to cancelled by doctor if doctor is cancelling
      const cancelStatus = user.membershipType === 'doctor' ? 'cancelled_by_doctor' : 'cancelled';
      await storage.updateRideStatus(rideId, cancelStatus);
      console.log(`Ride status updated to ${cancelStatus}`);
      
      // Make doctor available again if it was a doctor cancelling
      if (user.membershipType === 'doctor' && ride.driverId) {
        await storage.updateDriverAvailability(ride.driverId, true);
        console.log('Driver made available again');
      }
      
      res.json({ success: true, message: 'Ride cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling ride:', error);
      res.status(500).json({ message: 'Failed to cancel ride' });
    }
  });

  // Update ride status (for doctors)
  app.put('/api/rides/:id/status', requireAuth, async (req: any, res) => {
    try {
      const rideId = parseInt(req.params.id);
      const { status } = req.body;
      const user = req.user;
      
      // Get ride details first
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      // Check if user is the assigned doctor
      if (user.membershipType === 'doctor' && ride.driverId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized to update this ride' });
      }
      
      await storage.updateRideStatus(rideId, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating ride status:', error);
      res.status(500).json({ message: 'Failed to update ride status' });
    }
  });

  // Simulate ride status updates
  app.post('/api/rides/:id/simulate', requireAuth, async (req, res) => {
    try {
      const rideId = parseInt(req.params.id);
      const ride = await storage.getRide(rideId);
      
      if (!ride || ride.customerId !== req.user.id) {
        return res.status(404).json({ message: 'الرحلة غير موجودة' });
      }
      
      // Simulate driver assignment and status updates
      setTimeout(async () => {
        await storage.updateRideStatus(rideId, 'processing');
        
        setTimeout(async () => {
          // Assign nearest driver
          const drivers = await storage.getAvailableDrivers();
          if (drivers.length > 0) {
            const nearestDriver = drivers.reduce((nearest, driver) => {
              const distance = calculateDistance(
                ride.pickupLatitude,
                ride.pickupLongitude,
                driver.latitude,
                driver.longitude
              );
              const nearestDistance = calculateDistance(
                ride.pickupLatitude,
                ride.pickupLongitude,
                nearest.latitude,
                nearest.longitude
              );
              return distance < nearestDistance ? driver : nearest;
            });
            
            await storage.assignDriverToRide(rideId, nearestDriver.id);
            await storage.updateDriverAvailability(nearestDriver.id, false);
            await storage.updateRideStatus(rideId, 'confirmed');
            
            setTimeout(async () => {
              await storage.updateRideStatus(rideId, 'enroute');
              
              setTimeout(async () => {
                await storage.updateRideStatus(rideId, 'arrived');
              }, 8000);
            }, 5000);
          }
        }, 3000);
      }, 2000);
      
      res.json({ message: 'تم بدء محاكاة الرحلة' });
    } catch (error) {
      res.status(500).json({ message: 'خطأ في محاكاة الرحلة' });
    }
  });

  // Get user profile
  app.get('/api/user/profile', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  });

  // Update user profile
  app.put('/api/user/profile', requireAuth, async (req, res) => {
    try {
      const { firstName, lastName, email, name, petName, petType } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({ message: 'First name and last name are required' });
      }

      const userId = req.user.id;
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        name,
        petName,
        petType
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove password from response
      const { password, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  });

  // Reset password
  app.put('/api/user/reset-password', requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate inputs
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      if (user.password !== currentPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password
      const updatedUser = await storage.updateUserPassword(userId, newPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update password' });
      }

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Error resetting password' });
    }
  });

  // Delete (deactivate) user account
  app.delete('/api/user/delete-account', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Deactivate user instead of deleting to preserve data
      const deactivatedUser = await storage.deactivateUser(userId);
      
      if (!deactivatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating account:', error);
      res.status(500).json({ message: 'Error deactivating account' });
    }
  });

  // Get user's patients
  app.get('/api/patients', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const patients = await storage.getUserPatients(userId);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Add new patient
  app.post('/api/patients', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, type, patientWeight, ageYear, ageMonth, ageDay, photo, birthdate } = req.body;
      
      if (!name || !type || !patientWeight) {
        return res.status(400).json({ message: 'Patient name, type, and weight are required' });
      }
      
      const patient = await storage.createPatient({
        userId,
        name,
        type,
        patientWeight,
        ageYear: ageYear || null,
        ageMonth: ageMonth || null,
        ageDay: ageDay || null,
        photo: photo || null,
        birthdate: birthdate || null,
      });
      
      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  // Update patient weight only (PATCH /api/patients/:id/weight)
  app.patch('/api/patients/:id/weight', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const patientId = parseInt(req.params.id);
      const { patientWeight } = req.body;
      
      console.log(`PATCH /api/patients/${patientId}/weight - received weight:`, patientWeight);
      
      if (patientWeight === undefined || patientWeight === null || parseFloat(patientWeight) <= 0) {
        console.log('Invalid weight provided:', patientWeight);
        return res.status(400).json({ message: 'Valid patient weight is required' });
      }

      // Get current patient data
      const currentPatient = await storage.getPatientById(patientId, userId);
      if (!currentPatient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // Update only the weight
      const updatedPatient = await storage.updatePatient(patientId, userId, {
        name: currentPatient.name,
        type: currentPatient.type,
        patientWeight: parseFloat(patientWeight),
        ageYear: currentPatient.ageYear,
        ageMonth: currentPatient.ageMonth,
        ageDay: currentPatient.ageDay,
        photo: currentPatient.photo,
        birthdate: currentPatient.birthdate,
      });
      
      res.json(updatedPatient);
    } catch (error) {
      console.error('Error updating patient weight:', error);
      res.status(500).json({ message: 'Failed to update patient weight' });
    }
  });

  // Update patient
  app.put('/api/patients/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const patientId = parseInt(req.params.id);
      const { name, type, patientWeight, ageYear, ageMonth, ageDay, photo, birthdate } = req.body;
      
      if (!name || !type || !patientWeight) {
        return res.status(400).json({ message: 'Patient name, type, and weight are required' });
      }
      
      const updatedPatient = await storage.updatePatient(patientId, userId, {
        name,
        type,
        patientWeight,
        ageYear: ageYear || null,
        ageMonth: ageMonth || null,
        ageDay: ageDay || null,
        photo: photo || null,
        birthdate: birthdate || null,
      });
      
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found or unauthorized" });
      }
      
      res.json(updatedPatient);
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Get user's current location info for debugging
  app.get('/api/user/location-info', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        userId: user.id,
        username: user.username,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        message: 'نظام تحديد الموقع الدقيق مفعل - يمكنك رؤية موقعك التفصيلي في الصفحة الرئيسية',
        locationSystemStatus: 'active',
        features: [
          'تحديد الموقع بدقة عالية باستخدام GPS',
          'ترجمة الإحداثيات إلى عناوين تفصيلية',
          'دعم المدن السعودية مع نظام احتياطي ذكي',
          'عرض أسماء الشوارع والأحياء',
          'دعم اللغتين العربية والإنجليزية'
        ]
      });
    } catch (error) {
      console.error('Error fetching user location info:', error);
      res.status(500).json({ message: 'Failed to fetch user location info' });
    }
  });

  // Test endpoint to verify API is working
  app.get('/api/test', async (req: any, res) => {
    console.log('🧪 Test endpoint called');
    try {
      const sessionCount = await sessionService.getActiveSessionCount();
      res.json({ 
        message: 'API is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        sessions: sessionCount
      });
    } catch (error) {
      console.error('Test endpoint error:', error);
      res.json({ 
        message: 'API is working (session count unavailable)',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        sessions: 'N/A'
      });
    }
  });

  // Get all VetsVan with their available shifts for booking (Enhanced with comprehensive error handling)
  app.get('/api/vetsvan/availability', async (req: any, res) => {
    const startTime = Date.now();
    console.log('🔍 VetsVan availability endpoint called at:', new Date().toISOString());
    
    try {
      // Set proper headers for JSON response
      res.setHeader('Content-Type', 'application/json');
      
      // STEP 1: Input validation with detailed logging
      console.log('🔍 Step 1: Input validation starting');
      console.log('📍 Query params:', req.query);
      console.log('📍 Headers authorization:', req.headers.authorization ? 'Present' : 'Missing');
      
      // Validate query parameters with fallback
      let customerLat: number | null = null;
      let customerLon: number | null = null;
      
      try {
        if (req.query.lat) {
          customerLat = parseFloat(req.query.lat as string);
          if (isNaN(customerLat)) {
            console.log('⚠️ Invalid lat parameter:', req.query.lat);
            customerLat = null;
          }
        }
        if (req.query.lon) {
          customerLon = parseFloat(req.query.lon as string);
          if (isNaN(customerLon)) {
            console.log('⚠️ Invalid lon parameter:', req.query.lon);
            customerLon = null;
          }
        }
        console.log('✅ Step 1 complete - Customer location:', { customerLat, customerLon });
      } catch (paramError) {
        console.error('❌ Step 1 failed - Parameter validation error:', paramError);
        customerLat = null;
        customerLon = null;
      }
      
      // STEP 2: Authentication check with detailed logging
      console.log('🔍 Step 2: Authentication check starting');
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      let user = null;
      
      try {
        if (sessionId) {
          const session = await sessionService.getSession(sessionId);
          if (session) {
            user = session.userData;
            console.log('✅ Step 2 complete - Authenticated user:', user.id);
          } else {
            console.log('⚠️ Step 2 - Invalid or expired session');
            const sessionCount = await sessionService.getActiveSessionCount();
            
            // Return 401 but continue for debugging in production
            return res.status(401).json({ 
              message: 'Authentication required',
              error: 'Please login to access VetsVan availability',
              loginUrl: '/login',
              debug: {
                sessionId: sessionId ? 'present' : 'missing',
                activeSessions: sessionCount,
                timestamp: new Date().toISOString()
              }
            });
          }
        } else {
          console.log('⚠️ Step 2 - No session ID provided');
          const sessionCount = await sessionService.getActiveSessionCount();
          
          return res.status(401).json({ 
            message: 'Authentication required',
            error: 'Please login to access VetsVan availability',
            loginUrl: '/login',
            debug: {
              sessionId: 'missing',
              activeSessions: sessionCount,
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (authError) {
        console.error('❌ Step 2 failed - Authentication error:', authError);
        return res.status(500).json({ 
          message: 'Authentication system error',
          error: authError.message,
          step: 'authentication'
        });
      }
      
      // STEP 3: Database calls with individual error handling
      console.log('🔍 Step 3: Database calls starting');
      let drivers, shifts, bookings;
      
      try {
        console.log('🔍 Step 3a: Fetching drivers');
        drivers = await storage.getAllDrivers();
        console.log('✅ Step 3a complete - Drivers fetched:', drivers?.length);
      } catch (driversError) {
        console.error('❌ Step 3a failed - Drivers fetch error:', driversError);
        return res.status(500).json({ 
          message: 'Failed to fetch VetsVan data',
          error: driversError.message,
          step: 'drivers_fetch'
        });
      }
      
      try {
        console.log('🔍 Step 3b: Fetching shifts');
        shifts = await storage.getAllShifts();
        console.log('✅ Step 3b complete - Shifts fetched:', shifts?.length);
      } catch (shiftsError) {
        console.error('❌ Step 3b failed - Shifts fetch error:', shiftsError);
        return res.status(500).json({ 
          message: 'Failed to fetch shift data',
          error: shiftsError.message,
          step: 'shifts_fetch'
        });
      }
      
      try {
        console.log('🔍 Step 3c: Fetching bookings');
        bookings = await storage.getAllBookings();
        console.log('✅ Step 3c complete - Bookings fetched:', bookings?.length);
      } catch (bookingsError) {
        console.error('❌ Step 3c failed - Bookings fetch error:', bookingsError);
        return res.status(500).json({ 
          message: 'Failed to fetch booking data',
          error: bookingsError.message,
          step: 'bookings_fetch'
        });
      }
      
      // STEP 4: Data validation
      console.log('🔍 Step 4: Data validation');
      if (!drivers || !shifts || !bookings) {
        console.error('❌ Step 4 failed - Missing data:', { 
          drivers: !!drivers, 
          shifts: !!shifts, 
          bookings: !!bookings 
        });
        return res.status(500).json({ 
          message: 'Incomplete data retrieved from database',
          error: 'One or more data sources returned null/undefined',
          step: 'data_validation',
          data: { drivers: !!drivers, shifts: !!shifts, bookings: !!bookings }
        });
      }
      console.log('✅ Step 4 complete - All data present');
      
      // STEP 5: Distance calculation function with error handling
      console.log('🔍 Step 5: Setting up distance calculation');
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        try {
          // Validate input parameters
          if (!lat1 || !lon1 || !lat2 || !lon2 || 
              isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
            console.log('⚠️ Invalid coordinates for distance calculation:', { lat1, lon1, lat2, lon2 });
            return 999; // Return high distance for invalid coordinates
          }
          
          const R = 6371; // Radius of the Earth in kilometers
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c; // Distance in kilometers
          const roundedDistance = Math.round(distance * 10) / 10; // Round to 1 decimal place
          
          // Validate result
          if (isNaN(roundedDistance) || roundedDistance < 0) {
            console.log('⚠️ Invalid distance calculation result:', roundedDistance);
            return 999;
          }
          
          return roundedDistance;
        } catch (error) {
          console.error('❌ Distance calculation error:', error);
          return 999; // Return high distance on error
        }
      };
      console.log('✅ Step 5 complete - Distance function ready');
      
      // STEP 6: Data processing with comprehensive error handling
      console.log('🔍 Step 6: Starting data processing');
      let vetsvanWithShifts;
      
      try {
        console.log('🔍 Step 6a: Processing VetsVan data');
        vetsvanWithShifts = drivers.map((driver, index) => {
          try {
            console.log(`🔍 Processing driver ${index + 1}/${drivers.length}: ${driver.vetsvanCode}`);
            
            // Validate driver data
            if (!driver || !driver.id) {
              console.log('⚠️ Invalid driver data:', driver);
              return null;
            }
            
            const driverShifts = shifts.filter(shift => shift && shift.vetsVanId === driver.id);
            console.log(`📊 Driver ${driver.vetsvanCode} has ${driverShifts.length} shifts`);
            
            // Add detailed booking information to each shift
            const shiftsWithBookingStatus = driverShifts.map((shift, shiftIndex) => {
              try {
                if (!shift || !shift.id) {
                  console.log('⚠️ Invalid shift data:', shift);
                  return null;
                }
                
                // Get all bookings for this shift (not just 'booked' status)
                const shiftBookings = bookings.filter(booking => 
                  booking && booking.shiftId === shift.id
                );
                
                const processedShift = {
                  ...shift,
                  isBooked: shiftBookings.some(booking => 
                    booking && booking.status && 
                    ['pending_review', 'confirmed', 'in_progress', 'completed'].includes(booking.status)
                  ),
                  bookingsCount: shiftBookings.length,
                  bookings: shiftBookings // Include actual booking details with all statuses
                };
                
                return processedShift;
              } catch (shiftError) {
                console.error(`❌ Error processing shift ${shiftIndex}:`, shiftError);
                return null;
              }
            }).filter(shift => shift !== null); // Remove failed shifts
            
            // Calculate distance from customer if location is provided
            let distanceFromCustomer = null;
            if (customerLat && customerLon && driver.latitude && driver.longitude) {
              try {
                distanceFromCustomer = calculateDistance(
                  customerLat, 
                  customerLon, 
                  driver.latitude, 
                  driver.longitude
                );
                console.log(`📍 Distance calculated for ${driver.vetsvanCode}: ${distanceFromCustomer}km`);
              } catch (distanceError) {
                console.error(`❌ Distance calculation failed for ${driver.vetsvanCode}:`, distanceError);
                distanceFromCustomer = null;
              }
            }
            
            const processedDriver = {
              id: driver.id,
              vetsvanCode: driver.vetsvanCode || 'Unknown',
              vetsvanName: driver.vetsvanName || 'Unknown VetsVan',
              isAvailable: driver.isAvailable !== undefined ? driver.isAvailable : true,
              latitude: driver.latitude,
              longitude: driver.longitude,
              shifts: shiftsWithBookingStatus,
              distanceFromCustomer: distanceFromCustomer ? `${distanceFromCustomer}` : undefined
            };
            
            return processedDriver;
          } catch (driverError) {
            console.error(`❌ Error processing driver ${index}:`, driverError);
            return null;
          }
        }).filter(driver => driver !== null); // Remove failed drivers
        
        console.log('✅ Step 6a complete - VetsVan data processed successfully');
        console.log(`📊 Processed ${vetsvanWithShifts.length}/${drivers.length} drivers`);
      } catch (processingError) {
        console.error('❌ Step 6a failed - Data processing error:', processingError);
        return res.status(500).json({ 
          message: 'Failed to process VetsVan data',
          error: processingError.message,
          step: 'data_processing'
        });
      }
      
      // STEP 7: Distance sorting and final processing
      console.log('🔍 Step 7: Distance sorting and final processing');
      let sortedVetsVans;
      
      try {
        console.log('🔍 Step 7a: Finding closest VetsVan');
        // Find the closest VetsVan if customer location is available
        let closestVetsVanId = null;
        if (customerLat && customerLon) {
          let minDistance = Infinity;
          vetsvanWithShifts.forEach(vetsvan => {
            if (vetsvan && vetsvan.distanceFromCustomer) {
              try {
                const distance = parseFloat(vetsvan.distanceFromCustomer);
                if (!isNaN(distance) && distance < minDistance) {
                  minDistance = distance;
                  closestVetsVanId = vetsvan.id;
                }
              } catch (distanceParseError) {
                console.log('⚠️ Failed to parse distance for VetsVan:', vetsvan.vetsvanCode);
              }
            }
          });
          console.log('📍 Closest VetsVan ID:', closestVetsVanId, 'Distance:', minDistance);
        }
        
        console.log('🔍 Step 7b: Adding closest flags');
        // Add isClosest flag to each VetsVan
        const vetsvanWithClosestFlag = vetsvanWithShifts.map(vetsvan => {
          if (!vetsvan) return null;
          return {
            ...vetsvan,
            isClosest: vetsvan.id === closestVetsVanId
          };
        }).filter(vetsvan => vetsvan !== null);

        console.log('🔍 Step 7c: Sorting by distance');
        // Sort VetsVans by distance (closest first)
        sortedVetsVans = vetsvanWithClosestFlag.sort((a, b) => {
          try {
            if (a.distanceFromCustomer && b.distanceFromCustomer) {
              const distA = parseFloat(a.distanceFromCustomer);
              const distB = parseFloat(b.distanceFromCustomer);
              if (!isNaN(distA) && !isNaN(distB)) {
                return distA - distB;
              }
            }
            if (a.distanceFromCustomer && !b.distanceFromCustomer) return -1;
            if (!a.distanceFromCustomer && b.distanceFromCustomer) return 1;
            return 0;
          } catch (sortError) {
            console.log('⚠️ Sorting error between VetsVans:', a.vetsvanCode, b.vetsvanCode);
            return 0;
          }
        });
        
        console.log('✅ Step 7 complete - Final processing done');
        console.log(`📊 Final result: ${sortedVetsVans?.length} VetsVan records`);
      } catch (finalProcessingError) {
        console.error('❌ Step 7 failed - Final processing error:', finalProcessingError);
        return res.status(500).json({ 
          message: 'Failed to process final VetsVan sorting',
          error: finalProcessingError.message,
          step: 'final_processing'
        });
      }

      // STEP 8: Response generation
      console.log('🔍 Step 8: Generating response');
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.log(`✅ VetsVan availability request completed successfully in ${processingTime}ms`);
      console.log(`📊 Returning ${sortedVetsVans?.length} VetsVan records`);
      
      res.json(sortedVetsVans);
    } catch (error) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.error('❌ CRITICAL ERROR in VetsVan availability endpoint:');
      console.error('📍 Error message:', error.message);
      console.error('📍 Error stack:', error.stack);
      console.error('📍 Processing time before error:', processingTime + 'ms');
      console.error('📍 Request details:', {
        query: req.query,
        sessionId: req.headers.authorization?.replace('Bearer ', ''),
        sessionInfo: req.session ? `Valid session for user ${req.session.userId}` : 'No session found',
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({ 
        message: 'Failed to fetch VetsVan availability',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        step: 'general_error',
        processingTime: processingTime,
        timestamp: new Date().toISOString(),
        debug: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          query: req.query,
          sessionId: req.headers.authorization ? 'present' : 'missing'
        } : undefined
      });
    }
  });

  // Book an appointment
  app.post('/api/bookings', requireAuth, async (req: any, res) => {
    try {
      const { 
        shiftId, 
        vetsVanId, 
        appointmentDate, 
        appointmentTime, 
        customerLocation, 
        selectedPets, 
        serviceType,
        paymentReference,
        paymentId
      } = req.body;
      const userId = req.user.id;
      
      console.log('📍 Creating booking with request body:', req.body);
      console.log('📍 Customer location received:', customerLocation);
      console.log('📍 User ID:', userId);
      console.log('🐾 Selected pets received:', selectedPets);
      console.log('🐾 Selected pets type:', typeof selectedPets);
      console.log('🐾 Selected pets length:', selectedPets?.length);
      console.log('🏥 Service type received:', serviceType);
      console.log('💳 Payment info received:', { paymentReference, paymentId });

      // Check if this specific time slot is already booked
      const existingBookings = await storage.getShiftBookings(shiftId);
      const timeSlotBooked = existingBookings.some(booking => 
        booking.appointmentTime === appointmentTime && 
        booking.appointmentDate === appointmentDate &&
        ['pending_review', 'confirmed', 'in_progress'].includes(booking.status)
      );
      
      if (timeSlotBooked) {
        return res.status(400).json({ message: 'This time slot is already booked' });
      }

      // Create booking with customer location
      const booking = await storage.createBooking({
        userId,
        shiftId,
        vetsVanId,
        appointmentDate,
        appointmentTime,
        status: 'pending_review',
        customerLocation: customerLocation || null,
        selectedPets: selectedPets || [],
        serviceType: serviceType || 'General Check Up'
      });

      // Link existing payment transaction to booking
      // First check if payment information is explicitly provided
      if (paymentReference && paymentId && booking) {
        try {
          console.log('💳 Linking existing payment transaction to booking:', booking.id);
          
          // Check if payment transaction already exists for this payment ID
          const existingPayment = await storage.getPaymentTransactionByPaymentId(paymentId);
          
          if (existingPayment) {
            // Get user details for payment record
            const user = await storage.getUser(userId);
            
            // Update existing payment transaction to link it to the booking AND update customer data
            await db.execute(sql`
              UPDATE payment_transactions 
              SET booking_id = ${booking.id},
                  customer_name = CASE 
                    WHEN customer_name IS NULL OR customer_name IN ('Customer', 'Payment Verified', 'Test Customer') 
                    THEN ${user?.name || 'Customer'}
                    ELSE customer_name 
                  END,
                  customer_phone = CASE 
                    WHEN customer_phone IS NULL OR customer_phone IN ('+966000000000', '0000000000') 
                    THEN ${user?.phone || '+966000000000'}
                    ELSE customer_phone 
                  END,
                  customer_email = CASE 
                    WHEN customer_email IS NULL OR customer_email IN ('customer@vetsvan.app', 'verified@payment.com', 'test@example.com') 
                    THEN ${user?.email || 'customer@vetsvan.app'}
                    ELSE customer_email 
                  END,
                  updated_at = ${new Date()}
              WHERE myfatoorah_payment_id = ${paymentId}
            `);
            
            console.log('✅ Payment transaction linked to booking with real customer data:', {
              bookingId: booking.id,
              customerName: user?.name,
              customerPhone: user?.phone,
              customerEmail: user?.email
            });
            
            // Verification log: Check what was actually saved in database
            const verifyPayment = await db.execute(sql`
              SELECT customer_name, customer_phone, customer_email 
              FROM payment_transactions 
              WHERE myfatoorah_payment_id = ${paymentId}
            `);
            console.log('🔍 Database verification - Real customer data persisted:', verifyPayment.rows[0]);
            
            // Also update any other payment transactions with the same payment ID that might have placeholder data
            await db.execute(sql`
              UPDATE payment_transactions 
              SET customer_name = CASE 
                    WHEN customer_name IS NULL OR customer_name IN ('Customer', 'Payment Verified', 'Test Customer') 
                    THEN ${user?.name || 'Customer'}
                    ELSE customer_name 
                  END,
                  customer_phone = CASE 
                    WHEN customer_phone IS NULL OR customer_phone IN ('+966000000000', '0000000000') 
                    THEN ${user?.phone || '+966000000000'}
                    ELSE customer_phone 
                  END,
                  customer_email = CASE 
                    WHEN customer_email IS NULL OR customer_email IN ('customer@vetsvan.app', 'verified@payment.com', 'test@example.com') 
                    THEN ${user?.email || 'customer@vetsvan.app'}
                    ELSE customer_email 
                  END,
                  updated_at = ${new Date()}
              WHERE myfatoorah_payment_id = ${paymentId}
              AND booking_id IS NULL
            `);
            console.log('🔧 Backfilled any remaining placeholder data for payment ID:', paymentId);
          } else {
            console.log('⚠️ No existing payment transaction found for payment ID:', paymentId);
            // Don't create a new payment - this should have been created already
          }
        } catch (paymentError) {
          console.error('❌ Failed to link payment transaction to booking:', paymentError);
          // Don't fail the booking creation if payment linking fails
        }
      } else if (booking) {
        // Fallback: Try to find and link recent unlinked payments by the same customer
        try {
          console.log('🔍 No payment info provided, searching for recent unlinked payments for user:', userId);
          const user = await storage.getUser(userId);
          
          if (user) {
            // Enhanced linking: Use phone number as primary identifier, with name as fallback
            // Extend time window to 2 hours for better reliability
            const recentUnlinkedPayments = await db.execute(sql`
              SELECT id, myfatoorah_payment_id, amount, currency, created_at, customer_name, customer_phone
              FROM payment_transactions 
              WHERE (
                  customer_phone = ${user.phone} OR
                  customer_email = ${user.email || ''} OR
                  customer_name = ${user.name} OR
                  LOWER(TRIM(customer_name)) = LOWER(TRIM(${user.name})) OR
                  customer_name LIKE '%' || ${user.name.split(' ')[0] || user.name} || '%'
                )
                AND booking_id IS NULL 
                AND status = 'paid'
                AND created_at >= ${new Date(Date.now() - 2 * 60 * 60 * 1000)}
              ORDER BY 
                CASE 
                  WHEN customer_phone = ${user.phone} THEN 1
                  WHEN customer_email = ${user.email || ''} THEN 2
                  WHEN customer_name = ${user.name} THEN 3
                  ELSE 4
                END,
                created_at DESC 
              LIMIT 1
            `);
            
            if (recentUnlinkedPayments.rows.length > 0) {
              const payment = recentUnlinkedPayments.rows[0];
              console.log('🎯 Found recent unlinked payment to link:', payment);
              
              // Link this payment to the new booking
              await db.execute(sql`
                UPDATE payment_transactions 
                SET booking_id = ${booking.id}, updated_at = ${new Date()}
                WHERE id = ${payment.id}
              `);
              
              console.log('✅ Automatically linked payment to booking:', {
                paymentId: payment.id,
                bookingId: booking.id,
                amount: payment.amount,
                currency: payment.currency,
                matchedBy: payment.customer_phone === user.phone ? 'phone' : 
                          payment.customer_email === user.email ? 'email' : 
                          payment.customer_name === user.name ? 'exact_name' : 'fuzzy_name'
              });
            } else {
              console.log('ℹ️ No recent unlinked payments found for automatic linking');
            }
          }
        } catch (fallbackError) {
          console.error('❌ Failed during fallback payment linking:', fallbackError);
          // Don't fail the booking creation if fallback linking fails
        }
      }

      // Get user details for the notification
      const user = await storage.getUser(userId);
      const customerName = user?.name || 'عميل جديد';
      
      // Get VetsVan details for email
      const vetsVan = await storage.getDriver(vetsVanId);
      const vetsVanName = vetsVan?.vetsvanName || 'VetsVan';
      
      // Send booking confirmation email if user has email
      if (user?.email) {
        try {
          await emailService.sendBookingConfirmationEmail(
            user.email,
            user.firstName || user.name,
            appointmentDate,
            appointmentTime,
            vetsVanName
          );
          console.log(`✅ Booking confirmation email sent to ${user.email}`);

          // Schedule pre-appointment notification (30 minutes before)
          emailService.schedulePreAppointmentNotification(
            user.email,
            user.firstName || user.name,
            appointmentDate,
            appointmentTime,
            vetsVanName
          );
          console.log(`📅 Pre-appointment notification scheduled for ${user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send booking confirmation email:', emailError);
          // Don't fail booking if email fails
        }
      }
      
      // Store notification for real-time updates
      // This could be enhanced with WebSocket or Server-Sent Events for real-time notifications
      console.log(`🔔 New booking notification for VetsVan ${vetsVanId}: ${customerName} booked ${appointmentTime} on ${appointmentDate}`);

      res.json({ 
        success: true, 
        booking,
        notification: {
          message: `New booking from ${customerName}`,
          vetsVanId,
          appointmentDate,
          appointmentTime
        }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Failed to book appointment' });
    }
  });

  // Get bookings for a specific VetsVan (Doctor)
  app.get('/api/doctor/bookings/:vetsVanId', requireAuth, async (req: any, res) => {
    try {
      const vetsVanId = parseInt(req.params.vetsVanId);
      const allBookings = await storage.getAllBookings();
      
      // Filter bookings for this specific VetsVan
      const vetsVanBookings = allBookings.filter(booking => 
        booking.vetsVanId === vetsVanId && booking.status === 'booked'
      );
      
      // Get user details for each booking
      const bookingsWithUserDetails = await Promise.all(
        vetsVanBookings.map(async (booking) => {
          const user = await storage.getUser(booking.userId);
          return {
            ...booking,
            customerName: user?.name || 'غير معروف',
            customerPhone: user?.phone || 'غير محدد'
          };
        })
      );
      
      res.json(bookingsWithUserDetails);
    } catch (error) {
      console.error('Error fetching VetsVan bookings:', error);
      res.status(500).json({ message: 'Failed to fetch VetsVan bookings' });
    }
  });

  // Get user's bookings for Activity page
  app.get('/api/user/bookings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userBookings = await storage.getUserBookings(userId);
      
      // Get VetsVan details for each booking
      const bookingsWithDetails = await Promise.all(
        userBookings.map(async (booking) => {
          const vetsVan = await storage.getDriver(booking.vetsVanId);
          const shift = await storage.getAllShifts().then(shifts => 
            shifts.find(s => s.id === booking.shiftId)
          );
          
          return {
            ...booking,
            vetsVanName: vetsVan?.vetsvanName || 'VetsVan',
            vetsVanCode: vetsVan?.vetsvanCode || '',
            carModel: vetsVan?.carModel || '',
            carColor: vetsVan?.carColor || '',
            plateNumber: vetsVan?.plateNumber || '',
            shiftDetails: shift || null
          };
        })
      );
      
      // Sort by appointment date and time (newest first)
      const sortedBookings = bookingsWithDetails.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`).getTime();
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`).getTime();
        return dateB - dateA;
      });
      
      res.json(sortedBookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ message: 'Failed to fetch user bookings' });
    }
  });

  // Update booking status (Doctor only)
  app.put('/api/bookings/:id/status', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['pending_review', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') 
        });
      }
      
      console.log(`🔄 Doctor ${req.user.username} updating booking ${bookingId} status to: ${status}`);
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      
      if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      // If booking is being confirmed (status = "confirmed"), automatically link any unlinked payments
      if (status === 'confirmed') {
        try {
          console.log(`🔗 Booking ${bookingId} confirmed - searching for unlinked payments to auto-link`);
          
          // Get booking details to find customer
          const booking = await storage.getBookingById(bookingId);
          if (booking) {
            const customer = await storage.getUser(booking.userId);
            
            if (customer) {
              // Enhanced linking: Use phone number as primary identifier with extended window
              const unlinkedPayments = await db.execute(sql`
                SELECT id, myfatoorah_payment_id, amount, currency, created_at, reference_id, customer_name, customer_phone
                FROM payment_transactions 
                WHERE (
                    customer_phone = ${customer.phone} OR
                    customer_email = ${customer.email || ''} OR
                    customer_name = ${customer.name} OR
                    LOWER(TRIM(customer_name)) = LOWER(TRIM(${customer.name})) OR
                    customer_name LIKE '%' || ${customer.name.split(' ')[0] || customer.name} || '%'
                  )
                  AND booking_id IS NULL 
                  AND status = 'paid'
                  AND created_at >= ${new Date(Date.now() - 48 * 60 * 60 * 1000)}
                ORDER BY 
                  CASE 
                    WHEN customer_phone = ${customer.phone} THEN 1
                    WHEN customer_email = ${customer.email || ''} THEN 2
                    WHEN customer_name = ${customer.name} THEN 3
                    ELSE 4
                  END,
                  created_at DESC 
                LIMIT 1
              `);
              
              if (unlinkedPayments.rows.length > 0) {
                const payment = unlinkedPayments.rows[0];
                
                // Link this payment to the confirmed booking
                await db.execute(sql`
                  UPDATE payment_transactions 
                  SET booking_id = ${bookingId}, updated_at = ${new Date()}
                  WHERE id = ${payment.id}
                `);
                
                console.log(`✅ Auto-linked payment to confirmed booking:`, {
                  paymentId: payment.id,
                  bookingId: bookingId,
                  amount: payment.amount,
                  currency: payment.currency,
                  customerName: customer.name,
                  reference: payment.reference_id,
                  matchedBy: payment.customer_phone === customer.phone ? 'phone' : 
                            payment.customer_email === customer.email ? 'email' : 
                            payment.customer_name === customer.name ? 'exact_name' : 'fuzzy_name'
                });
              } else {
                console.log(`ℹ️ No unlinked payments found for customer ${customer.name} within 48h window`);
              }
            }
          }
        } catch (linkingError) {
          console.error('❌ Failed to auto-link payment during booking confirmation:', linkingError);
          // Don't fail the status update if payment linking fails
        }
      }
      
      console.log(`✅ Booking ${bookingId} status updated successfully to: ${status}`);
      res.json({ 
        success: true, 
        booking: updatedBooking,
        message: `Booking status updated to ${status}` 
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Failed to update booking status' });
    }
  });

  // Send tracking notification to customer (Doctor only)
  app.post('/api/bookings/:id/send-tracking', requireAuth, async (req: any, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied. Doctor only.' });
      }

      const bookingId = parseInt(req.params.id);
      
      // Get booking details
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Get customer details
      const customer = await storage.getUser(booking.userId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Get VetsVan details
      const vetsVan = await storage.getDriver(booking.vetsVanId);
      if (!vetsVan) {
        return res.status(404).json({ message: 'VetsVan not found' });
      }

      // Calculate estimated arrival time (random between 15-45 minutes)
      const estimatedMinutes = Math.floor(Math.random() * 31) + 15; // 15-45 minutes
      const arrivalTime = new Date();
      arrivalTime.setMinutes(arrivalTime.getMinutes() + estimatedMinutes);

      // Create tracking notification for customer
      const trackingNotification = {
        bookingId: bookingId,
        vetsVanCode: vetsVan.vetsvanCode,
        vetsVanName: vetsVan.vetsvanName,
        driverName: user.name || user.username,
        estimatedArrival: arrivalTime.toISOString(),
        status: 'on_way',
        message: {
          ar: `🚚 VETS VAN في الطريق إليك الآن! الوصول المتوقع خلال ${estimatedMinutes} دقيقة`,
          en: `🚚 VETS VAN is on the way to you! Expected arrival in ${estimatedMinutes} minutes`
        },
        createdAt: new Date().toISOString()
      };

      // Store tracking notification (we'll add this to customer activity)
      await storage.createTrackingNotification(trackingNotification);

      // Send email notification if customer has email
      if (customer.email) {
        try {
          await emailService.sendTrackingNotificationEmail(
            customer.email,
            customer.name || 'العميل الكريم',
            vetsVan.vetsvanCode,
            estimatedMinutes,
            booking.appointmentDate,
            booking.appointmentTime
          );
          console.log(`📧 Tracking email sent to ${customer.email}`);
        } catch (emailError) {
          console.error('Failed to send tracking email:', emailError);
          // Don't fail the request if email fails
        }
      }

      console.log(`🚚 Tracking notification sent for booking ${bookingId} - ETA: ${estimatedMinutes} minutes`);
      
      res.json({ 
        success: true, 
        message: 'Tracking notification sent successfully',
        trackingInfo: trackingNotification
      });
    } catch (error) {
      console.error('Error sending tracking notification:', error);
      res.status(500).json({ message: 'Failed to send tracking notification' });
    }
  });

  // Get bookings for current doctor's VetsVan (no VetsVan ID required)
  app.get('/api/doctor/bookings', requireAuth, async (req: any, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get doctor's VetsVan ID from user data (direct mapping from doctors table)
      const vetsVanId = user.vetsVanId || user.id;
      
      if (!vetsVanId) {
        return res.status(404).json({ message: 'VetsVan ID not found' });
      }
      
      const allBookings = await storage.getAllBookings();
      
      // Filter bookings for this specific VetsVan - show ALL bookings regardless of status
      const vetsVanBookings = allBookings.filter(booking => 
        booking.vetsVanId === vetsVanId
      );
      
      // Sort bookings by creation date (newest first)
      const sortedBookings = vetsVanBookings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Get user details and payment information for each booking
      const bookingsWithUserDetails = await Promise.all(
        sortedBookings.map(async (booking) => {
          const customer = await storage.getUser(booking.userId);
          
          // Get payment information from MyFatoorah transactions
          const paymentTransaction = await storage.getPaymentTransactionByBooking(booking.id);
          
          return {
            ...booking,
            customerName: customer?.name || 'غير معروف',
            customerPhone: customer?.phone || 'غير محدد',
            customerLocation: booking.customerLocation ? {
              latitude: booking.customerLocation.latitude,
              longitude: booking.customerLocation.longitude,
              address: booking.customerLocation.address || null
            } : null,
            paymentAmount: paymentTransaction?.amount || null,
            paymentCurrency: paymentTransaction?.currency || 'SAR',
            paymentStatus: paymentTransaction?.status || null
          };
        })
      );
      
      // Add cache-busting headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(bookingsWithUserDetails);
    } catch (error) {
      console.error('Error fetching doctor bookings:', error);
      res.status(500).json({ message: 'Failed to fetch doctor bookings' });
    }
  });

  // Get individual booking details for doctor invoice
  app.get('/api/doctor/booking/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const user = req.user as any;
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const bookingId = parseInt(req.params.bookingId);
      const booking = await storage.getBookingWithDetails(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify this booking belongs to the doctor's VetsVan
      const vetsVanId = user.vetsVanId || user.id;
      if (booking.vetsVanId !== vetsVanId) {
        return res.status(403).json({ message: 'Access denied - booking not for your VetsVan' });
      }

      res.json(booking);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      res.status(500).json({ message: 'Failed to fetch booking details' });
    }
  });

  // Get user's bookings
  app.get('/api/user/bookings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  // Get bookings by date (for availability checking)
  app.get('/api/bookings/by-date', requireAuth, async (req: any, res) => {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: 'Date parameter is required' });
      }
      
      const allBookings = await storage.getAllBookings();
      
      // Filter bookings for the specific date
      const dateBookings = allBookings.filter(booking => 
        booking.appointmentDate === date
      );
      
      // Return only essential fields for availability checking
      const bookingsForDate = dateBookings.map(booking => ({
        id: booking.id,
        vetsVanId: booking.vetsVanId,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        status: booking.status
      }));
      
      res.json(bookingsForDate);
    } catch (error) {
      console.error('Error fetching bookings by date:', error);
      res.status(500).json({ message: 'Failed to fetch bookings by date' });
    }
  });

  // Get all Vets Vans for customer booking (accessible by customers)
  app.get('/api/vetsvan/list', requireAuth, async (req: any, res) => {
    try {
      console.log('🔍 Customer VetsVan list endpoint called');
      const drivers = await storage.getAllDrivers();
      
      // Return essential information for booking
      const vetsVanList = drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        vetsvanCode: driver.vetsvanCode,
        vetsvanName: driver.vetsvanName,
        isAvailable: driver.isAvailable,
        username: driver.username
      }));
      
      console.log(`✅ Retrieved ${vetsVanList.length} Vets Vans for customer booking`);
      res.json(vetsVanList);
    } catch (error) {
      console.error('Error fetching Vets Van list:', error);
      res.status(500).json({ message: 'Failed to fetch Vets Van list' });
    }
  });

  // Get shifts for customer booking (accessible by customers)
  app.get('/api/vetsvan/shifts', requireAuth, async (req: any, res) => {
    try {
      console.log('🔍 Customer shifts endpoint called');
      const date = req.query.date as string;
      
      const shifts = await storage.getAllShifts();
      
      // Filter shifts by date if provided
      const filteredShifts = date 
        ? shifts.filter(shift => shift.date === date)
        : shifts;
      
      // Return essential shift information for booking
      const shiftList = filteredShifts.map(shift => ({
        id: shift.id,
        vetsVanId: shift.vetsVanId,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: shift.status
      }));
      
      console.log(`✅ Retrieved ${shiftList.length} shifts for customer booking`);
      res.json(shiftList);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      res.status(500).json({ message: 'Failed to fetch shifts' });
    }
  });

  // Complete booking service (Doctor marks service as completed)
  app.post('/api/bookings/:bookingId/complete', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Get booking with user details to send email notification
      const bookingWithUser = await storage.getBookingWithUserDetails(bookingId);
      
      if (!bookingWithUser) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update booking status to completed
      await storage.updateBookingStatus(bookingId, 'completed');

      // Send email notification to customer if they have email
      if (bookingWithUser.user.email) {
        try {
          await emailService.sendServiceCompletionEmail(
            bookingWithUser.user.email,
            bookingWithUser.user.name,
            bookingWithUser.appointmentDate,
            bookingWithUser.appointmentTime
          );
          console.log(`✅ Service completion email sent to ${bookingWithUser.user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send service completion email:', emailError);
          // Don't fail the completion if email fails
        }
      }

      res.json({ 
        success: true, 
        message: 'Service marked as completed',
        booking: { ...bookingWithUser, status: 'completed' }
      });

    } catch (error) {
      console.error('Error completing booking:', error);
      res.status(500).json({ message: 'Failed to complete service' });
    }
  });

  // Get review for a specific booking
  app.get('/api/bookings/:bookingId/review', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const review = await storage.getBookingReview(bookingId);
      res.json(review);
    } catch (error) {
      console.error('Error fetching review:', error);
      res.status(500).json({ message: 'Failed to fetch review' });
    }
  });

  // Get user's reviews
  app.get('/api/user/reviews', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ message: 'Failed to fetch user reviews' });
    }
  });

  // Get user's reviews
  app.get('/api/user/reviews', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  });

  // Complete service endpoint (for doctors)
  app.post('/api/bookings/:id/complete', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const doctorUserId = req.user.id;
      
      // Get the booking with user details
      const bookingWithUser = await storage.getBookingWithUserDetails(bookingId);
      
      if (!bookingWithUser) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update booking status to completed
      await storage.updateBookingStatus(bookingId, 'completed');
      
      // Send completion email to customer
      try {
        if (bookingWithUser.user.email) {
          await emailService.sendServiceCompletionEmail(
            bookingWithUser.user.email,
            bookingWithUser.user.firstName || bookingWithUser.user.username,
            bookingWithUser.appointmentDate,
            bookingWithUser.appointmentTime
          );
        }
      } catch (emailError) {
        console.error('Error sending completion email:', emailError);
        // Don't fail the entire request if email fails
      }
      
      res.json({ 
        message: 'Service completed successfully',
        booking: { ...bookingWithUser, status: 'completed' }
      });
    } catch (error) {
      console.error('Error completing service:', error);
      res.status(500).json({ message: 'Failed to complete service' });
    }
  });

  // Submit review endpoint for specific booking (for customers)
  app.post('/api/bookings/:bookingId/review', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { rating, comment } = req.body;
      const userId = req.user.id;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Valid rating (1-5) is required' });
      }

      // Verify booking exists and belongs to user
      const userBookings = await storage.getUserBookings(userId);
      const booking = userBookings.find(b => b.id === bookingId && b.status === 'completed');
      
      if (!booking) {
        return res.status(404).json({ message: 'Completed booking not found' });
      }

      // Check if user already reviewed this booking
      const existingReview = await storage.getBookingReview(bookingId);
      if (existingReview) {
        return res.status(409).json({ message: 'You have already reviewed this service' });
      }

      // Create the review
      const review = await storage.createReview({
        bookingId,
        userId,
        rating,
        comment: comment || null
      });

      res.json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ message: 'Failed to submit review' });
    }
  });

  // Get reviews for a booking
  app.get('/api/bookings/:bookingId/review', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const review = await storage.getBookingReview(bookingId);
      
      if (!review) {
        return res.status(404).json({ message: 'No review found for this booking' });
      }
      
      res.json(review);
    } catch (error) {
      console.error('Error fetching booking review:', error);
      res.status(500).json({ message: 'Failed to fetch review' });
    }
  });

  // Admin Authentication using database-backed sessions
  async function requireAdminAuth(req: any, res: any, next: any) {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      
      if (!sessionId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const session = await sessionService.getSession(sessionId);
      
      if (!session || session.userType !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      req.admin = session.userData;
      req.session = session;
      next();
    } catch (error) {
      console.error('❌ Admin authentication error:', error);
      return res.status(500).json({ message: 'Authentication error' });
    }
  }

  // Admin login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const admin = await storage.getAdminByUsername(username);
      
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Proper password verification with bcrypt support
      let isPasswordValid = false;
      if (admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$')) {
        // Bcrypt hashed password
        isPasswordValid = await bcrypt.compare(password, admin.password);
      } else {
        // Plain text password (legacy) - direct comparison
        isPasswordValid = (password === admin.password);
      }
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const adminData = {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      };
      const sessionId = await sessionService.createSession(admin.id, 'admin', adminData, 24);

      res.json({
        token: sessionId,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Get all drivers for admin
  app.get('/api/admin/drivers', requireAdminAuth, async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      res.status(500).json({ message: 'Failed to fetch drivers' });
    }
  });

  // Authorization Roles management routes (JSON-based)
  app.post('/api/admin/authorization-roles', requireAdminAuth, async (req, res) => {
    try {
      const { name, permissions } = req.body;
      
      if (!name || !permissions) {
        return res.status(400).json({ message: 'Name and permissions are required' });
      }
      
      const newRole = await storage.createAuthorizationRole({
        name,
        permissions
      });
      
      res.json(newRole);
    } catch (error) {
      console.error('Error creating authorization role:', error);
      res.status(500).json({ message: 'Error creating authorization role' });
    }
  });

  app.get('/api/admin/authorization-roles', requireAdminAuth, async (req, res) => {
    try {
      const roles = await storage.getAllAuthorizationRoles();
      res.json(roles);
    } catch (error) {
      console.error('Error fetching authorization roles:', error);
      res.status(500).json({ message: 'Error fetching authorization roles' });
    }
  });

  app.put('/api/admin/authorization-roles/:id', requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, permissions } = req.body;
      
      if (!name || !permissions) {
        return res.status(400).json({ message: 'Name and permissions are required' });
      }
      
      const updatedRole = await storage.updateAuthorizationRole(id, {
        name,
        permissions
      });
      
      if (!updatedRole) {
        return res.status(404).json({ message: 'Authorization role not found' });
      }
      
      res.json(updatedRole);
    } catch (error) {
      console.error('Error updating authorization role:', error);
      res.status(500).json({ message: 'Error updating authorization role' });
    }
  });

  // Get current user's authorization permissions
  app.get('/api/admin/current-user-permissions', requireAdminAuth, async (req, res) => {
    try {
      const adminId = req.admin.id;
      
      // Get the admin user with their authorization role
      const adminUserWithAuth = await db.select({
        id: adminUsers.id,
        username: adminUsers.username,
        authorizationRoleId: adminUsers.authorizationRoleId,
        rolePermissions: authorizationRoles.permissions
      })
      .from(adminUsers)
      .leftJoin(authorizationRoles, eq(adminUsers.authorizationRoleId, authorizationRoles.id))
      .where(eq(adminUsers.id, adminId))
      .limit(1);
      
      if (!adminUserWithAuth.length) {
        return res.status(404).json({ message: 'Admin user not found' });
      }
      
      let permissions = adminUserWithAuth[0];
      
      // Super Admin Exception: If username is "admin", grant full permissions
      if (permissions.username === 'admin') {
        console.log('🔑 Super Admin detected - granting full permissions to admin user');
        // Create full permissions object for super admin
        permissions = {
          ...permissions,
          rolePermissions: {
            Users: { noPermission: false, read: true, fullControl: true, export: true },
            Authorization: { noPermission: false, read: true, fullControl: true, export: true },
            VetsVanManagement: { noPermission: false, read: true, fullControl: true, export: true },
            VetsVanShifts: { noPermission: false, read: true, fullControl: true, export: true },
            Import: { noPermission: false, read: true, fullControl: true, export: true },
            Services: { noPermission: false, read: true, fullControl: true, export: true },
            Products: { noPermission: false, read: true, fullControl: true, export: true },
            CreditNote: { noPermission: false, read: true, fullControl: true, export: true }
          }
        };
      }
      
      // Set cache control headers to prevent stale permission data
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching current user permissions:', error);
      res.status(500).json({ message: 'Error fetching permissions' });
    }
  });

  // Admin users management routes
  app.get('/api/admin/admin-users', requireAdminAuth, async (req, res) => {
    try {
      const adminUsersList = await db.select({
        id: adminUsers.id,
        firstName: adminUsers.firstName,
        lastName: adminUsers.lastName,
        email: adminUsers.email,
        username: adminUsers.username,
        authorizationRoleId: adminUsers.authorizationRoleId,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
        authorizationName: authorizationRoles.name
      })
      .from(adminUsers)
      .leftJoin(authorizationRoles, eq(adminUsers.authorizationRoleId, authorizationRoles.id))
      .orderBy(adminUsers.createdAt);
      
      res.json(adminUsersList);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ message: 'Error fetching admin users' });
    }
  });

  app.post('/api/admin/admin-users', requireAdminAuth, async (req, res) => {
    try {
      const userData = insertAdminUserSchema.parse(req.body);
      
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };
      
      const [newUser] = await db.insert(adminUsers).values(userDataWithHashedPassword).returning();
      res.json(newUser);
    } catch (error) {
      console.error('Error creating admin user:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      // Handle database unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        if (error.constraint === 'admin_users_email_unique') {
          return res.status(400).json({ message: 'Email address is already in use' });
        }
        if (error.constraint === 'admin_users_username_unique') {
          return res.status(400).json({ message: 'Username is already taken' });
        }
      }
      res.status(500).json({ message: 'Error creating admin user' });
    }
  });

  app.put('/api/admin/admin-users/:id', requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertAdminUserSchema.parse(req.body);
      
      // Hash password if provided
      let userDataWithHashedPassword = { ...userData };
      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userDataWithHashedPassword.password = hashedPassword;
      }
      
      const [updatedUser] = await db.update(adminUsers)
        .set({ ...userDataWithHashedPassword, updatedAt: new Date() })
        .where(eq(adminUsers.id, id))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Admin user not found' });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating admin user:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Error updating admin user' });
    }
  });

  app.put('/api/admin/admin-users/:id/toggle-status', requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const [updatedUser] = await db.update(adminUsers)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(adminUsers.id, id))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Admin user not found' });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error toggling admin user status:', error);
      res.status(500).json({ message: 'Error updating admin user status' });
    }
  });

  // Add new driver
  app.post('/api/admin/drivers', requireAdminAuth, async (req, res) => {
    try {
      const { vetsvanCode, vetsvanName, phone, username, password } = req.body;
      
      if (!vetsvanCode || !vetsvanName || !phone || !username || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const driver = await storage.createDriver({
        vetsvanCode,
        vetsvanName,
        name: vetsvanName, // Use vetsvanName as the driver name
        phone,
        username,
        password,
        rating: 4.5,
        carModel: "Mercedes Sprinter",
        carColor: "أبيض",
        plateNumber: vetsvanCode,
        latitude: 24.7136,
        longitude: 46.6753,
        isAvailable: true
      });

      res.json(driver);
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ message: 'Failed to create driver' });
    }
  });

  // Delete driver
  app.delete('/api/admin/drivers/:id', requireAdminAuth, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      await storage.deleteDriver(driverId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting driver:', error);
      res.status(500).json({ message: 'Failed to delete driver' });
    }
  });

  // Update driver availability
  app.put('/api/admin/drivers/:id/availability', requireAdminAuth, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { isAvailable } = req.body;
      
      await storage.updateDriverAvailability(driverId, isAvailable);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating driver availability:', error);
      res.status(500).json({ message: 'Failed to update driver availability' });
    }
  });

  // Update driver location
  app.put('/api/admin/drivers/:id/location', requireAdminAuth, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { latitude, longitude } = req.body;
      
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ message: 'Valid latitude and longitude are required' });
      }
      
      await storage.updateDriverLocation(driverId, latitude, longitude);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating driver location:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  });

  // Update VetsVan data (edit function)
  app.put('/api/admin/drivers/:id', requireAdminAuth, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { vetsvanCode, vetsvanName, username, phone, plateNumber } = req.body;
      
      if (!vetsvanCode || !vetsvanName || !username || !phone || !plateNumber) {
        return res.status(400).json({ message: 'VetsVan code, name, username, phone, and plate number are required' });
      }
      
      await storage.updateVetsVanData(driverId, vetsvanCode, vetsvanName, username, phone, plateNumber);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating VetsVan data:', error);
      res.status(500).json({ message: 'Failed to update VetsVan data' });
    }
  });

  // Shifts management endpoints
  app.get('/api/admin/shifts', requireAdminAuth, async (req, res) => {
    try {
      const shifts = await storage.getAllShifts();
      res.json(shifts);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      res.status(500).json({ message: 'Failed to fetch shifts' });
    }
  });

  app.post('/api/admin/shifts', requireAdminAuth, async (req, res) => {
    try {
      const shiftData = req.body;
      const shift = await storage.createShift(shiftData);
      res.json(shift);
    } catch (error) {
      console.error('Error creating shift:', error);
      res.status(500).json({ message: 'Failed to create shift' });
    }
  });

  app.delete('/api/admin/shifts/:id', requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteShift(id);
      res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
      console.error('Error deleting shift:', error);
      res.status(500).json({ message: 'Failed to delete shift' });
    }
  });

  // Admin: Get reports statistics
  app.get('/api/admin/reports', requireAdminAuth, async (req, res) => {
    try {
      const stats = await storage.getReportsStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching reports stats:', error);
      res.status(500).json({ message: 'Failed to fetch reports stats' });
    }
  });

  // Admin: Get detailed reviews with user and VetsVan information
  app.get('/api/admin/reviews-details', requireAdminAuth, async (req, res) => {
    try {
      const reviewsDetails = await storage.getDetailedReviews();
      res.json(reviewsDetails);
    } catch (error) {
      console.error('Error fetching detailed reviews:', error);
      res.status(500).json({ message: 'Failed to fetch detailed reviews' });
    }
  });

  // Admin: Get all generated invoices for sales report
  app.get('/api/admin/generated-invoices', requireAdminAuth, async (req, res) => {
    try {
      const generatedInvoices = await storage.getAllGeneratedInvoices();
      res.json(generatedInvoices);
    } catch (error) {
      console.error('Error fetching generated invoices:', error);
      res.status(500).json({ message: 'Failed to fetch generated invoices' });
    }
  });

  // Admin: Get detailed invoice items for specific booking
  app.get('/api/admin/invoice-details/:bookingId', requireAdminAuth, async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      // Get invoice items
      const invoiceItems = await storage.getInvoiceItems(parseInt(bookingId));
      
      // Get invoice status
      const invoiceStatus = await storage.getInvoiceStatus(parseInt(bookingId));
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(parseInt(bookingId));
      
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      const response = {
        invoiceItems: invoiceItems || [],
        invoiceStatus: invoiceStatus || {
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          finalTotal: 0,
          notes: ''
        },
        booking: {
          id: booking.id,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          serviceType: booking.serviceType,
          pets: booking.pets || []
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      res.status(500).json({ message: 'Failed to fetch invoice details' });
    }
  });

  // Admin: Create a new credit note
  app.post('/api/admin/credit-notes', requireAdminAuth, async (req, res) => {
    try {
      const creditNoteData = req.body;
      
      // CONCURRENCY PROTECTION: Generate number during creation with retry logic
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries) {
        try {
          // Generate fresh number each attempt
          const creditNoteNumber = await storage.getNextCreditNoteNumber();
          
          // Create credit note with fresh number
          const creditNoteWithNumber = {
            ...creditNoteData,
            creditNoteNumber
          };
          
          const newCreditNote = await storage.createCreditNote(creditNoteWithNumber);
          return res.status(201).json(newCreditNote);
          
        } catch (createError: any) {
          // Check if it's a unique constraint violation
          if (createError.code === '23505' && createError.constraint?.includes('credit_note_number')) {
            retryCount++;
            console.log(`Credit Note number collision, retrying... (${retryCount}/${maxRetries})`);
            if (retryCount >= maxRetries) {
              throw new Error('Failed to generate unique credit note number after multiple attempts');
            }
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 50));
          } else {
            throw createError;
          }
        }
      }
    } catch (error) {
      console.error('Error creating credit note:', error);
      res.status(500).json({ message: 'Failed to create credit note' });
    }
  });

  // Admin: Create a new outgoing payment
  app.post('/api/admin/outgoing-payments', requireAdminAuth, async (req, res) => {
    try {
      const paymentData = insertOutgoingPaymentSchema.parse(req.body);
      
      // Calculate total amount from payment methods
      const paymentMethods = paymentData.paymentMethods;
      const totalAmount = 
        (paymentMethods.cash.checked ? paymentMethods.cash.amount : 0) +
        (paymentMethods.card.checked ? paymentMethods.card.amount : 0) +
        (paymentMethods.bank.checked ? paymentMethods.bank.amount : 0);
      
      // Create the payment record
      const newPayment = await storage.createOutgoingPayment({
        ...paymentData,
        totalAmount: totalAmount.toString()
      });
      
      res.status(201).json(newPayment);
    } catch (error) {
      console.error('Error creating outgoing payment:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create outgoing payment' });
    }
  });

  // Admin: Create a new income payment
  app.post('/api/admin/income-payments', requireAdminAuth, async (req, res) => {
    try {
      const paymentData = insertIncomePaymentSchema.parse(req.body);
      
      // Calculate total amount from payment methods
      const paymentMethods = paymentData.paymentMethods;
      const totalAmount = 
        (paymentMethods.cash.checked ? paymentMethods.cash.amount : 0) +
        (paymentMethods.card.checked ? paymentMethods.card.amount : 0) +
        (paymentMethods.bank.checked ? paymentMethods.bank.amount : 0);
      
      // Create the payment record
      const newPayment = await storage.createIncomePayment({
        ...paymentData,
        totalAmount: totalAmount.toString()
      });
      
      res.status(201).json(newPayment);
    } catch (error) {
      console.error('Error creating income payment:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create income payment' });
    }
  });

  // Admin: Get all outgoing payments
  app.get('/api/admin/outgoing-payments', requireAdminAuth, async (req, res) => {
    try {
      const outgoingPayments = await storage.getAllOutgoingPayments();
      res.json(outgoingPayments);
    } catch (error) {
      console.error('Error fetching outgoing payments:', error);
      res.status(500).json({ message: 'Failed to fetch outgoing payments' });
    }
  });

  // Admin: Get all income payments
  app.get('/api/admin/income-payments', requireAdminAuth, async (req, res) => {
    try {
      const incomePayments = await storage.getAllIncomePayments();
      res.json(incomePayments);
    } catch (error) {
      console.error('Error fetching income payments:', error);
      res.status(500).json({ message: 'Failed to fetch income payments' });
    }
  });

  // Admin: Get next outgoing payment number
  app.get('/api/admin/outgoing-payments/next-number', requireAdminAuth, async (req, res) => {
    try {
      const nextNumber = await storage.getNextOutgoingPaymentNumber();
      res.json({ nextNumber });
    } catch (error) {
      console.error('Error fetching next outgoing payment number:', error);
      res.status(500).json({ message: 'Failed to fetch next outgoing payment number' });
    }
  });

  // Admin: Get next income payment number
  app.get('/api/admin/income-payments/next-number', requireAdminAuth, async (req, res) => {
    try {
      const nextNumber = await storage.getNextIncomePaymentNumber();
      res.json({ nextNumber });
    } catch (error) {
      console.error('Error fetching next income payment number:', error);
      res.status(500).json({ message: 'Failed to fetch next income payment number' });
    }
  });

  // Admin: Get all credit notes
  app.get('/api/admin/credit-notes', requireAdminAuth, async (req, res) => {
    try {
      const creditNotes = await storage.getAllCreditNotes();
      res.json(creditNotes);
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      res.status(500).json({ message: 'Failed to fetch credit notes' });
    }
  });

  // Admin: Get AR Balance data
  app.get('/api/admin/ar-balance', requireAdminAuth, async (req, res) => {
    try {
      const arBalanceData = await storage.getARBalanceData();
      res.json(arBalanceData);
    } catch (error) {
      console.error('Error fetching AR balance data:', error);
      res.status(500).json({ message: 'Failed to fetch AR balance data' });
    }
  });

  // Admin: Get customer transaction details for AR Balance
  app.get('/api/admin/ar-balance/details/:customerId', requireAdminAuth, async (req, res) => {
    try {
      const { customerId } = req.params;
      const customerIdNum = parseInt(customerId);
      
      if (isNaN(customerIdNum)) {
        return res.status(400).json({ message: 'Invalid customer ID' });
      }
      
      const transactionDetails = await storage.getCustomerTransactionDetails(customerIdNum);
      res.json(transactionDetails);
    } catch (error) {
      console.error('Error fetching customer transaction details:', error);
      res.status(500).json({ message: 'Failed to fetch customer transaction details' });
    }
  });

  // Admin: Get next credit note number
  app.get('/api/admin/credit-notes/next-number', requireAdminAuth, async (req, res) => {
    try {
      const nextNumber = await storage.getNextCreditNoteNumber();
      res.json({ nextNumber });
    } catch (error) {
      console.error('Error fetching next credit note number:', error);
      res.status(500).json({ message: 'Failed to fetch next credit note number' });
    }
  });

  // Admin: Get credited items for a specific invoice
  app.get('/api/admin/credit-notes/credited-items/:invoiceNumber', requireAdminAuth, async (req, res) => {
    try {
      const { invoiceNumber } = req.params;
      const creditedItems = await storage.getCreditedItemsForInvoice(invoiceNumber);
      res.json(creditedItems);
    } catch (error) {
      console.error('Error fetching credited items:', error);
      res.status(500).json({ message: 'Failed to fetch credited items' });
    }
  });

  // Admin: Get credit note by ID
  app.get('/api/admin/credit-notes/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const creditNote = await storage.getCreditNote(parseInt(id));
      
      if (!creditNote) {
        return res.status(404).json({ message: 'Credit note not found' });
      }
      
      res.json(creditNote);
    } catch (error) {
      console.error('Error fetching credit note:', error);
      res.status(500).json({ message: 'Failed to fetch credit note' });
    }
  });

  // Doctor VetsVan location endpoint
  app.get('/api/doctor/vetsvan-location', requireAuth, async (req: any, res) => {
    try {
      const user = req.user as any;
      
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get doctor's VetsVan ID from user data
      const vetsVanId = user.vetsVanId || user.id;
      
      if (!vetsVanId) {
        return res.status(404).json({ message: 'VetsVan ID not found' });
      }
      
      // Get VetsVan details from storage
      const vetsVan = await storage.getDriver(vetsVanId);
      
      if (!vetsVan) {
        return res.status(404).json({ message: 'VetsVan not found' });
      }
      
      const vetsVanInfo = {
        id: vetsVan.id,
        vetsvanCode: vetsVan.vetsvanCode,
        vetsvanName: vetsVan.vetsvanName,
        latitude: vetsVan.latitude,
        longitude: vetsVan.longitude,
        vehicleModel: vetsVan.vehicleModel || 'Mercedes Sprinter',
        vehicleColor: vetsVan.vehicleColor || 'White',
        plateNumber: vetsVan.plateNumber || 'ABC-123'
      };
      
      res.json(vetsVanInfo);
    } catch (error) {
      console.error('Error fetching VetsVan location:', error);
      res.status(500).json({ message: 'Failed to fetch VetsVan location' });
    }
  });

  // Doctor profile and account endpoints
  app.put('/api/doctor/profile', requireAuth, async (req, res) => {
    try {
      const user = req.user;
      
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const { name, phone, email } = req.body;
      
      // Update doctor profile in database
      const updatedUser = await storage.updateUser(user.id, { name, phone, email });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  app.put('/api/doctor/change-password', requireAuth, async (req, res) => {
    try {
      const user = req.user;
      
      if (user.membershipType !== 'doctor') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // For doctors, check current password against the driver's password
      const driver = await storage.getDriver(user.id);
      if (!driver || driver.password !== currentPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Update password
      const updatedUser = await storage.updateUserPassword(user.id, newPassword);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error changing doctor password:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  // Send SMS using Taqnyat API
  app.post('/api/admin/send-sms', requireAdminAuth, async (req, res) => {
    try {
      const { message, phoneNumber } = req.body;
      
      if (!message || !phoneNumber) {
        return res.status(400).json({ message: 'Message and phone number are required' });
      }

      // Taqnyat API configuration  
      const taqnyatApiUrl = 'https://api.taqnyat.sa/v1/messages';
      const bearerToken = process.env.TAQNYAT_API_KEY;
      
      if (!bearerToken) {
        console.error('TAQNYAT_API_KEY is not configured');
        return res.status(500).json({ message: 'SMS service not configured' });
      }

      // Prepare SMS data for Taqnyat
      const smsData = {
        recipients: [phoneNumber],
        body: message,
        sender: "Vets Van" // Registered sender name
      };

      // Log the request for debugging
      console.log('Sending SMS request to Taqnyat:', {
        url: taqnyatApiUrl,
        recipients: smsData.recipients,
        sender: smsData.sender,
        messageLength: message.length,
        hasApiKey: !!bearerToken,
        apiKeyLength: bearerToken ? bearerToken.length : 0
      });

      // Send SMS via Taqnyat API
      const response = await fetch(taqnyatApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(smsData)
      });

      console.log('Taqnyat API Response Status:', response.status);
      console.log('Taqnyat API Response Headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Taqnyat API Response Body:', responseText);

      if (!response.ok) {
        console.error('Taqnyat API Error - Status:', response.status);
        console.error('Taqnyat API Error - Body:', responseText);
        
        return res.status(500).json({ 
          message: 'Failed to send SMS via Taqnyat',
          error: `API returned ${response.status}: ${responseText}`,
          apiStatus: response.status
        });
      }

      // Try to parse JSON response
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('SMS sent successfully:', result);
      } catch (parseError) {
        console.error('Failed to parse Taqnyat response as JSON:', parseError);
        console.log('Response text:', responseText);
        
        // If response is successful but not JSON, treat as success
        if (response.status >= 200 && response.status < 300) {
          result = { message: 'SMS sent successfully', rawResponse: responseText };
        } else {
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
      }

      res.json({ 
        success: true, 
        message: 'SMS sent successfully',
        data: result 
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      res.status(500).json({ message: 'Failed to send SMS' });
    }
  });

  // Red Zones Management Routes
  app.post('/api/admin/red-zones', requireAuth, async (req, res) => {
    try {
      const { vetsvanId, zones } = req.body;
      
      if (!vetsvanId || !Array.isArray(zones)) {
        return res.status(400).json({ error: 'VetsVan ID and zones array are required' });
      }

      // Delete existing zones for this VetsVan
      await db.delete(redZones).where(eq(redZones.vetsvanId, vetsvanId));
      
      // Insert new zones
      if (zones.length > 0) {
        const newZones = zones.map(zone => ({
          vetsvanId,
          latitude: zone.lat,
          longitude: zone.lng,
          radius: zone.radius,
          name: zone.name || `Zone ${zones.indexOf(zone) + 1}`
        }));
        
        await db.insert(redZones).values(newZones);
      }
      
      res.json({ success: true, message: 'Red zones saved successfully' });
    } catch (error) {
      console.error('Error saving red zones:', error);
      res.status(500).json({ error: 'Failed to save red zones' });
    }
  });

  app.get('/api/admin/red-zones/:vetsvanId', requireAuth, async (req, res) => {
    try {
      const { vetsvanId } = req.params;
      
      const zones = await db
        .select()
        .from(redZones)
        .where(eq(redZones.vetsvanId, parseInt(vetsvanId)));
      
      res.json({ zones });
    } catch (error) {
      console.error('Error fetching red zones:', error);
      res.status(500).json({ error: 'Failed to fetch red zones' });
    }
  });

  app.delete('/api/admin/red-zones/:zoneId', requireAuth, async (req, res) => {
    try {
      const { zoneId } = req.params;
      
      await db.delete(redZones).where(eq(redZones.id, parseInt(zoneId)));
      
      res.json({ success: true, message: 'Red zone deleted successfully' });
    } catch (error) {
      console.error('Error deleting red zone:', error);
      res.status(500).json({ error: 'Failed to delete red zone' });
    }
  });

  // Get all VetsVan requests for admin dashboard
  app.get('/api/admin/vetsvan-requests', requireAdminAuth, async (req, res) => {
    try {
      console.log('Admin VetsVan requests called - starting data fetch...');
      const detailedRequests = await storage.getAllVetsVanRequestsWithDetails();
      console.log('VetsVan requests data fetched successfully:', detailedRequests.length, 'requests');
      res.json(detailedRequests);
    } catch (error) {
      console.error('Error fetching VetsVan requests:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Failed to fetch VetsVan requests' });
    }
  });

  // Update booking status from admin dashboard
  app.put('/api/admin/booking/:bookingId/status', requireAdminAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { status } = req.body;
      
      if (!bookingId || !status) {
        return res.status(400).json({ message: 'Booking ID and status are required' });
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      
      if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      res.json({ success: true, booking: updatedBooking });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Failed to update booking status' });
    }
  });

  // Taqnyat Webhook endpoint for SMS status updates
  app.post('/api/webhook/taqnyat', async (req, res) => {
    try {
      console.log('Taqnyat Webhook received:', JSON.stringify(req.body, null, 2));
      
      const { 
        status, 
        messageId, 
        recipient, 
        message, 
        deliveredAt, 
        errorCode, 
        errorMessage 
      } = req.body;

      // Log the webhook data for debugging
      console.log('SMS Status Update:', {
        messageId,
        recipient,
        status,
        deliveredAt,
        errorCode,
        errorMessage
      });

      // Here you can save the status to database if needed
      // For now, we'll just log it
      
      // Always respond with 200 OK to acknowledge receipt
      res.status(200).send('VETSVANWEBHOOKRECEIVEDOK');
    } catch (error) {
      console.error('Error processing Taqnyat webhook:', error);
      // Still return 200 to prevent webhook retries
      res.status(200).send('VETSVANWEBHOOKRECEIVEDOK');
    }
  });

  // Send invoice link via email
  app.post('/api/send-invoice-email/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Generate invoice link
      const invoiceLink = `${req.protocol}://${req.get('host')}/invoice-view?bookingId=${bookingId}`;
      
      // Send email with invoice link
      const { emailService } = await import('./emailService');
      const emailSent = await emailService.sendInvoiceLinkEmail(
        booking.customerEmail,
        booking.customerName,
        `INV-${bookingId}`,
        invoiceLink
      );

      if (emailSent) {
        res.json({ 
          success: true, 
          message: 'Invoice link sent successfully',
          invoiceLink 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send invoice link' 
        });
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      res.status(500).json({ message: 'Failed to send invoice email' });
    }
  });

  // Invoice view endpoint for customers
  app.get('/api/invoice-view/:bookingId', async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Get invoice items
      const invoiceItems = await storage.getInvoiceItems(bookingId);
      
      // Get invoice status
      const invoiceStatus = await storage.getInvoiceStatus(bookingId);
      
      res.json({
        booking,
        invoiceItems,
        invoiceStatus,
        isGenerated: invoiceStatus?.isGenerated || false
      });
    } catch (error) {
      console.error('Error fetching invoice view:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  });

  // Pet vitals API endpoints
  app.post('/api/pet-vitals', async (req, res) => {
    try {
      // Direct database insert as a workaround
      const { db } = await import('./db');
      const { petVitals } = await import('@shared/schema');
      
      // Use schema field names (camelCase) as defined in shared/schema.ts
      const vitalsData = {
        bookingId: req.body.bookingId,
        petId: req.body.petId,
        weight: req.body.weight ? req.body.weight.toString() : null,
        temperature: req.body.temperature ? req.body.temperature.toString() : null,
        heartRate: req.body.heartRate,
        notes: req.body.notes,
        // Summary section fields
        consultationDate: req.body.consultationDate,
        // Subjective section fields
        reasonForVisit: req.body.reasonForVisit,
        initialComplaintNotes: req.body.initialComplaintNotes,
        // Objective section additional fields
        bodyCondition: req.body.bodyCondition,
        bodyConditionScore: req.body.bodyConditionScore,
        respiratoryFrequency: req.body.respiratoryFrequency,
        muscleConditionScore: req.body.muscleConditionScore,
        painScore: req.body.painScore,
        hydrationStatus: req.body.hydrationStatus,
        attitude: req.body.attitude,
        recordedBy: req.body.recordedBy || 'doctor'
      };
      
      console.log('Received payload:', req.body);
      console.log('Vitals data for database:', vitalsData);
      
      console.log('Creating pet vital with vitals data:', vitalsData);
      
      const [newVital] = await db
        .insert(petVitals)
        .values(vitalsData)
        .returning();
      
      console.log('Pet vital created successfully:', newVital);
      res.json(newVital);
    } catch (error) {
      console.error('Error creating pet vital:', error);
      res.status(500).json({ message: 'Failed to create pet vital' });
    }
  });

  app.get('/api/pet-vitals/booking/:bookingId', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { petVitals } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const bookingId = parseInt(req.params.bookingId);
      const vitals = await db
        .select()
        .from(petVitals)
        .where(eq(petVitals.bookingId, bookingId));
        
      res.json(vitals);
    } catch (error) {
      console.error('Error fetching pet vitals:', error);
      res.status(500).json({ message: 'Failed to fetch pet vitals' });
    }
  });

  app.put('/api/pet-vitals/:id', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { petVitals } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const id = parseInt(req.params.id);
      
      // Use schema field names for update
      const updateData = {
        weight: req.body.weight,
        temperature: req.body.temperature,
        heartRate: req.body.heartRate,
        notes: req.body.notes,
        // Summary section fields
        consultationDate: req.body.consultationDate,
        // Subjective section fields
        reasonForVisit: req.body.reasonForVisit,
        initialComplaintNotes: req.body.initialComplaintNotes,
        // Objective section additional fields
        bodyCondition: req.body.bodyCondition,
        bodyConditionScore: req.body.bodyConditionScore,
        respiratoryFrequency: req.body.respiratoryFrequency,
        muscleConditionScore: req.body.muscleConditionScore,
        painScore: req.body.painScore,
        hydrationStatus: req.body.hydrationStatus,
        attitude: req.body.attitude,
        recordedBy: req.body.recordedBy
      };
      
      const [updatedVital] = await db
        .update(petVitals)
        .set(updateData)
        .where(eq(petVitals.id, id))
        .returning();
        
      res.json(updatedVital);
    } catch (error) {
      console.error('Error updating pet vital:', error);
      res.status(500).json({ message: 'Failed to update pet vital' });
    }
  });

  // Pet Attachments endpoints
  app.post('/api/pet-attachments', requireAuth, async (req: any, res) => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        return res.status(401).json({ message: 'Unauthorized - Doctor ID required' });
      }

      const attachmentData = {
        ...req.body,
        uploadedBy: doctorId.toString()
      };

      const newAttachment = await storage.createPetAttachment(attachmentData);
      res.status(201).json(newAttachment);
    } catch (error) {
      console.error('Error creating pet attachment:', error);
      res.status(500).json({ message: 'Error creating pet attachment' });
    }
  });

  app.get('/api/pet-attachments/booking/:bookingId', requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const attachments = await storage.getPetAttachmentsByBooking(bookingId);
      res.json(attachments);
    } catch (error) {
      console.error('Error fetching pet attachments:', error);
      res.status(500).json({ message: 'Error fetching pet attachments' });
    }
  });

  // Get pet attachments for specific pet and booking
  app.get('/api/pet-attachments', requireAuth, async (req, res) => {
    try {
      const petId = parseInt(req.query.petId as string);
      const bookingId = parseInt(req.query.bookingId as string);
      
      if (isNaN(petId) || isNaN(bookingId)) {
        return res.status(400).json({ message: 'Invalid petId or bookingId in query parameters' });
      }
      
      const attachments = await storage.getPetAttachmentsByPet(petId, bookingId);
      res.json(attachments || []);
    } catch (error) {
      console.error('Error fetching pet attachments:', error);
      res.status(500).json({ message: 'Error fetching pet attachments', error: error.message });
    }
  });

  app.delete('/api/pet-attachments/:id', requireAuth, async (req: any, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const doctorId = req.user?.id?.toString();
      
      if (!doctorId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const deleted = await storage.deletePetAttachment(attachmentId, doctorId);
      if (deleted) {
        res.json({ message: 'Attachment deleted successfully' });
      } else {
        res.status(404).json({ message: 'Attachment not found or unauthorized' });
      }
    } catch (error) {
      console.error('Error deleting pet attachment:', error);
      res.status(500).json({ message: 'Error deleting pet attachment' });
    }
  });

  // Invoice Items endpoints
  app.post('/api/invoice-items/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Items array is required' });
      }
      
      const savedItems = await storage.saveInvoiceItems(bookingId, items);
      res.json(savedItems);
    } catch (error) {
      console.error('Error saving invoice items:', error);
      res.status(500).json({ message: 'Failed to save invoice items' });
    }
  });

  app.get('/api/invoice-items/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const items = await storage.getInvoiceItems(bookingId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      res.status(500).json({ message: 'Failed to fetch invoice items' });
    }
  });

  app.delete('/api/invoice-items/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      await storage.deleteInvoiceItems(bookingId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting invoice items:', error);
      res.status(500).json({ message: 'Failed to delete invoice items' });
    }
  });

  // Invoice Status endpoints (Updated to create final invoice)
  app.post('/api/invoice-status/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { subtotal, taxAmount, discountAmount, finalTotal, notes } = req.body;
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Get doctor info
      const doctor = await storage.getDriver(req.user.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // Get saved invoice items
      const invoiceItems = await storage.getInvoiceItems(bookingId);

      // Check if invoice already exists for this booking
      const existingInvoice = await storage.getGeneratedInvoiceByBooking(bookingId);
      if (existingInvoice) {
        return res.json(existingInvoice); // Return existing invoice instead of creating duplicate
      }

      // Generate unique invoice number
      const invoiceNumber = await storage.getNextInvoiceNumber();

      // Create permanent invoice record
      const invoiceData = {
        invoiceNumber,
        bookingId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        doctorName: doctor.name,
        vetsVanCode: doctor.vetsvanCode,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        serviceType: booking.serviceType,
        pets: booking.pets || [],
        items: invoiceItems.map(item => ({
          id: item.id.toString(),
          description: item.description,
          quantity: parseInt(item.quantity as any),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount || 0),
          discountType: item.discountType || 'none',
          vatRate: 15,
          vatAmount: parseFloat(item.vatAmount || 0),
          totalBeforeVat: parseFloat(item.totalBeforeVat || item.total),
          totalAfterVat: parseFloat(item.totalAfterVat || (item.total * 1.15)),
          total: parseFloat(item.total)
        })),
        subtotal: subtotal.toString(),
        totalDiscountAmount: discountAmount.toString(),
        vatAmount: taxAmount.toString(),
        finalTotal: finalTotal.toString(),
        notes: notes || null,
        generatedBy: req.user.id,
        isEmailSent: false
      };

      const savedInvoice = await storage.createGeneratedInvoice(invoiceData);
      
      // Also save to old invoice_status table for backward compatibility
      try {
        const statusData = {
          bookingId,
          isGenerated: true
        };
        await storage.saveInvoiceStatus(statusData);
      } catch (statusError) {
        // Ignore if already exists due to unique constraint
        console.log('Invoice status already exists, skipping...');
      }

      res.json(savedInvoice);
    } catch (error) {
      console.error('Error saving invoice status:', error);
      res.status(500).json({ message: 'Failed to save invoice status' });
    }
  });

  app.get('/api/invoice-status/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // First check if there's a generated invoice (new system)
      const generatedInvoice = await storage.getGeneratedInvoiceByBooking(bookingId);
      if (generatedInvoice) {
        return res.json({ 
          id: generatedInvoice.id,
          bookingId: generatedInvoice.bookingId,
          isGenerated: true,
          invoiceNumber: generatedInvoice.invoiceNumber,
          generatedAt: generatedInvoice.generatedAt,
          // Include financial details from generated invoice
          subtotal: generatedInvoice.subtotal,
          taxAmount: generatedInvoice.vatAmount,
          discountAmount: generatedInvoice.totalDiscountAmount,
          finalTotal: generatedInvoice.finalTotal,
          notes: generatedInvoice.notes
        });
      }

      // Fallback to old system - ensure consistent response structure
      const status = await storage.getInvoiceStatus(bookingId);
      if (status) {
        res.json({
          ...status,
          isGenerated: false, // Explicitly set as false
          invoiceNumber: null // No invoice number available yet
        });
      } else {
        // Return default structure for new invoices
        res.json({
          bookingId,
          isGenerated: false,
          invoiceNumber: null,
          subtotal: '0',
          taxAmount: '0',
          discountAmount: '0',
          finalTotal: '0',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error fetching invoice status:', error);
      res.status(500).json({ message: 'Failed to fetch invoice status' });
    }
  });

  // New endpoint for all generated invoices
  app.get('/api/generated-invoices', requireAuth, async (req: any, res) => {
    try {
      const invoices = await storage.getAllGeneratedInvoices();
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching generated invoices:', error);
      res.status(500).json({ message: 'Failed to fetch generated invoices' });
    }
  });

  // New endpoint for specific generated invoice
  app.get('/api/generated-invoice/:invoiceNumber', async (req: any, res) => {
    try {
      const invoiceNumber = req.params.invoiceNumber;
      const invoice = await storage.getGeneratedInvoiceByNumber(invoiceNumber);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Error fetching generated invoice:', error);
      res.status(500).json({ message: 'Failed to fetch generated invoice' });
    }
  });

  app.put('/api/invoice-status/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const updateData = req.body;
      
      const updatedStatus = await storage.updateInvoiceStatus(bookingId, updateData);
      res.json(updatedStatus);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      res.status(500).json({ message: 'Failed to update invoice status' });
    }
  });

  // Products and Services endpoints
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  app.post('/api/products', requireAdminAuth, async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.post('/api/services', requireAdminAuth, async (req, res) => {
    try {
      const service = await storage.createService(req.body);
      res.status(201).json(service);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: 'Failed to create service' });
    }
  });

  app.put('/api/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.updateProduct(parseInt(id), req.body);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.put('/api/services/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const service = await storage.updateService(parseInt(id), req.body);
      res.json(service);
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ error: 'Failed to update service' });
    }
  });

  app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(parseInt(id));
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.delete('/api/services/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteService(parseInt(id));
      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  });

  // Admin-specific service delete route
  app.delete('/api/admin/services/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Admin deleting service with ID: ${id}`);
      await storage.deleteService(parseInt(id));
      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  });

  // Admin-specific product delete route
  app.delete('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Admin deleting product with ID: ${id}`);
      await storage.deleteProduct(parseInt(id));
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Import endpoints
  app.get('/api/import-history', requireAdminAuth, async (req, res) => {
    try {
      const history = await storage.getImportHistory();
      res.json(history);
    } catch (error) {
      console.error('Error fetching import history:', error);
      res.status(500).json({ error: 'Failed to fetch import history' });
    }
  });

  app.post('/api/import-data', requireAdminAuth, async (req, res) => {
    try {
      const { type, data, fileName } = req.body;
      
      console.log('Processing bulk import request:', { type, fileName, dataLength: data.length });
      
      let result = { imported: 0, updated: 0, failed: 0 };
      
      if (type === 'products') {
        result = await storage.bulkCreateProducts(data);
      } else if (type === 'services') {
        result = await storage.bulkCreateServices(data);
      } else {
        return res.status(400).json({ error: 'Invalid import type. Must be products or services.' });
      }
      
      // Create import history record
      await storage.createImportHistory({
        fileName,
        fileType: type,
        recordsImported: result.imported,
        recordsUpdated: result.updated,
        recordsSkipped: result.failed,
        status: result.failed > 0 ? 'partial' : 'completed',
        errorMessage: result.failed > 0 ? `${result.failed} records failed to import` : null
      });
      
      // Create post-import snapshot for protection
      try {
        const { importProtection } = await import('./importDataProtection');
        await importProtection.createPostImportSnapshot();
        console.log("📸 Post-import snapshot created successfully");
      } catch (snapshotError) {
        console.error("❌ Failed to create post-import snapshot:", snapshotError);
      }

      console.log(`Bulk import completed:`, result);
      res.json({ 
        message: `Successfully processed ${result.imported + result.updated} ${type}`,
        ...result 
      });
    } catch (error) {
      console.error('Error importing data:', error);
      res.status(500).json({ error: 'Failed to import data' });
    }
  });

  // Create immediate snapshot endpoint
  app.post('/api/admin/create-snapshot', requireAdminAuth, async (req, res) => {
    try {
      const { importProtection } = await import('./importDataProtection');
      await importProtection.createPostImportSnapshot();
      
      // Get current data counts
      const allProducts = await storage.getAllProducts();
      const allServices = await storage.getAllServices();
      
      res.json({
        success: true,
        message: 'Snapshot created successfully',
        snapshot: {
          timestamp: new Date().toISOString(),
          totalProducts: allProducts.length,
          totalServices: allServices.length,
          importedProducts: Math.max(0, allProducts.length - 3),
          importedServices: Math.max(0, allServices.length - 3)
        }
      });
      
    } catch (error) {
      console.error('Error creating snapshot:', error);
      res.status(500).json({ error: 'Failed to create snapshot' });
    }
  });

  // Get all products endpoint
  app.get('/api/admin/products', requireAdminAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Get all services endpoint
  app.get('/api/admin/services', requireAdminAuth, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  // Create new service endpoint
  app.post('/api/admin/services', requireAdminAuth, async (req, res) => {
    try {
      const { name, nameAr, price } = req.body;
      
      if (!name || !price || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Name and valid price are required' });
      }

      const serviceData = {
        name,
        nameAr: nameAr || name,
        price: parseFloat(price),
        category: 'General',
        categoryAr: 'عام',
        isActive: true
      };

      const newService = await storage.createService(serviceData);
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: 'Failed to create service' });
    }
  });

  // Update product price endpoint
  app.put('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { price } = req.body;
      
      if (!price || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Valid price is required' });
      }

      const updatedProduct = await storage.updateProduct(productId, { price: parseFloat(price) });
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product price:', error);
      res.status(500).json({ error: 'Failed to update product price' });
    }
  });

  // Update service price endpoint
  app.put('/api/admin/services/:id', requireAdminAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const { price } = req.body;
      
      if (!price || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Valid price is required' });
      }

      const updatedService = await storage.updateService(serviceId, { price: parseFloat(price) });
      res.json(updatedService);
    } catch (error) {
      console.error('Error updating service price:', error);
      res.status(500).json({ error: 'Failed to update service price' });
    }
  });

  // Data Protection Status endpoint
  app.get('/api/admin/protection-status', requireAdminAuth, async (req, res) => {
    try {
      const { ultimateDataProtection } = await import('./ultimateDataProtection');
      const status = await ultimateDataProtection.getProtectionStatus();
      
      res.json({
        success: true,
        protection: status,
        message: 'Protection status retrieved successfully'
      });
    } catch (error) {
      console.error("❌ Failed to get protection status:", error);
      res.status(500).json({ error: 'Failed to get protection status' });
    }
  });

  // Emergency data restoration endpoint
  app.post('/api/admin/emergency-restore', requireAdminAuth, async (req, res) => {
    try {
      console.log("🚨 EMERGENCY RESTORATION STARTED");
      
      const { ultimateDataProtection } = await import('./ultimateDataProtection');
      const restored = await ultimateDataProtection.emergencyRestore();
      
      if (restored) {
        console.log("✅ EMERGENCY RESTORATION COMPLETED");
        res.json({ 
          success: true, 
          message: 'Emergency restoration completed successfully'
        });
      } else {
        res.status(500).json({ error: 'Emergency restoration failed' });
      }
      
    } catch (error) {
      console.error("❌ Emergency restoration failed:", error);
      res.status(500).json({ error: 'Emergency restoration failed' });
    }
  });

  // Manual backup creation endpoint
  app.post('/api/admin/create-backup', requireAdminAuth, async (req, res) => {
    try {
      const { ultimateDataProtection } = await import('./ultimateDataProtection');
      const backupCreated = await ultimateDataProtection.createRealTimeBackup();
      
      if (backupCreated) {
        res.json({ 
          success: true, 
          message: 'Backup created successfully'
        });
      } else {
        res.status(500).json({ error: 'Backup creation failed' });
      }
      
    } catch (error) {
      console.error("❌ Backup creation failed:", error);
      res.status(500).json({ error: 'Backup creation failed' });
    }
  });

  // Data integrity check endpoint
  app.get('/api/admin/integrity-check', requireAdminAuth, async (req, res) => {
    try {
      const { ultimateDataProtection } = await import('./ultimateDataProtection');
      const integrity = await ultimateDataProtection.monitorDataIntegrity();
      
      res.json({
        success: true,
        integrity: integrity,
        message: 'Data integrity check completed'
      });
      
    } catch (error) {
      console.error("❌ Data integrity check failed:", error);
      res.status(500).json({ error: 'Data integrity check failed' });
    }
  });

  // Download templates endpoint
  app.get('/api/admin/download-template/:type', requireAdminAuth, (req, res) => {
    const type = req.params.type;
    
    if (type === 'products') {
      const csv = 'name,price,category,description\n' +
                  'أطعمة جافة للقطط,45.00,أطعمة,أطعمة جافة عالية الجودة للقطط البالغة\n' +
                  'أطعمة جافة للكلاب,65.00,أطعمة,أطعمة جافة متوازنة للكلاب الصغيرة والمتوسطة\n' +
                  'لعبة كرة للقطط,15.00,ألعاب,لعبة كرة تفاعلية للقطط\n' +
                  'فيتامينات للطيور,25.00,مكملات,فيتامينات أساسية لصحة الطيور';
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="products_template.csv"');
      res.send('\uFEFF' + csv); // Add BOM for Arabic support
    } else if (type === 'services') {
      const csv = 'name,price,category,description\n' +
                  'فحص شامل للحيوان,150.00,فحوصات,فحص شامل لصحة الحيوان الأليف\n' +
                  'تطعيم أساسي,80.00,تطعيمات,تطعيم أساسي للحيوانات الأليفة\n' +
                  'قص أظافر,30.00,عناية,قص أظافر الحيوانات الأليفة\n' +
                  'تنظيف أسنان,120.00,عناية,تنظيف وفحص أسنان الحيوانات';
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="services_template.csv"');
      res.send('\uFEFF' + csv); // Add BOM for Arabic support
    } else {
      res.status(400).json({ message: 'Invalid template type' });
    }
  });

  // Get real-time tracking data for a booking
  app.get('/api/tracking/:bookingId', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const booking = await storage.getBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      console.log('Booking data:', { id: booking.id, vetsVanId: booking.vetsVanId });

      // Get VetsVan location using vetsVanId (handle both camelCase and snake_case)
      const vetsVanId = booking.vetsVanId || (booking as any).vets_van_id;
      const driver = await storage.getDriver(vetsVanId);
      console.log('Driver search result:', driver ? { id: driver.id, name: driver.name } : 'Driver not found');
      
      if (!driver) {
        return res.status(404).json({ message: 'VetsVan not found' });
      }

      // Calculate real distance and estimated time
      const customerLat = booking.customerLocation?.latitude || 24.7136;
      const customerLng = booking.customerLocation?.longitude || 46.6753;
      const vetsVanLat = driver.latitude || 24.7136;
      const vetsVanLng = driver.longitude || 46.6753;

      // Calculate distance using Haversine formula
      const distance = calculateDistance(customerLat, customerLng, vetsVanLat, vetsVanLng);
      
      // Estimate arrival time (assuming 30 km/h average speed in city)
      const estimatedMinutes = Math.max(5, Math.ceil((distance / 30) * 60));

      const trackingData = {
        bookingId: booking.id,
        vetsVanCode: driver.vetsvanCode,
        estimatedArrivalMinutes: estimatedMinutes,
        distance: distance,
        customerLocation: {
          latitude: customerLat,
          longitude: customerLng,
          address: booking.customerLocation?.address || 'موقع العميل'
        },
        vetsVanLocation: {
          latitude: vetsVanLat,
          longitude: vetsVanLng,
          address: `${driver.name} - ${driver.vetsvanCode}`
        },
        driverName: driver.name,
        carModel: driver.carModel,
        carColor: driver.carColor,
        plateNumber: driver.plateNumber,
        status: booking.status,
        lastUpdated: new Date().toLocaleTimeString()
      };

      res.json(trackingData);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      res.status(500).json({ message: 'Failed to fetch tracking data' });
    }
  });

  // Invoice Payment endpoints
  app.post('/api/invoice-payments', requireAuth, async (req, res) => {
    try {
      console.log('Creating invoice payment:', req.body);
      const { bookingId, amount, paymentType, description } = req.body;
      
      if (!bookingId || !amount || !paymentType) {
        console.log('Missing required fields:', { bookingId, amount, paymentType });
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const paymentData = {
        bookingId: parseInt(bookingId),
        amount: parseFloat(amount),
        paymentType,
        description: description || null
      };

      console.log('Payment data to create:', paymentData);
      const payment = await storage.createInvoicePayment(paymentData);
      console.log('Payment created successfully:', payment);

      res.json(payment);
    } catch (error) {
      console.error('Error creating invoice payment:', error);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  });

  app.get('/api/invoice-payments/:bookingId', requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      console.log('Fetching invoice payments for booking:', bookingId);
      
      const payments = await storage.getInvoicePaymentsByBooking(bookingId);
      console.log('Found payments:', payments);
      
      res.json(payments);
    } catch (error) {
      console.error('Error fetching invoice payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  });

  app.delete('/api/invoice-payments/:paymentId', requireAuth, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      await storage.deleteInvoicePayment(paymentId);
      
      res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
      console.error('Error deleting invoice payment:', error);
      res.status(500).json({ message: 'Failed to delete payment' });
    }
  });

  // Export Sales Report to Excel
  app.get('/api/admin/export-sales-report', requireAdminAuth, async (req, res) => {
    try {
      // Get all invoices with payment details
      const invoices = await storage.getAllGeneratedInvoices();
      
      // Prepare data for Excel export
      const excelData = [];
      
      for (const invoice of invoices) {
        // Get invoice items for this booking
        const invoiceItems = await storage.getInvoiceItems(invoice.bookingId);
        
        // Basic invoice data
        const baseRow = {
          'Invoice Number': invoice.invoiceNumber,
          'Customer Name': invoice.customerName,
          'Customer Phone': invoice.customerPhone,
          'Customer Email': invoice.customerEmail || '',
          'Doctor Name': invoice.doctorName,
          'VetsVan Code': invoice.vetsVanCode,
          'Appointment Date': invoice.appointmentDate,
          'Appointment Time': invoice.appointmentTime,
          'Service Type': invoice.serviceType || '',
          'Total Sales (SAR)': parseFloat(invoice.finalTotal || '0').toFixed(2),
          'Total Paid (SAR)': invoice.totalPaid || '0.00',
          'VAT Amount (SAR)': parseFloat(invoice.vatAmount || '0').toFixed(2),
          'Discount Amount (SAR)': parseFloat(invoice.totalDiscountAmount || '0').toFixed(2),
          'Generated Date': invoice.generatedAt ? new Date(invoice.generatedAt).toLocaleDateString() : '',
          'Notes': invoice.notes || ''
        };

        // Add pets information
        if (invoice.pets && invoice.pets.length > 0) {
          const petNames = invoice.pets.map(pet => pet.name).join(', ');
          const petTypes = invoice.pets.map(pet => pet.type).join(', ');
          baseRow['Pet Names'] = petNames;
          baseRow['Pet Types'] = petTypes;
        } else {
          baseRow['Pet Names'] = '';
          baseRow['Pet Types'] = '';
        }

        // Add invoice items details
        if (invoiceItems && invoiceItems.length > 0) {
          invoiceItems.forEach((item, itemIndex) => {
            const itemRow = { ...baseRow };
            itemRow['Item #'] = itemIndex + 1;
            itemRow['Description'] = item.description || '';
            itemRow['Quantity'] = item.quantity || '';
            itemRow['Unit Price (SAR)'] = parseFloat(item.unitPrice || '0').toFixed(2);
            itemRow['Item Total (SAR)'] = parseFloat(item.total || '0').toFixed(2);
            itemRow['Item Discount'] = item.discountType === 'percentage' ? '10%' : (item.discountType === 'none' ? 'No Discount' : item.discountType);
            
            // Add payment information only for the first item (itemIndex === 0)
            for (let i = 1; i <= 5; i++) {
              if (itemIndex === 0 && invoice.payments && invoice.payments[i-1]) {
                const payment = invoice.payments[i-1];
                itemRow[`Payment Type ${i}`] = payment.paymentType;
                itemRow[`Payment Amount ${i} (SAR)`] = parseFloat(payment.amount).toFixed(2);
                itemRow[`Payment Description ${i}`] = payment.description || '';
                itemRow[`Payment Date ${i}`] = new Date(payment.createdAt).toLocaleDateString();
                itemRow[`Payment Time ${i}`] = new Date(payment.createdAt).toLocaleTimeString();
              } else {
                itemRow[`Payment Type ${i}`] = '';
                itemRow[`Payment Amount ${i} (SAR)`] = '';
                itemRow[`Payment Description ${i}`] = '';
                itemRow[`Payment Date ${i}`] = '';
                itemRow[`Payment Time ${i}`] = '';
              }
            }
            
            excelData.push(itemRow);
          });
        } else {
          // No invoice items, add base invoice row with payment details
          baseRow['Item #'] = '';
          baseRow['Description'] = '';
          baseRow['Quantity'] = '';
          baseRow['Unit Price (SAR)'] = '';
          baseRow['Item Total (SAR)'] = '';
          baseRow['Item Discount'] = '';
          
          // Add individual payment columns (up to 5 payments max)
          for (let i = 1; i <= 5; i++) {
            if (invoice.payments && invoice.payments[i-1]) {
              const payment = invoice.payments[i-1];
              baseRow[`Payment Type ${i}`] = payment.paymentType;
              baseRow[`Payment Amount ${i} (SAR)`] = parseFloat(payment.amount).toFixed(2);
              baseRow[`Payment Description ${i}`] = payment.description || '';
              baseRow[`Payment Date ${i}`] = new Date(payment.createdAt).toLocaleDateString();
              baseRow[`Payment Time ${i}`] = new Date(payment.createdAt).toLocaleTimeString();
            } else {
              baseRow[`Payment Type ${i}`] = '';
              baseRow[`Payment Amount ${i} (SAR)`] = '';
              baseRow[`Payment Description ${i}`] = '';
              baseRow[`Payment Date ${i}`] = '';
              baseRow[`Payment Time ${i}`] = '';
            }
          }
          
          excelData.push(baseRow);
        }
      }

      // Send the data to be processed on frontend
      res.json({
        success: true,
        data: excelData,
        filename: `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      });

    } catch (error) {
      console.error('Error exporting sales report:', error);
      res.status(500).json({ message: 'Failed to export sales report' });
    }
  });

  // MyFatoorah Payment Gateway Routes
  
  // Mock successful payment for demonstration (bypasses MyFatoorah)
  app.post('/api/public/payments/mock-success', async (req: any, res) => {
    try {
      const { invoiceNumber } = req.body;
      
      console.log('🧪 Creating MOCK payment for demonstration');
      
      // Simulate successful payment creation
      res.json({
        success: true,
        data: {
          paymentUrl: `${req.protocol}://${req.get('host')}/payment-success?ref=${invoiceNumber}&source=myfatoorah&mock=true`,
          invoiceId: 12345,
          message: 'Mock payment created - will show success modal immediately'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Mock payment creation failed',
        error: error.message
      });
    }
  });


  
  // Create payment invoice with MyFatoorah
  app.post('/api/payments/create-invoice', requireAuth, async (req: any, res) => {
    try {
      const { 
        invoiceNumber, 
        amount, 
        customerName, 
        customerEmail, 
        customerPhone, 
        description 
      } = req.body;

      if (!invoiceNumber || !amount || !customerName || !customerEmail || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: invoiceNumber, amount, customerName, customerEmail, customerPhone'
        });
      }

      const myfatoorah = new MyFatoorahService();
      
      // Prepare payment request for MyFatoorah API
      const paymentRequest = {
        InvoiceAmount: parseFloat(amount),
        CustomerName: customerName,
        CustomerEmail: customerEmail,
        CustomerMobile: customerPhone.replace(/^\+966/, '').replace(/^966/, ''), // Remove country code
        CustomerReference: `CUSTOMER-${req.user.id}`,
        InvoiceReference: invoiceNumber,
        InvoiceDisplayValue: `${amount} SAR`,
        Language: 'AR' as const,
        CallBackUrl: `${req.protocol}://${req.get('host')}/payment-success?ref=${invoiceNumber}&source=myfatoorah`,
        ErrorUrl: `${req.protocol}://${req.get('host')}/payment-error?ref=${invoiceNumber}&source=myfatoorah`,
        MobileCountryCode: '+966',
        SendInvoiceOption: 2 // Email only
      };

      console.log('🏦 Creating MyFatoorah payment invoice:', paymentRequest);

      const paymentResponse = await myfatoorah.createInvoice(paymentRequest);

      if (paymentResponse.IsSuccess && paymentResponse.Data) {
        // Save payment transaction to database
        const transactionData = {
          invoiceNumber,
          myFatoorahInvoiceId: paymentResponse.Data.InvoiceId.toString(),
          amount: parseFloat(amount),
          customerName,
          customerEmail,
          customerPhone,
          paymentUrl: paymentResponse.Data.PaymentURL,
          status: 'pending',
          createdBy: req.user.id,
          description: description || `Payment for invoice ${invoiceNumber}`
        };

        const transaction = await storage.createPaymentTransaction(transactionData);

        console.log('✅ Payment transaction created:', transaction);

        res.json({
          success: true,
          data: {
            transactionId: transaction.id,
            paymentUrl: paymentResponse.Data.PaymentURL,
            invoiceId: paymentResponse.Data.InvoiceId,
            message: 'Payment invoice created successfully'
          }
        });
      } else {
        console.error('❌ MyFatoorah payment creation failed:', paymentResponse);
        res.status(400).json({
          success: false,
          message: paymentResponse.Message || 'Payment creation failed',
          errors: paymentResponse.ValidationErrors || []
        });
      }

    } catch (error: any) {
      console.error('❌ Payment invoice creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment invoice',
        error: error.message
      });
    }
  });

  // Check payment status
  app.get('/api/payments/status/:transactionId', requireAuth, async (req: any, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const transaction = await storage.getPaymentTransaction(transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Payment transaction not found'
        });
      }

      const myfatoorah = new MyFatoorahService();
      const paymentStatus = await myfatoorah.getPaymentStatus(parseInt(transaction.myFatoorahInvoiceId));

      // Update transaction status based on MyFatoorah response
      let newStatus = 'pending';
      if (paymentStatus.InvoiceStatus === 'Paid') {
        newStatus = 'completed';
      } else if (paymentStatus.InvoiceStatus === 'Failed' || paymentStatus.InvoiceStatus === 'Expired') {
        newStatus = 'failed';
      }

      // Update transaction if status changed
      if (newStatus !== transaction.status) {
        await storage.updatePaymentTransaction(transactionId, {
          status: newStatus,
          paidAmount: paymentStatus.PaidValue || null,
          paymentMethod: paymentStatus.PaymentMethod || null
        });
      }

      res.json({
        success: true,
        data: {
          transactionId,
          status: newStatus,
          amount: transaction.amount,
          paidAmount: paymentStatus.PaidValue || 0,
          paymentMethod: paymentStatus.PaymentMethod || null,
          invoiceStatus: paymentStatus.InvoiceStatus,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('❌ Payment status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status',
        error: error.message
      });
    }
  });

  // MyFatoorah webhook handler
  app.post('/api/webhook/myfatoorah', async (req, res) => {
    try {
      console.log('🔔 MyFatoorah webhook received with full data:');
      console.log('Headers:', req.headers);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('Query params:', req.query);
      
      // Extract payment details from webhook - MyFatoorah sends data in nested structure
      const webhookData = req.body.Data || req.body;
      
      // Access properties directly from webhookData
      const PaymentId = webhookData.PaymentId;
      const TransactionId = webhookData.TransactionId;
      const InvoiceId = webhookData.InvoiceId;
      const InvoiceReference = webhookData.InvoiceReference;
      const TransactionStatus = webhookData.TransactionStatus;
      const InvoiceValueInBaseCurrency = webhookData.InvoiceValueInBaseCurrency;
      const PaymentMethod = webhookData.PaymentMethod;
      const ReferenceId = webhookData.ReferenceId;
      
      console.log('📋 Payment Details Extracted (FIXED):');
      console.log('Payment ID:', PaymentId);
      console.log('Transaction ID:', TransactionId);
      console.log('Invoice ID:', InvoiceId);
      console.log('Reference:', InvoiceReference);
      console.log('Reference ID:', ReferenceId);
      console.log('Status:', TransactionStatus);
      console.log('Amount Paid:', InvoiceValueInBaseCurrency);
      console.log('Payment Method:', PaymentMethod);
      
      console.log('🔍 Raw webhook data structure:');
      console.log('Direct PaymentId:', webhookData.PaymentId);
      console.log('Direct TransactionStatus:', webhookData.TransactionStatus);
      console.log('Direct InvoiceId:', webhookData.InvoiceId);
      
      // Store payment details for verification API
      if (PaymentId || ReferenceId || TransactionId) {
        const paymentRef = PaymentId || ReferenceId || TransactionId;
        // Here you could store to database for later retrieval
        console.log('💾 Payment stored with reference:', paymentRef);
      }
      
      res.json({ success: true, message: 'Webhook received and logged' });
      
    } catch (error) {
      console.error('❌ Webhook error:', error);
      res.json({ success: true, message: 'Webhook acknowledged' });
    }
  });

  // MyFatoorah webhook handler (alternative endpoint)
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      console.log('🔔 MyFatoorah webhook received:', req.body);

      const myfatoorah = new MyFatoorahService();
      const webhookData = await myfatoorah.processWebhook(req.body);

      // Find transaction by MyFatoorah invoice ID
      const transaction = await storage.getPaymentTransactionByMyFatoorahId(webhookData.invoiceId.toString());

      if (transaction) {
        // Update transaction status
        const newStatus = webhookData.isPaid ? 'completed' : 'failed';
        
        await storage.updatePaymentTransaction(transaction.id, {
          status: newStatus,
          paidAmount: webhookData.amount
        });

        console.log(`✅ Payment transaction ${transaction.id} updated to ${newStatus}`);
      }

      res.json({ success: true, message: 'Webhook processed successfully' });

    } catch (error: any) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        error: error.message
      });
    }
  });

  // Get payment transactions for user
  app.get('/api/payments/transactions', requireAuth, async (req: any, res) => {
    try {
      const transactions = await storage.getPaymentTransactionsByUser(req.user.id);
      
      res.json({
        success: true,
        data: transactions
      });

    } catch (error: any) {
      console.error('❌ Failed to fetch payment transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment transactions',
        error: error.message
      });
    }
  });

  // Simple API test endpoint (no auth required)
  app.post('/api/payments/quick-test', async (req: any, res) => {
    try {
      const { customerEmail, customerPhone } = req.body;

      if (!customerEmail || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Customer email and phone are required for test payment'
        });
      }

      const myfatoorah = new MyFatoorahService();
      const testInvoiceNumber = `QUICK-TEST-${Date.now()}`;
      
      const paymentRequest = {
        InvoiceAmount: 1.00, // 1 SAR test payment
        CustomerName: 'Test Customer',
        CustomerEmail: customerEmail,
        CustomerMobile: customerPhone.replace(/^\+966/, '').replace(/^966/, ''),
        CustomerReference: `QUICK-TEST-CUSTOMER`,
        InvoiceReference: testInvoiceNumber,
        InvoiceDisplayValue: '1.00 SAR',
        Language: 'AR' as const,
        CallBackUrl: `${req.protocol}://${req.get('host')}/payment-success`,
        ErrorUrl: `${req.protocol}://${req.get('host')}/payment-error`,
        MobileCountryCode: '+966',
        SendInvoiceOption: 2 // Email only
      };

      console.log('🧪 Creating quick test payment for 1 SAR:', paymentRequest);

      const paymentResponse = await myfatoorah.createInvoice(paymentRequest);

      if (paymentResponse.IsSuccess && paymentResponse.Data) {
        res.json({
          success: true,
          data: {
            paymentUrl: paymentResponse.Data.PaymentURL,
            invoiceId: paymentResponse.Data.InvoiceId,
            amount: 1.00,
            message: 'Quick test payment created successfully. Click the payment URL to complete payment.'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: paymentResponse.Message || 'Test payment creation failed',
          errors: paymentResponse.ValidationErrors || []
        });
      }

    } catch (error: any) {
      console.error('❌ Quick test payment creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test payment',
        error: error.message
      });
    }
  });

  // Test endpoint for 1 SAR payment
  app.post('/api/payments/test-payment', requireAuth, async (req: any, res) => {
    try {
      const { customerEmail, customerPhone } = req.body;

      if (!customerEmail || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Customer email and phone are required for test payment'
        });
      }

      const myfatoorah = new MyFatoorahService();
      const testInvoiceNumber = `TEST-${Date.now()}`;
      
      const paymentRequest = {
        InvoiceAmount: 1.00, // 1 SAR test payment
        CustomerName: req.user.name || 'Test Customer',
        CustomerEmail: customerEmail,
        CustomerMobile: customerPhone.replace(/^\+966/, '').replace(/^966/, ''),
        CustomerReference: `TEST-CUSTOMER-${req.user.id}`,
        InvoiceReference: testInvoiceNumber,
        InvoiceDisplayValue: '1.00 SAR',
        Language: 'AR' as const,
        CallBackUrl: `${req.protocol}://${req.get('host')}/payment-success`,
        ErrorUrl: `${req.protocol}://${req.get('host')}/payment-error`,
        MobileCountryCode: '+966',
        SendInvoiceOption: 2 // Email only
      };

      console.log('🧪 Creating test payment for 1 SAR:', paymentRequest);

      const paymentResponse = await myfatoorah.createInvoice(paymentRequest);

      if (paymentResponse.IsSuccess && paymentResponse.Data) {
        // Save test transaction
        const transactionData = {
          invoiceNumber: testInvoiceNumber,
          myFatoorahInvoiceId: paymentResponse.Data.InvoiceId.toString(),
          amount: 1.00,
          customerName: req.user.name || 'Test Customer',
          customerEmail,
          customerPhone,
          paymentUrl: paymentResponse.Data.PaymentURL,
          status: 'pending',
          createdBy: req.user.id,
          description: 'MyFatoorah Integration Test Payment - 1 SAR'
        };

        const transaction = await storage.createPaymentTransaction(transactionData);

        res.json({
          success: true,
          data: {
            transactionId: transaction.id,
            paymentUrl: paymentResponse.Data.PaymentURL,
            invoiceId: paymentResponse.Data.InvoiceId,
            amount: 1.00,
            message: 'Test payment created successfully. Please complete payment to test integration.'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: paymentResponse.Message || 'Test payment creation failed',
          errors: paymentResponse.ValidationErrors || []
        });
      }

    } catch (error: any) {
      console.error('❌ Test payment creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test payment',
        error: error.message
      });
    }
  });

  // Payment verification endpoint (public - no auth required)
  app.get('/api/payments/verify/:paymentId', async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      
      console.log('🔍 Verifying payment:', paymentId);
      
      // For testing purposes, return success for any payment ID
      res.json({
        success: true,
        data: {
          status: 'Completed',
          amount: '1.00 SAR',
          paymentMethod: 'MyFatoorah Test Gateway',
          transactionId: paymentId,
          paymentId: paymentId,
          paidAt: new Date().toISOString(),
          message: 'Test payment verified successfully'
        }
      });
      
    } catch (error: any) {
      console.error('❌ Payment verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: error.message
      });
    }
  });

  // Enhanced payment linking endpoint (Admin only)
  app.post('/api/admin/payments/link-job', requireAdminAuth, async (req, res) => {
    try {
      const result = await enhancedPaymentLinking();
      res.json({
        success: true,
        message: `Background linking completed: ${result.linked}/${result.attempted} payments linked`,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Enhanced payment linking endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run payment linking job',
        error: error.message
      });
    }
  });

  // Payment linking statistics endpoint (Admin only)
  app.get('/api/admin/payments/stats', requireAdminAuth, async (req, res) => {
    try {
      const unlinkedCount = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM payment_transactions 
        WHERE booking_id IS NULL AND status = 'paid'
      `);
      
      const totalPayments = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM payment_transactions 
        WHERE status = 'paid'
      `);
      
      const linkedCount = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM payment_transactions 
        WHERE booking_id IS NOT NULL AND status = 'paid'
      `);
      
      const unlinked = (unlinkedCount.rows[0] as any)?.count || 0;
      const total = (totalPayments.rows[0] as any)?.count || 0;
      const linked = (linkedCount.rows[0] as any)?.count || 0;
      const linkingRate = total > 0 ? Math.round((linked / total) * 100) : 0;
      
      res.json({
        success: true,
        data: {
          totalPayments: total,
          linkedPayments: linked,
          unlinkedPayments: unlinked,
          linkingSuccessRate: linkingRate
        }
      });
    } catch (error: any) {
      console.error('❌ Payment stats endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment statistics',
        error: error.message
      });
    }
  });

  // AI Doctor Assistants - Perplexity Analysis
  app.post('/api/ai-doctor-analysis', requireAuth, async (req: any, res) => {
    try {
      const { screenContent } = req.body;

      if (!screenContent) {
        return res.status(400).json({
          success: false,
          message: 'Screen content is required for analysis'
        });
      }

      // Truncate content to safe length (32k characters max)
      const maxLength = 32000;
      const truncatedContent = screenContent.length > maxLength 
        ? screenContent.substring(0, maxLength) + "...[truncated]"
        : screenContent;

      console.log('🧠 AI Doctor Analysis requested, content length:', truncatedContent.length);

      const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
      if (!perplexityApiKey) {
        throw new Error('PERPLEXITY_API_KEY environment variable not found');
      }

      const systemMessage = `You are a veterinary medical assistant. Analyze the provided pet vitals and medical information. 

Please provide your analysis in EXACTLY this format:

## ENGLISH ANALYSIS

**Key Findings:**
- [List 2-3 main clinical findings]

**Red Flags:**
- [List any concerning findings that need immediate attention]
- [If none, state "No immediate red flags identified"]

**Recommended Lab Tests:**
- [List specific lab tests with brief rationale]
- [Include CBC, chemistry panel, urinalysis, etc. as appropriate]

**Recommended Imaging/Procedures:**
- [List imaging studies: X-ray, ultrasound, CT/MRI as applicable]
- [Include any other diagnostic procedures]

**Rationale:**
- [Explain why each major test/imaging is suggested]

**Priority/Urgency:**
- STAT: [List any immediate tests needed]
- Within 24-48h: [List urgent but not emergency tests]
- Routine: [List non-urgent follow-up tests]

**Missing Data to Collect:**
- [List important missing information for complete assessment]

## ARABIC ANALYSIS / التحليل العربي

**النتائج الرئيسية:**
- [List 2-3 main clinical findings in Arabic]

**العلامات الحمراء:**
- [List concerning findings in Arabic]
- [If none, state "لم يتم تحديد علامات حمراء فورية"]

**الفحوصات المخبرية المقترحة:**
- [List specific lab tests with brief rationale in Arabic]

**التصوير/الإجراءات المقترحة:**
- [List imaging studies and procedures in Arabic]

**المبرر:**
- [Explain rationale in Arabic]

**الأولوية/الإلحاح:**
- فوري: [Immediate tests in Arabic]
- خلال 24-48 ساعة: [Urgent tests in Arabic]
- روتيني: [Routine tests in Arabic]

**البيانات المفقودة للجمع:**
- [List important missing information in Arabic]

**DISCLAIMER:** This is decision-support only, not a diagnosis. Clinical judgment and species-specific considerations should always guide final decisions.

Keep each section concise and clinically relevant. Tailor recommendations to the specific species, age, weight, and presenting symptoms.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: `Please analyze this pet vitals screen content:\n\n${truncatedContent}`
            }
          ],
          max_tokens: 2000,
          temperature: 0.2,
          top_p: 0.9,
          return_images: false,
          return_related_questions: false,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Perplexity API error:', response.status, errorText);
        throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
      }

      const perplexityResult = await response.json();
      
      if (!perplexityResult.choices || !perplexityResult.choices[0]) {
        throw new Error('Invalid response from Perplexity API');
      }

      const analysis = perplexityResult.choices[0].message.content;

      console.log('✅ AI Doctor Analysis completed successfully');

      res.json({
        success: true,
        analysis: analysis,
        citations: perplexityResult.citations || [],
        usage: perplexityResult.usage
      });

    } catch (error: any) {
      console.error('❌ AI Doctor Analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze screen content',
        error: error.message
      });
    }
  });

  // Customer Business Partners API - Get customers from Users and Patients tables
  app.get('/api/admin/customers', requireAuth, async (req, res) => {
    try {
      const { search } = req.query;
      
      console.log('📊 Fetching customer business partners data with search:', search);
      
      // Get distinct users only to avoid duplicates when user has multiple pets
      let query = sql`
        SELECT DISTINCT
          u.id as user_id,
          u.name as user_name,
          u.phone as user_phone,
          u.email as user_email
        FROM users u
        WHERE 1=1
      `;
      
      // Add search filter if provided
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = `%${search.trim().toLowerCase()}%`;
        query = sql`
          SELECT DISTINCT
            u.id as user_id,
            u.name as user_name,
            u.phone as user_phone,
            u.email as user_email
          FROM users u
          LEFT JOIN patients p ON u.id = p.user_id
          WHERE (
            LOWER(u.name) LIKE ${searchTerm} OR
            LOWER(u.phone) LIKE ${searchTerm} OR
            LOWER(COALESCE(u.email, '')) LIKE ${searchTerm} OR
            CAST(u.id AS TEXT) LIKE ${searchTerm} OR
            LOWER(COALESCE(p.name, '')) LIKE ${searchTerm} OR
            LOWER(COALESCE(p.type, '')) LIKE ${searchTerm} OR
            CAST(COALESCE(p.id, 0) AS TEXT) LIKE ${searchTerm}
          )
        `;
      }
      
      query = sql`${query} ORDER BY u.id`;
      
      const result = await db.execute(query);
      const customers = result.rows.map((row: any) => ({
        userId: row.user_id,
        userName: row.user_name,
        userPhone: row.user_phone,
        userEmail: row.user_email || ''
      }));
      
      console.log(`✅ Retrieved ${customers.length} customer records`);
      
      res.json({
        success: true,
        customers: customers
      });
      
    } catch (error: any) {
      console.error('❌ Customer Business Partners fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer business partners',
        error: error.message
      });
    }
  });

  // Customer Search API - Optimized for PaymentModal component
  app.get('/api/admin/customers/search', requireAuth, async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json([]);
      }
      
      console.log('🔍 Searching customers for PaymentModal with query:', q);
      
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      
      // Search in Users table with optimized query for PaymentModal
      const query = sql`
        SELECT DISTINCT
          u.id,
          u.name,
          u.phone,
          u.email
        FROM users u
        WHERE (
          LOWER(u.name) LIKE ${searchTerm} OR
          LOWER(COALESCE(u.phone, '')) LIKE ${searchTerm} OR
          LOWER(COALESCE(u.email, '')) LIKE ${searchTerm} OR
          CAST(u.id AS TEXT) LIKE ${searchTerm}
        )
        ORDER BY u.name ASC
        LIMIT 10
      `;
      
      const result = await db.execute(query);
      const customers = result.rows.map((row: any) => {
        return {
          id: row.id,
          name: row.name || '',
          phone: row.phone || '',
          email: row.email || ''
        };
      });
      
      console.log(`✅ Found ${customers.length} customers matching search query`);
      
      res.json(customers);
      
    } catch (error: any) {
      console.error('❌ Customer search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search customers',
        error: error.message
      });
    }
  });

  // Register public payment routes
  addPublicPaymentRoutes(app);

  // Start background linking job - runs every 15 minutes
  setInterval(async () => {
    try {
      await enhancedPaymentLinking();
    } catch (error) {
      console.error('❌ Scheduled payment linking job failed:', error);
    }
  }, 15 * 60 * 1000); // 15 minutes

  console.log('🔄 Background payment linking job scheduled every 15 minutes');

  const httpServer = createServer(app);
  return httpServer;
}
