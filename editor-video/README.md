# Estúdio Reels

Editor de vídeos verticais (9:16, 1080×1920) para Instagram e TikTok. Roda inteiro no navegador: nada é enviado para servidor.

## Como abrir
1. Baixe `index.html`.
2. Abra no **Google Chrome** ou no **Edge** atualizados. O Safari e o Firefox não geram MP4.
3. Precisa de internet só para as fontes e para baixar o modelo de legendas (uma vez).

## Fluxo "Falando para a câmera"
1. Envie o vídeo. Os silêncios são detectados automaticamente.
2. Enquadramento: preencher a tela ou vídeo inteiro com fundo desfocado.
3. Ajuste o corte de pausas, se precisar.
4. Gere as legendas com IA (Whisper, roda no seu PC) e revise o texto.
5. Gancho no topo, chamada no final, logo e música.
6. Exporte. A gravação roda em tempo real: deixe a aba visível.

## Fluxo "Montagem"
Imagens ou slides de texto com zoom lento, transição suave e `*destaque*` na cor da marca.
Com narração, os slides se ajustam ao tempo do áudio e dá para gerar legendas dela.

## Limitações conhecidas
- Vídeo HEVC do iPhone pode não abrir no Chrome do Windows. Grave em "Mais compatível".
- A exportação leva o tempo do próprio vídeo.
- Na primeira vez, a legenda automática baixa de 200 a 600 MB.

## Roteiro com IA e teleprompter
- **Escrever roteiro com IA:** escolha a área, o formato e o tema (ou clique em "Sugerir 10 temas"). Usa a API do Claude, com regras da OAB (Provimento 205/2021) no comando.
  Precisa de uma chave da API da Anthropic (console.anthropic.com), que fica salva só no seu navegador. Cada roteiro custa poucos centavos.
- **Teleprompter:** o texto rola perto da câmera e grava pelo navegador. Ao parar, o vídeo entra direto no editor.
  `[Entre colchetes]` vira lembrete que não é para ler; `*entre asteriscos*` fica em destaque.
- **Usar roteiro como legenda:** gera as legendas a partir do texto, com tempo aproximado.
