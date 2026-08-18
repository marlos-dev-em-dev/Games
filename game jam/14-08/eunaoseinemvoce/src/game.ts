// ═══════════════════════════════════════════════════════════════════════
//              E U   N Ã O   S E I   N E M   V O C Ê
//                         Prototype v0.1.0
// ═══════════════════════════════════════════════════════════════════════
//  Arquivo único → será dividido em 3 módulos:
//    [1] DNA        → identidade, pilares, constantes
//    [2] Sistemas   → informação, comunicação, ação
//    [3] Runner     → loop do jogo, UI, protocolo
// ═══════════════════════════════════════════════════════════════════════
//  Executar:  npm install && npm start
// ═══════════════════════════════════════════════════════════════════════

import * as readline from "readline";

// ───────────────────────────────────────────────────────────────────────
//  CORES ANSI — zero dependências externas
// ───────────────────────────────────────────────────────────────────────
const CLR = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
} as const;

// ───────────────────────────────────────────────────────────────────────
//  TIPOS
// ───────────────────────────────────────────────────────────────────────
type CellKind = "SAFE" | "DANGER" | "RESOURCE" | "EVENT";
type Personality = "cautious" | "aggressive" | "analytical";

interface Cell {
  kind: CellKind;
  value: number; // 1–5
  revealed: boolean;
}

interface Mask {
  visible: Set<string>; // "r,c"
  distorted: Map<string, CellKind>; // "r,c" → tipo falso
}

interface Player {
  name: string;
  personality: Personality;
  isHuman: boolean;
  mask: Mask;
  tokens: number;
  trust: number;
  lastClaim: { cell: string; kind: CellKind } | null;
  vote: string | null;
}

interface VoteResult {
  winner: string | null;
  tally: Map<string, string[]>;
  tie: boolean;
}

interface ActionResult {
  kind: CellKind;
  scoreDelta: number;
  dangerHit: boolean;
  bonusTokens: number;
  narrative: string;
}

// ───────────────────────────────────────────────────────────────────────
//  DNA — Constantes fundamentais
// ───────────────────────────────────────────────────────────────────────
const DNA = {
  GRID: 5,
  TOKENS: 3,
  WIN_SCORE: 10,
  MAX_DANGER: 3,
  OPTIONS: 4,
  DISTORT_RATE: 0.15,
  CELL_KINDS: ["SAFE", "DANGER", "RESOURCE", "EVENT"] as CellKind[],
  WEIGHTS: [0.35, 0.2, 0.25, 0.2],
  // Pilar 1: mínimo 30% oculto, máximo 70% visível
  MIN_VIS: 0.4,
  MAX_VIS: 0.65,
} as const;

// ───────────────────────────────────────────────────────────────────────
//  UTILIDADES
// ───────────────────────────────────────────────────────────────────────
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LOC_NAMES = shuffle([
  "Floresta Sussurrante",
  "Ruínas Esquecidas",
  "Caverna Profunda",
  "Pântano Nebuloso",
  "Planície Eterna",
  "Montanha Escarlate",
  "Rio Silencioso",
  "Deserto Brilhante",
  "Vilarejo Abandonado",
  "Torre Sombria",
  "Lago Congelado",
  "Campo de Cinzas",
  "Bosque Antigo",
  "Pico da Névoa",
  "Passagem Estreita",
  "Clareira Dourada",
  "Abismo Verde",
  "Colina dos Ventos",
  "Templo Partido",
  "Trilha Oculta",
]);

// ─── Display helpers ──────────────────────────────────────────────────

function kindLabel(k: CellKind): string {
  return { SAFE: "SEG", DANGER: "PRG", RESOURCE: "REC", EVENT: "EVT" }[k];
}

function kindColor(k: CellKind): string {
  return {
    SAFE: CLR.green,
    DANGER: CLR.red,
    RESOURCE: CLR.cyan,
    EVENT: CLR.yellow,
  }[k];
}

function cellStr(k: CellKind | "???"): string {
  if (k === "???") return `${CLR.gray}${CLR.bold} ??? ${CLR.reset}`;
  return `${kindColor(k)}${CLR.bold} ${kindLabel(k)} ${CLR.reset}`;
}

