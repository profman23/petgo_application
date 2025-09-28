import { pgTable, serial, integer, text, real, timestamp, unique, boolean, foreignKey, numeric, varchar, jsonb, index, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const rides = pgTable("rides", {
	id: serial().primaryKey().notNull(),
	customerId: integer("customer_id").notNull(),
	driverId: integer("driver_id"),
	pickupLocation: text("pickup_location").notNull(),
	destination: text().notNull(),
	pickupLatitude: real("pickup_latitude").notNull(),
	pickupLongitude: real("pickup_longitude").notNull(),
	destinationLatitude: real("destination_latitude"),
	destinationLongitude: real("destination_longitude"),
	estimatedDistance: real("estimated_distance"),
	estimatedTime: integer("estimated_time"),
	estimatedCost: real("estimated_cost"),
	status: text().default('requested').notNull(),
	vehicleType: text("vehicle_type").default('standard').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const drivers = pgTable("drivers", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	phone: text().notNull(),
	rating: real().default(4.5).notNull(),
	carModel: text("car_model").notNull(),
	carColor: text("car_color").notNull(),
	plateNumber: text("plate_number").notNull(),
	latitude: real().notNull(),
	longitude: real().notNull(),
	isAvailable: boolean("is_available").default(true).notNull(),
	profileImageUrl: text("profile_image_url"),
	username: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	vetsvanCode: text("vetsvan_code").default(').notNull(),
	vetsvanName: text("vetsvan_name").default(').notNull(),
}, (table) => [
	unique("drivers_username_key").on(table.username),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	phone: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	petName: text("pet_name"),
	petType: text("pet_type"),
	membershipType: text("membership_type").default('bronze').notNull(),
	address: text(),
	email: text(),
	birthdate: text(),
	active: boolean().default(true).notNull(),
}, (table) => [
	unique("users_phone_unique").on(table.phone),
	unique("users_email_unique").on(table.email),
]);

export const payments = pgTable("payments", {
	id: serial().primaryKey().notNull(),
	invoiceId: integer("invoice_id"),
	bookingId: integer("booking_id").notNull(),
	amountPaid: numeric("amount_paid", { precision: 10, scale:  2 }).notNull(),
	paymentMethod: text("payment_method").notNull(),
	paymentStatus: text("payment_status").default('pending').notNull(),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [generatedInvoices.id],
			name: "payments_invoice_id_fkey"
		}),
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "payments_booking_id_fkey"
		}),
]);

export const generatedInvoices = pgTable("generated_invoices", {
	id: serial().primaryKey().notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	bookingId: integer("booking_id").notNull(),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
	customerEmail: varchar("customer_email", { length: 255 }),
	doctorName: varchar("doctor_name", { length: 255 }).notNull(),
	vetsVanCode: varchar("vets_van_code", { length: 50 }).notNull(),
	appointmentDate: text("appointment_date").notNull(),
	appointmentTime: text("appointment_time").notNull(),
	serviceType: varchar("service_type", { length: 255 }),
	pets: jsonb(),
	items: jsonb(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	totalDiscountAmount: numeric("total_discount_amount", { precision: 10, scale:  2 }).default('0.00'),
	vatAmount: numeric("vat_amount", { precision: 10, scale:  2 }).notNull(),
	finalTotal: numeric("final_total", { precision: 10, scale:  2 }).notNull(),
	notes: text(),
	generatedBy: integer("generated_by").notNull(),
	generatedAt: timestamp("generated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isEmailSent: boolean("is_email_sent").default(false),
	emailSentAt: timestamp("email_sent_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	totalPaid: numeric("total_paid", { precision: 10, scale:  2 }).default('0').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "generated_invoices_booking_id_fkey"
		}),
	foreignKey({
			columns: [table.generatedBy],
			foreignColumns: [drivers.id],
			name: "generated_invoices_generated_by_fkey"
		}),
	unique("generated_invoices_invoice_number_key").on(table.invoiceNumber),
]);

export const shifts = pgTable("shifts", {
	id: serial().primaryKey().notNull(),
	vetsVanId: integer("vets_van_id").notNull(),
	date: text().notNull(),
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
	duration: text().notNull(),
	status: text().default('scheduled').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.vetsVanId],
			foreignColumns: [drivers.id],
			name: "shifts_vets_van_id_fkey"
		}),
]);

