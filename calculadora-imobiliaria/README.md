# Calculadora Imobiliária — Atraso de Obra e Distrato

Um único arquivo (`index.html`), sem dependências. Basta subir na hospedagem da landing page, ou embutir via `<iframe>` (WordPress, Elementor, Webflow, etc.).

## Configurar (topo do `<script>` em `index.html`)
```js
const CONFIG = {
  escritorio: "Seu Escritório de Advocacia",
  subtitulo: "Direito Imobiliário",
  oab: "OAB/UF 00.000",
  logo: "RZ",
  whatsapp: "5500000000000",   // DDI+DDD+número
  webhookLeads: "",            // URL p/ receber lead (Zapier/Make/n8n/CRM)
  atualizarIndicesOnline: true
};
```

## Uso
- Landing page: `index.html` (abre na aba Atraso). `?aba=distrato` abre direto no distrato.
- Reunião: botão **Modo reunião** (ou `?reuniao`): tela cheia, campo do cliente, esconde o marketing; **Baixar relatório (PDF)** gera o relatório com memória de cálculo.

## Índices
IPCA, INCC-DI, INCC-M, IGP-M e Selic vêm embutidos (BCB/SGS, até out/2026) e são atualizados online ao abrir a página (API pública do Banco Central).

## Critérios de cálculo
**Atraso:** tolerância de 180 dias (art. 43-A); lucros cessantes de 0,5%–1% a.m. do valor atualizado do imóvel, pro rata die, corrigidos por competência (Tema 996); multa legal de 1% a.m. sobre o valor pago para contratos assinados a partir de 28/12/2018 (art. 43-A §2º); multa contratual; não cumulação, prevalece a maior (Tema 970); INCC cobrado a mais sobre o saldo devedor no período de atraso (Tema 996); condomínio e IPTU cobrados antes das chaves; danos morais apenas no cenário favorável.

**Distrato:** pagamentos corrigidos um a um. A oferta pelo contrato é comparada com a faixa judicial:
- culpa da construtora: 100% de devolução + corretagem (Súmula 543);
- contrato anterior à Lei do Distrato: retenção de 10%–25%;
- incorporação com patrimônio de afetação: 25%–50%;
- incorporação sem afetação: 10%–25%;
- loteamento: 10% sobre o valor pago até 10% sobre o valor do contrato.

Também considera a taxa de fruição, a corretagem (Tema 938) e o alerta de cláusula acima do teto legal.

**Juros (opcional):** 1% a.m. até 08/2024; depois, Selic − IPCA (Lei 14.905/24).

Estimativa — não substitui a análise do contrato.
