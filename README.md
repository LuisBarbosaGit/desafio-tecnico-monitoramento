# Detector de encontros geoespaciais

Aplicação de linha de comando em **Node.js + TypeScript** que identifica encontros físicos entre monitorados e vítimas de medidas protetivas. Não utiliza banco de dados, servidor HTTP nem framework: os arquivos são processados localmente e o resultado é gravado em JSON.

## Requisitos

- Node.js 22 ou superior
- npm

```bash
npm install
npm run build
```

## Execução

Coloque os arquivos `.txt` baixados dentro da pasta `data/`. Para processar todos de uma vez:

```bash
npm start
```

Para processar apenas um arquivo, informe seu nome (com ou sem `.txt`):

```bash
npm start -- dataset3.txt
# Também funciona: npm start -- dataset3
```

Cada dataset gera automaticamente um JSON com o mesmo nome-base na pasta `output/`. O comando registra no terminal as linhas, timestamps, pares candidatos, cálculos Haversine, encontros e duração. Para validar a implementação:

```bash
npm test
```

## Lógica

1. O leitor usa `csv-parse` conectado a um `createReadStream` para interpretar registros delimitados por `;` em streaming, validar o cabeçalho e converter os campos sem carregar o CSV inteiro na memória.
2. As posições são agrupadas pelo timestamp exato; posições de horários diferentes nunca são comparadas.
3. Para cada timestamp, as coordenadas são projetadas para metros e inseridas em uma grade de células de 20 m.
4. Cada posição consulta somente a própria célula e suas oito vizinhas. Assim, Haversine é calculada apenas para candidatos geograficamente próximos.
5. Cada par é avaliado uma vez, com IDs ordenados, e somente distâncias **menores que 20 m** são emitidas.

O resultado segue o formato solicitado, com `tipo`, `monitoradosEncontro`, `timestamp`, `posicoes` e `distanciaMetros`. A distância usa Haversine e o raio terrestre fixo de `6_371_000` metros.

## Regras de classificação

Os tipos são exclusivos, nesta ordem de prioridade:

1. `protetiva`: uma vítima possui o ID da outra pessoa em `idsRestricaoMedida`;
2. `faccao`: ambos não possuem medida protetiva, têm a mesma facção e a facção não está vazia;
3. `generico`: ambos não possuem medida protetiva e não se enquadram em facção.

Uma vítima próxima de alguém que não esteja em sua lista de restrição não produz encontro genérico.

## Estrutura

```text
src/
  algorithm/       Spatial hash, classificação e cálculo Haversine
  input/           Leitura e validação do arquivo separado por ponto e vírgula
  types/           Interfaces Monitorado e Encontro (nomes alinhados ao dataset)
  data/            Coloque aqui os datasets .txt
  output/          JSONs gerados automaticamente
  utils/write-encounters.ts  Escrita do JSON de encontros
  utils/process-dataset.ts  Coordena leitura, agrupamento, detecção e gravação
  main.ts          Argumentos e execução da CLI
test/              Testes do algoritmo e do parser
```

As pastas acompanham o caminho dos dados: entrada → algoritmo → saída. `process-dataset.ts` conecta essas partes e `main.ts` cuida apenas da interface de linha de comando.

## Por que spatial hashing

Comparar todas as pessoas de um timestamp exigiria `O(n²)` cálculos de distância. A grade espacial faz a inserção e consulta custarem aproximadamente `O(n)` em dados distribuídos: apenas pessoas da mesma célula ou de células adjacentes são candidatas. Haversine continua sendo a verificação final e exata, evitando falsos positivos causados pela projeção usada para indexar a grade.

Os datasets do desafio estão no Brasil; por isso, a projeção local usa uma escala de longitude conservadora baseada na maior latitude absoluta do timestamp, o que garante que um encontro real não seja descartado na etapa de candidatos.

