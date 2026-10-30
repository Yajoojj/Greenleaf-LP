# GreenLeaf — Landing page

Site de divulgação do **GreenLeaf**, app que fotografa uma folha de mandioca e mostra, em linguagem simples,
o risco de **bacteriose** (*Xanthomonas phaseoli* pv. *manihotis*), com a área suspeita destacada.
Projeto Integrador — Desenvolvimento de Software Multiplataforma, **FATEC Registro** (Vale do Ribeira, SP).

- App: https://greenleaf-mobile.vercel.app/inicio ([Greenleaf-Mobile](https://github.com/Yajoojj/Greenleaf-Mobile))
- IA: [Axios_Cassava_IA](https://github.com/Yajoojj/Axios_Cassava_IA)
- Substitui a landing anterior ([Axis_equipe](https://github.com/Marcelo-18a/Axis_equipe)).

## Executar

Requisitos: Node.js 22.12+.

```bash
npm ci
```

```bash
npm run dev
```

```bash
npm run build
```

`npm run dev` abre em http://localhost:5173 e `npm run preview` serve o build em http://localhost:4173.
O build (`dist/`) é estático; `vercel.json` já está configurado.

## O que tem na página

| Seção | Interação |
|---|---|
| Hero | Folha de mandioca 3D (Three.js) com varredura periódica que destaca as manchas, arraste e paralaxe |
| Números | Dados do artigo (Embrapa, CONAB, pesquisa de campo) com a fonte de cada um |
| Problema | A doença, os sintomas e o contexto do Vale do Ribeira |
| Folha 3D | Explorador: estágios Sadia/Leve/Moderada/Grave, controle contínuo da evolução, varredura "como a IA vê", 6 marcadores anatômicos presos à malha, giro/zoom por botões, arraste e teclado |
| Como funciona | 6 passos reais da análise, cada um com uma mini-interface animada |
| A IA | Camadas 3D (foto → HSV → segmentação → área destacada) para os 5 exemplos do modo demonstração, com as respostas reais gravadas da IA v2 |
| O app | Celular 3D com as capturas reais do app, recursos e QR code |
| Tecnologia | Diagrama interativo App ↔ IA ↔ Supabase ↔ mapa de calor (futuro) |
| Objetivos | Metas O1–O5 do artigo com a situação atual, missão, visão e valores |
| Pitch | Vídeo do YouTube carregado só após o clique (youtube-nocookie) |
| Equipe, FAQ, Contato | Cartões com inclinação 3D, acordeão acessível, formulário que abre o e-mail (mailto) |
| CTA final | Roda de folhas com giro ocioso, arraste e inércia |

Português e inglês no mesmo build (`?lang=pt` / `?lang=en`; a escolha fica salva no navegador).

## A folha 3D

`src/three/leaf.ts` gera a folha por código, sem modelo externo:

- **Forma** (`leaf-shape.ts`): 7 lóbulos obovado-lanceolados que partem da inserção do pecíolo, com curvatura na
  nervura, arqueamento da ponta, margem ondulada e leve torção. O mesmo contorno gera a ilustração SVG de reserva.
- **Texturas em canvas** (atlas, uma coluna por lóbulo): nervura central avermelhada na base, nervuras secundárias,
  aréolas e variação de tom; mapa de relevo para as nervuras.
- **Lesões**: um campo em que cada mancha tem uma "ordem de aparecimento". O shader mostra halo amarelado, área
  encharcada e necrose parda conforme `uSeverity`, e murcha a folha nas fases graves.
- **Cobertura medida no mapa**: a porcentagem "da folha com manchas" vem do próprio campo de lesões, ponderado pela
  largura real do lóbulo. As faixas são as do app: Leve < 3%, Moderada 3–15%, Grave ≥ 15%.
- **Varredura**: uma frente sobe da base às pontas, escurece o tecido sadio e pinta as manchas de vermelho, como a
  sobreposição devolvida pela IA.

`src/three/stage.ts` segue o padrão do k9-lp: chunk separado carregado sob demanda, densidade de pixels limitada,
pausa fora da tela e com a aba oculta, liberação de recursos da GPU, caminho estático com
`prefers-reduced-motion` e ilustração vetorial quando o WebGL não está disponível ou o contexto é perdido.

## Referências de design

- **Ori** (somosori.com): base oliva escura, creme e sálvia, botões em pílula, cabeçalho flutuante,
  passos com mini-interfaces, faixa de números e marquee.
- **Halo Lab**: títulos com trecho em serifada itálica (Instrument Serif), rolagem suave com Lenis e a roda
  giratória do CTA final (adaptada de `final-cta-wheel.js`).
- **k9-lp**: estrutura React + TypeScript + Vite, cena Three.js com fallback e limpeza, i18n tipado, menu e FAQ
  acessíveis.
- **Design system do app** (Artefatos e `docs/design-system.md`): verde `#57B846`, estados Sadia/Leve/Moderada/Grave
  sempre com cor + ícone + texto, Montserrat nas réplicas de interface.

## Conteúdo e fontes

Os textos vêm do artigo, dos Artefatos, da apresentação final e do próprio app. Números da IA (21.397 fotos de treino,
2.140 de teste, revocação de 78%, especificidade de 95,5%, limiares de 26% e 60%) são os publicados na tela
"Saiba mais" do app. Os exemplos da seção "A IA" usam as respostas gravadas em
`src/services/fixtures/demo-cases.json` do Greenleaf-Mobile (modelo `greenleaf_effb0-2026-10-28`); as imagens são
ilustrações geradas por computador, como o app informa. As capturas de tela são do README do app.

## Para revisar antes de publicar

- `src/config/site.ts`: os e-mails de contato são os institucionais publicados no artigo. Confirme se a equipe
  quer exibi-los no site.
- O GitHub só está associado ao Yago (`Yajoojj`); adicione o perfil de Carlos em `src/content/pt.ts` e
  `en.ts` (`team.members[].github`), se quiserem.
- A captura "Diagnóstico" do app é de uma versão anterior (análise só por cor, 80%); os números da seção "A IA" são
  os da IA v2 atual.

## Organização

```
src/
  config/site.ts        links, e-mails e vídeo
  content/              textos PT/EN tipados, exemplos reais da IA, provedor de idioma
  three/                folha procedural, cenas do hero e do explorador, infraestrutura WebGL
  sections/             uma seção por arquivo
  components/           cabeçalho, ícones, primitivos, ilustração SVG da folha
  hooks/useMotion.ts    Lenis, âncoras e revelação ao rolar
  styles/               tokens, base, layout, seções e partes interativas
public/
  app/ demo/ team/      capturas do app, folhas do modo demonstração e fotos da equipe
```
