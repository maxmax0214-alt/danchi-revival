/* global Phaser */

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const FLOORS = 4;
const ROOMS_PER_FLOOR = 6;
const ROOM_W = 56;
const ROOM_H = 34;
const ROOM_GAP_X = 3;
const ROOM_GAP_Y = 5;
const BUILDING_W = 420;
const BUILDING_H = 220;
const PANEL_X = 908;
const PANEL_W = 354;

const BUILDING_LAYOUTS = [
  { id: 'A', name: 'A棟 ひまわり', x: 18, y: 76, occupied: 14, accent: 0xd76b55 },
  { id: 'B', name: 'B棟 あおぞら', x: 456, y: 76, occupied: 11, accent: 0x4d83a8 },
  { id: 'C', name: 'C棟 けやき', x: 18, y: 314, occupied: 9, accent: 0x5f9461 },
  { id: 'D', name: 'D棟 ゆうやけ', x: 456, y: 314, occupied: 8, accent: 0xc7834d },
];

const ROOM_TYPES = {
  vacant: { label: '空き室', color: 0x46515c, text: '#d9e0e3' },
  occupied: { label: '住居', color: 0xf1d49b, text: '#3d3b35' },
  work: { label: '仕事部屋', color: 0xcbd2f2, text: '#313b68' },
  nursery: { label: '保育室', color: 0xf4c8c4, text: '#6e3535' },
  deli: { label: '惣菜工房', color: 0xf2c66f, text: '#62431e' },
  clinic: { label: '診療室', color: 0xcce8d6, text: '#285d42' },
  common: { label: '交流室', color: 0xd5e2b9, text: '#3f5f2c' },
  startup: { label: '団地ベンチャー', color: 0x9ed8d4, text: '#174d50' },
};

const TOOLS = {
  inspect: { label: '見る', cost: 0, type: null, description: '部屋や住民の状態を確認します。' },
  home: { label: '住居改修', cost: 55, type: 'occupied', description: '空き室を住居へ改修し、入居希望者を迎えます。' },
  work: { label: '仕事部屋', cost: 90, type: 'work', description: '住民の仕事力とアイデアを育てます。' },
  nursery: { label: '保育室', cost: 110, type: 'nursery', description: '子育て世帯の満足度と入居人気を上げます。' },
  deli: { label: '惣菜工房', cost: 80, type: 'deli', description: '食生活を支え、棟内消費を生みます。' },
  clinic: { label: '診療室', cost: 135, type: 'clinic', unlock: 18, description: '評判18で解放。高齢世帯の安心を支えます。' },
  common: { label: '交流室', cost: 60, type: 'common', description: '孤立を防ぎ、住民同士の交流を増やします。' },
  clear: { label: '空室に戻す', cost: 20, type: 'vacant', description: '施設を撤去して空き室へ戻します。' },
};

const NEED_LABELS = {
  work: '仕事',
  family: '子育て',
  food: '食事',
  health: '健康',
  community: '交流',
};

const NEED_FACILITIES = {
  work: ['work', 'startup'],
  family: ['nursery', 'common'],
  food: ['deli'],
  health: ['clinic', 'common'],
  community: ['common', 'deli'],
};

