Placar de Jogos - v1

Estrutura:
- server.js         -> servidor Express que serve /public e grava/ler /data/*.json
- package.json      -> dependências e script start
- /public           -> frontend (index.html + pages + css + js + assets)
- /data             -> banco JSON por jogo: uno.json, baralho.json, domino.json

Como usar (local):
1. Abra terminal na pasta do projeto (a pasta que contém package.json).
2. Rode: npm install
3. Rode: npm start
4. Abra no navegador: http://localhost:3000

Funcionalidades:
- Frontend mostra placares por jogo, permite adicionar/remover jogadores, incrementar vitórias.
- Ranking exibido em tabela e em lista (1º colocado recebe destaque e coroa).
- Dados são salvos no servidor (arquivos JSON em /data). Se o servidor não estiver disponível, há fallback para localStorage.

Notas de organização:
- O código está comentado e organizado para facilitar a adição de novos modos de jogo.
- Endpoints da API: GET /api/:game  e POST /api/:game  (envie array completo de jogadores)

Pronto para evoluir:
- Painel admin, export/import CSV/JSON, autenticação e estatísticas podem ser adicionados posteriormente.
