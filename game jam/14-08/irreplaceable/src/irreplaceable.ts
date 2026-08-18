// ═══════════════════════════════════════════════════════════════
// IRREPLACEABLE — PROTOTIPO JOGAVEL
// Versão: 0.2.0
// Runtime: Node.js + TypeScript
// Executar: npx tsx src/irreplaceable.ts
// ═══════════════════════════════════════════════════════════════

import { randomUUID } from "crypto";
import * as readline from "readline";

// ═══════════════════════════════════════════════════════════════
// TIPOS FUNDAMENTAIS
// ═══════════════════════════════════════════════════════════════

type EntityType = "CHARACTER" | "ITEM" | "LOCATION" | "ABILITY" | "BOND";
type BondType = "ALLY" | "RIVAL" | "MENTOR" | "BLOOD_OATH" | "LOVE" | "BETRAYAL";
type Emotion = "HOPE" | "LOSS" | "WONDER" | "DREAD" | "TENDERNESS" | "DEFIANCE" | "BITTERNESS";
type EntityStatus = "ACTIVE" | "DECEASED" | "DESTROYED" | "ABANDONED";

interface Stats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

interface InventoryItem {
  uid: string;
  name: string;
  description: string;
  unique: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONSOLE HELPERS
// ═══════════════════════════════════════════════════════════════

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function pause(): Promise<void> {
  await ask("\n  [Enter para continuar...]\n");
}

function clear(): void {
  console.clear();
}

function title(text: string): void {
  console.log("\n" + "═".repeat(60));
  console.log(`  ${text.toUpperCase()}`);
  console.log("═".repeat(60));
}

function subtitle(text: string): void {
  console.log(`\n  ── ${text} ──\n`);
}

function narrate(text: string): void {
  console.log(`\n  ${text}`);
}

function whisper(text: string): void {
  console.log(`    "${text}"`);
}

function stat(entity: Entity): void {
  const s = entity.stats;
  const hpBar = s ? drawHpBar(s.hp, s.maxHp) : "";
  const status = entity.isAlive() ? "" : ` [${entity.status}]`;
  console.log(`    ${entity.name}${status} ${hpBar}`);
}

function drawHpBar(current: number, max: number): string {
  const width = 15;
  const filled = Math.round((current / max) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${bar}] ${current}/${max}`;
}

async function choice(prompt: string, options: string[]): Promise<number> {
  console.log(`\n  ${prompt}\n`);
  for (let i = 0; i < options.length; i++) {
    console.log(`    [${i + 1}] ${options[i]}`);
  }
  while (true) {
    const input = await ask("\n  > ");
    const num = parseInt(input);
    if (num >= 1 && num <= options.length) {
      return num - 1;
    }
    console.log(`  Escolha entre 1 e ${options.length}.`);
  }
}

function diceRoll(sides: number = 20): number {
  return Math.floor(Math.random() * sides) + 1;
}

// ═══════════════════════════════════════════════════════════════
// EVENT STORE
// ═══════════════════════════════════════════════════════════════

interface GameEvent {
  id: string;
  timestamp: number;
  epoch: number;
  type: string;
  payload: Record<string, any>;
  relatedEntities: string[];
}

class EventStore {
  private events: GameEvent[] = [];
  private epoch: number = 0;

  append(type: string, payload: Record<string, any>, related: string[] = []): GameEvent {
    this.epoch++;
    const event: GameEvent = {
      id: randomUUID(),
      timestamp: Date.now(),
      epoch: this.epoch,
      type,
      payload,
      relatedEntities: related,
    };
    this.events.push(event);
    return event;
  }

  getTimeline(): GameEvent[] { return [...this.events]; }
  getEpoch(): number { return this.epoch; }
}

// ═══════════════════════════════════════════════════════════════
// ENTITY
// ═══════════════════════════════════════════════════════════════

class Entity {
  readonly uid: string;
  readonly seed: number;
  readonly type: EntityType;
  readonly name: string;
  readonly epithet: string;
  stats: Stats | null;
  status: EntityStatus = "ACTIVE";
  private inventory: InventoryItem[] = [];
  private history: GameEvent[] = [];

  constructor(name: string, epithet: string, type: EntityType, stats?: Stats) {
    this.uid = randomUUID();
    this.seed = Math.floor(Math.random() * 999999);
    this.type = type;
    this.name = name;
    this.epithet = epithet;
    this.stats = stats ? { ...stats } : null;
  }

  isAlive(): boolean { return this.status === "ACTIVE"; }

  modifyHp(delta: number): void {
    if (!this.stats) return;
    this.stats.hp = Math.max(0, Math.min(this.stats.maxHp, this.stats.hp + delta));
    if (this.stats.hp <= 0) this.status = "DECEASED";
  }

  heal(amount: number): void {
    this.modifyHp(amount);
  }

  getInventory(): InventoryItem[] { return [...this.inventory]; }

  addItem(item: InventoryItem): boolean {
    if (this.inventory.length >= 20) return false;
    this.inventory.push(item);
    return true;
  }

  removeItem(uid: string): InventoryItem | null {
    const idx = this.inventory.findIndex((i) => i.uid === uid);
    if (idx === -1) return null;
    return this.inventory.splice(idx, 1)[0];
  }

  hasItem(uid: string): boolean {
    return this.inventory.some((i) => i.uid === uid);
  }

  markDeceased(reason?: string): void {
    this.status = "DECEASED";
  }

  appendHistory(event: GameEvent): void { this.history.push(event); }
  getHistory(): GameEvent[] { return [...this.history]; }
}

// ═══════════════════════════════════════════════════════════════
// BOND SYSTEM
// ═══════════════════════════════════════════════════════════════

interface BondMemory {
  description: string;
  emotion: Emotion;
  delta: number;
}

class Bond {
  readonly bondId: string;
  readonly sourceUID: string;
  readonly targetUID: string;
  type: BondType;
  intensity: number;
  private memories: BondMemory[] = [];
  broken: boolean = false;
  brokenReason: string = "";

  constructor(source: string, target: string, type: BondType, intensity: number = 0.1) {
    this.bondId = randomUUID();
    this.sourceUID = source;
    this.targetUID = target;
    this.type = type;
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  evolve(desc: string, emotion: Emotion, delta: number): void {
    if (this.broken) return;
    this.memories.push({ description: desc, emotion, delta });
    this.intensity = Math.max(0, Math.min(1, this.intensity + delta));
  }

  break(reason: string): void {
    if (this.broken) return;
    this.broken = true;
    this.brokenReason = reason;
    this.memories.push({ description: `ROMPIDO: ${reason}`, emotion: "LOSS", delta: -this.intensity });
    this.intensity = 0;
  }

  getMemories(): BondMemory[] { return [...this.memories]; }
}

class BondSystem {
  private bonds: Bond[] = [];

  create(source: string, target: string, type: BondType, intensity?: number): Bond {
    const bond = new Bond(source, target, type, intensity);
    this.bonds.push(bond);
    return bond;
  }

  getBondsOf(uid: string): Bond[] {
    return this.bonds.filter((b) => (b.sourceUID === uid || b.targetUID === uid) && !b.broken);
  }

  getAll(): Bond[] { return [...this.bonds]; }

  breakAllOf(uid: string, reason: string): void {
    this.bonds
      .filter((b) => (b.sourceUID === uid || b.targetUID === uid) && !b.broken)
      .forEach((b) => b.break(reason));
  }
}

// ═══════════════════════════════════════════════════════════════
// WORLD STATE
// ═══════════════════════════════════════════════════════════════

class WorldState {
  events: EventStore = new EventStore();
  bonds: BondSystem = new BondSystem();
  private entities: Map<string, Entity> = new Map();

  register(entity: Entity): void {
    this.entities.set(entity.uid, entity);
    this.events.append("ENTITY_REGISTERED", { name: entity.name, type: entity.type }, [entity.uid]);
  }

  getEntity(uid: string): Entity | undefined { return this.entities.get(uid); }

  getAllAlive(): Entity[] {
    return [...this.entities.values()].filter((e) => e.isAlive());
  }

  getAllDead(): Entity[] {
    return [...this.entities.values()].filter((e) => !e.isAlive());
  }

  getCatalog(): Entity[] { return [...this.entities.values()]; }
}

// ═══════════════════════════════════════════════════════════════
// COMBAT ENGINE
// ═══════════════════════════════════════════════════════════════

interface CombatStakes {
  atRisk: string[];
  retreatPossible: boolean;
  context: string;
}

class CombatEngine {
  static async run(
    world: WorldState,
    allies: Entity[],
    enemies: Entity[],
    stakes: CombatStakes
  ): Promise<{ allies: Entity[]; enemies: Entity[]; retreated: boolean }> {
    title("COMBATE");
    narrate(stakes.context);
    console.log(`\n  Em risco: ${stakes.atRisk.join(", ")}`);
    console.log(`  Fuga: ${stakes.retreatPossible ? "Possivel" : "IMPOSSIVEL"}`);

    // Mostra participantes
    subtitle("Aliados");
    for (const a of allies) stat(a);
    subtitle("Inimigos");
    for (const e of enemies) stat(e);

    const allCombatants = [...allies, ...enemies];
    let round = 0;

    while (
      allies.some((a) => a.isAlive()) &&
      enemies.some((e) => e.isAlive())
    ) {
      round++;
      subtitle(`Rodada ${round}`);

      // Sortear por velocidade
      const turnOrder = allCombatants
        .filter((c) => c.isAlive())
        .sort((a, b) => (b.stats?.speed ?? 0) - (a.stats?.speed ?? 0));

      for (const combatant of turnOrder) {
        if (!combatant.isAlive()) continue;

        const isAlly = allies.includes(combatant);
        const aliveEnemies = isAlly
          ? enemies.filter((e) => e.isAlive())
          : allies.filter((a) => a.isAlive());

        if (aliveEnemies.length === 0) break;

        if (isAlly) {
          // Jogador escolhe ação para aliados
          narrate(`Turno de ${combatant.name} — HP: ${combatant.stats!.hp}/${combatant.stats!.maxHp}`);

          const options = ["Atacar"];
          const aliveTargets = aliveEnemies;
          for (const t of aliveTargets) {
            options.push(`Atacar ${t.name} (HP: ${t.stats!.hp})`);
          }
          if (stakes.retreatPossible) options.push("Recuar (fuga)");

          const actionIdx = await choice(`O que ${combatant.name} faz?`, options);

          if (stakes.retreatPossible && actionIdx === options.length - 1) {
            narrate(`${combatant.name} recua da batalha.`);
            world.events.append("COMBATANT_RETREATED", { name: combatant.name });
            return { allies, enemies, retreated: true };
          }

          // Atacar — distribuir dano no alvo escolhido
          let target: Entity;
          if (options.length <= 2) {
            target = aliveTargets[0];
          } else {
            const targetIdx = actionIdx - 1;
            target = aliveTargets[Math.min(targetIdx, aliveTargets.length - 1)];
          }

          this.resolveAttack(combatant, target, world);
        } else {
          // IA inimiga — ataca o aliado com menos HP
          const target = aliveEnemies.sort(
            (a, b) => (a.stats?.hp ?? 0) - (b.stats?.hp ?? 0)
          )[0];
          this.resolveAttack(combatant, target, world);
        }

        // Verifica mortes
        for (const c of allCombatants) {
          if (!c.isAlive() && c.status !== "DECEASED") {
            c.markDeceased();
            narrate(`✝ ${c.name} caiu em combate. PERMANENTEMENTE.`);
            world.bonds.breakAllOf(c.uid, `Morte em combate: ${stakes.context}`);
            world.events.append("DEATH", { name: c.name, cause: stakes.context }, [c.uid]);
          }
        }

        // Mostra estado
        console.log("");
        for (const a of allies) stat(a);
        for (const e of enemies) stat(e);

        if (!enemies.some((e) => e.isAlive()) || !allies.some((a) => a.isAlive())) break;
      }
    }

    const retreated = false;

    // Resolver stakes
    if (stakes.atRisk.includes("ITEM")) {
      const dead = [...allies, ...enemies].filter((c) => !c.isAlive());
      for (const d of dead) {
        const items = d.getInventory();
        for (const item of items) {
          narrate(`Item perdido para sempre: ${item.name}`);
          d.removeItem(item.uid);
        }
      }
    }

    return { allies, enemies, retreated };
  }

  private static resolveAttack(attacker: Entity, target: Entity, world: WorldState): void {
    if (!attacker.stats || !target.stats) return;

    const roll = diceRoll(20);
    const isCritical = roll >= 18;
    const isMiss = roll <= 2;

    if (isMiss) {
      narrate(`${attacker.name} erra o ataque contra ${target.name}. (Rolagem: ${roll})`);
      return;
    }

    const variance = Math.floor(Math.random() * 4);
    let damage = Math.max(1, attacker.stats.attack - target.stats.defense + variance);
    if (isCritical) damage *= 2;

    target.modifyHp(-damage);

    if (isCritical) {
      narrate(`${attacker.name} desfere um GOLPE CRÍTICO em ${target.name}! (-${damage} HP) (Rolagem: ${roll})`);
    } else {
      narrate(`${attacker.name} ataca ${target.name}. (-${damage} HP) (Rolagem: ${roll})`);
    }

    world.events.append("ATTACK", {
      attacker: attacker.name,
      target: target.name,
      damage,
      critical: isCritical,
    }, [attacker.uid, target.uid]);
  }
}

// ═══════════════════════════════════════════════════════════════
// NARRATIVE ENGINE
// ═══════════════════════════════════════════════════════════════

interface NarrativeChoice {
  id: string;
  label: string;
  cost: string;
  execute: (world: WorldState, player: Entity) => Promise<void>;
}

class NarrativeEngine {
  static async scene(
    titleText: string,
    description: string,
    world: WorldState,
    player: Entity,
    choices: NarrativeChoice[]
  ): Promise<string> {
    title(titleText);
    narrate(description);

    const labels = choices.map((c) => `${c.label}\n      Custo: ${c.cost}`);
    const idx = await choice("O que voce faz?", labels);
    const chosen = choices[idx];

    world.events.append("CHOICE_MADE", {
      choice: chosen.id,
      label: chosen.label,
    }, [player.uid]);

    await chosen.execute(world, player);

    return chosen.id;
  }
}

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  JOGO PRINCIPAL
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  clear();

  // ── TELA DE ABERTURA ──

  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║                  I R R E P L A C E A B L E               ║
  ║                                                          ║
  ║          Tudo que voce perder, esta perdido.             ║
  ║          Tudo que voce salvar, vale tudo.                ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝

    Este e um jogo onde escolhas tem custo real.
    Nao existe save. Nao existe voltar.
    Quando alguem morre, morreu de verdade.

    Cada entidade neste mundo e unica.
    UID e seed proprios. Quantidade: 1.
    Perder algo e perder algo que nao existe em outro lugar.
  `);