export const patients = pgTable("patients", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: text().notNull(),
	type: text().notNull(),
	age: text(),
	condition: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	ageYear: integer("age_year"),
	ageMonth: integer("age_month"),
	ageDay: integer("age_day"),
	photo: text(),
	birthdate: text(),
	gender: text(),
	patientWeight: real("patient_weight"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "patients_user_id_users_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("idx_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const petAttachments = pgTable("pet_attachments", {
	id: serial().primaryKey().notNull(),
	petId: integer("pet_id").notNull(),
	bookingId: integer("booking_id").notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileType: varchar("file_type", { length: 100 }),
	fileSize: integer("file_size"),
	fileUrl: text("file_url"),
	description: text(),
	uploadedBy: varchar("uploaded_by", { length: 100 }).notNull(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const otpVerification = pgTable("otp_verification", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	otp: varchar({ length: 6 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	isUsed: boolean("is_used").default(false).notNull(),
	attempts: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
	id: serial().primaryKey().notNull(),
	bookingId: integer("booking_id").notNull(),
	description: text().notNull(),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	discount: numeric({ precision: 10, scale:  2 }).default('0'),
	discountType: varchar("discount_type", { length: 20 }).default('none'),
	vatRate: numeric("vat_rate", { precision: 5, scale:  2 }).default('15.00'),
	vatAmount: numeric("vat_amount", { precision: 10, scale:  2 }).default('0'),
	totalBeforeVat: numeric("total_before_vat", { precision: 10, scale:  2 }).default('0'),
	totalAfterVat: numeric("total_after_vat", { precision: 10, scale:  2 }).default('0'),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "fk_invoice_items_booking"
		}),
]);

export const bookings = pgTable("bookings", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	shiftId: integer("shift_id").notNull(),
	vetsVanId: integer("vets_van_id").notNull(),
	appointmentDate: varchar("appointment_date", { length: 255 }).notNull(),
	appointmentTime: varchar("appointment_time", { length: 255 }).notNull(),
	status: varchar({ length: 50 }).default('booked'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	customerLocation: jsonb("customer_location"),
	paymentStatus: text("payment_status").default('pending').notNull(),
	paymentId: text("payment_id"),
	invoiceId: text("invoice_id"),
	paymentAmount: numeric("payment_amount", { precision: 10, scale:  2 }),
	paymentMethod: text("payment_method"),
	selectedPets: jsonb("selected_pets"),
	serviceType: text("service_type").default('General Check Up'),
	invoiceGenerated: boolean("invoice_generated").default(false).notNull(),
});

export const reviews = pgTable("reviews", {
	id: serial().primaryKey().notNull(),
	bookingId: integer("booking_id").notNull(),
	userId: integer("user_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "reviews_booking_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_fkey"
		}),
	check("reviews_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const invoiceStatus = pgTable("invoice_status", {
	id: serial().primaryKey().notNull(),
	bookingId: integer("booking_id").notNull(),
	isGenerated: boolean("is_generated").default(false).notNull(),
	generatedAt: timestamp("generated_at", { mode: 'string' }),
	generatedBy: varchar("generated_by", { length: 255 }).notNull(),
	notes: text(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).notNull(),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).notNull(),
	finalTotal: numeric("final_total", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	totalPaid: numeric("total_paid", { precision: 10, scale:  2 }).default('0').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "fk_invoice_status_booking"
		}),
	unique("invoice_status_booking_id_key").on(table.bookingId),
]);

export const otpVerifications = pgTable("otp_verifications", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 10 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isVerified: boolean("is_verified").default(false),
	userData: jsonb("user_data"),
}, (table) => [
	unique("otp_verifications_email_code_key").on(table.email, table.code),
]);

export const admins = pgTable("admins", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	role: text().default('admin').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("admins_username_key").on(table.username),
]);

