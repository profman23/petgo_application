// Temporary fix script to correct payment amounts from MyFatoorah
import { MyFatoorahService } from './server/services/myfatoorah.js';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function fixPaymentAmounts() {
  try {
    console.log('🔧 Starting payment amount fix process...');
    
    // Get all payment transactions with incorrect 1 SAR amounts
    const result = await db.execute(sql`
      SELECT id, myfatoorah_payment_id, amount, status, created_at 
      FROM payment_transactions 
      WHERE myfatoorah_payment_id IS NOT NULL 
      AND status = 'paid'
      AND amount = 1.00
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    const transactions = result.rows;
    console.log(`📊 Found ${transactions.length} transactions with 1 SAR amounts to fix`);
    
    const myFatoorahService = new MyFatoorahService();
    let successCount = 0;
    let errorCount = 0;
    
    for (const transaction of transactions) {
      try {
        console.log(`🔍 Processing payment ID: ${transaction.myfatoorah_payment_id}`);
        
        // Fetch actual payment details from MyFatoorah
        const paymentDetails = await myFatoorahService.getPaymentDetailsFromCallback(
          transaction.myfatoorah_payment_id
        );
        
        console.log(`📊 MyFatoorah returned:`, {
          paymentId: transaction.myfatoorah_payment_id,
          currentAmount: transaction.amount,
          actualAmount: paymentDetails.amount,
          status: paymentDetails.status
        });
        
        // Update if we got a different (and valid) amount
        if (paymentDetails.amount > 0 && paymentDetails.amount !== transaction.amount) {
          await db.execute(sql`
            UPDATE payment_transactions 
            SET amount = ${paymentDetails.amount}, 
                currency = ${paymentDetails.currency || 'SAR'},
                updated_at = ${new Date()}
            WHERE id = ${transaction.id}
          `);
          
          console.log(`✅ Updated transaction ${transaction.id}: ${transaction.amount} → ${paymentDetails.amount} SAR`);
          successCount++;
        } else if (paymentDetails.amount === 0) {
          console.log(`⚠️ MyFatoorah returned 0 amount for payment ${transaction.myfatoorah_payment_id}`);
        } else {
          console.log(`⏭️ Skipping transaction ${transaction.id}: amounts match or unavailable`);
        }
        
        // Delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to update transaction ${transaction.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Fix completed: ${successCount} updated, ${errorCount} errors`);
    
    // Show updated results
    const updatedResult = await db.execute(sql`
      SELECT id, myfatoorah_payment_id, amount, currency, status, updated_at
      FROM payment_transactions 
      WHERE myfatoorah_payment_id IS NOT NULL 
      AND status = 'paid'
      ORDER BY updated_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📊 Current payment amounts:');
    updatedResult.rows.forEach(row => {
      console.log(`  - Payment ${row.myfatoorah_payment_id}: ${row.amount} ${row.currency}`);
    });
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
  }
}

// Run the fix
fixPaymentAmounts().then(() => {
  console.log('✅ Fix process completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix process crashed:', error);
  process.exit(1);
});