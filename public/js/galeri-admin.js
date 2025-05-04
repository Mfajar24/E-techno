document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const tableBody = document.querySelector('#galeriTable tbody');
  
    if (!user || user.role !== 'admin') {
      alert('Hanya admin yang dapat mengakses halaman ini.');
      window.location.href = 'login.html';
      return;
    }
  
    const fetchGaleri = async () => {
      const res = await fetch('/galeri');
      const data = await res.json();
      tableBody.innerHTML = '';
  
      data.forEach(item => {
        const row = document.createElement('tr');
        const konten = [];
  
        if (item.text) konten.push(`<p>${item.text}</p>`);
        if (item.file) {
          const ext = item.file.split('.').pop().toLowerCase();
          const url = 'uploads/galeri/' + item.file;
          if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
            konten.push(`<img src="${url}" />`);
          } else if (['mp4', 'mov'].includes(ext)) {
            konten.push(`<video src="${url}" controls></video>`);
          }
        }
  
        row.innerHTML = `
          <td>${new Date(item.created_at).toLocaleString()}</td>
          <td>${konten.join('<br>')}</td>
          <td><button onclick="deleteGaleri(${item.id})">Hapus</button></td>
        `;
        tableBody.appendChild(row);
      });
    };
  
    window.deleteGaleri = async (id) => {
      if (!confirm('Yakin ingin menghapus konten ini?')) return;
      const res = await fetch('/galeri/' + id, { method: 'DELETE' });
      const result = await res.json();
      alert(result.message);
      fetchGaleri();
    };
  
  
    document.getElementById('homeBtn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  
    fetchGaleri();
  });
  