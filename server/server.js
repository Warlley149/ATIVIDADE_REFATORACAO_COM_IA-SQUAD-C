import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Middlewares
app.use(cors());
app.use(express.json());

// Contexto e instrução de sistema do Squad C
const SYSTEM_INSTRUCTION = `
Você é o Assistente Virtual Oficial do Squad C.
O Squad C é uma equipe multidisciplinar de inovação e desenvolvimento web/software na FICR.
Seu objetivo é apresentar o Squad C, tirar dúvidas sobre o portfólio, serviços, projetos, integrantes e cases de sucesso, sempre de maneira gentil, profissional, moderna e concisa.

Informações sobre a equipe e o site do Squad C:
1. Integrantes da Equipe:
   - Warlley Santos: Líder técnico, Arquiteto de Software e Desenvolvedor Fullstack.
   - Bruno Cauã: Desenvolvedor Front-end, especialista em UI/UX e Design Systems acessíveis.
   - Alessandro Gomes: Desenvolvedor Back-end, especialista em integração de APIs e arquitetura de dados.
   - Luís Gabriel: Desenvolvedor Front-end e QA, com foco em performance e responsividade.

2. Serviços oferecidos pelo Squad C:
   - Design de Interfaces (UI/UX): Criação de protótipos modernos, acessíveis e focados na melhor experiência do usuário.
   - Desenvolvimento Web Moderno: Soluções completas com HTML5, CSS3 moderno, JavaScript e frameworks de ponta.
   - Otimização de Performance e Acessibilidade (a11y): Sites ultra-rápidos e em conformidade com as diretrizes WCAG.
   - Consultoria e Arquitetura Digital: Estruturação de projetos escaláveis e seguros.

3. Case de Sucesso em Destaque:
   - Cliente: DeliveryMax (aplicativo de delivery).
   - Desafio: Redesenho do fluxo de checkout e interface para reduzir o abandono de pedidos.
   - Resultados: Redução de 42% no abandono de checkout, aumento de 27% nas vendas convertidas, tempo de compra reduzido para 19 segundos e avaliação média de satisfação 4.8/5.

4. Navegação do Site:
   - Início: Visão geral da equipe.
   - Cases de sucesso: Estudo de caso aprofundado do DeliveryMax.
   - Serviços: Detalhes das soluções oferecidas.
   - Projetos: Portfólio dos trabalhos práticos desenvolvidos.
   - Depoimentos: Avaliações reais de clientes e parceiros.
   - Habilidades: Grade detalhada das competências técnicas de cada membro.
   - Sobre nós: História, valores e propósito do Squad C.
   - Contatos: Formulário e canais para contratação e contato.

Diretrizes de resposta:
- Responda sempre em português de forma simpática, clara e em parágrafos curtos.
- Use formatação markdown moderada quando ajudar (como listas e negrito).
- Se perguntarem algo fora do contexto de tecnologia ou do Squad C, responda educadamente e convide o usuário a conhecer mais sobre as soluções do Squad C.
`;

// Rota de verificação de saúde do servidor
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'sua_chave_aqui');
  res.json({
    status: 'online',
    model: MODEL,
    configured: hasKey,
    message: hasKey
      ? 'Servidor e API do Gemini configurados com sucesso.'
      : 'Servidor ativo, mas a chave GEMINI_API_KEY ainda não foi definida no .env.'
  });
});

// Rota principal do Chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'A mensagem não pode ser vazia.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Se o usuário ainda não colocou a chave no .env, devolvemos uma resposta amigável
    if (!apiKey || apiKey.trim() === '' || apiKey === 'sua_chave_aqui') {
      return res.json({
        reply: 'Olá! Sou o Assistente Virtual do Squad C 👋\n\nO servidor backend está funcionando perfeitamente, mas a **chave de API do Gemini** ainda não foi configurada.\n\n👉 Para ativar a IA, abra o arquivo `squads/squad-C/server/.env` e adicione sua chave em `GEMINI_API_KEY=sua_chave_aqui` (você pode gerar uma gratuitamente no Google AI Studio).'
      });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    // Montar histórico de conversação
    const contents = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item && item.text && typeof item.text === 'string') {
          contents.push({
            role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
            parts: [{ text: item.text }]
          });
        }
      }
    }

    // Adiciona a mensagem atual
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    // Modelos para fallback caso ocorra 503 (alta demanda)
    const fallbackModels = [MODEL, 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash']
      .filter((m, idx, arr) => arr.indexOf(m) === idx);

    let lastError = null;
    let reply = null;

    for (const modelName of fallbackModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION
          }
        });
        reply = response.text || 'Desculpe, não consegui formular uma resposta no momento.';
        break; // Sucesso!
      } catch (err) {
        lastError = err;
        console.warn(`Tentativa com modelo ${modelName} falhou:`, err.message || err);
        // Continua para o próximo modelo se for erro de demanda/temporário
      }
    }

    if (!reply && lastError) {
      throw lastError;
    }

    res.json({ reply: reply || 'Desculpe, não consegui formular uma resposta no momento.' });

  } catch (error) {
    console.error('Erro ao chamar a API do Gemini:', error);

    let clientMessage = 'Ocorreu um erro ao processar sua solicitação com o Gemini.';
    const errMsg = error.message || '';

    if (errMsg.includes('API_KEY_INVALID')) {
      clientMessage = 'A chave da API do Gemini informada no `.env` é inválida. Por favor, verifique sua chave no Google AI Studio.';
    } else if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      clientMessage = 'A cota da API do Gemini foi atingida temporariamente. Aguarde alguns instantes e tente novamente.';
    } else if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand')) {
      clientMessage = 'Os servidores do Google Gemini estão com alta demanda momentânea. Por favor, aguarde alguns segundos e envie novamente.';
    }

    res.status(500).json({ error: clientMessage });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor do Chatbot Squad C rodando em http://localhost:${PORT}`);
  console.log(`🩺 Health check disponível em http://localhost:${PORT}/api/health`);
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '' || process.env.GEMINI_API_KEY === 'sua_chave_aqui') {
    console.log(`⚠️ ATENÇÃO: Configure a variável GEMINI_API_KEY no arquivo .env`);
  } else {
    console.log(`✅ Chave do Gemini configurada.`);
  }
});
