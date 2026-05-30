/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 * Tulis seluruh kode JavaScript kamu di sini.
 */

// TODO [Basic] Buat variabel array untuk menyimpan semua data transaksi, contoh: let transactions = []
// TODO [Basic] Buat fungsi untuk menghasilkan ID unik secara otomatis, contoh: gunakan +new Date()
const transactions = [];
const RENDER_EVENT = 'render-transaction';
const SAVED_EVENT = 'saved-transaction';
const STORAGE_KEY = 'EXPENSE_TRACKER_APP';
let editingTransactionId = null;
let searchKeyword = '';

function generateId() {
    return +new Date();
};

/**
 * ========================================================
 * Kriteria 1: Memanipulasi DOM untuk Form dan Daftar Transaksi
 * ========================================================
 */
// TODO [Basic] Ambil elemen kontainer incomeList dan expenseList dari DOM

/**
 * TODO [Basic]:
 * Buat fungsi untuk menampilkan (render) semua transaksi ke layar:
 *  - Kosongkan kontainer terlebih dahulu sebelum mengisi ulang
 *  - Gunakan perulangan, buat setiap elemen kartu dengan document.createElement()
 *  - Pastikan setiap elemen memiliki atribut data-testid yang sesuai (lihat panduan di rubrik)
 *  - Masukkan kartu ke kontainer yang tepat: income → incomeList, expense → expenseList
 */
document.addEventListener(RENDER_EVENT, function () {
    const incomeList = document.getElementById('incomeList');
    incomeList.innerHTML = '';
    const expenseList = document.getElementById('expenseList');
    expenseList.innerHTML = '';

    const filteredTransactions = transactions.filter(transaction => {
        const titleMatch = transaction.title.toLowerCase();

        return titleMatch.includes(searchKeyword);
    });

    const incomeTransactions = filteredTransactions.filter(transaction => transaction.type === 'income');
    const expenseTransactions = filteredTransactions.filter(transaction => transaction.type === 'expense');

    if (incomeTransactions.length === 0) {
        incomeList.innerHTML = '<p style="text-align: center;">Transaksi tidak ditemukan</p>'
    } else {
        for (const transaction of incomeTransactions) {
            const card = makeTransaction(transaction);
            incomeList.append(card);
        }
    }

    if (expenseTransactions.length === 0) {
        expenseList.innerHTML = '<p style="text-align: center;">Transaksi tidak ditemukan</p>'
    } else {
        for (const transaction of expenseTransactions) {
            const card = makeTransaction(transaction);
            expenseList.append(card);
        }
    }

    updateDashboard();
    updateChart();
});

function findTransaction(transactionId) {
    for (const transactionItem of transactions) {
        if (transactionItem.id === transactionId) {
            return transactionItem;
        }
    }

    return null;
};

// TODO [Basic] Tambahkan event listener 'submit' pada form, panggil e.preventDefault() di dalamnya
// TODO [Basic] Di dalam handler submit, ambil nilai input lalu tambahkan sebagai objek transaksi baru ke array
document.addEventListener('DOMContentLoaded', function () {
    const submitForm = document.getElementById('transactionForm');

    submitForm.addEventListener('submit', function (e) {
        e.preventDefault();
        addTransaction();
    });

    if (isStorageExist()) {
        loadDataFromStorage();
    };
});

/**
 * TODO [Skilled]:
 * Tambahkan validasi input sebelum menyimpan data:
 *  - Tampilkan alert() dan hentikan proses jika judul kosong
 *  - Tampilkan alert() dan hentikan proses jika nominal kurang dari 1
 */

