// 전역 변수
let currentScreen = 'home';
let questions = [];
let currentQuestionIndex = 0;
let isAdmin = false;
let sortableInstance = null;
let answerSortable = null;

// 화면 관리
function showScreen(screenName) {
    console.log('화면 전환:', screenName);
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenName;
    } else {
        console.error('화면을 찾을 수 없습니다:', screenName);
    }
}

// 로컬 스토리지 관리
function saveData() {
    try {
        localStorage.setItem('wordgame_questions', JSON.stringify(questions));
        console.log('데이터 저장 완료');
    } catch (error) {
        console.error('데이터 저장 실패:', error);
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem('wordgame_questions');
        if (saved) {
            questions = JSON.parse(saved);
            console.log('데이터 로드 완료:', questions.length, '개 문제');
        } else {
            console.log('저장된 데이터가 없습니다');
        }
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        questions = [];
    }
}

function savePassword(password) {
    try {
        localStorage.setItem('wordgame_password', password);
        console.log('비밀번호 저장 완료');
    } catch (error) {
        console.error('비밀번호 저장 실패:', error);
    }
}

function getPassword() {
    try {
        return localStorage.getItem('wordgame_password');
    } catch (error) {
        console.error('비밀번호 로드 실패:', error);
        return null;
    }
}

// 문제 관리
function addQuestion(questionText, answerText, hintText = '') {
    if (questions.length >= 5) {
        alert('최대 5문제까지만 등록할 수 있습니다.');
        return false;
    }
    
    questions.push({
        id: Date.now(),
        question: questionText,
        answer: answerText,
        hint: hintText
    });
    saveData();
    console.log('문제 추가 완료');
    return true;
}

function deleteQuestion(id) {
    questions = questions.filter(q => q.id !== id);
    saveData();
    console.log('문제 삭제 완료');
}

function updateQuestion(id, questionText, answerText, hintText = '') {
    const question = questions.find(q => q.id === id);
    if (question) {
        question.question = questionText;
        question.answer = answerText;
        question.hint = hintText;
        saveData();
        console.log('문제 수정 완료');
    }
}

// 게임 로직
function startGame() {
    console.log('게임 시작 시도');
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
    const questionElement = document.getElementById('question-text');
    const counterElement = document.getElementById('question-counter');
    const hintBtn = document.getElementById('hint-btn');
    
    if (questionElement) {
        questionElement.textContent = question.question;
    }
    
    if (counterElement) {
        counterElement.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
    }
    
    // 힌트 버튼 표시/숨김
    if (hintBtn) {
        if (question.hint && question.hint.trim()) {
            hintBtn.style.display = 'inline-block';
        } else {
            hintBtn.style.display = 'none';
        }
    }
    
    setupDragAndDrop(question.answer);
}

