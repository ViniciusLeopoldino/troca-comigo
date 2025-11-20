# 🧠 Troca Comigo - Global Solution 2025 🚀

> **Economia Colaborativa onde o tempo é a única moeda.**

O **Troca Comigo** é uma plataforma mobile desenvolvida para democratizar o acesso ao conhecimento. O aplicativo conecta pessoas dispostas a ensinar com pessoas querendo aprender, utilizando um sistema de **Créditos de Tempo** (1 hora de aula = 1 crédito), sem envolvimento financeiro.

---

## 👨‍💻 Integrantes do Grupo (FIAPEIROS)

| Nome | RM | 
| :--- | :--- | 
| **Guilherme Felipe da Silva Souza** | **558282** | 
| **Pablo Lopes Doria de Andrade** | **556834** | 
| **Vinicius Leopoldino de Oliveira** | **557047** |

---

## 📱 Links Importantes

- 🎥 **Vídeo de Demonstração (YouTube):** [LINK AQUI]
- 📲 **Download do App (APK - Android):** [Baixar Versão Final (Expo EAS)](https://expo.dev/artifacts/eas/gJpgCkUxvU1B3yDJs88CJp.apk)
- 🌐 **Backend API (Java):** [Link do Swagger ou Repositório da API se houver]

---

## ✨ Funcionalidades Principais

### 🔐 Autenticação & Segurança
* **Login e Cadastro:** Integração completa com API Java Spring Boot via JWT.
* **Proteção de Rotas:** Context API gerenciando sessão do usuário.
* **Validações:** Formulários blindados contra dados inválidos.

### 🤝 Marketplace de Habilidades
* **Busca Inteligente:** Filtros dinâmicos para encontrar Mentores (Quero Aprender) ou Alunos (Quero Ensinar).
* **Agendamento:** Solicitação de sessões com definição de duração e custo em créditos.
* **Geração de Link:** Criação automática de links para Google Meet.

### 📅 Gestão de Sessões
* **Histórico Completo:** Abas separadas para sessões Agendadas e Concluídas.
* **Ações Rápidas:** Botões para acessar a sala de aula (Link), enviar e-mail, cancelar ou concluir a sessão.
* **Avaliação:** Sistema de rating (5 estrelas) que impacta a reputação do usuário no Dashboard.

### 🤖 Inteligência Artificial & Perfil
* **IA Matchmaking:** Algoritmo (simulado no front) que cruza os interesses de aprendizado do usuário com as ofertas do mercado.
* **Gerador de Bio com IA:** Funcionalidade no perfil que cria uma biografia profissional automática baseada nas skills cadastradas.
* **Avatar:** Upload e seleção de foto da galeria nativa.

### 📊 Dashboard & Gamificação
* **Carteira de Tempo:** Saldo de créditos atualizado em tempo real conforme o usuário ensina (ganha) ou aprende (gasta).
* **Estatísticas:** Contadores de aulas dadas vs. recebidas.

---

## 🛠️ Arquitetura e Tecnologias

O projeto foi construído utilizando **Clean Code** e componentização avançada.

* **Frontend:** React Native (Expo SDK 52).
* **Linguagem:** TypeScript.
* **Estilização:** StyleSheet (Design System fiel ao Figma).
* **Gerenciamento de Estado:** React Context API (`AuthContext`, `ThemeContext`).
* **Persistência:** AsyncStorage.
* **Comunicação API:** Axios com Interceptors.

### 🌟 Diferencial Técnico: Arquitetura Resiliente (Optimistic UI)
Para garantir a usabilidade do aplicativo mesmo em cenários de instabilidade do servidor ou restrições de segurança (Erros 403/500), implementamos uma **Camada de Persistência Híbrida**:

1.  O App tenta salvar a transação no Backend.
2.  Se o Backend falhar ou rejeitar, o App intercepta o erro, salva os dados localmente (**Offline Mode**) e atualiza a interface instantaneamente.
3.  Isso garante que o usuário nunca tenha uma experiência frustrante de "Erro no sistema", mantendo a fluidez da navegação.

---

## 🎨 Design e UX

* **Tema Dinâmico:** Suporte completo a **Modo Claro** e **Modo Escuro** (selecionável pelo usuário).
* **Feedback Visual:** Loadings, Badges coloridas para status e Alertas nativos.
* **Acessibilidade:** Cores com bom contraste e inputs adaptados.

---

## 🚀 Como rodar o projeto localmente

1.  **Clone o repositório:**
    ```bash
    git clone [SEU_LINK_DO_GIT]
    cd troca-comigo
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Execute o projeto:**
    ```bash
    npx expo start -c
    ```

4.  **Abra no celular:** Escaneie o QR Code com o aplicativo **Expo Go** (Android) ou Câmera (iOS).

---

> *Global Solution 2025 - FIAP*