function addTransaction() {
    const textTitle = document.getElementById('transactionFormTitleInput').value;
    const textAmount = document.getElementById('transactionFormAmountInput').value;
    const textDate = document.getElementById('transactionFormDateInput').value;
    const textType = document.getElementById('transactionFormTypeSelect').value;
    const generatedId = generateId();

    if ((textTitle === '') || (textAmount < 1) || (textDate === '') || (textType === '')) {
        alert('Semua field harus diisi!');
        return;
    } else {
        const transactionObject = generateTransactionObject(generatedId, textTitle, textAmount, textDate, textType);
        transactions.push(transactionObject);

        document.dispatchEvent(new Event(RENDER_EVENT));

        saveData();
    }

    document.getElementById('transactionFormTitleInput').value = '';
    document.getElementById('transactionFormAmountInput').value = '';
    document.getElementById('transactionFormDateInput').value = '';
    document.getElementById('transactionFormTypeSelect').value = '';
}

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function generateTransactionObject(id, title, amount, date, type) {
    return {
        id: String(id) | Number(id),
        title: String(title),
        amount: Number(amount),
        date: String(date),
        type: String(type),
    }
};

/**
 * TODO [Advanced]:
 * Setiap kali data transaksi berubah, perbarui Panel Dasbor:
 *  - Hitung total pemasukan, total pengeluaran, dan saldo (pemasukan - pengeluaran)
 *  - Tampilkan hasilnya ke elemen yang sesuai di HTML
 */

function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;

    for (const transaction of transactions) {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
            totalExpense += transaction.amount;
        }
    }

    const totalBalance = totalIncome - totalExpense;

    document.getElementById('balance-amount').innerText = formatRupiah(totalBalance);
    document.getElementById('income-amount').innerText = formatRupiah(totalIncome);
    document.getElementById('expense-amount').innerText = formatRupiah(totalExpense);

    const textBalanceAmount = document.getElementById('balance-amount');
    if (totalBalance < 0) {
        textBalanceAmount.classList.add('tracker-summary__stat-amount--expense');
    } else {
        textBalanceAmount.classList.remove('tracker-summary__stat-amount--expense');
    }
};


/**
 * ========================================================
 * Kriteria 2: Mengelola Penyimpanan Data (Web Storage API)
 * ========================================================
 */
/**
 * TODO [Basic]:
 * Data transaksi disimpan ke localStorage menggunakan JSON.stringify(), dan dimuat kembali saat halaman dibuka menggunakan JSON.parse().
 *  - Tombol "Hapus" berfungsi: transaksi yang dihapus langsung hilang dari layar dan dari localStorage.
 */

function saveData() {
    if (isStorageExist()) {
        const parsed = JSON.stringify(transactions);
        localStorage.setItem(STORAGE_KEY, parsed);
        document.dispatchEvent(new Event(SAVED_EVENT));
    }
};

function isStorageExist() {
    if (typeof (Storage) === undefined) {
        alert('Browser kamu tidak mendukung local storage');
        return false;
    }
    return true;
};

function removeTransaction(transactionId) {
    const transactionTarget = findTransactionIndex(transactionId);

    if (transactionTarget === -1) return;

    transactions.splice(transactionTarget, 1);
    document.dispatchEvent(new Event(RENDER_EVENT));

    saveData();
};

/**
 * TODO [Skilled]:
 * Tombol "Edit" berfungsi: saat ditekan, formulir (#transactionForm) secara otomatis terisi dengan data transaksi yang dipilih.
 *  - Pengguna dapat mengubah data lalu menyimpan perubahan.
 *  - Formulir kembali ke mode "Tambah" setelah pembaruan selesai.
 */

function editDataTransaction(transactionId) {
    const transactionTarget = findTransaction(transactionId);
    document.getElementById('transactionFormTitleInput').value = transactionTarget.title;
    document.getElementById('transactionFormAmountInput').value = transactionTarget.amount;
    document.getElementById('transactionFormDateInput').value = transactionTarget.date;
    document.getElementById('transactionFormTypeSelect').value = transactionTarget.type;

    editingTransactionId = transactionId;

    const submitButton = document.querySelector('#transactionForm button[type="submit"]');
    submitButton.innerText = 'Edit';
    submitButton.addEventListener('click', function () {
        editingTransactionId = null;
        submitButton.innerText = 'Simpan';
    });

    removeTransaction(transactionTarget.id);
};

