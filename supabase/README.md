# Supabase Migrations & Seeds

Folder ini berisi semua schema dan seed data untuk database SF Winner Sports Club.

## Struktur Folder

```
supabase/
├── migrations/
│   └── 001_initial_schema.sql    # Schema awal (tabel, RLS, triggers)
└── seeds/
    └── 001_create_superadmin.sql # Seed superadmin user
```

## Cara Pakai

### 1. Jalankan Migration (sekali saja, saat setup awal)

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project `xpdozwibiemwarqggvmf`
3. SQL Editor → Open `supabase/migrations/001_initial_schema.sql`
4. Run

### 2. Buat Super Admin

1. **Supabase Dashboard → Authentication → Users → Add user**
   - Email: `admin@sfwinner.site` (atau sesuai keinginan)
   - Set password

2. **Copy USER ID** dari row user yang baru dibuat (kolom UUID)

3. **Edit** `supabase/seeds/001_create_superadmin.sql`
   - Ganti `YOUR_USER_ID_HERE` dengan USER ID yang sudah di-copy

4. **Run** di SQL Editor

### 3. Login

Buka `https://app.sfwinner.site/login` → login dengan email & password yang sudah dibuat

Kalau role = `super_admin`, akan diarahkan ke `/admin/dashboard`

---

## Urutan Migration

| Order | File | Keterangan |
|-------|------|------------|
| 1 | `001_initial_schema.sql` | Buat tabel, enum, RLS |
| 2 | `001_create_superadmin.sql` | Buat user superadmin |

---

## Troubleshooting

### "relation 'users' does not exist"
→ Jalankan migration `001_initial_schema.sql` dulu

### "duplicate key value violates unique constraint"
→ Data sudah ada, skip migration/seeder ini

### User tidak bisa login
→ Pastikan USER ID di seed sesuai dengan auth.users.id yang benar