import GameState from '../data/gameState.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene')
    }

    preload() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Background ────────────────────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a12)

        // ─── Title ─────────────────────────────────────
        this.add.text(W / 2, H / 2 - 100, '🤖 MECHFALL: CITY OF RUINS', {
            fontFamily: "'Orbitron', monospace",
            fontSize: '48px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5)

        // ─── Loading text ──────────────────────────────
        this.loadingText = this.add.text(W / 2, H / 2 + 20, 'Loading...', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5)

        // ─── Progress bar ──────────────────────────────
        const barW = 600
        const barH = 30
        const barX = W / 2 - barW / 2
        const barY = H / 2 + 70

        this.add.rectangle(W / 2, barY + barH / 2, barW + 4, barH + 4, 0x333333)
        this.progressBar = this.add.rectangle(
            barX + 2, barY + 2, 0, barH, 0x00ff88
        ).setOrigin(0, 0)

        // ─── Percentage text ──────────────────────────
        this.percentText = this.add.text(W / 2, barY + barH + 20, '0%', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5)

        // ─── File name text ────────────────────────────
        this.fileText = this.add.text(W / 2, barY + barH + 50, '', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '14px',
            fill: '#555555'
        }).setOrigin(0.5)

        // ─── Progress events ───────────────────────────
        this.load.on('progress', (value) => {
            this.progressBar.width = barW * value
            this.percentText.setText(`${Math.round(value * 100)}%`)
            this.loadingText.setText(value < 1 ? 'Loading...' : 'Ready!')
        })

        this.load.on('fileprogress', (file) => {
            this.fileText.setText(file.key)
        })

        this.load.on('complete', () => {
            this.fileText.setText('All assets loaded!')
            this.percentText.setText('100%')
            this.loadingText.setText('Ready!')
        })

        // ═══════════════════════════════════════════════
        // ─── LOAD ALL GAME ASSETS ──────────────────────
        // ═══════════════════════════════════════════════

        this.load.font('gloria', 'assets/fonts/GloriaHallelujah.ttf');


        //arrmor
        this.load.image('armor-nocore', 'assets/images/secretbase/armor_nocore.webp')
        this.load.image('armor-core', 'assets/images/secretbase/armor_core.webp')
        this.load.image('armor-nohead', 'assets/images/secretbase/armor_nohead.webp')
        this.load.image('armor-head', 'assets/images/secretbase/armor_head.webp')
        this.load.image('armor-ready', 'assets/images/secretbase/armor_ready.webp')

        // ─── Workshop ──────────────────────────────────
        this.load.image('workshop-morning', 'assets/images/workshop/workshop-morning.webp')
        this.load.image('workshop-noon', 'assets/images/workshop/workshop-noon.webp')
        this.load.image('workshop-evening', 'assets/images/workshop/workshop-evening.webp')
        this.load.image('workshop-night', 'assets/images/workshop/workshop-night.webp')

        this.load.image('lock-key', 'assets/images/ui/lock_key.webp')
        this.load.image('e-key', 'assets/images/ui/E_key.webp')
        this.load.image('lock-overlay', 'assets/images/ui/electric_bench_locked.webp')
        this.load.image('arrow', 'assets/images/ui/arrow.webp')


        // ─── Junkyard ──────────────────────────────────
        this.load.image('junkyard-morning', 'assets/images/junkyard/junkyard-morning.webp')
        this.load.image('junkyard-noon', 'assets/images/junkyard/junkyard-noon.webp')
        this.load.image('junkyard-evening', 'assets/images/junkyard/junkyard-evening.webp')
        this.load.image('junkyard-night', 'assets/images/junkyard/junkyard-night.webp')

        // ─── Palace ────────────────────────────────────
        this.load.image('palace-bg', 'assets/images/palace-bg.webp')

        // ─── Town Center ───────────────────────────────
        this.load.image('town-ruined', 'assets/images/towncenter/town_ruined.webp')
        this.load.image('town-overlay', 'assets/images/towncenter/overlay.webp')

        this.load.image('btn-hospital', 'assets/images/towncenter/hospital_button.webp')
        this.load.image('btn-water', 'assets/images/towncenter/water_button.webp')
        this.load.image('btn-power', 'assets/images/towncenter/power_button.webp')
        this.load.image('btn-town', 'assets/images/towncenter/town_button.webp')

        this.load.image('btn-hospital-fixed', 'assets/images/towncenter/fixed_hospital.webp')
        this.load.image('btn-water-fixed', 'assets/images/towncenter/fixed_water.webp')
        this.load.image('btn-power-fixed', 'assets/images/towncenter/fixed_power.webp')
        this.load.image('btn-town-fixed', 'assets/images/towncenter/fixed_town.webp')




        // ─── Park ──────────────────────────────────────
        this.load.image('park-bg', 'assets/images/park-bg.webp')

        // ─── UI Icons ──────────────────────────────────
        this.load.image('inventory-panel', 'assets/images/ui/inventory-panel.webp')
        this.load.image('quest-bg', 'assets/images/ui/quest.webp')

        this.load.image('lock-icon', 'assets/images/icons/lock.webp')
        this.load.image('inventory-icon', 'assets/images/icons/inventory.webp')
        this.load.image('tasks-icon', 'assets/images/icons/tasks.webp')
        this.load.image('hub-icon', 'assets/images/icons/hub.webp')

        this.load.image('time-morning', 'assets/images/ui/morning.webp')
        this.load.image('time-noon', 'assets/images/ui/noon.webp')
        this.load.image('time-evening', 'assets/images/ui/evening.webp')
        this.load.image('time-night', 'assets/images/ui/night.webp')

        this.load.image('choice-panel-bg', 'assets/images/ui/choice-panel-bg.webp')
        this.load.image('choice-btn-green', 'assets/images/ui/choice-btn-green.webp')
        this.load.image('choice-btn-teal', 'assets/images/ui/choice-btn-teal.webp')
        this.load.image('choice-btn-purple', 'assets/images/ui/choice-btn-purple.webp')
        this.load.image('choice-btn-dark', 'assets/images/ui/choice-btn-dark.webp')
        // ─── Hub ───────────────────────────────────────
        this.load.image('hub-bg', 'assets/images/hub-bg.webp')



        // ─── Secret Base ───────────────────────────────
        this.load.image('secretbase-bg', 'assets/images/secretbase-bg.webp')
        this.load.image('armor-still', 'assets/images/armor-still.webp')


        // ─── Luvaza ────────────────────────────────────
        this.load.image('dialog-luvaza-neutral', 'assets/images/dialog/Luvaza/Neutral.webp')
        this.load.image('dialog-luvaza-happy', 'assets/images/dialog/Luvaza/Happy.webp')
        this.load.image('dialog-luvaza-sad', 'assets/images/dialog/Luvaza/Sad.webp')
        this.load.image('dialog-luvaza-worried', 'assets/images/dialog/Luvaza/Worried.webp')
        this.load.image('dialog-luvaza-surprised', 'assets/images/dialog/Luvaza/Surprised.webp')
        this.load.image('dialog-luvaza-serious', 'assets/images/dialog/Luvaza/Serious.webp')

        // ─── Trader ────────────────────────────────────
        this.load.image('dialog-trader-neutral', 'assets/images/dialog/Trader/Neutral.webp')
        this.load.image('dialog-trader-suspicious', 'assets/images/dialog/Trader/Suspicious.webp')
        this.load.image('dialog-trader-serious', 'assets/images/dialog/Trader/Serious.webp')
        this.load.image('dialog-trader-surprised', 'assets/images/dialog/Trader/Surprised.webp')
        this.load.image('dialog-trader-smug', 'assets/images/dialog/Trader/Smug.webp')

        // ─── Park Cleaner ──────────────────────────────
        this.load.image('dialog-parkcleaner-neutral', 'assets/images/dialog/ParkCleaner/Neutral.webp')
        this.load.image('dialog-parkcleaner-worried', 'assets/images/dialog/ParkCleaner/Worried.webp')
        this.load.image('dialog-parkcleaner-serious', 'assets/images/dialog/ParkCleaner/Serious.webp')
        this.load.image('dialog-parkcleaner-surprised', 'assets/images/dialog/ParkCleaner/Surprised.webp')

        // ─── King Expressions ──────────────────────────
        this.load.image('dialog-king-neutral', 'assets/images/dialog/king/Neutral.webp')
        this.load.image('dialog-king-serious', 'assets/images/dialog/king/Serious.webp')
        this.load.image('dialog-king-angry', 'assets/images/dialog/king/Angry.webp')
        this.load.image('dialog-king-surprised', 'assets/images/dialog/king/Surprised.webp')
        this.load.image('dialog-king-suspicious', 'assets/images/dialog/king/Suspicious.webp')

        // ─── Player Expressions ────────────────────────
        this.load.image('dialog-player-neutral', 'assets/images/dialog/Player/Neutral.webp')
        this.load.image('dialog-player-serious', 'assets/images/dialog/Player/Serious.webp')
        this.load.image('dialog-player-angry', 'assets/images/dialog/Player/Angry.webp')
        this.load.image('dialog-player-surprised', 'assets/images/dialog/Player/Surprised.webp')
        this.load.image('dialog-player-determined', 'assets/images/dialog/Player/Smirk.webp')
        this.load.image('dialog-player-sad', 'assets/images/dialog/Player/Sad.webp')

        //mini game
        this.load.image('energystabliser', 'assets/images/minigame/energystabliser.webp')

        // ─── AUDIO ─────────────────────────────────────
        // Level Audio
        this.load.audio('level12', 'assets/audio/level12.ogg');
        this.load.audio('level3', 'assets/audio/level3.ogg');
        this.load.audio('level4', 'assets/audio/level4.ogg');

        // Menu & Intro Audio
        this.load.audio('intro', 'assets/audio/intro.ogg'); // Used for IntroScene
        this.load.audio('main-menu', 'assets/audio/Main_menu.ogg');
        this.load.audio('main-menu-loop', 'assets/audio/Main_menu_loop.ogg');


        this.load.image('hub-bg', 'assets/images/hub-bg.webp')

        this.load.image('loc-workshop', 'assets/images/locations/workshop.webp')
        this.load.image('loc-junkyard', 'assets/images/locations/junkyard.webp')
        this.load.image('loc-palace', 'assets/images/locations/palace.webp')
        this.load.image('loc-towncenter', 'assets/images/locations/towncenter.webp')
        this.load.image('loc-park', 'assets/images/locations/park.webp')
        this.load.image('loc-enemy', 'assets/images/locations/enemy.webp')

        this.load.image('hub-overlay', 'assets/images/locations/border.webp')
        this.load.image('legend', 'assets/images/locations/legend.webp')
        // Cutscene Audio
        this.load.audio('sadscene', 'assets/audio/Sadscene.ogg');


        this.load.image('enemy-bg', 'assets/images/enemy-bg.webp')
        this.load.image('heart-full', 'assets/images/ui/heart-full.webp')
        this.load.image('heart-empty', 'assets/images/ui/heart-empty.webp')
        this.load.image('monitor-frame', 'assets/images/ui/monitor-frame.webp')

        this.load.spritesheet('enemy-walk', 'assets/images/enemy/Walk.webp', { frameWidth: 96, frameHeight: 96 })
        this.load.spritesheet('enemy-attack', 'assets/images/enemy/Attack_1.webp', { frameWidth: 96, frameHeight: 96 })
        this.load.spritesheet('enemy-idle', 'assets/images/enemy/Idle.webp', { frameWidth: 96, frameHeight: 96 })
        this.load.spritesheet('enemy-hurt', 'assets/images/enemy/Hurt.webp', { frameWidth: 96, frameHeight: 96 })
        this.load.spritesheet('enemy-dead', 'assets/images/enemy/Death.webp', { frameWidth: 96, frameHeight: 96 })

        this.load.spritesheet('player-walk', 'assets/images/player/Walk.webp', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('player-run', 'assets/images/player/Run.webp', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('player-shield', 'assets/images/player/Shield.webp', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('player-jump', 'assets/images/player/Jump.webp', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('player-idle', 'assets/images/player/Idle.webp', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('player-hurt', 'assets/images/player/Hurt.webp', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('player-dead', 'assets/images/player/Dead.webp', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('player-attack', 'assets/images/player/Attack_1.webp', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('player-attack2', 'assets/images/player/Attack_2.webp', { frameWidth: 128, frameHeight: 128 })
        this.load.spritesheet('player-attack3', 'assets/images/player/Attack_3.webp', { frameWidth: 128, frameHeight: 128 })

                this.load.image('gauge_panel_bg', 'assets/images/minigame/gauge_back.webp');      // The empty valve frame
        this.load.image('gauge_fill', 'assets/images/minigame/green_fill.webp');    // The green liquid/bar
        this.load.image('gauge_panel_overlay', 'assets/images/minigame/gauge_glass.webp'); // The highlights/top frame
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ✅ Attach the dynamic music function to the window
        window.playDynamicMusic = playDynamicMusic;

        // ─── Show "Click to Start" ─────────────────────
        const startBtn = this.add.text(W / 2, H / 2 + 180, '[ Click to Start ]', {
            fontFamily: 'Courier, monospace',
            fontSize: '28px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })

        // ─── Pulse animation ───────────────────────────
        this.tweens.add({
            targets: startBtn,
            alpha: { from: 1, to: 0.4 },
            duration: 800,
            yoyo: true,
            repeat: -1
        })

        startBtn.on('pointerover', () => startBtn.setFill('#ffffff'))
        startBtn.on('pointerout', () => startBtn.setFill('#00ff88'))
        startBtn.on('pointerdown', () => {
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene')
            })
        })

        // ─── Also allow SPACE to start ─────────────────
        this.input.keyboard.once('keydown-SPACE', () => {
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene')
            })
        })
    }
}

function playDynamicMusic(scene, options = {}) {
    let desiredTrack = '';
    let shouldLoop = true;

    // ─── 1. DETERMINE TRACK ─────────────────────────────

    if (scene.scene.key === 'IntroScene') {
        desiredTrack = 'intro';
        shouldLoop = false;
    }
    else if (scene.scene.key === 'MenuScene') {
        const currentMusic = scene.registry.get('currentMusic');
        // If the loop is already playing, do nothing
        if (currentMusic === 'main-menu-loop') return;

        desiredTrack = 'main-menu';
        shouldLoop = false;
    }
    else if (scene.scene.key === 'CutsceneScene') {
        const cutsceneId = scene.scene.settings?.data?.cutsceneId || GameState.cutsceneId;

        if (cutsceneId === 'luvaza_dead') {
            desiredTrack = 'sadscene';
        } else {
            desiredTrack = 'intro';
        }
        shouldLoop = false;
    }
    else if (GameState.level === 4) {
        desiredTrack = 'level4';
    }
    else if (GameState.level === 1) {
        desiredTrack = 'level12';
    }
    else if (GameState.level === 3 || GameState.level === 2) {
        desiredTrack = 'level3';
    }

    // Manual Override
    if (options.overrideTrack) {
        desiredTrack = options.overrideTrack;
        shouldLoop = (desiredTrack === 'main-menu-loop');
    }

    if (!desiredTrack) return;

    // ─── 2. EARLY EXIT CHECK (Crucial Fix) ────────────────
    // If we are already playing this track, STOP here. 
    // Do not stop the old song, do not create a new one.
    if (!options.overrideTrack && scene.registry.get('currentMusic') === desiredTrack) {
        return;
    }

    // ─── 3. STOP OLD SONG IMMEDIATELY (No Fade Out) ───────
    // This ensures zero overlap.
    const oldSong = scene.registry.get('currentMusicInstance');

    if (oldSong) {
        // Remove listeners to prevent the 'complete' event firing (e.g. for menu loop)
        oldSong.removeAllListeners();

        // Kill any tweens acting on the old song
        scene.tweens.killTweensOf(oldSong);

        // STOP immediately. This cuts the audio dead.
        oldSong.stop();
        oldSong.destroy();
    }

    // ─── 4. PLAY NEW SONG ─────────────────────────────────

    const newSong = scene.sound.add(desiredTrack, {
        loop: shouldLoop,
        volume: 0 // Start silent for smooth fade-in
    });

    newSong.play();

    // Fade in the new song (You can increase duration if you want a softer start)
    scene.tweens.add({
        targets: newSong,
        volume: 0.4,
        duration: 500, // Quick fade in (0.5 seconds)
        onComplete: () => {
            // Optional: Set to max volume after fade
            newSong.setVolume(0.4);
        }
    });

    // ─── 5. HANDLE MENU LOOP CHAINING ─────────────────────
    if (desiredTrack === 'main-menu') {
        newSong.on('complete', () => {
            // Only start the loop if we are still in the menu scene
            if (scene.scene.key === 'MenuScene') {
                playDynamicMusic(scene, { overrideTrack: 'main-menu-loop' });
            }
        });
    }

    // ─── 6. UPDATE REGISTRY ───────────────────────────────
    scene.registry.set('currentMusic', desiredTrack);
    scene.registry.set('currentMusicInstance', newSong);
}