function bar(
  current: number,
  max: number,
  len: number = 10,
  fill: string = "█",
  empty: string = "░"
): string {
  const n = Math.round((Math.min(current, max) / max) * len);
  return fill.repeat(n) + empty.repeat(len - n);
}

function pad(s: string, w: number): string {
  // Remove ANSI codes for length measurement
  const stripped = s.replace(/\x1b\[[0-9;]*m/g, "");
  const diff = w - stripped.length;
  return diff > 0 ? s + " ".repeat(diff) : s;
}

// ─── Readline ─────────────────────────────────────────────────────────
let rl: readline.Interface;

function ask(q: string): Promise<string> {
  return new Promise((resolve) => rl.question(q, resolve));
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO A — SISTEMA DE INFORMAÇÃO
// ═══════════════════════════════════════════════════════════════════════

function generateWorld(): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < DNA.GRID; r++) {
    grid[r] = [];
    for (let c = 0; c < DNA.GRID; c++) {
      let cum = 0;
      const rand = Math.random();
      let kind: CellKind = "SAFE";
      for (let i = 0; i < DNA.CELL_KINDS.length; i++) {
        cum += DNA.WEIGHTS[i];
        if (rand < cum) {
          kind = DNA.CELL_KINDS[i];
          break;
        }
      }
      grid[r][c] = {
        kind,
        value: Math.floor(Math.random() * 5) + 1,
        revealed: false,
      };
    }
  }
  return grid;
}

function generateMask(): Mask {
  const total = DNA.GRID * DNA.GRID;
  const positions = shuffle(
    Array.from(
      { length: total },
      (_, i) => `${Math.floor(i / DNA.GRID)},${i % DNA.GRID}`
    )
  );

  const minV = Math.ceil(total * DNA.MIN_VIS);
  const maxV = Math.ceil(total * DNA.MAX_VIS);
  const visCount = minV + Math.floor(Math.random() * (maxV - minV + 1));
  const visible = new Set(positions.slice(0, visCount));

  const visArr = Array.from(visible);
  const distortN = Math.floor(visArr.length * DNA.DISTORT_RATE);
  const distorted = new Map<string, CellKind>();

  for (let i = 0; i < distortN; i++) {
    distorted.set(visArr[i], pick(DNA.CELL_KINDS));
  }

  return { visible, distorted };
}

function see(world: Cell[][], r: number, c: number, mask: Mask): CellKind | "???" {
  const key = `${r},${c}`;
  if (!mask.visible.has(key)) return "???";
  if (mask.distorted.has(key)) return mask.distorted.get(key)!;
  return world[r][c].kind;
}