export const services = pgTable("services", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	nameAr: varchar("name_ar", { length: 255 }),
	description: text(),
	descriptionAr: text("description_ar"),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	category: varchar({ length: 100 }),
	categoryAr: varchar("category_ar", { length: 100 }),
	duration: integer(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const importProtectionLog = pgTable("import_protection_log", {
	id: serial().primaryKey().notNull(),
	protectionType: varchar("protection_type", { length: 50 }).notNull(),
	tableName: varchar("table_name", { length: 50 }).notNull(),
	recordCount: integer("record_count").notNull(),
	lockTimestamp: timestamp("lock_timestamp", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	status: varchar({ length: 20 }).default('active'),
});

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	nameAr: varchar("name_ar", { length: 255 }),
	description: text(),
	descriptionAr: text("description_ar"),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	category: varchar({ length: 100 }),
	categoryAr: varchar("category_ar", { length: 100 }),
	sku: varchar({ length: 50 }),
	unit: varchar({ length: 50 }),
	unitAr: varchar("unit_ar", { length: 50 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const invoicePayments = pgTable("invoice_payments", {
	id: serial().primaryKey().notNull(),
	bookingId: integer("booking_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentType: varchar("payment_type", { length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "invoice_payments_booking_id_fkey"
		}),
]);

export const importHistory = pgTable("import_history", {
	id: serial().primaryKey().notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileType: varchar("file_type", { length: 20 }).notNull(),
	recordsImported: integer("records_imported").default(0),
	recordsUpdated: integer("records_updated").default(0),
	recordsSkipped: integer("records_skipped").default(0),
	status: varchar({ length: 50 }).default('completed'),
	errorMessage: text("error_message"),
	importedBy: varchar("imported_by", { length: 255 }),
	importedAt: timestamp("imported_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const userSessions = pgTable("user_sessions", {
	id: text().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	userType: text("user_type").default('customer').notNull(),
	userData: jsonb("user_data").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const petVitals = pgTable("pet_vitals", {
	id: serial().primaryKey().notNull(),
	bookingId: integer("booking_id").notNull(),
	petId: integer("pet_id").notNull(),
	weight: numeric({ precision: 5, scale:  2 }),
	temperature: numeric({ precision: 4, scale:  1 }),
	heartRate: integer("heart_rate"),
	notes: text(),
	recordedAt: timestamp("recorded_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	recordedBy: varchar("recorded_by").notNull(),
	consultationDate: text("consultation_date"),
	reasonForVisit: text("reason_for_visit"),
	initialComplaintNotes: text("initial_complaint_notes"),
	bodyCondition: text("body_condition"),
	bodyConditionScore: text("body_condition_score"),
	respiratoryFrequency: integer("respiratory_frequency"),
	muscleConditionScore: text("muscle_condition_score"),
	painScore: text("pain_score"),
	hydrationStatus: text("hydration_status"),
	attitude: text(),
});

export const paymentMethods = pgTable("payment_methods", {
	id: serial().primaryKey().notNull(),
	myfatoorahId: integer("myfatoorah_id").notNull(),
	nameEn: text("name_en").notNull(),
	nameAr: text("name_ar").notNull(),
	code: text().notNull(),
	imageUrl: text("image_url"),
	isDirectPayment: boolean("is_direct_payment").default(false).notNull(),
	serviceCharge: numeric("service_charge", { precision: 10, scale:  4 }).default('0'),
	currencyIso: text("currency_iso").default('SAR'),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("payment_methods_myfatoorah_id_key").on(table.myfatoorahId),
]);

export const paymentTransactions = pgTable("payment_transactions", {
	id: serial().primaryKey().notNull(),
	invoiceId: integer("invoice_id"),
	bookingId: integer("booking_id"),
	myfatoorahPaymentId: text("myfatoorah_payment_id"),
	myfatoorahInvoiceId: text("myfatoorah_invoice_id"),
	paymentMethodId: integer("payment_method_id"),
	paymentMethodName: text("payment_method_name"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: text().default('SAR').notNull(),
	status: text().default('pending').notNull(),
	gatewayStatus: text("gateway_status"),
	transactionId: text("transaction_id"),
	referenceId: text("reference_id"),
	customerName: text("customer_name"),
	customerEmail: text("customer_email"),
	customerPhone: text("customer_phone"),
	paymentUrl: text("payment_url"),
	successUrl: text("success_url"),
	errorUrl: text("error_url"),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	gatewayResponse: jsonb("gateway_response"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	originalCustomerName: text("original_customer_name"),
	originalCustomerEmail: text("original_customer_email"),
	originalCustomerPhone: text("original_customer_phone"),
});

export const adminUsers = pgTable("admin_users", {
	id: serial().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	username: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	authorizationId: integer("authorization_id").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("admin_users_email_key").on(table.email),
	unique("admin_users_username_key").on(table.username),
]);

export const redZones = pgTable("red_zones", {
	id: serial().primaryKey().notNull(),
	vetsvanId: integer("vetsvan_id").notNull(),
	latitude: real().notNull(),
	longitude: real().notNull(),
	radius: integer().default(1000).notNull(),
	name: text(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.vetsvanId],
			foreignColumns: [drivers.id],
			name: "red_zones_vetsvan_id_fkey"
		}),
]);

export const outgoingPayments = pgTable("outgoing_payments", {
	id: serial().primaryKey().notNull(),
	businessPartnerType: varchar("business_partner_type", { length: 20 }).notNull(),
	businessPartnerId: integer("business_partner_id"),
	businessPartnerName: varchar("business_partner_name", { length: 255 }),
	businessPartnerPhone: varchar("business_partner_phone", { length: 20 }),
	postingDate: text("posting_date").notNull(),
	transactionType: varchar("transaction_type", { length: 50 }).notNull(),
	documentNo: varchar("document_no", { length: 50 }).notNull(),
	paymentMethods: jsonb("payment_methods").notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	docnum: varchar({ length: 50 }).default('OPN0000000'),
});

export const incomePayments = pgTable("income_payments", {
	id: serial().primaryKey().notNull(),
	businessPartnerType: varchar("business_partner_type", { length: 20 }).notNull(),
	businessPartnerId: integer("business_partner_id"),
	businessPartnerName: varchar("business_partner_name", { length: 255 }),
	businessPartnerPhone: varchar("business_partner_phone", { length: 20 }),
	postingDate: text("posting_date").notNull(),
	transactionType: varchar("transaction_type", { length: 50 }).notNull(),
	documentNo: varchar("document_no", { length: 50 }).notNull(),
	paymentMethods: jsonb("payment_methods").notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	docnum: varchar({ length: 50 }).default('IPN0000000'),
});

export const creditNotes = pgTable("credit_notes", {
	id: serial().primaryKey().notNull(),
	creditNoteNumber: varchar("credit_note_number", { length: 50 }).notNull(),
	invoiceId: integer("invoice_id").notNull(),
	invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	appointmentDate: text("appointment_date").notNull(),
	postingDate: text("posting_date").notNull(),
	items: jsonb().notNull(),
	totalBeforeVat: numeric("total_before_vat", { precision: 10, scale:  2 }).notNull(),
	vatAmount: numeric("vat_amount", { precision: 10, scale:  2 }).notNull(),
	finalTotal: numeric("final_total", { precision: 10, scale:  2 }).notNull(),
	createdBy: varchar("created_by", { length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	status: varchar({ length: 50 }).default('Closed').notNull(),
}, (table) => [
	unique("credit_notes_credit_note_number_key").on(table.creditNoteNumber),
]);

export const authorizations = pgTable("authorizations", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	usersHidden: boolean("users_hidden").default(false).notNull(),
	usersRead: boolean("users_read").default(false).notNull(),
	usersFullControl: boolean("users_full_control").default(false).notNull(),
	authHidden: boolean("auth_hidden").default(false).notNull(),
	authRead: boolean("auth_read").default(false).notNull(),
	authFullControl: boolean("auth_full_control").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	vetsVanHidden: boolean("vets_van_hidden").default(false).notNull(),
	vetsVanRead: boolean("vets_van_read").default(false).notNull(),
	vetsVanFullControl: boolean("vets_van_full_control").default(false).notNull(),
	vetsVanShiftsHidden: boolean("vets_van_shifts_hidden").default(true).notNull(),
	vetsVanShiftsRead: boolean("vets_van_shifts_read").default(false).notNull(),
	vetsVanShiftsFullControl: boolean("vets_van_shifts_full_control").default(false).notNull(),
	importHidden: boolean("import_hidden").default(false).notNull(),
	importFullControl: boolean("import_full_control").default(false).notNull(),
	servicesHidden: boolean("services_hidden").default(false).notNull(),
	servicesRead: boolean("services_read").default(false).notNull(),
	servicesFullControl: boolean("services_full_control").default(false).notNull(),
	productsHidden: boolean("products_hidden").default(false).notNull(),
	productsRead: boolean("products_read").default(false).notNull(),
	productsFullControl: boolean("products_full_control").default(false).notNull(),
	creditNoteNoPermission: boolean("credit_note_no_permission").default(false).notNull(),
	creditNoteRead: boolean("credit_note_read").default(false).notNull(),
	creditNoteFullControl: boolean("credit_note_full_control").default(false).notNull(),
	creditNoteExport: boolean("credit_note_export").default(false).notNull(),
	creditNotesHidden: boolean("credit_notes_hidden").default(false).notNull(),
});
