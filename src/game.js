/* global Phaser */

const TILE = 32;
const COLS = 18;
const ROWS = 11;
const MAP_X = 24;
const MAP_Y = 74;

const BUILDINGS = {
  repair: { label: '団地改修', cost: 150, texture: 'danchi-new', rent: 18, icon: '🏢' },
  shop: { label: 'お惣菜屋', cost: 100, texture: 'shop', rent: 10, icon: '🍱' },
  cowork: { label: '仕事部屋', cost: 180, texture: 'cowork', rent: 16, icon: '💻' },
  park: { label: 'ミニ公園', cost: 80, texture: 'park', rent: 4, icon: '🌳' },
};

const EVENT_LINES = [
  '団地猫が会議に出席しました。議決権はありません。',
  'おばあちゃんの煮物動画が、なぜか海外で話題です。',
  '元大工の住民が、壊れたベンチを勝手に直しました。',
  '商店街で「長すぎるソフトクリーム」が発売されました。',
  'バスを待つ列が、自然発生的な朝市になりました。',
  '空き部屋からベンチャーが誕生しました。社名はまだ未定です。',
];

class DanchiScene extends Phaser.Scene {
  constructor() {
    super('DanchiScene');
    this.money = 520;
    this.population = 12;
    this.month = 1;
    this.rank = 1;
    this.selected = 'repair';
    this.cells = [];
    this.residents = [];
    this.comboKeys = new Set();
  }

  create() {
    this.cameras.main.setBackgroundColor('#80b966');
    this.createTextures();
    this.createMap();
    this.createInitialTown();
    this.createResidents(8);
    this.createHud();
    this.createBuildMenu();
    this.createEventPanel();
    this.setupInput();

    this.time.addEvent({ delay: 4500, loop: true, callback: () => this.nextMonth() });
    this.time.addEvent({ delay: 7200, loop: true, callback: () => this.showRandomEvent() });

    this.showToast('空室だらけの団地を、もう一度にぎやかにしよう！');
  }

