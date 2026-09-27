# Como o JUK.re DDNS funciona

O provedor de internet troca o IP da sua casa ou empresa de tempos em tempos. Para quem acessa uma câmera, um servidor ou uma área de trabalho remota, isso é um problema: o endereço muda e o acesso para de funcionar.

O JUK.re DDNS resolve isso com um **endereço fixo**, como `clinicajuca.ip.juk.re`, que sempre aponta para o IP atual da sua rede.

## Como o endereço acompanha o seu IP

1. Você cria um **host** no painel: escolhe o nome (`clinicajuca`) e a zona (`ip.juk.re`).
2. O painel entrega um **token**, uma senha exclusiva daquele host.
3. Um **conector** (o roteador, um script no PC ou um servidor) chama a nossa API de tempos em tempos, com o token, e informa o IP atual.
4. Quando o IP muda, atualizamos o registro de DNS. Em segundos, o endereço aponta para o IP novo.

![Lista de hosts no painel, com o status de cada endereço](/docs/img/hosts-lista.png)

## O que é cada coisa

| Termo | O que significa |
|---|---|
| Host | O endereço fixo que você criou, como `clinicajuca.ip.juk.re`. |
| Zona | O final do endereço: `ip.juk.re`, `home.juk.re`, `cam.juk.re`... |
| Token | A senha do host. Aparece uma única vez e só serve para atualizar aquele host. |
| Conector | Quem avisa o IP novo: roteador, script ou servidor. |

## Bom saber

- É **DNS puro**: o endereço aponta direto para o seu IP. O serviço que você quer acessar (RDP, câmera, servidor) precisa estar liberado na sua rede. Não é um túnel.
- Cada conta pode ter até **5 hosts**.
- O intervalo recomendado de atualização é de **15 minutos** (o mínimo é 5).
- Funciona com **IPv4 e IPv6**.

Próximo passo: [criar o seu primeiro host](/docs/criar-host).