/**
 * TODO [Advanced]:
 * Gunakan Custom Event sebagai penghubung antara perubahan data dan pembaruan tampilan:
 *  - Kirim sinyal dengan document.dispatchEvent(new Event('transaction:updated')) setiap kali data berubah
 *  - Pasang satu listener untuk event tersebut yang memanggil fungsi render dan update dasbor
 */

document.addEventListener(SAVED_EVENT, function () {
    console.log(localStorage.getItem(STORAGE_KEY));
});

function loadDataFromStorage() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    let data = JSON.parse(serializedData);

    if (data !== null) {
        for (const transaction of data) {
            transactions.push(transaction);
        }
    };

    document.dispatchEvent(new Event(RENDER_EVENT));
};

function findTransactionIndex(transactionId) {
    for (const index in transactions) {
        if (transactions[index].id === transactionId) {
            return index;
        };
    }

    return -1;
};


/**
 * ========================================================
 * Kriteria 3: Fitur Interaktif (Pindah Kategori dan Pencarian)
 * ========================================================
 */
/**
 * TODO [Basic]:
 * Tambahkan tombol "Ubah Tipe" pada setiap kartu transaksi:
 *  - Saat diklik, ubah tipe transaksi: 'income' → 'expense' atau 'expense' → 'income'
 *  - Simpan perubahan ke localStorage dan perbarui tampilan
 */
function makeTransaction(transactionObject) {
    const textTitle = document.createElement('h3');
    textTitle.innerText = transactionObject.title;
    textTitle.setAttribute('data-testid', 'transactionItemTitle');
    textTitle.classList.add('tracker-transaction-item__title')

    const textAmount = document.createElement('p');
    textAmount.innerText = formatRupiah(transactionObject.amount);
    textAmount.setAttribute('data-testid', 'transactionItemAmount');
    textAmount.classList.add('tracker-transaction-item__amount');
    if (transactionObject.type === 'income') {
        textAmount.classList.add('tracker-transaction-item__amount--income');
    } else {
        textAmount.classList.add('tracker-transaction-item__amount--expense');
    }

    const textDate = document.createElement('p');
    textDate.innerText = transactionObject.date;
    textDate.setAttribute('data-testid', 'transactionItemDate');
    textDate.classList.add('tracker-transaction-item__date');

    const containerInfo = document.createElement('div');
    containerInfo.append(textTitle, textAmount, textDate);
    containerInfo.classList.add('tracker-transaction-item__info');

    const textType = document.createElement('p');
    if (transactionObject.type === 'income') {
        textType.classList.add('tracker-transaction-item__type--income');
        textType.innerText = 'Pemasukan';
    } else {
        textType.classList.add('tracker-transaction-item__type--expense');
        textType.innerText = 'Pengeluaran';
    }
    textType.setAttribute('data-testid', 'transactionItemType');

    const btnEditType = document.createElement('button');
    btnEditType.innerText = 'Ubah Tipe';
    btnEditType.setAttribute('data-testid', 'transactionItemEditTypeButton');
    btnEditType.classList.add('tracker-transaction-item__btn');

    const btnEditData = document.createElement('button');
    btnEditData.innerText = 'Edit Data';
    btnEditData.setAttribute('data-testid', 'transactionItemEditDataButton');
    btnEditData.setAttribute('id', 'btn-edit-type');
    btnEditData.classList.add('tracker-transaction-item__btn');

    const btnDelete = document.createElement('button');
    btnDelete.innerText = 'Hapus';
    btnDelete.setAttribute('data-testid', 'transactionItemDeleteButton');
    btnDelete.classList.add('tracker-transaction-item__btn');

    const btnGroupCard = document.createElement('div');
    btnGroupCard.append(btnEditType, btnEditData, btnDelete);
    btnGroupCard.classList.add('tracker-transaction-item__actions')

    const containerRight = document.createElement('div');
    containerRight.append(textType, btnGroupCard);
    containerRight.classList.add('tracker-transaction-item__right');

    const card = document.createElement('div');
    card.setAttribute('data-testid', 'transactionItem');
    card.append(containerInfo, containerRight);
    card.setAttribute('id', `transaction-${transactionObject.id}`);
    card.classList.add('tracker-transaction-item');

    btnEditType.addEventListener('click', function() {
        if (transactionObject.type === 'income') {
            moveTransactionToExpense(transactionObject.id);
        } else {
            moveTransactionToIncome(transactionObject.id);
        }
    });

    btnEditData.addEventListener('click', function () {
        editDataTransaction(transactionObject.id);
        if (document.getElementById('transactionFormTypeSelect').value === 'expense') {
            document.getElementById('transactionFormTypeSelect').value = 'income';
        } else {
            document.getElementById('transactionFormTypeSelect').value = 'expense';
        }
    });

    btnDelete.addEventListener('click', function () {
        removeTransaction(transactionObject.id);
    });

    return card;
};

