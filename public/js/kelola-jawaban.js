document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.querySelector("#jawabanTable tbody");

    try {
        const res = await fetch("/jawaban");
        const data = await res.json();

        if (!Array.isArray(data)) return;

        tableBody.innerHTML = "";

        data.forEach(jawaban => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td  data-label="Tugas">${jawaban.task_title || '(Tidak Diketahui)'}</td>
                <td data-label="ID Siswa">${jawaban.student_id}</td>
                <td data-label="Jawaban">${jawaban.text || '-'}</td>
                <td data-label="File">${jawaban.file ? `<a href="uploads/jawaban/${jawaban.file}" target="_blank" class="download-link">${jawaban.file}</a>` : '-'}</td>
                <td data-label="Waktu Kirim">${new Date(jawaban.created_at).toLocaleString('id-ID')}</td>
                <td data-label="Nilai"><input type="text" value="${jawaban.nilai || ''}" data-id="${jawaban.id}" class="nilai-input"></td>
                <td data-label="Feedback"><input type="text" value="${jawaban.feedback || ''}" data-id="${jawaban.id}" class="feedback-input"></td>
                <td data-label="Aksi"><button class="btn-simpan" onclick="simpanNilai(${jawaban.id})">Simpan</button></td>
            `;

            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error("Gagal mengambil data jawaban:", err);
        tableBody.innerHTML = '<tr><td colspan="8">Gagal memuat data.</td></tr>';
    }

    window.simpanNilai = async (id) => {
        const nilai = document.querySelector(`input.nilai-input[data-id='${id}']`).value;
        const feedback = document.querySelector(`input.feedback-input[data-id='${id}']`).value;

        try {
            const res = await fetch(`/jawaban/${id}/nilai`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nilai, feedback })
            });

            const result = await res.json();
            alert(result.message || "Nilai berhasil diperbarui.");
        } catch (err) {
            alert("Gagal menyimpan nilai.");
            console.error(err);
        }
    };

        // Tombol ke beranda
        const homeBtn = document.getElementById("homeBtn");
        homeBtn.addEventListener("click", () => {
            window.location.href = "index.html"; // Ubah sesuai URL beranda
        });
    
});
