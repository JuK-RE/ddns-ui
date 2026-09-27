# Conectar um PC ou servidor

Use este método em qualquer computador ligado à sua rede. Um script chama a API a cada 15 minutos e informa o IP atual. Os comandos prontos, com o seu endereço e o seu token, aparecem na página do host.

![Tutorial de API / HTTP na página do host](/docs/img/conexao-http.png)

## Por que usamos o ipify

O script descobre o seu IP público no [ipify](https://www.ipify.org/) e envia em `?myip=`. Isso evita um problema comum: computadores com IPv4 e IPv6 podem chamar a API por IPv6 sem querer e atualizar o registro errado.

- `https://api.ipify.org` devolve o seu **IPv4**.
- `https://api6.ipify.org` devolve o seu **IPv6**.

## Windows (PowerShell)

Para testar agora, troque `SEU_TOKEN` pelo token do host:

```powershell
$ip = Invoke-RestMethod "https://api.ipify.org"
Invoke-RestMethod "https://gateway.juk.re/v1/update/SEU_TOKEN?myip=$ip"
```

Se der certo, a resposta é `updated` (o IP mudou) ou `unchanged` (já estava certo). Para repetir sozinho, use o comando de **agendar** que aparece no tutorial da página do host.

## Linux e macOS

Adicione ao `crontab -e`:

```bash
*/15 * * * * curl -fsS "https://gateway.juk.re/v1/update/SEU_TOKEN?myip=$(curl -fsS https://api.ipify.org)" >/dev/null
```

## IPv6 (opcional)

Se a sua rede tem IPv6 público, chame uma segunda vez trocando o endereço do ipify. Isso atualiza o registro **AAAA**:

```bash
curl -fsS "https://gateway.juk.re/v1/update/SEU_TOKEN?myip=$(curl -fsS https://api6.ipify.org)"
```

## O que cada resposta significa

| Resposta | Significado |
|---|---|
| `updated` | O IP mudou e o DNS foi atualizado. |
| `unchanged` | O IP é o mesmo de antes. Nada foi alterado. |
| `rate_limited` | Chamadas com menos de 5 minutos de intervalo. Espere e tente de novo. |
| `unauthorized` | Token inválido. Confira se copiou inteiro ou gere um novo. |
| `disabled` | O DDNS está pausado para este host. Veja [DNS, IPv6 e DDNS pausado](/docs/dns-ipv6). |
| `bad_ip` | O IP informado é inválido ou privado. |
