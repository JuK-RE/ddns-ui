// Perguntas frequentes da landing. Também alimentam o JSON-LD (FAQPage) e o
// llms.txt gerado no build — edite aqui e tudo se atualiza junto.
//
// As respostas aceitam links no formato [texto](url): "/rota" vira link
// interno e "https://..." abre em nova aba (ver ui/RichText).
export type Faq = { q: string; a: string }

export const faqs: Faq[] = [
  {
    q: 'O que é um DDNS?',
    a: 'É um jeito de ter um endereço fixo, tipo casa.seudominio.com, mesmo quando o IP da sua internet muda. Você acessa sempre pelo mesmo nome e ele se atualiza sozinho.',
  },
  {
    q: 'Preciso ter IP fixo?',
    a: 'Não. O DDNS existe justamente pra quem não tem. Quando a operadora trocar o seu IP, o endereço passa a apontar pro novo automaticamente.',
  },
  {
    q: 'Como o IP é atualizado?',
    a: 'Você pode usar o nosso cliente (CLI) ou configurar o próprio roteador pra avisar a gente. De tempos em tempos ele confere o IP e só manda uma atualização quando alguma coisa mudou.',
  },
  {
    q: 'Funciona no meu roteador?',
    a: 'Provavelmente sim. Funciona com MikroTik, UniFi, pfSense, TP-Link, Windows Server, Ubuntu e qualquer aparelho que consiga acessar um link na internet.',
  },
  {
    q: 'Quanto custa o DDNS da JUK.re?',
    a: 'Pra uso pessoal, é de graça. Se você quer usar na sua empresa, [fale com a nossa equipe](https://www.jucasoft.com.br/) e a gente te ajuda a encontrar o melhor plano.',
  },
  {
    q: 'Posso ter a minha própria versão?',
    a: 'Pode sim. O [código é aberto](https://github.com/JuK-RE/ddns), então você pode ver como tudo funciona, mudar o que quiser e rodar na sua própria conta da [Cloudflare](https://www.cloudflare.com/).',
  },
]
