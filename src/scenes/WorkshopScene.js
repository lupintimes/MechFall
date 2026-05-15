import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class WorkshopScene extends Phaser.Scene {
    constructor() {
        super('WorkshopScene')
    }



    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        

        // ─── UI ────────────────────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Dialog (MUST be before any dialog.show calls) ─
        this.dialog = new DialogBox(this)

        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => { if (this.ui) this.ui.destroy() })

        // ─── Background (time-based) ───────────────────
        const bgKey = {
            'morning': 'workshop-morning',
            'afternoon': 'workshop-noon',
            'evening': 'workshop-evening',
            'night': 'workshop-night'
        }[GameState.timeOfDay] || 'workshop-morning'

        this.bg = this.add.image(0, 0, bgKey)
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        const scaledWidth = this.bg.width * scaleY
        this.physics.world.setBounds(0, 0, scaledWidth, H)
        this.cameras.main.setBounds(0, 0, scaledWidth, H)

        this.cameras.main.fadeIn(300, 0, 0, 0)

        // ─── Stations ──────────────────────────────────
        this.stations = [
            {
                rect: this.add.rectangle(820, 800, 700, 600, 0x8b4513)
                    .setDepth(1).setAlpha(0),
                label: this.add.text(720, 500, '🔧 Hardware Bench', {
                    fontSize: '22px', fill: '#fff'
                }).setDepth(2),
                lockLabel: null,
                name: 'Hardware Bench',
                cooldown: false,
                locked: false
            },
            {
                rect: this.add.rectangle(1930, 800, 700, 600, 0x555577)
                    .setDepth(1).setAlpha(0),
                label: this.add.text(1830, 500, '⚡ Electrical Bench', {
                    fontSize: '22px', fill: '#fff'
                }).setDepth(2),
                lockLabel: null,
                name: 'Electrical Bench',
                cooldown: false,
                locked: !GameState.getFlag('electricalUnlocked')
            },
            {
                rect: this.add.rectangle(3250, 800, 1200, 600, 0x9b59b6)
                    .setDepth(1).setAlpha(0),
                label: this.add.text(3100, 500, '🔮 Magical Bench', {
                    fontSize: '22px', fill: '#fff'
                }).setDepth(2),
                lockLabel: null,
                name: 'Magical Bench',
                cooldown: false,
                locked: false
            }
        ]

        // ─── Lock visual on electrical ─────────────────
        if (this.stations[1].locked) {
            this.stations[1].rect.setAlpha(0)
            const bgScale = this.bg.scaleX
            this.stations[1].lockOverlay = this.add.image(2008, 730.00, 'lock-overlay')
                .setOrigin(0.5, 0.5)
                .setScale(bgScale)
                .setDepth(2)
                .setAlpha(0.8)
            this.stations[1].lockLabel = this.add.text(
                1830, 550, '🔒 Need 5 repair skill', {
                fontSize: '18px',
                fill: '#ff4444'
            }).setDepth(3)
        }

        // ─── Current bench index ───────────────────────
        this.currentBenchIndex = 0

        // ─── Navigation Arrows ─────────────────────────
        const arrowScale = 0.5
        const arrowY = H / 2

        this.leftArrow = this.add.image(200, arrowY, 'arrow')
            .setScale(arrowScale)
            .setFlipX(true)
            .setDepth(20)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.rightArrow = this.add.image(W - 200, arrowY, 'arrow')
            .setScale(arrowScale)
            .setDepth(20)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.leftArrow.on('pointerover', () => this.leftArrow.setScale(arrowScale * 1.1))
        this.leftArrow.on('pointerout', () => this.leftArrow.setScale(arrowScale))
        this.leftArrow.on('pointerdown', () => this.navigateBench(-1))

        this.rightArrow.on('pointerover', () => this.rightArrow.setScale(arrowScale * 1.1))
        this.rightArrow.on('pointerout', () => this.rightArrow.setScale(arrowScale))
        this.rightArrow.on('pointerdown', () => this.navigateBench(1))

        // ─── E key hint ────────────────────────────────
        this.eKeyHint = null

        // ─── Camera: snap to first bench ───────────────
        this.snapCameraToBench(0, false)
        this.updateBenchUI()

        // ─── Controls ──────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.eKey = this.input.keyboard.addKey('E')
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)

        // ─── State ─────────────────────────────────────
        this.menuActive = false
        this.truthTriggered = false

        if (GameState.getFlag('learnedTruth')) {
            this.truthTriggered = true
        }

        // ─── Intro dialog ──────────────────────────────
        if (!GameState.getFlag('workshopIntroSeen')) {
            // Hide arrows during intro
            this.leftArrow.setVisible(false)
            this.rightArrow.setVisible(false)
            if (this.eKeyHint) this.eKeyHint.setVisible(false)

            this.dialog.show([
                { name: 'You', text: 'My workshop... at least this place is still standing.', expression: 'sad' },
                { name: 'You', text: 'I should start working soon.', expression: 'serious' }
            ], () => {
                GameState.setFlag('workshopIntroSeen')

                // Force show right arrow (we're at bench 0)
                this.rightArrow.setVisible(true)
                this.rightArrow.setAlpha(1)

                // Left stays hidden (we're at first bench)
                this.leftArrow.setVisible(false)

                if (this.eKeyHint) this.eKeyHint.setVisible(true)
            })

            this.updateBenchUI()
        }
    }

    update() {
        // ─── Safety: reset stuck dialog state ──────────
        if (this.dialog && this.dialog.isClosed && this.dialog.isActive) {
            this.dialog.isActive = false
        }

        // ─── Dialog takes priority ─────────────────────
        if (this.dialog && this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                if (!this.dialog.isClosed) {
                    this.dialog.next()
                }
            }
            return
        }

        // ─── Menu blocks input ─────────────────────────
        if (this.menuActive) return

        // ─── Keyboard navigation between benches ───────
        if (Phaser.Input.Keyboard.JustDown(this.keyA) || Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.navigateBench(-1)
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyD) || Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.navigateBench(1)
        }

        // ─── Press E to interact with current bench ────
        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            this.onInteract(this.stations[this.currentBenchIndex])
        }

        // ─── Electrical bench unlock (one time) ────────
        if (this.stations[1].locked && GameState.getFlag('electricalUnlocked')) {
            this.stations[1].locked = false
            this.stations[1].rect.setAlpha(0)
            if (this.stations[1].lockOverlay) {
                this.stations[1].lockOverlay.destroy()
                this.stations[1].lockOverlay = null
            }
            if (this.stations[1].lockLabel) {
                this.stations[1].lockLabel.destroy()
                this.stations[1].lockLabel = null
            }
            this.updateBenchUI()
        }

        // ─── Trader hint (one time) ────────────────────
        if (GameState.canMeetTrader() && !GameState.getFlag('traderHintShown')) {
            GameState.setFlag('traderHintShown')
            this.dialog.show([
                { name: 'You', text: 'I know enough now to look for parts.', expression: 'serious' },
                { name: 'You', text: 'Maybe the Junkyard trader has what I need.', expression: 'neutral' }
            ])
            return
        }

        // ─── Truth unlock check ────────────────────────
        this.checkTruthUnlock()
    }

    // ═══════════════════════════════════════════════════
    // ─── BENCH NAVIGATION ──────────────────────────────
    // ═══════════════════════════════════════════════════

    navigateBench(direction) {
        const newIndex = this.currentBenchIndex + direction
        if (newIndex < 0 || newIndex >= this.stations.length) return

        this.currentBenchIndex = newIndex
        this.snapCameraToBench(newIndex, true)
        this.updateBenchUI()
    }

    snapCameraToBench(index, animate = true) {
        const station = this.stations[index]
        const targetX = station.rect.x - this.cameras.main.width / 2

        if (animate) {
            this.tweens.add({
                targets: this.cameras.main,
                scrollX: targetX,
                duration: 500,
                ease: 'Sine.easeInOut'
            })
        } else {
            this.cameras.main.scrollX = targetX
        }
    }

    updateBenchUI() {
        // ─── Show/hide arrows ──────────────────────────
        if (this.leftArrow) {
            this.leftArrow.setVisible(this.currentBenchIndex > 0)
        }
        if (this.rightArrow) {
            this.rightArrow.setVisible(this.currentBenchIndex < this.stations.length - 1)
        }

        // ─── Update interact hint icon ─────────────────
        const station = this.stations[this.currentBenchIndex]

        if (this.eKeyHint) {
            this.eKeyHint.destroy()
            this.eKeyHint = null
        }

        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.eKeyHint = this.add.image(W / 2, H - 100, station.locked ? 'lock-key' : 'e-key')
            .setScale(0.5)
            .setScrollFactor(0)
            .setDepth(20)
    }

    // ═══════════════════════════════════════════════════
    // ─── Can Do Work (night check) ─────────────────────
    // ═══════════════════════════════════════════════════
    canDoWork() {
        if (GameState.timeOfDay === 'night') {
            this.dialog.show([
                { name: 'You', text: 'It\'s too late to work...', expression: 'sad' },
                { name: 'You', text: 'I should get some rest.', expression: 'neutral' },
                { name: '', text: '😴 Come back in the morning.' }
            ])
            return false
        }
        return true
    }

    // ═══════════════════════════════════════════════════
    // ─── Advance Work Time ─────────────────────────────
    // ═══════════════════════════════════════════════════
    advanceWorkTime() {
        GameState.advanceTime()
        this.ui.updateStats()
        this.ui.showTimeTransition()
    }

    // ═══════════════════════════════════════════════════
    // ─── On Interact ───────────────────────────────────
    // ═══════════════════════════════════════════════════
    onInteract(station) {
        if (station.locked) {
            this.dialog.show([
                { name: 'You', text: '🔒 I need more repair skill to work on this.', expression: 'serious' }
            ])
            return
        }

        if (station.cooldown) {
            this.dialog.show([
                { name: 'You', text: 'I just worked on this. Let me rest a bit.', expression: 'neutral' }
            ])
            return
        }

        // ─── Hardware Bench ────────────────────────────
        if (station.name === 'Hardware Bench') {
            if (!this.canDoWork()) return
            this.advanceWorkTime()
            this.scene.pause('WorkshopScene')
            this.scene.launch('PressureValveGame')
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }

        // ─── Electrical Bench ──────────────────────────
        if (station.name === 'Electrical Bench') {
            if (!this.canDoWork()) return
            this.advanceWorkTime()
            this.scene.pause('WorkshopScene')
            this.scene.launch('OscilloscopeGame')
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }

        // ─── Magical Bench (NIGHT ONLY) ────────────────
        if (station.name === 'Magical Bench') {
            if (GameState.timeOfDay !== 'night') {
                this.dialog.show([
                    { name: 'You', text: 'The magical bench needs darkness to work...', expression: 'serious' },
                    { name: 'You', text: 'Ancient energy only flows at night.', expression: 'neutral' },
                    { name: '', text: '🌙 Come back at night to use this bench.' }
                ])
                return
            }

            if (GameState.level >= 2) {
                this.showMagicalBenchMenu(station)
            } else {
                this.scene.pause('WorkshopScene')
                this.scene.launch('EnergyCalibrationGame')
                station.cooldown = true
                this.time.delayedCall(5000, () => { station.cooldown = false })
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── Truth Unlock Check ────────────────────────────
    // ═══════════════════════════════════════════════════
    checkTruthUnlock() {
        if (this.truthTriggered) return
        if (GameState.getFlag('learnedTruth')) {
            this.truthTriggered = true
            return
        }

        if (GameState.skills.research >= 30 &&
            !GameState.getFlag('researchClueFound')) {
            GameState.setFlag('researchClueFound')
            
        }

        const allClues =
            GameState.getFlag('researchClueFound') &&
            GameState.getFlag('luvazaClueFound') &&
            GameState.getFlag('parkClueFound') &&
            GameState.getFlag('traderClueFound')

        if (!allClues) return

        this.truthTriggered = true
        

        GameState.setFlag('learnedTruth')
        GameState.tryAdvanceLevel()
        this.ui.updateStats()

        this.cameras.main.fade(800, 0, 0, 0)
        this.time.delayedCall(800, () => {
            this.scene.start('CutsceneScene', {
                key: 'truthDiscovered',
                returnScene: 'WorkshopScene'
            })
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── Magical Bench Menu (uses choice panel) ────────
    // ═══════════════════════════════════════════════════
            showMagicalBenchMenu(station) {
        this.menuActive = true

        const researchDone = GameState.skills.research >= 30
        const canResearch  = GameState.elixir >= 1 && !researchDone

        const purple = { fill: '#cc88ff' }

        const choices = [
            // ── Slot 0: Energy Calibration (Green) ─────
            {
                text: '⚡ Energy Calibration',
                style: purple,
                onSelect: () => {
                    this.menuActive = false
                    station.cooldown = true
                    this.time.delayedCall(5000, () => { station.cooldown = false })
                    this.scene.pause('WorkshopScene')
                    this.scene.launch('EnergyCalibrationGame')
                }
            },
            // ── Slot 1: Research (Teal) ────────────────
            {
                text: researchDone
                    ? '✅ Research Complete'
                    : `🔬 Research Attack Data (${GameState.skills.research}/30)`,
                style: researchDone
                    ? { fill: '#44ff88' }
                    : canResearch
                        ? purple
                        : { fill: '#555555' },
                onSelect: () => {
                    this.menuActive = false
                    if (researchDone) {
                        this.dialog.show([
                            { name: 'You', text: 'Research is complete.', expression: 'serious' },
                            { name: 'You', text: 'I need to gather all clues from others.', expression: 'determined' }
                        ])
                        return
                    }
                    if (GameState.elixir < 1) {
                        this.dialog.show([
                            { name: 'You', text: 'I need at least 1 elixir to run the analysis.', expression: 'serious' },
                            { name: 'You', text: 'Play Energy Calibration to earn elixir.', expression: 'neutral' }
                        ])
                        return
                    }
                    this.doResearch()
                }
            },
            // ── Slot 2: EMPTY (Purple - gets hidden) ───
            {
                text: '',
                style: { fill: 'transparent' },
                onSelect: () => {}
            },
            // ── Slot 3: Back (Dark) ────────────────────
            {
                text: '🔙 Back',
                style: { fill: '#888888', fontStyle: 'italic' },
                onSelect: () => {
                    this.menuActive = false
                }
            }
        ]

        this.dialog.showChoices(choices, {
            title: '🔮 Magical Bench',
            subtitle: `🔬 Research ${GameState.skills.research}/30  ·  ⚗️ Elixir ${GameState.elixir}`,
            titleStyle: {
                fontSize: '60px',
                fill: '#9b59b6'
            },
            subtitleStyle: {
                fontSize: '20px',
                fill: '#9b59b6'
            },
            // ── Hide slot index 2 (the purple button) ──
            hiddenSlots: [2]
        })
    }


    // ═══════════════════════════════════════════════════
    // ─── Research System ───────────────────────────────
    // ═══════════════════════════════════════════════════
    doResearch() {
        GameState.addElixir(-1)
        GameState.addSkill('research', 5)
        this.ui.updateStats()

        const research = GameState.skills.research

        if (research <= 5) {
            this.dialog.show([
                { name: 'You', text: 'Running attack pattern analysis...', expression: 'serious' },
                { name: 'You', text: 'Clue 1: The attackers knew exactly which districts to hit.', expression: 'surprised' },
                { name: 'You', text: 'This wasn\'t random. They had a detailed map.', expression: 'serious' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research <= 10) {
            this.dialog.show([
                { name: 'You', text: 'Cross referencing attack timing...', expression: 'serious' },
                { name: 'You', text: 'Clue 2: The attack happened during guard rotation.', expression: 'surprised' },
                { name: 'You', text: 'Someone knew the security schedule inside out.', expression: 'angry' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research <= 15) {
            this.dialog.show([
                { name: 'You', text: 'Analyzing the damage patterns...', expression: 'serious' },
                { name: 'You', text: 'Clue 3: Key areas were deliberately left untouched.', expression: 'surprised' },
                { name: 'You', text: 'The material vaults... specifically avoided.', expression: 'serious' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research <= 20) {
            this.dialog.show([
                { name: 'You', text: 'Investigating the material vaults...', expression: 'serious' },
                { name: 'You', text: 'Clue 4: A rare material only found in this city.', expression: 'surprised' },
                { name: 'You', text: 'Can\'t be taken publicly. Someone wants it secretly.', expression: 'angry' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research <= 25) {
            this.dialog.show([
                { name: 'You', text: 'Deep analysis of enemy movement data...', expression: 'serious' },
                { name: 'You', text: 'Clue 5: The enemy had perfect knowledge of defenses.', expression: 'surprised' },
                { name: 'You', text: 'This level of intel... from someone with high authority.', expression: 'angry' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research >= 30) {
            const luvaza = GameState.getFlag('luvazaClueFound')
            const park = GameState.getFlag('parkClueFound')
            const trader = GameState.getFlag('traderClueFound')

            if (luvaza && park && trader) {
                this.dialog.show([
                    { name: 'You', text: 'Final analysis complete...', expression: 'serious' },
                    { name: 'You', text: 'I have everything I need now.', expression: 'determined' },
                    { name: '', text: '🔬 All clues gathered! Head back to workshop.' }
                ])
            } else {
                const missing = []
                if (!luvaza) missing.push('💕 Talk more with Luvaza at Town Center')
                if (!park) missing.push('🌿 Talk more with Park Cleaner at Park')
                if (!trader) missing.push('🧑 Talk more with Trader at Junkyard')

                this.dialog.show([
                    { name: 'You', text: 'Research complete...', expression: 'serious' },
                    { name: 'You', text: 'But I still need more from others.', expression: 'sad' },
                    ...missing.map(m => ({ name: '📌', text: m })),
                    { name: '', text: '🔬 Research: 30/30 ✅' }
                ])
            }
        }
    }
}