const SURNAMES = ['山田', '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '中村', '小林', '加藤', '吉田', '山本', '松本', '井上', '木村', '林', '清水', '森', '阿部', '池田'];
const GIVEN_NAMES = ['ヨシオ', 'ミライ', 'マサコ', 'レン', 'ハル', 'タマオ', 'アカリ', 'ソウタ', 'ナオ', 'ユキ', 'ケンジ', 'ミホ', 'ユウ', 'サクラ', 'トオル', 'ナナ', 'リク', 'フミ', 'カイ', 'ヒナ'];
const JOBS = ['元電気工', '動画編集者', '会社員', '保育士', '配送員', '料理人', 'プログラマー', '看護師', '清掃スタッフ', '大学生', '個人商店主', '介護職', 'デザイナー', '年金生活', '在宅勤務'];
const TRAITS = ['世話好き', '夜型', '話が長い', '行動派', 'お祭り好き', '少し人見知り', '新しい物好き', '節約上手', '猫に好かれる', '朝が早い'];
const HOUSEHOLDS = [
  { label: '単身世帯', size: 1 },
  { label: 'シニア夫婦', size: 2 },
  { label: '子育て世帯', size: 3 },
  { label: '共働き世帯', size: 2 },
  { label: 'クリエイター世帯', size: 1 },
  { label: '三世代世帯', size: 4 },
];

const COMBO_DEFS = [
  { key: 'work-nursery', name: '子連れワークフロア', needs: ['work', 'nursery'], reward: 120, reputation: 6 },
  { key: 'deli-common', name: 'お茶の間横丁', needs: ['deli', 'common'], reward: 100, reputation: 5 },
  { key: 'clinic-common', name: '見守りステーション', needs: ['clinic', 'common'], reward: 150, reputation: 7 },
  { key: 'work-deli', name: '夜更かし起業横丁', needs: ['work', 'deli'], reward: 130, reputation: 6 },
];

const CHOICE_EVENTS = [
  {
    title: '空き室見学会を開きます',
    body: 'どんな人に向けて宣伝しましょう？',
    choices: [
      { label: '子育て世帯向け  -35万円', action: (scene) => scene.addApplicants(3, 'family', -35, 4, 'ベビーカーの下見隊が到着しました。') },
      { label: '若手起業家向け  -25万円', action: (scene) => scene.addApplicants(2, 'work', -25, 5, '名刺だけ立派な若手が集まりました。') },
    ],
  },
  {
    title: '自治会長が屋上活用を提案',
    body: '使われていない屋上をどうしますか？',
    choices: [
      { label: '屋上菜園  -30万円', action: (scene) => scene.applyEventResult(-30, 5, 4, '巨大なキュウリが団地名物になりました。') },
      { label: '夕涼み広場  -20万円', action: (scene) => scene.applyEventResult(-20, 3, 6, '毎晩、誰かが将棋を始める屋上になりました。') },
    ],
  },
];

class DanchiScene extends Phaser.Scene {
  constructor() {
    super('DanchiScene');
    this.money = 720;
    this.year = 1;
    this.month = 1;
    this.reputation = 6;
    this.speed = 1;
    this.selectedTool = 'inspect';
    this.selectedRoom = null;
    this.rooms = [];
    this.buildings = [];
    this.residents = [];
    this.applicants = [];
    this.walkers = [];
    this.toolButtons = new Map();
    this.comboKeys = new Set();
    this.assignmentCount = 0;
    this.startups = 0;
    this.residentSequence = 0;
    this.eventOpen = false;
    this.lastMonthlyNet = 0;
    this.missions = [
      { label: '空き室を3室再生', reward: 120, complete: false, check: () => this.assignmentCount >= 3 },
      { label: '部屋コンボを1つ発見', reward: 160, complete: false, check: () => this.comboKeys.size >= 1 },
      { label: '入居世帯を48世帯にする', reward: 220, complete: false, check: () => this.getOccupiedCount() >= 48 },
      { label: '平均満足度を70以上にする', reward: 260, complete: false, check: () => this.getAverageHappiness() >= 70 },
      { label: '団地ベンチャーを誕生させる', reward: 300, complete: false, check: () => this.startups >= 1 },
    ];
  }

  create() {
    this.createBackground();
    this.createWalkerTextures();
    this.createBuildingsAndRooms();
    this.seedInitialPopulation();
    this.createHud();
    this.createRightPanel();
    this.createToolMenu();
    this.createWalkers();
    this.refreshAll();
    this.selectRoom(this.buildings[0].rooms.find((room) => room.type === 'vacant'));

    this.monthTimer = this.time.addEvent({ delay: 7600, loop: true, callback: () => this.nextMonth() });
    this.ambientTimer = this.time.addEvent({ delay: 2800, loop: true, callback: () => this.playAmbientMoment() });

    this.announce('4棟96室。住民42世帯と空き室52室から再生を始めます。');
    this.showToast('空き室を選び、下のメニューから用途を割り当ててください。');
  }

  createBackground() {
    const g = this.add.graphics().setDepth(-20);
    g.fillStyle(0x9fcfd0).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0xe6cf87).fillCircle(1050, 116, 42);
    g.fillStyle(0xdce8d2).fillEllipse(160, 72, 210, 48).fillEllipse(720, 64, 160, 38);
    g.fillStyle(0x6fa36b).fillRect(0, 58, 908, 510);
    g.fillStyle(0x729a68).fillTriangle(0, 132, 210, 58, 430, 132).fillTriangle(430, 132, 650, 66, 908, 132);
    g.fillStyle(0xb7aa86).fillRect(0, 300, 908, 15).fillRect(438, 58, 15, 510);
    g.fillStyle(0x8d8b82).fillRect(0, 546, 908, 18);
    g.fillStyle(0xe3d69d).fillRect(0, 564, 908, 156);

    for (let x = 28; x < 895; x += 72) {
      g.fillStyle(0x477a4f).fillCircle(x, 305, 9);
      g.fillStyle(0x6e4f32).fillRect(x - 2, 309, 4, 10);
    }

    g.fillStyle(0x3a6e4b).fillCircle(430, 300, 11).fillCircle(465, 300, 11);
    g.fillStyle(0xf3e0b4).fillRect(423, 294, 50, 5);
  }

  createWalkerTextures() {
    const colors = [0xd76555, 0x4e82aa, 0xe0a541, 0x6c63a7, 0x4e9a69, 0xc47a4a, 0x47969a, 0x8c644c];
    colors.forEach((color, index) => {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.18).fillEllipse(8, 22, 12, 3);
      g.fillStyle(0xf0c39b).fillRect(5, 4, 7, 7);
      g.fillStyle(0x3b342f).fillRect(4, 2, 9, 4);
      g.fillStyle(color).fillRect(4, 11, 9, 8);
      g.fillStyle(0x303843).fillRect(4, 19, 4, 4).fillRect(10, 19, 4, 4);
      g.fillStyle(0x2d3035).fillRect(7, 6, 1, 1).fillRect(10, 6, 1, 1);
      g.generateTexture(`walker-${index}`, 18, 25);
      g.destroy();
    });
  }

  createBuildingsAndRooms() {
    BUILDING_LAYOUTS.forEach((layout) => {
      const building = {
        ...layout,
        rooms: [],
        comboNames: [],
        monthlyIncome: 0,
      };
      this.drawBuildingShell(building);
      this.createBuildingRooms(building);
      this.buildings.push(building);
    });
  }

  drawBuildingShell(building) {
    const { x, y } = building;
    const shell = this.add.graphics().setDepth(2);
    shell.fillStyle(0x35404a, 0.24).fillRect(x + 8, y + 9, BUILDING_W, BUILDING_H);
    shell.fillStyle(0xd8d2c2).fillRect(x, y + 22, BUILDING_W, BUILDING_H - 22);
    shell.fillStyle(0xb9b4a8).fillRect(x, y + 22, BUILDING_W, 7);
    shell.fillStyle(0x767a78).fillRect(x + 7, y + 15, BUILDING_W - 14, 8);
    shell.fillStyle(building.accent).fillRect(x + 12, y + 28, 36, BUILDING_H - 43);
    shell.fillStyle(0x646967).fillRect(x + 20, y + 50, 20, 135);
    shell.fillStyle(0xa3a49d).fillRect(x + 24, y + 57, 12, 18).fillRect(x + 24, y + 91, 12, 18).fillRect(x + 24, y + 125, 12, 18).fillRect(x + 24, y + 159, 12, 18);
    shell.fillStyle(0x8b8b83).fillRect(x + 4, y + BUILDING_H - 14, BUILDING_W - 8, 14);
    shell.fillStyle(0x6f6758).fillRect(x + BUILDING_W - 12, y + 42, 5, 145);
    shell.fillStyle(0xb5b09f).fillRect(x + 94, y + 7, 74, 12).fillRect(x + 255, y + 8, 52, 11);
    shell.fillStyle(0x73766f).fillRect(x + 120, y, 18, 8).fillRect(x + 274, y + 1, 12, 8);
    shell.lineStyle(2, 0x8b877d).lineBetween(x + 129, y, x + 150, y - 11).lineBetween(x + 280, y + 1, x + 294, y - 8);

    building.titleText = this.add.text(x + 16, y + 31, building.name, {
      fontFamily: 'monospace', fontSize: '13px', color: '#fff7db', fontStyle: 'bold',
    }).setDepth(5).setAngle(-90).setOrigin(1, 0);

    building.statsText = this.add.text(x + 54, y + BUILDING_H - 12, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#384148', fontStyle: 'bold',
    }).setDepth(6);

    building.comboText = this.add.text(x + BUILDING_W - 10, y + BUILDING_H - 12, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#7c4d31',
    }).setOrigin(1, 0).setDepth(6);
  }

  createBuildingRooms(building) {
    const gridX = building.x + 54;
    const gridY = building.y + 35;

    for (let floor = FLOORS; floor >= 1; floor -= 1) {
      const visualRow = FLOORS - floor;
      for (let column = 0; column < ROOMS_PER_FLOOR; column += 1) {
        const roomNumber = floor * 100 + column + 1;
        const room = {
          id: `${building.id}-${roomNumber}`,
          building,
          floor,
          column,
          number: roomNumber,
          type: 'vacant',
          resident: null,
          level: 1,
          experience: 0,
          lastUsers: 0,
          lastIncome: 0,
          startupName: null,
          x: gridX + column * (ROOM_W + ROOM_GAP_X) + ROOM_W / 2,
          y: gridY + visualRow * (ROOM_H + ROOM_GAP_Y) + ROOM_H / 2,
        };

        room.container = this.add.container(room.x, room.y).setDepth(10);
        room.container.setSize(ROOM_W, ROOM_H);
        room.container.setInteractive(
          new Phaser.Geom.Rectangle(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H),
          Phaser.Geom.Rectangle.Contains,
        );
        room.container.on('pointerdown', () => this.handleRoomClick(room));
        room.container.on('pointerover', () => this.setRoomHover(room, true));
        room.container.on('pointerout', () => this.setRoomHover(room, false));

        building.rooms.push(room);
        this.rooms.push(room);
        this.renderRoom(room);
      }
    }
  }

  seedInitialPopulation() {
    const occupancyOrder = [0, 1, 2, 6, 7, 8, 12, 13, 18, 19, 3, 9, 14, 20, 4, 10, 15, 21, 5, 11, 16, 22, 17, 23];

    this.buildings.forEach((building) => {
      if (building.id === 'A') this.assignFacilityDirect(building.rooms[5], 'common', 1);
      if (building.id === 'B') this.assignFacilityDirect(building.rooms[11], 'deli', 1);

      let filled = 0;
      occupancyOrder.forEach((roomIndex) => {
        if (filled >= building.occupied) return;
        const room = building.rooms[roomIndex];
        if (room.type !== 'vacant') return;
        const resident = this.generateResident(building.id, false);
        room.type = 'occupied';
        room.resident = resident;
        resident.room = room;
        this.residents.push(resident);
        filled += 1;
        this.renderRoom(room);
      });
    });

    for (let i = 0; i < 6; i += 1) this.applicants.push(this.generateResident(null, true));
  }

  generateResident(preferredBuilding = null, applicant = false, forcedNeed = null) {
    const index = this.residentSequence;
    this.residentSequence += 1;
    const household = HOUSEHOLDS[index % HOUSEHOLDS.length];
    let need = forcedNeed || ['work', 'family', 'food', 'health', 'community'][index % 5];
    if (household.label === '子育て世帯') need = 'family';
    if (household.label === 'シニア夫婦') need = index % 2 === 0 ? 'health' : 'community';

    return {
      id: `resident-${index}`,
      name: `${SURNAMES[index % SURNAMES.length]} ${GIVEN_NAMES[(index * 3 + 2) % GIVEN_NAMES.length]}`,
      household: household.label,
      size: household.size,
      job: JOBS[(index * 2 + 1) % JOBS.length],
      trait: TRAITS[(index * 3) % TRAITS.length],
      need,
      happiness: applicant ? 58 : 48 + (index * 7) % 24,
      idea: 28 + (index * 11) % 39,
      preferredBuilding,
      room: null,
      months: 0,
    };
  }

  assignFacilityDirect(room, type, level = 1) {
    room.type = type;
    room.level = level;
    room.experience = 4;
    this.renderRoom(room);
  }

  createHud() {
    this.add.rectangle(0, 0, GAME_WIDTH, 62, 0x203148).setOrigin(0).setDepth(100);
    this.add.rectangle(0, 57, GAME_WIDTH, 5, 0xd4aa4e).setOrigin(0).setDepth(101);
    this.add.text(16, 10, '団地再生ものがたり', {
      fontFamily: 'monospace', fontSize: '22px', color: '#fff0b8', fontStyle: 'bold',
    }).setDepth(102);
    this.add.text(17, 36, 'ひだまり団地・再生本部', {
      fontFamily: 'monospace', fontSize: '11px', color: '#b9d3de',
    }).setDepth(102);

    this.hudText = this.add.text(310, 10, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', lineSpacing: 3,
    }).setDepth(102);

    ['停止', '1倍', '2倍'].forEach((label, index) => {
      const value = index;
      const button = this.add.rectangle(1115 + index * 50, 12, 44, 34, index === 1 ? 0xf0cc62 : 0x42566e)
        .setOrigin(0).setDepth(103).setInteractive({ useHandCursor: true });
      button.setData('speedValue', value);
      this.add.text(1137 + index * 50, 29, label, {
        fontFamily: 'monospace', fontSize: '11px', color: index === 1 ? '#263449' : '#ffffff',
      }).setOrigin(0.5).setDepth(104);
      button.on('pointerdown', () => this.setSpeed(value));
    });
  }

  createRightPanel() {
    this.add.rectangle(PANEL_X, 70, PANEL_W, 638, 0xf6e7bd, 0.98)
      .setOrigin(0).setStrokeStyle(4, 0x26374b).setDepth(80);
    this.add.rectangle(PANEL_X + 8, 78, PANEL_W - 16, 44, 0xd9bd68)
      .setOrigin(0).setStrokeStyle(2, 0x82633a).setDepth(81);

    this.selectedTitle = this.add.text(PANEL_X + 20, 89, '部屋を選択', {
      fontFamily: 'monospace', fontSize: '17px', color: '#26374b', fontStyle: 'bold',
    }).setDepth(82);
    this.selectedDetail = this.add.text(PANEL_X + 18, 136, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#34465a', lineSpacing: 5, wordWrap: { width: 316 },
    }).setDepth(82);

    this.add.line(PANEL_X + 16, 306, 0, 0, PANEL_W - 32, 0, 0x9d835a).setOrigin(0).setDepth(82);
    this.add.text(PANEL_X + 18, 318, '選択中の棟', {
      fontFamily: 'monospace', fontSize: '15px', color: '#26374b', fontStyle: 'bold',
    }).setDepth(82);
    this.buildingDetail = this.add.text(PANEL_X + 18, 345, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#34465a', lineSpacing: 5, wordWrap: { width: 316 },
    }).setDepth(82);

    this.add.line(PANEL_X + 16, 443, 0, 0, PANEL_W - 32, 0, 0x9d835a).setOrigin(0).setDepth(82);
    this.add.text(PANEL_X + 18, 455, '再生ミッション', {
      fontFamily: 'monospace', fontSize: '15px', color: '#26374b', fontStyle: 'bold',
    }).setDepth(82);
    this.missionText = this.add.text(PANEL_X + 18, 481, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#34465a', lineSpacing: 5, wordWrap: { width: 316 },
    }).setDepth(82);

    this.add.rectangle(PANEL_X + 14, 618, PANEL_W - 28, 76, 0x2d4054)
      .setOrigin(0).setStrokeStyle(3, 0x172436).setDepth(81);
    this.add.text(PANEL_X + 25, 628, '団地ニュース', {
      fontFamily: 'monospace', fontSize: '12px', color: '#f1cf69', fontStyle: 'bold',
    }).setDepth(82);
    this.newsText = this.add.text(PANEL_X + 25, 650, '本日もだいたい平和です。', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', wordWrap: { width: 294 }, lineSpacing: 3,
    }).setDepth(82);
  }

  createToolMenu() {
    this.add.rectangle(0, 564, 908, 156, 0x24364a, 0.98).setOrigin(0).setDepth(80);
    this.add.text(16, 574, '空き室の用途を決める', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f6d77b', fontStyle: 'bold',
    }).setDepth(82);
    this.toolHint = this.add.text(898, 576, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#d8e3ea',
    }).setOrigin(1, 0).setDepth(82);

    Object.entries(TOOLS).forEach(([key, tool], index) => {
      const row = index >= 4 ? 1 : 0;
      const column = index % 4;
      const x = 16 + column * 220;
      const y = 600 + row * 55;
      const button = this.add.rectangle(x, y, 207, 45, 0xf4e4b7)
        .setOrigin(0).setStrokeStyle(3, 0x142236).setDepth(82).setInteractive({ useHandCursor: true });
      const label = this.add.text(x + 10, y + 7, tool.label, {
        fontFamily: 'monospace', fontSize: '13px', color: '#263449', fontStyle: 'bold',
      }).setDepth(83);
      const cost = this.add.text(x + 197, y + 29, tool.cost ? `${tool.cost}万円` : '確認', {
        fontFamily: 'monospace', fontSize: '11px', color: '#72482f',
      }).setOrigin(1, 1).setDepth(83);
      button.on('pointerdown', () => this.selectTool(key));
      this.toolButtons.set(key, { button, label, cost });
    });
  }

  createWalkers() {
    this.residents.slice(0, 14).forEach((resident, index) => this.spawnWalker(resident, index));
  }

  spawnWalker(resident, index = this.walkers.length) {
    if (this.walkers.length >= 18) return;
    const sprite = this.add.image(70 + (index * 47) % 790, 302 + (index % 2) * 245, `walker-${index % 8}`)
      .setDepth(35).setScale(0.9).setInteractive({ useHandCursor: true });
    const walker = {
      resident,
      sprite,
      targetX: Phaser.Math.Between(45, 865),
      laneY: sprite.y,
      speed: Phaser.Math.Between(16, 28),
    };
    sprite.on('pointerdown', () => {
      if (resident.room) this.selectRoom(resident.room);
      this.showToast(`${resident.name}「${this.getResidentComment(resident)}」`);
    });
    this.walkers.push(walker);
  }

  renderRoom(room) {
    const container = room.container;
    container.removeAll(true);
    const style = ROOM_TYPES[room.type];
    const g = this.add.graphics();
    g.fillStyle(0x222a31, 0.22).fillRect(-ROOM_W / 2 + 2, -ROOM_H / 2 + 3, ROOM_W, ROOM_H);
    g.fillStyle(style.color).fillRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W - 2, ROOM_H - 3);
    g.lineStyle(2, 0x6d716f).strokeRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W - 2, ROOM_H - 3);
    g.fillStyle(0x7f8078).fillRect(-ROOM_W / 2, ROOM_H / 2 - 6, ROOM_W - 2, 4);
    g.fillStyle(0xa6a398).fillRect(-ROOM_W / 2 + 3, ROOM_H / 2 - 3, ROOM_W - 8, 3);

    if (room.type === 'vacant') this.drawVacantRoom(g);
    if (room.type === 'occupied') this.drawOccupiedRoom(g, room);
    if (room.type === 'work') this.drawWorkRoom(g);
    if (room.type === 'nursery') this.drawNurseryRoom(g);
    if (room.type === 'deli') this.drawDeliRoom(g);
    if (room.type === 'clinic') this.drawClinicRoom(g);
    if (room.type === 'common') this.drawCommonRoom(g);
    if (room.type === 'startup') this.drawStartupRoom(g);

    container.add(g);

    const unitLabel = this.add.text(-ROOM_W / 2 + 3, -ROOM_H / 2 + 2, String(room.number), {
      fontFamily: 'monospace', fontSize: '7px', color: style.text,
    });
    container.add(unitLabel);

    if (room.type !== 'vacant' && room.type !== 'occupied') {
      const typeLabel = this.add.text(ROOM_W / 2 - 4, ROOM_H / 2 - 10, ROOM_TYPES[room.type].label, {
        fontFamily: 'monospace', fontSize: '7px', color: style.text, backgroundColor: 'rgba(255,255,255,0.58)',
        padding: { x: 2, y: 1 },
      }).setOrigin(1, 1);
      container.add(typeLabel);
    }

    if (room.level > 1 && room.type !== 'occupied' && room.type !== 'vacant') {
      const level = this.add.text(ROOM_W / 2 - 4, -ROOM_H / 2 + 2, `Lv${room.level}`, {
        fontFamily: 'monospace', fontSize: '7px', color: '#734c20', backgroundColor: '#fff0a6', padding: { x: 2, y: 1 },
      }).setOrigin(1, 0);
      container.add(level);
    }

    this.updateRoomSelection(room);
  }

  drawVacantRoom(g) {
    g.fillStyle(0x27323a).fillRect(-18, -8, 13, 12).fillRect(4, -8, 13, 12);
    g.lineStyle(2, 0x8b979d, 0.7).lineBetween(-17, -7, -6, 3).lineBetween(-6, -7, -17, 3);
    g.lineBetween(5, -7, 16, 3).lineBetween(16, -7, 5, 3);
    g.fillStyle(0x6e5d46).fillRect(-4, 7, 8, 7);
    g.fillStyle(0xa89470).fillRect(-2, 9, 4, 2);
  }

  drawOccupiedRoom(g, room) {
    const tint = room.resident ? this.needColor(room.resident.need) : 0xe6c47b;
    g.fillStyle(0x8dc7d2).fillRect(-19, -8, 15, 12).fillRect(4, -8, 15, 12);
    g.fillStyle(0xe8f6f8).fillRect(-17, -6, 4, 4).fillRect(6, -6, 4, 4);
    g.fillStyle(tint).fillRect(-20, -10, 4, 14).fillRect(15, -10, 4, 14);
    g.fillStyle(0x715344).fillRect(-4, 5, 8, 9);
    g.fillStyle(0xf0c39b).fillCircle(room.column % 2 === 0 ? -10 : 10, 7, 3);
    g.fillStyle(0x3d4652).fillRect(room.column % 2 === 0 ? -13 : 7, 10, 6, 4);
    if ((room.number + room.building.id.charCodeAt(0)) % 3 === 0) {
      g.fillStyle(0xe9ece4).fillRect(-16, 13, 8, 2);
      g.fillStyle(0x5e86a1).fillRect(-8, 13, 7, 2);
    }
  }

  drawWorkRoom(g) {
    g.fillStyle(0x51617e).fillRect(-17, -8, 34, 17);
    g.fillStyle(0x75b5d1).fillRect(-13, -5, 12, 8).fillRect(3, -5, 12, 8);
    g.fillStyle(0xe7e7df).fillRect(-10, -3, 6, 3).fillRect(6, -3, 6, 3);
    g.fillStyle(0x745442).fillRect(-18, 9, 36, 3);
    g.fillStyle(0x3d4350).fillRect(-10, 12, 3, 3).fillRect(8, 12, 3, 3);
  }

  drawNurseryRoom(g) {
    g.fillStyle(0xffe9ca).fillRect(-18, -8, 36, 18);
    g.fillStyle(0xe56f67).fillRect(-16, 4, 8, 7);
    g.fillStyle(0x6ca0c6).fillRect(-5, 1, 7, 10);
    g.fillStyle(0xf0c646).fillRect(5, 5, 9, 6);
    g.fillStyle(0x5f9b5c).fillCircle(12, -3, 4);
    g.fillStyle(0xffffff).fillRect(-15, -6, 28, 3);
  }

  drawDeliRoom(g) {
    g.fillStyle(0xffe7b3).fillRect(-18, -8, 36, 17);
    g.fillStyle(0xc9584f).fillRect(-19, -10, 38, 5);
    g.fillStyle(0xffffff).fillRect(-16, -10, 6, 5).fillRect(-4, -10, 6, 5).fillRect(8, -10, 6, 5);
    g.fillStyle(0x765040).fillRect(-17, 7, 34, 5);
    g.fillStyle(0x9a9b98).fillCircle(-7, 3, 5);
    g.fillStyle(0xe5bf50).fillCircle(8, 3, 4);
  }

  drawClinicRoom(g) {
    g.fillStyle(0xf1faf3).fillRect(-18, -8, 36, 19);
    g.fillStyle(0x69a987).fillRect(-3, -8, 6, 14).fillRect(-8, -3, 16, 5);
    g.fillStyle(0x80b9c6).fillRect(-17, 7, 12, 5).fillRect(6, 7, 12, 5);
  }

  drawCommonRoom(g) {
    g.fillStyle(0xe8efcf).fillRect(-18, -8, 36, 19);
    g.fillStyle(0x7b9e66).fillRect(-15, 3, 11, 8).fillRect(4, 3, 11, 8);
    g.fillStyle(0xa9794c).fillRect(-5, 5, 10, 4);
    g.fillStyle(0xe9c95b).fillCircle(0, -3, 5);
    g.fillStyle(0x6c845b).fillRect(-1, 2, 2, 4);
  }

  drawStartupRoom(g) {
    g.fillStyle(0x234950).fillRect(-18, -9, 36, 20);
    g.fillStyle(0x71d0ca).fillRect(-14, -5, 28, 9);
    g.fillStyle(0xf4e778).fillRect(-11, -2, 4, 3).fillRect(-3, -2, 4, 3).fillRect(5, -2, 4, 3);
    g.fillStyle(0xe7f4f0).fillRect(-15, 7, 30, 4);
    g.fillStyle(0xd96456).fillRect(11, -9, 5, 5);
  }

  needColor(need) {
    return {
      work: 0x6d75aa,
      family: 0xd97872,
      food: 0xd79a3f,
      health: 0x5d9f79,
      community: 0x7d9b59,
    }[need] || 0x999999;
  }

  setRoomHover(room, active) {
    if (room === this.selectedRoom) return;
    room.container.setScale(active ? 1.06 : 1);
  }

  updateRoomSelection(room) {
    const existing = room.container.getByName('selection');
    if (existing) existing.destroy();
    if (room !== this.selectedRoom) return;
    const selection = this.add.rectangle(0, 0, ROOM_W + 4, ROOM_H + 4)
      .setStrokeStyle(3, 0xffef7d).setFillStyle(0xffffff, 0).setName('selection');
    room.container.add(selection);
    room.container.bringToTop(selection);
    room.container.setScale(1.07);
  }

  handleRoomClick(room) {
    this.selectRoom(room);
    if (this.selectedTool === 'inspect') return;
    this.applyToolToRoom(room);
  }

  selectRoom(room) {
    const previous = this.selectedRoom;
    this.selectedRoom = room;
    if (previous && previous !== room) {
      previous.container.setScale(1);
      this.renderRoom(previous);
    }
    this.renderRoom(room);
    this.refreshRightPanel();
  }

  selectTool(key) {
    const tool = TOOLS[key];
    if (tool.unlock && this.reputation < tool.unlock) {
      this.showToast(`${tool.label}は団地評判${tool.unlock}で解放されます。`);
      return;
    }
    this.selectedTool = key;
    this.refreshTools();
    this.toolHint.setText(tool.description);
    this.showToast(tool.description);
  }

  applyToolToRoom(room) {
    const tool = TOOLS[this.selectedTool];
    if (!tool) return;

    if (this.selectedTool === 'clear') {
      if (room.type === 'occupied') {
        this.showToast('住民が暮らしている部屋は、先に転居先が必要です。');
        return;
      }
      if (room.type === 'vacant') {
        this.showToast('すでに空き室です。');
        return;
      }
      if (!this.spend(tool.cost)) return;
      room.type = 'vacant';
      room.level = 1;
      room.experience = 0;
      room.startupName = null;
      this.assignmentCount += 1;
      this.renderRoom(room);
      this.announce(`${room.id}を空き室へ戻しました。`);
      this.afterRoomChange(room);
      return;
    }

    if (room.type !== 'vacant') {
      this.showToast('用途を割り当てられるのは空き室だけです。');
      return;
    }
    if (tool.unlock && this.reputation < tool.unlock) {
      this.showToast(`評判${tool.unlock}が必要です。`);
      return;
    }
    if (!this.spend(tool.cost)) return;

    if (this.selectedTool === 'home') {
      if (this.applicants.length === 0) {
        this.money += tool.cost;
        this.showToast('入居希望者がいません。評判を上げるか、見学会を待ちましょう。');
        return;
      }
      const resident = this.applicants.shift();
      resident.room = room;
      resident.preferredBuilding = room.building.id;
      room.type = 'occupied';
      room.resident = resident;
      this.residents.push(resident);
      this.spawnWalker(resident);
      this.announce(`${room.id}に${resident.name}さん（${resident.household}）が入居しました。`);
    } else {
      room.type = tool.type;
      room.level = 1;
      room.experience = 0;
      room.lastUsers = 0;
      this.announce(`${room.id}を「${ROOM_TYPES[room.type].label}」へ改修しました。`);
    }

    this.assignmentCount += 1;
    this.renderRoom(room);
    this.makeRoomSparkles(room);
    this.afterRoomChange(room);
  }

  spend(cost) {
    if (this.money < cost) {
      this.showToast('資金不足。自治会長の電卓が固まりました。');
      return false;
    }
    this.money -= cost;
    return true;
  }

  afterRoomChange(room) {
    this.checkBuildingCombos(room.building);
    this.checkMissions();
    this.refreshAll();
    this.selectRoom(room);
  }

  checkBuildingCombos(building) {
    COMBO_DEFS.forEach((combo) => {
      const comboKey = `${building.id}-${combo.key}`;
      if (this.comboKeys.has(comboKey)) return;

      let found = false;
      building.rooms.forEach((room) => {
        if (found || room.type !== combo.needs[0]) return;
        found = building.rooms.some((other) => {
          if (other.type !== combo.needs[1]) return false;
          const floorDistance = Math.abs(other.floor - room.floor);
          const columnDistance = Math.abs(other.column - room.column);
          return floorDistance === 0 && columnDistance <= 1;
        });
      });

      if (!found) return;
      this.comboKeys.add(comboKey);
      building.comboNames.push(combo.name);
      this.money += combo.reward;
      this.reputation += combo.reputation;
      this.showAchievement(`${building.name}\n部屋コンボ発見！\n「${combo.name}」\n報酬 ${combo.reward}万円`);
    });
  }

  nextMonth() {
    if (this.speed === 0 || this.eventOpen) return;
    this.month += 1;
    if (this.month > 12) {
      this.month = 1;
      this.year += 1;
      this.reputation += 2;
      this.announce(`${this.year}年目。団地視察団が屋上の布団ばかり撮影しています。`);
    }

    let rentIncome = 0;
    let facilityIncome = 0;
    let maintenance = 0;

    this.buildings.forEach((building) => {
      const occupiedResidents = building.rooms
        .filter((room) => room.type === 'occupied' && room.resident)
        .map((room) => room.resident);
      const vacancyRate = this.getBuildingVacancyRate(building);
      const facilityCounts = this.getFacilityCounts(building);

      occupiedResidents.forEach((resident) => {
        const target = this.calculateHappinessTarget(resident, building, facilityCounts, vacancyRate);
        resident.happiness = Phaser.Math.Clamp(Math.round(resident.happiness * 0.62 + target * 0.38), 18, 96);
        resident.months += 1;
        if ((facilityCounts.work || 0) + (facilityCounts.startup || 0) > 0 && resident.need === 'work') {
          resident.idea = Math.min(99, resident.idea + Phaser.Math.Between(1, 3));
        }
        rentIncome += 5 + Math.round(resident.happiness / 18) + Math.min(3, resident.size);
      });

      building.rooms.forEach((room) => {
        if (room.type === 'vacant') {
          maintenance += 1;
          return;
        }
        if (room.type === 'occupied') {
          maintenance += 2;
          return;
        }

        const users = this.estimateFacilityUsers(room, occupiedResidents);
        room.lastUsers = users;
        room.experience += Math.max(1, Math.ceil(users / 4));
        room.lastIncome = this.calculateFacilityIncome(room, users);
        facilityIncome += room.lastIncome;
        maintenance += room.type === 'clinic' ? 8 : room.type === 'startup' ? 6 : 4;
        this.tryLevelFacility(room);
      });

      building.monthlyIncome = occupiedResidents.reduce((sum, resident) => sum + 5 + Math.round(resident.happiness / 18), 0)
        + building.rooms.reduce((sum, room) => sum + (room.lastIncome || 0), 0);
    });

    maintenance += this.buildings.length * 12;
    const net = rentIncome + facilityIncome - maintenance;
    this.lastMonthlyNet = net;
    this.money += net;

    const average = this.getAverageHappiness();
    if (average >= 70) this.reputation += 2;
    if (average >= 78) this.reputation += 1;

    const newApplicants = Math.max(0, Math.floor((this.reputation + average - 62) / 22));
    for (let i = 0; i < newApplicants; i += 1) this.applicants.push(this.generateResident(null, true));

    this.maybeLaunchStartup();
    this.checkMissions();
    this.refreshAll();
    this.floatHud(`+${net}万円`);
    this.announce(`月次決算：家賃${rentIncome}＋施設${facilityIncome}－維持${maintenance}＝${net}万円。入居希望者＋${newApplicants}。`);

    if (this.month % 3 === 0) this.time.delayedCall(500, () => this.showChoiceEvent());
  }

  calculateHappinessTarget(resident, building, counts, vacancyRate) {
    let score = 45;
    score += Math.min(8, (counts.common || 0) * 4);
    score += Math.min(5, (counts.deli || 0) * 2);
    score -= Math.round(vacancyRate * 10);

    const needed = NEED_FACILITIES[resident.need] || [];
    needed.forEach((type, index) => {
      score += (counts[type] || 0) * (index === 0 ? 14 : 6);
    });

    if (building.comboNames.length > 0) score += Math.min(8, building.comboNames.length * 3);
    if (resident.room) {
      const nearby = building.rooms.filter((room) => {
        if (!needed.includes(room.type)) return false;
        return room.floor === resident.room.floor && Math.abs(room.column - resident.room.column) <= 1;
      });
      score += nearby.length * 5;
    }
    return Phaser.Math.Clamp(score, 22, 94);
  }

  estimateFacilityUsers(room, residents) {
    const matchingNeeds = {
      work: ['work'],
      startup: ['work'],
      nursery: ['family'],
      deli: ['food', 'community'],
      clinic: ['health'],
      common: ['community', 'family', 'health'],
    }[room.type] || [];
    const matching = residents.filter((resident) => matchingNeeds.includes(resident.need)).length;
    const universal = room.type === 'deli' || room.type === 'common' ? Math.ceil(residents.length * 0.25) : 0;
    return Math.max(1, matching + universal + room.level - 1);
  }

  calculateFacilityIncome(room, users) {
    const base = {
      work: 8,
      nursery: 3,
      deli: 9,
      clinic: 10,
      common: 3,
      startup: 24,
    }[room.type] || 0;
    const perUser = room.type === 'nursery' || room.type === 'common' ? 1 : 2;
    return base * room.level + users * perUser;
  }

  tryLevelFacility(room) {
    const threshold = room.level === 1 ? 16 : room.level === 2 ? 38 : Infinity;
    if (room.experience < threshold) return;
    room.level += 1;
    room.experience = 0;
    this.reputation += 3;
    this.renderRoom(room);
    this.makeRoomSparkles(room);
    this.announce(`${room.id}の${ROOM_TYPES[room.type].label}がLv.${room.level}へ成長しました。`);
  }

  maybeLaunchStartup() {
    this.buildings.forEach((building) => {
      const existing = building.rooms.some((room) => room.type === 'startup');
      if (existing) return;
      const workRoom = building.rooms.find((room) => room.type === 'work' && room.level >= 2 && room.experience >= 10);
      const founder = building.rooms
        .filter((room) => room.type === 'occupied' && room.resident)
        .map((room) => room.resident)
        .sort((a, b) => b.idea - a.idea)[0];
      if (!workRoom || !founder || founder.idea < 64) return;

      workRoom.type = 'startup';
      workRoom.startupName = this.getStartupName(building);
      workRoom.level = 1;
      workRoom.experience = 0;
      this.startups += 1;
      this.reputation += 12;
      this.money += 100;
      this.renderRoom(workRoom);
      this.showAchievement(`${building.name}\n団地ベンチャー誕生！\n「${workRoom.startupName}」\n創業者：${founder.name}`);
    });
  }

  getStartupName(building) {
    const counts = this.getFacilityCounts(building);
    if ((counts.deli || 0) > 0) return 'まごころ団地デリバリー';
    if ((counts.nursery || 0) > 0) return 'こそだてシェアラボ';
    if ((counts.clinic || 0) > 0) return 'みまもりテック';
    return '空室アイデア研究所';
  }

  showChoiceEvent() {
    if (this.eventOpen) return;
    this.eventOpen = true;
    const event = Phaser.Utils.Array.GetRandom(CHOICE_EVENTS);
    const overlay = this.add.container(0, 0).setDepth(200);
    overlay.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x142238, 0.72).setOrigin(0));
    overlay.add(this.add.rectangle(350, 185, 580, 300, 0xffedbd).setStrokeStyle(5, 0x26374b));
    overlay.add(this.add.text(384, 218, '団地会議', {
      fontFamily: 'monospace', fontSize: '15px', color: '#9a583c', fontStyle: 'bold',
    }));
    overlay.add(this.add.text(384, 252, event.title, {
      fontFamily: 'monospace', fontSize: '21px', color: '#26374b', fontStyle: 'bold',
    }));
    overlay.add(this.add.text(384, 292, event.body, {
      fontFamily: 'monospace', fontSize: '15px', color: '#435267', wordWrap: { width: 510 },
    }));

    event.choices.forEach((choice, index) => {
      const y = 350 + index * 58;
      const button = this.add.rectangle(384, y, 510, 44, 0xe4c45d)
        .setOrigin(0).setStrokeStyle(3, 0x26374b).setInteractive({ useHandCursor: true });
      const text = this.add.text(639, y + 22, choice.label, {
        fontFamily: 'monospace', fontSize: '14px', color: '#26374b', fontStyle: 'bold',
      }).setOrigin(0.5);
      overlay.add([button, text]);
      button.on('pointerdown', () => {
        choice.action(this);
        overlay.destroy(true);
        this.eventOpen = false;
        this.checkMissions();
        this.refreshAll();
      });
    });
  }

  addApplicants(count, need, moneyChange, reputationChange, message) {
    this.money += moneyChange;
    this.reputation += reputationChange;
    for (let i = 0; i < count; i += 1) this.applicants.push(this.generateResident(null, true, need));
    this.announce(message);
  }

  applyEventResult(moneyChange, reputationChange, happinessChange, message) {
    this.money += moneyChange;
    this.reputation += reputationChange;
    this.residents.forEach((resident) => {
      resident.happiness = Phaser.Math.Clamp(resident.happiness + happinessChange, 0, 100);
    });
    this.announce(message);
  }

  checkMissions() {
    this.missions.forEach((mission) => {
      if (mission.complete || !mission.check()) return;
      mission.complete = true;
      this.money += mission.reward;
      this.reputation += 4;
      this.showAchievement(`ミッション達成！\n${mission.label}\n報酬 ${mission.reward}万円`);
    });
  }

  refreshAll() {
    this.updateHud();
    this.refreshBuildingStats();
    this.refreshRightPanel();
    this.refreshTools();
  }

  updateHud() {
    if (!this.hudText) return;
    const occupied = this.getOccupiedCount();
    const vacancy = this.getVacantCount();
    this.hudText.setText(
      `資金 ${this.money}万円　入居 ${occupied}/96室　空室 ${vacancy}室　満足 ${this.getAverageHappiness()}%\n` +
      `${this.year}年目 ${this.month}月　評判 ${this.reputation}　入居希望 ${this.applicants.length}組　先月 ${this.lastMonthlyNet >= 0 ? '+' : ''}${this.lastMonthlyNet}万円`,
    );
  }

  refreshBuildingStats() {
    this.buildings.forEach((building) => {
      const occupied = building.rooms.filter((room) => room.type === 'occupied').length;
      const vacant = building.rooms.filter((room) => room.type === 'vacant').length;
      const residents = building.rooms.filter((room) => room.resident).map((room) => room.resident);
      const happiness = residents.length
        ? Math.round(residents.reduce((sum, resident) => sum + resident.happiness, 0) / residents.length)
        : 0;
      building.statsText.setText(`入居${occupied}/24　空室${vacant}　満足${happiness}%`);
      building.comboText.setText(building.comboNames.length ? `効果：${building.comboNames.at(-1)}` : '');
    });
  }

  refreshRightPanel() {
    if (!this.selectedRoom || !this.selectedTitle) return;
    const room = this.selectedRoom;
    this.selectedTitle.setText(`${room.building.id}棟 ${room.number}号室　${ROOM_TYPES[room.type].label}`);

    if (room.type === 'vacant') {
      this.selectedDetail.setText(
        '現在は空き室です。\n' +
        '窓は暗く、内装も少し傷んでいます。\n\n' +
        '下の用途メニューを選び、もう一度この部屋をクリックすると改修できます。',
      );
    } else if (room.type === 'occupied' && room.resident) {
      const resident = room.resident;
      this.selectedDetail.setText(
        `${resident.name}\n${resident.household}・${resident.size}人暮らし\n` +
        `仕事：${resident.job}\n性格：${resident.trait}\n` +
        `重視：${NEED_LABELS[resident.need]}\n満足度：${resident.happiness}%\n` +
        `アイデア：${resident.idea}\n\n「${this.getResidentComment(resident)}」`,
      );
    } else {
      const startupLine = room.type === 'startup' ? `\n会社名：${room.startupName}` : '';
      this.selectedDetail.setText(
        `${ROOM_TYPES[room.type].label}　Lv.${room.level}${startupLine}\n` +
        `先月利用：${room.lastUsers}人\n先月収入：${room.lastIncome}万円\n` +
        `成長経験：${room.experience}\n\n${this.getFacilityDescription(room.type)}`,
      );
    }

    const building = room.building;
    const counts = this.getFacilityCounts(building);
    const occupied = building.rooms.filter((item) => item.type === 'occupied').length;
    const vacant = building.rooms.filter((item) => item.type === 'vacant').length;
    const buildingResidents = building.rooms.filter((item) => item.resident).map((item) => item.resident);
    const needCounts = Object.keys(NEED_LABELS).map((need) => {
      const count = buildingResidents.filter((resident) => resident.need === need).length;
      return `${NEED_LABELS[need]}${count}`;
    }).join('・');

    this.buildingDetail.setText(
      `${building.name}\n入居 ${occupied}/24室　空室 ${vacant}室\n` +
      `仕事${counts.work || 0}　保育${counts.nursery || 0}　惣菜${counts.deli || 0}\n` +
      `診療${counts.clinic || 0}　交流${counts.common || 0}　起業${counts.startup || 0}\n` +
      `住民の要望：${needCounts}`,
    );

    this.missionText.setText(this.missions.map((mission) => (
      `${mission.complete ? '達成' : '・'} ${mission.label}　${mission.reward}万`
    )).join('\n'));
  }

  refreshTools() {
    this.toolButtons.forEach((ui, key) => {
      const tool = TOOLS[key];
      const locked = tool.unlock && this.reputation < tool.unlock;
      const selected = key === this.selectedTool;
      ui.button.setFillStyle(locked ? 0x80878b : selected ? 0xf1cf63 : 0xf4e4b7);
      ui.label.setColor(locked ? '#444b51' : '#263449');
      ui.cost.setText(locked ? `評判${tool.unlock}` : tool.cost ? `${tool.cost}万円` : '確認');
    });
  }

  getFacilityDescription(type) {
    return {
      work: '在宅勤務や小さな事業の拠点。仕事を重視する住民に強く効きます。',
      nursery: '小規模保育と一時預かり。子育て世帯の入居人気を上げます。',
      deli: '住民向けの惣菜と配食。食事の不安を減らし、売上も生みます。',
      clinic: '団地内の小さな診療所。高齢世帯の安心感を大きく上げます。',
      common: '誰でも使える交流室。孤立を防ぎ、複数の世帯に広く効きます。',
      startup: '住民のアイデアから生まれた企業。団地外からも収益を呼び込みます。',
    }[type] || '';
  }

  getResidentComment(resident) {
    const comments = {
      work: '近くに仕事場があれば、通勤時間を丸ごと取り返せます。',
      family: '保育室が同じ棟にあると、本当に助かります。',
      food: '夕飯を作れない日に、惣菜があるだけで違います。',
      health: '診療所が近ければ、ここに長く住めそうです。',
      community: '顔を合わせる場所が、もう少し欲しいですね。',
    };
    return comments[resident.need];
  }

  getFacilityCounts(building) {
    return building.rooms.reduce((counts, room) => {
      if (!['vacant', 'occupied'].includes(room.type)) counts[room.type] = (counts[room.type] || 0) + 1;
      return counts;
    }, {});
  }

  getBuildingVacancyRate(building) {
    return building.rooms.filter((room) => room.type === 'vacant').length / building.rooms.length;
  }

  getOccupiedCount() {
    return this.rooms.filter((room) => room.type === 'occupied').length;
  }

  getVacantCount() {
    return this.rooms.filter((room) => room.type === 'vacant').length;
  }

  getAverageHappiness() {
    if (this.residents.length === 0) return 0;
    return Math.round(this.residents.reduce((sum, resident) => sum + resident.happiness, 0) / this.residents.length);
  }

  playAmbientMoment() {
    if (this.eventOpen || this.speed === 0 || this.residents.length === 0) return;
    const resident = Phaser.Utils.Array.GetRandom(this.residents);
    const messages = [
      `${resident.name}さんが回覧板を次の部屋へ届けました。`,
      `${resident.name}さんがベランダの布団を慌てて取り込みました。`,
      `${resident.name}さんが廊下で立ち話を始めました。`,
      `${resident.name}さんが空き室を少し気にしています。`,
    ];
    if (Math.random() < 0.55) this.announce(Phaser.Utils.Array.GetRandom(messages));
  }

  setSpeed(value) {
    this.speed = value;
    this.time.timeScale = value === 0 ? 0.0001 : value;
    this.children.list
      .filter((child) => child.type === 'Rectangle' && child.getData('speedValue') !== undefined)
      .forEach((button) => button.setFillStyle(button.getData('speedValue') === value ? 0xf0cc62 : 0x42566e));
    this.showToast(value === 0 ? '時間を止めました。部屋割りをゆっくり考えられます。' : `${value}倍速で進めます。`);
  }

  announce(message) {
    if (!this.newsText) return;
    this.newsText.setText(message);
    this.tweens.add({ targets: this.newsText, alpha: { from: 0.25, to: 1 }, duration: 220 });
  }

  showToast(message) {
    if (this.toast) this.toast.destroy();
    this.toast = this.add.text(454, 548, message, {
      fontFamily: 'monospace', fontSize: '13px', color: '#fffbea', backgroundColor: '#26374b',
      padding: { x: 10, y: 6 }, wordWrap: { width: 730 },
    }).setOrigin(0.5, 1).setDepth(150);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1900, duration: 350, onComplete: () => this.toast?.destroy() });
  }

  showAchievement(message) {
    const panel = this.add.container(0, 0).setDepth(190);
    const box = this.add.rectangle(640, 340, 500, 170, 0xffe8a9).setStrokeStyle(6, 0x88563b);
    const ribbon = this.add.rectangle(640, 273, 280, 32, 0xd66b53).setStrokeStyle(3, 0x874838);
    const title = this.add.text(640, 273, '団地再生ニュース', {
      fontFamily: 'monospace', fontSize: '14px', color: '#fff7dd', fontStyle: 'bold',
    }).setOrigin(0.5);
    const text = this.add.text(640, 342, message, {
      fontFamily: 'monospace', fontSize: '18px', color: '#26374b', align: 'center', lineSpacing: 7, fontStyle: 'bold',
    }).setOrigin(0.5);
    panel.add([box, ribbon, title, text]);
    panel.setScale(0.55).setAlpha(0);
    this.tweens.add({
      targets: panel, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out',
      onComplete: () => this.time.delayedCall(1700, () => {
        this.tweens.add({ targets: panel, alpha: 0, duration: 260, onComplete: () => panel.destroy(true) });
      }),
    });
  }

  makeRoomSparkles(room) {
    for (let i = 0; i < 8; i += 1) {
      const dot = this.add.rectangle(room.x, room.y, 4, 4, i % 2 ? 0xffef83 : 0xffffff).setDepth(60);
      const angle = (Math.PI * 2 * i) / 8;
      this.tweens.add({
        targets: dot,
        x: room.x + Math.cos(angle) * Phaser.Math.Between(22, 38),
        y: room.y + Math.sin(angle) * Phaser.Math.Between(18, 30),
        alpha: 0,
        duration: 540,
        onComplete: () => dot.destroy(),
      });
    }
  }

  floatHud(text) {
    const label = this.add.text(1000, 58, text, {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff0a1', fontStyle: 'bold',
    }).setDepth(160);
    this.tweens.add({ targets: label, y: 30, alpha: 0, duration: 950, onComplete: () => label.destroy() });
  }

  update(_time, delta) {
    if (this.speed === 0) return;
    const dt = (delta / 1000) * this.speed;
    this.walkers.forEach((walker) => {
      const dx = walker.targetX - walker.sprite.x;
      if (Math.abs(dx) < 3) {
        walker.targetX = Phaser.Math.Between(45, 865);
        if (Math.random() < 0.25) walker.laneY = walker.laneY < 400 ? 548 : 302;
        return;
      }
      walker.sprite.x += Math.sign(dx) * walker.speed * dt;
      walker.sprite.y += (walker.laneY - walker.sprite.y) * Math.min(1, dt * 2.2);
      walker.sprite.flipX = dx < 0;
      walker.sprite.setAngle(Math.sin(walker.sprite.x * 0.18) * 2);
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#9fcfd0',
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
