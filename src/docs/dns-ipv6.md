# DNS, IPv6 e DDNS pausado

Na página **DNS** do painel você vê os registros de todos os seus hosts, edita o IP na mão e escolhe se o DDNS deve continuar atualizando sozinho.

![Página DNS com o formulário de edição aberto](/docs/img/dns-editar.png)

## DDNS ativo ou pausado

Cada host tem uma chave **DDNS**:

- **Ativo:** o roteador ou script atualiza o IP sozinho. É o normal.
- **Pausado:** as chamadas do conector são ignoradas e o registro fica como está. O conector recebe a resposta `disabled` (ou `nohost`, no protocolo dyndns2).

Pausar é útil quando você quer **fixar** um IP, por exemplo durante uma manutenção ou uma troca de provedor.

## Editar o registro na mão

Clique em **Editar** na linha do host, informe o IPv4 e/ou o IPv6 e salve. O DNS é atualizado na hora. Deixe um campo vazio para remover aquele registro.

> Com o DDNS **ativo**, a próxima chamada do conector pode sobrescrever o que você digitou. Para fixar um valor, pause o DDNS antes.

Só são aceitos IPs públicos. Endereços privados, como `192.168.x.x`, não funcionam na internet e são recusados.

## IPv4 e IPv6

O mesmo endereço pode ter os dois tipos de registro:

| Registro | Tipo de IP | Exemplo |
|---|---|---|
| A | IPv4 | `187.72.41.53` |
| AAAA | IPv6 | `2804:14d:1::1` |

O IP enviado define o registro: se você manda um IPv4, o **A** é atualizado; se manda um IPv6, o **AAAA**. Para manter os dois em dia, chame a API duas vezes, uma com cada IP (veja [conectar um PC ou servidor](/docs/conectar-pc)).

![Página do host com os registros IPv4 e IPv6](/docs/img/host-detalhe.png)

Na página do host, o **histórico de IP** mostra cada mudança, com o tipo (A ou AAAA) e a origem: HTTP, dyndns2 ou manual (feita pelo painel).
