/* global Phaser */

const TILE = 32;
const COLS = 18;
const ROWS = 12;
const MAP_X = 18;
const MAP_Y = 68;
const MAP_WIDTH = COLS * TILE;
const MAP_HEIGHT = ROWS * TILE;
const PANEL_X = 612;

const BUILDINGS = {
  repair: {
    label: '住棟改修', short: '改修', cost: 120, texture: 'home', kind: 'home',
    income: 18, upkeep: 3, unlock: 0, description: '古い住棟を再生。新しい住民が入居します。',
  },
  shop: {
    label: '団地デリカ', short: '惣菜', cost: 95, texture: 'shop', kind: 'food',
    income: 5, upkeep: 2, unlock: 0, description: '空腹を満たし、店の経験値も増えます。',
  },
  cowork: {
    label: 'しごと部屋', short: '仕事', cost: 150, texture: 'cowork', kind: 'work',
    income: 7, upkeep: 4, unlock: 0, description: '仕事力とアイデアが育ち、起業につながります。',
  },
  park: {
    label: 'ちびっこ広場', short: '公園', cost: 70, texture: 'park', kind: 'fun',
    income: 1, upkeep: 1, unlock: 0, description: '住民の気分を回復。団地の評判も上がります。',
  },
  clinic: {
    label: 'まちの診療所', short: '診療', cost: 210, texture: 'clinic', kind: 'health',
    income: 10, upkeep: 6, unlock: 22, description: '評判22で解放。住民全体の満足度を支えます。',
  },
  nursery: {
    label: '団地こども園', short: '保育', cost: 230, texture: 'nursery', kind: 'family',
    income: 9, upkeep: 5, unlock: 38, description: '評判38で解放。子育て世帯を呼び込みます。',
  },
};

const RESIDENT_TEMPLATES = [
  { name: '山田ヨシオ', job: '元電気工', trait: '世話好き', color: 0x4f8ac9, skill: 18, idea: 7 },
  { name: '本田ミライ', job: '動画編集見習い', trait: '飽きっぽい', color: 0xe66c5c, skill: 8, idea: 16 },
  { name: '大野マサコ', job: '惣菜名人', trait: '話が長い', color: 0xf0b84d, skill: 16, idea: 10 },
  { name: '西村レン', job: 'プログラマー', trait: '夜型', color: 0x7c65b8, skill: 12, idea: 18 },
  { name: '佐々木ハル', job: '子育て会社員', trait: '行動派', color: 0x4aa36b, skill: 13, idea: 9 },
  { name: '猫田タマオ', job: '商店アルバイト', trait: '猫に好かれる', color: 0xd97b42, skill: 9, idea: 12 },
  { name: '森アカリ', job: '保育士', trait: 'お祭り好き', color: 0x4aa0a0, skill: 14, idea: 11 },
  { name: '神谷ソウタ', job: '配送員', trait: '方向音痴', color: 0x9b6c4f, skill: 11, idea: 13 },
];

const COMBOS = [
  { key: 'life', needs: ['home', 'shop', 'park'], name: 'ほのぼの生活街区', reward: 140, rep: 10 },
  { key: 'startup', needs: ['home', 'shop', 'cowork'], name: '団地ベンチャー横丁', reward: 190, rep: 14 },
  { key: 'wellness', needs: ['home', 'park', 'clinic'], name: '健康長寿街区', reward: 220, rep: 16 },
  { key: 'family', needs: ['home', 'park', 'nursery'], name: '子育て応援街区', reward: 240, rep: 18 },
];

const CHOICE_EVENTS = [
  {
    title: '団地祭りをどうする？',
    body: '自治会長が「今年こそ派手に」と目を輝かせています。',
    options: [
      { label: '本気の団地祭り  -60万円', apply: (s) => { s.money -= 60; s.reputation += 14; s.changeAllHappiness(8); s.bigNews('太鼓が朝6時から鳴りました。評判は上々です。'); } },
      { label: '住民手作り祭り  -15万円', apply: (s) => { s.money -= 15; s.reputation += 6; s.changeAllHappiness(4); s.bigNews('焼きそばだけ異様に充実した祭りになりました。'); } },
    ],
  },
  {
    title: '空き部屋に誰を呼ぶ？',
    body: '移住希望者が2組。どちらを優先しましょう？',
    options: [
      { label: '子育て世帯を呼ぶ  -25万円', apply: (s) => { s.money -= 25; s.addResident({ job: '子育て世帯', trait: '早起き', idea: 8, skill: 12 }); s.reputation += 5; s.bigNews('ベビーカー軍団が廊下を制圧しました。'); } },
      { label: '若手起業家を呼ぶ  -35万円', apply: (s) => { s.money -= 35; s.addResident({ job: '起業準備中', trait: '夢が大きい', idea: 24, skill: 9 }); s.reputation += 4; s.bigNews('名刺だけ先に1000枚届きました。'); } },
    ],
  },
  {
    title: 'バスがまた減便！',
    body: '駅まで20分。住民から「帰りだけでも何とかして」と要望です。',
    options: [
      { label: '臨時便を出す  -50万円', apply: (s) => { s.money -= 50; s.changeAllHappiness(7); s.reputation += 9; s.bigNews('最終便だけ満員。運転手は人気者です。'); } },
      { label: '電動自転車を配る  -20万円', apply: (s) => { s.money -= 20; s.changeAllHappiness(3); s.levelRandomFacility('park', 2); s.bigNews('坂道で自治会長だけ置いていかれました。'); } },
    ],
  },
];

