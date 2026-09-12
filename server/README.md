# 🤖 Servidor Backend - Chatbot Squad C (Gemini AI)

Este servidor provê a API de integração entre o assistente virtual flutuante das páginas do **Squad C** e a inteligência artificial do **Google Gemini**.

---

## 📋 Pré-requisitos
- **Node.js** instalado (v18 ou superior).

---

## 🚀 Como Configurar e Rodar

### 1. Instalar as dependências
Abra o terminal nesta pasta (`squads/squad-C/server`) e execute:
```bash
npm install
```

### 2. Configurar a Chave da API do Gemini
1. Obtenha sua chave gratuita no [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Abra o arquivo `.env` nesta pasta.
3. Cole sua chave na variável `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   PORT=3000
   GEMINI_MODEL=gemini-2.5-flash
   ```

> 🔒 **Segurança:** O arquivo `.env` está protegido pelo `.gitignore` e **nunca** será enviado para o repositório Git.

### 3. Iniciar o servidor
Execute:
```bash
npm start
```
Ou em modo de desenvolvimento com recarregamento automático:
```bash
npm run dev
```

O servidor estará rodando em: **`http://localhost:3000`**

---

## 📡 Endpoints da API

- **`GET /api/health`**: Verifica se o servidor está no ar e se a chave do Gemini foi carregada.
- **`POST /api/chat`**: Envia mensagem para o Gemini com o contexto do Squad C.
  - Formato do JSON:
    ```json
    {
      "message": "Quais são os serviços oferecidos pelo Squad C?",
      "history": []
    }
    ```
