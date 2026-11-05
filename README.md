# GreenLeaf — Landing page

Site de divulgação do GreenLeaf, um app que analisa fotos de folhas de mandioca e indica o risco de bacteriose
(*Xanthomonas phaseoli* pv. *manihotis*). Projeto Integrador do curso de Desenvolvimento de Software Multiplataforma
da FATEC Registro.

**Site:** https://greenleaf-lp.vercel.app

## Projetos relacionados

- [Greenleaf-Mobile](https://github.com/Yajoojj/Greenleaf-Mobile): aplicativo ([acessar](https://greenleaf-mobile.vercel.app/inicio))
- [Axios_Cassava_IA](https://github.com/Yajoojj/Axios_Cassava_IA): API e modelo de classificação

## Funcionalidades

- Folha de mandioca em 3D, gerada por código, com os estágios da doença
- Demonstração das etapas da análise com exemplos reais do modelo
- Apresentação do app, da arquitetura, dos objetivos e da equipe
- Conteúdo em português e inglês (`?lang=pt` ou `?lang=en`)
- Alternativa em SVG quando o WebGL não está disponível e suporte a `prefers-reduced-motion`

## Tecnologias

React, TypeScript, Vite, Three.js e Lenis. O deploy é feito na Vercel.

## Como executar

Requisito: Node.js 22.12 ou superior.

```bash
npm ci
```

```bash
npm run dev
```

O site abre em http://localhost:5173.

Para gerar e testar o build de produção:

```bash
npm run build
```

```bash
npm run preview
```

## Estrutura

```text
src/
  components/   cabeçalho, ícones e componentes básicos
  config/       links, e-mails e vídeo
  content/      textos em português e inglês
  hooks/        rolagem e animações
  sections/     seções da página
  styles/       estilos globais e das seções
  three/        folha 3D e cenas WebGL
public/         imagens do app, exemplos e fotos da equipe
```

## Equipe

- Filipe de Oliveira Lima
- Yago Uran Kurashiki Rios
- Carlos Eduardo Campos Takeshita
