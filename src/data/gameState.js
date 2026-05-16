const GameState = {

    // ─── Time System ───────────────────────────────────
    day: 1,
    maxDays: 7,
    timeOfDay: 'morning',
    timeIndex: 0,

    advanceTime() {
        this.timeIndex++
        if (this.timeIndex >= 4) {
            this.timeIndex = 0
            this.day++
        }
        const times = ['morning', 'afternoon', 'evening', 'night']
        this.timeOfDay = times[this.timeIndex]
        return this.isGameOver()
    },

    skipToMorning() {
        this.timeIndex = 0
        this.timeOfDay = 'morning'
        this.day++
        return this.isGameOver()
    },

    skipToAfternoon() {
        if (this.timeIndex < 1) {
            this.timeIndex = 1
            this.timeOfDay = 'afternoon'
        }
    },

    skipToEvening() {
        if (this.timeIndex < 2) {
            this.timeIndex = 2
            this.timeOfDay = 'evening'
        }
    },

    skipToNight() {
        if (this.timeIndex < 3) {
            this.timeIndex = 3
            this.timeOfDay = 'night'
        }
    },

    isGameOver() {
        return this.day > this.maxDays
    },

    getDaysLeft() {
        return Math.max(0, this.maxDays - this.day + 1)
    },

    getTimeIcon() {
        const icons = {
            'morning': '🌅',
            'afternoon': '☀️',
            'evening': '🌆',
            'night': '🌙'
        }
        return icons[this.timeOfDay]
    },

    getTimeColor() {
        const colors = {
            'morning': '#ffdd44',
            'afternoon': '#ffffff',
            'evening': '#ff8844',
            'night': '#4444aa'
        }
        return colors[this.timeOfDay]
    },

    // ─── Core Stats ────────────────────────────────────
    level: 1,
    money: 250,
    reputation: 10,
    elixir: 10,

    skills: {
        repair: 5,
        research: 0,
        combat: 0
    },

    armor: {
        isHalfDone: true,
        hasCore: false,
        parts: []
    },

    // ─── Inventory ─────────────────────────────────────
    inventory: [],

    addItem(item) {
        if (!this.inventory) this.inventory = []
        const existing = this.inventory.find(i => i.id === item.id)
        if (existing) {
            existing.quantity += item.quantity || 1
        } else {
            this.inventory.push({
                ...item,
                quantity: item.quantity || 1
            })
        }
    },

    removeItem(id, quantity = 1) {
        const item = this.inventory.find(i => i.id === id)
        if (item) {
            item.quantity -= quantity
            if (item.quantity <= 0) {
                this.inventory = this.inventory.filter(i => i.id !== id)
            }
            return true
        }
        return false
    },

    hasItem(id) {
        return this.inventory.some(i => i.id === id)
    },

    getItem(id) {
        return this.inventory.find(i => i.id === id)
    },

    // ─── Flags ─────────────────────────────────────────
    flags: {
        // ─── Items ─────────────────────────────────────
        hasCommsDevice: false,
        gaveCommsToGF: false,

        // ─── Intro ─────────────────────────────────────
        introSeen: false,

        // ─── Level 1 ───────────────────────────────────
        workshopIntroSeen: false,
        junkyardIntroSeen: false,
        electricalUnlocked: false,
        metTrader: false,
        traderHintShown: false,
        electricalUnlockShown: false,
        boughtCore: false,
        secretBaseRevealed: false,
        secretBaseVisited: false,
        secretBaseIntroSeen: false,

        // ─── Armor Assembly ────────────────────────────
        coreInstalled: false,
        armorLimbsInstalled: false,
        armorHeadFixed: false,
        playerPartsDone: false,
        traderFinishing: false,
        armorRevealSeen: false,       // ← ADD THIS
        armorComplete: false,
        armorPlatingInstalled: false,

        // ─── Level 2 ───────────────────────────────────
        metKing: false,
        kingGaveQuest: false,
        metLuvaza: false,
        metParkCleaner: false,
        learnedTruth: false,
        toldKing: false,
        rebuiltBuildings: false,

        // ─── Clues ─────────────────────────────────────
        researchClueFound: false,
        luvazaClueFound: false,
        parkClueFound: false,
        traderClueFound: false,

        // ─── Level 3 ───────────────────────────────────
        conspiracyRevealed: false,
        enemyTerritoryUnlocked: false,
        enemyIntroSeen: false,
        enemyTerritoryCleared: false,
        parkCleanerRevealed: false,
        reasonForAttackKnown: false,


        // ─── Level 4 ───────────────────────────────────
        finalSuppliesReady: false,
        enteredEnemyTerritory: false,
        defensesDisabled: false,
        commanderDefeated: false,
        leaderConfronted: false,
        gameFinished: false,


        // ─── GF Story ──────────────────────────────────
        gfCalledComms: false,
        gfHeardConversation: false,
        gfDead: false,

        // ─── Friendship ────────────────────────────────
        parkCleanerFriendship: 0,

        // ─── Trader Calls ──────────────────────────────
        traderCalledCleaner: false,
        luvazaVisitedPark: false,
        traderCalledArmor: false,
        armorTested: false,
    },

    // ─── Flag Methods ──────────────────────────────────
    setFlag(flag, value = true) {
        this.flags[flag] = value
        this.tryAdvanceLevel()
    },

    getFlag(flag) {
        return this.flags[flag]
    },

    // ─── Money Methods ─────────────────────────────────
    earnMoney(amount) {
        this.money += amount
    },

    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount
            return true
        }
        return false
    },

    // ─── Other Methods ─────────────────────────────────
    addReputation(amount) {
        this.reputation += amount
    },

    addSkill(skill, amount) {
        if (this.skills[skill] !== undefined) {
            this.skills[skill] += amount
            if (skill === 'repair' && this.skills.repair >= 5) {
                this.flags.electricalUnlocked = true
            }
        }
    },

    addElixir(amount) {
        this.elixir += amount
    },

    addArmorPart(part) {
        if (!this.armor.parts.includes(part)) {
            this.armor.parts.push(part)
        }
    },

    advanceLevel() {
        this.level++
    },

    // ─── Level Completion Checks ───────────────────────
    isLevel1Complete() {
        // ─── Level 1 done when core is bought ──────────
        return this.flags.boughtCore === true
    },

    isLevel2ReadyToAdvance() {
        return (
            this.flags.metKing &&
            this.flags.metLuvaza &&
            this.flags.rebuiltBuildings &&
            this.flags.metParkCleaner &&
            this.flags.learnedTruth &&
            this.flags.toldKing
        )
    },

    isLevel3ReadyToAdvance() {
        return (
            this.flags.armorComplete &&
            this.flags.reasonForAttackKnown &&
            this.flags.gfDead
        )
    },

    tryAdvanceLevel() {
        let advanced = false

        if (this.level === 1 && this.isLevel1Complete()) {
            this.level = 2
            advanced = true
        }

        if (this.level === 2 && this.isLevel2ReadyToAdvance()) {
            this.level = 3
            advanced = true
        }

        if (this.level === 3 && this.isLevel3ReadyToAdvance()) {
            this.level = 4
            advanced = true
        }

        return advanced
    },

    // ─── Armor Status Helper ───────────────────────────
    getArmorStatus() {
        return {
            coreInstalled: this.flags.coreInstalled,
            limbsInstalled: this.flags.armorLimbsInstalled,
            headFixed: this.flags.armorHeadFixed,
            playerDone: this.flags.playerPartsDone,
            traderWorking: this.flags.traderFinishing,
            complete: this.flags.armorComplete,
            parts: this.armor.parts
        }
    },

    canMeetTrader() {
        return this.skills.repair >= 10
    }
}

export default GameState