  await pause();

  // ── CRIAR O MUNDO ──

  const world = new WorldState();

  // Personagens
  const player = new Entity("Kael", "o Sobrevivente", "CHARACTER", {
    hp: 24, maxHp: 24, attack: 9, defense: 6, speed: 7,
  });

  const lirael = new Entity("Lirael", "a Tecelã de Sombras", "CHARACTER", {
    hp: 16, maxHp: 16, attack: 7, defense: 4, speed: 10,
  });

  const voss = new Entity("Madame Voss", "a Última Mestra", "CHARACTER", {
    hp: 8, maxHp: 8, attack: 3, defense: 3, speed: 4,
  });

  const gorath = new Entity("Gorath", "o Silencioso", "CHARACTER", {
    hp: 18, maxHp: 18, attack: 11, defense: 8, speed: 5,
  });

  const ocos = new Entity("Ocos", "o Devorador", "CHARACTER", {
    hp: 45, maxHp: 45, attack: 14, defense: 10, speed: 6,
  });

  // Itens unicos
  const swordDusk = new Entity("Espada do Crepusculo", "lamina que sangra luz", "ITEM");
  const swordDuskItem: InventoryItem = {
    uid: swordDusk.uid,
    name: swordDusk.name,
    description: "Uma espada cuja lamina brilha como por do sol eterno. Cada golpe carrega a memoria de um dia que nao volta.",
    unique: true,
  };