function setupDragAndDrop(answer) {
    const answerArea = document.getElementById('answer-area');
    const dragPool = document.getElementById('drag-pool');
    
    if (!answerArea || !dragPool) {
        console.error('게임 요소를 찾을 수 없습니다');
        return;
    }
    
    // 기존 내용 클리어
    answerArea.innerHTML = '<div class="answer-placeholder">여기에 글자를 끌어다 놓으세요</div>';
    answerArea.classList.remove('has-content');
    dragPool.innerHTML = '';
    
    // 정답 글자들
    const answerChars = answer.split('');
    
    // 방해 글자들 생성 (한글 음절)
    const distractors = [
        '가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하',
        '거', '너', '더', '러', '머', '버', '서', '어', '저', '처', '커', '터', '퍼', '허',
        '고', '노', '도', '로', '모', '보', '소', '오', '조', '초', '코', '토', '포', '호',
        '구', '누', '두', '루', '무', '부', '수', '우', '주', '추', '쿠', '투', '푸', '후',
        '그', '느', '드', '르', '므', '브', '스', '으', '즈', '츠', '크', '트', '프', '흐',
        '기', '니', '디', '리', '미', '비', '시', '이', '지', '치', '키', '티', '피', '히',
        '개', '네', '데', '레', '메', '베', '세', '에', '제', '체', '케', '테', '페', '헤',
        '게', '느', '데', '레', '메', '베', '세', '에', '제', '체', '케', '테', '페', '헤',
        '갸', '냐', '댜', '랴', '먀', '뱌', '샤', '야', '쟈', '챠', '캬', '탸', '퍄', '햐',
        '겨', '녀', '뎌', '려', '며', '벼', '셔', '여', '져', '쳐', '켜', '텨', '펴', '혀',
        '교', '뇨', '됴', '료', '묘', '뵤', '쇼', '요', '죠', '쵸', '쿄', '툐', '표', '효',
        '규', '뉴', '듀', '류', '뮤', '뷰', '슈', '유', '쥬', '츄', '큐', '튜', '퓨', '휴',
        '강', '낭', '당', '랑', '망', '방', '상', '앙', '장', '창', '캉', '탕', '팡', '항',
        '곳', '놋', '돗', '롯', '못', '봇', '솟', '옷', '좃', '촛', '콧', '톳', '폿', '흣'
    ];
    
    // 정답에 없는 방해 글자 5개 선택
    const availableDistractors = distractors.filter(char => !answerChars.includes(char));
    const selectedDistractors = [];
    
    for (let i = 0; i < 5 && i < availableDistractors.length; i++) {
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
    
    // SortableJS 사용 가능 여부 확인
    if (typeof Sortable !== 'undefined') {
        try {
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
            console.log('Sortable 초기화 완료');
        } catch (error) {
            console.error('Sortable 초기화 실패:', error);
        }
    } else {
        console.error('SortableJS 라이브러리를 찾을 수 없습니다');
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function checkAnswer() {
    const answerArea = document.getElementById('answer-area');
    if (!answerArea) {
        console.error('답 영역을 찾을 수 없습니다');
        return;
    }
    
    const tokens = answerArea.querySelectorAll('.char-token');
    
    if (tokens.length === 0) {
        alert('답을 입력해주세요!');
        return;
    }
    
    const userAnswer = Array.from(tokens).map(token => token.textContent).join('');
    const correctAnswer = questions[currentQuestionIndex].answer;
    
    console.log('사용자 답:', userAnswer, '정답:', correctAnswer);
    
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const resultNextBtn = document.getElementById('result-next-btn');
    
    if (userAnswer === correctAnswer) {
        if (resultTitle) resultTitle.textContent = '정답!';
        if (resultMessage) resultMessage.textContent = '잘했어요!';
        if (resultNextBtn) resultNextBtn.style.display = 'inline-block';
        showModal('result-modal');
    } else {
        if (resultTitle) resultTitle.textContent = '오답!';
        if (resultMessage) resultMessage.textContent = '다시 도전해보세요!';
        if (resultNextBtn) resultNextBtn.style.display = 'none';
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
    
    if (!answerArea || !dragPool) {
        console.error('게임 요소를 찾을 수 없습니다');
        return;
    }
    
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
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        console.log('모달 표시:', modalId);
    } else {
        console.error('모달을 찾을 수 없습니다:', modalId);
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        console.log('모달 숨김:', modalId);
    }
}

// 관리자 인증
function checkAdminAccess() {
    console.log('관리자 접근 시도');
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
    const modalTitle = document.getElementById('password-modal-title');
    const passwordInput = document.getElementById('password-input');
    
    if (modalTitle) modalTitle.textContent = title;
    if (passwordInput) {
        passwordInput.placeholder = placeholder;
        passwordInput.value = '';
    }
    
    const confirmBtn = document.getElementById('password-confirm-btn');
    const cancelBtn = document.getElementById('password-cancel-btn');
    
    if (!confirmBtn || !cancelBtn) {
        console.error('모달 버튼을 찾을 수 없습니다');
        return;
    }
    
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
            alert('비밀번호를 입력해주세요.');
        }
    });
    
    newCancelBtn.addEventListener('click', () => {
        hideModal('password-modal');
    });
    
    // Enter 키로 확인
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                newConfirmBtn.click();
            }
        });
    }
    
    showModal('password-modal');
    if (passwordInput) passwordInput.focus();
}

function showAdminPage() {
    console.log('관리자 페이지 표시');
    isAdmin = true;
    showScreen('admin');
    renderQuestions();
}

function showHint() {
    const question = questions[currentQuestionIndex];
    if (question && question.hint && question.hint.trim()) {
        const hintText = document.getElementById('hint-text');
        if (hintText) {
            hintText.textContent = question.hint;
        }
        showModal('hint-modal');
    } else {
        alert('이 문제에는 힌트가 없습니다.');
    }
}

