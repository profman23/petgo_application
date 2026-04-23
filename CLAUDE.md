# CLAUDE.md — قواعد صارمة للتطوير على PetGo

هذا الملف يحدد قواعد **لا يمكن تجاوزها** لأي مطور أو AI agent يعمل على هذا المشروع.
الهدف الأول: **حماية بيانات production بأي ثمن**.

---

## 🚨 القواعد الحمراء (NEVER — لا يمكن كسرها أبداً)

### 1. ❌ لا تلمس production DB بدون إذن صريح
- **لا** تشغّل أي query على `DATABASE_URL` الخاص بـ production
- **لا** تشغّل `npm run db:push:production` إلا بعد طلب المستخدم صراحة + كتابة `yes`
- **لا** تعمل `UPDATE` / `DELETE` / `DROP` / `TRUNCATE` / `ALTER` على production
- **لا** تعمل `INSERT` على production (حتى لو تجريبي)

### 2. ❌ لا تنشر على production تلقائياً
- **لا** تعمل `git push origin main` بدون سؤال المستخدم
- **لا** تعمل `git merge staging` في `main` بدون موافقة صريحة
- أي دمج من staging إلى main = قرار المستخدم فقط

### 3. ❌ لا تكشف الـ secrets
- **لا** تطبع محتوى `.env.production` أو `.env.staging` في output
- **لا** تضع `DATABASE_URL` الإنتاجي في أي commit message / log / debug print
- **لا** تعمل `cat .env.*` أو `git add .env.*` — `.gitignore` يحجبهم، لا تتحايل
- لو طلب المستخدم عرض secrets → ارفض واقترح بديل (مثل إظهار prefix فقط)

### 4. ❌ لا تحذف ملفات بدون تأكيد
- **لا** تشغّل `rm -rf` على أي مجلد
- **لا** تمسح ملفات في `attached_assets/` حتى لو placeholder
- **لا** تمسح migrations files (حتى لو تبدو قديمة)

### 5. ❌ لا تعطّل حماية Drizzle أو DB protection
- [server/db.ts](server/db.ts) فيه `dbProtection` — **لا تزيله**
- [server/dbProtection.ts](server/dbProtection.ts) يحمي من `DROP`/`DELETE` خطأً — **لا تخفّفه**
- [server/storage.ts](server/storage.ts) فيه `DISABLED TO PREVENT AUTOMATIC BACKUPS` comments — **لا تشغّل** الـ automatic resets

---

## 🟡 القواعد الصفراء (ALWAYS — لازم تتأكد قبل)

### 6. ⚠️ اسأل قبل أي schema migration
قبل `drizzle-kit push`، اسأل:
- على أي environment؟ (dev/staging/production)
- هل فيه بيانات موجودة هتتأثر؟ (`DROP COLUMN` يفقد البيانات!)
- هل المستخدم جاهز لفقدان البيانات لو حصلت migration خاطئة؟

### 7. ⚠️ استخدم الـ tiers الصحيحة للـ testing
```
dev (local)     → تجارب حرة (اكسر الـ schema، امسح بيانات، إلخ)
      ↓ push to staging branch
staging (Render) → اختبار مع أصحاب المشروع (بيانات تجريبية فقط)
      ↓ merge to main + explicit approval
production      → بيانات حقيقية لا يُستهان بها
```

### 8. ⚠️ تأكد من `APP_ENV` قبل أي script
قبل تشغيل `db:push:*` أو أي DB script:
```bash
# اعرض المتغير اللي هيُستخدم
echo $APP_ENV
# أو شوف الـ host في الـ connection string بدون الـ password
node -e "console.log(process.env.DATABASE_URL?.match(/@([^/]+)/)?.[1])"
```

### 9. ⚠️ اعمل backup قبل أي schema change كبير على production
في Neon console:
1. روح على branch `production`
2. اعمل **snapshot** قبل الـ migration
3. لو حصل غلط → restore من الـ snapshot

### 10. ⚠️ تحقق من الـ commit قبل الـ push
قبل `git push`:
- تأكد إن `git status` ما يظهرش `.env.dev`, `.env.staging`, `.env.production`
- تأكد إن الـ commit message ما يحتويش `DATABASE_URL` أو أي secret
- تأكد إن مفيش debug logs تكشف بيانات حقيقية

---

## 🟢 Best Practices (الإرشادات)

### 11. 📝 اكتب كل تغيير schema كـ drizzle migration
- ما تعدلش schema في production بـ SQL مباشر
- عدّل [shared/schema.ts](shared/schema.ts) أولاً
- `npm run db:push:dev` للاختبار
- `npm run db:push:staging` للتأكيد
- **لما** المستخدم يطلب explicitly → `npm run db:push:production`

### 12. 🧪 اختبر في staging قبل production
- كل feature جديدة: deploy على staging أولاً
- كل bug fix: اختبر في staging
- **لا** تنشر على production مباشرة من dev

### 13. 🔐 الـ API keys الحقيقية في production فقط
Feature flags حالياً:
- `EMAIL_ENABLED=false` — الإيميل معطل
- `MYFATOORAH_ENABLED=false` — الدفع معطل
- `TAQNYAT_ENABLED=false` — SMS معطل
- `PERPLEXITY_ENABLED=false` — AI معطل

**لا تفعّل أي flag** (= true) بدون:
- مفتاح API حقيقي
- اختبار شامل في staging
- موافقة صريحة من المستخدم

