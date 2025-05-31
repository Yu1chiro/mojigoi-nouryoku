let currentQuestion = null;
let selectedAnswer = null;
let stats = {
    total: 0,
    correct: 0,
    wrong: 0
};

// Custom Alert Function
function showAlert(title, message, type = 'info') {
    const modal = document.getElementById('alertModal');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertIcon = document.getElementById('alertIcon');

    alertTitle.textContent = title;
    alertMessage.textContent = message;
    // Reset class warna sebelumnya dari alertTitle
    alertTitle.classList.remove('text-green-600', 'text-red-600', 'text-blue-600', 'text-yellow-600', 'text-orange-600');

    // Atur warna berdasarkan type
    if (type === 'success') {
        alertTitle.classList.add('text-green-600');
    } else if (type === 'error') {
        alertTitle.classList.add('text-red-600');
    } else if (type === 'warning') {
        alertTitle.classList.add('text-yellow-600');
    } else if (type === 'rate-limit') {
        alertTitle.classList.add('text-orange-600');
    } else {
        alertTitle.classList.add('text-blue-600'); // info/default
    }

    // Set isi teks
    alertTitle.textContent = title;
    alertMessage.innerHTML = message;
    
    // Set icon berdasarkan type
    if (type === 'success') {
        alertIcon.innerHTML = '<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div>';
        
        // Tampilkan gambar dan putar audio untuk jawaban benar
        showNotificationMedia('/audio/sekai.mp3');
        
    } else if (type === 'error') {
        alertIcon.innerHTML = '<div class="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></div>';
        
        // Tampilkan gambar dan putar audio untuk jawaban salah
        showNotificationMedia('/audio/batsu.mp3');
        
    } else if (type === 'rate-limit') {
        alertIcon.innerHTML = '<div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></div>';
        
    } else if (type === 'warning') {
        alertIcon.innerHTML = '<div class="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></div>';
        
    } else {
        alertIcon.innerHTML = '<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></div>';
    }

    modal.classList.remove('hidden');
}

// Function untuk menampilkan notifikasi rate limit dengan countdown
function showRateLimitAlert(remainingTime, used, limit) {
    const title = 'Wah! Kamu Cukup Berlatih Hari ini ✨';
    let message = `Untuk menghemat resource, kamu sudah berlatih dari batas harianmu saat ini ${used}/${limit} belajar.<br>`;
    message += `Sambil menunggu <span id="countdown" class="font-bold text-orange-600">${remainingTime}</span>  Yuk istirahat terlebih dahulu😊`;
    
    showAlert(title, message, 'rate-limit');
    
    // Start countdown
    let timeLeft = remainingTime;
    const countdownElement = document.getElementById('countdown');
    
    const countdownInterval = setInterval(() => {
        timeLeft--;
        if (countdownElement) {
            countdownElement.textContent = timeLeft;
        }
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            // Tutup modal otomatis setelah countdown selesai
            document.getElementById('alertModal').classList.add('hidden');
            showAlert('Materi Ready ✅', 'Kamu dapat melanjutkan soal sekarang 🚀 Silahkan refresh browsermu ya!', 'success');
        }
    }, 1000);
}

// Function untuk menampilkan gambar dan memutar audio
function showNotificationMedia(audioPath) {
    // Putar audio
    const audio = new Audio(audioPath);
    audio.volume = 0.7; // Atur volume
    audio.play().catch(error => {
        console.log('Error playing audio:', error);
    });
    
    // Hapus gambar setelah 2 detik
    setTimeout(() => {
        if (document.getElementById('imageOverlay')) {
            document.body.removeChild(imageOverlay);
        }
    }, 2000);
}

// Close alert modal
document.getElementById('alertCloseBtn').addEventListener('click', () => {
    document.getElementById('alertModal').classList.add('hidden');
});

