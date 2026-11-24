// BASE INICIAL — NÃO EXECUTA ENTREGAS AINDA.
// A versão de @minecraft/server-net precisa ser confirmada para o BDS instalado.
// Não coloque credenciais do Mercado Pago neste addon.
import { world } from "@minecraft/server";
import { http, HttpRequest, HttpRequestMethod, HttpHeader } from "@minecraft/server-net";

const API_BASE = "https://SEU-DOMINIO.com";
const BRIDGE_TOKEN = "COLOQUE_UM_TOKEN_EXCLUSIVO_DA_PONTE";

world.afterEvents.worldLoad.subscribe(() => {
  world.sendMessage("§6[TRIVO STORE] §7Ponte carregada em modo de preparação. Entregas ainda desativadas.");
});

// Implementar polling/ack somente depois de validar a API e a versão do módulo.
// Nunca execute comandos arbitrários recebidos da internet.
// Use uma lista de comandos permitidos e valide o nick antes de executar.
