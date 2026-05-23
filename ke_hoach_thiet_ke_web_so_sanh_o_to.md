# Kế hoạch thiết kế web app so sánh ô tô

**Mục tiêu:** Xây dựng một website so sánh xe ô tô tương tự mô hình nội dung của NanoReview: có trang danh sách, trang chi tiết, trang so sánh 2 xe, bảng xếp hạng, hệ thống bình luận có duyệt, và khu vực Admin nhập/quản trị dữ liệu.

**Đối tượng sử dụng:**
- Khách truy cập: tìm xe, xem thông số, so sánh, đọc đánh giá, bình luận bằng email cá nhân.
- Admin/Editor: nhập xe, thông số, hình ảnh, điểm đánh giá, duyệt bình luận.
- Google Search/Bot: cần đọc được nội dung nhanh, URL rõ ràng, dữ liệu có cấu trúc.

---

## 1. Benchmark mô hình NanoReview

Website tham chiếu có các nhóm nội dung chính:

1. Trang chủ hiển thị:
   - Danh mục sản phẩm.
   - Model mới thêm.
   - So sánh phổ biến.
   - Bảng xếp hạng.
   - Bình luận mới nhất.

2. Trang chi tiết sản phẩm:
   - Thông số kỹ thuật.
   - Điểm đánh giá.
   - Ưu/nhược điểm.
   - So sánh nhanh với model khác.
   - Bình luận.

3. Trang so sánh:
   - So sánh 2 sản phẩm theo từng nhóm thông số.
   - Highlight bên tốt hơn.
   - Điểm tổng kết.
   - Bình luận theo cặp so sánh.

4. Trang ranking:
   - Danh sách xếp hạng theo điểm, tiêu chí hoặc phân khúc.

Áp dụng sang ô tô:
- Xe mới thêm.
- So sánh phổ biến: “Toyota Vios vs Hyundai Accent”, “Mazda CX-5 vs Honda CR-V”.
- Ranking: xe tiết kiệm xăng, xe SUV 5 chỗ, xe sedan hạng B, xe điện, xe dưới 700 triệu.
- Bình luận mới nhất sau khi đã được Admin duyệt.

---

## 2. Phạm vi chức năng MVP

### 2.1 Chức năng dành cho khách

#### Trang chủ
- Thanh tìm kiếm xe.
- Danh mục nhanh:
  - Sedan
  - SUV/Crossover
  - Hatchback
  - MPV
  - Pickup
  - Electric/Hybrid
- Xe mới cập nhật.
- So sánh phổ biến.
- Bảng xếp hạng nổi bật.
- Bình luận mới được duyệt.

#### Trang danh sách xe
- Lọc theo:
  - Hãng xe
  - Loại thân xe
  - Khoảng giá
  - Số chỗ
  - Nhiên liệu
  - Hộp số
  - Dẫn động
  - Năm ra mắt
- Sắp xếp theo:
  - Điểm tổng
  - Giá tăng/giảm
  - Mức tiêu hao nhiên liệu
  - Công suất
  - Lượt xem
  - Bình luận

#### Trang chi tiết xe
Mỗi xe cần có:
- Tên xe, đời xe, phiên bản.
- Ảnh đại diện và gallery.
- Giá niêm yết/tham khảo.
- Điểm tổng.
- Điểm theo nhóm:
  - Thiết kế
  - Nội thất
  - Động cơ/vận hành
  - An toàn
  - Công nghệ
  - Chi phí sử dụng
  - Giá trị mua lại
- Ưu điểm.
- Nhược điểm.
- Thông số kỹ thuật chi tiết.
- Xe cùng phân khúc.
- So sánh nhanh.
- Bình luận đã duyệt.

#### Trang so sánh 2 xe
URL đề xuất:

```text
/compare/toyota-vios-2025-vs-hyundai-accent-2025
```

