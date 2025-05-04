document.addEventListener("DOMContentLoaded", () => {
    const taskForm = document.getElementById("taskForm");
    const taskTable = document.getElementById("taskTable").querySelector("tbody");
    const titleInput = document.getElementById("taskTitle");
    const descInput = document.getElementById("taskDescription");
    const deadlineInput = document.getElementById("taskDeadline");
    const taskIdInput = document.getElementById("taskId");
    const fileInput = document.getElementById("taskFile");
    const cancelEditBtn = document.getElementById("cancelEdit");
  
const fetchTasks = () => {
  fetch("/tugas")
    .then(res => res.json())
    .then(tasks => {
      taskTable.innerHTML = '';
      tasks.forEach(task => {
        let fileLinks = '-';

        if (task.file) {
          try {
            const files = Array.isArray(task.file)
              ? task.file
              : JSON.parse(task.file);

            fileLinks = files.map(file => {
              const ext = file.split('.').pop().toLowerCase();
              const url = `uploads/${file}`;

              if (['jpg', 'jpeg', 'png'].includes(ext)) {
                return `<img src="${url}" style="max-width: 80px;">`;
              } else if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
                return `<a href="${url}" target="_blank">${file}</a>`;
              } else {
                return `<a href="${url}" target="_blank">${file}</a>`;
              }
            }).join('<br>');
          } catch (err) {
            // Jika task.file bukan array atau JSON
            const url = `uploads/${task.file}`;
            fileLinks = `<a href="${url}" target="_blank">${task.file}</a>`;
          }
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td data-label="Judul">${task.title}</td>
          <td data-label="Deskripsi">${task.description}</td>
          <td data-label="Deadline">${task.deadline || '-'}</td>
          <td data-label="File">${fileLinks}</td>
          <td data-label="Aksi" class="table-actions">
            <button class="btn-edit" onclick="editTask(${task.id})">Edit</button>
            <button class="btn-delete" onclick="deleteTask(${task.id})">Hapus</button>
            <button class="btn-view" onclick="viewTaskViews(${task.id})">Lihat</button>
          </td>
        `;
        taskTable.appendChild(row);
      });
    });
};
  
    taskForm.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const formData = new FormData();
      formData.append("title", titleInput.value);
      formData.append("description", descInput.value);
      formData.append("deadline", deadlineInput.value || '');
      if (fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
      }
  
      const id = taskIdInput.value;
      const method = id ? "PUT" : "POST";
      const url = id ? `/tugas/${id}` : "/tugas";
  
      try {
        const res = await fetch(url, {
          method,
          body: formData
        });
        const result = await res.json();
        alert(result.message);
        taskForm.reset();
        taskIdInput.value = '';
        cancelEditBtn.style.display = "none";
        fetchTasks();
      } catch (err) {
        alert("Gagal menyimpan tugas.");
      }
    });
  
    cancelEditBtn.addEventListener("click", () => {
      taskForm.reset();
      taskIdInput.value = '';
      cancelEditBtn.style.display = "none";
    });
  
    window.editTask = async (id) => {
      const res = await fetch("/tugas");
      const tasks = await res.json();
      const task = tasks.find(t => t.id === id);
      if (!task) return;
  
      taskIdInput.value = task.id;
      titleInput.value = task.title;
      descInput.value = task.description;
      deadlineInput.value = task.deadline || '';
      cancelEditBtn.style.display = "inline-block";
    };
  
    window.deleteTask = async (id) => {
      if (!confirm("Yakin ingin menghapus tugas ini?")) return;
      const res = await fetch(`/tugas/${id}`, { method: "DELETE" });
      const result = await res.json();
      alert(result.message);
      fetchTasks();
    };

    window.viewTaskViews = async (id) => {
      const res = await fetch(`/tugas/${id}/views`);
      const viewers = await res.json();
      const list = viewers.map(v => `${v.name} (lihat: ${new Date(v.viewed_at).toLocaleString()})`).join('\n');
      alert(`Siswa yang sudah melihat tugas:\n\n${list || 'Belum ada yang melihat.'}`);
    };
  
  
    fetchTasks();

    // Tombol ke beranda
    const homeBtn = document.getElementById("homeBtn");
    homeBtn.addEventListener("click", () => {
        window.location.href = "index.html"; // Ubah sesuai URL beranda
    });

  });
  