  const amuletHeart = new Entity("Amuleto do Ultimo Coracao", "o que pulsa quando tudo mais silencia", "ITEM");
  const amuletItem: InventoryItem = {
    uid: amuletHeart.uid,
    name: amuletHeart.name,
    description: "Um amuleto que contem a ultima batida de um coracao desconhecido. Pode salvar uma vida. Uma unica vez.",
    unique: true,
  };

  const shieldBroken = new Entity("Escudo Quebrado de Althena", "memoria de uma guardia", "ITEM");
  const shieldItem: InventoryItem = {
    uid: shieldBroken.uid,
    name: shieldBroken.name,
    description: "Um escudo rachado ao meio. Quem o carrega sente o peso de quem o empunhou antes.",
    unique: true,
  };

  // Registrar tudo
  for (const e of [player, lirael, voss, gorath, ocos, swordDusk, amuletHeart, shieldBroken]) {
    world.register(e);
  }

  // Inventario inicial
  player.addItem(swordDuskItem);
  player.addItem(amuletItem);
  player.addItem(shieldItem);

  // Laços iniciais
  const bondKaelLirael = world.bonds.create(player.uid, lirael.uid, "ALLY", 0.3);
  const bondLiraelKael = world.bonds.create(lirael.uid, player.uid, "ALLY", 0.5);
  const bondKaelVoss = world.bonds.create(player.uid, voss.uid, "MENTOR", 0.6);
  const bondVossKael = world.bonds.create(voss.uid, player.uid, "MENTOR", 0.7);
  const bondKaelGorath = world.bonds.create(player.uid, gorath.uid, "RIVAL", 0.15);