Nội dung:
- Header: tên 2 xe, ảnh, giá, điểm tổng.
- Bảng điểm theo nhóm.
- Bảng thông số theo nhóm:
  - Tổng quan
  - Kích thước
  - Động cơ
  - Hộp số/dẫn động
  - Mức tiêu hao nhiên liệu
  - Trang bị ngoại thất
  - Nội thất/tiện nghi
  - An toàn
  - Bảo hành/chi phí
- Highlight thông số tốt hơn.
- Kết luận tự động theo logic điểm.
- CTA: “Chọn xe A nếu…”, “Chọn xe B nếu…”.
- Bình luận cho cặp so sánh.

#### Bình luận khách
Yêu cầu:
- Khách nhập:
  - Tên hiển thị
  - Email cá nhân
  - Nội dung bình luận
- Email không hiển thị công khai.
- 1 IP chỉ được gửi 1 bình luận cho cùng một đối tượng nội dung.
- Bình luận phải chờ Admin duyệt.
- Có chống spam.

Gợi ý quy tắc:
- Một IP chỉ được comment một lần trên mỗi `target_type + target_id`.
- `target_type` có thể là:
  - `car`
  - `comparison`
  - `ranking`
- Lưu IP dạng hash, không lưu IP plain text nếu không cần.
- Dùng CAPTCHA hoặc Turnstile cho form comment.
- Rate limit toàn site.

---

## 3. Chức năng Admin

### 3.1 Phân quyền

Vai trò đề xuất:

#### Super Admin
- Quản lý toàn bộ hệ thống.
- Tạo/sửa/xóa Admin khác.
- Cấu hình SEO, danh mục, hệ thống.

#### Admin
- Thêm/sửa/xóa xe.
- Nhập thông số.
- Tạo bài ranking.
- Duyệt bình luận.

#### Editor
- Thêm/sửa nội dung xe.
- Không được xóa dữ liệu quan trọng.
- Không được quản lý user.

#### Moderator
- Chỉ duyệt/ẩn/xóa bình luận.

### 3.2 Dashboard Admin

Các module:
- Tổng quan:
  - Số xe
  - Số so sánh
  - Số comment chờ duyệt
  - Lượt xem theo ngày
  - Trang có traffic cao
- Quản lý hãng xe.
- Quản lý dòng xe/model.
- Quản lý phiên bản/trim.
- Quản lý thông số kỹ thuật.
- Quản lý điểm đánh giá.
- Quản lý bài ranking.
- Quản lý bình luận.
- Quản lý media.
- Quản lý SEO metadata.

### 3.3 Nhập dữ liệu xe

Nên chia thành các bước:

1. Thông tin cơ bản:
   - Hãng
   - Model
   - Phiên bản
   - Năm
   - Phân khúc
   - Loại thân xe
   - Quốc gia thương hiệu
   - Tình trạng bán tại Việt Nam

2. Giá:
   - Giá niêm yết
   - Giá lăn bánh dự kiến theo tỉnh/thành
   - Ngày cập nhật giá

3. Động cơ/vận hành:
   - Loại động cơ
   - Dung tích
   - Công suất
   - Mô-men xoắn
   - Hộp số
   - Dẫn động
   - Tăng tốc 0-100 km/h nếu có
   - Tốc độ tối đa nếu có

4. Kích thước:
   - Dài/rộng/cao
   - Chiều dài cơ sở
   - Khoảng sáng gầm
   - Bán kính vòng quay
   - Dung tích bình nhiên liệu/pin
   - Dung tích khoang hành lý

5. Tiêu hao/năng lượng:
   - Trong đô thị
   - Ngoài đô thị
   - Kết hợp
   - Quãng đường điện nếu là EV/PHEV

6. Trang bị:
   - Ngoại thất
   - Nội thất
   - Màn hình/giải trí
   - Điều hòa
   - Ghế
   - Cửa sổ trời
   - Camera/cảm biến

7. An toàn:
   - Số túi khí
   - ABS/EBD/BA
   - ESC/TCS
   - ADAS
   - Camera 360
   - Cảnh báo điểm mù
   - Kiểm soát hành trình thích ứng
   - Điểm NCAP nếu có

8. Đánh giá:
   - Ưu điểm
   - Nhược điểm
   - Điểm từng hạng mục
   - Kết luận ngắn

