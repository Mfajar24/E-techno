// tugas.js

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("taskContainer");
  const student_id = JSON.parse(localStorage.getItem("user"))?.student_id;
  const user = JSON.parse(localStorage.getItem("user"));

  if (!student_id) {
    alert("Silakan login terlebih dahulu.");
    window.location.href = "login.html";
    return;
  }

  function escapeHTML(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const fetchTasks = async () => {
    const res = await fetch("/tugas");
    const tasks = await res.json();

    container.innerHTML = '';
    tasks.forEach(task => {
      const div = document.createElement("div");
      div.className = "tugas";

      const deadlineDate = task.deadline ? new Date(task.deadline) : null;
      const today = new Date();
      const isClosed = deadlineDate && deadlineDate < today;

      div.innerHTML = `
        <h3>${escapeHTML(task.title)}</h3>
        <p>${escapeHTML(task.description)}</p>
        <p><strong>Deadline:</strong> ${task.deadline || '-'}</p>
        <p><strong>File:</strong> ${task.file ? `<a href="uploads/tugas/${escapeHTML(task.file)}" target="_blank">${escapeHTML(task.file)}</a>` : '-'}</p>
        ${isClosed
          ? `<p style="color:red;"><strong>Tugas sudah ditutup (lewat deadline).</strong></p>`
          : `
        <form class="jawaban-form" data-id="${task.id}">
          <label>Jawaban Teks:</label>
          <textarea name="text" rows="4" placeholder="Tuliskan jawaban Anda..."></textarea>
          <label>Upload File Jawaban:</label>
          <input type="file" name="file" accept=".pdf,.doc,.docx,.jpg,.png,.zip">
          <button type="submit">Kirim Jawaban</button>
        </form>`}
        <div id="comments-task-${task.id}" style="margin-top:10px; font-size:0.9em;"></div>
        <form onsubmit="addCommentToTask(event, ${task.id})">
          <input type="text" id="comment-task-input-${task.id}" placeholder="Tambah komentar..." required/>
          <button type="submit">Kirim</button>
        </form>
      `;

      container.appendChild(div);

      if (!isClosed) checkJawaban(task.id, div);
      fetchCommentsForTask(task.id);
      recordTaskView(task.id); // Catat view setiap lihat tugas
    });
  };

  const checkJawaban = async (taskId, div) => {
    const res = await fetch(`/jawaban/cek/${taskId}/${student_id}`);
    const jawaban = await res.json();

    const form = div.querySelector('form.jawaban-form');
    if (!form) return;

    if (jawaban) {
      if (jawaban.nilai) {
        form.innerHTML = `
          <p><strong>Jawaban sudah dinilai.</strong></p>
          <p>Nilai: <strong>${jawaban.nilai}</strong></p>
          <p>Feedback: ${escapeHTML(jawaban.feedback || '-')}</p>
        `;
      } else {
        form.querySelector("textarea[name='text']").value = jawaban.text || '';
        form.setAttribute("data-jawaban-id", jawaban.id);
      }
    }
  };

  const recordTaskView = async (taskId) => {
    try {
      await fetch(`/tugas/${taskId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id })
      });
    } catch (err) {
      console.error('Gagal mencatat view tugas:', err);
    }
  };

  container.addEventListener("submit", async (e) => {
    if (!e.target.classList.contains("jawaban-form")) return;
    e.preventDefault();

    const form = e.target;
    const task_id = form.dataset.id;
    const jawaban_id = form.getAttribute("data-jawaban-id");

    const formData = new FormData(form);
    formData.append("task_id", task_id);
    formData.append("student_id", student_id);

    const url = jawaban_id ? `/jawaban/${jawaban_id}` : "/jawaban";
    const method = jawaban_id ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body: formData });
      const result = await res.json();
      alert(result.message || "Jawaban berhasil dikirim.");
      fetchTasks();
    } catch (err) {
      console.error("Gagal kirim jawaban:", err);
      alert("Terjadi kesalahan saat mengirim jawaban.");
    }
  });

  window.addCommentToTask = async (event, taskId) => {
    event.preventDefault();
    const input = document.getElementById(`comment-task-input-${taskId}`);
    const text = input.value.trim();
    if (!text) return;

    await fetch(`/tugas/${taskId}/komentar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: user.student_id, text })
    });

    input.value = '';
    fetchCommentsForTask(taskId);
  };

  const fetchCommentsForTask = async (taskId) => {
    const res = await fetch(`/tugas/${taskId}/komentar`);
    const comments = await res.json();
    const commentsDiv = document.getElementById(`comments-task-${taskId}`);
    commentsDiv.innerHTML = comments.map(c => `
      <small><b>${escapeHTML(c.student_name)}</b>: ${escapeHTML(c.text)}</small><br>
    `).join('');
  };

  fetchTasks();

  const homeBtn = document.getElementById("homeBtn");
  homeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
});