  // ══════════════════════════════════════════════════════════
  // CAPITULO 1 — O DESPERTAR
  // ══════════════════════════════════════════════════════════

  clear();
  title("Capitulo 1 — O Despertar");

  narrate("Voce abre os olhos num lugar que nao reconhece.");
  narrate("Madeira velha. Cheiro de cinzas. Uma lamparina tremula.");
  narrate("Madame Voss esta sentada na sua frente. Seus olhos sao velhos demais para o rosto.");

  whisper("Voce nao lembra como chegou aqui, nao e?");
  whisper("Nao se preocupe. Ninguem lembra. A diferenca e o que voce faz com o tempo que resta.");

  await pause();

  subtitle("Seu Inventario");
  for (const item of player.getInventory()) {
    console.log(`    ✦ ${item.name}`);
    console.log(`      ${item.description}`);
  }

  subtitle("Seus Laços");
  const kbonds = world.bonds.getBondsOf(player.uid);
  for (const b of kbonds) {
    const target = world.getEntity(
      b.sourceUID === player.uid ? b.targetUID : b.sourceUID
    );
    console.log(`    ${target?.name} — ${b.type} (intensidade: ${b.intensity.toFixed(2)})`);
  }

  await pause();

  // ── CENA: Voss pede ajuda ──

