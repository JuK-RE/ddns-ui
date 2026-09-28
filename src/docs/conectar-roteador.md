# Conectar um roteador

Quando o roteador cuida do DDNS, você não precisa deixar nenhum computador ligado. Ele percebe sozinho quando o IP da internet muda e avisa a API só nessa hora, o que deixa tudo leve e automático.

Na hora de criar o host no painel, escolha o tipo do seu equipamento. O tutorial que aparece lá já vem com o seu endereço e o token preenchidos, então é só copiar e colar. Nesta página os exemplos usam `clinicajuca.ip.juk.re` e `SEU_TOKEN` no lugar dos seus dados.

> Os nomes dos menus mudam um pouco de uma versão de firmware para outra. E nem todo roteador aceita um serviço de DNS dinâmico personalizado (vários modelos da TP-Link, por exemplo, só oferecem No-IP e DynDNS). Se for o seu caso, dá pra usar um script em outro aparelho da rede: veja [conectar um PC ou servidor](/docs/conectar-pc).

## MikroTik

Abra o terminal do RouterOS (no WinBox, em **New Terminal**) e cole o script abaixo. Ele descobre o seu IP público pelo ipify, compara com o último que foi enviado e só chama a API quando o endereço muda. Como o IP vem de fora, funciona também atrás de CGNAT ou de outro roteador.

```routeros RouterOS · terminal
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

As duas primeiras linhas apagam uma versão anterior do script, então você pode colar de novo por cima sempre que quiser trocar alguma coisa.

Para testar na hora, sem esperar os 15 minutos:

```routeros RouterOS · testar
/system script run jukre-ddns
/log print where message~"JUK.re DDNS"
```

No log deve aparecer `updated` seguido do seu IP na primeira vez, e `IP sem mudanca` nas próximas. Se aparecer `falha`, vale conferir o token e se o MikroTik está com acesso à internet. Uma dica: se o relógio do roteador estiver muito errado, o `/tool fetch` não consegue abrir a conexão HTTPS, então é bom deixar a hora certa em **System → Clock**.

## pfSense e OPNsense

Vá em **Serviços → DNS Dinâmico**, clique em adicionar e escolha o tipo **Custom** (dyndns2). O próprio firewall acompanha o IP da WAN e só chama a API quando ele muda.

| Campo | Valor |
|---|---|
| URL de atualização | `https://gateway.juk.re/nic/update?hostname=%HOST%&myip=%IP%` |
| Usuário | `clinicajuca.ip.juk.re` |
| Senha | O token do host |

Se a sua rede tiver IPv6 público, você pode criar uma segunda entrada usando o IPv6 da WAN, caso o seu firmware permita.

## UniFi

Em **Configurações → Internet → DNS Dinâmico**, crie uma entrada nova e escolha o serviço **custom**.

| Campo | Valor |
|---|---|
| Servidor | `gateway.juk.re/nic/update?hostname=%h&myip=%i` |
| Hostname | `clinicajuca.ip.juk.re` |
| Usuário | `clinicajuca.ip.juk.re` |
| Senha | O token do host |

Se o gateway estiver atrás de CGNAT ou de outro roteador, ele pode acabar enviando um IP privado, e a API recusa esse tipo de endereço. Nesse caso é melhor usar um script em outro aparelho da rede, como em [conectar um PC ou servidor](/docs/conectar-pc).

## ddclient (Linux e NAS)

O ddclient é um programa pequeno que roda em segundo plano em servidores Linux e em vários NAS. A configuração fica no arquivo `/etc/ddclient.conf`. Com `daemon=900`, ele confere o IP a cada 15 minutos e só atualiza quando alguma coisa muda.

```ini /etc/ddclient.conf
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

Depois de salvar, reinicie o serviço (em muitas distribuições, `sudo systemctl restart ddclient`).

## Como saber se está funcionando

Abra o host no painel e desça até **Log de requisições**. Lá aparecem as últimas 30 chamadas que chegaram na API, com a hora, o IP e a resposta de cada uma. Se o seu roteador estiver configurado certinho, a primeira linha aparece logo depois do teste.

Se nada aparecer, a chamada não chegou até a gente. Nesse caso, confira o endereço da URL e se o equipamento tem acesso à internet. Uma chamada com token errado também não aparece no log, porque sem o token certo não dá pra saber de qual host ela é.
