export default class UI {
    constructor(scene) {
        this.scene = scene
        this.taskVisible = false
        this.taskItems = []
        this.invVisible = false
        this.invSlots = []
        this._escHandler = null
        this.hubBtnLabel = null
        this.invBtnLabel = null
        this.taskBtnLabel = null
        this._newTaskShown = false
        this._lastTaskCheck = 0

        this.selectedTab = 'active';
        this.selectedGroupIndex = 0;
        this.selectedTaskIndex = -1;
    }

    create() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ─── Top Bar Background (70px tall) ────────────
        this.bar = this.scene.add.rectangle(W / 2, 35, W, 70, 0x000000, 1)
            .setDepth(999).setScrollFactor(0).setStrokeStyle(2, 0x444444)

        // Stats text:
        this.statsText = this.scene.add.text(30, 25, '', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '20px',
            fill: '#ffffff'
        }).setDepth(1000).setScrollFactor(0)

        // Level text:
        this.levelText = this.scene.add.text(W - 220, 15, '', {
            fontFamily: "'Orbitron', monospace",
            fontSize: '20px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(1000).setScrollFactor(0)

        // ─── Crisis Bar (left) + Days text (right), centered ─
        const crisisW = 400
        const groupW = 620
        const groupStartX = (W - groupW) / 2
        const crisisY = 35
        const barX = groupStartX

        this.crisisBarBg = this.scene.add.rectangle(barX + crisisW / 2, crisisY, crisisW, 28, 0x222222, 0.6)
            .setStrokeStyle(1, 0x444444)
            .setDepth(51).setScrollFactor(0)

        this.crisisBar = this.scene.add.rectangle(barX, crisisY, 0, 26, 0xff4444)
            .setOrigin(0, 0.5).setDepth(1000).setScrollFactor(0)

        this.crisisLabel = this.scene.add.text(barX + crisisW / 2, crisisY, '', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(53).setScrollFactor(0)

        this.dayText = this.scene.add.text(barX + crisisW + 25, crisisY, '', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '20px',
            fill: '#ffdd44',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(53).setScrollFactor(0)

        // ─── Time Icon (single, cycles on tap) ─────────
        const timeKeys = ['time-morning', 'time-noon', 'time-evening', 'time-night']
        const timeNames = ['Morning', 'Afternoon', 'Evening', 'Night']
        const initIdx = GameState.timeIndex || 0
        const timeIconX = W - 80 - 100
        const timeIconY = 35
        const timeIconW = 300

        this.timeIcon = this.scene.add.image(timeIconX, timeIconY, timeKeys[initIdx])
            .setDepth(1000)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        const timeIconScale = timeIconW / this.timeIcon.width
        this.timeIcon.setScale(timeIconScale)
        this.timeIcon._baseScale = timeIconScale

        this.timeIcon.on('pointerdown', () => {
            const currentIdx = GameState.timeIndex || 0
            const nextIdx = (currentIdx + 1) % 4
            this.changeTime(nextIdx)
        })

        this.timeIcon.on('pointerover', () => {
            // Smoothly grow to 105% over 100ms
            this.scene.tweens.add({
                targets: this.timeIcon,
                scaleX: this.timeIcon._baseScale * 1.05,
                scaleY: this.timeIcon._baseScale * 1.05,
                duration: 100,
                ease: 'Quad.easeOut'
            })
        })

        this.timeIcon.on('pointerout', () => {
            // Smoothly shrink back to normal size
            this.scene.tweens.add({
                targets: this.timeIcon,
                scaleX: this.timeIcon._baseScale,
                scaleY: this.timeIcon._baseScale,
                duration: 200,
                ease: 'Quad.easeOut'
            })
        })

        // ─── Navigation Icons (Top Right, Vertical) ────
        const btnX = W - 50 - 80
        const btnGap = 15
        const iconScale = 0.2
        let iconY = 80 + 80

        const makeIcon = (x, y, iconKey, onClick) => {
            const icon = this.scene.add.image(x, y, iconKey)
                .setScale(iconScale)
                .setDepth(1000)
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true })
            icon.on('pointerdown', onClick)
            return icon
        }

        if (this.scene.scene.key !== 'HubScene') {
            this.hubIcon = makeIcon(btnX, iconY, 'hub-icon', () => {
                this.scene.cameras.main.fade(300, 0, 0, 0)
                this.scene.time.delayedCall(300, () => {
                    this.scene.scene.start('HubScene')
                })
            })
            iconY += (this.hubIcon.displayHeight + btnGap)
        }

        // ✅ Fixed: Back to normal clean calls
        this.invIcon = makeIcon(btnX, iconY, 'inventory-icon', () => this.toggleInventory())
        iconY += (this.invIcon.displayHeight + btnGap)

        this.taskIcon = makeIcon(btnX, iconY, 'tasks-icon', () => this.toggleTaskPanel())

        // ─── ESC handler ───────────────────────────────
        this._escHandler = () => {
            if (this.invVisible) {
                this.hideInventory()
            } else if (this.taskVisible) {
                this.hideTaskPanel()
            }
        }
        this.scene.input.keyboard.on('keydown-ESC', this._escHandler)

        this.updateStats()
    }

    // ─── Direct Time Change via UI ─────────────────────
    changeTime(newIndex) {
        if (newIndex === GameState.timeIndex) return

        if (newIndex === 0) {
            const gameOver = GameState.skipToMorning()
            if (gameOver) {
                this.scene.scene.start('CutsceneScene', { key: 'gameOver' })
                return
            }
        } else if (newIndex === 1 && GameState.timeIndex < 1) {
            GameState.skipToAfternoon()
        } else if (newIndex === 2 && GameState.timeIndex < 2) {
            GameState.skipToEvening()
        } else if (newIndex === 3 && GameState.timeIndex < 3) {
            GameState.skipToNight()
        } else {
            return
        }

        this.updateStats()
        this.showTimeTransition()
    }

    // ─── Time Transition ───────────────────────────────
    showTimeTransition() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        this.updateSceneBackground()

        const overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x0a0d10, 0.8)
            .setScrollFactor(0).setDepth(300).setInteractive()

        const text = this.scene.add.text(W / 2, H / 2 - 20,
            `${GameState.getTimeIcon()} Day ${GameState.day} - ${GameState.timeOfDay.toUpperCase()}`, {
            fontSize: '42px',
            fontFamily: "'Share Tech Mono', monospace",
            fill: GameState.getTimeColor(),
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setAlpha(0)

        const daysText = this.scene.add.text(W / 2, H / 2 + 50,
            `⏳ ${GameState.getDaysLeft()} days remaining`, {
            fontSize: '24px',
            fill: GameState.getDaysLeft() <= 2 ? '#ff4444' : '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setAlpha(0)

        this.scene.tweens.add({
            targets: [text, daysText],
            alpha: 1,
            duration: 800,
            onComplete: () => {
                this.scene.time.delayedCall(800, () => {
                    this.scene.tweens.add({
                        targets: [overlay, text, daysText],
                        alpha: 0,
                        duration: 600,
                        onComplete: () => {
                            overlay.destroy()
                            text.destroy()
                            daysText.destroy()
                        }
                    })
                })
            }
        })
    }

    // ─── Update Scene Background After Time Change ──────
    updateSceneBackground() {
        const scene = this.scene
        const time = GameState.timeOfDay
        const H = scene.cameras.main.height

        const bgMaps = {
            'WorkshopScene': {
                'morning': 'workshop-morning',
                'afternoon': 'workshop-noon',
                'evening': 'workshop-evening',
                'night': 'workshop-night'
            },
            'ParkScene': {
                'morning': 'park-morning',
                'afternoon': 'park-noon',
                'evening': 'park-evening',
                'night': 'park-night'
            },
            'JunkyardScene': {
                'morning': 'junkyard-morning',
                'afternoon': 'junkyard-noon',
                'evening': 'junkyard-evening',
                'night': 'junkyard-night'
            },
            'HubScene': {
                'morning': 'hub-morning',
                'afternoon': 'hub-noon',
                'evening': 'hub-evening',
                'night': 'hub-night'
            }
        }

        const sceneKey = scene.scene.key
        const map = bgMaps[sceneKey]
        if (!map || !scene.bg) return

        const bgKey = map[time]
        if (!bgKey) return
        if (!scene.textures.exists(bgKey)) return
        if (scene.bg.texture.key === bgKey) return

        scene.tweens.add({
            targets: scene.bg,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                scene.bg.setTexture(bgKey)
                scene.bg.setOrigin(0, 0)
                const scaleY = H / scene.bg.height
                scene.bg.setScale(scaleY)
                scene.tweens.add({ targets: scene.bg, alpha: 1, duration: 400 })
            }
        })
    }

    // ─── Stats ─────────────────────────────────────────
    updateStats() {
        const W = this.scene.cameras.main.width
        const isNarrow = W < 500

        this.statsText.setText(isNarrow
            ? `⭐${GameState.reputation} 💰${GameState.money} ⚗️${GameState.elixir}`
            : `⭐${GameState.reputation}  💰${GameState.money}  ⚗️${GameState.elixir}  🔧${GameState.skills.repair}  🔬${GameState.skills.research}`
        )
        this.levelText.setText(`Lv.${GameState.level}`)

        const daysLeft = GameState.getDaysLeft()
        this.dayText.setText(`⏳ ${daysLeft} days remaining`)
        this.dayText.setFill('#ffdd44')

        const tIndex = GameState.timeIndex || 0
        const timeNames = ['Morning', 'Afternoon', 'Evening', 'Night']

                // ─── Update time icon ──────────────────────────
        if (this.timeIcon) {
            const timeKeys = ['time-morning', 'time-noon', 'time-evening', 'time-night']
            const targetKey = timeKeys[tIndex]

            if (this.timeIcon.texture.key !== targetKey) {
                this.timeIcon.setTexture(targetKey)

                const timeIconW = 300
                const newScale = timeIconW / this.timeIcon.width
                this.timeIcon.setScale(newScale)
                this.timeIcon._baseScale = newScale

                this.scene.tweens.add({
                    targets: this.timeIcon,
                    scaleX: newScale * 1.2,
                    scaleY: newScale * 1.2,
                    duration: 150,
                    yoyo: true,
                    ease: 'Back.easeOut'
                })
            }

        }
        // ─── Update day pill text ──────────────────────
        if (this.dayPillText && this.dayPillTab) {
            const newTimeName = timeNames[tIndex] || 'Time'
            this.dayPillText.setText(`Day ${GameState.day} - ${newTimeName.toUpperCase()}`)
            this.dayPillTab.setSize(this.dayPillText.width + 20, 20)
            this.scene.tweens.add({
                targets: [this.dayPillTab, this.dayPillText],
                scaleY: 1.1,
                duration: 100,
                yoyo: true,
                ease: 'Quad.easeInOut'
            })
        }

        // ─── Crisis bar update ─────────────────────────
        const crisisW = 400
        const progress = Math.min(1, (GameState.day) / GameState.maxDays)
        const barWidth = Math.max(0, crisisW * progress)
        this.crisisBar.setSize(barWidth, 26)

        if (progress < 0.4) {
            this.crisisBar.setFillStyle(0x00ff88)
        } else if (progress < 0.7) {
            this.crisisBar.setFillStyle(0xffaa00)
        } else {
            this.crisisBar.setFillStyle(0xff4444)
        }

        this.crisisLabel.setText(`Day ${GameState.day}/${GameState.maxDays}`)

        this.checkNewTasks()
    }

    // ─── Check New Tasks ───────────────────────────────
    checkNewTasks() {
        const now = Date.now()
        if (now - this._lastTaskCheck < 2000) return
        this._lastTaskCheck = now

        const currentTasks = this.getCurrentTasks()
        if (!currentTasks || currentTasks.length === 0) return

        const currentIncomplete = []
        currentTasks.forEach(group => {
            group.tasks.forEach(task => {
                if (!task.done) currentIncomplete.push(task.text)
            })
        })

        const currentSig = currentIncomplete.join('|||')

        if (!this._prevTaskSig && this._prevTaskSig !== '') {
            this._prevTaskSig = currentSig
            return
        }

        if (currentSig !== this._prevTaskSig) {
            const prevTexts = (this._prevTaskSig || '').split('|||').filter(Boolean)
            const newQuests = currentIncomplete.filter(t => !prevTexts.includes(t))
            this._prevTaskSig = currentSig

            if (newQuests.length > 0) {
                this.showNewTaskNotification(newQuests)
            }
        }
    }

    // ─── New Task Notification ─────────────────────────
    showNewTaskNotification(quests = []) {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        const panelW = Math.min(520, W - 80)
        const questLineH = 32
        const headerH = 52
        const footerH = 16
        const panelH = headerH + (quests.length * questLineH) + footerH + 20
        const panelX = W / 2
        const startY = H + panelH
        const endY = H - panelH / 2 - 30

        const allItems = []

        const glow = this.scene.add.rectangle(panelX, startY, panelW + 12, panelH + 12, 0x00ff88, 0.08)
            .setScrollFactor(0).setDepth(498)
        allItems.push(glow)

        const bg = this.scene.add.rectangle(panelX, startY, panelW, panelH, 0x0d1117, 0.96)
            .setStrokeStyle(2, 0x00ff88, 0.7)
            .setScrollFactor(0).setDepth(499)
        allItems.push(bg)

        const accent = this.scene.add.rectangle(panelX, startY - panelH / 2 + 3, panelW, 6, 0x00ff88, 0.9)
            .setScrollFactor(0).setDepth(500)
        allItems.push(accent)

        const iconText = this.scene.add.text(panelX - panelW / 2 + 24, startY - panelH / 2 + 24, '📋', {
            fontSize: '28px'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501)
        allItems.push(iconText)

        const titleLabel = quests.length === 1 ? 'New Quest!' : `${quests.length} New Quests!`
        const title = this.scene.add.text(panelX - panelW / 2 + 62, startY - panelH / 2 + 24, titleLabel, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '20px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501)
        allItems.push(title)

        const divider = this.scene.add.rectangle(panelX, startY - panelH / 2 + headerH, panelW - 40, 1, 0x00ff88, 0.25)
            .setScrollFactor(0).setDepth(500)
        allItems.push(divider)

        const questItems = []
        quests.forEach((quest, i) => {
            const qY = startY - panelH / 2 + headerH + 18 + (i * questLineH)

            const bullet = this.scene.add.text(panelX - panelW / 2 + 30, qY, '▸', {
                fontSize: '18px',
                fill: '#ffaa00'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501).setAlpha(0)
            allItems.push(bullet)
            questItems.push(bullet)

            const questText = this.scene.add.text(panelX - panelW / 2 + 54, qY, quest, {
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '16px',
                fill: '#e0e0e0',
                wordWrap: { width: panelW - 90 }
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501).setAlpha(0)
            allItems.push(questText)
            questItems.push(questText)
        })

        const hint = this.scene.add.text(panelX, startY + panelH / 2 - 14, 'TAP to dismiss', {
            fontSize: '11px',
            fill: '#555555',
            fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501)
        allItems.push(hint)

        const hitArea = this.scene.add.rectangle(panelX, startY, panelW, panelH, 0x000000, 0)
            .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true })
        allItems.push(hitArea)

        let dismissed = false
        const dismissNotification = () => {
            if (dismissed) return
            dismissed = true
            this.scene.tweens.add({
                targets: allItems,
                y: '+=120',
                alpha: 0,
                duration: 350,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    allItems.forEach(item => {
                        if (item && item.active) item.destroy()
                    })
                }
            })
        }
        hitArea.on('pointerdown', dismissNotification)

        this.scene.tweens.add({
            targets: allItems,
            y: `-=${startY - endY}`,
            duration: 600,
            ease: 'Back.easeOut',
            onComplete: () => {
                questItems.forEach((item, idx) => {
                    this.scene.time.delayedCall(idx * 120, () => {
                        if (!item || !item.active) return
                        this.scene.tweens.add({
                            targets: item,
                            alpha: 1,
                            x: item.x,
                            duration: 300,
                            ease: 'Quad.easeOut'
                        })
                    })
                })

                this.scene.tweens.add({
                    targets: iconText,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 250,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Sine.easeInOut'
                })

                this.scene.tweens.add({
                    targets: glow,
                    alpha: 0.2,
                    duration: 800,
                    yoyo: true,
                    repeat: 2,
                    ease: 'Sine.easeInOut'
                })
            }
        })

        this.scene.time.delayedCall(5000, dismissNotification);
    }

    // ─── Inventory ─────────────────────────────────────
    toggleInventory() {
        if (this.invVisible) {
            this.hideInventory();
        } else {
            this.showInventory();
        }
    }

    showInventory() {
        if (this.inventoryElements) this.hideInventory();

        const W = this.scene.cameras.main.width;
        const H = this.scene.cameras.main.height;
        this.inventoryElements = [];

        const overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(500).setInteractive();
        this.inventoryElements.push(overlay);

        const panel = this.scene.add.image(W / 2, H / 2, 'inventory-panel')
            .setScale(0.8)
            .setScrollFactor(0).setDepth(501);
        this.inventoryElements.push(panel);

        const pW = panel.displayWidth;
        const pH = panel.displayHeight;
        const pX = panel.x - pW / 2;
        const pY = panel.y - pH / 2;

        const FONT = "'Share Tech Mono', monospace";

        const gridScale = 1.75
        const gridOffsetX = 0
        const gridOffsetY = -70

        const cols = 6
        const rows = 4
        const slotSize = 65 * gridScale
        const slotGap = 10 * gridScale

        const iconPadding = 22

        const gridStartX = pX + (pW / 2) - ((cols * (slotSize + slotGap) - slotGap) / 2) + gridOffsetX
        const gridStartY = pY + (pH * 0.25) + gridOffsetY

        const lockedSlots = new Set([13, 14, 15, 16])

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const slotIndex = row * cols + col;
                const slotX = gridStartX + (col * (slotSize + slotGap)) + (slotSize / 2)
                const slotY = gridStartY + (row * (slotSize + slotGap)) + (slotSize / 2)

                if (lockedSlots.has(slotIndex)) {
                    const lockedSlot = this.scene.add.rectangle(
                        slotX, slotY, slotSize, slotSize,
                        0x000000, 0.2
                    )
                        .setStrokeStyle(2, 0x441111)
                        .setOrigin(0.5)
                        .setScrollFactor(0)
                        .setDepth(501)
                        .setAlpha(0)

                    const lockIcon = this.scene.add.text(slotX, slotY, '🔒', {
                        fontSize: `${slotSize * 0.5}px`
                    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setAlpha(0)

                    this.inventoryElements.push(lockedSlot, lockIcon)

                } else {
                    const emptySlot = this.scene.add.rectangle(
                        slotX, slotY, slotSize, slotSize,
                        0x000000, 0.4
                    )
                        .setOrigin(0.5)
                        .setScrollFactor(0)
                        .setDepth(501)
                        .setAlpha(0)

                    this.inventoryElements.push(emptySlot)
                }
            }
        }

        const inventory = GameState.inventory || []
        const validItems = inventory.filter(item => item.quantity > 0)

        let nextAvailableIndex = 0

        validItems.forEach((item) => {
            if (nextAvailableIndex >= (rows * cols)) return

            while (lockedSlots.has(nextAvailableIndex)) {
                nextAvailableIndex++
            }

            const col = nextAvailableIndex % cols
            const row = Math.floor(nextAvailableIndex / cols)

            const iconX = gridStartX + (col * (slotSize + slotGap)) + (slotSize / 2)
            const iconY = gridStartY + (row * (slotSize + slotGap)) + (slotSize / 2)

            const iconSprite = this.scene.add.text(iconX, iconY, item.icon, {
                fontSize: `${slotSize - (iconPadding * 2)}px`,
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(503)

            this.inventoryElements.push(iconSprite)

            if (item.quantity > 1) {
                const badgeOffset = (slotSize / 2) - (iconPadding / 2)
                const qtyText = this.scene.add.text(iconX + badgeOffset, iconY - badgeOffset, `${item.quantity}`, {
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '12px',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 3, y: 1 }
                }).setOrigin(0.5).setScrollFactor(0).setDepth(504)
                this.inventoryElements.push(qtyText)
            }

            nextAvailableIndex++
        })

        const partsCount = GameState.armor ? GameState.armor.parts.length : 0
        const hasCore = GameState.armor ? GameState.armor.hasCore : false

        const statsText = this.scene.add.text(
            W / 2,
            pY + (pH * 0.88),
            `Armor: ${partsCount}/3 parts | Core: ${hasCore ? '✓' : '×'}`, {
            fontFamily: FONT,
            fontSize: '20px',
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(502)

        this.inventoryElements.push(statsText)

        const closeMark = this.scene.add.rectangle(
            pX + pW - 70,
            pY + 50,
            80,
            80
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(502)
            .setAlpha(1)
            .setInteractive({ useHandCursor: true })

        closeMark.on('pointerdown', () => {
            this.hideInventory()
        })

        this.inventoryElements.push(closeMark)
    }

    hideInventory() {
        if (this.inventoryElements) {
            this.inventoryElements.forEach(el => { if (el) el.destroy() })
            this.inventoryElements = []
        }
    }

    // ─── Tasks ─────────────────────────────────────────
    toggleTaskPanel() {
        if (this.taskVisible) {
            this.hideTaskPanel();
        } else {
            this.showTaskPanel();
        }
    }

    showTaskPanel() {
        const W = this.scene.cameras.main.width;
        const H = this.scene.cameras.main.height;
        this.taskVisible = true;
        this.taskItems = [];
        this.selectedTab = this.selectedTab || 'active';

        const overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setDepth(510).setScrollFactor(0).setInteractive();
        this.taskItems.push(overlay);

        const bg = this.scene.add.image(W / 2, H / 2, 'quest-bg')
            .setDepth(511).setScrollFactor(0).setScale(0.85);
        this.taskItems.push(bg);

        const pW = bg.displayWidth;
        const pH = bg.displayHeight;
        const pX = bg.x - pW / 2; // Left edge
        const pY = bg.y - pH / 2; // Top edge

        // ╔═══════════════════════════════════════════════════════════╗
        // ║              MASTER LAYOUT ADJUSTER                      ║�
        // ║  Tweak these pixels to perfectly match your quest-bg!   ║�
        // ╚═══════════════════════════════════════════════════════════╝
        const layout = {
            closeBtnX: pW - 55,    // Distance from left edge
            closeBtnY: 55,         // Distance from top edge

            tabsVisible: false,
            tabY: pH * 0.2,       // Height of the ACTIVE/COMPLETED tabs
            tab1X: pW * 0.12,     // X of ACTIVE tab
            tab2X: pW * 0.25,     // X of COMPLETED tab
            tab3X: pW * 0.38,     // X of FAILED tab
            tabFontSize: 16,      // Size of tab text

            // LEFT COLUMN (Titles)
            titleStartY: pH * 0.35 - 10,  // Where the first title starts
            titleSpacing: pH * 0.12 + 20, // Gap between titles
            titleCenterX: pW * 0.25, // Horizontal center of titles
            titleFontSize: 32,       // Size of title text

            // RIGHT COLUMN (Details)
            rightCenterX: pW * 0.7,  // Horizontal center for right side

            headerY: pH * 0.25 + 20,      // Y of the big Title header
            headerFontSize: 28,      // Size of header

            storyY: pH * 0.32 + 32,       // Y of the 3-line story phrase
            storyFontSize: 22,       // Size of story text

            tasksStartY: pH * 0.48 + 70,  // Where the task list begins
            taskSpacing: 30,         // Gap between tasks
            taskFontSize: 22,        // Size of task text

            // FOOTER
            footerY: pH * 0.92 + 10,      // Y of "2 QUESTS AVAILABLE"
            footerFontSize: 28       // Size of footer
        };

        // Store layout so refreshQuestList can use it
        this._questLayout = { pW, pH, pX, pY, ...layout };

        // Close Button
        const closeBtn = this.scene.add.rectangle(pX + layout.closeBtnX, pY + layout.closeBtnY, 60, 60, 0xff0000, 0)
            .setScale(1.3).setDepth(512).setScrollFactor(0).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.hideTaskPanel());
        this.taskItems.push(closeBtn);

        // Tabs
        this.createTab(pX + layout.tab1X, pY + layout.tabY, 'active', 'ACTIVE', layout.tabFontSize);
        this.createTab(pX + layout.tab2X, pY + layout.tabY, 'completed', 'COMPLETED', layout.tabFontSize);
        this.createTab(pX + layout.tab3X, pY + layout.tabY, 'failed', 'FAILED', layout.tabFontSize);

        // ==========================================================
        // 🔍 TEMPORARY DEBUG GRID (Set to true to see borders!)
        // ==========================================================
        const showDebug = false;
        if (showDebug) {
            const g = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
            g.lineStyle(2, 0xff0000); // Red outer box
            g.strokeRect(pX, pY, pW, pH);

            // Green center line
            g.lineStyle(1, 0x00ff00);
            g.beginPath();
            g.moveTo(pX + (pW / 2), pY);
            g.lineTo(pX + (pW / 2), pY + pH);
            g.strokePath();
        }

        this.refreshQuestList();
    }

    createTab(x, y, tabKey, label, fontSize) {
        const isSelected = this.selectedTab === tabKey;

        const tab = this.scene.add.text(x, y, label, {
            fontFamily: "'Gloria Hallelujah', cursive",
            fontSize: `${fontSize}px`,
            fill: isSelected ? '#000000' : '#665544',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(513).setScrollFactor(0);

        this.taskItems.push(tab);


        if (this._questLayout && !this._questLayout.tabsVisible) {
            tab.setAlpha(0);
        } else {

            tab.setInteractive({ useHandCursor: true });
            tab.on('pointerdown', () => {
                this.selectedTab = tabKey;
                this.selectedQuest = null;
                this.refreshQuestList();
            });
            return;
        }

        const hitW = this._questLayout.tabHitW || 100;
        const hitH = this._questLayout.tabHitH || 30;

        const hitbox = this.scene.add.rectangle(x, y, hitW, hitH, 0x000000, 0)
            .setOrigin(0.5)
            .setDepth(514) // Put it slightly above the text depth
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });

        hitbox.on('pointerdown', () => {
            this.selectedTab = tabKey;
            this.selectedQuest = null;
            this.refreshQuestList();
        });

        this.taskItems.push(hitbox);
    }
    refreshQuestList() {
        if (this.dynamicQuestTexts) this.dynamicQuestTexts.forEach(t => t.destroy());
        this.dynamicQuestTexts = [];
        if (this.detailTexts) this.detailTexts.forEach(t => t.destroy());
        this.detailTexts = [];

        const L = this._questLayout; // Shortcut to our layout!
        const allQuestGroups = this.getCurrentTasks();

        const matchesTab = (task) => {
            if (this.selectedTab === 'active') return !task.done && !task.failed;
            if (this.selectedTab === 'completed') return task.done;
            return task.failed;
        };

        const validTitleCount = allQuestGroups.filter(g => g.tasks.some(matchesTab)).length;
        let firstValidIndex = allQuestGroups.findIndex(g => g.tasks.some(matchesTab));
        if (firstValidIndex === -1) return;

        if (!allQuestGroups[this.selectedGroupIndex] || !allQuestGroups[this.selectedGroupIndex].tasks.some(matchesTab)) {
            this.selectedGroupIndex = firstValidIndex;
            this.selectedTaskIndex = -1;
        }

        // ─── LEFT COLUMN: TITLES ────────────────────────
        let currentLeftY = L.pY + L.titleStartY;

        allQuestGroups.forEach((group, index) => {
            if (!group.tasks.some(matchesTab)) return;

            const isSelected = index === this.selectedGroupIndex;

            const titleText = this.scene.add.text(L.pX + L.titleCenterX, currentLeftY, group.title, {
                fontFamily: "'Gloria Hallelujah', cursive",
                fontSize: `${L.titleFontSize}px`,
                fill: isSelected ? '#000000' : '#665544',
                fontStyle: isSelected ? 'bold' : 'normal',
                align: 'center'
            }).setOrigin(0.5).setDepth(513).setScrollFactor(0).setInteractive({ useHandCursor: true });

            titleText.on('pointerdown', () => {
                this.selectedGroupIndex = index;
                this.selectedTaskIndex = -1;
                this.refreshQuestList();
            });

            this.dynamicQuestTexts.push(titleText);
            currentLeftY += L.titleSpacing;
        });

        // ─── RIGHT COLUMN: DETAILS ──────────────────────
        const rightX = L.pX + L.rightCenterX;
        const selectedGroup = allQuestGroups[this.selectedGroupIndex];

        // 1. Header
        const headerText = this.scene.add.text(rightX, L.pY + L.headerY, selectedGroup.title, {
            fontFamily: "'Gloria Hallelujah', cursive",
            fontSize: `${L.headerFontSize}px`,
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(513).setScrollFactor(0);
        this.detailTexts.push(headerText);

        // 2. Story Phrase
        const storyPhrase = this.getQuestStory(selectedGroup.title);
        const storyText = this.scene.add.text(rightX, L.pY + L.storyY, storyPhrase, {
            fontFamily: "'Gloria Hallelujah', cursive",
            fontSize: `${L.storyFontSize}px`,
            fill: '#8B7355',
            fontStyle: 'italic',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5, 0).setDepth(513).setScrollFactor(0);
        this.detailTexts.push(storyText);

        // 3. Tasks
        let currentTaskY = L.pY + L.tasksStartY;
        const tasksToShow = selectedGroup.tasks.filter(matchesTab);

        if (tasksToShow.length === 0) {
            const emptyMsg = this.scene.add.text(rightX, currentTaskY, 'No tasks here...', {
                fontFamily: "'Gloria Hallelujah', cursive", fontSize: '16px', fill: '#8B7355', fontStyle: 'italic'
            }).setOrigin(0.5).setDepth(513).setScrollFactor(0);
            this.detailTexts.push(emptyMsg);
        } else {
            tasksToShow.forEach((task, i) => {
                let icon = '▸ ';
                const taskText = this.scene.add.text(rightX, currentTaskY, `${icon} ${task.text}`, {
                    fontFamily: "'Gloria Hallelujah', cursive", fontSize: `${L.taskFontSize}px`, fill: '#443322',
                    wordWrap: { width: L.pW * 0.35 }, align: 'center'
                }).setOrigin(0.5, 0).setDepth(513).setScrollFactor(0).setInteractive({ useHandCursor: true });

                taskText.on('pointerdown', () => { this.selectedTaskIndex = i; this.refreshQuestList(); });
                taskText.on('pointerover', () => taskText.setFill('#8B1A1A'));
                taskText.on('pointerout', () => taskText.setFill('#443322'));

                this.detailTexts.push(taskText);
                currentTaskY += L.taskSpacing;

                if (i === this.selectedTaskIndex && task.hint) {
                    const hintText = this.scene.add.text(rightX, currentTaskY, `💡 ${task.hint}`, {
                        fontFamily: "'Gloria Hallelujah', cursive", fontSize: '13px', fill: '#8B7355',
                        fontStyle: 'italic', wordWrap: { width: L.pW * 0.3 }, align: 'center'
                    }).setOrigin(0.5, 0).setDepth(513).setScrollFactor(0);
                    this.detailTexts.push(hintText);
                    currentTaskY += 25;
                }
            });
        }

        // 4. Footer
        const counterStr = `${validTitleCount}  QUEST `;
        const counterText = this.scene.add.text(L.pX + 275, L.pY + L.footerY, counterStr, {
            fontFamily: "'Gloria Hallelujah', cursive",
            fontSize: `${L.footerFontSize}px`,
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(514).setScrollFactor(0);
        this.detailTexts.push(counterText);
    }

    hideTaskPanel() {
        this.taskVisible = false;
        [this.taskItems, this.dynamicQuestTexts, this.detailTexts].forEach(group => {
            if (group) group.forEach(item => { if (item && item.active) item.destroy(); });
        });
        this.taskItems = [];
        this.dynamicQuestTexts = [];
        this.detailTexts = [];
        this.selectedQuest = null;
    }

    getQuestStory(title) {
        const stories = {
            "🔧 Workshop Basics": "The workshop is your lifeline.\nMaster the tools to survive.\nOnly then can you proceed.",
            "⚙️ The Junkyard Connection": "The Junkyard holds dark secrets.\nA mysterious trader lurks there.\nBut he demands proof of skill.",
            "⚡ Securing the Core": "The core is the heart of the machine.\nIt won't come cheap, but it is essential.\nEvery coin earned counts.",
            "🏛️ Gaining Trust": "The city is broken and wary.\nYou must earn their respect first.\nOnly then will they speak freely.",
            "🔍 The Investigation": "The pieces don't fit together yet.\nFollow the trail of destruction.\nThe truth is hiding in plain sight.",
            "🎯 The Revelation": "The clues point to one terrifying truth.\nThe enemy isn't who you think.\nThe King must hear this immediately.",
            "🛡️ Forging the Armor": "The time for hiding is over.\nWith the trader's help, fight back.\nBuild the machine that saves them all.",
            "💔 Uncovering the Truth": "The armor is ready, but at what cost?\nAllies hold the final puzzle pieces.\nThe end is closer than you think.",
            "🌧️ The Climax": "The storm has finally arrived.\nYou cannot change what happened.\nBut you can make them pay for it.",
            "⚔️ The Counterattack": "No more running. No more waiting.\nGather everything you have left.\nToday, you take the fight to them.",
            "💣 Behind Enemy Lines": "Their fortress is heavily guarded.\nStrike at their defenses first.\nCut off the head of the snake.",
            "💀 The Final Stand": "Face the architect of your suffering.\nThere is no turning back now.\nEnd this, once and for all."
        };
        return stories[title] || "The path forward is shrouded.\nKeep your eyes open.\nA solution will present itself.";
    }

    getCurrentTasks() {
        if (GameState.level === 1) {
            return [
                {
                    title: "🔧 WORKSHOP ",
                    tasks: [
                        { text: 'Gain 5 repair skill', done: GameState.skills.repair >= 5, failed: false, hint: 'Complete repairs at the workbench' },
                        { text: 'Unlock Electrical Bench', done: GameState.getFlag('electricalUnlocked'), failed: false, hint: 'Reaching 5 repair unlocks this' }
                    ]
                },
                {
                    title: "⚙️ THE TRADER",
                    tasks: [
                        { text: 'Gain 10 repair skill', done: GameState.skills.repair >= 10, failed: false, hint: 'Keep practicing your repairs' },
                        { text: 'Meet the Trader at Junkyard', done: GameState.getFlag('metTrader'), failed: false, hint: 'Visit the Junkyard location' }
                    ]
                },
                {
                    title: "⚡ BUY CORE",
                    tasks: [
                        { text: 'Buy the Armor Core from Trader', done: GameState.getFlag('boughtCore'), failed: false, hint: 'Talk to the Trader at the Junkyard' }
                    ]
                }
            ];
        }

        if (GameState.level === 2) {
            return [
                {
                    title: "🏛️ HELP THE TOWN",
                    tasks: [
                        { text: 'Talk to the King at the Palace', done: GameState.getFlag('metKing'), failed: false, hint: 'Visit the Palace' },
                        { text: 'Meet Luvaza at Town Center', done: GameState.getFlag('metLuvaza'), failed: false, hint: 'Explore the Town Center' },
                        { text: 'Repair all town buildings', done: GameState.getFlag('rebuiltBuildings'), failed: false, hint: 'Find the damaged structures' },
                        { text: 'Meet Park Cleaner at the Park', done: GameState.getFlag('metParkCleaner'), failed: false, hint: 'Take a stroll through the Park' }
                    ]
                },
                {
                    title: "🔍 INVESTIGATION",
                    tasks: [
                        { text: 'Research attack data (30 pts)', done: GameState.skills.research >= 30, failed: false, hint: 'Use the Research bench' },
                        { text: 'Find research clue', done: GameState.getFlag('researchClueFound'), failed: false, hint: 'Check your research data' },
                        { text: "Find Luvaza's clue", done: GameState.getFlag('luvazaClueFound'), failed: false, hint: 'Ask Luvaza what she knows' },
                        { text: "Find Park Cleaner's clue", done: GameState.getFlag('parkClueFound'), failed: false, hint: 'Search around the Park' },
                        { text: "Find Trader's clue", done: GameState.getFlag('traderClueFound'), failed: false, hint: 'Check in with the Trader' }
                    ]
                },
                {
                    title: "🎯 CONCLUSION",
                    tasks: [
                        { text: 'Discover the Truth', done: GameState.getFlag('learnedTruth'), failed: false, hint: 'You have all the clues...' },
                        { text: 'Tell the King what you found', done: GameState.getFlag('toldKing'), failed: false, hint: 'Return to the Palace' }
                    ]
                }
            ];
        }

        if (GameState.level === 3) {
            return [
                {
                    title: "🛡️ THE ARMOR",
                    tasks: [
                        { text: 'Install the power core', done: GameState.getFlag('coreInstalled'), failed: false, hint: 'Use the core from the Trader' },
                        { text: 'Assemble hands & legs', done: GameState.getFlag('armorLimbsInstalled'), failed: false, hint: 'Work on the armor frame' },
                        { text: 'Repair head unit', done: GameState.getFlag('armorHeadFixed'), failed: false, hint: 'Fix the damaged head components' },
                        { text: 'Wait for Trader to finish armor', done: GameState.getFlag('armorRevealSeen'), failed: false, hint: 'Give him some time...' },
                        { text: 'Test the completed armor', done: GameState.getFlag('armorTested'), failed: false, hint: 'Time to suit up!' }
                    ]
                },
                {
                    title: "💔 THE TRUTH",
                    tasks: [
                        { text: `Build friendship with Park Cleaner (${GameState.flags.parkCleanerFriendship || 0}/3)`, done: (GameState.flags.parkCleanerFriendship || 0) >= 3, failed: false, hint: 'Visit the Park and talk often' },
                        { text: 'Learn the reason for the attack', done: GameState.getFlag('reasonForAttackKnown'), failed: false, hint: 'Talk to your allies' },
                        { text: "Wait for Trader's call", done: GameState.getFlag('traderCalledArmor'), failed: false, hint: 'Something is coming...' }
                    ]
                },
                {
                    title: "🌧️ BAD VIBE",
                    tasks: [
                        { text: 'Something is about to happen...', done: GameState.getFlag('gfDead'), failed: false, hint: 'Be ready for anything' }
                    ]
                }
            ];
        }

        if (GameState.level === 4) {
            return [
                {
                    title: "⚔️ REVENGE",
                    tasks: [
                        { text: 'Gather final combat supplies', done: GameState.getFlag('finalSuppliesReady'), failed: false, hint: 'Check your inventory and ensure you are fully prepared' },
                        { text: 'Enter Enemy Territory', done: GameState.getFlag('enteredEnemyTerritory'), failed: false, hint: 'Head to the border—there is no turning back' }
                    ]
                },
                {
                    title: "💣 Behind Enemy Lines",
                    tasks: [
                        { text: 'Disable the perimeter defenses', done: GameState.getFlag('defensesDisabled'), failed: false, hint: 'Look for a way to shut down their turrets' },
                        { text: 'Defeat the Enemy Commander', done: GameState.getFlag('commanderDefeated'), failed: false, hint: 'A tough fight awaits' }
                    ]
                },
                {
                    title: "💀 The Final Stand",
                    tasks: [
                        { text: 'Confront the Enemy Leader', done: GameState.getFlag('leaderConfronted'), failed: false, hint: 'Face the one responsible for everything' },
                        { text: 'End the Threat', done: GameState.getFlag('gameFinished'), failed: false, hint: 'For the city, for her... end it.' }
                    ]
                }
            ];
        }

        return [{ title: "📜 Prologue", tasks: [{ text: 'No tasks yet', done: false, failed: false, hint: null }] }];
    }

    getArmorStatus() {
        const coreInstalled = GameState.getFlag('coreInstalled')
        const limbsDone = GameState.getFlag('armorLimbsInstalled')
        const headDone = GameState.getFlag('armorHeadFixed')
        const traderDone = GameState.getFlag('armorRevealSeen')

        const doneParts = [coreInstalled, limbsDone, headDone, traderDone].filter(Boolean).length
        let status = `🤖 Armor: ${doneParts}/4 steps`

        if (traderDone) {
            status += '  |  ✅ COMPLETE'
        } else if (headDone) {
            status += '  |  🔧 Trader finishing...'
        } else if (limbsDone) {
            status += '  |  Next: Fix head unit'
        } else if (coreInstalled) {
            status += '  |  Next: Assemble limbs'
        } else {
            status += '  |  Next: Install core'
        }

        return status
    }

    destroy() {
        if (this.bar) this.bar.destroy()
        if (this.statsText) this.statsText.destroy()
        if (this.dayText) this.dayText.destroy()
        if (this.levelText) this.levelText.destroy()
        if (this.crisisBarBg) this.crisisBarBg.destroy()
        if (this.crisisBar) this.crisisBar.destroy()
        if (this.crisisLabel) this.crisisLabel.destroy()

        if (this.hubIcon) this.hubIcon.destroy()
        if (this.invIcon) this.invIcon.destroy()
        if (this.taskIcon) this.taskIcon.destroy()

        if (this.timeIcon) this.timeIcon.destroy()
        if (this.dayPillTab) this.dayPillTab.destroy()
        if (this.dayPillText) this.dayPillText.destroy()

        if (this.invVisible) this.hideInventory();
        if (this.taskVisible) this.hideTaskPanel();

        if (this._escHandler) {
            this.scene.input.keyboard.off('keydown-ESC', this._escHandler)
            this._escHandler = null
        }
    }
}