// 전역 변수
let currentScreen = 'home';
let questions = [];
let currentQuestionIndex = 0;
let isAdmin = false;
let sortableInstance = null;
let answerSortable = null;

// 화면 관리
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenName}-screen`).classList.add('active');
    currentScreen = screenName;
}

// 로컬 스토리지 관리
function saveData() {
    localStorage.setItem('wordgame_questions', JSON.stringify(questions));
}

function loadData() {
    const saved = localStorage.getItem('wordgame_questions');
    if (saved) {
        questions = JSON.parse(saved);
    }
}

function savePassword(password) {
    localStorage.setItem('wordgame_password', password);
}

function getPassword() {
    return localStorage.getItem('wordgame_password');
}

// 문제 관리
function addQuestion(questionText, answerText) {
    if (questions.length >= 5) {
        alert('최대 5문제까지만 등록할 수 있습니다.');
        return false;
    }
    
    questions.push({
        id: Date.now(),
        question: questionText,
        answer: answerText
    });
    saveData();
    return true;
}

function deleteQuestion(id) {
    questions = questions.filter(q => q.id !== id);
    saveData();
}

function updateQuestion(id, questionText, answerText) {
    const question = questions.find(q => q.id === id);
    if (question) {
        question.question = questionText;
        question.answer = answerText;
        saveData();
    }
}

// 게임 로직
function startGame() {
    if (questions.length === 0) {
        alert('등록된 문제가 없습니다. 관리자 페이지에서 문제를 등록해주세요.');
        return;
    }
    
    currentQuestionIndex = 0;
    showScreen('game');
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showModal('complete-modal');
        return;
    }
    
    const question = questions[currentQuestionIndex];
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('question-counter').textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
    
    setupDragAndDrop(question.answer);
}

function setupDragAndDrop(answer) {
    const answerArea = document.getElementById('answer-area');
    const dragPool = document.getElementById('drag-pool');
    
    // 기존 내용 클리어
    answerArea.innerHTML = '<div class="answer-placeholder">여기에 글자를 끌어다 놓으세요</div>';
    answerArea.classList.remove('has-content');
    dragPool.innerHTML = '';
    
    // 정답 글자들
    const answerChars = answer.split('');
    
    // 방해 글자들 생성 (한글 자모)
    const distractors = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 
                        'ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ',
                        '가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];
    
    // 정답에 없는 방해 글자 3개 선택
    const availableDistractors = distractors.filter(char => !answerChars.includes(char));
    const selectedDistractors = [];
    
    for (let i = 0; i < 3 && i < availableDistractors.length; i++) {
        const randomIndex = Math.floor(Math.random() * availableDistractors.length);
        selectedDistractors.push(availableDistractors.splice(randomIndex, 1)[0]);
    }
    
    // 모든 글자를 섞어서 표시
    const allChars = [...answerChars, ...selectedDistractors];
    shuffleArray(allChars);
    
    // 드래그 가능한 글자 토큰 생성
    allChars.forEach(char => {
        const token = document.createElement('div');
        token.className = 'char-token';
        token.textContent = char;
        token.draggable = true;
        dragPool.appendChild(token);
    });
    
    // Sortable 설정
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    if (answerSortable) {
        answerSortable.destroy();
    }
    
    sortableInstance = Sortable.create(dragPool, {
        group: {
            name: 'shared',
            pull: 'clone',
            put: false
        },
        animation: 150,
        sort: false,
        onStart: function(evt) {
            evt.item.classList.add('dragging');
        },
        onEnd: function(evt) {
            evt.item.classList.remove('dragging');
        }
    });
    
    answerSortable = Sortable.create(answerArea, {
        group: {
            name: 'shared',
            pull: true,
            put: true
        },
        animation: 150,
        onAdd: function(evt) {
            answerArea.classList.add('has-content');
            // 원본 요소 제거 (복제본만 남김)
            const originalItem = dragPool.querySelector(`[data-id="${evt.item.dataset.id}"]`);
            if (originalItem && originalItem !== evt.item) {
                originalItem.remove();
            }
        },
        onChange: function(evt) {
            if (answerArea.children.length === 0) {
                answerArea.classList.remove('has-content');
                answerArea.innerHTML = '<div class="answer-placeholder">여기에 글자를 끌어다 놓으세요</div>';
            }
        }
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function checkAnswer() {
    const answerArea = document.getElementById('answer-area');
    const tokens = answerArea.querySelectorAll('.char-token');
    
    if (tokens.length === 0) {
        alert('답을 입력해주세요!');
        return;
    }
    
    const userAnswer = Array.from(tokens).map(token => token.textContent).join('');
    const correctAnswer = questions[currentQuestionIndex].answer;
    
    if (userAnswer === correctAnswer) {
        document.getElementById('result-title').textContent = '정답!';
        document.getElementById('result-message').textContent = '잘했어요!';
        document.getElementById('result-next-btn').style.display = 'inline-block';
        showModal('result-modal');
    } else {
        document.getElementById('result-title').textContent = '오답!';
        document.getElementById('result-message').textContent = '다시 도전해보세요!';
        document.getElementById('result-next-btn').style.display = 'none';
        showModal('result-modal');
        
        // 글자 재섞기
        setTimeout(() => {
            resetAnswer();
        }, 1500);
    }
}

function resetAnswer() {
    const answerArea = document.getElementById('answer-area');
    const dragPool = document.getElementById('drag-pool');
    
    // 답 영역의 토큰들을 드래그 풀로 되돌리기
    const tokens = answerArea.querySelectorAll('.char-token');
    tokens.forEach(token => {
        dragPool.appendChild(token);
    });
    
    // 답 영역 초기화
    answerArea.innerHTML = '<div class="answer-placeholder">여기에 글자를 끌어다 놓으세요</div>';
    answerArea.classList.remove('has-content');
    
    // 드래그 풀의 글자들 재섞기
    const poolTokens = Array.from(dragPool.querySelectorAll('.char-token'));
    shuffleArray(poolTokens);
    dragPool.innerHTML = '';
    poolTokens.forEach(token => dragPool.appendChild(token));
}

function nextQuestion() {
    currentQuestionIndex++;
    hideModal('result-modal');
    loadQuestion();
}

// 모달 관리
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 관리자 인증
function checkAdminAccess() {
    const savedPassword = getPassword();
    
    if (!savedPassword) {
        // 첫 진입 시 비밀번호 설정
        showPasswordModal('비밀번호 설정', '새 비밀번호를 입력하세요', (password) => {
            savePassword(password);
            showAdminPage();
        });
    } else {
        // 기존 비밀번호 확인
        showPasswordModal('비밀번호 입력', '관리자 비밀번호를 입력하세요', (password) => {
            if (password === savedPassword) {
                showAdminPage();
            } else {
                alert('비밀번호가 틀렸습니다.');
            }
        });
    }
}

function showPasswordModal(title, placeholder, callback) {
    document.getElementById('password-modal-title').textContent = title;
    document.getElementById('password-input').placeholder = placeholder;
    document.getElementById('password-input').value = '';
    
    const confirmBtn = document.getElementById('password-confirm-btn');
    const cancelBtn = document.getElementById('password-cancel-btn');
    
    // 기존 이벤트 리스너 제거
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // 새 이벤트 리스너 추가
    newConfirmBtn.addEventListener('click', () => {
        const password = document.getElementById('password-input').value;
        if (password.trim()) {
            hideModal('password-modal');
            callback(password);
        } else {