  const cap1Choice = await NarrativeEngine.scene(
    "O Pedido de Voss",
    `Voss tossi. O som e fragil como papel.

    "Existe algo na Floresta Cinzenta. Algo que nao devia existir."
    "Eu fui la quando era jovem. Trouxe isto."

    Ela aponta para o Amuleto no seu bolso.

    "Esse amuleto e a unica coisa que me mantem viva. Mas ele nao e meu."
    "Ele e seu agora. E o que voce fizer com ele... define tudo."

    Lirael aparece na porta. Sua sombra nao combina com seu corpo.
    Gorath esta encostado na parede do fundo, de bracos cruzados.`,
    world,
    player,
    [
      {
        id: "help_voss",
        label: "Concordar em ir a Floresta Cinzenta",
        cost: "Voss ficara sozinha e fragil.",
        execute: async (w, p) => {
          narrate("Voce annue. Voss sorri — um sorriso pequeno, velho, sincero.");
          whisper("Obrigada, garoto. Lirael conhece o caminho. Gorath... bom, ele vai porque quer.");
          bondKaelVoss.evolve("Aceitou o pedido de Voss. Confianca.", "TENDERNESS", 0.15);
          bondVossKael.evolve("Kael aceitou. Ha esperanca.", "HOPE", 0.1);
          bondKaelGorath.evolve("Gorath aceitou ir junto. Desconfianca mutua.", "DREAD", 0.05);
          w.events.append("QUEST_ACCEPTED", { quest: "Floresta Cinzenta" }, [p.uid]);
        },
      },
      {
        id: "refuse",
        label: "Recusar — isso nao e problema seu",
        cost: "Voss ficara desapontada. Laço com Voss enfraquece.",
        execute: async (w, p) => {
          narrate("Voss olha para voce. Nao com raiva. Com compreensao.");
          whisper("Eu entendo. Nao e obrigado a nada. Ninguem e.");
          whisper("Mas saiba: o amuleto continua com voce. E ele vai chamar voce, mais cedo ou mais tarde.");
          bondKaelVoss.evolve("Recusou o pedido. Distanciamento.", "LOSS", -0.2);
          bondVossKael.evolve("Kael recusou. Silencio.", "BITTERNESS", -0.15);
          w.events.append("QUEST_REFUSED", { quest: "Floresta Cinzenta" }, [p.uid]);
        },
      },
    ]
  );

  await pause();

  // ══════════════════════════════════════════════════════════
  // CAPITULO 2 — A EMBOSCADA
  // ══════════════════════════════════════════════════════════

  clear();
  title("Capitulo 2 — A Floresta Cinzenta");

  narrate("A floresta e silenciosa demais. Nenhum passaro. Nenhum inseto.");
  narrate("So o som dos proprios passos e o chiado das folhas secas.");
  narrate("Lirael caminha na frente. Suas maos brilham levemente — tecendo algo invisivel.");
  narrate("Gorath vai atras. Em silencio. Sempre em silencio.");

  await pause();