---

## 4. Kiến trúc thông tin và URL

### 4.1 Sitemap chính

```text
/
/cars
/cars/[brand]
/cars/[brand]/[model]
/cars/[brand]/[model]/[year]-[trim]
/compare
/compare/[car-a]-vs-[car-b]
/rankings
/rankings/best-suv-under-1-billion
/rankings/best-fuel-efficient-cars
/news
/news/[slug]
/admin
/admin/cars
/admin/comments
/admin/rankings
/admin/settings
```

### 4.2 Quy tắc slug

Ví dụ:

```text
toyota-vios-2025-g-cvt
hyundai-accent-2025-1-5-special
mazda-cx-5-2025-premium
```

Quy tắc:
- Chữ thường.
- Không dấu tiếng Việt.
- Dùng dấu gạch ngang.
- Không thay đổi slug sau khi publish; nếu đổi phải tạo redirect 301.

---

## 5. Đề xuất công nghệ

### 5.1 Frontend

Đề xuất: **Next.js App Router**

Lý do:
- Hỗ trợ Server-Side Rendering và Static Site Generation tốt cho SEO.
- Dễ tạo route động cho hàng nghìn trang xe và so sánh.
- Dễ sinh metadata động, sitemap, robots.txt.
- Có thể deploy nhanh trên Vercel.

### 5.2 Backend

Có 2 hướng:

#### Hướng A — Supabase + Next.js API
Phù hợp nếu muốn triển khai nhanh.

Thành phần:
- Supabase PostgreSQL
- Supabase Auth cho Admin
- Supabase Storage cho ảnh
- Row Level Security
- Next.js Server Actions/API Routes

Ưu điểm:
- Nhanh ra MVP.
- PostgreSQL mạnh cho dữ liệu quan hệ.
- Có dashboard quản trị DB.
- Dễ mở rộng.

#### Hướng B — NestJS/Fastify + PostgreSQL riêng
Phù hợp nếu muốn backend chuẩn enterprise.

Thành phần:
- Backend API riêng.
- PostgreSQL/Neon/Supabase DB.
- Redis cache.
- S3-compatible storage.
- Queue cho xử lý ảnh/sitemap.

Ưu điểm:
- Kiểm soát tốt hơn.
- Dễ tách service khi scale.

Khuyến nghị MVP: **Next.js + Supabase + PostgreSQL + Cloudflare/Vercel**.

---

## 6. Database schema đề xuất

### 6.1 Bảng người dùng Admin

```sql
users_admin
- id uuid primary key
- email text unique not null
- full_name text
- role text check role in ('super_admin','admin','editor','moderator')
- status text check status in ('active','disabled')
- created_at timestamp
- updated_at timestamp
```

### 6.2 Hãng xe

```sql
brands
- id uuid primary key
- name text not null
- slug text unique not null
- country text
- logo_url text
- description text
- meta_title text
- meta_description text
- created_at timestamp
- updated_at timestamp
```

### 6.3 Model xe

```sql
car_models
- id uuid primary key
- brand_id uuid references brands(id)
- name text not null
- slug text unique not null
- segment text
- body_type text
- description text
- status text check status in ('draft','published','archived')
- created_at timestamp
- updated_at timestamp
```

### 6.4 Phiên bản xe

```sql
car_variants
- id uuid primary key
- model_id uuid references car_models(id)
- name text not null
- slug text unique not null
- year int
- price_vnd numeric
- price_updated_at date
- fuel_type text
- transmission text
- drivetrain text
- seats int
- doors int
- origin text
- warranty text
- thumbnail_url text
- summary text
- pros jsonb
- cons jsonb
- total_score numeric
- status text check status in ('draft','published','archived')
- published_at timestamp
- created_at timestamp
- updated_at timestamp
```

### 6.5 Thông số kỹ thuật dạng linh hoạt

```sql
spec_groups
- id uuid primary key
- name text not null
- slug text unique not null
- sort_order int
```

