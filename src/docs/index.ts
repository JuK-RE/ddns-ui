import comoFunciona from './como-funciona.md?raw'
import criarHost from './criar-host.md?raw'
import conectarPc from './conectar-pc.md?raw'
import conectarRoteador from './conectar-roteador.md?raw'
import dnsIpv6 from './dns-ipv6.md?raw'

// Documentação: um arquivo .md por página, nesta ordem. Pra adicionar uma
// página, crie o .md aqui do lado, importe acima e inclua na lista.
export type DocPage = {
  slug: string
  title: string
  description: string
  group: string
  content: string
}

export const DOC_PAGES: DocPage[] = [
  {
    slug: 'como-funciona',
    title: 'Como funciona',
    description: 'O que é o JUK.re DDNS e como o seu endereço acompanha o IP da sua rede.',
    group: 'Começando',
    content: comoFunciona,
  },
  {
    slug: 'criar-host',
    title: 'Criar um host',
    description: 'Passo a passo para criar o seu endereço fixo no painel.',
    group: 'Começando',
    content: criarHost,
  },
  {
    slug: 'conectar-pc',
    title: 'Conectar um PC ou servidor',
    description: 'Atualize o IP com curl ou PowerShell, usando o ipify para IPv4 e IPv6.',
    group: 'Conectar',
    content: conectarPc,
  },
  {
    slug: 'conectar-roteador',
    title: 'Conectar um roteador',
    description: 'MikroTik, pfSense/OPNsense, UniFi e ddclient.',
    group: 'Conectar',
    content: conectarRoteador,
  },
  {
    slug: 'dns-ipv6',
    title: 'DNS, IPv6 e DDNS pausado',
    description: 'Edite o registro na mão, use IPv6 e pause o DDNS quando precisar.',
    group: 'Gerenciar',
    content: dnsIpv6,
  },
]

export const DEFAULT_DOC = DOC_PAGES[0]
