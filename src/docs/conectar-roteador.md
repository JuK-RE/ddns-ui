# Conectar um roteador

Roteadores e firewalls sabem quando o IP da internet muda, então só chamam a API nessa hora. É o jeito mais leve de manter o endereço atualizado. No painel, escolha o tipo do seu equipamento ao criar o host: o tutorial já vem com o endereço e o token preenchidos.

> Os caminhos de menu variam de acordo com a versão do firmware. Nem todo roteador aceita DNS dinâmico personalizado (muitos TP-Link só aceitam No-IP e DynDNS). Nesse caso, use um script em outro aparelho da rede: veja [conectar um PC ou servidor](/docs/conectar-pc).

## MikroTik

Cole no terminal do RouterOS (ou WinBox → New Terminal). O script descobre o IP público no ipify, então funciona também atrás de CGNAT, compara com o último enviado e só chama a API se mudou. Cada execução fica registrada no log do RouterOS:

```
/system scheduler remove [find name="jukre-ddns"]
/system script remove [find name="jukre-ddns"]
/system script add name=jukre-ddns source={
  :global jukreLastIp
  :do {
    :local ip ([/tool fetch url="https://api.ipify.org" output=user as-value]->"data")
    :if ($ip = $jukreLastIp) do={
      :log info ("JUK.re DDNS: IP sem mudanca (" . $ip . ")")
    } else={
      :local res ([/tool fetch url=("https://gateway.juk.re/v1/update/SEU_TOKEN?myip=" . $ip . "&format=text") output=user as-value]->"data")
      :log info ("JUK.re DDNS: " . [:pick $res 0 [:find $res "\n"]])
      :set jukreLastIp $ip
    }
  } on-error={
    :log warning "JUK.re DDNS: falha ao atualizar (sem internet, token invalido ou limite de 5 min)"
  }
}
/system scheduler add name=jukre-ddns interval=15m on-event=jukre-ddns
```

As duas primeiras linhas removem uma versão anterior, então dá para colar de novo por cima. Para testar na hora e ver o resultado:

```
/system script run jukre-ddns
/log print where message~"JUK.re DDNS"
```

Se a interface de internet recebe um IP público, o tutorial do painel também tem uma versão que lê o IP direto dela, sem o ipify.

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

Atrás de CGNAT ou de outro roteador, o UniFi manda o IP privado da WAN. A API ignora IP privado e usa o IP público de onde a chamada saiu.

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
