const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./registration.db');

db.serialize(() => {
    // Hapus dan buat ulang tabel utama
    db.run(`DROP TABLE IF EXISTS courses`);
    db.run(`DROP TABLE IF EXISTS tugas`);
    db.run(`DROP TABLE IF EXISTS jawaban`);

    // Tabel kursus
    db.run(`
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            instructor TEXT NOT NULL,
            files TEXT
        );
    `);

    // Tabel pengguna
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            class TEXT NOT NULL,
            student_id TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        );
    `);

    // Tabel tugas
    db.run(`
        CREATE TABLE IF NOT EXISTS tugas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            deadline TEXT,
            file TEXT
        );
    `);

    // Tabel jawaban siswa
    db.run(`
            CREATE TABLE IF NOT EXISTS jawaban (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            student_id TEXT,
            text TEXT,
            file TEXT,
            created_at TEXT,
            nilai TEXT,
            feedback TEXT
        );

    `);

    // tabel galeri
    db.run(`
        CREATE TABLE IF NOT EXISTS galeri (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id TEXT NOT NULL,
          text TEXT,
          file TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // table komentar
      db.run(`
        CREATE TABLE IF NOT EXISTS komentar (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          galeri_id INTEGER NOT NULL,
          student_id TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (galeri_id) REFERENCES galeri(id)
        );
      `);
      
      // komen kursus 
      db.run(`
        CREATE TABLE IF NOT EXISTS komentar_kursus (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER NOT NULL,
          student_id TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (course_id) REFERENCES courses(id)
        );
      `);


      // komen tugas 
      
      db.run(`
        CREATE TABLE IF NOT EXISTS komentar_tugas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          student_id TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES tugas(id)
        );
      `);


// taabel view tugas
      db.run(`
        CREATE TABLE IF NOT EXISTS tugas_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        viewed_at TEXT NOT NULL,
        UNIQUE (task_id, student_id)
      );
      `);

    // tabel view kursus
    db.run(`CREATE TABLE IF NOT EXISTS course_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      student_id TEXT NOT NULL,
      viewed_at TEXT NOT NULL,
      UNIQUE (course_id, student_id)
    );
    `);
      

    // Tambahkan user admin default
    const insertUser = (name, studentClass, studentId, email, password, role) => {
        db.get(`SELECT * FROM users WHERE email = ? OR student_id = ?`, [email, studentId], (err, row) => {
            if (row) {
                console.log(`User ${name} already exists.`);
                return;
            }

            bcrypt.hash(password, 10, (err, hash) => {
                if (err) return console.error(err);

                db.run(
                    `INSERT INTO users (name, class, student_id, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
                    [name, studentClass, studentId, email, hash, role],
                    (err) => {
                        if (err) console.error(err.message);
                        else console.log(`✅ User ${name} added.`);
                    }
                );
            });
        });
    };
    
    insertUser('Admin User', 'Admin', '0001', 'admin@example.com', 'admin123', 'admin');
});

db.close();