// Load question from API
async function loadQuestion() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('questionCard').classList.add('hidden');

    try {
        const response = await fetch('/api/generate-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (result.success) {
            currentQuestion = result.data;
            displayQuestion();
        } else {
            // Cek apakah ini error rate limiting
            if (result.error === 'rate_limit_exceeded') {
                showRateLimitAlert(result.remainingTime, result.used, result.limit);
                
                // Disable tombol "Soal Baru" sementara
                const newQuestionBtn = document.getElementById('newQuestionBtn');
                newQuestionBtn.disabled = true;
                newQuestionBtn.textContent = `Tunggu ${result.remainingTime}s`;
                newQuestionBtn.classList.add('opacity-50', 'cursor-not-allowed');
                
                // Enable kembali setelah cooldown
                setTimeout(() => {
                    newQuestionBtn.disabled = false;
                    newQuestionBtn.textContent = 'Soal Baru';
                    newQuestionBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }, result.remainingTime * 1000);
                
            } else {
                showAlert('Error', 'Gagal memuat soal: ' + result.error, 'error');
            }
        }
    } catch (error) {
        console.error('Error loading question:', error);
        showAlert('Error', 'Terjadi kesalahan saat memuat soal', 'error');
    }

    document.getElementById('loading').classList.add('hidden');
}

// Display question
function displayQuestion() {
    if (!currentQuestion) return;

    // Clean and format question text
    let questionText = currentQuestion.question;
    questionText = questionText.replace(/\//g, '').replace(/\//g, '');
    
    document.getElementById('questionText').innerHTML = questionText;

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    currentQuestion.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all';
        optionDiv.innerHTML = `
            <label class="flex items-center cursor-pointer">
                <input type="radio" name="answer" value="${option.charAt(0)}" class="mr-3 text-blue-600">
                <span class="text-gray-800">${option}</span>
            </label>
        `;

        optionDiv.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('#options > div').forEach(div => {
                div.classList.remove('border-blue-500', 'bg-blue-50');
                div.classList.add('border-gray-200');
            });

            // Add selection to clicked option
            optionDiv.classList.remove('border-gray-200');
            optionDiv.classList.add('border-blue-500', 'bg-blue-50');
            
            const radio = optionDiv.querySelector('input[type="radio"]');
            radio.checked = true;
            selectedAnswer = radio.value;
        });

        optionsContainer.appendChild(optionDiv);
    });

    document.getElementById('questionCard').classList.remove('hidden');
    selectedAnswer = null;
}

// Submit answer
function submitAnswer() {
    if (!selectedAnswer) {
        showAlert('すみません！', '答えを選びなさい！', 'error');
        return;
    }

    stats.total++;
    const isCorrect = selectedAnswer === currentQuestion.correct;

    if (isCorrect) {
        stats.correct++;
        showAlert('正しい！良くできました！', ` ${currentQuestion.explanation || ''}`, 'success');
    } else {
        stats.wrong++;
        showAlert('残念ながら、答えが間違いました！', `${currentQuestion.correct}. ${currentQuestion.explanation || ''}`, 'error');
    }

    updateStats();
}

// Update statistics
function updateStats() {
    document.getElementById('totalQuestions').textContent = stats.total;
    document.getElementById('correctAnswers').textContent = stats.correct;
    document.getElementById('wrongAnswers').textContent = stats.wrong;
    document.getElementById('stats').classList.remove('hidden');
}

// Function untuk cek status rate limit (opsional)
async function checkRateLimitStatus() {
    try {
        const response = await fetch('/api/rate-limit-status');
        const data = await response.json();
        
        // Tampilkan info rate limit di UI jika diperlukan
        console.log('Rate limit status:', data);
        
        if (!data.canRequest && data.remainingTime > 0) {
            const newQuestionBtn = document.getElementById('newQuestionBtn');
            newQuestionBtn.disabled = true;
            newQuestionBtn.textContent = `Tunggu ${data.remainingTime}s`;
            newQuestionBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        return data;
    } catch (error) {
        console.error('Error checking rate limit status:', error);
    }
}

// Event listeners
document.getElementById('submitBtn').addEventListener('click', submitAnswer);
document.getElementById('newQuestionBtn').addEventListener('click', loadQuestion);

// Load first question when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Cek status rate limit terlebih dahulu
    checkRateLimitStatus().then(() => {
        loadQuestion();
    });
});