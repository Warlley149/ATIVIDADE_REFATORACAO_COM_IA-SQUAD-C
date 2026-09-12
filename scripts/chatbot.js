/**
 * Chatbot Widget - Squad C
 * Integração com API Backend do Google Gemini
 */

(function () {
  'use strict';

  const BACKEND_URL = 'http://localhost:3000/api/chat';
  const history = [];

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }

  function initChatbot() {
    // Evita duplicatas se o script for carregado mais de uma vez
    if (document.getElementById('squad-chatbot-root')) return;

    // Injeta a estrutura HTML do widget
    const wrapper = document.createElement('div');
    wrapper.id = 'squad-chatbot-root';
    wrapper.className = 'squad-chatbot-wrapper';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Assistente Virtual Squad C');

    wrapper.innerHTML = `
      <!-- Janela do Chat -->
      <div class="squad-chat-window" id="squad-chat-window" role="dialog" aria-modal="true" aria-labelledby="squad-chat-title">
        <header class="squad-chat-header">
          <div class="squad-chat-header-info">
            <div class="squad-chat-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5Z"/></svg>
            </div>
            <div>
              <h2 class="squad-chat-title" id="squad-chat-title">Squad C IA</h2>
              <p class="squad-chat-status">Gemini 3.7 Flash</p>
            </div>
          </div>
          <button type="button" class="squad-chat-close-btn" id="squad-chat-close" aria-label="Fechar chat">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </header>

        <div class="squad-chat-messages" id="squad-chat-messages" aria-live="polite">
          <div class="squad-msg squad-msg-bot">
            <div class="squad-msg-bubble">
              <p>Olá! Sou o <strong>Assistente Virtual do Squad C</strong> 🤖.</p>
              <p>Posso tirar dúvidas sobre nossa equipe, nossos projetos, serviços ou sobre o case de sucesso da DeliveryMax. O que você gostaria de saber?</p>
              <span class="squad-msg-time">${getCurrentTime()}</span>
            </div>
          </div>
        </div>

        <div class="squad-chat-chips" id="squad-chat-chips">
          <button type="button" class="squad-chip-btn" data-msg="Quais serviços o Squad C oferece?">Serviços</button>
          <button type="button" class="squad-chip-btn" data-msg="Quem são os integrantes da equipe?">Integrantes</button>
          <button type="button" class="squad-chip-btn" data-msg="Fale sobre o case da DeliveryMax">Case DeliveryMax</button>
          <button type="button" class="squad-chip-btn" data-msg="Como entrar em contato com o Squad C?">Contato</button>
        </div>

        <footer class="squad-chat-footer">
          <form class="squad-chat-form" id="squad-chat-form">
            <input
              type="text"
              id="squad-chat-input"
              class="squad-chat-input"
              placeholder="Digite sua dúvida..."
              autocomplete="off"
              required
              aria-label="Mensagem para o assistente"
            />
            <button type="submit" class="squad-chat-send-btn" id="squad-chat-send" aria-label="Enviar mensagem">
              <svg viewBox="0 0 24 24"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </form>
        </footer>
      </div>

      <!-- Botão Flutuante (Launcher) -->
      <button type="button" class="squad-chat-toggle" id="squad-chat-toggle" aria-expanded="false" aria-controls="squad-chat-window" aria-label="Abrir assistente virtual">
        <span class="squad-chat-badge" aria-hidden="true"></span>
        <svg class="icon-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 14H6l-2 2V4h16z"/></svg>
        <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    `;

    document.body.appendChild(wrapper);

    // Seletores de elementos
    const toggleBtn = document.getElementById('squad-chat-toggle');
    const closeBtn = document.getElementById('squad-chat-close');
    const chatForm = document.getElementById('squad-chat-form');
    const chatInput = document.getElementById('squad-chat-input');
    const sendBtn = document.getElementById('squad-chat-send');
    const messagesContainer = document.getElementById('squad-chat-messages');
    const chipsContainer = document.getElementById('squad-chat-chips');

    // Alternar visibilidade
    function toggleChat(forceOpen) {
      const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !wrapper.classList.contains('is-open');
      if (shouldOpen) {
        wrapper.classList.add('is-open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        setTimeout(() => chatInput.focus(), 150);
        scrollToBottom();
      } else {
        wrapper.classList.remove('is-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    }

    toggleBtn.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    // Fechar ao pressionar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wrapper.classList.contains('is-open')) {
        toggleChat(false);
      }
    });

    // Cliques nos chips de sugestão rápida
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.squad-chip-btn');
      if (chip) {
        const text = chip.getAttribute('data-msg');
        if (text) {
          chatInput.value = text;
          handleSend(text);
        }
      }
    });

    // Envio do formulário
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      handleSend(text);
    });

    // Função de envio
    async function handleSend(userText) {
      chatInput.value = '';
      appendMessage('user', userText);
      history.push({ role: 'user', text: userText });

      // Oculta chips após a primeira interação para liberar espaço
      if (chipsContainer) {
        chipsContainer.style.display = 'none';
      }

      // Desabilita campos durante processamento
      chatInput.disabled = true;
      sendBtn.disabled = true;

      // Exibe indicador de digitação
      const typingEl = showTypingIndicator();
      scrollToBottom();

      try {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userText,
            history: history.slice(-6) // Envia as últimas interações de contexto
          })
        });

        removeTypingIndicator(typingEl);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error || `Erro ${response.status}: Não foi possível processar a resposta.`;
          appendMessage('bot', `⚠️ ${errMsg}`);
          return;
        }

        const data = await response.json();
        const replyText = data.reply || 'Desculpe, não consegui obter uma resposta.';
        appendMessage('bot', replyText);
        history.push({ role: 'assistant', text: replyText });

      } catch (err) {
        removeTypingIndicator(typingEl);
        console.error('Erro de conexão com o servidor do Chatbot:', err);
        appendMessage(
          'bot',
          '⚠️ **Não foi possível conectar ao servidor backend do Chatbot.**\n\n' +
          'Certifique-se de que o servidor está rodando na porta 3000:\n' +
          '1. Abra o terminal na pasta `squads/squad-C/server`\n' +
          '2. Execute `npm start`\n' +
          '3. Verifique se sua chave da API está no `.env`.'
        );
      } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
        scrollToBottom();
      }
    }

    // Renderiza balão de mensagem
    function appendMessage(sender, rawText) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `squad-msg squad-msg-${sender}`;

      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = 'squad-msg-bubble';
      bubbleDiv.innerHTML = formatMarkdown(rawText) + `<span class="squad-msg-time">${getCurrentTime()}</span>`;

      msgDiv.appendChild(bubbleDiv);
      messagesContainer.appendChild(msgDiv);
    }

    // Indicador de digitação
    function showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'squad-msg squad-msg-bot squad-typing-wrapper';
      typingDiv.innerHTML = `
        <div class="squad-typing-indicator" aria-label="Assistente pensando">
          <span class="squad-typing-dot"></span>
          <span class="squad-typing-dot"></span>
          <span class="squad-typing-dot"></span>
        </div>
      `;
      messagesContainer.appendChild(typingDiv);
      return typingDiv;
    }

    function removeTypingIndicator(el) {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }

    function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function getCurrentTime() {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Formatador simples e seguro de Markdown
    function formatMarkdown(text) {
      if (!text) return '';
      // Escape HTML
      let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Negrito: **texto**
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Itálico: *texto*
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Código inline: `código`
      html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:2px 4px;border-radius:4px;">$1</code>');
      
      // Quebras de linha para <p>
      const paragraphs = html.split(/\n\n+/);
      return paragraphs.map(p => {
        p = p.trim();
        if (!p) return '';
        // Linhas com marcadores
        if (p.startsWith('- ') || p.startsWith('* ')) {
          const items = p.split('\n').map(li => {
            const clean = li.replace(/^[-*]\s+/, '');
            return `<li>${clean}</li>`;
          }).join('');
          return `<ul>${items}</ul>`;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      }).join('');
    }
  }
})();