```sql
spec_fields
- id uuid primary key
- group_id uuid references spec_groups(id)
- name text not null
- slug text unique not null
- unit text
- data_type text check data_type in ('text','number','boolean','option')
- higher_is_better boolean default false
- lower_is_better boolean default false
- sort_order int
```

```sql
car_variant_specs
- id uuid primary key
- car_variant_id uuid references car_variants(id)
- spec_field_id uuid references spec_fields(id)
- value_text text
- value_number numeric
- value_boolean boolean
- source_url text
- updated_at timestamp
```

### 6.6 Điểm đánh giá

```sql
rating_categories
- id uuid primary key
- name text not null
- slug text unique not null
- weight numeric
- sort_order int
```

```sql
car_variant_ratings
- id uuid primary key
- car_variant_id uuid references car_variants(id)
- category_id uuid references rating_categories(id)
- score numeric check score >= 0 and score <= 10
- note text
```

### 6.7 So sánh phổ biến

Có thể sinh tự động từ lượt xem, nhưng nên có bảng cache:

```sql
comparisons
- id uuid primary key
- car_a_id uuid references car_variants(id)
- car_b_id uuid references car_variants(id)
- slug text unique not null
- view_count int default 0
- comment_count int default 0
- summary text
- status text check status in ('published','hidden')
- created_at timestamp
- updated_at timestamp
```

### 6.8 Bình luận

```sql
comments
- id uuid primary key
- target_type text check target_type in ('car','comparison','ranking')
- target_id uuid not null
- parent_id uuid references comments(id)
- display_name text not null
- email_hash text not null
- ip_hash text not null
- user_agent_hash text
- content text not null
- status text check status in ('pending','approved','rejected','spam')
- moderation_note text
- approved_by uuid references users_admin(id)
- approved_at timestamp
- created_at timestamp
```

Ràng buộc một IP chỉ comment một lần cho cùng nội dung:

```sql
create unique index unique_comment_ip_per_target
on comments(target_type, target_id, ip_hash)
where parent_id is null;
```

Nếu muốn cho phép reply, có thể áp dụng rule riêng cho `parent_id`.

### 6.9 Audit log

```sql
audit_logs
- id uuid primary key
- actor_id uuid references users_admin(id)
- action text not null
- entity_type text not null
- entity_id uuid
- before_data jsonb
- after_data jsonb
- created_at timestamp
```

---

## 7. Luồng xử lý bình luận

### 7.1 Flow khách gửi comment

```text
Khách nhập comment
→ Validate form
→ Kiểm tra CAPTCHA
→ Lấy IP thật qua proxy header
→ Hash IP + salt
→ Kiểm tra unique target_type + target_id + ip_hash
→ Nếu chưa có: lưu status = pending
→ Gửi thông báo cho Admin
→ Hiển thị: “Bình luận đang chờ duyệt”
```

### 7.2 Flow Admin duyệt

```text
Admin mở danh sách pending
→ Xem nội dung, target page, email hash, IP hash
→ Approve / Reject / Spam
→ Nếu approve: comment hiển thị public
→ Cập nhật comment_count
```

### 7.3 Chống spam

- CAPTCHA/Turnstile.
- Honeypot field ẩn.
- Rate limit theo IP.
- Chặn link quá nhiều.
- Chặn từ khóa spam.
- Giới hạn độ dài nội dung.
- Không cho comment trùng nội dung trong thời gian ngắn.

### 7.4 Bảo vệ dữ liệu cá nhân

- Không hiển thị email.
- Hash email bằng SHA-256 + salt.
- Hash IP bằng SHA-256 + salt.
- Có trang Privacy Policy.
- Có cơ chế xóa comment nếu người dùng yêu cầu.

---

## 8. SEO và Google Search

### 8.1 Rendering

Website nên dùng:
- SSR cho trang chi tiết xe.
- SSG/ISR cho trang xe ít thay đổi.
- SSR hoặc ISR cho trang so sánh.
- Không phụ thuộc hoàn toàn vào client-side rendering cho nội dung quan trọng.

