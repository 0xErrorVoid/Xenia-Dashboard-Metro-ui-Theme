document.addEventListener('alpine:initialized', () => {
    const hooks = Alpine.store('hooks');
    const app = Alpine.store('app');
    const actions = Alpine.store('actions');

    let themeLtLock = false;
    let themeRtLock = false;
    let dpadLockX = false;
    let dpadLockY = false;
    let isSelectingImage = false;
    app.customTileBgs = {};

    hooks.on('onViewChange', (data) => {
        const app = Alpine.store('app');
        if (app.showGameInfoOverlay) {
            app.showGameInfoOverlay = false;
        }
    });

hooks.on('onAppReady', async () => {
        let themeMods = await window.electronAPI.get('mods_' + app.currentTheme) || {};
        app.customTileBgs = themeMods.customTileBgs || {};
    });

    actions.changeCustomTileBg = async function(item) {
        if (item.view !== 'none' || isSelectingImage) return;
        
        isSelectingImage = true;
        this.playSound('select');
        
        try {
            const filePath = await window.electronAPI.openImageFile();
            
            if (filePath) {
                app.customTileBgs[item.id] = `file://${filePath.replace(/\\/g, '/')}`;
                
                let themeMods = await window.electronAPI.get('mods_' + app.currentTheme) || {};
                
                themeMods.customTileBgs = JSON.parse(JSON.stringify(app.customTileBgs));
                
                await window.electronAPI.set('mods_' + app.currentTheme, themeMods);
            }
        } finally {
            isSelectingImage = false;
        }
    };

    actions.resetCustomTileBg = async function(item) {
        if (app.customTileBgs[item.id]) {
            delete app.customTileBgs[item.id];
            
            let themeMods = await window.electronAPI.get('mods_' + app.currentTheme) || {};
            themeMods.customTileBgs = JSON.parse(JSON.stringify(app.customTileBgs));
            await window.electronAPI.set('mods_' + app.currentTheme, themeMods);
            
            this.playSound('back');
        }
    };

    hooks.on('onAppReady', async (data) => {
    app.masterIndex = 0;        
    app.focusedList = 'detail'; 
    actions.updateDetailMenu(); 

    
    
    
    const METRO_PRESETS = [
        { 
            id: 'metro-green', name: 'Metro Green (Default)', 
            colors: { 
                primary: '#107c10', light: '#1bad1b', dark: '#0b530b', 
                bgTop: '#5f5f5f', bgBottom: '#3a3a3a', 
                listBgTop: '#2d3235', listBgBottom: '#202326', 
                text: '#ffffff', textSec: '#cccccc',
                panel: '#000000', alert: '#ff6b6b',
                btnA: '#59c853', btnB: '#e5443a', btnX: '#3a82e5', btnY: '#f2c40e'
            }
        },
        { 
            id: 'metro-blue', name: 'Metro Blue', 
            colors: { 
                primary: '#0078d7', light: '#2b88d8', dark: '#005a9e', 
                bgTop: '#212f3d', bgBottom: '#17202a', 
                listBgTop: '#1a2530', listBgBottom: '#0d1317', 
                text: '#ffffff', textSec: '#abc8e0',
                panel: '#0d1317', alert: '#ff6b6b',
                btnA: '#59c853', btnB: '#e5443a', btnX: '#3a82e5', btnY: '#f2c40e'
            }
        },
        { 
            id: 'metro-red', name: 'Metro Red', 
            colors: { 
                primary: '#d13438', light: '#e81123', dark: '#a4262c', 
                bgTop: '#4a2323', bgBottom: '#291212', 
                listBgTop: '#3d1c1c', listBgBottom: '#1f0d0d', 
                text: '#ffffff', textSec: '#e0c6c6',
                panel: '#1f0d0d', alert: '#ff4444',
                btnA: '#59c853', btnB: '#e5443a', btnX: '#3a82e5', btnY: '#f2c40e'
            }
        },
        { 
            id: 'metro-purple', name: 'Metro Purple', 
            colors: { 
                primary: '#68217a', light: '#8a2be2', dark: '#4a148c', 
                bgTop: '#3e2745', bgBottom: '#1f1024', 
                listBgTop: '#2e1a33', listBgBottom: '#150b17', 
                text: '#ffffff', textSec: '#dcc6e0',
                panel: '#150b17', alert: '#ff6b6b',
                btnA: '#59c853', btnB: '#e5443a', btnX: '#3a82e5', btnY: '#f2c40e'
            } 
        }
    ];

    
    const userSavedThemes = await window.electronAPI.get('userSavedThemes') || [];
    app.customBasePresets = METRO_PRESETS;
    
    app.colorPresets = [
        ...METRO_PRESETS,
        ...userSavedThemes,
        { id: 'custom', name: 'Create Custom Theme', colors: null }
    ];

    
    let themeMods = await window.electronAPI.get('mods_' + app.currentTheme) || {};
    if (themeMods.colors) {
        actions.applyColorTheme(themeMods.colors);
        app.activeColorThemeId = themeMods.activeColorThemeId || 'metro-green';
        app.customColors = { ...themeMods.colors };
    } else {
        
        actions.applyColorTheme(METRO_PRESETS[0].colors);
        app.activeColorThemeId = 'metro-green';
    }

        const originalMoveFocus = actions.moveFocus;
        actions.moveFocus = function(direction) {
            if (app.focusedCollection === 'displayItems') {
                let newIndex = app.focusedIndex + direction;
                if (newIndex < 0) newIndex = 0;
                if (newIndex > 0) newIndex = 0; 
                
                if (newIndex !== app.focusedIndex) {
                    app.focusedIndex = newIndex;
                    this.playSound('focus');
                    this.scrollToFocusedElement('display-item-' + newIndex);
                }
                return; 
            }
            originalMoveFocus.call(this, direction);
        };

        const originalSelectFocusedItem = actions.selectFocusedItem;
        actions.selectFocusedItem = function() {
            const app = Alpine.store('app');
            if (app.focusedCollection === 'filteredLibraryGames' || app.focusedCollection === 'gamesList') {
                const item = app[app.focusedCollection][app.focusedIndex];
                if (item && item.path && !app.gameSelectionAnimating) {
                    app.gameSelectionAnimating = true;
                    app.selectedGame = item;
                    this.playSound('select');
                    
                    setTimeout(() => {
                        this.goBack(); 
                        setTimeout(() => {
                            
                            app.masterIndex = 0; 
                            actions.updateDetailMenu(); 
                            app.detailIndex = 0; 
                            app.focusedList = 'detail';
                            app.gameSelectionAnimating = false;
                        }, 800);
                    }, 500);
                }
                return; 
            }
            originalSelectFocusedItem.call(this);
        };
        const originalSelectDetailItem = actions.selectDetailItem;
        actions.selectDetailItem = function() {
            const app = Alpine.store('app');
            
            if (app.focusedList === 'detail') {
                const focusedItem = app.detailMenu[app.detailIndex];
                
                if (focusedItem && focusedItem.view === 'none') {
                    this.changeCustomTileBg(focusedItem);
                    return;
                }
            }
            
            if (originalSelectDetailItem) {
                originalSelectDetailItem.call(this);
            }
        };
});

    hooks.on('onGamepadInput', (input) => {
        if (input.event === 'button_x' && input.value > 0.5) {
            if (app.focusedList === 'detail') {
                const focusedItem = app.detailMenu[app.detailIndex];
                if (focusedItem && focusedItem.view === 'none' && app.customTileBgs[focusedItem.id]) {
                    actions.resetCustomTileBg(focusedItem);
                }
            }
        }
        if (input.event === 'button_a' && input.value > 0.5) {
            if (app.currentView === 'dashboard' && !app.isKeyboardOpen && !app.isProfileSelectorOpen && !app.isGuideOpen) {
                if (app.focusedList === 'detail') {
                    const focusedItem = app.detailMenu[app.detailIndex];
                    if (focusedItem && focusedItem.view === 'none') {
                        actions.changeCustomTileBg(focusedItem);
                        return; 
                    }
                }
            }
        }
    if (app.currentView === 'dashboard') {
        
        
        if (app.isKeyboardOpen || app.isProfileSelectorOpen || app.isGuideOpen || app.showGameInfoOverlay || app.isFriendsOverlayOpen) {
            return;
        }

        if (app.focusedList !== 'detail') {
            app.focusedList = 'detail';
        }

        if (input.event === 'left_trigger') {
            if (input.value > 0.8 && !themeLtLock) {
                themeLtLock = true;
                let newIndex = app.masterIndex - 1;
                if (newIndex >= 0) {
                    app.masterIndex = newIndex;
                    app.detailIndex = 0; 
                    actions.playSound('channelUp');
                    actions.updateDetailMenu();
                }
            } else if (input.value < 0.1) { themeLtLock = false; }
        }
        
        if (input.event === 'right_trigger') {
            if (input.value > 0.8 && !themeRtLock) {
                themeRtLock = true;
                let newIndex = app.masterIndex + 1;
                if (newIndex < app.masterMenu.length) {
                    app.masterIndex = newIndex;
                    app.detailIndex = 0; 
                    actions.playSound('channelDown');
                    actions.updateDetailMenu();
                }
            } else if (input.value < 0.1) { themeRtLock = false; }
        }

        
        const isNavEvent = ['dpad_x', 'dpad_y', 'left_stick_x', 'left_stick_y'].includes(input.event);
        if (isNavEvent) {
            app.inputLocked = true; 
            setTimeout(() => app.inputLocked = false, 20);

            if (input.event === 'dpad_x' || input.event === 'left_stick_x') {
                if (Math.abs(input.value) > 0.5 && !dpadLockX) {
                    dpadLockX = true;
                    setTimeout(() => dpadLockX = false, 150);
                    handleStrictGrid(input.value > 0 ? 'right' : 'left');
                } else if (input.value === 0) { dpadLockX = false; }
            }

            if (input.event === 'dpad_y' || input.event === 'left_stick_y') {
                if (Math.abs(input.value) > 0.5 && !dpadLockY) {
                    dpadLockY = true;
                    setTimeout(() => dpadLockY = false, 150);
                    
                    let yValue = input.value;
                    if (input.event === 'left_stick_y' && window.navigator.platform.toLowerCase().includes('win')) {
                        yValue = -yValue; 
                    }
                    
                    handleStrictGrid(yValue > 0 ? 'down' : 'up');
                    
                } else if (input.value === 0) { dpadLockY = false; }
            }
        }
    }
});




document.addEventListener('keydown', (e) => {
    if (app.currentView !== 'dashboard') return;
    
    if (app.isKeyboardOpen || app.isProfileSelectorOpen || app.isGuideOpen || app.showGameInfoOverlay) return;

    const key = e.key;

    if (key === 'q' || key === 'Q' || key === 'PageUp') {
        e.preventDefault();
        e.stopPropagation();
        let newIndex = app.masterIndex - 1;
        if (newIndex >= 0) {
            app.masterIndex = newIndex;
            app.detailIndex = 0; 
            actions.playSound('channelUp');
            actions.updateDetailMenu();
        }
        return;
    }
    
    if (key === 'e' || key === 'E' || key === 'PageDown') {
        e.preventDefault();
        e.stopPropagation();
        let newIndex = app.masterIndex + 1;
        if (newIndex < app.masterMenu.length) {
            app.masterIndex = newIndex;
            app.detailIndex = 0; 
            actions.playSound('channelDown');
            actions.updateDetailMenu();
        }
        return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        const direction = key.replace('Arrow', '').toLowerCase();
        handleStrictGrid(direction);
    }
}, true);


    
    
    function handleStrictGrid(direction) {
        
        const currentTab = app.masterMenu[app.masterIndex].id;
        let navMap = {};

        if (currentTab === 'home') {
            
            navMap = {
                0: { up: 0, down: 3, left: 0, right: 1 }, 
                1: { up: 1, down: 1, left: 0, right: 2 }, 
                2: { up: 2, down: 2, left: 1, right: 2 }, 
                3: { up: 0, down: 3, left: 3, right: 1 }
            };
        } else if (currentTab === 'achievements') {
            
            navMap = {
                0: { up: 0, down: 1, left: 0, right: 0 }, 
                1: { up: 0, down: 1, left: 1, right: 2 }, 
                2: { up: 0, down: 2, left: 1, right: 2 }  
            };
        } else if (currentTab === 'settings') {
            
            navMap = {
                
                0: { up: 0, down: 3, left: 0, right: 1 }, 
                1: { up: 1, down: 4, left: 0, right: 2 }, 
                2: { up: 2, down: 5, left: 1, right: 2 }, 
                
                
                3: { up: 0, down: 3, left: 3, right: 4 }, 
                4: { up: 1, down: 4, left: 3, right: 5 }, 
                5: { up: 2, down: 5, left: 4, right: 5 }
            };
        }
        else if (currentTab === 'games') {

            navMap = {
                0: { up: 0, down: 0, left: 0, right: 1 },
                1: { up: 1, down: 2, left: 0, right: 1 },
                2: { up: 1, down: 2, left: 0, right: 3 },
                3: { up: 1, down: 3, left: 2, right: 3 }
            };
        }

        const currentIndex = app.detailIndex;
        const nextIndex = navMap[currentIndex]?.[direction];

        if (nextIndex !== undefined && nextIndex !== currentIndex && nextIndex < app.detailMenu.length) {
            app.detailIndex = nextIndex;
            actions.playSound('focus');
        }
    }

    
    
    
    Alpine.store('actions').loadDashboardData = async function() {
        const app = Alpine.store('app');
        
        const metroMenuData = [
            {
              "id": "home",
              "name": "HOME",
              "detailMenu": [
                { "id": "opentray", "name": "Open Tray", "view": "opentray", "icon": "/assets/icons/start.png"},
                { "id": "pins", "name": "", "view": "none", "icon": "", "heroUrl": "assets/images/items/Home-Center.gif" },
                { "id": "explore", "name": "", "view": "none", "icon": "", "heroUrl": "assets/images/items/Home-Rightside.gif"  },
                { "id": "recent", "name": "", "view": "none", "icon": "", "heroUrl": "assets/images/items/Home-LeftDownside.gif"  }
              ] 
            },
            {
              "id": "achievements",
              "name": "ACHIEVEMENTS",
              "detailMenu": [
                { "id": "achievements", "name": "Achievements Hub", "view": "achievements", "icon": "/assets/icons/achievements.png", "heroUrl": "assets/images/items/Achievements-Top.gif" },
                { "id": "content", "name": "System Content", "view": "settings-content", "icon": "/assets/icons/content.webp", "heroUrl": "assets/images/items/Achievements-DownLeft.gif"},
                { "id": "stats", "name": "", "view": "none", "icon": "", "heroUrl": "assets/images/items/Achievements-DownRight.gif", "html": `<div style="position: absolute; bottom: 20px; left: 20px; z-index: 10; display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.6); padding: 8px 15px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px); box-shadow: 0 4px 10px rgba(0,0,0,0.5);"><div style="width: 24px; height: 24px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #000; font-size: 14px; box-shadow: 0 0 8px rgba(255,255,255,0.6);">G</div><span style="font-size: 1.4rem; font-weight: bold; color: #fff; text-shadow: 0 2px 4px #000;" x-text="$store.app.gamerscore + ' G'"></span></div>` }
              ] 
            },
            {
              "id": "games",
              "name": "GAMES",
              "detailMenu": [
                { "id": "gamelibrary", "name": "Game Library", "view": "game-library", "icon": "/assets/icons/games.png" },
                { "id": "store", "name": "", "view": "none", "icon": "", "heroUrl": "assets/images/items/Games-TopRight.gif" },
                { "id": "demos", "name": "", "view": "none", "icon": "", "heroUrl": "assets/images/items/Games-LeftDown.gif" },
                { "id": "indie", "name": "", "view": "none", "icon": "" ,"heroUrl": "assets/images/items/Games-RightDown.gif" }
              ] 
            },
            {
              "id": "settings",
              "name": "SETTINGS",
              "detailMenu": [
                { "id": "Settings-Core", "name": "Settings Core", "view": "settings-core", "icon": "/assets/icons/Console-Xbox.png" },
                { "id": "Settings-Color", "name": "Interface Color", "view": "settings-colors", "icon": "/assets/icons/color.png" },
                { "id": "Settings-Theme", "name": "Themes Settings", "view": "settings-system", "icon": "/assets/icons/System Settings.png" },
                { "id": "Settings-Wellpaper", "name": "Wellpaper Settings", "view": "settings-display", "icon": "/assets/icons/wallpaper_settings.png" },
                { "id": "Settings-Sound", "name": "Sound Settings", "view": "settings-audio", "icon": "/assets/icons/Sound.png" },
                { "id": "Settings-Language", "name": "Language", "view": "language-select", "icon": "/assets/icons/earth.png" }
              ] 
            },
            {
              "id": "about",
              "name": "ABOUT",
              "detailMenu": [
                { "id": "about", "name": "About Project", "view": "about-hub", "icon": "/assets/icons/About.webp", "heroUrl": "assets/images/items/About-center.gif" },
              ] 
            }
        ];

        app.masterMenu = metroMenuData;
        app.focusedList = 'detail'; 
        Alpine.store('actions').applyThemeIconsToMenus();
        Alpine.store('actions').updateDetailMenu();

        
        
        actions.updateDetailMenu = function() {
            const app = Alpine.store('app');
            if (app.masterMenu.length === 0) return; 

            
            app.detailMenu = [...app.masterMenu[app.masterIndex].detailMenu];
            app.detailIndex = 0;

            
            if (app.selectedGame && app.masterIndex === 0) { 
                let trayItem = app.detailMenu[0]; 
                if (trayItem) {
                    trayItem.name = app.selectedGame.name.replace(/\s*\(.*?\)\s*/g, '').trim();
                    trayItem.icon = app.selectedGame.iconUrl || app.selectedGame.coverUrl;
                    trayItem.logoUrl = ''; 
                    trayItem.heroUrl = app.selectedGame.heroUrl || 'none';
                    trayItem.isGameIcon = true; 
                    trayItem.id = 'game-loaded'; 
                }
            }

            
            if (app.masterIndex === 2) {
                const games = app.filteredLibraryGames || app.gamesList || [];
                const heroes = games.filter(g => g.heroUrl && g.heroUrl !== 'none').map(g => g.heroUrl);
                
                if (heroes.length > 0) {
                    const randomIndex = Math.floor(Math.random() * heroes.length);
                    const initialHero = heroes[randomIndex];
                    
                    const libraryTile = app.detailMenu.find(d => d.id === 'gamelibrary');
                    if (libraryTile) {
                        libraryTile.heroUrl = initialHero;
                    }

                    
                    if (window.heroInterval) clearInterval(window.heroInterval);
                    
                    let currentHeroIdx = randomIndex;
                    window.heroInterval = setInterval(() => {
                        currentHeroIdx = (currentHeroIdx + 1) % heroes.length;
                        const nextHero = heroes[currentHeroIdx];
                        const tile = app.detailMenu.find(d => d.id === 'gamelibrary');
                        if (tile) tile.heroUrl = nextHero;
                    }, 5000);
                }
            } else {
                
                if (window.heroInterval) {
                    clearInterval(window.heroInterval);
                    window.heroInterval = null;
                }
            }
        };
    };
    
    hooks.on('onAppReady', async () => {
        const app = Alpine.store('app');
        try {
            
            const response = await fetch('theme-locales.json');
            const themeTranslations = await response.json();

            
            for (const lang in themeTranslations) {
                if (!app.translations[lang]) {
                    app.translations[lang] = {};
                }

                for (const category in themeTranslations[lang]) {
                    if (!app.translations[lang][category]) {
                        app.translations[lang][category] = {};
                    }

                    Object.assign(
                        app.translations[lang][category], 
                        themeTranslations[lang][category]
                    );
                }
            }
            console.log("[Theme] External JSON translations loaded and merged!");
        } catch (error) {
            console.error("[Theme] Failed to load external translations:", error);
        }
    });

});