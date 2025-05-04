document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const form = document.getElementById('galeriForm');
  const fileInput = document.getElementById('file');
  const textInput = document.getElementById('text');
  const feedContainer = document.getElementById('feedContainer');
  const profileDiv = document.getElementById('userProfile');

  if (user) {
    profileDiv.innerHTML = `
      👤 <b>${escapeHTML(user.name || 'Pengguna')}</b> (${escapeHTML(user.role)})
      <br>ID: ${escapeHTML(user.student_id || 'N/A')}
    `;
  } else {
    profileDiv.innerHTML = `<i>Belum login</i>`;
  }

  function escapeHTML(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const fetchGaleri = async () => {
    const res = await fetch('/galeri');
    const data = await res.json();
    feedContainer.innerHTML = '';

    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'post';

      const konten = [];
      if (item.text) konten.push(`<p>${escapeHTML(item.text)}</p>`);
      if (item.file) {
        const ext = item.file.split('.').pop().toLowerCase();
        const url = 'uploads/galeri/' + item.file;
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
          konten.push(`<img src="${url}" />`);
        } else if (['mp4', 'mov'].includes(ext)) {
          konten.push(`<video src="${url}" controls></video>`);
        }
      }

      card.innerHTML = `
        <div class="timestamp">${new Date(item.created_at).toLocaleString()}</div>
        <div class="poster-name"><b>${escapeHTML(item.student_name || 'Tidak diketahui')}</b></div>
        ${konten.join('<br>')}
        <div id="comments-${item.id}" class="comments"></div>
        <form class="comment-form" onsubmit="addComment(event, ${item.id})">
          <input type="text" id="comment-input-${item.id}" placeholder="Tambah komentar..." required />
          <button type="submit">Kirim</button>
        </form>
        <div class="actions">
          ${(user && (user.role === 'admin' || user.student_id === item.student_id)) ?
            `<button onclick="editGaleri(${item.id})">Edit</button>
             <button onclick="deleteGaleri(${item.id})">Hapus</button>` : ''}
        </div>
      `;
      feedContainer.appendChild(card);
      fetchComments(item.id);
    });
  };

  window.editGaleri = async (id) => {
    const newText = prompt('Edit teks galeri:');
    if (!newText) return;

    const res = await fetch(`/galeri/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText })
    });

    const result = await res.json();
    alert(result.message);
    fetchGaleri();
  };

  window.deleteGaleri = async (id) => {
    if (!confirm('Yakin ingin menghapus konten ini?')) return;
    const res = await fetch('/galeri/' + id, { method: 'DELETE' });
    const result = await res.json();
    alert(result.message);
    fetchGaleri();
  };

  window.addComment = async (e, galeriId) => {
    e.preventDefault();
    const input = document.getElementById(`comment-input-${galeriId}`);
    const text = input.value.trim();
    if (!text) return;

    await fetch(`/galeri/${galeriId}/komentar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: user.student_id, text })
    });

    input.value = '';
    fetchComments(galeriId);
  };

  window.fetchComments = async (galeriId) => {
    const res = await fetch(`/galeri/${galeriId}/komentar`);
    const comments = await res.json();
    const commentsDiv = document.getElementById(`comments-${galeriId}`);
    commentsDiv.innerHTML = comments.map(c => `
      <div>
        <b>${escapeHTML(c.student_name)}</b>: ${escapeHTML(c.text)}
        ${user && (user.role === 'admin' || user.student_id === c.student_id) ?
          `<button onclick="deleteComment(${c.id}, ${galeriId})">🗑️</button>` : ''}
      </div>
    `).join('');
  };

  window.deleteComment = async (komentarId, galeriId) => {
    if (!confirm('Yakin mau menghapus komentar ini?')) return;

    await fetch(`/galeri/komentar/${komentarId}?user_role=${user.role}&student_id=${user.student_id}`, {
      method: 'DELETE'
    });

    fetchComments(galeriId);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!user || !['student', 'admin'].includes(user.role)) {
      alert('Hanya pengguna yang diizinkan yang bisa mengirim konten.');
      return;
    }

    const formData = new FormData();
    formData.append('student_id', user.student_id);
    formData.append('text', textInput.value);
    if (fileInput.files[0]) {
      formData.append('file', fileInput.files[0]);
    }

    try {
      const res = await fetch('/galeri', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      alert(result.message);
      form.reset();
      fetchGaleri();
    } catch (err) {
      alert('Gagal mengirim konten.');
    }
  });

  document.getElementById('homeBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  fetchGaleri();
});
