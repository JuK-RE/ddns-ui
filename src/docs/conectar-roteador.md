# Conectar um roteador

Roteadores e firewalls sabem quando o IP da internet muda, então só chamam a API nessa hora. É o jeito mais leve de manter o endereço atualizado. No painel, escolha o tipo do seu equipamento ao criar o host: o tutorial já vem com o endereço e o token preenchidos.

> Os caminhos de menu variam de acordo com a versão do firmware. Nem todo roteador aceita DNS dinâmico personalizado (muitos TP-Link só aceitam No-IP e DynDNS). Nesse caso, use um script em outro aparelho da rede: veja [conectar um PC ou servidor](/docs/conectar-pc).

## MikroTik

Cole no terminal do RouterOS (ou WinBox → New Terminal). O script compara o IP da interface de internet com o último enviado e só chama a API se mudou. Troque `pppoe-out1` pela sua interface:

> Vale a pena manter o RouterOS atualizado e com a hora certinha — ajuda bastante a garantir que tudo funcione bem. Sem isso, o `/tool fetch` por HTTPS pode falhar (a validação do certificado depende da hora certa, e uma versão muito antiga do RouterOS também pode dar problema com TLS). Dá pra conferir a versão em **System → Package** e atualizar se houver uma nova, e ajustar a hora em **System → Clock** (configure um **NTP Client** se precisar).

```
/system script add name=jukre-ddns source={
  :global jukreLastIp
  :local ip [/ip address get [find interface="pppoe-out1"] address]
  :set ip [:pick $ip 0 [:find $ip "/"]]
  :if ($ip != $jukreLastIp) do={
    /tool fetch url=("https://gateway.juk.re/v1/update/SEU_TOKEN?myip=" . $ip) output=none
    :set jukreLastIp $ip
  }
}
/system scheduler add name=jukre-ddns interval=15m on-event=jukre-ddns
```

Atrás de CGNAT (o IP da interface é privado)? O tutorial do painel tem uma versão que descobre o IP público no ipify.

## pfSense e OPNsense

Em **Serviços → DNS Dinâmico**, adicione uma entrada do tipo **Custom** (dyndns2):

| Campo | Valor |
|---|---|
| URL de atualização | `https://gateway.juk.re/nic/update?hostname=%HOST%&myip=%IP%` |
| Usuário | O seu endereço, por exemplo `clinicajuca.ip.juk.re` |
| Senha | O token do host |

## UniFi

Em **Configurações → Internet → DNS Dinâmico**, crie uma entrada **custom**:

| Campo | Valor |
|---|---|
| Servidor | `gateway.juk.re/nic/update?hostname=%h&myip=%i` |
| Hostname e usuário | O seu endereço, por exemplo `clinicajuca.ip.juk.re` |
| Senha | O token do host |

## ddclient (Linux e NAS)

No arquivo `/etc/ddclient.conf`. O `daemon=900` checa a cada 15 minutos e só atualiza quando o IP muda:

```
daemon=900
use=web
web=https://api.ipify.org
protocol=dyndns2
server=gateway.juk.re
ssl=yes
login=clinicajuca.ip.juk.re
password=SEU_TOKEN
clinicajuca.ip.juk.re
```