Nội dung quan trọng phải có trong HTML ban đầu:
- Tên xe.
- Giá.
- Thông số chính.
- Bảng so sánh.
- Kết luận.
- Internal links.

### 8.2 Metadata

Mỗi trang cần:
- Title unique.
- Meta description unique.
- Canonical URL.
- Open Graph title/description/image.
- Twitter card.
- Breadcrumb.

Ví dụ title:

```text
Toyota Vios 2025: Giá, thông số, đánh giá và so sánh
```

Ví dụ comparison title:

```text
Toyota Vios 2025 vs Hyundai Accent 2025: So sánh chi tiết
```

### 8.3 Structured data JSON-LD

Nên dùng:
- `Car` hoặc `Vehicle` cho trang xe.
- `Product`/`Car` kết hợp `AggregateRating` nếu có hệ thống điểm hợp lệ.
- `Review` nếu có bài đánh giá biên tập.
- `BreadcrumbList` cho mọi trang sâu.
- `Article` cho bài tin tức/hướng dẫn.
- `ItemList` cho ranking/listing.

Ví dụ JSON-LD cơ bản cho xe:

```json
{
  "@context": "https://schema.org",
  "@type": "Car",
  "name": "Toyota Vios 2025 G CVT",
  "brand": {
    "@type": "Brand",
    "name": "Toyota"
  },
  "model": "Vios",
  "vehicleModelDate": "2025",
  "bodyType": "Sedan",
  "fuelType": "Gasoline",
  "vehicleTransmission": "CVT",
  "numberOfDoors": 4,
  "seatingCapacity": 5,
  "offers": {
    "@type": "Offer",
    "priceCurrency": "VND",
    "price": "545000000",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "8.2",
    "bestRating": "10",
    "worstRating": "0",
    "ratingCount": "12"
  }
}
```

### 8.4 Sitemap

Cần sinh sitemap tự động:

```text
/sitemap.xml
/sitemaps/cars.xml
/sitemaps/comparisons.xml
/sitemaps/rankings.xml
/sitemaps/news.xml
```

Mỗi URL có:
- loc
- lastmod
- priority tùy loại trang

### 8.5 Internal linking

Trên mỗi trang xe:
- Link đến hãng.
- Link đến model cùng phân khúc.
- Link đến các so sánh phổ biến.
- Link đến ranking liên quan.

Trên trang so sánh:
- Link về từng xe.
- Link đến các so sánh tương tự.
- Link đến ranking cùng phân khúc.

### 8.6 Core Web Vitals

Yêu cầu kỹ thuật:
- Ảnh dùng định dạng WebP/AVIF.
- Lazy load ảnh dưới fold.
- Preload ảnh hero.
- Giảm JavaScript client.
- Cache CDN.
- Font tối ưu.
- Bảng so sánh có HTML semantic, không render hoàn toàn bằng JS.

---

## 9. Công thức điểm so sánh

### 9.1 Điểm tổng xe

Đề xuất trọng số:

```text
Thiết kế: 10%
Nội thất: 15%
Vận hành: 20%
An toàn: 20%
Công nghệ: 10%
Chi phí sử dụng: 15%
Giá trị mua lại: 10%
```

Điểm tổng:

```text
total_score = sum(category_score * category_weight)
```

### 9.2 Highlight bên thắng trong bảng so sánh

Mỗi spec field có rule:
- `higher_is_better = true`: công suất, mô-men xoắn, dung tích cốp, khoảng sáng gầm.
- `lower_is_better = true`: giá, tiêu hao nhiên liệu, tăng tốc 0-100 nếu tính thời gian.
- Neutral: màu sắc, loại hộp số, loại ghế.

### 9.3 Kết luận tự động

Ví dụ logic:

```text
Nếu xe A hơn xe B >= 0.5 điểm:
  “Xe A phù hợp hơn nếu bạn ưu tiên tổng thể.”
Nếu xe B có chi phí thấp hơn >= 10%:
  “Xe B đáng cân nhắc nếu ngân sách là yếu tố quan trọng.”
Nếu xe A có điểm an toàn cao hơn:
  “Xe A phù hợp hơn cho gia đình.”
```

