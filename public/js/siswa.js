document.addEventListener("DOMContentLoaded", async () => {
    const courseList = document.getElementById("courseList");
    const searchInput = document.getElementById("searchInput");
    let allCourses = [];
    const user = JSON.parse(localStorage.getItem("user"));

    function escapeHTML(text) {
        return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }
      

    const renderCourses = (courses) => {
        courseList.innerHTML = '';
        if (courses.length === 0) {
            courseList.innerHTML = '<p>Tidak ada kursus ditemukan.</p>';
            return;
        }

        courses.forEach(course => {
            const div = document.createElement("div");
            div.className = "course";

            let fileContent = '-';
            if (course.files) {
                try {
                    const fileArray = JSON.parse(course.files);
                    fileContent = fileArray.map(file => {
                        const ext = file.split('.').pop().toLowerCase();
                        const url = `uploads/${file}`;

                        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                            return `<img src="${url}" alt="${file}" />`;
                        } else if (['mp4', 'webm', 'mov'].includes(ext)) {
                            return `<video src="${url}" controls></video>`;
                        } else {
                            return `<a href="${url}" target="_blank">${file}</a>`;
                        }
                    }).join('');
                } catch (e) {
                    console.error('❌ Error parsing file JSON:', e);
                }
            }

            div.innerHTML = `
                <h3>${course.name}</h3>
                <p><strong>Deskripsi:</strong> ${course.description}</p>
                <p><strong>Instruktur:</strong> ${course.instructor}</p>
                <div class="files">${fileContent}</div>
                <div id="comments-course-${course.id}" style="margin-top:10px; font-size:0.9em;"></div>
                <form onsubmit="addCommentToCourse(event, ${course.id})">
                    <input type="text" id="comment-course-input-${course.id}" placeholder="Tambah komentar..." required/>
                    <button type="submit">Kirim</button>
                </form>
            `;

            courseList.appendChild(div);

            fetchCommentsForCourse(course.id);
            recordCourseView(course.id);
        });
    };

    async function fetchCommentsForCourse(courseId) {
        const res = await fetch(`/courses/${courseId}/komentar`);
        const comments = await res.json();
        const commentsDiv = document.getElementById(`comments-course-${courseId}`);
        commentsDiv.innerHTML = comments.map(c => `
            <small><b>${escapeHTML(c.student_name)}</b>: ${escapeHTML(c.text)}
              ${user && (user.role === 'admin' || user.student_id === c.student_id) ? 
                `<button onclick="deleteComment(${c.id}, 'courses', ${courseId})">🗑️</button>` : ''}
            </small>
          `).join('<br>');
              }

    window.addCommentToCourse = async (event, courseId) => {
        event.preventDefault();
        const input = document.getElementById(`comment-course-input-${courseId}`);
        const text = input.value.trim();
        if (!text) return;

        await fetch(`/courses/${courseId}/komentar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: user.student_id, text })
        });

        input.value = '';
        fetchCommentsForCourse(courseId);
    };

    

    const fetchAndRenderCourses = async () => {
        try {
            const res = await fetch("/courses");
            allCourses = await res.json();
            renderCourses(allCourses);
        } catch (error) {
            console.error("❌ Gagal mengambil data kursus:", error);
            courseList.innerHTML = '<p>Gagal memuat kursus.</p>';
        }
    };

    // Filter saat user mengetik
    searchInput.addEventListener("input", () => {
        const keyword = searchInput.value.toLowerCase();
        const filtered = allCourses.filter(course =>
            course.name.toLowerCase().includes(keyword) ||
            course.description.toLowerCase().includes(keyword) ||
            course.instructor.toLowerCase().includes(keyword)
        );
        renderCourses(filtered);
    });

    window.deleteComment = async (komentarId, type) => {
        if (!confirm('Yakin mau menghapus komentar ini?')) return;
      
        const user = JSON.parse(localStorage.getItem('user'));
        let endpoint = '';
      
        if (type === 'courses') endpoint = `/courses/komentar/${komentarId}`;
        else if (type === 'tugas') endpoint = `/tugas/komentar/${komentarId}`;
        else if (type === 'galeri') endpoint = `/galeri/komentar/${komentarId}`;
      
        await fetch(`${endpoint}?user_role=${user.role}&student_id=${user.student_id}`, {
          method: 'DELETE'
        });
      
        // Refresh komentar
        if (type === 'courses') fetchCommentsForCourse(currentCourseId);
        else if (type === 'tugas') fetchCommentsForTask(currentTaskId);
        else if (type === 'galeri') fetchCommentsForGaleri(currentGaleriId);
      };

      const recordCourseView = async (courseId) => {
        try {
          await fetch(`/courses/${courseId}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: user.student_id })
          });
        } catch (err) {
          console.error('Gagal mencatat view kursus:', err);
        }
      };
      
      

    await fetchAndRenderCourses();

    // Tombol ke beranda
    const homeBtn = document.getElementById("homeBtn");
    homeBtn.addEventListener("click", () => {
        window.location.href = "index.html"; 
    });
});