  createTextures() {
    const make = (key, draw) => {
      const g = this.add.graphics();
      draw(g);
      g.generateTexture(key, TILE, TILE);
      g.destroy();
    };

    make('grass', (g) => {
      g.fillStyle(0x84be68).fillRect(0, 0, 32, 32);
      g.fillStyle(0x78ae5f).fillRect(3, 5, 2, 2).fillRect(22, 12, 2, 2).fillRect(12, 27, 2, 2);
    });

    make('road', (g) => {
      g.fillStyle(0x7a7c82).fillRect(0, 0, 32, 32);
      g.fillStyle(0x696b70).fillRect(0, 0, 32, 3).fillRect(0, 29, 32, 3);
      g.fillStyle(0xe9d989).fillRect(3, 15, 8, 2).fillRect(20, 15, 8, 2);
    });

    make('empty', (g) => {
      g.fillStyle(0x91c875).fillRect(0, 0, 32, 32);
      g.lineStyle(1, 0x6aa052, 0.6).strokeRect(1, 1, 30, 30);
    });

    make('danchi-old', (g) => {
      g.fillStyle(0xb7b0a2).fillRect(3, 5, 26, 24);
      g.fillStyle(0x77716b).fillRect(3, 5, 26, 4);
      g.fillStyle(0x59606a).fillRect(7, 12, 5, 5).fillRect(19, 12, 5, 5).fillRect(7, 21, 5, 5).fillRect(19, 21, 5, 5);
      g.fillStyle(0x8b4e45).fillRect(14, 19, 4, 10);
      g.fillStyle(0x64615e).fillRect(26, 8, 2, 18);
    });

    make('danchi-new', (g) => {
      g.fillStyle(0xf0dfb6).fillRect(3, 4, 26, 25);
      g.fillStyle(0x527f8f).fillRect(3, 4, 26, 4);
      g.fillStyle(0x83c5d5).fillRect(7, 11, 6, 5).fillRect(19, 11, 6, 5).fillRect(7, 20, 6, 5).fillRect(19, 20, 6, 5);
      g.fillStyle(0xd56c4f).fillRect(14, 19, 4, 10);
      g.fillStyle(0x6da55b).fillRect(1, 27, 30, 3);
    });

    make('shop', (g) => {
      g.fillStyle(0xf6e0ad).fillRect(3, 10, 26, 19);
      g.fillStyle(0xd75d55).fillRect(2, 7, 28, 7);
      g.fillStyle(0xfff2c8).fillRect(5, 8, 5, 6).fillRect(15, 8, 5, 6).fillRect(25, 8, 3, 6);
      g.fillStyle(0x6c4538).fillRect(6, 18, 8, 11);
      g.fillStyle(0x7fc0ce).fillRect(18, 18, 8, 7);
    });

    make('cowork', (g) => {
      g.fillStyle(0xdad7f3).fillRect(3, 7, 26, 22);
      g.fillStyle(0x55507f).fillRect(3, 7, 26, 5);
      g.fillStyle(0x78b6d4).fillRect(7, 15, 18, 8);
      g.fillStyle(0x43405b).fillRect(14, 23, 4, 6);
      g.fillStyle(0xf2d65c).fillRect(24, 4, 4, 4);
    });

    make('park', (g) => {
      g.fillStyle(0x8bc86f).fillRect(0, 0, 32, 32);
      g.fillStyle(0x7b4d2b).fillRect(9, 16, 4, 12).fillRect(22, 18, 3, 10);
      g.fillStyle(0x3e9851).fillCircle(11, 12, 8).fillCircle(23, 14, 6);
      g.fillStyle(0xe8c66b).fillRect(16, 24, 10, 3);
    });

    const residentColors = [0xe66c5c, 0x4f8ac9, 0xf0b84d, 0x7c65b8, 0x4aa36b];
    residentColors.forEach((color, index) => {
      make(`resident-${index}`, (g) => {
        g.fillStyle(0xf0c49a).fillRect(11, 5, 10, 9);
        g.fillStyle(color).fillRect(9, 14, 14, 11);
        g.fillStyle(0x343b48).fillRect(10, 25, 5, 5).fillRect(18, 25, 5, 5);
        g.fillStyle(0x2e3035).fillRect(12, 8, 2, 2).fillRect(18, 8, 2, 2);
        g.fillStyle(0x2e3035).fillRect(14, 12, 4, 1);
      });
    });
  }

  createMap() {
    for (let y = 0; y < ROWS; y += 1) {
      this.cells[y] = [];
      for (let x = 0; x < COLS; x += 1) {
        const isRoad = y === 5 || x === 8;
        const texture = isRoad ? 'road' : 'empty';
        const sprite = this.add.image(MAP_X + x * TILE, MAP_Y + y * TILE, texture).setOrigin(0);
        sprite.setInteractive({ useHandCursor: !isRoad });
        const cell = { x, y, type: isRoad ? 'road' : 'empty', sprite };
        sprite.setData('cell', cell);
        this.cells[y][x] = cell;
      }
    }
  }

  createInitialTown() {
    this.placeInitial(2, 2, 'danchi-old', 'old');
    this.placeInitial(4, 2, 'danchi-old', 'old');
    this.placeInitial(2, 7, 'danchi-old', 'old');
    this.placeInitial(11, 2, 'shop', 'shop');
    this.placeInitial(11, 7, 'park', 'park');
  }

  placeInitial(x, y, texture, type) {
    const cell = this.cells[y][x];
    cell.type = type;
    cell.sprite.setTexture(texture);
  }