Admin nên có quyền sửa phần kết luận để tránh nội dung máy móc.

---

## 10. Thiết kế giao diện

### 10.1 Phong cách

- Sạch, nhanh, tập trung vào thông tin.
- Bảng so sánh dễ đọc trên mobile.
- Dùng màu highlight vừa phải:
  - Xanh cho tốt hơn.
  - Xám cho ngang nhau.
  - Đỏ/cam cho điểm yếu.

### 10.2 Component chính

- Header navigation.
- Search autocomplete.
- Car card.
- Compare selector.
- Score ring/bar.
- Specs table.
- Pros/cons box.
- Ranking list.
- Comment list.
- Admin data form.
- Moderation queue.

### 10.3 Mobile UX

Trang so sánh trên mobile nên:
- Sticky header 2 xe.
- Có tab nhóm thông số.
- Cho collapse/expand từng nhóm.
- Không dùng bảng quá rộng bắt người dùng kéo ngang quá nhiều.

---

## 11. API endpoint đề xuất

### Public API

```text
GET /api/cars
GET /api/cars/:slug
GET /api/brands
GET /api/compare?carA=slug-a&carB=slug-b
GET /api/rankings/:slug
POST /api/comments
```

### Admin API

```text
POST /api/admin/cars
PATCH /api/admin/cars/:id
DELETE /api/admin/cars/:id
POST /api/admin/specs
PATCH /api/admin/specs/:id
GET /api/admin/comments?status=pending
POST /api/admin/comments/:id/approve
POST /api/admin/comments/:id/reject
POST /api/admin/comments/:id/spam
```

---

## 12. Bảo mật

- Admin bắt buộc đăng nhập.
- Bật 2FA nếu có thể.
- RBAC theo role.
- Validate tất cả input bằng schema validation.
- Sanitize HTML comment để tránh XSS.
- CSRF protection cho form Admin nếu dùng cookie auth.
- Rate limit API public.
- Log mọi thao tác chỉnh sửa dữ liệu.
- Backup database hằng ngày.
- Không public key/service role bí mật ra frontend.

---

## 13. Quy trình nhập và kiểm duyệt dữ liệu

### 13.1 Dữ liệu xe

```text
Editor nhập draft
→ Admin review
→ Kiểm tra nguồn dữ liệu
→ Publish
→ Sitemap cập nhật
→ Cache revalidate
```

### 13.2 Bình luận

```text
Khách gửi comment
→ Pending
→ Moderator/Admin duyệt
→ Public
```

### 13.3 Cập nhật giá/thông số

- Mọi thay đổi giá phải lưu ngày cập nhật.
- Nếu có nguồn, lưu source URL nội bộ.
- Lịch review dữ liệu: 1 lần/tháng hoặc khi hãng công bố thay đổi.

---

## 14. Kế hoạch triển khai theo giai đoạn

### Giai đoạn 1 — Discovery & UX
Thời gian: 1-2 tuần

Deliverables:
- Sitemap.
- Wireframe.
- Data model chi tiết.
- Quy tắc điểm.
- UI kit cơ bản.

### Giai đoạn 2 — MVP core
Thời gian: 4-6 tuần

Deliverables:
- Trang chủ.
- Trang danh sách xe.
- Trang chi tiết xe.
- Trang so sánh 2 xe.
- Admin nhập xe.
- Bình luận pending.
- SEO cơ bản.

### Giai đoạn 3 — Ranking & SEO nâng cao
Thời gian: 2-4 tuần

Deliverables:
- Ranking pages.
- JSON-LD.
- Sitemap split.
- Internal link automation.
- Trang tin tức/hướng dẫn.

### Giai đoạn 4 — Tối ưu & scale
Thời gian: 2-4 tuần

Deliverables:
- Cache/CDN.
- Search nâng cao.
- Analytics dashboard.
- Import CSV.
- Audit log.
- Backup/restore.

---

## 15. Checklist nghiệm thu MVP

