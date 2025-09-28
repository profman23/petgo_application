import { relations } from "drizzle-orm/relations";
import { generatedInvoices, payments, bookings, drivers, shifts, users, patients, invoiceItems, reviews, invoiceStatus, invoicePayments, redZones } from "./schema";

export const paymentsRelations = relations(payments, ({one}) => ({
	generatedInvoice: one(generatedInvoices, {
		fields: [payments.invoiceId],
		references: [generatedInvoices.id]
	}),
	booking: one(bookings, {
		fields: [payments.bookingId],
		references: [bookings.id]
	}),
}));

export const generatedInvoicesRelations = relations(generatedInvoices, ({one, many}) => ({
	payments: many(payments),
	booking: one(bookings, {
		fields: [generatedInvoices.bookingId],
		references: [bookings.id]
	}),
	driver: one(drivers, {
		fields: [generatedInvoices.generatedBy],
		references: [drivers.id]
	}),
}));

export const bookingsRelations = relations(bookings, ({many}) => ({
	payments: many(payments),
	generatedInvoices: many(generatedInvoices),
	invoiceItems: many(invoiceItems),
	reviews: many(reviews),
	invoiceStatuses: many(invoiceStatus),
	invoicePayments: many(invoicePayments),
}));

export const driversRelations = relations(drivers, ({many}) => ({
	generatedInvoices: many(generatedInvoices),
	shifts: many(shifts),
	redZones: many(redZones),
}));

export const shiftsRelations = relations(shifts, ({one}) => ({
	driver: one(drivers, {
		fields: [shifts.vetsVanId],
		references: [drivers.id]
	}),
}));

export const patientsRelations = relations(patients, ({one}) => ({
	user: one(users, {
		fields: [patients.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	patients: many(patients),
	reviews: many(reviews),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({one}) => ({
	booking: one(bookings, {
		fields: [invoiceItems.bookingId],
		references: [bookings.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	booking: one(bookings, {
		fields: [reviews.bookingId],
		references: [bookings.id]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
}));

export const invoiceStatusRelations = relations(invoiceStatus, ({one}) => ({
	booking: one(bookings, {
		fields: [invoiceStatus.bookingId],
		references: [bookings.id]
	}),
}));

export const invoicePaymentsRelations = relations(invoicePayments, ({one}) => ({
	booking: one(bookings, {
		fields: [invoicePayments.bookingId],
		references: [bookings.id]
	}),
}));

export const redZonesRelations = relations(redZones, ({one}) => ({
	driver: one(drivers, {
		fields: [redZones.vetsvanId],
		references: [drivers.id]
	}),
}));