  narrate("De repente, Lirael para.");
  whisper("Tem algo aqui. Nao se move.");

  narrate("Das sombras emerge uma criatura. Corpo de escuridao. Olhos como brasas.");
  narrate("Ela nao grita. Nao ameaca. Apenas bloqueia o caminho.");
  narrate("Gorath saca a espada.");

  whisper("Entao e assim que vai ser, e?");

  await pause();

  // ── COMBATE: Emboscada ──

  const shadow1 = new Entity("Sombra Errante", "fragmento de escurido", "CHARACTER", {
    hp: 14, maxHp: 14, attack: 7, defense: 3, speed: 8,
  });
  const shadow2 = new Entity("Sombra Errante", "fragmento de escurido", "CHARACTER", {
    hp: 14, maxHp: 14, attack: 7, defense: 3, speed: 8,
  });
  world.register(shadow1);
  world.register(shadow2);

  const combatResult1 = await CombatEngine.run(
    world,
    [player, lirael, gorath],
    [shadow1, shadow2],
    {
      atRisk: ["LIFE", "ITEM"],
      retreatPossible: true,
      context: "Emboscada na Floresta Cinzenta — Sombras Errantes bloqueiam o caminho.",
    }
  );

  // Verifica sobreviventes
  const deadAllies1 = combatResult1.allies.filter((a) => !a.isAlive());
  if (deadAllies1.length > 0) {
    narrate("Perdas irreparaveis:");
    for (const dead of deadAllies1) {
      console.log(`    ✝ ${dead.name} (${dead.epithet}) — nao ha volta.`);
    }
  }

  if (combatResult1.retreated) {
    narrate("Voce recuou. A floresta permanece. O caminho continua fechado.");
    narrate("Mas alguem vai precisar enfrentar isso eventualmente.");
  } else {
    narrate("As sombras se dissolvem. O silencio volta. Mas diferente agora.");
    narrate("E um silencio que carrega o peso do que aconteceu.");
  }

  await pause();

  // ── CENA: Descoberta no campo ──

  if (player.isAlive()) {
    subtitle("No campo de batalha");

    narrate("Entre as sombras dissolvidas, algo brilha no chao.");
    narrate("E uma pedra. Preta. Fria. Mas quando voce toca, sente algo pulsar.");

    const relicItem: InventoryItem = {
      uid: randomUUID(),
      name: "Pedra do Vazio",
      description: "Uma pedra que pulsa com a escuridao das sombras que a guardavam. Parece viva.",
      unique: true,
    };

    const relicEntity = new Entity("Pedra do Vazio", "eco de algo maior", "ITEM");
    world.register(relicEntity);

    const relicChoice = await choice("Pegar a Pedra do Vazio?", [
      "Pegar — ela pode ser importante",
      "Deixar — nao confio no que nao entendo",
    ]);

    if (relicChoice === 0) {
      player.addItem(relicItem);
      narrate("Voce guarda a pedra. Ela e fria contra sua pele. Algo mudou no ar.");
      world.events.append("ITEM_ACQUIRED", { name: relicItem.name }, [player.uid]);
    } else {
      narrate("Voce deixa a pedra. Lirael observa. Gorath da de ombros.");
      world.events.append("ITEM_LEFT_BEHIND", { name: relicItem.name }, [player.uid]);
    }
  }

  await pause();

  // ══════════════════════════════════════════════════════════
  // CAPITULO 3 — O DILEMA
  // ══════════════════════════════════════════════════════════

  if (!player.isAlive()) {
    await showEnding(world, player);
    rl.close();
    return;
  }

  clear();
  title("Capitulo 3 — O Dilema");

  narrate("Voces retornam a cabana de Voss.");
  narrate("Mas algo mudou. O ar e mais pesado. A lamparina tremula mais.");

