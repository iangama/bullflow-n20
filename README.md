BullFlow Nível 20

Este projeto implementa um sistema completo de processamento assíncrono de tarefas utilizando Redis, BullMQ, Workers dedicados e uma API desacoplada. O front-end funciona apenas como painel de visualização do ciclo de vida dos jobs. A lógica real ocorre no pipeline de execução entre API, fila e worker.

Arquitetura

1. API (Node + Express)
   Responsável por receber requisições, criar jobs e enviá-los para o Redis via BullMQ. Não executa nenhum trabalho pesado. Apenas agenda a tarefa e registra no banco.

2. Redis (broker de fila)
   Atua como mecanismo de armazenamento e coordenação dos jobs. Garante ordem, distribuição e retry caso necessário.

3. Worker (Node)
   Serviço separado que consome jobs da fila, executa a lógica necessária e atualiza o banco com status, progresso e resultado final. Suporta concorrência e pode ser escalado horizontalmente.

4. Banco de dados (Postgres)
   Armazena informações persistentes sobre cada job: tipo, status, progresso, resultado, timestamps e erros. Permite auditoria e acompanhamento de tarefas finalizadas.

5. Front-end (Vite + React + Tailwind)
   Painel simples para visualizar jobs criados, acompanhar progresso, ver resultados e criar novas solicitações. O front apenas exibe informações; não executa nenhuma lógica pesada.

6. Traefik
   Roteia a API e o front-end através de entrypoints unificados utilizando o padrão SAFE adotado no projeto.

Fluxo de execução

1. O usuário cria uma tarefa pelo front-end.
2. A API registra e envia a tarefa para a fila.
3. O Redis armazena o job e o disponibiliza para consumo.
4. O worker retira o job da fila, processa e atualiza o estado no Postgres.
5. O front consulta periodicamente a API para exibir status, progresso e resultados.

Objetivo do nível

O objetivo do Nível 20 é compreender e implementar a arquitetura fundamental de sistemas assíncronos modernos. A separação entre API, fila e worker é utilizada em aplicações reais como processamento de imagens, envio de e-mails, sistemas de billing, pipelines de dados, automação e serviços de alto volume.

Este projeto estabelece a base para níveis superiores envolvendo múltiplas filas, prioridades, workers especializados, observabilidade completa, métricas, tracing e balanceamento de carga.
