/**
 * Receptor de leads da Calculadora Imobiliária — Google Apps Script (gratuito)
 *
 * O que faz a cada lead:
 *  1. Grava uma linha na planilha (aba "Leads")
 *  2. Envia ao cliente o resumo da simulação por e-mail
 *  3. Avisa o escritório por e-mail
 *
 * Instalação (5 min):
 *  1. Crie uma Planilha Google > Extensões > Apps Script > cole este código.
 *  2. Ajuste as constantes abaixo.
 *  3. Implantar > Nova implantação > Tipo: App da Web
 *       Executar como: Eu | Quem pode acessar: Qualquer pessoa
 *  4. Copie a URL /exec e cole em CONFIG.webhookLeads no index.html.
 *
 * Cota de e-mails do Apps Script: ~100/dia (Gmail grátis) ou ~1.500/dia (Google Workspace).
 */
const ESCRITORIO = "Seu Escritório de Advocacia";
const EMAIL_ESCRITORIO = "contato@seudominio.com.br";   // recebe o aviso de cada lead
const WHATSAPP = "5500000000000";
const ENVIAR_EMAIL_AO_CLIENTE = true;

function doPost(e) {
  const d = JSON.parse(e.postData.contents || "{}");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("Leads") || ss.insertSheet("Leads");
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Data", "Evento", "Nome", "E-mail", "Tipo", "Valor mín.", "Valor máx.", "Valor imóvel",
                  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "Página", "Resumo"]);
    sh.setFrozenRows(1);
  }
  sh.appendRow([new Date(), d.evento, d.nome, d.email, d.tipo, d.valorMin, d.valorMax, d.valorImovel,
                d.utm_source, d.utm_medium, d.utm_campaign, d.utm_content, d.utm_term, d.gclid, d.fbclid, d.pagina, d.resumo]);

  if (d.evento === "lead" && d.email) {
    const nome = String(d.nome || "").split(" ")[0];
    const wa = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent("Olá! Sou " + d.nome + " e recebi minha simulação por e-mail. Quero uma análise do meu caso.");
    if (ENVIAR_EMAIL_AO_CLIENTE) {
      MailApp.sendEmail({
        to: d.email,
        name: ESCRITORIO,
        replyTo: EMAIL_ESCRITORIO,
        subject: "Sua simulação — " + (d.tipo === "atraso" ? "atraso na entrega da obra" : "distrato do imóvel"),
        htmlBody:
          "<p>Olá, " + nome + "!</p>" +
          "<p>Segue o resumo da simulação que você fez no nosso site:</p>" +
          "<pre style='background:#f5f3ee;padding:12px;border-radius:8px;font-family:inherit'>" + escapeHtml(d.resumo) + "</pre>" +
          "<p>Esse valor é uma <b>estimativa</b>. O valor real depende da análise do seu contrato e dos comprovantes de pagamento — " +
          "e em muitos casos há verbas que a simulação não alcança.</p>" +
          "<p><a href='" + wa + "' style='background:#1fa855;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold'>Falar com um advogado no WhatsApp</a></p>" +
          "<p>" + ESCRITORIO + "</p>" +
          "<p style='color:#888;font-size:12px'>Você recebeu este e-mail porque solicitou a simulação e autorizou o contato. Responda \"remover\" para não receber mais mensagens.</p>"
      });
    }
    MailApp.sendEmail(EMAIL_ESCRITORIO, "Novo lead da calculadora: " + d.nome + " (" + d.tipo + ")",
      d.nome + "\n" + d.email + "\n\n" + d.resumo + "\n\nOrigem: " + (d.utm_source || "direto") + " / " + (d.utm_campaign || "-"));
  }
  return ContentService.createTextOutput("ok");
}

function escapeHtml(s) { return String(s || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