  if (voss.isAlive()) {
    narrate("Voss esta deitada. Sua respiracao e rasa.");
    whisper("Kael... voce voltou. Eu sabia que voce voltaria.");

    narrate("Ela tosse. O som e fragil como vidro quebrando.");
    whisper("O amuleto... ele vai parar de pulsar em breve. Quando parar, eu paro junto.");
    whisper("Voce pode usa-lo para me salvar. Mas ele vai se desfazer.");
    whisper("Ou pode guarda-lo. O que ele protege e maior que eu.");
    whisper("Escolha, garoto. Escolha e nao olhe para tras.");

    await pause();

    // ── ESCOLHA IRREVERSIVEL ──

    const cap3Choice = await NarrativeEngine.scene(
      "A Ultima Decisao",
      `O Amuleto do Ultimo Coracao pulsa no seu bolso.
      Cada pulso e mais fraco que o anterior.
      Voss olha para voce com olhos que ja entenderam tudo.

      Esta escolha e PERMANENTE. Nao ha como voltar.`,
      world,
      player,
      [
        {
          id: "save_voss",
          label: "Usar o Amuleto para salvar Voss",
          cost: "O Amuleto se desfaz PERMANENTEMENTE. Voce nunca mais vai ter essa opcao.",
          execute: async (w, p) => {
            p.removeItem(amuletHeart.uid);
            voss.heal(20);
            narrate("");
            narrate("Voce pressiona o Amuleto contra o peito de Voss.");
            narrate("Uma luz dourada pulsa. Uma vez. Duas vezes. Como um coracao que se lembra como bater.");
            narrate("Voss respira fundo. Seus olhos se abrem. Ela sorri.");
            narrate("O Amuleto se desfaz em cinzas douradas entre seus dedos.");
            narrate("Ele nao existe mais. Em lugar nenhum. Nunca mais.");
            whisper("Obrigada... garoto. Obrigada.");
            bondKaelVoss.evolve("Salvou Voss com o Amuleto. Sacrificio.", "TENDERNESS", 0.35);
            bondVossKael.evolve("Kael sacrificou o impossivel por mim.", "HOPE", 0.4);
            w.events.append("AMULET_USED", { saved: "Voss", itemLost: amuletHeart.name }, [p.uid, voss.uid]);
          },
        },
        {
          id: "keep_amulet",
          label: "Guardar o Amuleto — Voss nao resistira",
          cost: "Madame Voss morre. PERMANENTEMENTE. O laço de mentor se rompe.",
          execute: async (w, p) => {
            voss.modifyHp(-voss.stats!.hp);
            voss.markDeceased("Amuleto nao utilizado");
            narrate("");
            narrate("Voce guarda o Amuleto. Suas maos tremem.");
            narrate("Voss olha para voce. Nao com raiva. Nao com julgamento.");
            narrate("Com amor.");
            whisper("Eu entendo. Nao era para ser meu. Era sempre para ser seu.");
            whisper("Viva bem, garoto. Viva como se fosse...");
            narrate("");
            narrate("Silencio.");
            narrate("");
            narrate("O silencio que se segue nunca vai embora.");
            bondKaelVoss.evolve("Nao usou o Amuleto. Voss morreu.", "LOSS", -1.0);
            bondVossKael.break("Morte de Voss");
            w.bonds.breakAllOf(voss.uid, "Morte de Voss");
            w.events.append("VOSS_DEATH", { cause: "Amuleto nao utilizado" }, [p.uid, voss.uid]);
          },
        },
      ]
    );
  }

  await pause();

  // ══════════════════════════════════════════════════════════
  // CAPITULO 4 — O CONFRONTO FINAL
  // ══════════════════════════════════════════════════════════

  if (!player.isAlive()) {
    await showEnding(world, player);
    rl.close();
    return;
  }

  clear();
  title("Capitulo 4 — O Devorador");

  narrate("A floresta comeca a tremer.");
  narrate("As arvores se inclinam. O chao racha.");
  narrate("De dentro da escuridao, algo emerge.");
  narrate("");
  narrate("E enorme. E faminto. E antigo.");
  narrate("Ocos, o Devorador.");

  if (ocos.isAlive()) {
    whisper("Kael... eu conheco esse cheiro. Medo. Perda. Decisoes.");
    whisper("Voce carrega coisas que nao deviam existir. Me deixa provar.");
  }

  await pause();

  // Verifica quem esta vivo
  const finalAllies: Entity[] = [player];
  if (lirael.isAlive()) finalAllies.push(lirael);
  if (gorath.isAlive()) finalAllies.push(gorath);
  if (voss.isAlive()) finalAllies.push(voss);

  narrate(`Seu grupo para o confronto final:`);
  for (const a of finalAllies) {
    stat(a);
  }

  await pause();

  const finalCombat = await CombatEngine.run(
    world,
    finalAllies,
    [ocos],
    {
      atRisk: ["LIFE", "ITEM", "BOND"],
      retreatPossible: false,
      context: "Confronto final contra Ocos, o Devorador. Nao ha volta.",
    }
  );

  await pause();

  // ══════════════════════════════════════════════════════════
  // FIM
  // ══════════════════════════════════════════════════════════

  await showEnding(world, player);

  rl.close();
}