class DanchiScene extends Phaser.Scene {
  constructor() {
    super('DanchiScene');
    this.money = 480;
    this.year = 1;
    this.month = 1;
    this.reputation = 0;
    this.selected = 'repair';
    this.cells = [];
    this.residents = [];
    this.comboKeys = new Set();
    this.startups = [];
    this.repairedCount = 0;
    this.visitCounts = { shop: 0, cowork: 0, park: 0, clinic: 0, nursery: 0 };
    this.eventOpen = false;
    this.selectedResident = null;
    this.nextResidentIndex = 0;
    this.speed = 1;
    this.buildButtons = new Map();
    this.objectives = [
      { id: 'repair', label: '古い住棟を1棟改修', reward: 100, done: false, check: () => this.repairedCount >= 1 },
      { id: 'shop', label: '惣菜店を6回利用', reward: 90, done: false, check: () => this.visitCounts.shop >= 6 },
      { id: 'combo', label: '団地コンボを1つ発見', reward: 150, done: false, check: () => this.comboKeys.size >= 1 },
      { id: 'startup', label: '団地ベンチャーを誕生', reward: 240, done: false, check: () => this.startups.length >= 1 },
    ];
  }

  create() {
    this.cameras.main.setBackgroundColor('#6fa85b');
    this.createTextures();
    this.createMap();
    this.createInitialTown();
    this.createResidents(4);
    this.createHud();
    this.createSidePanel();
    this.createBuildMenu();
    this.createNewsTicker();
    this.setupInput();

    this.monthTimer = this.time.addEvent({ delay: 7200, loop: true, callback: () => this.nextMonth() });
    this.aiTimer = this.time.addEvent({ delay: 1100, loop: true, callback: () => this.planResidentActions() });
    this.uiTimer = this.time.addEvent({ delay: 500, loop: true, callback: () => this.refreshDynamicUi() });

    this.bigNews('空室だらけの「ひだまり団地」を、もう一度人気の街へ。');
    this.showToast('まず古い住棟を1棟、改修してみよう。');
  }

  createTextures() {
    const make = (key, draw) => {
      const g = this.add.graphics();
      draw(g);
      g.generateTexture(key, TILE, TILE);
      g.destroy();
    };

    make('empty', (g) => {
      g.fillStyle(0x86bd6b).fillRect(0, 0, 32, 32);
      g.fillStyle(0x78aa60).fillRect(4, 6, 2, 2).fillRect(23, 12, 2, 2).fillRect(14, 27, 2, 2);
      g.lineStyle(1, 0x6d9c56, 0.6).strokeRect(1, 1, 30, 30);
    });

    make('road', (g) => {
      g.fillStyle(0x777b82).fillRect(0, 0, 32, 32);
      g.fillStyle(0x666a70).fillRect(0, 0, 32, 3).fillRect(0, 29, 32, 3);
      g.fillStyle(0xe7d284).fillRect(3, 15, 8, 2).fillRect(20, 15, 8, 2);
    });

    make('old', (g) => {
      g.fillStyle(0xaaa79f).fillRect(2, 5, 28, 25);
      g.fillStyle(0x6e6d69).fillRect(2, 5, 28, 4);
      g.fillStyle(0x5f6871).fillRect(6, 12, 6, 5).fillRect(20, 12, 6, 5).fillRect(6, 21, 6, 5).fillRect(20, 21, 6, 5);
      g.fillStyle(0x87564b).fillRect(14, 19, 5, 11);
      g.fillStyle(0x4c4c49).fillRect(27, 8, 2, 17);
      g.fillStyle(0x7d9360).fillRect(2, 28, 8, 2).fillRect(23, 27, 7, 3);
    });

    make('home', (g) => {
      g.fillStyle(0xf0ddb1).fillRect(2, 4, 28, 26);
      g.fillStyle(0x4e7d91).fillRect(2, 4, 28, 5);
      g.fillStyle(0x87c6d3).fillRect(6, 12, 6, 5).fillRect(20, 12, 6, 5).fillRect(6, 21, 6, 5).fillRect(20, 21, 6, 5);
      g.fillStyle(0xd6694e).fillRect(14, 19, 5, 11);
      g.fillStyle(0x5d9b58).fillRect(1, 28, 30, 3);
      g.fillStyle(0xffffff, 0.7).fillRect(7, 13, 2, 2).fillRect(21, 22, 2, 2);
    });

    make('shop', (g) => {
      g.fillStyle(0xf4dfac).fillRect(3, 10, 26, 20);
      g.fillStyle(0xcf5b52).fillRect(2, 6, 28, 8);
      g.fillStyle(0xfff1c4).fillRect(5, 7, 5, 7).fillRect(15, 7, 5, 7).fillRect(25, 7, 3, 7);
      g.fillStyle(0x6d473a).fillRect(6, 19, 8, 11);
      g.fillStyle(0x77bccc).fillRect(18, 18, 8, 7);
      g.fillStyle(0xe8b54d).fillRect(21, 26, 4, 3);
    });

    make('cowork', (g) => {
      g.fillStyle(0xd9d5ef).fillRect(3, 7, 26, 23);
      g.fillStyle(0x514e79).fillRect(3, 7, 26, 5);
      g.fillStyle(0x75b2d0).fillRect(7, 15, 18, 8);
      g.fillStyle(0x3f3d58).fillRect(14, 23, 4, 7);
      g.fillStyle(0xf1d15c).fillRect(23, 3, 5, 5);
      g.fillStyle(0xffffff).fillRect(24, 4, 2, 2);
    });

    make('park', (g) => {
      g.fillStyle(0x84bf68).fillRect(0, 0, 32, 32);
      g.fillStyle(0x744a2c).fillRect(8, 16, 4, 13).fillRect(22, 18, 3, 11);
      g.fillStyle(0x3d9450).fillCircle(10, 12, 8).fillCircle(23, 14, 6);
      g.fillStyle(0xe4c15e).fillRect(15, 24, 11, 3);
      g.fillStyle(0xb17b49).fillRect(17, 27, 2, 3).fillRect(23, 27, 2, 3);
    });

    make('clinic', (g) => {
      g.fillStyle(0xe9f2e9).fillRect(3, 7, 26, 23);
      g.fillStyle(0x5b9b7a).fillRect(3, 7, 26, 5);
      g.fillStyle(0x79b9c5).fillRect(6, 16, 7, 7).fillRect(19, 16, 7, 7);
      g.fillStyle(0xffffff).fillRect(13, 9, 6, 2).fillRect(15, 7, 2, 6);
      g.fillStyle(0x5b6e75).fillRect(14, 23, 4, 7);
    });

    make('nursery', (g) => {
      g.fillStyle(0xffe1b8).fillRect(3, 9, 26, 21);
      g.fillStyle(0xe07b65).fillTriangle(2, 10, 16, 2, 30, 10);
      g.fillStyle(0x77b9ce).fillRect(6, 17, 7, 6).fillRect(19, 17, 7, 6);
      g.fillStyle(0x6b8f51).fillRect(14, 22, 5, 8);
      g.fillStyle(0xf2c94c).fillCircle(25, 7, 3);
    });

    const hairColors = [0x3d332e, 0x583b2d, 0x2e3644, 0x6f5032, 0x3d3d3d, 0x7b5b42, 0x343b48, 0x694232];
    RESIDENT_TEMPLATES.forEach((template, index) => {
      make(`resident-${index}`, (g) => {
        g.fillStyle(0x000000, 0.18).fillEllipse(16, 29, 15, 4);
        g.fillStyle(0xf0c49a).fillRect(10, 6, 12, 10);
        g.fillStyle(hairColors[index]).fillRect(9, 4, 14, 5).fillRect(9, 7, 3, 5);
        g.fillStyle(template.color).fillRect(8, 16, 16, 10);
        g.fillStyle(0x343b48).fillRect(9, 26, 6, 5).fillRect(18, 26, 6, 5);
        g.fillStyle(0x2d3035).fillRect(12, 10, 2, 2).fillRect(18, 10, 2, 2);
        g.fillStyle(0xb65f57).fillRect(15, 14, 3, 1);
      });
    });
  }

