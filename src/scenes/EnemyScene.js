import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class EnemyScene extends Phaser.Scene {

    constructor() {
        super('EnemyScene')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Checkpoint calibration ───────────────────
        // negative X = move left
        // negative Y = move up
        this.checkpointOffsetX = -38
        this.checkpointOffsetY = -31.45
        
        

        // ─── Background ────────────────────────────────
        this.bg = this.add.image(0, 0, 'enemy-bg').setOrigin(0, 0)
        const bgScale = H / this.bg.height
        this.bg.setScale(bgScale)
        const worldWidth = this.bg.width * bgScale
        this.bg.setDepth(-1)
        this.physics.world.setBounds(0, 0, worldWidth, H)
        this.worldWidth = worldWidth

        this.cameras.main.fadeIn(300, 0, 0, 0)



        // ─── UI / Dialog ───────────────────────────────
        this.ui = new UI(this)
        this.ui.create()
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => {
            if (this.ui) this.ui.destroy()
            this.closeEnemyBaseViewer()
        })

        // ─── Animations FIRST (so enemies can play on spawn) ─
        this.createAnimations()

        // ─── Ground ────────────────────────────────────
        this.ground = this.physics.add.staticGroup()
        const groundTile = this.add.rectangle(worldWidth / 2, H - 10, worldWidth, 20, 0x333333)
        this.physics.add.existing(groundTile, true)
        this.ground.add(groundTile)

        // ─── Platforms ─────────────────────────────────
        this.platforms = this.physics.add.staticGroup()
        this.createPlatform(41, 686, 82, 760)
        this.createPlatform(431, 391, 714, 67)
        this.createPlatform(365, 742, 622, 83)

        this.createPlatform(917, 792, 346, 91)
        this.createPlatform(1347, 402, 723, 94)
        this.createPlatform(1629, 776, 783, 81)
        this.createPlatform(1854, 575, 108, 58)

        this.createPlatform(2484, 602, 703, 96)
        this.createPlatform(2380, 602 - 36, 703, 20)


        this.createPlatform(3491, 765, 632, 49)
        this.createPlatform(3214, 902, 65, 313)
        this.createPlatform(2879, 565, 86, 20)
        this.createPlatform(3081, 565, 86, 20)
        this.createPlatform(762, 1035, 7764, 40)
        this.createPlatform(1632, 963, 400, 198)
        this.createPlatform(1703, 494, 43, 63)
        this.createPlatform(1724, 513, 35, 64)
        this.createPlatform(1751, 540, 43, 55)
        this.createPlatform(1773, 550, 47, 37)

        // ─── Ladder ────────────────────────────────────
        this.ladderZones = []
        this.createLadder(2978, 902, 106, 468)

        // ─── Slope Zones ───────────────────────────────
        this.slopeZones = []
        this.addSlopeZone(700, 727, 128, 89, -1)
        this.addSlopeZone(1717, 575, 137, 206, -1)

        // ─── Enemies (after animations) ────────────────
        this.enemies = this.physics.add.group()
        this.enemyBullets = this.physics.add.group()
        this.physics.add.collider(this.enemies, this.ground)
        this.physics.add.collider(this.enemies, this.platforms)
        this.createEnemy(700, H - 175, 'patrol', 200)
        this.createEnemy(400, H - 500, 'patrol', 200)
        this.createEnemy(401, 256, 'patrol', 250)
        this.createEnemy(1744, 634, 'patrol', 200)
        this.createEnemy(2666, 452, 'shooter', 0)
        this.createEnemy(3291, 639, 'shooter', 0)
        this.createEnemy(2256, 913, 'patrol', 300)
        this.createEnemy(3142, 913, 'shooter', 0)


        this.createEnemy(1181, 253, 'shooter', 0)

        // ─── Spikes ────────────────────────────────────
        this.spikes = this.physics.add.staticGroup()
        this.createSpikes(1331, 1003, 154, 31)
        this.createSpikes(1696, 936, 206, 183)
        this.createSpikes(2780, 1026, 280, 71)
        this.createSpikes(3500, H - 30, 100, 20)
        this.createSpikes(4600, H - 30, 150, 20)
        this.createSpikes(5800, H - 30, 120, 20)
        this.createSpikes(6500, H - 30, 100, 20)

        // ─── Checkpoints init ──────────────────────────
        this.checkpoints = []
        this.lastCheckpoint = { x: 193, y: 850 }
        this.totalCheckpoints = 0
        this.visitedCheckpoints = new Set()

        // ─── Bullets group ─────────────────────────────
        this.bullets = this.physics.add.group()

        // ─── Player State ──────────────────────────────
        this.playerHP = 3
        this.maxHP = 3
        this.isInvincible = false
        this.invincibleDuration = 1000
        this.isDead = false
        this.isAttacking = false
        this.isMeleeAttacking = false
        this.isUsingAbility = false
        this.isShielding = false
        this.canDash = true
        this.isDashing = false
        this.dashSpeed = 800
        this.dashDuration = 150
        this.dashCooldown = 800
        this.canShoot = true
        this.shootCooldown = 250
        this.canMelee = true
        this.meleeCooldown = 400
        this.meleeDamage = 3
        this.meleeRange = 120
        this.katanaHitbox = null
        this.canShield = true
        this.shieldDuration = 800
        this.shieldCooldown = 2000
        this.canHighJump = true
        this.highJumpCooldown = 1500
        this.canAbility2 = true
        this.ability2Cooldown = 3000
        this.canAbility3 = true
        this.ability3Cooldown = 4000

        // ─── Controls ──────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })
        this.shiftKey = this.input.keyboard.addKey('SHIFT')
        this.fireKey = this.input.keyboard.addKey('X')
        this.cKey = this.input.keyboard.addKey('C')
        this.qKey = this.input.keyboard.addKey('Q')
        this.eKey = this.input.keyboard.addKey('E')

        this.pKey = this.input.keyboard.addKey('P')

        this.input.mouse.disableContextMenu()
        this.input.on('pointerdown', (pointer) => {
            if (this.dialog.isActive || this.isDead || this.viewerOverlay) return
            if (this.positionTool && this.positionTool.enabled) {
                const wx = Math.round(pointer.worldX)
                const wy = Math.round(pointer.worldY)
                this.positionTool.placed.push({ mode: this.positionTool.mode, x: wx, y: wy })
                const colors = { checkpoint: 0x00ff88, exit: 0x00aaff, ladder: 0xffaa00 }
                const labels = { checkpoint: 'CP', exit: 'EX', ladder: 'LD' }
                const color = colors[this.positionTool.mode] || 0xffffff
                const marker = this.add.circle(wx, wy, 8, color, 0.7).setDepth(999)
                const label = this.add.text(wx, wy - 14, labels[this.positionTool.mode], { fontSize: '10px', fill: '#fff' }).setOrigin(0.5).setDepth(999)
                this.positionTool.markers.push(marker, label)
                return
            }
            if (pointer.rightButtonDown()) {
                if (!this.colliderTool?.enabled) this.useAbility3()
            }
            if (pointer.leftButtonDown()) {
                this.meleeAttack()
            }
        })

        // ─── Player spawn AFTER everything else ────────
        this.player = this.physics.add.sprite(193, 850, 'player-idle')
            .setDepth(10).setScale(2)
        this.player.body.setSize(40, 60)
        this.player.body.setOffset(44, 55)
        this.player.body.setCollideWorldBounds(true)
        this.player.body.setGravityY(600)
        this.player.facing = 1
        this.player.play('player-idle')

        // ─── Player Colliders ──────────────────────────
        this.physics.add.collider(this.player, this.ground)
        this.physics.add.collider(this.player, this.platforms)

        // ─── Bullet colliders ──────────────────────────
        // ✅ AFTER (Bullets will cleanly disappear when hitting walls/floors)
        this.physics.add.overlap(this.bullets, this.platforms, (b) => { b.destroy() })
        this.physics.add.overlap(this.bullets, this.ground, (b) => { b.destroy() })
        this.physics.add.overlap(this.enemyBullets, this.platforms, (b) => { b.destroy() })
        this.physics.add.overlap(this.enemyBullets, this.ground, (b) => { b.destroy() })

        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this)
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHit, null, this)
        this.physics.add.overlap(this.player, this.enemies, this.playerTouchEnemy, null, this)
        this.physics.add.overlap(this.player, this.spikes, this.playerHitSpikes, null, this)

        // ─── Checkpoints (after player) ────────────────
        this.createCheckpoint(925, 555, 80, 60)
        this.createCheckpoint(1353, 200, 60, 60)
        this.totalCheckpoints = this.checkpoints.length

        // ─── Camera ────────────────────────────────────
        this.cameras.main.setBounds(0, 0, worldWidth, H)
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

        // ─── Exit ──────────────────────────────────────
        this.exitLocked = true
        this.exitZone = this.add.rectangle(3420, 628, 60, 100, 0xff4444, 0.3)
            .setStrokeStyle(2, 0xff4444).setDepth(5)
        this.physics.add.existing(this.exitZone, true)
        this.exitText = this.add.text(3420, 568, '🔒 EXIT', {
            fontSize: '16px', fill: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5)
        this.physics.add.overlap(this.player, this.exitZone, this.reachExit, null, this)

        // ─── HUD: Hearts ───────────────────────────────
        this.hearts = []
        for (let i = 0; i < this.maxHP; i++) {
            const heart = this.add.image(50 + i * 36, 90, 'heart-full')
                .setScrollFactor(0).setDepth(102).setScale(1)
            this.hearts.push(heart)
        }

        this.dashIndicator = this.add.text(120, 115, '⚡ DASH [SHIFT]', {
            fontSize: '12px', fill: '#00ffff', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        this.meleeIndicator = this.add.text(120, 132, '🗡️ ATTACK 1 [LMB]', {
            fontSize: '12px', fill: '#ff8800', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        this.shieldIndicator = this.add.text(120, 149, '🛡️ SHIELD [C]', {
            fontSize: '12px', fill: '#4488ff', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        this.highJumpIndicator = this.add.text(120, 166, '🚀 HIGH JUMP [Q]', {
            fontSize: '12px', fill: '#ff44ff', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        this.ability2Indicator = this.add.text(120, 183, '⚔️ ATTACK 2 [E]', {
            fontSize: '12px', fill: '#ffaa00', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        this.ability3Indicator = this.add.text(120, 200, '💥 ATTACK 3 [RMB]', {
            fontSize: '12px', fill: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        this.progressBarBg = this.add.rectangle(W / 2, 75, W - 200, 8, 0x222222).setScrollFactor(0).setDepth(99)
        this.progressBar = this.add.rectangle(100, 75, 0, 6, 0x00ff88).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100)
        this.progressText = this.add.text(W / 2, 62, '0%', {
            fontSize: '11px', fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        this.controlsText = this.add.text(W / 2, H - 20,
            'WASD: Move | X: Shoot | LMB: Attack1 | SHIFT: Dash | C: Shield | Q: Jump | E: Attack2 | RMB: Attack3', {
            fontSize: '13px', fill: '#666666'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        // ─── Position Tool ─────────────────────────────
        this.positionTool = { enabled: false, mode: 'checkpoint', placed: [], markers: [] }
        this.yKey = this.input.keyboard.addKey('Y')
        this.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
        this.twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
        this.threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
        this.oKey = this.input.keyboard.addKey('O')
        this.posToolLabel = this.add.text(W / 2, 30, '', {
            fontSize: '14px', fill: '#ffff00', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setVisible(false)

        // ─── Enemy Base Viewer ─────────────────────────
        this.viewerOverlay = null
        this.createEnemyBaseViewer(500, 200)

        // ─── Intro dialog ──────────────────────────────
        if (!GameState.getFlag('enemyIntroSeen')) {
            this.time.delayedCall(100, () => {
                this.dialog.show([
                    { name: 'You', text: 'This is enemy territory...' },
                    { name: 'You', text: 'I need to be careful.' },
                    { name: 'You', text: 'The armor should protect me, but I\'m not invincible.' },
                    { name: '', text: 'WASD: Move | X: Shoot | LMB: Attack1 | SHIFT: Dash' },
                    { name: '', text: 'C: Shield | Q: High Jump | E: Attack2 | RMB: Attack3' }
                ], () => {
                    GameState.setFlag('enemyIntroSeen')
                })
            })
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── ENEMY BASE VIEWER ─────────────────────────────
    // ═══════════════════════════════════════════════════

    createEnemyBaseViewer(x, y) {
        this.enemyBaseObj = this.add.rectangle(x, y, 100, 100, 0x8888ff, 0.5)
            .setStrokeStyle(2, 0x8888ff).setDepth(5).setInteractive()
        this.enemyBaseLabel = this.add.text(x, y - 35, '🖥️ Intel', {
            fontSize: '12px', fill: '#8888ff'
        }).setOrigin(0.5).setDepth(5)
        this.viewerPrompt = this.add.text(x, y - 55, '[SPACE] View', {
            fontSize: '11px', fill: '#ffffff'
        }).setOrigin(0.5).setDepth(5).setVisible(false)
    }

    openEnemyBaseViewer() {
        if (this.viewerOverlay) return
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        const monW = Math.floor(W * 0.55)
        const monH = Math.floor(H * 0.55)
        const monX = Math.floor((W - monW) / 2)
        const monY = Math.floor((H - monH) / 2)

        // ─── Dark overlay ──────────────────────────────
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(900).setInteractive()

        // ─── Monitor frame ─────────────────────────────
        let frame
        if (this.textures.exists('monitor-frame')) {
            frame = this.add.image(W / 2, H / 2, 'monitor-frame')
                .setScrollFactor(0).setDepth(902)
            frame.setScale(Math.min((monW + 40) / frame.width, (monH + 40) / frame.height))
        } else {
            frame = this.add.rectangle(W / 2, H / 2, monW + 20, monH + 20, 0x000000, 0)
                .setStrokeStyle(4, 0x00ff88).setScrollFactor(0).setDepth(902)
        }

        // ─── Title + close hint ────────────────────────
        const title = this.add.text(W / 2, monY - 30, '📡 LIVE INTEL FEED', {
            fontSize: '18px', fill: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(903)

        const closeText = this.add.text(W / 2, monY + monH + 20, '[SPACE] Close Feed', {
            fontSize: '14px', fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(903)

        // ─── Live camera ───────────────────────────────
        this.viewerCam = this.cameras.add(monX, monY, monW, monH)
        this.viewerCam.setZoom(0.6)
        this.viewerCam.setBounds(0, 0, this.worldWidth, H)
        this.viewerCam.setScroll(2400, 300)
        this.viewerCam.setBackgroundColor('#000000')

        // ─── Collect ALL HUD/fixed objects to ignore on viewer cam ──
        const hudObjects = [
            // Viewer overlay elements
            overlay, frame, title, closeText,
            // Scene HUD indicators
            this.posToolLabel, this.controlsText,
            this.dashIndicator, this.meleeIndicator, this.shieldIndicator,
            this.highJumpIndicator, this.ability2Indicator, this.ability3Indicator,
            this.progressBarBg, this.progressBar, this.progressText,
            ...this.hearts,
            // Viewer interaction elements
            this.enemyBaseLabel, this.viewerPrompt
        ]

        // Add UI bar elements (top bar, stats, time icon, nav icons, etc.)
        if (this.ui) {
            const uiEls = [
                this.ui.bar, this.ui.statsText, this.ui.levelText,
                this.ui.crisisBarBg, this.ui.crisisBar, this.ui.crisisLabel,
                this.ui.dayText, this.ui.timeIcon,
                this.ui.hubIcon, this.ui.invIcon, this.ui.taskIcon,
                this.ui.dayPillTab, this.ui.dayPillText
            ]
            uiEls.forEach(el => { if (el) hudObjects.push(el) })
        }

        this.viewerCam.ignore(hudObjects.filter(obj => obj != null))

        this.viewerOverlay = { overlay, frame, title, closeText }
    }
    closeEnemyBaseViewer() {
        if (!this.viewerOverlay) return

        // Remove the live camera
        if (this.viewerCam) {
            this.cameras.remove(this.viewerCam)
            this.viewerCam = null
        }

        // Cleanup visuals
        Object.values(this.viewerOverlay).forEach(obj => { if (obj && obj.destroy) obj.destroy() })
        this.viewerOverlay = null
    }

    // ═══════════════════════════════════════════════════
    // ─── SLOPE ─────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    addSlopeZone(x, y, w, h, dir) {
        this.slopeZones.push({ x, y, w, h, dir, ratio: h / w })
    }

    applySlopePhysics() {
        if (!this.slopeZones || this.isDead) return
        this.slopeZones.forEach(zone => {
            const px = this.player.x
            const py = this.player.y
            const inZone = px > zone.x && px < zone.x + zone.w &&
                py > zone.y - zone.h - 20 && py < zone.y + 20
            if (inZone) {
                const velX = this.player.body.velocity.x
                if (Math.abs(velX) > 10) {
                    const moveDir = velX > 0 ? 1 : -1
                    if (moveDir === zone.dir) {
                        this.player.body.setVelocityY(-Math.abs(velX * zone.ratio) * 1.1)
                    } else {
                        this.player.body.setVelocityY(Math.abs(velX * zone.ratio) * 0.5)
                    }
                }
            }
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── LADDER ────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    createLadder(x, y, w, h) {
        this.ladderZones.push({ x: x - w / 2, y: y - h, w, h })
        this.add.rectangle(x, y - h / 2, w, h, 0x00ff00, 0.3)
            .setStrokeStyle(2, 0x00ff00)
            .setDepth(1)
    }

    // ═══════════════════════════════════════════════════
    // ─── ANIMATIONS ────────────────────────────────────
    // ═══════════════════════════════════════════════════

    createAnimations() {
        if (!this.anims.exists('enemy-idle')) {
            this.anims.create({ key: 'enemy-idle', frames: this.anims.generateFrameNumbers('enemy-idle', { start: 0, end: 3 }), frameRate: 6, repeat: -1 })
        }
        if (!this.anims.exists('enemy-walk')) {
            this.anims.create({ key: 'enemy-walk', frames: this.anims.generateFrameNumbers('enemy-walk', { start: 0, end: 5 }), frameRate: 8, repeat: -1 })
        }
        if (!this.anims.exists('enemy-attack')) {
            this.anims.create({ key: 'enemy-attack', frames: this.anims.generateFrameNumbers('enemy-attack', { start: 0, end: 5 }), frameRate: 10, repeat: 0 })
        }
        if (!this.anims.exists('enemy-hurt')) {
            this.anims.create({ key: 'enemy-hurt', frames: this.anims.generateFrameNumbers('enemy-hurt', { start: 0, end: 1 }), frameRate: 8, repeat: 0 })
        }
        if (!this.anims.exists('enemy-dead')) {
            this.anims.create({ key: 'enemy-dead', frames: this.anims.generateFrameNumbers('enemy-dead', { start: 0, end: 5 }), frameRate: 10, repeat: 0 })
        }
        if (this.anims.exists('player-idle')) return
        this.anims.create({ key: 'player-idle', frames: this.anims.generateFrameNumbers('player-idle', { start: 0, end: 5 }), frameRate: 8, repeat: -1 })
        this.anims.create({ key: 'player-walk', frames: this.anims.generateFrameNumbers('player-walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 })
        this.anims.create({ key: 'player-run', frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 7 }), frameRate: 12, repeat: -1 })
        this.anims.create({ key: 'player-jump', frames: this.anims.generateFrameNumbers('player-jump', { start: 0, end: 11 }), frameRate: 14, repeat: 0 })
        this.anims.create({ key: 'player-attack', frames: this.anims.generateFrameNumbers('player-attack', { start: 0, end: 5 }), frameRate: 14, repeat: 0 })
        this.anims.create({ key: 'player-shield', frames: this.anims.generateFrameNumbers('player-shield', { start: 0, end: 1 }), frameRate: 8, repeat: 0 })
        this.anims.create({ key: 'player-hurt', frames: this.anims.generateFrameNumbers('player-hurt', { start: 0, end: 1 }), frameRate: 8, repeat: 0 })
        this.anims.create({ key: 'player-dead', frames: this.anims.generateFrameNumbers('player-dead', { start: 0, end: 2 }), frameRate: 6, repeat: 0 })
        this.anims.create({ key: 'player-attack2', frames: this.anims.generateFrameNumbers('player-attack2', { start: 0, end: 3 }), frameRate: 12, repeat: 0 })
        this.anims.create({ key: 'player-attack3', frames: this.anims.generateFrameNumbers('player-attack3', { start: 0, end: 2 }), frameRate: 12, repeat: 0 })
    }

    // ═══════════════════════════════════════════════════
    // ─── UPDATE ────────────────────────────────────────
    // ═══════════════════════════════════════════════════
    update() {

        // ─── Position Tool ─────────────────────────────
        if (Phaser.Input.Keyboard.JustDown(this.yKey)) {
            this.positionTool.enabled = !this.positionTool.enabled
            this.posToolLabel.setVisible(this.positionTool.enabled)
            if (this.positionTool.enabled) {
                this.posToolLabel.setText(`[PosTool] Mode: ${this.positionTool.mode}`)
            
            }
        }
        if (this.positionTool.enabled) {
            if (Phaser.Input.Keyboard.JustDown(this.oneKey)) { this.positionTool.mode = 'checkpoint'; this.posToolLabel.setText('[PosTool] Mode: checkpoint') }
            if (Phaser.Input.Keyboard.JustDown(this.twoKey)) { this.positionTool.mode = 'exit'; this.posToolLabel.setText('[PosTool] Mode: exit') }
            if (Phaser.Input.Keyboard.JustDown(this.threeKey)) { this.positionTool.mode = 'ladder'; this.posToolLabel.setText('[PosTool] Mode: ladder') }
            if (Phaser.Input.Keyboard.JustDown(this.oKey)) {
                //this.positionTool.placed.forEach(p => console.log(`  ${p.mode}: (${p.x}, ${p.y})`))
            }
        }

        // ─── Enemy Base Viewer ─────────────────────────
        if (this.enemyBaseObj) {
            const distToViewer = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.enemyBaseObj.x, this.enemyBaseObj.y
            )
            this.viewerPrompt.setVisible(distToViewer < 80 && !this.viewerOverlay)
            if (this.viewerOverlay) {
                if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                    this.closeEnemyBaseViewer()
                    return
                }
                return
            }
            if (distToViewer < 80 && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.openEnemyBaseViewer()
                return
            }
        }

        // ─── Ladder ────────────────────────────────────
        this.isOnLadder = false
        if (this.ladderZones) {
            this.ladderZones.forEach(zone => {
                if (this.player.x > zone.x && this.player.x < zone.x + zone.w &&
                    this.player.y > zone.y && this.player.y < zone.y + zone.h) {
                    this.isOnLadder = true
                }
            })
        }

        if (this.isOnLadder) {
            this.player.body.setAllowGravity(false)
            this.player.body.setVelocityX(0)
            this.player.body.setVelocityY(0)
            const climbSpeed = 200
            if (this.cursors.up.isDown || this.wasd.up.isDown) { this.player.body.setVelocityY(-climbSpeed); this.player.play('player-walk', true) }
            else if (this.cursors.down.isDown || this.wasd.down.isDown) { this.player.body.setVelocityY(climbSpeed); this.player.play('player-walk', true) }
            else { this.player.play('player-idle', true) }
            if (this.cursors.left.isDown || this.wasd.left.isDown) { this.player.body.setVelocityX(-150); this.player.setFlipX(true); this.player.facing = -1 }
            else if (this.cursors.right.isDown || this.wasd.right.isDown) { this.player.body.setVelocityX(150); this.player.setFlipX(false); this.player.facing = 1 }
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) { this.player.body.setAllowGravity(true); this.player.body.setVelocityY(-400) }
            this.updateEnemies(); this.cleanupBullets(); this.updateProgress()
            return
        }

        this.player.body.setAllowGravity(true)
        if (this.isDead) return

        if (this.dialog && this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.next()
            this.player.body.setVelocityX(0)
            return
        }

        if (this.isDashing) { this.updateEnemies(); this.cleanupBullets(); this.updateProgress(); return }
        if (this.isAttacking || this.isMeleeAttacking || this.isUsingAbility) { this.updateEnemies(); this.cleanupBullets(); this.updateProgress(); return }

        if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) { this.dash(); return }
        if (Phaser.Input.Keyboard.JustDown(this.cKey) && this.canShield && !this.isDead) { this.useShield(); return }
        if (Phaser.Input.Keyboard.JustDown(this.qKey) && this.canHighJump && this.player.body.onFloor()) { this.useHighJump() }
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.canAbility2 && !this.isDead) { this.useAbility2(); return }

        const speed = 300
        this.player.body.setVelocityX(0)
        let moving = false

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.body.setVelocityX(-speed); this.player.setFlipX(true); this.player.facing = -1; moving = true
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.body.setVelocityX(speed); this.player.setFlipX(false); this.player.facing = 1; moving = true
        }

        if ((this.cursors.up.isDown || this.wasd.up.isDown) && this.player.body.onFloor()) {
            this.player.body.setVelocityY(-600)
        }

        if (Phaser.Input.Keyboard.JustDown(this.fireKey) && this.canShoot) this.rangedAttack()

        this.applySlopePhysics()

        if (!this.player.body.onFloor()) this.player.play('player-jump', true)
        else if (moving) this.player.play('player-run', true)
        else this.player.play('player-idle', true)

        this.updateEnemies()
        this.cleanupBullets()
        this.updateHearts()
        this.updateProgress()
    }

    // ═══════════════════════════════════════════════════
    // ─── SHIELD ────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    useShield() {
        if (this.isShielding || !this.canShield) return
        this.isShielding = true; this.canShield = false; this.isInvincible = true; this.isUsingAbility = true
        this.player.play('player-shield', true)
        this.shieldIndicator.setText('🛡️ ACTIVE...'); this.shieldIndicator.setFill('#ffffff')
        this.player.once('animationcomplete-player-shield', () => { this.isUsingAbility = false })
        this.time.delayedCall(this.shieldDuration, () => {
            this.isShielding = false; this.isInvincible = false; this.isUsingAbility = false
            this.shieldIndicator.setText('🛡️ COOLDOWN'); this.shieldIndicator.setFill('#666666')
        })
        this.time.delayedCall(this.shieldCooldown, () => {
            this.canShield = true; this.shieldIndicator.setText('🛡️ SHIELD [C]'); this.shieldIndicator.setFill('#4488ff')
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── HIGH JUMP ─────────────────────────────────────
    // ═══════════════════════════════════════════════════

    useHighJump() {
        if (!this.canHighJump) return
        this.canHighJump = false
        this.player.body.setVelocityY(-700)
        this.highJumpIndicator.setText('🚀 COOLDOWN'); this.highJumpIndicator.setFill('#666666')
        for (let i = 0; i < 8; i++) {
            const trail = this.add.circle(this.player.x + Phaser.Math.Between(-15, 15), this.player.y + 30 + (i * 10), Phaser.Math.Between(3, 8), 0xff44ff, 0.6).setDepth(9)
            this.tweens.add({ targets: trail, y: trail.y + 40, alpha: 0, scale: 0, duration: 400, delay: i * 30, onComplete: () => trail.destroy() })
        }
        this.cameras.main.shake(50, 0.005)
        this.time.delayedCall(this.highJumpCooldown, () => {
            this.canHighJump = true; this.highJumpIndicator.setText('🚀 HIGH JUMP [Q]'); this.highJumpIndicator.setFill('#ff44ff')
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── ATTACK 2 ──────────────────────────────────────
    // ═══════════════════════════════════════════════════

    useAbility2() {
        if (!this.canAbility2 || this.isDead) return
        this.canAbility2 = false; this.isUsingAbility = true
        this.ability2Indicator.setText('⚔️ COOLDOWN'); this.ability2Indicator.setFill('#666666')
        this.player.play('player-attack2', true)
        this.player.body.setVelocityX(this.player.facing * 200)
        this.time.delayedCall(150, () => {
            if (this.isDead) return
            const direction = this.player.facing
            const hitX = this.player.x + (direction * 130)
            const hitY = this.player.y - 10
            const hitbox = this.add.rectangle(hitX, hitY, 140, 90, 0xffaa00, 0).setDepth(15)
            this.physics.add.existing(hitbox); hitbox.body.setAllowGravity(false)
            const arc = this.add.graphics().setDepth(12); arc.lineStyle(4, 0xffaa00, 0.8)
            if (direction === 1) { arc.beginPath(); arc.arc(this.player.x + 20, this.player.y - 10, 110, Phaser.Math.DegToRad(-70), Phaser.Math.DegToRad(70), false); arc.strokePath() }
            else { arc.beginPath(); arc.arc(this.player.x - 20, this.player.y - 10, 110, Phaser.Math.DegToRad(110), Phaser.Math.DegToRad(250), false); arc.strokePath() }
            this.physics.add.overlap(hitbox, this.enemies, (hb, enemy) => {
                if (!enemy.active) return
                enemy.hp -= 2; enemy.play('enemy-hurt', true)
                enemy.once('animationcomplete-enemy-hurt', () => { if (enemy.active) enemy.play(enemy.enemyType === 'patrol' ? 'enemy-walk' : 'enemy-idle', true) })
                enemy.body.setVelocityX(direction * 350); enemy.body.setVelocityY(-120)
                this.cameras.main.shake(60, 0.006)
                if (enemy.hp <= 0) this.enemyDeath(enemy)
            })
            this.time.delayedCall(150, () => { hitbox.destroy(); arc.destroy() })
        })
        this.player.once('animationcomplete-player-attack2', () => { this.isUsingAbility = false })
        this.time.delayedCall(600, () => { this.isUsingAbility = false })
        this.time.delayedCall(this.ability2Cooldown, () => { this.canAbility2 = true; this.ability2Indicator.setText('⚔️ ATTACK 2 [E]'); this.ability2Indicator.setFill('#ffaa00') })
    }

    // ═══════════════════════════════════════════════════
    // ─── ATTACK 3 ──────────────────────────────────────
    // ═══════════════════════════════════════════════════

    useAbility3() {
        if (!this.canAbility3 || this.isDead) return
        this.canAbility3 = false; this.isUsingAbility = true
        this.ability3Indicator.setText('💥 COOLDOWN'); this.ability3Indicator.setFill('#666666')
        this.player.play('player-attack3', true)
        this.player.body.setVelocityX(this.player.facing * 250)
        this.time.delayedCall(100, () => {
            if (this.isDead) return
            const direction = this.player.facing
            const hitX = this.player.x + (direction * 150)
            const hitY = this.player.y - 10
            const hitbox = this.add.rectangle(hitX, hitY, 160, 100, 0xff4444, 0).setDepth(15)
            this.physics.add.existing(hitbox); hitbox.body.setAllowGravity(false)
            const arc = this.add.graphics().setDepth(12); arc.lineStyle(5, 0xff4444, 0.9)
            if (direction === 1) { arc.beginPath(); arc.arc(this.player.x + 30, this.player.y - 10, 130, Phaser.Math.DegToRad(-80), Phaser.Math.DegToRad(80), false); arc.strokePath() }
            else { arc.beginPath(); arc.arc(this.player.x - 30, this.player.y - 10, 130, Phaser.Math.DegToRad(100), Phaser.Math.DegToRad(260), false); arc.strokePath() }
            for (let i = 0; i < 8; i++) {
                const spark = this.add.rectangle(hitX + Phaser.Math.Between(-50, 50), hitY + Phaser.Math.Between(-40, 40), Phaser.Math.Between(4, 10), Phaser.Math.Between(2, 4), 0xff4444, 0.8).setDepth(13)
                this.tweens.add({ targets: spark, x: spark.x + (direction * Phaser.Math.Between(30, 80)), y: spark.y + Phaser.Math.Between(-30, 30), alpha: 0, duration: 250, onComplete: () => spark.destroy() })
            }
            this.physics.add.overlap(hitbox, this.enemies, (hb, enemy) => {
                if (!enemy.active) return
                enemy.hp -= 3; enemy.play('enemy-hurt', true)
                enemy.once('animationcomplete-enemy-hurt', () => { if (enemy.active) enemy.play(enemy.enemyType === 'patrol' ? 'enemy-walk' : 'enemy-idle', true) })
                enemy.body.setVelocityX(direction * 500); enemy.body.setVelocityY(-200)
                this.cameras.main.shake(100, 0.01)
                if (enemy.hp <= 0) this.enemyDeath(enemy)
            })
            this.time.delayedCall(180, () => { hitbox.destroy(); arc.destroy() })
        })
        this.player.once('animationcomplete-player-attack3', () => { this.isUsingAbility = false })
        this.time.delayedCall(500, () => { this.isUsingAbility = false })
        this.time.delayedCall(this.ability3Cooldown, () => { this.canAbility3 = true; this.ability3Indicator.setText('💥 ATTACK 3 [RMB]'); this.ability3Indicator.setFill('#ff4444') })
    }

    // ═══════════════════════════════════════════════════
    // ─── MELEE ─────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    meleeAttack() {
        if (!this.canMelee || this.isMeleeAttacking || this.isDashing || this.isUsingAbility) return
        this.isMeleeAttacking = true; this.canMelee = false
        this.player.play('player-attack', true)
        this.player.body.setVelocityX(this.player.facing * 150)
        this.meleeIndicator.setText('🗡️ COOLDOWN'); this.meleeIndicator.setFill('#666666')
        this.time.delayedCall(100, () => {
            if (this.isDead) return
            const direction = this.player.facing
            const slashX = this.player.x + (direction * this.meleeRange)
            const slashY = this.player.y - 10
            this.katanaHitbox = this.add.rectangle(slashX, slashY, this.meleeRange, 80, 0xff8800, 0).setDepth(15)
            this.physics.add.existing(this.katanaHitbox); this.katanaHitbox.body.setAllowGravity(false)
            const slashArc = this.add.graphics().setDepth(12); slashArc.lineStyle(3, 0xffffff, 0.9)
            if (direction === 1) { slashArc.beginPath(); slashArc.arc(this.player.x + 20, this.player.y - 10, this.meleeRange - 20, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false); slashArc.strokePath() }
            else { slashArc.beginPath(); slashArc.arc(this.player.x - 20, this.player.y - 10, this.meleeRange - 20, Phaser.Math.DegToRad(120), Phaser.Math.DegToRad(240), false); slashArc.strokePath() }
            for (let i = 0; i < 5; i++) {
                const sparkX = slashX + Phaser.Math.Between(-40, 40)
                const sparkY = slashY + Phaser.Math.Between(-30, 30)
                const spark = this.add.rectangle(sparkX, sparkY, Phaser.Math.Between(3, 8), Phaser.Math.Between(1, 3), 0xff8800, 0.8).setDepth(13)
                this.tweens.add({ targets: spark, x: sparkX + (direction * Phaser.Math.Between(20, 60)), y: sparkY + Phaser.Math.Between(-20, 20), alpha: 0, duration: 200, onComplete: () => spark.destroy() })
            }
            this.physics.add.overlap(this.katanaHitbox, this.enemies, this.katanaHitEnemy, null, this)
            this.time.delayedCall(120, () => { if (this.katanaHitbox) { this.katanaHitbox.destroy(); this.katanaHitbox = null } slashArc.destroy() })
        })
        this.player.once('animationcomplete-player-attack', () => { this.isMeleeAttacking = false })
        this.time.delayedCall(400, () => { this.isMeleeAttacking = false })
        this.time.delayedCall(this.meleeCooldown, () => { this.canMelee = true; this.meleeIndicator.setText('🗡️ ATTACK 1 [LMB]'); this.meleeIndicator.setFill('#ff8800') })
    }

    katanaHitEnemy(hitbox, enemy) {
        if (!enemy.active) return
        enemy.hp -= this.meleeDamage
        enemy.play('enemy-hurt', true)
        enemy.once('animationcomplete-enemy-hurt', () => { if (enemy.active) enemy.play(enemy.enemyType === 'patrol' ? 'enemy-walk' : 'enemy-idle', true) })
        const knockDir = this.player.facing
        enemy.body.setVelocityX(knockDir * 400); enemy.body.setVelocityY(-150)
        for (let i = 0; i < 6; i++) {
            const spark = this.add.rectangle(enemy.x + Phaser.Math.Between(-10, 10), enemy.y + Phaser.Math.Between(-15, 15), 4, 4, 0xffff00).setDepth(16)
            this.tweens.add({ targets: spark, x: spark.x + Phaser.Math.Between(-40, 40), y: spark.y + Phaser.Math.Between(-40, 40), alpha: 0, duration: 250, onComplete: () => spark.destroy() })
        }
        this.cameras.main.shake(80, 0.008)
        if (enemy.hp <= 0) this.enemyDeath(enemy)
    }

    // ═══════════════════════════════════════════════════
    // ─── RANGED ────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    rangedAttack() {
        this.isAttacking = true; this.canShoot = false
        this.player.play('player-attack', true)
        this.time.delayedCall(150, () => {
            if (this.isDead) return
            const direction = this.player.facing
            const bullet = this.add.rectangle(this.player.x + (direction * 50), this.player.y - 10, 12, 6, 0xffff00)
            this.physics.add.existing(bullet); bullet.body.setVelocityX(direction * 600); bullet.body.setAllowGravity(false)
            this.bullets.add(bullet)
            const flash = this.add.circle(this.player.x + (direction * 55), this.player.y - 10, 8, 0xffff00, 0.8).setDepth(11)
            this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 100, onComplete: () => flash.destroy() })
        })
        this.player.once('animationcomplete-player-attack', () => { this.isAttacking = false })
        this.time.delayedCall(500, () => { this.isAttacking = false })
        this.time.delayedCall(this.shootCooldown, () => { this.canShoot = true })
    }

    // ═══════════════════════════════════════════════════
    // ─── DASH ──────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    dash() {
        if (!this.canDash || this.isDashing) return
        this.isDashing = true; this.canDash = false; this.isInvincible = true
        const direction = this.player.facing
        this.player.body.setVelocityX(direction * this.dashSpeed); this.player.body.setVelocityY(0)
        this.player.play('player-shield', true); this.player.setTint(0x00ffff); this.player.setAlpha(0.7)
        this.dashIndicator.setText('⚡ COOLDOWN'); this.dashIndicator.setFill('#666666')
        const trail = this.add.rectangle(this.player.x, this.player.y, 64, 96, 0x00ffff, 0.3).setDepth(this.player.depth - 1)
        this.tweens.add({ targets: trail, alpha: 0, scaleX: 2, duration: 300, onComplete: () => trail.destroy() })
        this.time.delayedCall(this.dashDuration, () => { this.isDashing = false; this.isInvincible = false; this.player.clearTint(); this.player.setAlpha(1) })
        this.time.delayedCall(this.dashCooldown, () => { this.canDash = true; this.dashIndicator.setText('⚡ DASH [SHIFT]'); this.dashIndicator.setFill('#00ffff') })
    }

    // ═══════════════════════════════════════════════════
    // ─── DAMAGE ────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    playerHit(player, bullet) { if (this.isInvincible || this.isDead) return; bullet.destroy(); this.takeDamage() }
    playerTouchEnemy(player, enemy) { if (this.isInvincible || this.isDead) return; this.takeDamage() }
    playerHitSpikes(player, spike) { if (this.isInvincible || this.isDead) return; this.takeDamage() }

    takeDamage() {
        this.playerHP--; this.isInvincible = true
        this.player.play('player-hurt', true); this.player.setTint(0xff0000)
        this.cameras.main.shake(100, 0.01)
        const screenFlash = this.add.rectangle(
            this.cameras.main.scrollX + this.cameras.main.width / 2,
            this.cameras.main.scrollY + this.cameras.main.height / 2,
            this.cameras.main.width, this.cameras.main.height, 0xff0000, 0.3
        ).setDepth(999).setScrollFactor(0)
        this.tweens.add({ targets: screenFlash, alpha: 0, duration: 200, onComplete: () => screenFlash.destroy() })
        const knockDir = this.player.facing === -1 ? 1 : -1
        this.player.body.setVelocityX(knockDir * 300); this.player.body.setVelocityY(-200)
        this.updateHearts()
        if (this.playerHP <= 0) { this.playerDie(); return }
        let blinkCount = 0
        this.time.addEvent({ delay: 100, repeat: 9, callback: () => { blinkCount++; this.player.setAlpha(blinkCount % 2 === 0 ? 1 : 0.3) } })
        this.time.delayedCall(this.invincibleDuration, () => { this.isInvincible = false; this.player.clearTint(); this.player.setAlpha(1) })
    }

    playerDie() {
        this.isDead = true
        this.player.play('player-dead', true); this.player.setTint(0x444444); this.player.setAlpha(0.5); this.player.body.setVelocity(0, 0)
        this.cameras.main.shake(300, 0.02)
        const W = this.cameras.main.width; const H = this.cameras.main.height
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setScrollFactor(0).setDepth(998)
        const deathText = this.add.text(W / 2, H / 2 - 30, '💀 DEFEATED', { fontSize: '48px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(999)
        const respawnText = this.add.text(W / 2, H / 2 + 30, 'Respawning...', { fontSize: '20px', fill: '#888888' }).setOrigin(0.5).setScrollFactor(0).setDepth(999)
        this.time.delayedCall(2000, () => { overlay.destroy(); deathText.destroy(); respawnText.destroy(); this.respawn() })
    }

    respawn() {
        this.isDead = false; this.playerHP = this.maxHP; this.isInvincible = false
        this.isAttacking = false; this.isMeleeAttacking = false; this.isUsingAbility = false
        this.player.setPosition(this.lastCheckpoint.x, this.lastCheckpoint.y)
        this.player.clearTint(); this.player.setAlpha(1); this.player.body.setVelocity(0, 0)
        this.player.play('player-idle'); this.updateHearts()
        this.cameras.main.flash(300, 0, 255, 100)
    }

    updateHearts() {
        for (let i = 0; i < this.maxHP; i++) {
            this.hearts[i].setTexture(i < this.playerHP ? 'heart-full' : 'heart-empty')
        }
    }

    updateProgress() {
        const W = this.cameras.main.width
        const maxBarWidth = W - 200
        const progress = Math.min(1, this.player.x / this.worldWidth)
        this.progressBar.width = maxBarWidth * progress
        this.progressText.setText(`${Math.floor(progress * 100)}%`)
        if (progress > 0.8) this.progressBar.setFillStyle(0x00ff88)
        else if (progress > 0.4) this.progressBar.setFillStyle(0xffaa00)
        else this.progressBar.setFillStyle(0xff4444)
    }

    // ═══════════════════════════════════════════════════
    // ─── ENEMIES ───────────────────────────────────────
    // ═══════════════════════════════════════════════════

    createEnemy(x, y, type, patrolRange) {
        const enemy = this.physics.add.sprite(x, y, 'enemy-idle').setScale(2.66).setDepth(5)
        enemy.body.setSize(32, 44); enemy.body.setOffset(32, 48)
        enemy.body.setCollideWorldBounds(true); enemy.body.setGravityY(600)
        this.enemies.add(enemy)
        enemy.enemyType = type; enemy.startX = x; enemy.patrolRange = patrolRange
        enemy.hp = 2; enemy.direction = 1; enemy.shootTimer = 0; enemy.shootInterval = 2000; enemy.isAttacking = false
        enemy.play('enemy-idle')
        return enemy
    }

    updateEnemies() {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return
            if (enemy.enemyType === 'patrol') {
                if (!enemy.isAttacking) { enemy.body.setVelocityX(enemy.direction * 100); enemy.setFlipX(enemy.direction === -1); enemy.play('enemy-walk', true) }
                if (enemy.x > enemy.startX + enemy.patrolRange) enemy.direction = -1
                else if (enemy.x < enemy.startX - enemy.patrolRange) enemy.direction = 1
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y)
                if (dist < 100 && !enemy.isAttacking) {
                    enemy.isAttacking = true; enemy.body.setVelocityX(0); enemy.play('enemy-attack', true)
                    enemy.once('animationcomplete-enemy-attack', () => { enemy.isAttacking = false })
                    this.time.delayedCall(600, () => { enemy.isAttacking = false })
                }
            } else if (enemy.enemyType === 'shooter') {
                enemy.body.setVelocityX(0)
                if (!enemy.isAttacking) enemy.play('enemy-idle', true)
                enemy.setFlipX(this.player.x < enemy.x)
                enemy.shootTimer += this.game.loop.delta
                if (enemy.shootTimer >= enemy.shootInterval) {
                    enemy.shootTimer = 0; enemy.isAttacking = true; enemy.play('enemy-attack', true)
                    this.time.delayedCall(300, () => { if (enemy.active) this.enemyShoot(enemy) })
                    enemy.once('animationcomplete-enemy-attack', () => { enemy.isAttacking = false })
                    this.time.delayedCall(600, () => { enemy.isAttacking = false })
                }
            }
        })
    }

    enemyShoot(enemy) {
        const dx = this.player.x - enemy.x; const dy = this.player.y - enemy.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 500) return
        const speed = 300
        const bullet = this.add.circle(enemy.x, enemy.y, 6, 0xff0000)
        this.physics.add.existing(bullet); bullet.body.setAllowGravity(false)
        bullet.body.setVelocity((dx / dist) * speed, (dy / dist) * speed)
        this.enemyBullets.add(bullet)
    }

    bulletHitEnemy(bullet, enemy) {
        bullet.destroy(); enemy.hp--
        enemy.play('enemy-hurt', true)
        enemy.once('animationcomplete-enemy-hurt', () => { if (enemy.active) enemy.play(enemy.enemyType === 'patrol' ? 'enemy-walk' : 'enemy-idle', true) })
        if (enemy.hp <= 0) this.enemyDeath(enemy)
    }

    enemyDeath(enemy) {
        enemy.body.setVelocity(0, 0); enemy.body.setAllowGravity(false)
        this.enemies.remove(enemy); enemy.play('enemy-dead', true)
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(enemy.x + Phaser.Math.Between(-10, 10), enemy.y + Phaser.Math.Between(-10, 10), Phaser.Math.Between(3, 6), 0xff4444).setDepth(15)
            this.tweens.add({ targets: particle, x: particle.x + Phaser.Math.Between(-60, 60), y: particle.y + Phaser.Math.Between(-80, -20), alpha: 0, duration: 500, onComplete: () => particle.destroy() })
        }
        const scoreText = this.add.text(enemy.x, enemy.y - 20, '+50', { fontSize: '18px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20)
        this.tweens.add({ targets: scoreText, y: scoreText.y - 50, alpha: 0, duration: 800, onComplete: () => scoreText.destroy() })
        enemy.once('animationcomplete-enemy-dead', () => { enemy.destroy() })
        this.time.delayedCall(800, () => { if (enemy.active) enemy.destroy() })
    }

    // ═══════════════════════════════════════════════════
    // ─── HAZARDS ───────────────────────────────────────
    // ═══════════════════════════════════════════════════

    createSpikes(x, y, width, height) {
        const spike = this.add.rectangle(x, y, width, height, 0xff0000, 0.6).setStrokeStyle(1, 0xff0000)
        this.physics.add.existing(spike, true); this.spikes.add(spike)
        const triangleCount = Math.floor(width / 15)
        for (let i = 0; i < triangleCount; i++) {
            const tx = x - width / 2 + (i * 15) + 7
            this.add.triangle(tx, y - 12, 0, 12, 6, 0, 12, 12, 0xff0000, 0.8).setDepth(1)
        }
        this.add.text(x, y - 25, '⚠️', { fontSize: '14px' }).setOrigin(0.5).setDepth(2)
        return spike
    }

    // ═══════════════════════════════════════════════════
    // ─── CHECKPOINTS ───────────────────────────────────
    // ═══════════════════════════════════════════════════

    createCheckpoint(x, y, w = 20, h = 60) {
        const cpIndex = this.checkpoints.length

        // Photoshop values:
        // x, y = top-left
        // w, h = size
        const sx = this.bg.scaleX || 1
        const sy = this.bg.scaleY || 1

        let worldX = x * sx
        let worldY = y * sy
        const worldW = w * sx
        const worldH = h * sy

        // global calibration
        worldX += this.checkpointOffsetX || 0
        worldY += this.checkpointOffsetY || 0

        const centerX = worldX + worldW / 2
        const centerY = worldY + worldH / 2

        const cp = this.add.rectangle(centerX, centerY, worldW, worldH, 0xff4444, 0.85)
            .setStrokeStyle(2, 0xff4444)
            .setDepth(3)

        this.physics.add.existing(cp, true)

        const flag = this.add.text(centerX, worldY - 20, '🏁', {
            fontSize: '24px',
            fill: '#ff4444'
        }).setOrigin(0.5).setDepth(4)

        this.physics.add.overlap(this.player, cp, () => {
            if (this.visitedCheckpoints.has(cpIndex)) return

            this.lastCheckpoint = {
                x: centerX,
                y: worldY - 30
            }

            cp.setFillStyle(0x00ff88, 0.8)
            cp.setStrokeStyle(2, 0x00ff88)
            flag.setColor('#00ff88')
            flag.setScale(1.3)

            this.playerHP = this.maxHP
            this.updateHearts()

            this.visitedCheckpoints.add(cpIndex)
            this.checkExitLock()

            const saved = this.add.text(centerX, worldY - 45, '✅ Checkpoint! HP restored', {
                fontSize: '14px',
                fill: '#00ff88'
            }).setOrigin(0.5).setDepth(20)

            this.tweens.add({
                targets: saved,
                y: saved.y - 30,
                alpha: 0,
                duration: 1500,
                onComplete: () => saved.destroy()
            })
        })

        this.checkpoints.push({ cp, flag, x: worldX, y: worldY, w: worldW, h: worldH })
    }

    checkExitLock() {
        if (this.visitedCheckpoints.size >= this.totalCheckpoints) {
            this.exitLocked = false
            this.exitZone.setFillStyle(0x00ff88, 0.3).setStrokeStyle(2, 0x00ff88)
            this.exitText.setText('🚪 EXIT').setFill('#00ff88')
            const unlockMsg = this.add.text(this.player.x, this.player.y - 80, '🔓 EXIT UNLOCKED!', {
                fontSize: '16px', fill: '#00ff88', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(20)
            this.tweens.add({ targets: unlockMsg, y: unlockMsg.y - 40, alpha: 0, duration: 2000, onComplete: () => unlockMsg.destroy() })
        }
    }

    createPlatform(x, y, w, h) {
        const platform = this.add.rectangle(x, y, w, h, 0x000000, 0)
        this.physics.add.existing(platform, true); this.platforms.add(platform)
        return platform
    }

    cleanupBullets() {
        const bounds = this.physics.world.bounds
        this.bullets.getChildren().forEach(bullet => {
            if (bullet.x < bounds.x - 50 || bullet.x > bounds.right + 50 || bullet.y < bounds.y - 50 || bullet.y > bounds.bottom + 50) bullet.destroy()
        })
        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.x < bounds.x - 50 || bullet.x > bounds.right + 50 || bullet.y < bounds.y - 50 || bullet.y > bounds.bottom + 50) bullet.destroy()
        })
    }

    reachExit() {
        if (this.isDead) return
        if (this.exitLocked) {
            if (!this._exitLockedMsgTime || this.time.now - this._exitLockedMsgTime > 2000) {
                this._exitLockedMsgTime = this.time.now
                const remaining = this.totalCheckpoints - this.visitedCheckpoints.size
                const msg = this.add.text(this.player.x, this.player.y - 80,
                    `🔒 Visit all checkpoints first! (${remaining} remaining)`, {
                    fontSize: '14px', fill: '#ff4444', fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(20)
                this.tweens.add({ targets: msg, y: msg.y - 40, alpha: 0, duration: 1500, onComplete: () => msg.destroy() })
            }
            return
        }
        this.physics.pause()
        this.dialog.show([
            { name: 'You', text: 'I made it through...' },
            { name: 'You', text: 'Now I know what we\'re up against.' },
            { name: '', text: '✅ Enemy Territory cleared!' }
        ], () => {
            GameState.setFlag('enemyTerritoryCleared')
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => { this.scene.start('HubScene') })
        })
    }
}