  createResidents(count) {
    for (let i = 0; i < count; i += 1) {
      const sprite = this.add.image(MAP_X + (2 + i % 4) * TILE + 16, MAP_Y + (4 + Math.floor(i / 4)) * TILE + 16, `resident-${i % 5}`);
      sprite.setDepth(20);
      sprite.setScale(0.72);
      const resident = { sprite, target: null, speed: 20 + Math.random() * 12, mood: 50 + Math.floor(Math.random() * 31) };
      this.residents.push(resident);
      this.chooseResidentTarget(resident);
    }
  }

  chooseResidentTarget(resident) {
    const walkable = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (this.cells[y][x].type === 'road') walkable.push(this.cells[y][x]);
      }
    }
    const cell = Phaser.Utils.Array.GetRandom(walkable);
    resident.target = new Phaser.Math.Vector2(MAP_X + cell.x * TILE + 16, MAP_Y + cell.y * TILE + 16);
  }

  createHud() {
    this.add.rectangle(0, 0, 960, 62, 0x223247).setOrigin(0).setDepth(50);
    this.titleText = this.add.text(18, 13, '団地再生ものがたり', {
      fontFamily: 'monospace', fontSize: '22px', color: '#fff4cf', fontStyle: 'bold',
    }).setDepth(51);

    this.statsText = this.add.text(430, 12, '', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', align: 'right',
    }).setDepth(51);
    this.updateHud();
  }

  createBuildMenu() {
    const y = 464;
    this.add.rectangle(0, y - 10, 960, 86, 0x25364a, 0.96).setOrigin(0).setDepth(50);

    Object.entries(BUILDINGS).forEach(([key, data], index) => {
      const x = 28 + index * 174;
      const button = this.add.rectangle(x, y, 160, 56, key === this.selected ? 0xf1cd63 : 0xf7e9bd)
        .setOrigin(0)
        .setStrokeStyle(3, 0x172436)
        .setInteractive({ useHandCursor: true })
        .setDepth(51);
      button.setData('key', key);

      this.add.text(x + 9, y + 7, `${data.icon} ${data.label}`, {
        fontFamily: 'monospace', fontSize: '15px', color: '#263449', fontStyle: 'bold',
      }).setDepth(52);
      this.add.text(x + 10, y + 32, `${data.cost}万円`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#7b4e2f',
      }).setDepth(52);

      button.on('pointerdown', () => {
        this.selected = key;
        this.children.list.filter((child) => child.type === 'Rectangle' && child.getData('key'))
          .forEach((item) => item.setFillStyle(item.getData('key') === key ? 0xf1cd63 : 0xf7e9bd));
        this.showToast(`${data.label}を選択中。空きマスをクリック！`);
      });
    });
  }

  createEventPanel() {
    this.eventBox = this.add.rectangle(612, 78, 326, 66, 0xfff4cf, 0.96)
      .setOrigin(0)
      .setStrokeStyle(3, 0x26374b)
      .setDepth(45);
    this.eventText = this.add.text(626, 90, '団地ニュース：本日もだいたい平和です。', {
      fontFamily: 'monospace', fontSize: '14px', color: '#263449', wordWrap: { width: 298 },
    }).setDepth(46);
  }

  setupInput() {
    this.input.on('gameobjectdown', (_pointer, object) => {
      const cell = object.getData('cell');
      if (!cell || cell.type === 'road') return;
      this.tryBuild(cell);
    });
  }

  tryBuild(cell) {
    const build = BUILDINGS[this.selected];

    if (cell.type === 'old' && this.selected !== 'repair') {
      this.showToast('古い団地は、まず改修しないと使えません。');
      return;
    }

    if (cell.type !== 'empty' && !(cell.type === 'old' && this.selected === 'repair')) {
      this.showToast('ここには、もう何かあります。');
      return;
    }

    if (this.money < build.cost) {
      this.showToast('資金不足！自治会長が渋い顔をしています。');
      return;
    }

    this.money -= build.cost;
    cell.type = this.selected;
    cell.sprite.setTexture(build.texture).setScale(0.2);
    this.tweens.add({ targets: cell.sprite, scale: 1, duration: 360, ease: 'Back.Out' });

    if (this.selected === 'repair') {
      this.population += 4;
      this.createResidents(1);
    }

    this.updateHud();
    this.checkCombos(cell.x, cell.y);
    this.showToast(`${build.label}が完成！`);
  }

  checkCombos(x, y) {
    const nearby = new Set();
    for (let oy = -2; oy <= 2; oy += 1) {
      for (let ox = -2; ox <= 2; ox += 1) {
        const cell = this.cells[y + oy]?.[x + ox];
        if (cell) nearby.add(cell.type);
      }
    }

    const combos = [
      { key: 'life', needs: ['repair', 'shop', 'park'], name: 'ほのぼの生活街区', reward: 120 },
      { key: 'startup', needs: ['repair', 'cowork', 'shop'], name: '団地ベンチャー横丁', reward: 180 },
      { key: 'worklife', needs: ['cowork', 'park', 'shop'], name: '令和の職住近接', reward: 150 },
    ];

    combos.forEach((combo) => {
      if (this.comboKeys.has(combo.key)) return;
      if (combo.needs.every((need) => nearby.has(need))) {
        this.comboKeys.add(combo.key);
        this.money += combo.reward;
        this.rank += 1;
        this.showEvent(`🎉 コンボ発見！「${combo.name}」\nまちおこし賞金 ${combo.reward}万円！`);
        this.updateHud();
      }
    });
  }

  nextMonth() {
    this.month += 1;
    const buildings = this.cells.flat().filter((cell) => BUILDINGS[cell.type]);
    const income = buildings.reduce((sum, cell) => sum + BUILDINGS[cell.type].rent, 0) + this.population;
    this.money += income;

    if (this.month > 12) {
      this.month = 1;
      this.rank += 1;
      this.showEvent(`新しい年になりました！\n団地ランクが ${this.rank} にアップ。`);
    }

    this.updateHud();
    this.floatMoney(`+${income}万円`);
  }

  showRandomEvent() {
    const line = Phaser.Utils.Array.GetRandom(EVENT_LINES);
    this.showEvent(`団地ニュース\n${line}`);
    this.money += 20;
    this.updateHud();
  }

  showEvent(message) {
    this.eventText.setText(message);
    this.tweens.add({ targets: [this.eventBox, this.eventText], alpha: { from: 0.25, to: 1 }, duration: 240 });
  }

  showToast(message) {
    if (this.toast) this.toast.destroy();
    this.toast = this.add.text(480, 432, message, {
      fontFamily: 'monospace', fontSize: '15px', color: '#fffbe6', backgroundColor: '#26374b',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1700, duration: 350, onComplete: () => this.toast?.destroy() });
  }

  floatMoney(text) {
    const label = this.add.text(820, 56, text, {
      fontFamily: 'monospace', fontSize: '17px', color: '#fff1a8', fontStyle: 'bold',
    }).setDepth(80);
    this.tweens.add({ targets: label, y: 30, alpha: 0, duration: 900, onComplete: () => label.destroy() });
  }

  updateHud() {
    if (!this.statsText) return;
    this.statsText.setText(`所持金 ${this.money}万円   住民 ${this.population}人\n${this.rank}年目 ${this.month}月   団地ランク ${this.rank}`);
  }

  update(_time, delta) {
    const dt = delta / 1000;
    this.residents.forEach((resident) => {
      if (!resident.target) return;
      const sprite = resident.sprite;
      const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, resident.target.x, resident.target.y);
      if (distance < 3) {
        this.chooseResidentTarget(resident);
        if (Math.random() < 0.2) {
          sprite.setAngle(Phaser.Math.Between(-4, 4));
        }
        return;
      }
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, resident.target.x, resident.target.y);
      sprite.x += Math.cos(angle) * resident.speed * dt;
      sprite.y += Math.sin(angle) * resident.speed * dt;
      sprite.flipX = Math.cos(angle) < 0;
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#80b966',
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
