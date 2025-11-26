# Learn Track API Documentation (v1.1)

Dokumentasi ini merinci _endpoint_ API untuk layanan _backend_ Learn Track.

**Base URL:** `https://learn-track-backend-production.up.railway.app/`

**Autentikasi:**
_Endpoint_ yang dilindungi (`Protected`) memerlukan _header_ `Authorization` dengan _Bearer Token_ yang valid.

`Authorization: Bearer [YOUR_ACCESS_TOKEN]`

## \#\# Auth Endpoints

_Endpoint_ publik untuk mengelola autentikasi pengguna.

---

### `POST /api/auth/register`

Mendaftarkan pengguna baru ke dalam sistem.

- **Authentication:** `Public`

- **Request Body:** `application/json`

  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123",
    "name": "Nama Lengkap Pengguna"
  }
  ```

- **Success Response:** `201 Created`

  ```json
  {
    "user": {
      "id": "uuid-user-id",
      "email": "user@example.com",
      "created_at": "...",
      "user_metadata": {
        "full_name": "Nama Lengkap Pengguna"
      }
    },
    "session": {
      "access_token": "eyJh...[jwt]...",
      "token_type": "bearer",
      "expires_in": 3600,
      "user": { ... }
    }
  }
  ```

- **Error Response:** `400 Bad Request`

  ```json
  {
    "error": "Email, password, and name are required"
  }
  ```

---

### `POST /api/auth/login`

Melakukan _login_ untuk pengguna yang sudah ada dan mengembalikan _session_ (termasuk _access token_).

- **Authentication:** `Public`

- **Request Body:** `application/json`

  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123"
  }
  ```

- **Success Response:** `200 OK`

  ```json
  {
    "user": {
      "id": "uuid-user-id",
      "email": "user@example.com",
      ...
    },
    "session": {
      "access_token": "eyJh...[jwt]...",
      "token_type": "bearer",
      ...
    }
  }
  ```

- **Error Response:** `400 Bad Request`

  ```json
  {
    "error": "Invalid login credentials"
  }
  ```

## \#\# Dashboard Endpoints

_Endpoint_ yang terkait dengan _dashboard_ progres belajar pengguna.

**Catatan: Semua _endpoint_ di bagian ini `Protected`.**

---

### `GET /api/dashboard`

Mengambil data _dashboard_ utama untuk pengguna yang terautentikasi. Ini mengembalikan daftar semua _course_ yang sedang diikuti (_enrollments_) beserta persentase progres totalnya.

- **Authentication:** `Protected`

- **URL Parameters:** Tidak ada

- **Request Body:** Tidak ada

- **Success Response:** `200 OK`

  ```json
  {
    "user": {
      "name": "jaemin",
      "email": "jemin123@gmail.com"
    },
    "enrollments": [
      {
        "enrollment_id": "63fa9c9b-d14a-4621-9dbd-02b41c7c0399",
        "course": {
          "course_id": "uuid-course-id",
          "name": "Belajar Dasar JavaScript",
          "learning_path": "Web Development"
        },
        "progress_percent": 25.0
      }
    ]
  }
  ```

- **Error Response:** `401 Unauthorized`

  ```json
  {
    "error": "Unauthorized: No token provided"
  }
  ```

---

### `GET /api/dashboard/:enrollmentId`

Mengambil data detail untuk satu _enrollment_ (satu _course_ spesifik). Ini mengembalikan status untuk **setiap modul/tutorial** di dalam _course_ tersebut.

- **Authentication:** `Protected`

- **URL Parameters:**

  - `enrollmentId` (string, UUID): ID unik dari _enrollment_ (didapat dari _endpoint_ `GET /api/dashboard`).

- **Request Body:** Tidak ada

- **Success Response:** `200 OK`

  ```json
  {
    "enrollment_id": "63fa9c9b-d14a-4621-9dbd-02b41c7c0399",
    "course_name": "Belajar Dasar JavaScript",
    "progress_percent": 25.0,
    "tutorials": [
      {
        "tutorial_id": "uuid-tutorial-1",
        "title": "Modul 1: Pengenalan",
        "order": 1,
        "status": "completed"
      },
      {
        "tutorial_id": "uuid-tutorial-2",
        "title": "Modul 2: Variabel",
        "order": 2,
        "status": "not_started"
      },
      {
        "tutorial_id": "uuid-tutorial-3",
        "title": "Modul 3: Tipe Data",
        "order": 3,
        "status": "not_started"
      }
    ]
  }
  ```

- **Error Response:** `404 Not Found`

  ```json
  {
    "error": "Enrollment not found or you do not have access."
  }
  ```

### `GET /api/progress/tutorials/:tutorialId`

memperbarui status modul (misalnya, dari not_started menjadi completed) dan mengembalikan persentase progres course yang baru.

- **Authentication:** `Protected`

- **URL Parameters:**

  - `:tutorialId` (string, UUID): ID unik course yang didapatkan dari GET /api/dashboard/:enrollmentId. Dari respons JSON, salin tutorial_id dari salah satu modul yang statusnya 'not_started'.

- **Request Body:**

  ```json
  {
    "status": "complated"
  }
  ```

- **Success Response:** `200 OK`

  ```json
  {
    "message": "Progress updated successfully",
    "tutorial_id": "c53f9fdf-9592-4739-b824-5ffe7485a44d",
    "new_status": "completed",
    "new_course_progress": 2.56410256410256
  }
  ```

- **Error Response:** `404 Not Found`

  ```json
  {
    "error": "Tutorial not found"
  }
  ```