function renderGrid(world: Cell[][], mask: Mask, title: string): string {
  const lines: string[] = [];
  lines.push(`  ${CLR.bold}${title}${CLR.reset}`);
  lines.push("");

  // Column headers
  let header = "       ";
  for (let c = 0; c < DNA.GRID; c++) header += `  [${c}] `;
  lines.push(header);
  lines.push("       " + "─────".repeat(DNA.GRID));

  for (let r = 0; r < DNA.GRID; r++) {
    let row = `  [${r}] │`;
    for (let c = 0; c < DNA.GRID; c++) {
      row += ` ${cellStr(see(world, r, c, mask))} `;
    }
    lines.push(row);
  }

  const visCount = mask.visible.size;
  const distCount = mask.distorted.size;
  lines.push("");
  lines.push(
    `  ${CLR.dim}Você enxerga ${visCount}/${DNA.GRID * DNA.GRID} células` +
      (distCount > 0 ? `. ${distCount} podem estar distorcidas.` : ".") +
      CLR.reset
  );

  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO B — SISTEMA DE COMUNICAÇÃO
// ═══════════════════════════════════════════════════════════════════════

function doShare(src: Player, cell: string, world: Cell[][]): string {
  if (src.tokens <= 0) return `  ${src.name}: sem tokens.`;
  src.tokens--;

  const [r, c] = cell.split(",").map(Number);
  if (r < 0 || r >= DNA.GRID || c < 0 || c >= DNA.GRID) {
    return `  ${CLR.dim}Célula inválida.${CLR.reset}`;
  }

  const seen = see(world, r, c, src.mask);
  const isDistorted = src.mask.distorted.has(cell);

  if (seen === "???") {
    src.lastClaim = null;
    return `  ${src.name}: "Não consigo ver [${cell}]. Está oculto para mim."`;
  }

  src.lastClaim = { cell, kind: seen };

  if (isDistorted) {
    return (
      `  ${src.name}: "Vejo ${CLR.bold}${seen}${CLR.reset} em [${cell}]."` +
      ` ${CLR.dim}(algo parece… estranho)${CLR.reset}`
    );
  }

  return (
    `  ${src.name}: "Vejo ${CLR.bold}${seen}${CLR.reset} em [${cell}]."` +
    ` ${CLR.dim}(parece consistente)${CLR.reset}`
  );
}

function doAsk(
  src: Player,
  tgt: Player,
  cell: string,
  world: Cell[][]
): string {
  if (src.tokens <= 0) return `  ${src.name}: sem tokens.`;
  src.tokens--;

  const [r, c] = cell.split(",").map(Number);
  if (r < 0 || r >= DNA.GRID || c < 0 || c >= DNA.GRID) {
    return `  ${CLR.dim}Célula inválida.${CLR.reset}`;
  }

  const targetSees = see(world, r, c, tgt.mask);

  if (targetSees === "???") {
    return `  ${tgt.name} responde sobre [${cell}]: "Não consigo ver essa área."`;
  }

  if (!tgt.isHuman) {
    const baseChance = tgt.personality === "aggressive" ? 0.35 : 0.1;
    const trustMod = tgt.trust < 30 ? 0.15 : tgt.trust > 70 ? -0.1 : 0;
    const willLie = Math.random() < baseChance + trustMod;

    if (willLie) {
      const lie = pick(DNA.CELL_KINDS.filter((k) => k !== targetSees));
      tgt.lastClaim = { cell, kind: lie };
      return (
        `  ${tgt.name} responde sobre [${cell}]: "${CLR.bold}${lie}${CLR.reset}"` +
        ` ${CLR.dim}(algo parece… estranho)${CLR.reset}`
      );
    }

    tgt.lastClaim = { cell, kind: targetSees };
    return `  ${tgt.name} responde sobre [${cell}]: "${CLR.bold}${targetSees}${CLR.reset}"`;
  }

  return `  ${tgt.name} responde sobre [${cell}]: "${CLR.bold}${targetSees}${CLR.reset}"`;
}

function doDoubt(src: Player, tgt: Player, world: Cell[][]): string {
  if (src.tokens <= 0) return `  ${src.name}: sem tokens.`;
  src.tokens--;

  if (!tgt.lastClaim) {
    return `  ${src.name} duvida de ${tgt.name}… mas não havia afirmação. Token desperdiçado.`;
  }

  const [r, c] = tgt.lastClaim.cell.split(",").map(Number);
  const truth = world[r][c].kind;
  const honest = truth === tgt.lastClaim.kind;

  if (honest) {
    src.trust = Math.max(0, src.trust - 8);
    return (
      `  ${CLR.green}${CLR.bold}${tgt.name} estava dizendo a VERDADE!${CLR.reset} ` +
      `${src.name} perde credibilidade. (confiança: ${src.trust})`
    );
  }

  tgt.trust = Math.max(0, tgt.trust - 15);
  return (
    `  ${CLR.red}${CLR.bold}${tgt.name} MENTIU ou estava ERRADO!${CLR.reset} ` +
    `Afirmou ${tgt.lastClaim.kind}, mas é ${truth}. ` +
    `(confiança de ${tgt.name}: ${tgt.trust})`
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  MÓDULO C — SISTEMA DE AÇÃO
// ═══════════════════════════════════════════════════════════════════════

function generateOptions(
  world: Cell[][]
): { id: string; label: string; row: number; col: number }[] {
  const used = new Set<string>();
  const opts: { id: string; label: string; row: number; col: number }[] = [];
  const names = shuffle(LOC_NAMES);
  let ni = 0;

  while (opts.length < DNA.OPTIONS) {
    const r = Math.floor(Math.random() * DNA.GRID);
    const c = Math.floor(Math.random() * DNA.GRID);
    const key = `${r},${c}`;
    if (used.has(key)) continue;
    used.add(key);
    opts.push({
      id: `opt${opts.length}`,
      label: names[ni++],
      row: r,
      col: c,
    });
  }

  return opts;
}

function aiDecideVote(
  p: Player,
  opts: { id: string; row: number; col: number }[],
  world: Cell[][]
): string {
  const scored = opts.map((o) => {
    const seen = see(world, o.row, o.col, p.mask);
    let s = 0;

    switch (p.personality) {
      case "cautious":
        if (seen === "SAFE") s += 5;
        if (seen === "RESOURCE") s += 3;
        if (seen === "DANGER") s -= 4;
        if (seen === "EVENT") s -= 1;
        if (seen === "???") s += 1;
        break;
      case "aggressive":
        if (seen === "RESOURCE") s += 6;
        if (seen === "EVENT") s += 3;
        if (seen === "SAFE") s += 1;
        if (seen === "DANGER") s -= 2;
        if (seen === "???") s += 3;
        break;
      case "analytical":
        if (seen === "SAFE") s += 3;
        if (seen === "RESOURCE") s += 4;
        if (seen === "DANGER") s -= 5;
        if (seen === "EVENT") s += 0;
        if (seen === "???") s -= 1;
        break;
    }

    s += Math.floor(Math.random() * 3) - 1; // ruído
    return { id: o.id, score: s };
  });

  scored.sort((a, b) => b.score - a.score);

  // 20% chance de segunda opção — imprevisibilidade
  if (scored.length > 1 && Math.random() < 0.2) return scored[1].id;
  return scored[0].id;
}

function resolveVotes(players: Player[]): VoteResult {
  const tally = new Map<string, string[]>();

  for (const p of players) {
    if (p.vote) {
      if (!tally.has(p.vote)) tally.set(p.vote, []);
      tally.get(p.vote)!.push(p.name);
    }
  }

  let max = 0;
  let winner: string | null = null;
  let atMax = 0;

  for (const [id, voters] of tally) {
    if (voters.length > max) {
      max = voters.length;
      winner = id;
      atMax = 1;
    } else if (voters.length === max) {
      atMax++;
    }
  }

  return { winner: atMax > 1 ? null : winner, tally, tie: atMax > 1 };
}

function executeAction(world: Cell[][], row: number, col: number): ActionResult {
  const cell = world[row][col];
  cell.revealed = true;

  switch (cell.kind) {
    case "SAFE":
      return {
        kind: cell.kind,
        scoreDelta: cell.value,
        dangerHit: false,
        bonusTokens: 0,
        narrative:
          `A região é segura. O grupo avança cautelosamente e encontra ` +
          `recursos naturais. ${CLR.green}${CLR.bold}+${cell.value} pontos${CLR.reset}.`,
      };

    case "DANGER":
      return {
        kind: cell.kind,
        scoreDelta: 0,
        dangerHit: true,
        bonusTokens: 0,
        narrative:
          `${CLR.red}${CLR.bold}PERIGO.${CLR.reset} Uma emboscada! ` +
          `O grupo sobrevive, mas a zona está marcada. ${CLR.red}Perigo +1${CLR.reset}.`,
      };

    case "RESOURCE": {
      const pts = cell.value * 2;
      return {
        kind: cell.kind,
        scoreDelta: pts,
        dangerHit: false,
        bonusTokens: 1,
        narrative:
          `${CLR.cyan}${CLR.bold}RECURSOS!${CLR.reset} Provisões abundantes. ` +
          `${CLR.cyan}+${pts} pontos${CLR.reset} e ` +
          `${CLR.cyan}+1 token${CLR.reset} para todos na próxima rodada.`,
      };
    }

    case "EVENT": {
      const good = Math.random() > 0.4;
      const delta = good ? cell.value : -Math.min(cell.value, 2);
      return {
        kind: cell.kind,
        scoreDelta: delta,
        dangerHit: !good,
        bonusTokens: 0,
        narrative: good
          ? `${CLR.yellow}EVENTO BENÉFICO.${CLR.reset} Uma descoberta inesperada. ` +
            `${CLR.green}+${delta} pontos${CLR.reset}.`
          : `${CLR.yellow}EVENTO ADVERSO.${CLR.reset} O ambiente reage mal. ` +
            `${CLR.red}${delta} pontos${CLR.reset}.`,
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  GAME RUNNER
// ═══════════════════════════════════════════════════════════════════════

class Game {
  private world: Cell[][];
  private players: Player[];
  private round: number = 0;
  private score: number = 0;
  private danger: number = 0;
  private bonusTokens: number = 0; // carry-over de RESOURCE

  constructor() {
    this.world = generateWorld();
    this.players = [
      this.makePlayer("Você", "analytical", true),
      this.makePlayer("Luna", "cautious", false),
      this.makePlayer("Kael", "aggressive", false),
      this.makePlayer("Sage", "analytical", false),
    ];
  }

  private makePlayer(name: string, pers: Personality, human: boolean): Player {
    return {
      name,
      personality: pers,
      isHuman: human,
      mask: generateMask(),
      tokens: DNA.TOKENS,
      trust: human
        ? 50
        : pers === "cautious"
        ? 60
        : pers === "aggressive"
        ? 40
        : 50,
      lastClaim: null,
      vote: null,
    };
  }

  private human(): Player {
    return this.players[0];
  }

  private gameOver(): boolean {
    return this.score >= DNA.WIN_SCORE || this.danger >= DNA.MAX_DANGER;
  }

  // ── Status bar ────────────────────────────────────────────────────────
  private status(): void {
    const sc =
      this.score >= DNA.WIN_SCORE
        ? CLR.green
        : this.score >= DNA.WIN_SCORE * 0.7
        ? CLR.yellow
        : CLR.white;
    const dc =
      this.danger >= DNA.MAX_DANGER - 1 ? CLR.red : CLR.yellow;

    console.log(
      `  ╔════════════════════════════════════════════════════════╗`
    );
    console.log(
      `  ║  ${CLR.bold}Rodada ${String(this.round).padStart(2)}${CLR.reset}` +
        `                                              ║`
    );
    console.log(
      `  ║                                                      ║`
    );
    console.log(
      `  ║  Placar:  ${sc}${CLR.bold}${bar(this.score, DNA.WIN_SCORE)}${CLR.reset}` +
        `  ${this.score}/${DNA.WIN_SCORE}                       ║`
    );
    console.log(
      `  ║  Perigos: ${dc}${CLR.bold}${bar(this.danger, DNA.MAX_DANGER)}${CLR.reset}` +
        `  ${this.danger}/${DNA.MAX_DANGER}                        ║`
    );
    console.log(
      `  ╚════════════════════════════════════════════════════════╝`
    );
  }

  // ── Banner ────────────────────────────────────────────────────────────
  private banner(): void {
    console.log(`
  ${CLR.bold}${CLR.white}
  ╔════════════════════════════════════════════════════════╗
  ║                                                        ║
  ║          E U   N Ã O   S E I   N E M   V O C Ê        ║
  ║                                                        ║
  ║                     Prototype v0.1.0                    ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝${CLR.reset}

  ${CLR.dim}Ninguém vê o mapa completo. Cada jogador enxerga
  fragmentos — alguns distorcidos. Juntos, precisam
  explorar o território e acumular ${DNA.WIN_SCORE} pontos antes
  de ${DNA.MAX_DANGER} eventos de perigo.${CLR.reset}

  ${CLR.dim}A única certeza é que ninguém sabe o bastante.${CLR.reset}

  ${CLR.bold}Legenda:${CLR.reset}
    ${cellStr("SAFE")} Seguro       ${cellStr("DANGER")} Perigo
    ${cellStr("RESOURCE")} Recurso      ${cellStr("EVENT")} Evento
    ${cellStr("???")} Desconhecido

  ${CLR.bold}Jogadores:${CLR.reset}
    Você    — ${CLR.dim}(analytical — você)${CLR.reset}
    Luna    — ${CLR.dim}(cautious — compartilha honestamente, evita risco)${CLR.reset}
    Kael    — ${CLR.dim}(aggressive — arrisca, pode mentir)${CLR.reset}
    Sage    — ${CLR.dim}(analytical — compartilha seletivamente)${CLR.reset}
    `);
  }

  // ════════════════════════════════════════════════════════════════════
  //  GAME LOOP PRINCIPAL
  // ════════════════════════════════════════════════════════════════════

  async run(): Promise<void> {
    console.clear();
    this.banner();
    await ask(`${CLR.dim}Pressione ENTER para começar...${CLR.reset}`);

    while (!this.gameOver()) {
      this.round++;
      this.prepareRound();
      await this.phaseFragment();
      await this.phaseCommunication();

      if (this.gameOver()) break;

      const options = generateOptions(this.world);
      await this.phaseVoting(options);
      await this.phaseResolution(options);

      if (this.gameOver()) break;
      await ask(`\n${CLR.dim}Pressione ENTER para a próxima rodada...${CLR.reset}`);
    }

    this.endScreen();
    rl.close();
  }

  // ── Preparação ────────────────────────────────────────────────────────
  private prepareRound(): void {
    for (const p of this.players) {
      p.tokens = DNA.TOKENS + this.bonusTokens;
      p.vote = null;
      // lastClaim persiste entre rodadas — serve para DUVIDAR
    }
    this.bonusTokens = 0;
  }

  // ── FASE 1: FRAGMENTO ────────────────────────────────────────────────
  private async phaseFragment(): Promise<void> {
    console.clear();
    this.status();
    console.log("");
    console.log(
      renderGrid(this.world, this.human().mask, "SEU FRAGMENTO — O que você enxerga")
    );
    console.log("");
  }

  // ── FASE 2: COMUNICAÇÃO ──────────────────────────────────────────────
  private async phaseCommunication(): Promise<void> {
    console.log(`  ${CLR.bold}═══ COMUNICAÇÃO ═══${CLR.reset}`);
    console.log(`  Tokens: ${CLR.bold}${this.human().tokens}${CLR.reset}`);
    console.log("");

    // ── AI compartilha proativamente ────────────────────────────────────
    let aiSaidSomething = false;
    for (const p of this.players) {
      if (p.isHuman || p.tokens <= 0) continue;
      if (Math.random() < 0.55) {
        const visCells = Array.from(p.mask.visible);
        if (visCells.length > 0) {
          console.log(doShare(p, pick(visCells), this.world));
          aiSaidSomething = true;
          await wait(300);
        }
      }
    }
    if (!aiSaidSomething) {
      console.log(`  ${CLR.dim}Ninguém diz nada. O silêncio pesa.${CLR.reset}`);
    }
    console.log("");

    // ── Ação do jogador humano ──────────────────────────────────────────
    const aiPlayers = this.players.filter((p) => !p.isHuman);

    while (this.human().tokens > 0) {
      console.log(
        `  ${CLR.dim}Tokens restantes: ${this.human().tokens}${CLR.reset}`
      );
      console.log(
        `  ${CLR.bold}[1]${CLR.reset} Compartilhar   ` +
          `${CLR.bold}[2]${CLR.reset} Perguntar   ` +
          `${CLR.bold}[3]${CLR.reset} Duvidar   ` +
          `${CLR.bold}[4]${CLR.reset} Pular`
      );

      const choice = (await ask(`  ${CLR.bold}> ${CLR.reset}`)).trim();

      if (choice === "4" || choice === "") break;

      if (choice === "1") {
        // COMPARTILHAR
        const cell = (
          await ask(`  Célula para compartilhar (linha,coluna): `)
        ).trim();
        if (!/^\d,\d$/.test(cell)) {
          console.log(`  ${CLR.dim}Formato inválido. Use: linha,coluna${CLR.reset}`);
          continue;
        }
        const [r] = cell.split(",").map(Number);
        if (r >= DNA.GRID) {
          console.log(`  ${CLR.dim}Fora do grid.${CLR.reset}`);
          continue;
        }
        console.log(doShare(this.human(), cell, this.world));
        console.log("");
      } else if (choice === "2") {
        // PERGUNTAR
        console.log(`  Perguntar a quem?`);
        aiPlayers.forEach((p, i) =>
          console.log(
            `    ${CLR.bold}[${i + 1}]${CLR.reset} ${p.name} ${CLR.dim}(${p.personality}, confiança: ${p.trust})${CLR.reset}`
          )
        );
        const who = parseInt((await ask(`  > `)).trim()) - 1;
        if (who < 0 || who >= aiPlayers.length) {
          console.log(`  ${CLR.dim}Opção inválida.${CLR.reset}`);
          continue;
        }
        const cell = (
          await ask(`  Sobre qual célula? (linha,coluna): `)
        ).trim();
        if (!/^\d,\d$/.test(cell)) {
          console.log(`  ${CLR.dim}Formato inválido.${CLR.reset}`);
          continue;
        }
        const [r] = cell.split(",").map(Number);
        if (r >= DNA.GRID) {
          console.log(`  ${CLR.dim}Fora do grid.${CLR.reset}`);
          continue;
        }
        console.log(doAsk(this.human(), aiPlayers[who], cell, this.world));
        console.log("");
      } else if (choice === "3") {
        // DUVIDAR
        console.log(`  Duvidar de quem?`);
        aiPlayers.forEach((p, i) =>
          console.log(
            `    ${CLR.bold}[${i + 1}]${CLR.reset} ${p.name}` +
              ` ${CLR.dim}(confiança: ${p.trust}${
                p.lastClaim ? ", tem afirmação" : ", sem afirmação"
              })${CLR.reset}`
          )
        );
        const who = parseInt((await ask(`  > `)).trim()) - 1;
        if (who < 0 || who >= aiPlayers.length) {
          console.log(`  ${CLR.dim}Opção inválida.${CLR.reset}`);
          continue;
        }
        console.log(doDoubt(this.human(), aiPlayers[who], this.world));
        console.log("");
      } else {
        console.log(`  ${CLR.dim}Opção inválida.${CLR.reset}`);
      }
    }

    console.log("");
  }

  // ── FASE 3: VOTAÇÃO ──────────────────────────────────────────────────
  private async phaseVoting(
    opts: { id: string; label: string; row: number; col: number }[]
  ): Promise<void> {
    console.log(`  ${CLR.bold}═══ VOTAÇÃO ═══${CLR.reset}`);
    console.log(`  Onde o grupo vai explorar?`);
    console.log("");

    for (let i = 0; i < opts.length; i++) {
      const o = opts[i];
      const vis = see(this.world, o.row, o.col, this.human().mask);
      const hint =
        vis !== "???" ? ` ${CLR.dim}(você vê ${vis})${CLR.reset}` : "";
      console.log(`    ${CLR.bold}[${i + 1}]${CLR.reset} ${o.label}${hint}`);
    }
    console.log("");

    // Voto humano
    let choice = -1;
    while (choice < 0 || choice >= opts.length) {
      const input = (
        await ask(`  Seu voto (1-${opts.length}): `)
      ).trim();
      choice = parseInt(input) - 1;
      if (isNaN(choice)) choice = -1;
    }
    this.human().vote = opts[choice].id;
    console.log(
      `  ${CLR.dim}Você votou: ${opts[choice].label}${CLR.reset}`
    );
    console.log("");

    // Votos da IA
    for (const p of this.players) {
      if (p.isHuman) continue;
      p.vote = aiDecideVote(p, opts, this.world);
      const label = opts.find((o) => o.id === p.vote)?.label || "?";
      await wait(500);
      console.log(`  ${p.name} votou: ${CLR.bold}${label}${CLR.reset}`);
    }

    console.log("");
    await wait(600);
  }

  // ── FASE 4: RESOLUÇÃO ────────────────────────────────────────────────
  private async phaseResolution(
    opts: { id: string; label: string; row: number; col: number }[]
  ): Promise<void> {
    console.log(`  ${CLR.bold}═══ RESULTADO ═══${CLR.reset}`);

    const result = resolveVotes(this.players);

    if (result.tie) {
      console.log(
        `  ${CLR.yellow}${CLR.bold}EMPATE!${CLR.reset} O grupo não chega a um consenso.`
      );
      console.log(
        `  ${CLR.red}Todos perdem 1 token na próxima rodada como penalidade.${CLR.reset}`
      );
      this.bonusTokens = -1;
      console.log("");
      await wait(500);
      this.status();
      return;
    }

    const chosen = opts.find((o) => o.id === result.winner)!;
    const voters = result.tally.get(result.winner!) || [];
    console.log(
      `  ► Decisão do grupo: ${CLR.bold}${chosen.label}${CLR.reset}` +
        ` (${voters.length} votos)`
    );
    console.log("");
    await wait(600);

    const action = executeAction(this.world, chosen.row, chosen.col);
    console.log(`  ${action.narrative}`);
    console.log("");

    this.score = Math.max(0, this.score + action.scoreDelta);
    if (action.dangerHit) this.danger++;
    if (action.bonusTokens !== 0) this.bonusTokens = action.bonusTokens;

    await wait(400);
    this.status();
  }

  // ── Tela final ────────────────────────────────────────────────────────
  private endScreen(): void {
    console.clear();
    console.log("");

    if (this.score >= DNA.WIN_SCORE) {
      console.log(`
  ${CLR.green}${CLR.bold}
  ╔════════════════════════════════════════════════════════╗
  ║                                                        ║
  ║                    V I T Ó R I A                       ║
  ║                                                        ║
  ║     O grupo sobreviveu à incerteza.                    ║
  ║     Juntos, encontraram o caminho.                     ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝${CLR.reset}`);
    } else {
      console.log(`
  ${CLR.red}${CLR.bold}
  ╔════════════════════════════════════════════════════════╗
  ║                                                        ║
  ║                    D E R R O T A                       ║
  ║                                                        ║
  ║     O território consumiu o grupo.                     ║
  ║     A incerteza venceu.                                ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝${CLR.reset}`);
    }

    console.log(
      `\n  ${CLR.bold}Placar final:${CLR.reset} ${this.score}/${DNA.WIN_SCORE}` +
        `  |  Perigos: ${this.danger}/${DNA.MAX_DANGER}` +
        `  |  Rodadas: ${this.round}`
    );
    console.log("");

    // Mapa completo revelado
    const fullMask: Mask = { visible: new Set(), distorted: new Map() };
    for (let r = 0; r < DNA.GRID; r++)
      for (let c = 0; c < DNA.GRID; c++)
        fullMask.visible.add(`${r},${c}`);

    console.log(
      renderGrid(this.world, fullMask, "MAPA COMPLETO — A verdade que ninguém viu")
    );
    console.log("");

    // Confiança final
    console.log(`  ${CLR.bold}Confiança final:${CLR.reset}`);
    for (const p of this.players) {
      const b = bar(p.trust, 100, 20);
      const color =
        p.trust > 60 ? CLR.green : p.trust > 30 ? CLR.yellow : CLR.red;
      console.log(`    ${p.name.padEnd(8)} ${color}${b}${CLR.reset} ${p.trust}`);
    }
    console.log("");

    // Resumo de distorção — quais informações eram falsas?
    console.log(`  ${CLR.bold}Distorções reveladas:${CLR.reset}`);
    let distortCount = 0;
    for (const p of this.players) {
      for (const [cell, fakeKind] of p.mask.distorted) {
        const [r, c] = cell.split(",").map(Number);
        const realKind = this.world[r][c].kind;
        console.log(
          `    ${p.name} via ${kindColor(fakeKind as CellKind)}${fakeKind}${CLR.reset} em [${r},${c}]` +
            ` — na realidade era ${kindColor(realKind)}${realKind}${CLR.reset}`
        );
        distortCount++;
      }
    }
    if (distortCount === 0) {
      console.log(`    ${CLR.dim}Nenhuma distorção neste jogo.${CLR.reset}`);
    }
    console.log("");
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const game = new Game();
  await game.run();
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});