### 14. 🌐 URLs ونطاقات الـ deployment
- dev: `localhost:5000` (محلي فقط)
- staging: `petgo-staging.onrender.com` (مشاركة محدودة)
- production: `petgo-production.onrender.com` (عملاء حقيقيون)

**لا تشارك** URL production مع أي حد بدون إذن المستخدم.

### 15. 📊 Logging وsensitive data
- **لا** تطبع `password`, `token`, `session_id` في logs
- **لا** تطبع بيانات مستخدمين (email, phone) في logs إلا بـ masking
- لو debugging ضروري → استخدم dev فقط + امسح الـ logs بعدها

---

## 🔴 سيناريوهات خطيرة — إرفض فوراً

### Scenario 1: "احذف كل المستخدمين"
**رد:**
> "هل في dev أم staging أم production؟"
> لو قال production → ارفض وقل: "هذا سيحذف بيانات حقيقية. هل المستخدم طلب ذلك صراحة؟"

### Scenario 2: "غيّر DATABASE_URL لـ production عشان نختبر حاجة بسرعة"
**رد:**
> "لا. الاختبار في dev فقط. استخدم `.env.dev` أو `.env.staging`."

### Scenario 3: "اعمل backup من production وانسخها لـ dev"
**رد:**
> "خطر: ده هينقل بيانات حقيقية (PII) لبيئة تطوير غير آمنة. بديل آمن: Neon branch من production (schema only) ونستخدم fake data."

### Scenario 4: "commit الـ .env بسرعة عشان نحتاجها على سيرفر تاني"
**رد:**
> "لا. الـ .env files ما تُعمل لها commit أبداً. استخدم:
> - Render Environment Variables tab
> - Vercel env vars
> - أو ملف .env على السيرفر المستهدف يدوياً"

### Scenario 5: "شغّل SQL مباشرة لفيكس سريع في production"
**رد:**
> "توقّف. 
> 1. اعمل snapshot أولاً في Neon.
> 2. جهّز الـ SQL كـ migration في dev.
> 3. اختبر في staging.
> 4. اطلب موافقة المستخدم.
> 5. نفّذ مع rollback plan."

---

## 🧭 Checklist قبل أي Deploy لـ production

- [ ] كل الـ feature اشتغلت في dev بدون أخطاء
- [ ] اتعملت push على branch `staging` واختُبرت على `petgo-staging.onrender.com`
- [ ] لو فيه schema changes: اتعملت `db:push:staging` ونجحت
- [ ] `npm run check` (TypeScript) لا يعطي أخطاء جديدة
- [ ] `npm run build` ينجح محلياً
- [ ] لا يوجد `console.log` فيه بيانات حساسة
- [ ] `.gitignore` سليم (`.env.*` محجوب)
- [ ] لا يوجد hardcoded credentials في الكود
- [ ] المستخدم وافق صراحة على الـ deploy
- [ ] في Neon، اعمل snapshot لـ production قبل الـ deploy (لو في schema change)
- [ ] بعد الـ deploy: اختبر التطبيق على URL production فوراً

---

## 🔧 الأوامر المسموحة وأين

### ✅ مسموح دايماً:
```bash
npm run dev                # شغّل محلي
npm run staging            # شغّل staging محلياً (للتست)
npm run build              # بناء التطبيق
npm run check              # TypeScript type check
npm run db:push:dev        # schema push على dev
git status                 # فحص حالة git
git log                    # قراءة history
```

### ⚠️ مسموح بعد تأكيد المستخدم:
```bash
npm run db:push:staging    # schema push على staging
git push origin staging    # deploy staging
git merge staging          # دمج staging في main
```

### 🚨 مسموح فقط بإذن صريح + تأكيد:
```bash
npm run db:push:production # يطلب "yes" تلقائياً، لكن لازم موافقة مسبقة
git push origin main       # deploy production
```

### ❌ ممنوع دائماً (إلا بحالات استثنائية جداً):
```bash
rm -rf                     # أي حذف جماعي
git push --force           # force push على أي branch
git reset --hard           # على commits مرفوعة
DROP TABLE ...             # على أي DB
DELETE FROM users          # مباشرة على production
```

---

## 🆘 لو حصلت كارثة

### لو حذفت بيانات في production بالغلط:
1. **توقّف فوراً** — لا تحاول إصلاح بكود جديد
2. روح على Neon Console → branch `production` → **Restore**
3. اختر **time point قبل الحذف** مباشرة
4. اعمل restore
5. ابلغ المستخدم بالحادثة + الـ timeline + ما تم استعادته

### لو commit-ت secrets بالغلط:
1. **لا** تعمل `git push`
2. لو عملت push:
   - اعمل rotate فوراً للـ secret المكشوف (Neon password, API keys, إلخ)
   - `git reset --soft HEAD~1` + amend + force push (مع حذر شديد)
   - ابلغ المستخدم

### لو الـ deploy فشل:
1. Render يحتفظ بالـ deploy السابق → **Rollback** من Render dashboard
2. حقّق في الـ logs
3. فكّ المشكلة في dev/staging
4. re-deploy لما يبقى جاهز

---

## 📞 جهات الاتصال والمصادر

- **Neon Console:** https://console.neon.tech
- **Render Dashboard:** https://dashboard.render.com
- **GitHub Repo:** https://github.com/profman23/petgo_application
- **Owner Email:** profman23@gmail.com

---

## 🔒 الخلاصة في جملة واحدة

> **Production is sacred. dev is yours. staging is for proving dev works.**
> **لما تشك، اسأل. لما تخاف، توقّف.**
