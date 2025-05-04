document.addEventListener("DOMContentLoaded", () => {
    const courseForm = document.getElementById('courseForm');
    const courseName = document.getElementById('courseName');
    const courseDescription = document.getElementById('courseDescription');
    const courseInstructor = document.getElementById('courseInstructor');
    const courseFile = document.getElementById('courseFile');
    const courseTable = document.getElementById('courseTable').querySelector('tbody');

    let editingId = null;

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'video/mp4',
        'video/quicktime'
    ];

    // Ambil dan tampilkan kursus
    const fetchCourses = () => {
        fetch('http://localhost:3000/courses')
            .then(res => res.json())
            .then(data => {
                courseTable.innerHTML = '';
                data.forEach(course => {
                    let fileLinks = '-';
                    if (course.files) {
                        try {
                            const fileArray = JSON.parse(course.files);
                            fileLinks = fileArray.map(file => {
                                const ext = file.split('.').pop().toLowerCase();
                                const url = `uploads/${file}`;

                                if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                                    return `<img src="${url}" alt="${file}" style="max-width: 100px;" />`;
                                } else if (['mp4', 'webm', 'mov'].includes(ext)) {
                                    return `<video src="${url}" controls style="max-width: 150px;"></video>`;
                                } else {
                                    return `<a href="${url}" target="_blank">${file}</a>`;
                                }
                            }).join('<br>');
                        } catch (e) {
                            console.error('Gagal parse files:', e);
                        }
                    }

                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td data-label="Nama">${course.name}</td>
                    <td data-label="Deskripsi">${course.description}</td>
                    <td data-label="Instruktur">${course.instructor}</td>
                    <td data-label="File">${fileLinks}</td>
                    <td data-label="Aksi" class="table-actions">
                      <button class="btn-edit" onclick="editCourse(${course.id})">Edit</button>
                      <button class="btn-delete" onclick="deleteCourse(${course.id})">Hapus</button>
                      <button class="btn-view" onclick="viewCourseViews(${course.id})">Viewers</button>

                    </td>
                  `;                   
                   courseTable.appendChild(row);
                });
            });
    };

    // Submit form: tambah / edit kursus
    courseForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Validasi file
        for (let file of courseFile.files) {
            if (!allowedTypes.includes(file.type)) {
                alert(`File tidak didukung: ${file.name}`);
                return;
            }
        }

        const formData = new FormData();
        formData.append('name', courseName.value);
        formData.append('description', courseDescription.value);
        formData.append('instructor', courseInstructor.value);

        for (let file of courseFile.files) {
            formData.append('files', file);
        }

        const url = editingId
            ? `http://localhost:3000/courses/${editingId}`
            : 'http://localhost:3000/courses';

        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                body: formData
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Gagal menyimpan kursus.');

            alert(result.message);
            courseForm.reset();
            editingId = null;
            fetchCourses();
        } catch (error) {
            console.error('❌ Error:', error);
            alert(error.message || 'Terjadi kesalahan saat menyimpan kursus.');
        }
    });

    // Fungsi edit kursus
    window.editCourse = async (id) => {
        const res = await fetch('http://localhost:3000/courses');
        const courses = await res.json();
        const course = courses.find(c => c.id === id);
        if (!course) return alert('Kursus tidak ditemukan.');

        courseName.value = course.name;
        courseDescription.value = course.description;
        courseInstructor.value = course.instructor;
        editingId = course.id;
        alert('Edit mode aktif untuk kursus: ' + course.name);
    };

    // Fungsi hapus kursus
    window.deleteCourse = async (id) => {
        if (!confirm("Yakin ingin menghapus kursus ini?")) return;

        const res = await fetch(`http://localhost:3000/courses/${id}`, {
            method: 'DELETE'
        });
        const result = await res.json();
        alert(result.message);
        fetchCourses();
    };

    // fungsi view 
    window.viewCourseViews = async (id) => {
        const res = await fetch(`/courses/${id}/views`);
        const viewers = await res.json();
        const list = viewers.map(v => `${v.name} (lihat: ${new Date(v.viewed_at).toLocaleString()})`).join('\n');
        alert(`Siswa yang sudah melihat kursus:\n\n${list || 'Belum ada yang melihat.'}`);
      };
      

    // Saat halaman dimuat
    fetchCourses();


    // Tombol ke beranda
    const homeBtn = document.getElementById("homeBtn");
    homeBtn.addEventListener("click", () => {
        window.location.href = "index.html"; // Ubah sesuai URL beranda
    });

});