async function showEnding(world: WorldState, player: Entity): Promise<void> {
  clear();
  title("F I M");

  const alive = world.getAllAlive();
  const dead = world.getAllDead();
  const allBonds = world.bonds.getAll();
  const brokenBonds = allBonds.filter((b) => b.broken);
  const timeline = world.events.getTimeline();

  // Narrativa de encerramento
  if (player.isAlive()) {
    narrate("Kael sobreviveu. Mas o que sobrou?");

    if (alive.length === 1) {
      narrate("Sozinho. Com o peso de todos que perdeu.");
      narrate("Cada espaco vazio no mundo e uma historia que nao vai terminar.");
    } else {
      narrate(`Com ${alive.length - 1} ao seu lado.`);
      narrate("Menos do que comecou. Mas os que ficam sabem o que significa estar aqui.");
    }
  } else {
    narrate("Kael caiu. Como tantos antes dele.");
    narrate("O mundo continua. Sem ele. Sem o que ele poderia ter sido.");
  }

  await pause();

  // Relatorio final
  subtitle("RELATORIO FINAL DO MUNDO");

  console.log(`  Epochs vividos:    ${timeline.length}`);
  console.log(`  Entidades criadas: ${world.getCatalog().length}`);
  console.log(`  Sobreviventes:     ${alive.length}`);
  console.log(`  Perdidos:          ${dead.length}`);
  console.log(`  Laços criados:     ${allBonds.length}`);
  console.log(`  Laços rompidos:    ${brokenBonds.length}`);

  subtitle("Sobreviventes");
  if (alive.length > 0) {
    for (const entity of alive) {
      const s = entity.stats;
      const hp = s ? `${s.hp}/${s.maxHp}` : "";
      console.log(`    ✦ ${entity.name} (${entity.epithet}) ${hp}`);
      const bonds = world.bonds.getBondsOf(entity.uid);
      if (bonds.length > 0) {
        for (const b of bonds) {
          const other = world.getEntity(b.sourceUID === entity.uid ? b.targetUID : b.sourceUID);
          console.log(`      └─ ${b.type} com ${other?.name ?? "?"} (${b.intensity.toFixed(2)})`);
        }
      }
    }
  } else {
    console.log("    Ninguem sobreviveu.");
  }

  subtitle("Perdidos para Sempre");
  if (dead.length > 0) {
    for (const entity of dead) {
      console.log(`    ✝ ${entity.name} (${entity.epithet})`);
      const bonds = allBonds.filter(
        (b) => (b.sourceUID === entity.uid || b.targetUID === entity.uid) && b.broken
      );
      for (const b of bonds) {
        console.log(`      └─ ${b.type} rompido: ${b.brokenReason}`);
      }
      const items = entity.getInventory();
      if (items.length > 0) {
        for (const item of items) {
          console.log(`      └─ Item perdido: ${item.name}`);
        }
      }
    }
  } else {
    console.log("    Ninguem se foi.");
  }

  subtitle("Laços Ativos");
  const activeBonds = allBonds.filter((b) => !b.broken);
  if (activeBonds.length > 0) {
    for (const b of activeBonds) {
      const src = world.getEntity(b.sourceUID);
      const tgt = world.getEntity(b.targetUID);
      console.log(`    ${src?.name} ──${b.type}(${b.intensity.toFixed(2)})──> ${tgt?.name}`);
      for (const mem of b.getMemories()) {
        console.log(`      📝 ${mem.description}`);
      }
    }
  } else {
    console.log("    Nenhum laço sobreviveu.");
  }

  subtitle("Timeline de Eventos");
  for (const event of timeline) {
    const entities = event.relatedEntities
      .map((uid) => world.getEntity(uid)?.name ?? "?")
      .join(", ");
    console.log(`    [E${event.epoch}] ${event.type} → ${entities}`);
  }

  subtitle("Inventario Final de Kael");
  if (player.isAlive()) {
    const items = player.getInventory();
    if (items.length > 0) {
      for (const item of items) {
        console.log(`    ✦ ${item.name}`);
        console.log(`      ${item.description}`);
      }
    } else {
      console.log("    Vazio. Tudo foi perdido ou sacrificado.");
    }
  } else {
    console.log("    Irrelevante. Kael nao existe mais.");
  }

  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║       O que voce viveu nao pode ser desfeito.            ║
  ║       O que voce perdeu nao pode ser substituido.        ║
  ║       Isso e IRREPLACEABLE.                              ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
}

// ── Executar ──
main().catch(console.error);