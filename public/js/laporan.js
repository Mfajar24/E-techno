document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("laporanBody");
    const filter = document.getElementById("filterTugas");
    const exportBtn = document.getElementById("exportCsv");
    let semuaData = [];
  
    async function loadData() {
      const res = await fetch("/laporan-nilai");
      const data = await res.json();
      semuaData = data;
      renderFilter(data);
      renderTable(data);
    }
  
    function renderFilter(data) {
      const tugasSet = new Set();
      data.forEach(row => tugasSet.add(row.task_title));
      filter.innerHTML = '<option value="">Semua Tugas</option>';
      [...tugasSet].forEach(tugas => {
        const opt = document.createElement("option");
        opt.value = tugas;
        opt.textContent = tugas;
        filter.appendChild(opt);
      });
    }
  
    function renderTable(data) {
      tbody.innerHTML = "";
      data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td data-label="Nama Siswa">${row.student_name}</td>
        <td data-label="ID Siswa">${row.student_id}</td>
        <td data-label="Judul Tugas">${row.task_title}</td>
        <td data-label="Nilai">${row.nilai || '-'}</td>
        <td data-label="Feedback">${row.feedback || '-'}</td>
        <td data-label="Status">
          ${row.nilai ? '✅ Sudah Dinilai' : row.created_at ? '🕒 Belum Dinilai' : '❌ Belum Mengerjakan'}
        </td>
        <td data-label="Tanggal Jawaban">
          ${row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-'}
        </td>
      `;        tbody.appendChild(tr);
      });
    }
  
    filter.addEventListener("change", () => {
      const tugasDipilih = filter.value;
      const dataFiltered = tugasDipilih
        ? semuaData.filter(row => row.task_title === tugasDipilih)
        : semuaData;
      renderTable(dataFiltered);
    });
  
    exportBtn.addEventListener("click", () => {
      const rows = [
        ["Nama Siswa", "ID Siswa", "Judul Tugas", "Nilai", "Feedback", "Status", "Tanggal Jawaban"]
      ];
      semuaData.forEach(row => {
        rows.push([
          row.student_name,
          row.student_id,
          row.task_title,
          row.nilai || '',
          row.feedback || '',
          row.nilai ? 'Sudah Dinilai' : row.created_at ? 'Belum Dinilai' : 'Belum Mengerjakan',
          row.created_at || ''
        ]);
      });
      const csvContent = rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "laporan_nilai_siswa.csv";
      link.click();
    });
  
    loadData();
        // Tombol ke beranda
        const homeBtn = document.getElementById("homeBtn");
        homeBtn.addEventListener("click", () => {
            window.location.href = "index.html"; // Ubah sesuai URL beranda
        });
    
  });
  