  createMap() {
    this.add.rectangle(MAP_X - 4, MAP_Y - 4, MAP_WIDTH + 8, MAP_HEIGHT + 8, 0x40513e)
      .setOrigin(0).setDepth(-2);

    for (let y = 0; y < ROWS; y += 1) {
      this.cells[y] = [];
      for (let x = 0; x < COLS; x += 1) {
        const isRoad = y === 6 || x === 8;
        const type = isRoad ? 'road' : 'empty';
        const sprite = this.add.image(MAP_X + x * TILE, MAP_Y + y * TILE, type).setOrigin(0);
        sprite.setInteractive({ useHandCursor: !isRoad });
        const cell = { x, y, type, sprite, level: 1, xp: 0, visits: 0 };
        sprite.setData('cell', cell);
        this.cells[y][x] = cell;
      }
    }
  }

  createInitialTown() {
    this.placeInitial(2, 2, 'old');
    this.placeInitial(4, 2, 'old');
    this.placeInitial(2, 9, 'old');
    this.placeInitial(4, 9, 'home');
    this.placeInitial(11, 2, 'shop');
    this.placeInitial(12, 9, 'park');
  }

  placeInitial(x, y, type) {
    const cell = this.cells[y][x];
    cell.type = type;
    cell.sprite.setTexture(type);
  }

  createResidents(count) {
    for (let i = 0; i < count; i += 1) this.addResident();
  }

  addResident(overrides = {}) {
    const template = RESIDENT_TEMPLATES[this.nextResidentIndex % RESIDENT_TEMPLATES.length];
    const textureIndex = this.nextResidentIndex % RESIDENT_TEMPLATES.length;
    this.nextResidentIndex += 1;

    const road = this.cells[6][Phaser.Math.Between(1, COLS - 2)];
    const sprite = this.add.image(
      MAP_X + road.x * TILE + 16,
      MAP_Y + road.y * TILE + 16,
      `resident-${textureIndex}`,
    ).setDepth(30).setScale(0.82).setInteractive({ useHandCursor: true });

    const resident = {
      id: this.nextResidentIndex,
      name: overrides.name || template.name,
      job: overrides.job || template.job,
      trait: overrides.trait || template.trait,
      skill: overrides.skill ?? template.skill,
      idea: overrides.idea ?? template.idea,
      happiness: 60,
      needs: { food: Phaser.Math.Between(45, 80), fun: Phaser.Math.Between(45, 80), work: Phaser.Math.Between(45, 80) },
      wallet: 20,
      sprite,
      target: null,
      targetCell: null,
      state: '散歩中',
      speed: Phaser.Math.Between(28, 38),
      bubble: null,
    };

    sprite.on('pointerdown', () => {
      this.selectedResident = resident;
      this.refreshResidentPanel();
      this.showToast(`${resident.name}「${this.getResidentComment(resident)}」`);
    });

    this.residents.push(resident);
    this.pickWanderTarget(resident);
    this.refreshDynamicUi();
    return resident;
  }

