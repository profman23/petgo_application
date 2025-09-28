-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "rides" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"driver_id" integer,
	"pickup_location" text NOT NULL,
	"destination" text NOT NULL,
	"pickup_latitude" real NOT NULL,
	"pickup_longitude" real NOT NULL,
	"destination_latitude" real,
	"destination_longitude" real,
	"estimated_distance" real,
	"estimated_time" integer,
	"estimated_cost" real,
	"status" text DEFAULT 'requested' NOT NULL,
	"vehicle_type" text DEFAULT 'standard' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"rating" real DEFAULT 4.5 NOT NULL,
	"car_model" text NOT NULL,
	"car_color" text NOT NULL,
	"plate_number" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"profile_image_url" text,
	"username" text,
	"password" text,
	"created_at" timestamp DEFAULT now(),
	"vetsvan_code" text DEFAULT '' NOT NULL,
	"vetsvan_name" text DEFAULT '' NOT NULL,
	CONSTRAINT "drivers_username_key" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"pet_name" text,
	"pet_type" text,
	"membership_type" text DEFAULT 'bronze' NOT NULL,
	"address" text,
	"email" text,
	"birthdate" text,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer,
	"booking_id" integer NOT NULL,
	"amount_paid" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "generated_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"booking_id" integer NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(50) NOT NULL,
	"customer_email" varchar(255),
	"doctor_name" varchar(255) NOT NULL,
	"vets_van_code" varchar(50) NOT NULL,
	"appointment_date" text NOT NULL,
	"appointment_time" text NOT NULL,
	"service_type" varchar(255),
	"pets" jsonb,
	"items" jsonb,
	"subtotal" numeric(10, 2) NOT NULL,
	"total_discount_amount" numeric(10, 2) DEFAULT '0.00',
	"vat_amount" numeric(10, 2) NOT NULL,
	"final_total" numeric(10, 2) NOT NULL,
	"notes" text,
	"generated_by" integer NOT NULL,
	"generated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_email_sent" boolean DEFAULT false,
	"email_sent_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"total_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	CONSTRAINT "generated_invoices_invoice_number_key" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vets_van_id" integer NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"age" text,
	"condition" text,
	"created_at" timestamp DEFAULT now(),
	"age_year" integer,
	"age_month" integer,
	"age_day" integer,
	"photo" text,
	"birthdate" text,
	"gender" text,
	"patient_weight" real
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"pet_id" integer NOT NULL,
	"booking_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(100),
	"file_size" integer,
	"file_url" text,
	"description" text,
	"uploaded_by" varchar(100) NOT NULL,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "otp_verification" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"discount" numeric(10, 2) DEFAULT '0',
	"discount_type" varchar(20) DEFAULT 'none',
	"vat_rate" numeric(5, 2) DEFAULT '15.00',
	"vat_amount" numeric(10, 2) DEFAULT '0',
	"total_before_vat" numeric(10, 2) DEFAULT '0',
	"total_after_vat" numeric(10, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"shift_id" integer NOT NULL,
	"vets_van_id" integer NOT NULL,
	"appointment_date" varchar(255) NOT NULL,
	"appointment_time" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'booked',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"customer_location" jsonb,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_id" text,
	"invoice_id" text,
	"payment_amount" numeric(10, 2),
	"payment_method" text,
	"selected_pets" jsonb,
	"service_type" text DEFAULT 'General Check Up',
	"invoice_generated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "reviews_rating_check" CHECK ((rating >= 1) AND (rating <= 5))
);
--> statement-breakpoint
CREATE TABLE "invoice_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"is_generated" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp,
	"generated_by" varchar(255) NOT NULL,
	"notes" text,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"final_total" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"total_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	CONSTRAINT "invoice_status_booking_id_key" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_verified" boolean DEFAULT false,
	"user_data" jsonb,
	CONSTRAINT "otp_verifications_email_code_key" UNIQUE("email","code")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_key" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_ar" varchar(255),
	"description" text,
	"description_ar" text,
	"price" numeric(10, 2) NOT NULL,
	"category" varchar(100),
	"category_ar" varchar(100),
	"duration" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "import_protection_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"protection_type" varchar(50) NOT NULL,
	"table_name" varchar(50) NOT NULL,
	"record_count" integer NOT NULL,
	"lock_timestamp" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(20) DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_ar" varchar(255),
	"description" text,
	"description_ar" text,
	"price" numeric(10, 2) NOT NULL,
	"category" varchar(100),
	"category_ar" varchar(100),
	"sku" varchar(50),
	"unit" varchar(50),
	"unit_ar" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "invoice_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_type" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "import_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(20) NOT NULL,
	"records_imported" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_skipped" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'completed',
	"error_message" text,
	"imported_by" varchar(255),
	"imported_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_type" text DEFAULT 'customer' NOT NULL,
	"user_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"expires_at" timestamp NOT NULL,
	"last_accessed_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "pet_vitals" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"pet_id" integer NOT NULL,
	"weight" numeric(5, 2),
	"temperature" numeric(4, 1),
	"heart_rate" integer,
	"notes" text,
	"recorded_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"recorded_by" varchar NOT NULL,
	"consultation_date" text,
	"reason_for_visit" text,
	"initial_complaint_notes" text,
	"body_condition" text,
	"body_condition_score" text,
	"respiratory_frequency" integer,
	"muscle_condition_score" text,
	"pain_score" text,
	"hydration_status" text,
	"attitude" text
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"myfatoorah_id" integer NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"code" text NOT NULL,
	"image_url" text,
	"is_direct_payment" boolean DEFAULT false NOT NULL,
	"service_charge" numeric(10, 4) DEFAULT '0',
	"currency_iso" text DEFAULT 'SAR',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_methods_myfatoorah_id_key" UNIQUE("myfatoorah_id")
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer,
	"booking_id" integer,
	"myfatoorah_payment_id" text,
	"myfatoorah_invoice_id" text,
	"payment_method_id" integer,
	"payment_method_name" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"gateway_status" text,
	"transaction_id" text,
	"reference_id" text,
	"customer_name" text,
	"customer_email" text,
	"customer_phone" text,
	"payment_url" text,
	"success_url" text,
	"error_url" text,
	"paid_at" timestamp,
	"gateway_response" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"original_customer_name" text,
	"original_customer_email" text,
	"original_customer_phone" text
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"authorization_id" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "admin_users_email_key" UNIQUE("email"),
	CONSTRAINT "admin_users_username_key" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "red_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"vetsvan_id" integer NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"radius" integer DEFAULT 1000 NOT NULL,
	"name" text,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "outgoing_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_partner_type" varchar(20) NOT NULL,
	"business_partner_id" integer,
	"business_partner_name" varchar(255),
	"business_partner_phone" varchar(20),
	"posting_date" text NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"document_no" varchar(50) NOT NULL,
	"payment_methods" jsonb NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"docnum" varchar(50) DEFAULT 'OPN0000000'
);
--> statement-breakpoint
CREATE TABLE "income_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_partner_type" varchar(20) NOT NULL,
	"business_partner_id" integer,
	"business_partner_name" varchar(255),
	"business_partner_phone" varchar(20),
	"posting_date" text NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"document_no" varchar(50) NOT NULL,
	"payment_methods" jsonb NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"docnum" varchar(50) DEFAULT 'IPN0000000'
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_note_number" varchar(50) NOT NULL,
	"invoice_id" integer NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"appointment_date" text NOT NULL,
	"posting_date" text NOT NULL,
	"items" jsonb NOT NULL,
	"total_before_vat" numeric(10, 2) NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"final_total" numeric(10, 2) NOT NULL,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" varchar(50) DEFAULT 'Closed' NOT NULL,
	CONSTRAINT "credit_notes_credit_note_number_key" UNIQUE("credit_note_number")
);
--> statement-breakpoint
CREATE TABLE "authorizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"users_hidden" boolean DEFAULT false NOT NULL,
	"users_read" boolean DEFAULT false NOT NULL,
	"users_full_control" boolean DEFAULT false NOT NULL,
	"auth_hidden" boolean DEFAULT false NOT NULL,
	"auth_read" boolean DEFAULT false NOT NULL,
	"auth_full_control" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"vets_van_hidden" boolean DEFAULT false NOT NULL,
	"vets_van_read" boolean DEFAULT false NOT NULL,
	"vets_van_full_control" boolean DEFAULT false NOT NULL,
	"vets_van_shifts_hidden" boolean DEFAULT true NOT NULL,
	"vets_van_shifts_read" boolean DEFAULT false NOT NULL,
	"vets_van_shifts_full_control" boolean DEFAULT false NOT NULL,
	"import_hidden" boolean DEFAULT false NOT NULL,
	"import_full_control" boolean DEFAULT false NOT NULL,
	"services_hidden" boolean DEFAULT false NOT NULL,
	"services_read" boolean DEFAULT false NOT NULL,
	"services_full_control" boolean DEFAULT false NOT NULL,
	"products_hidden" boolean DEFAULT false NOT NULL,
	"products_read" boolean DEFAULT false NOT NULL,
	"products_full_control" boolean DEFAULT false NOT NULL,
	"credit_note_no_permission" boolean DEFAULT false NOT NULL,
	"credit_note_read" boolean DEFAULT false NOT NULL,
	"credit_note_full_control" boolean DEFAULT false NOT NULL,
	"credit_note_export" boolean DEFAULT false NOT NULL,
	"credit_notes_hidden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."generated_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_invoices" ADD CONSTRAINT "generated_invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_invoices" ADD CONSTRAINT "generated_invoices_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_vets_van_id_fkey" FOREIGN KEY ("vets_van_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "fk_invoice_items_booking" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_status" ADD CONSTRAINT "fk_invoice_status_booking" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_zones" ADD CONSTRAINT "red_zones_vetsvan_id_fkey" FOREIGN KEY ("vetsvan_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_session_expire" ON "sessions" USING btree ("expire" timestamp_ops);
*/