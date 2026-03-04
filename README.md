# 📦 newEstoque - Gestão de Ativos de TI

Aplicativo mobile desenvolvido para otimizar a logística, o controle de estoque e o gerenciamento de patrimônio do setor de Tecnologia da Informação da Universidade Santa Cecília (Unisanta). 

O sistema substitui processos manuais por uma interface ágil com leitura de código de barras, centralizando o controle de hardware (computadores, monitores, periféricos) em um banco de dados em tempo real.

## 🚀 Funcionalidades

- **Autenticação Segura:** Login para técnicos de TI com persistência de sessão.
- **Leitor de Patrimônio (Scanner):** Integração com a câmera do dispositivo para leitura instantânea de plaquinhas de patrimônio (Padrão Code 128/39).
- **Formulários Dinâmicos:** Interface inteligente que adapta os campos de cadastro com base no tipo de equipamento (ex: exige "Processador" apenas para Computadores/Notebooks).
- **Gestão Centralizada (Single Collection):** Todos os ativos salvos de forma unificada no banco de dados, utilizando o número do patrimônio como ID único para evitar duplicatas e acelerar consultas.
- **Busca e Filtros em Tempo Real:** Listagem de estoque com pesquisa instantânea por patrimônio, modelo ou local (sala/laboratório), além de filtros rápidos por categoria.

## 🛠 Tecnologias Utilizadas

- **[React Native](https://reactnative.dev/):** Framework principal para desenvolvimento mobile multiplataforma.
- **[Expo (SDK 54)](https://expo.dev/):** Plataforma e toolchain para React Native, facilitando o acesso a APIs nativas (como a câmera).
- **[Firebase](https://firebase.google.com/):**
  - **Firestore:** Banco de dados NoSQL em tempo real para armazenamento dos equipamentos.
  - **Authentication:** Gerenciamento de usuários e controle de acesso.
- **React Navigation:** Controle de rotas e navegação (Stack e Drawer).
- **Expo Camera:** Leitura e processamento de códigos de barra.
- **AsyncStorage:** Persistência de dados locais (sessão do usuário).