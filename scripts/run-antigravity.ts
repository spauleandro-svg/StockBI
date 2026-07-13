import { GoogleGenAI } from "@google/genai";

// Cores ANSI para formatação elegante no terminal
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";

async function main() {
  console.log(`\n${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}🚀 EXECUTANDO O AGENTE ANTIGRAVITY (BI & ESTOQUE PREDITIVO) 🚀${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}\n`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(`${RED}${BOLD}❌ Erro: A variável de ambiente GEMINI_API_KEY não está configurada!${RESET}`);
    console.log(`\nComo configurar:`);
    console.log(`1. No menu de configurações do AI Studio (Settings > Secrets), insira sua chave.`);
    console.log(`2. Ou execute localmente definindo a variável de ambiente:`);
    console.log(`   ${YELLOW}export GEMINI_API_KEY="sua_chave_aqui"${RESET}\n`);
    process.exit(1);
  }

  // Inicializando o SDK do Google Gen AI
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-antigravity',
      }
    }
  });

  // Dados de estoque realísticos para a simulação do café gourmet
  const inventoryData = [
    {
      id: "P001",
      name: "Café Espresso Blend Premium 1kg",
      stock: 12,
      dailyDemand: 4.5,
      leadTimeDays: 5,
      unitCost: 85.00,
      holdingCostPct: 0.15,
      orderCost: 45.00
    },
    {
      id: "P002",
      name: "Copo Térmico Descartável 300ml (Pct 100un)",
      stock: 8,
      dailyDemand: 12.0,
      leadTimeDays: 3,
      unitCost: 22.50,
      holdingCostPct: 0.15,
      orderCost: 20.00
    },
    {
      id: "P003",
      name: "Açúcar Sachê Orgânico (Pct 1000un)",
      stock: 150,
      dailyDemand: 1.2,
      leadTimeDays: 7,
      unitCost: 42.00,
      holdingCostPct: 0.15,
      orderCost: 35.00
    }
  ];

  const prompt = `
    Você é o Analista Virtual de Supply Chain (Agente Antigravity).
    Temos o seguinte conjunto de dados de estoque atual do nosso café gourmet:
    ${JSON.stringify(inventoryData, null, 2)}

    Sua missão dentro da sua sandbox Linux:
    1. Escreva e execute um script em Python para calcular com precisão matemática:
       - O "Ponto de Pedido" (Reorder Point = Demanda Diária * Lead Time em dias).
       - O "Lote Econômico de Compra" (EOQ = raiz_quadrada((2 * Demanda Anual * Custo de Pedido) / Custo Anual de Armazenamento)). Considere a demanda anual como a Demanda Diária * 365 dias, e o custo anual de armazenamento por unidade como unitCost * holdingCostPct.
       - Verifique se o estoque atual está abaixo ou igual ao Ponto de Pedido (Sinalizar Alerta de Compra Urgente).
    2. Leia as saídas do script e monte uma análise estruturada apresentando uma tabela Markdown com as colunas: Código, Produto, Estoque Atual, Ponto de Pedido, EOQ, Status do Alerta, e Ação Recomendada.
    3. Explique sucintamente os passos executados na sua sandbox e a metodologia empregada.
  `;

  console.log(`${BLUE}ℹ️ Enviando dados de estoque para análise e inicializando a sandbox remota...${RESET}`);
  console.log(`${BLUE}ℹ️ O Agente Antigravity irá raciocinar, escrever scripts Python e executá-los em tempo real.${RESET}\n`);

  try {
    // Criação da interação de streaming com o Agente Antigravity
    const stream = await ai.interactions.create({
      agent: "antigravity-preview-05-2026",
      input: prompt,
      environment: "remote", // Provisiona a sandbox remota baseada em Linux
      stream: true,
    });

    let currentStepType = "";

    for await (const event of stream) {
      if (event.event_type === "interaction.created") {
        const interaction = event.interaction as any;
        console.log(`${GREEN}✔ Interação criada com sucesso! ID: ${interaction.id}${RESET}`);
        console.log(`${GREEN}✔ Sandbox remota iniciada! ID do Ambiente: ${interaction.environment_id}${RESET}\n`);
      } 
      
      else if (event.event_type === "step.start") {
        const step = event.step;
        currentStepType = step?.type || "";
        
        if (currentStepType === "thought") {
          console.log(`\n${MAGENTA}[Pensamento do Agente / Raciocínio]${RESET}`);
        } else if (currentStepType === "code_execution_call") {
          console.log(`\n${YELLOW}[Sandbox Linux: Escrevendo e Executando Código]${RESET}`);
        } else if (currentStepType === "code_execution_result") {
          console.log(`\n${GREEN}[Sandbox Linux: Retorno da Execução do Código]${RESET}`);
        } else if (currentStepType === "model_output") {
          console.log(`\n${CYAN}[Análise e Resposta Final do Analista]${RESET}`);
        } else {
          console.log(`\n${BLUE}[Passo Iniciado: ${currentStepType}]${RESET}`);
        }
      } 
      
      else if (event.event_type === "step.delta") {
        const delta = event.delta as any;
        if (delta && delta.text) {
          // Imprime o stream incremental da resposta
          process.stdout.write(delta.text);
        }
      } 
      
      else if (event.event_type === "step.stop") {
        // Passo concluído
        process.stdout.write("\n");
      } 
      
      else if (event.event_type === "interaction.completed") {
        const interaction = event.interaction as any;
        console.log(`\n\n${BOLD}${GREEN}================================================================================${RESET}`);
        console.log(`${BOLD}${GREEN}✔ Análise concluída com sucesso!${RESET}`);
        console.log(`${GREEN}Tokens Utilizados: ${interaction.usage?.total_tokens || "N/A"}${RESET}`);
        console.log(`${BOLD}${GREEN}================================================================================${RESET}\n`);
      }
    }

  } catch (error: any) {
    console.error(`\n${RED}${BOLD}❌ Ocorreu um erro durante a execução do Antigravity:${RESET}`, error);
    process.exit(1);
  }
}

main();
