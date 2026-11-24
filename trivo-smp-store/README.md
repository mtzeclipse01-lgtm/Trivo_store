# TRIVO SMP STORE — versão inicial

Loja própria com visual escuro/dourado, backend Node.js, catálogo inicial, criação de checkout Mercado Pago e fila de entrega para integração com BDS.

## Requisitos
- Node.js 20 ou superior
- Hospedagem com HTTPS público para o site/API
- Conta Mercado Pago e credenciais de produção/teste
- BDS com suporte à versão compatível do `@minecraft/server-net`

## Rodar localmente
1. Extraia o ZIP.
2. Abra a pasta no terminal.
3. Execute `npm install`.
4. Copie `.env.example` para `.env`.
5. Configure `MP_ACCESS_TOKEN`, `BASE_URL` e `STORE_BRIDGE_TOKEN`.
6. Execute `npm start` e abra `http://localhost:3000`.

Sem credenciais do Mercado Pago, o catálogo abre, mas o checkout fica desativado.

## Mercado Pago
Configure a URL de webhook como `https://SEU-DOMINIO.com/api/webhooks/mercadopago` e habilite notificações de pagamentos. O backend consulta o pagamento na API do Mercado Pago antes de criar uma entrega. Não publique nem compartilhe o Access Token.

O checkout inicial usa Checkout Pro, que encaminha o comprador ao ambiente seguro do Mercado Pago. Os métodos disponíveis dependem da configuração e elegibilidade da conta.

## Produtos
Os produtos de demonstração estão em `server.js`, no objeto `PRODUCTS`. Altere preços e comandos antes de vender. O produto VIP está propositalmente com comando de demonstração: configure os benefícios reais antes de disponibilizá-lo.

## Integração BDS — atenção
A pasta `bedrock-addon` contém apenas o manifesto inicial e instruções. A ponte de rede ainda precisa ser implementada e testada com a versão exata do BDS e da Script API instalada. O módulo `@minecraft/server-net` é experimental/pré-lançamento e exige autorização em `permissions.json`. Não anuncie entrega automática como ativa até concluir os testes.

## Segurança antes de produção
- Use HTTPS.
- Use tokens longos e exclusivos.
- Não coloque credenciais do Mercado Pago no frontend nem no addon.
- Valide pagamento, valor e referência no backend.
- Restrinja os comandos de entrega a produtos previamente aprovados.
- Faça backup do banco `trivo-store.sqlite`.
- Teste pagamentos em sandbox antes de receber dinheiro real.