function changePassword() {
    showPasswordModal('새 비밀번호 입력', '새 비밀번호를 입력하세요', (password) => {
        savePassword(password);
        alert('비밀번호가 변경되었습니다.');
    });
}

// 관리자 페이지 문제 렌더링
function renderQuestions() {
    const container = document.getElementById('questions-list');
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <div class="question-display" id="display-${question.id}">
                <div class="question-text">Q${index + 1}: ${question.question}</div>
                <div class="answer-text">정답: ${question.answer}</div>
                <div class="hint-text">힌트: ${question.hint || '(힌트 없음)'}</div>
            </div>
            <div class="question-form" id="form-${question.id}" style="display: none;">
                <input type="text" name="question" value="${question.question}" placeholder="질문을 입력하세요">
                <input type="text" name="answer" value="${question.answer}" placeholder="정답을 입력하세요">
                <input type="text" name="hint" value="${question.hint || ''}" placeholder="힌트를 입력하세요 (선택사항)">
            </div>
            <div class="question-actions">
                <button class="btn btn-secondary" onclick="editQuestion(${question.id})">수정</button>
                <button class="btn btn-success" onclick="saveQuestion(${question.id})" id="save-${question.id}" style="display: none;">저장</button>
                <button class="btn btn-warning" onclick="cancelEdit(${question.id})" id="cancel-${question.id}" style="display: none;">취소</button>
                <button class="btn btn-danger" onclick="deleteQuestionConfirm(${question.id})">삭제</button>
            </div>
        `;
        container.appendChild(questionDiv);
    });
    
    // 새 문제 추가 폼
    if (questions.length < 5) {
        const addForm = document.createElement('div');
        addForm.className = 'question-item';
        addForm.innerHTML = `
            <div class="question-form" id="new-question-form">
                <input type="text" name="question" placeholder="새 질문을 입력하세요">
                <input type="text" name="answer" placeholder="정답을 입력하세요">
                <input type="text" name="hint" placeholder="힌트를 입력하세요 (선택사항)">
            </div>
            <div class="question-actions">
                <button class="btn btn-success" onclick="addNewQuestion()">저장</button>
                <button class="btn btn-secondary" onclick="hideAddForm()">취소</button>
            </div>
        `;
        addForm.style.display = 'none';
        addForm.id = 'add-question-form';
        container.appendChild(addForm);
    }
}

function editQuestion(id) {
    document.getElementById(`display-${id}`).style.display = 'none';
    document.getElementById(`form-${id}`).style.display = 'flex';
    document.querySelector(`#save-${id}`).style.display = 'inline-block';
    document.querySelector(`#cancel-${id}`).style.display = 'inline-block';
    document.querySelector(`button[onclick="editQuestion(${id})"]`).style.display = 'none';
}

function saveQuestion(id) {
    const form = document.getElementById(`form-${id}`);
    const questionText = form.querySelector('input[name="question"]').value.trim();
    const answerText = form.querySelector('input[name="answer"]').value.trim();
    
    if (!questionText || !answerText) {
        alert('질문과 정답을 모두 입력해주세요.');
        return;
    }
    
    updateQuestion(id, questionText, answerText);
    renderQuestions();
}

function cancelEdit(id) {
    renderQuestions();
}

function deleteQuestionConfirm(id) {
    if (confirm('정말 이 문제를 삭제하시겠습니까?')) {
        deleteQuestion(id);
        renderQuestions();
    }
}

function showAddForm() {
    document.getElementById('add-question-form').style.display = 'block';
    document.getElementById('add-question-btn').style.display = 'none';
}

function hideAddForm() {
    document.getElementById('add-question-form').style.display = 'none';
    document.getElementById('add-question-btn').style.display = 'inline-block';
}

function addNewQuestion() {
    const form = document.getElementById('new-question-form');
    const questionText = form.querySelector('input[name="question"]').value.trim();
    const answerText = form.querySelector('input[name="answer"]').value.trim();
    
    if (!questionText || !answerText) {
        alert('질문과 정답을 모두 입력해주세요.');
        return;
    }
    
    if (addQuestion(questionText, answerText)) {
        renderQuestions();
    }
}

// 전역 함수로 관리자 페이지 함수들 정의 (onclick에서 호출하기 위해)
window.editQuestion = function(id) {
    document.getElementById(`display-${id}`).style.display = 'none';
    document.getElementById(`form-${id}`).style.display = 'flex';
    document.querySelector(`#save-${id}`).style.display = 'inline-block';
    document.querySelector(`#cancel-${id}`).style.display = 'inline-block';
    document.querySelector(`button[onclick="editQuestion(${id})"]`).style.display = 'none';
};

