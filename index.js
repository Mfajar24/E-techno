const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const upload = require('./config/multer');

const app = express();
const db = new sqlite3.Database('./registration.db');
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ------------------ Upload Config ------------------

const tugasStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/tugas'),
    filename: (req, file, cb) => cb(null, 'tugas-' + Date.now() + path.extname(file.originalname))
});
const uploadTugas = multer({ storage: tugasStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: upload.fileFilter });

const uploadJawaban = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'public/uploads/jawaban'),
        filename: (req, file, cb) => cb(null, 'jawaban-' + Date.now() + '-' + file.originalname)
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});


const galeriStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/galeri'),
    filename: (req, file, cb) => cb(null, 'galeri-' + Date.now() + path.extname(file.originalname))
  });
  const uploadGaleri = multer({
    storage: galeriStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Format file tidak didukung'), false);
      }
    }
  });

  
// ------------------ Autentikasi ------------------

app.post('/register', (req, res) => {
    const { name, class: className, studentId, email, password, role } = req.body;
    if (!name || !className || !studentId || !email || !password || !role) {
        return res.status(400).json({ error: 'Semua field harus diisi.' });
    }

    db.get('SELECT * FROM users WHERE student_id = ? OR email = ?', [studentId, email], (err, row) => {
        if (row) return res.status(400).json({ error: 'Email atau Student ID sudah digunakan.' });

        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Gagal hash password' });

            db.run(`INSERT INTO users (name, class, student_id, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
                [name, className, studentId, email, hash, role],
                function (err) {
                    if (err) return res.status(400).json({ error: err.message });
                    res.json({ message: 'Register berhasil', userId: this.lastID });
                });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

        bcrypt.compare(password, user.password, (err, result) => {
            if (!result) return res.status(401).json({ error: 'Password salah' });

            res.json({ message: 'Login berhasil', user: { id: user.id, name: user.name, role: user.role, student_id: user.student_id } });
        });
    });
});

// ------------------ Manajemen Pengguna ------------------

app.get('/users', (req, res) => {
    db.all("SELECT id, name, class, student_id, email, role FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Ambil detail pengguna
app.get('/users/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT id, name, class, student_id, email, role FROM users WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        res.json(row);
    });
});

// Edit pengguna
app.put('/users/:id', (req, res) => {
    const { name, class: className, studentId, email, role } = req.body;
    const id = req.params.id;

    db.run(`UPDATE users SET name = ?, class = ?, student_id = ?, email = ?, role = ? WHERE id = ?`,
        [name, className, studentId, email, role, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Pengguna berhasil diperbarui' });
        });
});

// Hapus pengguna
app.delete('/users/:id', (req, res) => {
    const id = req.params.id;

    db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Pengguna berhasil dihapus' });
    });
});


// ------------------ Kursus ------------------

app.get('/courses', (req, res) => {
    db.all("SELECT * FROM courses", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/courses', upload.array('files', 5), (req, res) => {
    const { name, description, instructor } = req.body;
    const files = req.files.map(file => file.filename);
    db.run(`INSERT INTO courses (name, description, instructor, files) VALUES (?, ?, ?, ?)`,
        [name, description, instructor, JSON.stringify(files)],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Kursus ditambahkan', courseId: this.lastID });
        });
});

app.put('/courses/:id', upload.array('files', 5), (req, res) => {
    const { name, description, instructor } = req.body;
    const files = req.files.map(file => file.filename);
    const id = req.params.id;

    db.run(`UPDATE courses SET name = ?, description = ?, instructor = ?, files = ? WHERE id = ?`,
        [name, description, instructor, JSON.stringify(files), id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Kursus diperbarui' });
        });
});

app.delete('/courses/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM courses WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Kursus berhasil dihapus' });
    });
});


//komentar kursus 
app.post('/courses/:id/komentar', (req, res) => {
    const course_id = req.params.id;
    const { student_id, text } = req.body;
    const created_at = new Date().toISOString();
  
    db.run(`INSERT INTO komentar_kursus (course_id, student_id, text, created_at) VALUES (?, ?, ?, ?)`,
      [course_id, student_id, text, created_at],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Komentar kursus berhasil ditambahkan', id: this.lastID });
      });
  });
  
  app.get('/courses/:id/komentar', (req, res) => {
    const course_id = req.params.id;
    const sql = `
      SELECT komentar_kursus.id, komentar_kursus.text, komentar_kursus.created_at, users.name AS student_name
      FROM komentar_kursus
      JOIN users ON users.student_id = komentar_kursus.student_id
      WHERE komentar_kursus.course_id = ?
      ORDER BY komentar_kursus.created_at ASC
    `;
    db.all(sql, [course_id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  

  // hapus komentar
  app.delete('/courses/komentar/:id', (req, res) => {
    const komentarId = req.params.id;
    const { user_role, student_id } = req.query;
  
    const sql = `SELECT * FROM komentar_kursus WHERE id = ?`;
    db.get(sql, [komentarId], (err, komentar) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!komentar) return res.status(404).json({ error: 'Komentar tidak ditemukan.' });
  
      if (user_role !== 'admin' && komentar.student_id !== student_id) {
        return res.status(403).json({ error: 'Tidak diizinkan menghapus komentar ini.' });
      }
  
      db.run(`DELETE FROM komentar_kursus WHERE id = ?`, [komentarId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Komentar berhasil dihapus.' });
      });
    });
  });


  // view kursus 
  app.post('/courses/:id/view', (req, res) => {
    const course_id = req.params.id;
    const { student_id } = req.body;
    const viewed_at = new Date().toISOString();
  
    if (!student_id) return res.status(400).json({ error: 'student_id wajib diisi.' });
  
    db.run(`INSERT OR IGNORE INTO course_views (course_id, student_id, viewed_at) VALUES (?, ?, ?)`,
      [course_id, student_id, viewed_at],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'View kursus tercatat' });
      });
  });
  

  app.get('/courses/:id/views', (req, res) => {
    const course_id = req.params.id;
  
    db.all(`
      SELECT course_views.*, users.name
      FROM course_views
      JOIN users ON users.student_id = course_views.student_id
      WHERE course_views.course_id = ?
      ORDER BY course_views.viewed_at ASC
    `, [course_id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  
  

// ------------------ Tugas ------------------

app.get('/tugas', (req, res) => {
    db.all("SELECT * FROM tugas", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/tugas/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM tugas WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
    });
});

app.post('/tugas', uploadTugas.single('file'), (req, res) => {
    const { title, description, deadline } = req.body;
    const file = req.file?.filename || null;

    db.run(`INSERT INTO tugas (title, description, deadline, file) VALUES (?, ?, ?, ?)`,
        [title, description, deadline, file],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Tugas ditambahkan', id: this.lastID });
        });
});

app.put('/tugas/:id', uploadTugas.single('file'), (req, res) => {
    const id = req.params.id;
    const { title, description, deadline } = req.body;
    const file = req.file?.filename;
    const updateQuery = file
        ? `UPDATE tugas SET title = ?, description = ?, deadline = ?, file = ? WHERE id = ?`
        : `UPDATE tugas SET title = ?, description = ?, deadline = ? WHERE id = ?`;
    const params = file
        ? [title, description, deadline, file, id]
        : [title, description, deadline, id];

    db.run(updateQuery, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Tugas diperbarui' });
    });
});

app.delete('/tugas/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM tugas WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Tugas berhasil dihapus' });
    });
});


// komentar tugas 
app.post('/tugas/:id/komentar', (req, res) => {
    const task_id = req.params.id;
    const { student_id, text } = req.body;
    const created_at = new Date().toISOString();
  
    db.run(`INSERT INTO komentar_tugas (task_id, student_id, text, created_at) VALUES (?, ?, ?, ?)`,
      [task_id, student_id, text, created_at],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Komentar tugas berhasil ditambahkan', id: this.lastID });
      });
  });
  
  app.get('/tugas/:id/komentar', (req, res) => {
    const task_id = req.params.id;
    const sql = `
      SELECT komentar_tugas.id, komentar_tugas.text, komentar_tugas.created_at, users.name AS student_name
      FROM komentar_tugas
      JOIN users ON users.student_id = komentar_tugas.student_id
      WHERE komentar_tugas.task_id = ?
      ORDER BY komentar_tugas.created_at ASC
    `;
    db.all(sql, [task_id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  

  // hapus komentar 
  app.delete('/tugas/komentar/:id', (req, res) => {
    const komentarId = req.params.id;
    const { user_role, student_id } = req.query;
  
    const sql = `SELECT * FROM komentar_tugas WHERE id = ?`;
    db.get(sql, [komentarId], (err, komentar) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!komentar) return res.status(404).json({ error: 'Komentar tidak ditemukan.' });
  
      if (user_role !== 'admin' && komentar.student_id !== student_id) {
        return res.status(403).json({ error: 'Tidak diizinkan menghapus komentar ini.' });
      }
  
      db.run(`DELETE FROM komentar_tugas WHERE id = ?`, [komentarId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Komentar berhasil dihapus.' });
      });
    });
  });

  // view tugas 
  app.post('/tugas/:id/view', (req, res) => {
    const task_id = req.params.id;
    const { student_id } = req.body;
    const viewed_at = new Date().toISOString();

    if (!student_id) return res.status(400).json({ error: 'student_id wajib diisi.' });

    db.run(`
        INSERT OR IGNORE INTO tugas_views (task_id, student_id, viewed_at)
        VALUES (?, ?, ?)
    `, [task_id, student_id, viewed_at], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'View tercatat' });
    });
});


app.get('/tugas/:id/views', (req, res) => {
  const task_id = req.params.id;

  db.all(`
      SELECT tugas_views.*, users.name 
      FROM tugas_views
      JOIN users ON users.student_id = tugas_views.student_id
      WHERE tugas_views.task_id = ?
      ORDER BY tugas_views.viewed_at ASC
  `, [task_id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
  });
});

  
// ------------------ Jawaban ------------------

// Cek deadline sebelum insert jawaban
app.post('/jawaban', uploadJawaban.single('file'), (req, res) => {
    const { task_id, student_id, text } = req.body;
    const file = req.file?.filename || null;
    const created_at = new Date().toISOString();

    db.get(`SELECT * FROM tugas WHERE id = ?`, [task_id], (err, tugas) => {
        if (err) return res.status(500).json({ error: err.message });
        if (tugas?.deadline && new Date(tugas.deadline) < new Date()) {
            return res.status(400).json({ error: 'Tugas sudah melewati deadline.' });
        }

        db.get(`SELECT * FROM jawaban WHERE task_id = ? AND student_id = ?`, [task_id, student_id], (err, existing) => {
            if (existing) return res.status(400).json({ error: 'Jawaban sudah pernah dikirim.' });

            db.run(`INSERT INTO jawaban (task_id, student_id, text, file, created_at) VALUES (?, ?, ?, ?, ?)`,
                [task_id, student_id, text, file, created_at],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Jawaban dikirim', id: this.lastID });
                });
        });
    });
});

// Edit jawaban (jika belum dinilai dan belum lewat deadline)
app.put('/jawaban/:id', uploadJawaban.single('file'), (req, res) => {
    const { text } = req.body;
    const file = req.file?.filename || null;
    const id = req.params.id;

    db.get(`SELECT * FROM jawaban WHERE id = ?`, [id], (err, jawaban) => {
        if (!jawaban) return res.status(404).json({ error: 'Jawaban tidak ditemukan' });
        if (jawaban.nilai) return res.status(400).json({ error: 'Jawaban sudah dinilai, tidak bisa diedit' });

        // Cek deadline tugas
        db.get(`SELECT * FROM tugas WHERE id = ?`, [jawaban.task_id], (err, tugas) => {
            if (tugas?.deadline && new Date(tugas.deadline) < new Date()) {
                return res.status(400).json({ error: 'Tugas sudah melewati deadline, tidak bisa diedit.' });
            }

            const sql = file
                ? `UPDATE jawaban SET text = ?, file = ?, created_at = ? WHERE id = ?`
                : `UPDATE jawaban SET text = ?, created_at = ? WHERE id = ?`;
            const params = file
                ? [text, file, new Date().toISOString(), id]
                : [text, new Date().toISOString(), id];

            db.run(sql, params, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Jawaban diperbarui' });
            });
        });
    });
});

app.get('/jawaban/cek/:task_id/:student_id', (req, res) => {
    const { task_id, student_id } = req.params;
    db.get(`SELECT * FROM jawaban WHERE task_id = ? AND student_id = ?`, [task_id, student_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

app.get('/jawaban', (req, res) => {
    db.all(`SELECT jawaban.*, tugas.title AS task_title FROM jawaban LEFT JOIN tugas ON jawaban.task_id = tugas.id ORDER BY jawaban.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/jawaban/:id/nilai', (req, res) => {
    const { nilai, feedback } = req.body;
    const id = req.params.id;

    db.run(`UPDATE jawaban SET nilai = ?, feedback = ? WHERE id = ?`, [nilai, feedback, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Nilai berhasil disimpan' });
    });
});

app.get('/laporan-nilai', (req, res) => {
    const sql = `
      SELECT 
        users.name AS student_name,
        users.student_id,
        tugas.title AS task_title,
        jawaban.nilai,
        jawaban.feedback,
        jawaban.created_at
      FROM users
      CROSS JOIN tugas
      LEFT JOIN jawaban 
        ON jawaban.task_id = tugas.id 
        AND CAST(jawaban.student_id AS TEXT) = users.student_id
      WHERE users.role = 'student'
      ORDER BY tugas.title, users.name;
    `;
  
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  

// ------------------ Galeri Harian ------------------

app.post('/galeri', uploadGaleri.single('file'), (req, res) => {
    const { student_id, text } = req.body;
    const file = req.file?.filename || null;
    const created_at = new Date().toISOString();
  
    if (!student_id) return res.status(400).json({ error: 'student_id wajib diisi.' });
  
    db.run(`INSERT INTO galeri (student_id, text, file, created_at) VALUES (?, ?, ?, ?)`,
      [student_id, text || '', file, created_at],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Konten galeri berhasil dikirim', id: this.lastID });
      });
  });
  
  app.get('/galeri', (req, res) => {
    db.all(`
      SELECT galeri.*, users.name AS student_name
      FROM galeri
      JOIN users ON galeri.student_id = users.student_id
      ORDER BY galeri.created_at DESC
    `, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
  });
      
  app.delete('/galeri/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM galeri WHERE id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Konten galeri dihapus' });
    });
  });
  

  // edit konten galeri //
  app.put('/galeri/:id', (req, res) => {
    const id = req.params.id;
    const { text } = req.body;
  
    db.run(`UPDATE galeri SET text = ? WHERE id = ?`, [text, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Konten galeri berhasil diperbarui' });
    });
  });
  

  // komentar galeri //
  app.post('/galeri/:id/komentar', (req, res) => {
    const galeri_id = req.params.id;
    const { student_id, text } = req.body;
    const created_at = new Date().toISOString();
  
    db.run(`INSERT INTO komentar (galeri_id, student_id, text, created_at) VALUES (?, ?, ?, ?)`,
      [galeri_id, student_id, text, created_at],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Komentar berhasil ditambahkan', id: this.lastID });
      });
  });
  

  // hapus komentar 
  app.delete('/galeri/komentar/:id', (req, res) => {
    const komentarId = req.params.id;
    const { user_role, student_id } = req.query;
  
    const sql = `SELECT * FROM komentar WHERE id = ?`;
    db.get(sql, [komentarId], (err, komentar) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!komentar) return res.status(404).json({ error: 'Komentar tidak ditemukan.' });
  
      // Cek izin
      if (user_role !== 'admin' && komentar.student_id !== student_id) {
        return res.status(403).json({ error: 'Tidak diizinkan menghapus komentar ini.' });
      }
  
      db.run(`DELETE FROM komentar WHERE id = ?`, [komentarId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Komentar berhasil dihapus.' });
      });
    });
  });
 

  
// lihat komentar 
app.get('/galeri/:id/komentar', (req, res) => {
    const galeri_id = req.params.id;
    const sql = `
      SELECT komentar.id, komentar.text, komentar.created_at, users.name AS student_name
      FROM komentar
      JOIN users ON users.student_id = komentar.student_id
      WHERE komentar.galeri_id = ?
      ORDER BY komentar.created_at ASC
    `;
    db.all(sql, [galeri_id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  
  
// ------------------ Jalankan Server ------------------

app.listen(port, () => {
    console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
