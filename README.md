# Veritas Core Sheet

Módulo para Foundry VTT 13.351 e D&D5e 5.2.4 até 5.3.3.

## Instalação

No Foundry, abra **Add-on Modules → Install Module** e use este manifesto:

```text
https://github.com/Lucas-Maransaldi/veritas-core-sheet/releases/latest/download/module.json
```

## Funcionalidades

- Aba **Espectro de Magia** com todos os Fundamentos e Arquétipos de Efeito predefinidos.
- Cada conhecimento possui seu próprio círculo C0 a C13 e progresso percentual.
- Avanço automático a cada 100%, preservando o progresso excedente.
- Grupos arcanos recolhíveis, círculo representado por pentagrama e ajuste de progresso por valores positivos ou negativos.
- Aba **Extra Skills** com cadastro de múltiplas habilidades.
- Maestria de 0 a 6 e progresso percentual independente por habilidade.
- Controles rápidos de ±1%, ±10% e avanço ou redução de círculo/maestria.
- Criação manual de Extra Skills pelo botão ou pela tecla Enter.
- Ícone selecionável, descrição recolhível e maestria representada por seis estrelas.
- Barra de progresso com ajustes positivos ou negativos digitados pelo usuário.
- Busca instantânea por nome nas duas abas, abrindo automaticamente os grupos arcanos encontrados.
- Dados armazenados em flags do ator (`flags.veritas-core-sheet`), sem alterar o schema do D&D5e.

## Instalação para desenvolvimento

Copie ou vincule esta pasta para `Data/modules/veritas-core-sheet`, ative o módulo no mundo e recarregue o Foundry.
