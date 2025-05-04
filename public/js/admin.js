document.addEventListener("DOMContentLoaded", () => {
    const addUserForm = document.getElementById("addUserForm");

    // Fungsi untuk mengambil data pengguna dari server
    const fetchUsers = () => {
        fetch('/users')
            .then(response => response.json())
            .then(users => {
                const userTable = document.getElementById("userTable").getElementsByTagName('tbody')[0];
                userTable.innerHTML = '';

                users.forEach(user => {
                    const row = userTable.insertRow();
                    row.innerHTML = `
                        <td data-label="ID">${user.id}</td>
                        <td data-label="Nama">${user.name}</td>
                        <td data-label="Kelas">${user.class}</td>
                        <td data-label="Nomor Induk">${user.student_id}</td>
                        <td data-label="Email">${user.email}</td>
                        <td data-label="Role">${user.role}</td>
                        <td data-label="Aksi">
                            <button class="btn-edit" onclick="editUser(${user.id})">Edit</button>
                            <button class="btn-delete" onclick="deleteUser(${user.id})">Hapus</button>
                        </td>
                    `;
                });
                            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    };

    fetchUsers();

    // Fungsi untuk menambah pengguna
    addUserForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = e.target.querySelector("[name=name]").value;
        const className = e.target.querySelector("[name=class]").value;
        const studentId = e.target.querySelector("[name=studentId]").value;
        const email = e.target.querySelector("[name=email]").value;
        const password = e.target.querySelector("[name=password]").value;
        const role = e.target.querySelector("[name=role]").value;

        const userData = { name, class: className, studentId, email, password, role };
        console.log("Data yang akan dikirim:", userData);

        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || "Pengguna berhasil ditambahkan!");
            fetchUsers();
            addUserForm.reset();
        })
        .catch(error => {
            console.error('Error adding user:', error);
            alert("Gagal menambahkan pengguna");
        });
    });

    // Fungsi untuk menghapus pengguna
    window.deleteUser = (userId) => {
        if (confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
            fetch(`/users/${userId}`, {
                method: 'DELETE'
            })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    fetchUsers();
                })
                .catch(error => {
                    console.error('Error deleting user:', error);
                });
        }
    };

    // Fungsi untuk mengedit pengguna
    window.editUser = (userId) => {
        fetch(`/users/${userId}`)
            .then(response => response.json())
            .then(user => {
                document.querySelector("#editUserForm [name=id]").value = user.id;
                document.querySelector("#editUserForm [name=name]").value = user.name;
                document.querySelector("#editUserForm [name=class]").value = user.class;
                document.querySelector("#editUserForm [name=studentId]").value = user.student_id;
                document.querySelector("#editUserForm [name=email]").value = user.email;
                document.querySelector("#editUserForm [name=role]").value = user.role;

                document.getElementById("editUserForm").style.display = "block";
            })
            .catch(error => {
                console.error('Error fetching user data for edit:', error);
            });
    };

    // Fungsi untuk menyimpan perubahan pengguna yang diedit
    const editUserForm = document.getElementById("editUserForm");
    editUserForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const userId = e.target.querySelector("[name=id]").value;
        const name = e.target.querySelector("[name=name]").value;
        const className = e.target.querySelector("[name=class]").value;
        const studentId = e.target.querySelector("[name=studentId]").value;
        const email = e.target.querySelector("[name=email]").value;
        const role = e.target.querySelector("[name=role]").value;

        const userData = { name, class: className, studentId, email, role };

        fetch(`/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                fetchUsers();
                editUserForm.reset();
                document.getElementById("editUserForm").style.display = "none";
            })
            .catch(error => {
                console.error('Error updating user:', error);
            });
    });

    // Tombol batal edit
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    cancelEditBtn.addEventListener("click", () => {
        document.getElementById("editUserForm").style.display = "none";
        editUserForm.reset();
    });


    // Tombol ke beranda
    const homeBtn = document.getElementById("homeBtn");
    homeBtn.addEventListener("click", () => {
        window.location.href = "index.html"; // Ubah sesuai URL beranda
    });

    // Cek user login
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
        window.location.href = "login.html";
    }
});
