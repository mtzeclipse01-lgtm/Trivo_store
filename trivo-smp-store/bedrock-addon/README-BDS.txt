TRIVO STORE BRIDGE — PREPARAÇÃO BDS

A integração de rede do Bedrock Dedicated Server usa @minecraft/server-net.
Esse módulo é experimental/pré-lançamento e pode mudar entre versões.

Antes de ativar:
1. Confirme a versão exata do BDS e as versões disponíveis da Script API.
2. Confirme a versão de @minecraft/server-net compatível com essa build.
3. Autorize o módulo no permissions.json do BDS.
4. Configure endpoint HTTPS e token exclusivo.
5. Implemente polling, validação de resposta, execução dos comandos permitidos e confirmação (ack).
6. Teste com itens sem valor e pagamentos de teste.

Não coloque o Access Token do Mercado Pago no addon. O addon deve receber apenas o token específico da ponte e nunca ter acesso às credenciais financeiras.