### Public site
- [ ] Trang chủ load nhanh.
- [ ] Tìm kiếm xe hoạt động.
- [ ] Trang danh sách có filter/sort.
- [ ] Trang chi tiết có đầy đủ thông số.
- [ ] Trang so sánh highlight đúng.
- [ ] Bình luận gửi được và vào pending.
- [ ] Comment approved mới hiển thị.
- [ ] Một IP không comment trùng cùng target.

### Admin
- [ ] Admin login được.
- [ ] Phân quyền hoạt động.
- [ ] Thêm/sửa/xóa draft xe.
- [ ] Publish/unpublish xe.
- [ ] Duyệt/reject comment.
- [ ] Có audit log.

### SEO
- [ ] Mỗi trang có title/meta description riêng.
- [ ] Có canonical.
- [ ] Có sitemap.xml.
- [ ] Có robots.txt.
- [ ] Có JSON-LD hợp lệ.
- [ ] Nội dung chính có trong HTML server-rendered.
- [ ] URL thân thiện.
- [ ] Redirect 301 khi đổi slug.

### Bảo mật
- [ ] Không lộ email/IP raw.
- [ ] Có rate limit.
- [ ] Có CAPTCHA.
- [ ] Comment được sanitize.
- [ ] Admin API được bảo vệ.
- [ ] Backup database.

---

## 16. Đề xuất stack triển khai cụ thể

### MVP stack khuyến nghị

```text
Frontend: Next.js + TypeScript + Tailwind CSS
Backend: Next.js Server Actions/API Routes
Database: Supabase PostgreSQL
Auth Admin: Supabase Auth
Storage: Supabase Storage hoặc Cloudflare R2
Cache/CDN: Vercel Edge + Cloudflare
Search: PostgreSQL full-text search ban đầu
Captcha: Cloudflare Turnstile
Analytics: Plausible / Umami / Google Search Console
Error tracking: Sentry
```

### Khi scale lớn

```text
Search nâng cao: Meilisearch / Typesense / Algolia
Cache: Redis
Queue: BullMQ / Cloudflare Queues
Image pipeline: Cloudinary / Imgix
Backend riêng: NestJS / Fastify
Database read replica: PostgreSQL replica
```

---

## 17. Rủi ro và cách giảm thiểu

### Rủi ro dữ liệu sai
Giải pháp:
- Lưu nguồn dữ liệu.
- Có workflow duyệt trước publish.
- Hiển thị ngày cập nhật.

### Rủi ro SEO kém do nội dung render bằng JS
Giải pháp:
- Dùng SSR/SSG/ISR.
- Đưa thông số chính vào HTML ban đầu.
- Test bằng URL Inspection và Rich Results Test.

### Rủi ro spam comment
Giải pháp:
- Pending moderation.
- CAPTCHA.
- Hash IP + unique constraint.
- Rate limit.

### Rủi ro database phức tạp vì thông số xe thay đổi
Giải pháp:
- Dùng mô hình `spec_groups`, `spec_fields`, `car_variant_specs` linh hoạt.
- Các field quan trọng vẫn nên có cột riêng để filter nhanh.

---

## 18. Việc cần chuẩn bị trước khi code

1. Danh sách hãng xe và model ưu tiên.
2. Bộ thông số chuẩn cho từng loại xe.
3. Quy tắc tính điểm.
4. Thiết kế wireframe.
5. Chính sách bình luận và quyền riêng tư.
6. Tên miền, hosting, tài khoản Supabase/Vercel/Cloudflare.
7. File mẫu import dữ liệu xe bằng CSV/Excel.

---

## 19. Kết luận

Nên xây dựng theo hướng **content database + comparison engine + SEO-first frontend**. Với mục tiêu thân thiện Google Search, toàn bộ trang xe và trang so sánh cần được render server-side/static, có URL rõ ràng, metadata riêng, sitemap tự động và JSON-LD hợp lệ.

Đối với MVP, stack **Next.js + Supabase PostgreSQL** là lựa chọn hợp lý vì triển khai nhanh, đủ mạnh cho dữ liệu quan hệ, có Auth/Admin, và dễ mở rộng sau này.
