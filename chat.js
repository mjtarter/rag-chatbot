const messages = [];
const chatMessages = document.getElementById('chatMessages');
const chatInput   = document.getElementById('chatInput');
const sendBtn     = document.getElementById('sendBtn');
const suggestedEl = document.getElementById('suggestedQuestions');

// Suggested question chips
document.querySelectorAll('.sq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        chatInput.value = btn.dataset.q;
        suggestedEl.style.display = 'none';
        sendMessage();
    });
});

// Send on Enter (Shift+Enter = newline)
chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

sendBtn.addEventListener('click', sendMessage);

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || sendBtn.disabled) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';
    suggestedEl.style.display = 'none';

    appendMessage('user', text);
    messages.push({ role: 'user', content: text });

    sendBtn.disabled = true;
    const loadingId = appendLoading();

    try {
        const res = await fetch('chat.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
        });

        const data = await res.json();

        if (!res.ok) {
            const errMsg = data.error || 'Something went wrong. Please try again.';
            removeLoading(loadingId);
            appendMessage('assistant', errMsg);
            return;
        }

        const reply = data?.content?.[0]?.text ?? 'Sorry, I couldn\'t generate a response.';
        removeLoading(loadingId);
        appendMessage('assistant', reply);
        messages.push({ role: 'assistant', content: reply });

    } catch (err) {
        removeLoading(loadingId);
        appendMessage('assistant', 'Connection error. Please check your internet and try again.');
    } finally {
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

function appendMessage(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `message ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (role === 'assistant') {
        bubble.innerHTML = formatText(text);
    } else {
        bubble.textContent = text;
    }

    wrap.appendChild(bubble);
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const wrap = document.createElement('div');
    wrap.className = 'message assistant';
    wrap.id = id;
    wrap.innerHTML = '<div class="bubble loading"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

function removeLoading(id) {
    document.getElementById(id)?.remove();
}

function formatText(text) {
    // Escape HTML first to prevent XSS
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escaped
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')             // italic
        .replace(/\n/g, '<br>');                           // line breaks
}
