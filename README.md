# Learn Track API Documentation (v1.2)

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

Mengambil data dashboard yang dikelompokkan berdasarkan Learning Path. Endpoint ini hanya mengembalikan Learning Path di mana pengguna memiliki setidaknya satu course yang sedang diikuti. Data mencakup persentase progres rata-rata per path dan detail status untuk setiap course di dalamnya.

- **Authentication:** `Protected`

- **URL Parameters:** Tidak ada

- **Request Body:** Tidak ada

- **Success Response:** `200 OK`

  ```json
  [
    {
      "path_id": "uuid-path-android",
      "path_name": "Android Learning Path",
      "path_progress_percent": 55,
      "courses": [
        {
          "course_id": "uuid-course-1",
          "course_name": "Memulai Pemrograman dengan Kotlin",
          "enrollment_id": "uuid-enrollment-1",
          "progress_percent": 100,
          "order": 1
        },
        {
          "course_id": "uuid-course-2",
          "course_name": "Belajar Membuat Aplikasi Android untuk Pemula",
          "enrollment_id": "uuid-enrollment-2",
          "progress_percent": 10,
          "order": 2
        },
        {
          "course_id": "uuid-course-3",
          "course_name": "Belajar Pengembangan Aplikasi Android Intermediate",
          "enrollment_id": null,
          "progress_percent": 0,
          "order": 3
        }
      ]
    },
    {
      "path_id": "uuid-path-web",
      "path_name": "Web Development Learning Path",
      "path_progress_percent": 10,
      "courses": [
        {
          "course_id": "uuid-course-4",
          "course_name": "Belajar Dasar Pemrograman Web",
          "enrollment_id": "uuid-enrollment-3",
          "progress_percent": 20,
          "order": 1
        }
      ]
    }
  ]
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

### `GET /api/dashboard/recommendations`

mengambil rekomendasi langkah pembelajaran berikutnya berdasarkan progres setiap course yang sedang diambil oleh pengguna. Sistem akan mencari tutorial pertama yang belum selesai dari setiap enrollment.

- **Authentication:** `Protected`

- **URL Parameters:** `Tidak ada`

- **Request Body:** `Tidak ada`

- **Success Response:** `200 OK`

  ```json
  [
    {
      "learning_path": "Android Learning Path",
      "course_name": "Belajar Dasar Kotlin",
      "enrollment_id": "uuid-enrollment-1",
      "next_step": {
        "tutorial_id": "uuid-modul-2",
        "title": "Modul 2: Variabel dan Tipe Data",
        "order": 2
      }
    }
  ]
  ```

- **Error Response:** `500 Internal Server Error`

  ```json
  {
    "error": "Error message from server"
  }
  ```