  createHud() {
    this.add.rectangle(0, 0, 1024, 58, 0x203148).setOrigin(0).setDepth(70);
    this.add.text(16, 10, '団地再生ものがたり', {
      fontFamily: 'monospace', fontSize: '21px', color: '#fff0b8', fontStyle: 'bold',
    }).setDepth(71);

    this.statsText = this.add.text(316, 9, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff', lineSpacing: 2,
    }).setDepth(71);

    const speedLabels = ['停止', '1倍', '2倍'];
    speedLabels.forEach((label, index) => {
      const button = this.add.rectangle(871 + index * 47, 11, 42, 34, index === 1 ? 0xf0ce67 : 0x43566f)
        .setOrigin(0).setDepth(72).setInteractive({ useHandCursor: true });
      button.setData('speed', index);
      this.add.text(892 + index * 47, 28, label, {
        fontFamily: 'monospace', fontSize: '11px', color: index === 1 ? '#273548' : '#ffffff',
      }).setOrigin(0.5).setDepth(73);
      button.on('pointerdown', () => this.setSpeed(index));
    });

    this.updateHud();
  }

  createSidePanel() {
    this.add.rectangle(PANEL_X, 68, 394, 384, 0xf7e9bc, 0.98)
      .setOrigin(0).setStrokeStyle(4, 0x26374b).setDepth(60);

    this.add.text(PANEL_X + 14, 80, '再生ミッション', {
      fontFamily: 'monospace', fontSize: '17px', color: '#26374b', fontStyle: 'bold',
    }).setDepth(61);
    this.objectiveText = this.add.text(PANEL_X + 14, 106, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#33445a', lineSpacing: 7,
    }).setDepth(61);

    this.add.line(PANEL_X + 12, 211, 0, 0, 366, 0, 0x8b744e).setOrigin(0).setDepth(61);
    this.add.text(PANEL_X + 14, 222, '住民ファイル', {
      fontFamily: 'monospace', fontSize: '17px', color: '#26374b', fontStyle: 'bold',
    }).setDepth(61);
    this.residentText = this.add.text(PANEL_X + 14, 249, '住民をクリックすると詳細が見られます。', {
      fontFamily: 'monospace', fontSize: '13px', color: '#33445a', lineSpacing: 4, wordWrap: { width: 360 },
    }).setDepth(61);

    this.startupButton = this.add.rectangle(PANEL_X + 14, 363, 366, 45, 0x6d7783)
      .setOrigin(0).setStrokeStyle(3, 0x26374b).setDepth(62).setInteractive({ useHandCursor: true });
    this.startupButtonText = this.add.text(PANEL_X + 197, 386, '起業会議：条件未達', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(63);
    this.startupButton.on('pointerdown', () => this.tryLaunchStartup());

    this.startupText = this.add.text(PANEL_X + 14, 416, '団地ベンチャー：まだありません', {
      fontFamily: 'monospace', fontSize: '13px', color: '#6c5236', wordWrap: { width: 360 },
    }).setDepth(61);
  }

  createBuildMenu() {
    const y = 470;
    this.add.rectangle(0, y - 8, 1024, 112, 0x23354b, 0.98).setOrigin(0).setDepth(70);
    this.add.text(16, y + 3, '建設メニュー', {
      fontFamily: 'monospace', fontSize: '14px', color: '#fff0b8', fontStyle: 'bold',
    }).setDepth(71);

    Object.entries(BUILDINGS).forEach(([key, data], index) => {
      const x = 16 + index * 164;
      const button = this.add.rectangle(x, y + 26, 151, 66, 0xf7e9bd)
        .setOrigin(0).setStrokeStyle(3, 0x152338).setDepth(71).setInteractive({ useHandCursor: true });
      button.setData('buildingKey', key);
      const title = this.add.text(x + 8, y + 33, data.label, {
        fontFamily: 'monospace', fontSize: '13px', color: '#263449', fontStyle: 'bold',
      }).setDepth(72);
      const info = this.add.text(x + 8, y + 56, `${data.cost}万円`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#754c2f',
      }).setDepth(72);
      const lock = this.add.text(x + 143, y + 83, '', {
        fontFamily: 'monospace', fontSize: '11px', color: '#713e36',
      }).setOrigin(1, 1).setDepth(73);

      button.on('pointerdown', () => this.selectBuilding(key));
      this.buildButtons.set(key, { button, title, info, lock });
    });
    this.refreshBuildButtons();
  }

  createNewsTicker() {
    this.newsBox = this.add.rectangle(18, 430, 576, 30, 0xfff1c7, 0.98)
      .setOrigin(0).setStrokeStyle(2, 0x26374b).setDepth(62);
    this.newsText = this.add.text(28, 445, '団地ニュース：本日もだいたい平和です。', {
      fontFamily: 'monospace', fontSize: '13px', color: '#263449',
    }).setOrigin(0, 0.5).setDepth(63);
  }

  setupInput() {
    this.input.on('gameobjectdown', (_pointer, object) => {
      if (this.eventOpen) return;
      const cell = object.getData('cell');
      if (!cell || cell.type === 'road') return;
      this.tryBuild(cell);
    });
  }

  selectBuilding(key) {
    const data = BUILDINGS[key];
    if (this.reputation < data.unlock) {
      this.showToast(`${data.label}は評判${data.unlock}で解放されます。`);
      return;
    }
    this.selected = key;
    this.refreshBuildButtons();
    this.showToast(`${data.description}`);
  }

  tryBuild(cell) {
    const build = BUILDINGS[this.selected];
    if (!build) return;

    if (this.reputation < build.unlock) {
      this.showToast(`まだ解放されていません。評判${build.unlock}が必要です。`);
      return;
    }
    if (this.selected === 'repair' && cell.type !== 'old') {
      this.showToast('改修できるのは、灰色の古い住棟だけです。');
      return;
    }
    if (this.selected !== 'repair' && cell.type !== 'empty') {
      this.showToast('空き地を選んでください。');
      return;
    }
    if (this.money < build.cost) {
      this.showToast('資金不足。自治会長の電卓が止まりました。');
      return;
    }

    this.money -= build.cost;
    cell.type = build.kind === 'home' ? 'home' : this.selected;
    cell.level = 1;
    cell.xp = 0;
    cell.visits = 0;
    cell.sprite.setTexture(build.texture).setScale(0.15).setAngle(-8);
    this.tweens.add({ targets: cell.sprite, scale: 1, angle: 0, duration: 430, ease: 'Back.Out' });
    this.makeSparkles(cell.sprite.x + 16, cell.sprite.y + 12);

    if (this.selected === 'repair') {
      this.repairedCount += 1;
      this.addResident();
      this.reputation += 4;
      this.bigNews('改修完了！ 新しい住民が引っ越してきました。');
    } else {
      this.bigNews(`${build.label}が開業。住民が早くも様子を見ています。`);
    }

    this.checkCombos(cell.x, cell.y);
    this.checkObjectives();
    this.updateHud();
    this.refreshBuildButtons();
  }

  planResidentActions() {
    if (this.speed === 0 || this.eventOpen) return;
    this.residents.forEach((resident) => {
      if (resident.state.startsWith('移動') || resident.state.startsWith('利用')) return;
      this.chooseNeedTarget(resident);
    });
  }

  chooseNeedTarget(resident) {
    const needs = Object.entries(resident.needs).sort((a, b) => a[1] - b[1]);
    const need = needs[0][0];
    const wantedType = { food: 'shop', fun: 'park', work: 'cowork' }[need];
    const candidates = this.cells.flat().filter((cell) => cell.type === wantedType);

    if (candidates.length === 0) {
      this.showResidentBubble(resident, need === 'food' ? '腹' : need === 'fun' ? '休' : '働');
      this.pickWanderTarget(resident);
      return;
    }

    const target = Phaser.Utils.Array.GetRandom(candidates);
    resident.targetCell = target;
    resident.target = new Phaser.Math.Vector2(MAP_X + target.x * TILE + 16, MAP_Y + target.y * TILE + 18);
    resident.state = `移動：${BUILDINGS[target.type].label}`;
    this.showResidentBubble(resident, need === 'food' ? '飯' : need === 'fun' ? '楽' : '仕');
  }

  pickWanderTarget(resident) {
    const roads = this.cells.flat().filter((cell) => cell.type === 'road');
    const target = Phaser.Utils.Array.GetRandom(roads);
    resident.targetCell = null;
    resident.target = new Phaser.Math.Vector2(MAP_X + target.x * TILE + 16, MAP_Y + target.y * TILE + 16);
    resident.state = '散歩中';
  }

  arriveResident(resident) {
    if (!resident.targetCell) {
      resident.state = 'ひと休み';
      this.time.delayedCall(Phaser.Math.Between(500, 1300), () => this.chooseNeedTarget(resident));
      return;
    }

    const cell = resident.targetCell;
    resident.targetCell = null;
    resident.state = `利用：${BUILDINGS[cell.type].label}`;
    resident.sprite.setTint(0xfff1a8);
    this.tweens.add({ targets: resident.sprite, y: resident.sprite.y - 5, yoyo: true, repeat: 1, duration: 140 });

    this.time.delayedCall(750, () => {
      resident.sprite.clearTint();
      this.useFacility(resident, cell);
      resident.state = '満足そう';
      this.time.delayedCall(500, () => this.pickWanderTarget(resident));
    });
  }

  useFacility(resident, cell) {
    const type = cell.type;
    cell.visits += 1;
    cell.xp += 1;
    this.visitCounts[type] = (this.visitCounts[type] || 0) + 1;

    if (type === 'shop') {
      resident.needs.food = Math.min(100, resident.needs.food + 46);
      resident.wallet = Math.max(0, resident.wallet - 3);
      this.money += 5 + cell.level;
      this.floatValue(cell, `+${5 + cell.level}`);
    } else if (type === 'park') {
      resident.needs.fun = Math.min(100, resident.needs.fun + 45);
      resident.happiness = Math.min(100, resident.happiness + 3);
      if (Phaser.Math.Between(1, 5) === 1) this.reputation += 1;
      this.floatValue(cell, 'にこっ');
    } else if (type === 'cowork') {
      resident.needs.work = Math.min(100, resident.needs.work + 48);
      resident.skill += Phaser.Math.Between(1, 2);
      resident.idea += Phaser.Math.Between(1, 3);
      resident.wallet += 7;
      this.money += 4 + cell.level;
      this.floatValue(cell, 'ひらめき');
    } else if (type === 'clinic') {
      Object.keys(resident.needs).forEach((key) => { resident.needs[key] = Math.min(100, resident.needs[key] + 12); });
      resident.happiness = Math.min(100, resident.happiness + 6);
      this.money += 8 + cell.level;
      this.floatValue(cell, '元気');
    } else if (type === 'nursery') {
      resident.needs.fun = Math.min(100, resident.needs.fun + 30);
      resident.happiness = Math.min(100, resident.happiness + 5);
      this.money += 7 + cell.level;
      this.floatValue(cell, 'わいわい');
    }

    this.tryLevelFacility(cell);
    this.progressStartups(type);
    this.recalculateHappiness(resident);
    this.checkObjectives();
    this.refreshDynamicUi();
  }

  tryLevelFacility(cell) {
    const thresholds = [0, 5, 13, 24];
    const next = Math.min(3, cell.level + 1);
    if (next > cell.level && cell.xp >= thresholds[next]) {
      cell.level = next;
      this.reputation += 4;
      this.makeSparkles(cell.sprite.x + 16, cell.sprite.y + 12);
      this.bigNews(`${BUILDINGS[cell.type].label}がレベル${cell.level}に成長！ 常連客が増えました。`);
    }
  }

  checkCombos(x, y) {
    const nearby = new Set();
    for (let oy = -2; oy <= 2; oy += 1) {
      for (let ox = -2; ox <= 2; ox += 1) {
        const cell = this.cells[y + oy]?.[x + ox];
        if (cell) nearby.add(cell.type);
      }
    }

    COMBOS.forEach((combo) => {
      if (this.comboKeys.has(combo.key)) return;
      if (combo.needs.every((need) => nearby.has(need))) {
        this.comboKeys.add(combo.key);
        this.money += combo.reward;
        this.reputation += combo.rep;
        this.showAchievement(`コンボ発見！\n「${combo.name}」\n賞金 ${combo.reward}万円`);
      }
    });
  }

  canLaunchStartup() {
    const cowork = this.cells.flat().find((cell) => cell.type === 'cowork');
    const bestIdea = Math.max(0, ...this.residents.map((resident) => resident.idea));
    return Boolean(cowork && cowork.visits >= 5 && bestIdea >= 22 && this.money >= 100 && this.startups.length === 0);
  }

  tryLaunchStartup() {
    if (this.startups.length > 0) {
      this.showToast('すでに団地ベンチャーが活動中です。');
      return;
    }
    if (!this.canLaunchStartup()) {
      this.showToast('条件：仕事部屋5回利用・アイデア22・資金100万円');
      return;
    }

    this.money -= 100;
    const hasShop = this.cells.flat().some((cell) => cell.type === 'shop');
    const startup = {
      name: hasShop ? 'まごころ団地デリバリー' : '空室ラボ',
      level: 1,
      xp: 0,
      income: 24,
    };
    this.startups.push(startup);
    this.reputation += 18;
    this.showAchievement(`団地ベンチャー誕生！\n「${startup.name}」\n空き部屋から世界を目指します。`);
    this.checkObjectives();
    this.refreshDynamicUi();
  }

  progressStartups(type) {
    if (type !== 'cowork' || this.startups.length === 0) return;
    const startup = this.startups[0];
    startup.xp += 1;
    if (startup.xp >= startup.level * 6 && startup.level < 3) {
      startup.level += 1;
      startup.income += 18;
      startup.xp = 0;
      this.reputation += 8;
      this.showAchievement(`${startup.name}\nレベル${startup.level}へ成長！\n周辺団地にも進出しました。`);
    }
  }

  nextMonth() {
    if (this.speed === 0 || this.eventOpen) return;
    this.month += 1;
    if (this.month > 12) {
      this.month = 1;
      this.year += 1;
      this.reputation += 3;
      this.bigNews(`${this.year}年目が始まりました。視察団がなぜか猫だけ撮影しています。`);
    }

    let rent = 0;
    let business = 0;
    let upkeep = 0;
    this.cells.flat().forEach((cell) => {
      if (cell.type === 'home') rent += 20 + cell.level * 4;
      const data = BUILDINGS[cell.type];
      if (data) {
        business += data.income * cell.level;
        upkeep += data.upkeep;
      }
    });
    const startupIncome = this.startups.reduce((sum, startup) => sum + startup.income, 0);
    const net = rent + business + startupIncome - upkeep;
    this.money += net;

    this.residents.forEach((resident) => {
      resident.needs.food = Math.max(0, resident.needs.food - Phaser.Math.Between(12, 20));
      resident.needs.fun = Math.max(0, resident.needs.fun - Phaser.Math.Between(10, 18));
      resident.needs.work = Math.max(0, resident.needs.work - Phaser.Math.Between(8, 16));
      this.recalculateHappiness(resident);
    });

    if (this.month % 3 === 0) this.time.delayedCall(500, () => this.showChoiceEvent());
    this.bigNews(`月次決算：家賃${rent} + 事業${business} + 起業${startupIncome} - 維持${upkeep} = ${net}万円`);
    this.floatTop(`+${net}万円`);
    this.checkObjectives();
    this.refreshDynamicUi();
  }

  showChoiceEvent() {
    if (this.eventOpen) return;
    const event = Phaser.Utils.Array.GetRandom(CHOICE_EVENTS);
    this.eventOpen = true;

    const overlay = this.add.container(0, 0).setDepth(200);
    overlay.add(this.add.rectangle(0, 0, 1024, 582, 0x152238, 0.72).setOrigin(0));
    overlay.add(this.add.rectangle(210, 135, 604, 280, 0xffefc7).setOrigin(0).setStrokeStyle(5, 0x26374b));
    overlay.add(this.add.text(238, 163, '団地会議', {
      fontFamily: 'monospace', fontSize: '17px', color: '#8b4e3f', fontStyle: 'bold',
    }));
    overlay.add(this.add.text(238, 198, event.title, {
      fontFamily: 'monospace', fontSize: '22px', color: '#26374b', fontStyle: 'bold',
    }));
    overlay.add(this.add.text(238, 239, event.body, {
      fontFamily: 'monospace', fontSize: '15px', color: '#3f4d5f', wordWrap: { width: 548 },
    }));

    event.options.forEach((option, index) => {
      const y = 296 + index * 58;
      const button = this.add.rectangle(238, y, 548, 44, 0xe4c963)
        .setOrigin(0).setStrokeStyle(3, 0x26374b).setInteractive({ useHandCursor: true });
      const text = this.add.text(512, y + 22, option.label, {
        fontFamily: 'monospace', fontSize: '15px', color: '#26374b', fontStyle: 'bold',
      }).setOrigin(0.5);
      overlay.add([button, text]);
      button.on('pointerdown', () => {
        option.apply(this);
        overlay.destroy(true);
        this.eventOpen = false;
        this.checkObjectives();
        this.refreshDynamicUi();
      });
    });
  }

  checkObjectives() {
    this.objectives.forEach((objective) => {
      if (objective.done || !objective.check()) return;
      objective.done = true;
      this.money += objective.reward;
      this.reputation += 5;
      this.showAchievement(`ミッション達成！\n${objective.label}\n報酬 ${objective.reward}万円`);
    });
    this.refreshObjectiveText();
  }

  refreshDynamicUi() {
    this.updateHud();
    this.refreshObjectiveText();
    this.refreshResidentPanel();
    this.refreshStartupPanel();
    this.refreshBuildButtons();
  }

  refreshObjectiveText() {
    if (!this.objectiveText) return;
    this.objectiveText.setText(this.objectives.map((objective) => {
      const mark = objective.done ? '完了' : '・';
      return `${mark} ${objective.label}  報酬${objective.reward}万`;
    }).join('\n'));
  }

  refreshResidentPanel() {
    if (!this.residentText) return;
    const resident = this.selectedResident || this.residents[0];
    if (!resident) return;
    const lowest = Object.entries(resident.needs).sort((a, b) => a[1] - b[1])[0];
    const needLabel = { food: '空腹', fun: '気分', work: '仕事' }[lowest[0]];
    this.residentText.setText(
      `${resident.name}　${resident.job}\n` +
      `性格：${resident.trait}\n` +
      `仕事力 ${resident.skill}　アイデア ${resident.idea}\n` +
      `満足 ${resident.happiness}%　${needLabel} ${lowest[1]}%\n` +
      `行動：${resident.state}`,
    );
  }

  refreshStartupPanel() {
    const ready = this.canLaunchStartup();
    this.startupButton.setFillStyle(ready ? 0xd8b64d : 0x6d7783);
    this.startupButtonText.setColor(ready ? '#26374b' : '#ffffff');
    this.startupButtonText.setText(ready ? '起業会議を開く  100万円' : '起業条件を育てよう');

    if (this.startups.length === 0) {
      const coworkVisits = this.visitCounts.cowork || 0;
      const bestIdea = Math.max(0, ...this.residents.map((resident) => resident.idea));
      this.startupText.setText(`団地ベンチャー：まだありません\n仕事部屋 ${coworkVisits}/5回　最高アイデア ${bestIdea}/22`);
    } else {
      const startup = this.startups[0];
      this.startupText.setText(`${startup.name}　Lv.${startup.level}\n月収 ${startup.income}万円　成長 ${startup.xp}/${startup.level * 6}`);
    }
  }

  refreshBuildButtons() {
    this.buildButtons.forEach((ui, key) => {
      const data = BUILDINGS[key];
      const locked = this.reputation < data.unlock;
      const selected = this.selected === key;
      ui.button.setFillStyle(locked ? 0x888d91 : selected ? 0xf0ce67 : 0xf7e9bd);
      ui.title.setColor(locked ? '#4f5358' : '#263449');
      ui.info.setText(locked ? `評判${data.unlock}で解放` : `${data.cost}万円`);
      ui.lock.setText(selected && !locked ? '選択中' : '');
    });
  }

  updateHud() {
    if (!this.statsText) return;
    const happiness = this.getAverageHappiness();
    this.statsText.setText(
      `資金 ${this.money}万円　住民 ${this.residents.length}人　満足 ${happiness}%\n` +
      `${this.year}年目 ${this.month}月　評判 ${this.reputation}　コンボ ${this.comboKeys.size}`,
    );
  }

  setSpeed(speed) {
    this.speed = speed;
    this.time.timeScale = speed === 0 ? 0.0001 : speed;
    this.children.list.filter((child) => child.type === 'Rectangle' && child.getData('speed') !== undefined)
      .forEach((button) => button.setFillStyle(button.getData('speed') === speed ? 0xf0ce67 : 0x43566f));
    this.showToast(speed === 0 ? '時間を止めました。じっくり配置できます。' : `${speed}倍速で進行します。`);
  }

  recalculateHappiness(resident) {
    const average = Math.round((resident.needs.food + resident.needs.fun + resident.needs.work) / 3);
    resident.happiness = Phaser.Math.Clamp(Math.round(resident.happiness * 0.45 + average * 0.55), 0, 100);
  }

  getAverageHappiness() {
    if (this.residents.length === 0) return 0;
    return Math.round(this.residents.reduce((sum, resident) => sum + resident.happiness, 0) / this.residents.length);
  }

  getResidentComment(resident) {
    const lowest = Object.entries(resident.needs).sort((a, b) => a[1] - b[1])[0][0];
    if (lowest === 'food') return '惣菜の匂いだけで、ご飯が食べられそうです。';
    if (lowest === 'fun') return '公園にベンチがもう一つ欲しいですね。';
    return resident.idea >= 22 ? 'この団地、商売になる気がします。' : '仕事場があると助かるんですが。';
  }

  changeAllHappiness(amount) {
    this.residents.forEach((resident) => {
      resident.happiness = Phaser.Math.Clamp(resident.happiness + amount, 0, 100);
      Object.keys(resident.needs).forEach((key) => {
        resident.needs[key] = Phaser.Math.Clamp(resident.needs[key] + Math.round(amount / 2), 0, 100);
      });
    });
  }

  levelRandomFacility(type, xp) {
    const targets = this.cells.flat().filter((cell) => cell.type === type);
    if (!targets.length) return;
    const cell = Phaser.Utils.Array.GetRandom(targets);
    cell.xp += xp;
    this.tryLevelFacility(cell);
  }

  showResidentBubble(resident, text) {
    if (resident.bubble) resident.bubble.destroy();
    resident.bubble = this.add.text(resident.sprite.x, resident.sprite.y - 20, text, {
      fontFamily: 'monospace', fontSize: '11px', color: '#26374b', backgroundColor: '#fff4d0',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({
      targets: resident.bubble, y: resident.bubble.y - 8, alpha: 0, duration: 1000,
      onComplete: () => { resident.bubble?.destroy(); resident.bubble = null; },
    });
  }

  floatValue(cell, text) {
    const label = this.add.text(MAP_X + cell.x * TILE + 16, MAP_Y + cell.y * TILE + 2, text, {
      fontFamily: 'monospace', fontSize: '12px', color: '#fff4a8', backgroundColor: '#33445a',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: label, y: label.y - 20, alpha: 0, duration: 850, onComplete: () => label.destroy() });
  }

  floatTop(text) {
    const label = this.add.text(790, 58, text, {
      fontFamily: 'monospace', fontSize: '17px', color: '#fff0a0', fontStyle: 'bold',
    }).setDepth(95);
    this.tweens.add({ targets: label, y: 30, alpha: 0, duration: 950, onComplete: () => label.destroy() });
  }

  makeSparkles(x, y) {
    for (let i = 0; i < 7; i += 1) {
      const dot = this.add.rectangle(x, y, 4, 4, i % 2 ? 0xffec8a : 0xffffff).setDepth(90);
      const angle = (Math.PI * 2 * i) / 7;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * Phaser.Math.Between(18, 34),
        y: y + Math.sin(angle) * Phaser.Math.Between(18, 34),
        alpha: 0,
        duration: 520,
        onComplete: () => dot.destroy(),
      });
    }
  }

  bigNews(message) {
    if (!this.newsText) return;
    this.newsText.setText(`団地ニュース：${message}`);
    this.tweens.add({ targets: [this.newsBox, this.newsText], alpha: { from: 0.35, to: 1 }, duration: 240 });
  }

  showToast(message) {
    if (this.toast) this.toast.destroy();
    this.toast = this.add.text(306, 416, message, {
      fontFamily: 'monospace', fontSize: '14px', color: '#fffbe6', backgroundColor: '#26374b',
      padding: { x: 10, y: 6 }, wordWrap: { width: 510 },
    }).setOrigin(0.5).setDepth(120);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 350, onComplete: () => this.toast?.destroy() });
  }

  showAchievement(message) {
    const panel = this.add.container(0, 0).setDepth(170);
    const box = this.add.rectangle(512, 270, 470, 150, 0xffedb3).setStrokeStyle(5, 0x8b5a3c);
    const text = this.add.text(512, 270, message, {
      fontFamily: 'monospace', fontSize: '18px', color: '#26374b', align: 'center', lineSpacing: 7, fontStyle: 'bold',
    }).setOrigin(0.5);
    panel.add([box, text]);
    panel.setScale(0.6).setAlpha(0);
    this.tweens.add({
      targets: panel, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out',
      onComplete: () => this.time.delayedCall(1600, () => this.tweens.add({ targets: panel, alpha: 0, duration: 250, onComplete: () => panel.destroy(true) })),
    });
  }

  update(_time, delta) {
    if (this.speed === 0) return;
    const dt = delta / 1000;
    this.residents.forEach((resident) => {
      if (!resident.target) return;
      const sprite = resident.sprite;
      const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, resident.target.x, resident.target.y);
      if (distance < 3) {
        resident.target = null;
        this.arriveResident(resident);
        return;
      }
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, resident.target.x, resident.target.y);
      sprite.x += Math.cos(angle) * resident.speed * dt;
      sprite.y += Math.sin(angle) * resident.speed * dt;
      sprite.flipX = Math.cos(angle) < 0;
      sprite.setAngle(Math.sin(sprite.x * 0.16) * 2);
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1024,
  height: 582,
  backgroundColor: '#6fa85b',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [DanchiScene],
};

new Phaser.Game(config);