function moveTransactionToExpense (transactionId) {
    const transactionTarget = findTransactionIndex(transactionId);

    if (transactionTarget === -1) return;

    transactions[transactionTarget].type = 'expense';
    document.dispatchEvent(new Event(RENDER_EVENT));

    saveData();
}

function moveTransactionToIncome (transactionId) {
    const transactionTarget = findTransactionIndex(transactionId);

    if (transactionTarget === -1) return;

    transactions[transactionTarget].type = 'income';
    document.dispatchEvent(new Event(RENDER_EVENT));

    saveData();
}

/**
 * TODO [Skilled]:
 * Tambahkan event listener 'input' pada kolom pencarian:
 *  - Filter array transaksi berdasarkan kecocokan kata kunci dengan judul transaksi
 *  - Tampilkan hanya transaksi yang judulnya mengandung kata kunci tersebut
 */

const searchInput = document.getElementById('searchTransactionFormTitleInput');

searchInput.addEventListener('input', function (event) {
    searchKeyword = event.target.value.toLowerCase();
    document.dispatchEvent(new Event(RENDER_EVENT));
});


/**
 * TODO [Advanced]:
 * Pastikan fitur pencarian berjalan dengan baik di semua kondisi:
 *  - Saat kolom pencarian dikosongkan, tampilkan kembali seluruh daftar transaksi
 */

function updateChart() {
    let totalIncome = 0;
    let totalExpense = 0;

    // 1. Hitung total masing-masing kategori
    for (const transaction of transactions) {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
            totalExpense += transaction.amount;
        }
    }

    // 2. Hitung total keseluruhan sirkulasi uang (Cashflow)
    const totalCashflow = totalIncome + totalExpense;

    // Ambil elemen DOM grafik
    const incomeBar = document.getElementById('income-bar');
    const expenseBar = document.getElementById('expense-bar');
    const incomeText = document.getElementById('income-percentage');
    const expenseText = document.getElementById('expense-percentage');

    // 3. Jika belum ada data, set grafik seimbang 50:50 atau kosong
    if (totalCashflow === 0) {
        incomeBar.style.width = '0%';
        expenseBar.style.width = '0%';
        incomeText.innerText = 'Pemasukan: 0%';
        expenseText.innerText = 'Pengeluaran: 0%';
        return;
    }

    // 4. Menghitung persentase masing-masing kategori
    const incomePercentage = Math.round((totalIncome / totalCashflow) * 100);
    const expensePercentage = Math.round((totalExpense / totalCashflow) * 100);

    // 5. MANIPULASI DOM: Ubah lebar bar dan teks persentase di layar secara dinamis
    incomeBar.style.width = `${incomePercentage}%`;
    expenseBar.style.width = `${expensePercentage}%`;

    incomeText.innerText = `Pemasukan: ${incomePercentage}%`;
    expenseText.innerText = `Pengeluaran: ${expensePercentage}%`;
};