window.saveQuestion = function(id) {
    const form = document.getElementById(`form-${id}`);
    const questionText = form.querySelector('input[name="question"]').value.trim();
    const answerText = form.querySelector('input[name="answer"]').value.trim();
    const hintText = form.querySelector('input[name="hint"]').value.trim();
    
    if (!questionText || !answerText) {
        alert('질문과 정답을 모두 입력해주세요.');
        return;
    }
    
    updateQuestion(id, questionText, answerText, hintText);
    renderQuestions();
};

window.cancelEdit = function(id) {
    renderQuestions();
};

window.deleteQuestionConfirm = function(id) {
    if (confirm('정말 이 문제를 삭제하시겠습니까?')) {
        deleteQuestion(id);
        renderQuestions();
    }
};

window.addNewQuestion = function() {
    const form = document.getElementById('new-question-form');
    const questionText = form.querySelector('input[name="question"]').value.trim();
    const answerText = form.querySelector('input[name="answer"]').value.trim();
    const hintText = form.querySelector('input[name="hint"]').value.trim();
    
    if (!questionText || !answerText) {
        alert('질문과 정답을 모두 입력해주세요.');
        return;
    }
    
    if (addQuestion(questionText, answerText, hintText)) {
        renderQuestions();
    }
};

window.hideAddForm = function() {
    document.getElementById('add-question-form').style.display = 'none';
    document.getElementById('add-question-btn').style.display = 'inline-block';
};

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드 완료'); // 디버깅용
    
    // 데이터 로드
    loadData();
    
    // 홈 화면 버튼들
    const startBtn = document.getElementById('start-game-btn');
    const adminBtn = document.getElementById('admin-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            console.log('게임 시작 버튼 클릭'); // 디버깅용
            startGame();
        });
    }
    
    if (adminBtn) {
        adminBtn.addEventListener('click', function() {
            console.log('관리자 버튼 클릭'); // 디버깅용
            checkAdminAccess();
        });
    }
    
    // 게임 화면 버튼들
    const endBtn = document.getElementById('end-game-btn');
    const checkBtn = document.getElementById('check-answer-btn');
    const resetBtn = document.getElementById('reset-answer-btn');
    const hintBtn = document.getElementById('hint-btn');
    
    if (endBtn) {
        endBtn.addEventListener('click', () => showScreen('home'));
    }
    
    if (checkBtn) {
        checkBtn.addEventListener('click', checkAnswer);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAnswer);
    }
    
    if (hintBtn) {
        hintBtn.addEventListener('click', showHint);
    }
    
    // 관리자 화면 버튼들
    const changePassBtn = document.getElementById('change-password-btn');
    const adminHomeBtn = document.getElementById('admin-home-btn');
    const addQuestionBtn = document.getElementById('add-question-btn');
    
    if (changePassBtn) {
        changePassBtn.addEventListener('click', changePassword);
    }
    
    if (adminHomeBtn) {
        adminHomeBtn.addEventListener('click', () => showScreen('home'));
    }
    
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', showAddForm);
    }
    
    // 결과 모달 버튼들
    const resultNextBtn = document.getElementById('result-next-btn');
    const resultHomeBtn = document.getElementById('result-home-btn');
    
    if (resultNextBtn) {
        resultNextBtn.addEventListener('click', nextQuestion);
    }
    
    if (resultHomeBtn) {
        resultHomeBtn.addEventListener('click', () => {
            hideModal('result-modal');
            showScreen('home');
        });
    }
    
    // 완료 모달 버튼
    const completeHomeBtn = document.getElementById('complete-home-btn');
    if (completeHomeBtn) {
        completeHomeBtn.addEventListener('click', () => {
            hideModal('complete-modal');
            showScreen('home');
        });
    }
    
    // 힌트 모달 버튼
    const hintCloseBtn = document.getElementById('hint-close-btn');
    if (hintCloseBtn) {
        hintCloseBtn.addEventListener('click', () => {
            hideModal('hint-modal');
        });
    }
    
    // 모달 외부 클릭시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    console.log('모든 이벤트 리스너 등록 완료'); // 디버깅용
});
