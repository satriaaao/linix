# Analytics Geo Map Design

## Goal
Meningkatkan Analytics Rentcam agar menampilkan nama produk dan jumlah klik, lokasi kasar pengunjung, identitas pengunjung anonim, dan peta agregat tanpa menyimpan IP mentah atau lokasi presisi pribadi.

## Current flow
`cms-analytics-20260912.js` saat ini mengirim `page_view` dan `product_click` langsung dari browser ke tabel `rentcam_events` di Supabase. Event berisi `event_type`, `path`, `product_id`, `session_id`, `meta`, dan `created_at`. CMS mengagregasi event 7 hari untuk metrik, top produk, top halaman, dan aktivitas terbaru.

## Architecture
1. Browser mengirim event ke endpoint `/api/analytics-event` di Vercel, bukan langsung menambahkan geolocation sendiri.
2. Endpoint membaca header geolocation Vercel (`x-vercel-ip-city`, `x-vercel-ip-country`, `x-vercel-ip-latitude`, `x-vercel-ip-longitude`, dan region jika tersedia).
3. Endpoint membuat `visitor_hash` dari alamat sumber request menggunakan SHA-256 dengan salt server-side/fallback deployment salt; IP mentah tidak pernah dikembalikan ke browser atau disimpan ke Supabase.
4. Endpoint menyimpan event ke `rentcam_events` melalui Supabase dengan `meta.geo` dan `meta.visitor_hash`.
5. CMS Analytics membaca metadata baru dan tetap kompatibel dengan event lama yang tidak memiliki data lokasi.
6. Nama produk di-resolve dari katalog `P`, `cfg.productOverrides`, dan `cfg.customProducts` berdasarkan `product_id`.
7. Peta menggunakan Leaflet + OpenStreetMap. Marker dikelompokkan berdasarkan kota/koordinat kasar; popup menampilkan kota/region/negara serta jumlah page view dan product click.

## Privacy constraints
- Jangan simpan IP mentah.
- Jangan meminta GPS browser.
- Jangan menampilkan alamat jalan atau koordinat presisi sebagai identitas individu.
- Latitude/longitude yang berasal dari geolocation IP dibulatkan untuk peta agregat.
- `visitor_hash` hanya dipakai untuk statistik pengunjung unik, bukan identifikasi personal.

## CMS output
Analytics menampilkan:
- total product clicks 7 hari;
- Top Produk: Nama Produk, ID, jumlah klik;
- Top Lokasi: Kota/Region/Negara, jumlah event;
- Aktivitas Terbaru: Event, Nama Produk/Halaman, Lokasi, Waktu;
- peta agregat lokasi klik/kunjungan;
- jumlah pengunjung unik anonim bila metadata tersedia.

## Compatibility
Event lama tetap tampil dengan lokasi `Tidak diketahui`. Website publik tidak berubah secara visual. Tracking gagal tidak boleh memblokir navigasi atau interaksi produk.

## Testing
- Unit test normalisasi geo, pembulatan koordinat, visitor hash shape, agregasi nama produk, dan grouping lokasi.
- Endpoint test untuk payload invalid dan metadata geo.
- Preview Vercel harus menunjukkan `/`, `/cms`, endpoint analytics, dan asset analytics 200 sebelum production.
