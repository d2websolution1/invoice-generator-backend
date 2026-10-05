import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

/**
 * Initializes all required PostgreSQL tables for the Invoice Generator application.
 * Runs on server startup against Supabase.
 */
export async function initializeDatabase() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();

        // 1. Admin Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) DEFAULT 'Admin',
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // 2. Companies Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id SERIAL PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                gst_number VARCHAR(50),
                phone VARCHAR(50),
                email VARCHAR(100),
                address TEXT,
                address_line2 TEXT,
                state VARCHAR(100),
                pincode VARCHAR(20),
                bank_name VARCHAR(100),
                account_holder VARCHAR(100),
                account_number VARCHAR(100),
                ifsc_code VARCHAR(50),
                logo VARCHAR(255),
                qr_code VARCHAR(255),
                signature VARCHAR(255),
                stamp VARCHAR(255),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // 3. Parties Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS parties (
                id SERIAL PRIMARY KEY,
                party_type VARCHAR(20) DEFAULT 'Customer',
                party_name VARCHAR(255) NOT NULL,
                company_name VARCHAR(255),
                gst_number VARCHAR(50),
                phone VARCHAR(50) NOT NULL,
                alternate_phone VARCHAR(50),
                email VARCHAR(100),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(20),
                opening_balance NUMERIC(10,2) DEFAULT 0.00,
                credit_limit NUMERIC(10,2) DEFAULT 0.00,
                is_active SMALLINT DEFAULT 1,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // 4. Items Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                item_type VARCHAR(20) DEFAULT 'Product',
                item_name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                unit VARCHAR(50) DEFAULT 'Pcs',
                hsn_sac VARCHAR(50),
                sku VARCHAR(50),
                barcode VARCHAR(100),
                gst_percentage NUMERIC(5,2) DEFAULT 18.00,
                purchase_price NUMERIC(10,2) DEFAULT 0.00,
                selling_price NUMERIC(10,2) DEFAULT 0.00,
                opening_stock INT DEFAULT 0,
                minimum_stock INT DEFAULT 0,
                description TEXT,
                is_active SMALLINT DEFAULT 1,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // 5. Invoices Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id SERIAL PRIMARY KEY,
                invoice_number VARCHAR(100) NOT NULL UNIQUE,
                invoice_date DATE NOT NULL,
                due_date DATE,
                delivery_date DATE,
                party_id INT REFERENCES parties(id) ON DELETE SET NULL,
                payment_mode VARCHAR(50) DEFAULT 'Cash',
                subtotal NUMERIC(10,2) DEFAULT 0.00,
                discount NUMERIC(10,2) DEFAULT 0.00,
                cgst NUMERIC(10,2) DEFAULT 0.00,
                sgst NUMERIC(10,2) DEFAULT 0.00,
                igst NUMERIC(10,2) DEFAULT 0.00,
                round_off NUMERIC(10,2) DEFAULT 0.00,
                grand_total NUMERIC(10,2) DEFAULT 0.00,
                notes TEXT,
                terms TEXT,
                transport_name VARCHAR(255),
                vehicle_number VARCHAR(100),
                eway_bill_no VARCHAR(100),
                shipping_address TEXT,
                shipping_city VARCHAR(100),
                irn VARCHAR(255),
                ack_no VARCHAR(100),
                ack_dt DATE,
                status VARCHAR(20) DEFAULT 'Unpaid',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // 6. Invoice Items Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS invoice_items (
                id SERIAL PRIMARY KEY,
                invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
                item_id INT REFERENCES items(id) ON DELETE SET NULL,
                quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
                unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
                discount NUMERIC(10,2) DEFAULT 0.00,
                gst_percentage NUMERIC(5,2) DEFAULT 0.00,
                gst_amount NUMERIC(10,2) DEFAULT 0.00,
                total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // 7. Invoice Payments Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS invoice_payments (
                id SERIAL PRIMARY KEY,
                invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
                payment_date DATE NOT NULL,
                amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
                payment_mode VARCHAR(50) DEFAULT 'Cash',
                reference_number VARCHAR(100),
                remarks TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // 8. Seed default admin users if not present
        const adminsToSeed = [
            { email: "admin@gmail.com", password: "admin123", name: "Super Admin" },
            { email: "admin@invoice.com", password: "admin123", name: "Admin" }
        ];

        for (const admin of adminsToSeed) {
            const { rows } = await client.query("SELECT * FROM admin WHERE email = $1", [admin.email]);
            if (rows.length === 0) {
                const hashedPassword = await bcrypt.hash(admin.password, 10);
                await client.query("INSERT INTO admin (name, email, password) VALUES ($1, $2, $3)", [
                    admin.name,
                    admin.email,
                    hashedPassword,
                ]);
                console.log(`✅ Default admin created: ${admin.email} (password: ${admin.password})`);
            }
        }

        console.log("✅ All PostgreSQL Tables & Schema Initialized Successfully!");
    } catch (error) {
        console.error("❌ Database Initialization Error:", error.message);
    } finally {
        await client.end();
    }
}
