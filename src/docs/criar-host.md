# Criar um host

Leva menos de um minuto. No painel, abra **Hosts** e clique em **Novo host**.

## 1. Escolha o endereço

O **nome do host** é só para você reconhecer no painel (por exemplo, "Clínica Asa Sul"). Em seguida, escolha o subdomínio e a zona. O painel mostra na hora se o endereço está livre.

![Passo "Endereço" do assistente de criação](/docs/img/novo-host-endereco.png)

> Nomes reservados, como `www` e `api`, não podem ser usados. Se você excluir um host, o nome fica reservado só para você por 15 dias.

## 2. Escolha como vai conectar

Selecione o tipo de conexão: API / HTTP (PC ou servidor), MikroTik, pfSense / OPNsense, UniFi ou ddclient. Isso só muda o tutorial que o painel mostra.

![Escolha do tipo de conexão](/docs/img/novo-host-conexao.png)

## 3. Guarde o token

Ao criar o host, o painel mostra o **token uma única vez**. Copie e guarde em um lugar seguro. Se perder, gere outro na página do host: o token antigo deixa de funcionar na hora.

![Token do host e tutorial já preenchido](/docs/img/token.png)

Abaixo do token está o tutorial do conector escolhido, com o seu endereço e o token já preenchidos.

Continue em [conectar um PC ou servidor](/docs/conectar-pc) ou [conectar um roteador](/docs/conectar-roteador).
