var Tappy;
(function (Tappy) {
    Tappy.oneFrame = 16.6666666666666666;
    const gameWidth = 1100;
    Tappy.mediumText = { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' };
    class FrameGame extends Phaser.Scene {
        constructor() {
            super({ key: 'FrameGame' });
            //Globals
            this.smallText = { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' };
            this.largeText = { fontFamily: 'Arial', fontSize: 28, color: '#ffffff' };
            this.startX = 40;
            //state
            this.stateRunning = false;
            this.stateShowResults = false;
            this.strict = false;
            this.resultsText = [];
        }
        init(data) {
            if (Object.keys(data).length === 0 && data.constructor === Object) {
                console.log("No Data Provided!");
            }
            else {
                this.justFrameMove = data;
                this.strict = this.justFrameMove.DefaultStrict;
                console.log(`Loaded from menu: ${this.justFrameMove.MoveName}`);
            }
        }
        preload() {
            this.load.bitmapFont('luc', ['./Fonts/lucidaconsole_0.png', './Fonts/lucidaconsole_1.png'], './Fonts/lucidaconsole.xml');
            this.load.json('defaultMove', './movesjson/default.json');
        }
        create() {
            //this.input.mouse.disableContextMenu();  // allow right-click
            if (this.justFrameMove == null) { //If not called from menu
                this.justFrameMove = this.cache.json.get('defaultMove'); //Default to whatever in preload
                console.log(`Loaded default: ${this.justFrameMove.MoveName}`);
            }
            this.pushFrames = 0;
            this.justFrameMove.JustFrames.forEach(f => {
                this.pushFrames += f.latestFrame - f.justFrame;
            });
            this.lastFrameDisplayed = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length - 1].latestFrame + this.pushFrames + 5;
            this.frameWidth = Math.floor(gameWidth / this.lastFrameDisplayed); //round it into clean frame size
            let cleanGameWidth = this.frameWidth * this.lastFrameDisplayed; //multiply it back into clean gamewidth 
            // might be a practical minimum size for this. 3 frames probably... 
            // 3 frames times 60 = 180 + edges...
            this.speed = cleanGameWidth / this.lastFrameDisplayed / Tappy.oneFrame; //speed still less accurate probably... only for realtime
            this.add.text(this.startX, 150, this.justFrameMove.MoveName, Tappy.mediumText);
            this.add.text(this.startX, 170, this.justFrameMove.MoveNotation, Tappy.mediumText);
            this.add.text(this.startX, 190, this.justFrameMove.Notes, Tappy.mediumText);
            /* Possible features.
            1. to make the effect of push frames clearer.
            */
            this.graphicsGuide = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 }, fillStyle: { color: 0x660000, alpha: 1 } });
            // make the whole set red.
            this.frameBoxes = [];
            for (let i = 0; i <= this.lastFrameDisplayed; i++) {
                this.add.text(this.startX + i * this.frameWidth + this.frameWidth / 2, 290, i.toString(), this.smallText).setOrigin(0.5);
                this.frameBoxes.push(new Phaser.Geom.Rectangle(this.startX + i * this.frameWidth, 250, this.frameWidth - 2, 30));
            }
            this.frameBoxes.forEach(frame => {
                this.graphicsGuide.strokeRectShape(frame);
                this.graphicsGuide.fillRectShape(frame);
            });
            //debug, show gamesize
            this.graphicsGuide.strokeRect(0, 0, 1200, 600);
            let localPushCount = 0;
            this.justFrameMove.JustFrames.forEach(jf => {
                if (!jf.optional) { // TODO: I think get rid optionals.
                    //draw success boundaries - including blue push frames.
                    this.drawBounds(this.frameBoxes[jf.earlyFrame].left, this.frameBoxes[jf.justFrame].right, 230, 280, 0xffffff);
                    for (let i = 1; i <= localPushCount; i++) {
                        this.drawBounds(this.frameBoxes[jf.earlyFrame + i].left, this.frameBoxes[jf.justFrame + i].right, 232, 250, 0xaa00aa);
                    }
                    this.add.text(this.startX + jf.justFrame * this.frameWidth + this.frameWidth / 2, 240, jf.move.toString(), this.smallText).setOrigin(0.5);
                    //early or JF= green
                    this.graphicsGuide.lineStyle(1, 0x00ff00);
                    this.graphicsGuide.fillStyle(0x007700);
                    for (let i = jf.earlyFrame; i <= jf.justFrame; i++) {
                        this.graphicsGuide.fillRectShape(this.frameBoxes[i]);
                        this.graphicsGuide.strokeRectShape(this.frameBoxes[i]);
                    }
                    //late = blue
                    this.graphicsGuide.lineStyle(1, 0x0000ff);
                    this.graphicsGuide.fillStyle(0x000077);
                    for (let i = jf.justFrame + 1; i <= jf.latestFrame; i++) {
                        this.graphicsGuide.fillRectShape(this.frameBoxes[i]);
                        this.graphicsGuide.strokeRectShape(this.frameBoxes[i]);
                        this.graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[i].right, 230, this.frameBoxes[i].right, 250));
                        localPushCount++; // Again assuming only one push frames... 
                    }
                    this.graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[jf.justFrame].right, 230, this.frameBoxes[jf.latestFrame].right, 230));
                    /*//JF = Green //
                    this.graphicsGuide.lineStyle(1,0x00ff00)
                    this.graphicsGuide.fillStyle(0x007700)
                    this.graphicsGuide.fillRectShape(this.frameBoxes[jf.justFrame])
                    this.graphicsGuide.strokeRectShape(this.frameBoxes[jf.justFrame])
                    */
                }
            });
            this.graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 } }); //now just for the circles.
            this.scenefps = this.add.bitmapText(cleanGameWidth + this.startX, 32, 'luc', '', 16).setOrigin(1);
            this.running = this.add.text(600, 50, 'Tap or Click when ready', this.largeText).setOrigin();
            //set up input handdlers: // TODO add keyboard
            this.input.on('pointerdown', this.clicked, this);
            this.input.on('pointerdownoutside', this.clicked, this);
            this.input.gamepad.on('down', this.pressed, this);
            console.log(`width: ${cleanGameWidth} sX: ${this.startX}`);
            let strictText = (this.strict) ? "STRICT MODE ON" : "STRICT MODE OFF";
            this.add.text(this.startX, 100, strictText, Tappy.mediumText).setInteractive().on('pointerdown', function (p, x, y, ed) {
                ed.stopPropagation();
                this.scene.strict = !this.scene.strict; // this shouldn't work??
                this.text = (this.scene.strict) ? "STRICT MODE ON" : "STRICT MODE OFF";
            });
            this.add.text(cleanGameWidth + this.startX, 40, 'MENU', Tappy.mediumText).setInteractive().on('pointerdown', function (p, x, y, ed) {
                ed.stopPropagation();
                //this.graphics.clear() //maybe not.
                //this.graphicsGuide.clear() //maybe not.
                this.scene.scene.start('MenuScene');
            });
        }
        drawBounds(x1, x2, y1, y2, colour) {
            let gDraw = this.add.graphics({ lineStyle: { width: 1, color: colour } });
            gDraw.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y1));
            gDraw.strokeLineShape(new Phaser.Geom.Line(x1, y1, x1, y2));
            gDraw.strokeLineShape(new Phaser.Geom.Line(x2, y1, x2, y2));
        }
        update(timestep, dt) {
            this.scenefps.setText(Phaser.Math.FloorTo(this.sys.game.loop.actualFps, -2).toString()); //seems slow - think i should do it myself. ? How often then?
            if (this.stateRunning) {
                var runtime = this.sys.game.loop.time - this.results.startTime;
                if (!this.stateShowResults) {
                    if (runtime > this.lastFrameDisplayed * Tappy.oneFrame) {
                        this.stateShowResults = true;
                    }
                }
                if (runtime > (this.lastFrameDisplayed + 15) * Tappy.oneFrame) {
                    this.stateRunning = false;
                    this.drawResults();
                }
            }
        }
        pressed(pad, button) {
            //needs input.queue in phaser 3.16 but timestamp still doesn't update so
            //input queue also stops the mid frame timestamp. 
            if (this.justFrameMove.DirectionsOK || button.index < 4) {
                this.tapUpdate(this.sys.game.loop.time, button.index);
            }
        }
        clicked(pointer) {
            this.tapUpdate(pointer.time, pointer.buttons);
        }
        tapUpdate(time, button) {
            console.log("strict: " + this.strict);
            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            //stateShowResults is a buffer so late clicks don't cause it to start again.
            if (this.stateRunning && !this.stateShowResults) {
                this.results.add(time, button.toString());
                let dt = time - this.results.startTime;
                let x = firstClickX + this.speed * dt;
                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff, 0.5);
                let clickCircle = new Phaser.Geom.Circle(x, 265, this.frameWidth / 2);
                this.graphics.strokeCircleShape(clickCircle);
                this.graphics.fillCircleShape(clickCircle);
                let clickStartLine = new Phaser.Geom.Line(x, 250, x, 300);
                this.graphics.strokeLineShape(clickStartLine);
            }
            if (!this.stateRunning) {
                this.results = null;
                this.stateRunning = true;
                this.stateShowResults = false;
                this.resultsText.forEach(element => { element.destroy(); });
                this.results = new Tappy.resultset(this.sys.game.loop.time, this.justFrameMove.JustFrames, button.toString(), this.strict);
                this.running.setAlpha(0);
                this.graphics.clear();
                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff, 0.5);
                let clickCircle = new Phaser.Geom.Circle(firstClickX, 265, this.frameWidth / 2);
                this.graphics.strokeCircleShape(clickCircle);
                this.graphics.fillCircleShape(clickCircle);
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX, 250, firstClickX, 350)); //should be halfway through frame...
            }
        }
        drawResults() {
            //if (this.results.nextUnclaimed < this.justFrameMove.JustFrames.length) this.results.recalcLast() //fix up ignored if not all are claimed //
            let successResult = this.results.getResult(); //final result
            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            this.results.buttons.forEach(b => {
                let y = 340;
                let dt = b.time - this.results.startTime;
                let x = firstClickX + this.speed * dt;
                let style = Object.create(this.smallText);
                //Draw stuff
                this.resultsText.push(this.add.text(x + 2, 315, `${Phaser.Math.FloorTo(b.firstFrame, -2)}`, this.smallText));
                style.color = getColorFromPercent(b.chanceOK);
                let claim;
                if (b.chanceOK == null || b.claimedFrame == null) {
                    style.color = '#777777'; // grey 
                    //y += 120
                    claim = 'n/a';
                }
                else
                    claim = b.claimedFrame.toString();
                //notes
                let clickStartLine = new Phaser.Geom.Line(x, 300, x, y + 120);
                this.graphics.strokeLineShape(clickStartLine);
                this.resultsText.push(this.add.text(x + 2, y, `${Phaser.Math.FloorTo(b.hit2Frame, -2)}
${Phaser.Math.FloorTo(b.hit2Chance * 100, -2)}% Hit
${Phaser.Math.FloorTo(b.jf2Chance * 100, -2)}% Just

Button:${b.button}
PFrames:${Phaser.Math.FloorTo(this.results.pushFrames, -4)}
PCount: ${this.results.pushCount}
OK%:    ${Phaser.Math.FloorTo(b.chanceOK * 100, -2)}
JustF:  ${claim}`, style));
                this.resultsText.push(this.add.text(x - 2, y, `${Phaser.Math.FloorTo(b.hit1Frame, -2)}
Hit ${Phaser.Math.FloorTo(b.hit1Chance * 100, -2)}%
Just ${Phaser.Math.FloorTo(b.jf1Chance * 100, -2)}%`, style).setOrigin(1, 0).setAlign('right'));
            });
            this.running.setText(`${successResult}% success - Tap to try again`);
            this.running.setColor(getColorFromPercent(successResult / 100));
            this.running.setAlpha(1);
        }
    }
    Tappy.FrameGame = FrameGame;
    function getColorFromPercent(chance) {
        let colour = new Phaser.Display.Color().setFromHSV(chance * .3, 1, 1);
        return Phaser.Display.Color.RGBToString(colour.red, colour.green, colour.blue, colour.alpha, '#');
    }
})(Tappy || (Tappy = {}));
var Tappy;
(function (Tappy) {
    class FrameMenu extends Phaser.Scene {
        constructor() {
            super({ key: 'MenuScene' });
        }
        preload() {
            this.load.json('jfData', './movesjson/justframedata.json');
        }
        create() {
            this.data = this.cache.json.get('jfData');
            let y = 150;
            this.data.forEach(char => {
                this.add.text(50, y, char.Character, Tappy.mediumText);
                char.JustFrameMoves.forEach(move => {
                    this.add.text(200, y, move.MoveName, Tappy.mediumText).setInteractive().setData("move", move);
                    y += 50;
                });
            });
            this.input.once('gameobjectdown', this.clicked, this);
        }
        clicked(pointer, gameobject) {
            this.scene.start('FrameGame', gameobject.getData("move"));
        }
    }
    Tappy.FrameMenu = FrameMenu;
})(Tappy || (Tappy = {}));
/// <reference path='./phaser.d.ts'/>
var Tappy;
(function (Tappy) {
    class InitPhaser {
        static initGame() {
            let config = {
                type: Phaser.WEBGL,
                disableContextMenu: true,
                input: {
                    queue: false,
                    gamepad: true
                },
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
                    width: 1200,
                    height: 600
                },
                scene: [Tappy.FrameGame, Tappy.FrameMenu],
                banner: true,
                title: 'Tappy',
                version: '1.0.0'
            };
            this.gameRef = new Phaser.Game(config);
        }
    }
    Tappy.InitPhaser = InitPhaser;
})(Tappy || (Tappy = {}));
window.onload = () => {
    Tappy.InitPhaser.initGame();
};
var Tappy;
(function (Tappy) {
    class resultset {
        constructor(start, moves, button = "1", strict = false) {
            this.buttons = [];
            this.moveFrames = [];
            this.pushCount = 0; //at least this much push
            this.pushFrames = 0; // chance of 1 more push
            this.nextUnclaimed = 1;
            this.chanceSuccess = 0;
            this.startTime = start;
            this.buttons.push({ time: start, button: button, firstFrame: 0, claimedFrame: 0, chanceOK: 1 });
            this.moveFrames = moves;
            this.strict = strict;
        }
        add(time, button = "1") {
            let index = this.buttons.push({ time: time, button: button });
            this.calcFrames(this.buttons[index - 1]);
        }
        getResult() {
            if (this.nextUnclaimed < this.moveFrames.length)
                this.recalcLast();
            let chances = new Array(this.moveFrames.length);
            for (let i = 0; i < chances.length; i++) {
                chances[i] = 0;
            }
            this.buttons.forEach(b => {
                if (b.claimedFrame !== null)
                    chances[b.claimedFrame] = b.chanceOK;
            });
            return Phaser.Math.FloorTo(chances.reduce(function (product, value) { return product * value; }) * 100, -2);
        }
        recalcLast() {
            //just to stop an early press making chanceOK NaN
            let lastButton = this.buttons.pop();
            if (lastButton.chanceOK == null)
                lastButton.chanceOK = 0;
            this.buttons.push(lastButton);
        }
        calcFrames(c) {
            // designing a new one.
            // 1. create an array of the adjusted Just Frame groups including chances on the ends.
            // 2. match the 1st and 2nd frame chances to the chances of the jfs above
            // 3. record the four chances so they can be displayed.
            // 4. claim the frame.
            // 5. calculate the push count / late / frames
            // 6. get rid of the things I don't need in buttonPush /resultset or calc them too.            
            // TODO
            // 7. not here but display the two chances above/below the frame input.      something like   10%| |90%  hit
            // for later maybe                                                                           100%| |30%  justFrame
            //                                                                                               37%
            // 8. externalise the just frames adjJF into a class that I can update here then reuse for redrawing the main display.
            let jf;
            c.firstFrame = (c.time - this.startTime) / Tappy.oneFrame; // c.firstFrame  
            c.hit1Frame = Math.floor(c.firstFrame);
            c.hit2Frame = c.hit1Frame + 1;
            c.hit2Chance = (c.firstFrame - c.hit1Frame);
            c.hit1Chance = 1 - c.hit2Chance;
            //c.jf1Chance
            //c.jf2Chance
            if (this.nextUnclaimed < this.moveFrames.length) {
                jf = this.moveFrames[this.nextUnclaimed]; // get the next JF we haven't hit yet.
                let adjEarlyFrame = jf.earlyFrame + this.pushCount;
                let earlyFrameChance = 1 - (this.pushFrames - this.pushCount);
                let adjLateFrame = jf.latestFrame + this.pushCount;
                // I think i will create an external class for this...
                let adjJF = [[adjEarlyFrame - 1, 0]];
                adjJF.push([adjEarlyFrame, earlyFrameChance]);
                for (let i = adjEarlyFrame + 1; i <= adjLateFrame; i++) {
                    adjJF.push([i, 1]);
                }
                //if (adjLateFrame>adjEarlyFrame) adjJF.push([adjLateFrame,1-this.latePush]) // Decided I don't want to double up on the late push chance - May chance my mind.
                adjJF.push([adjLateFrame + 1, this.pushFrames - this.pushCount]);
                adjJF.push([adjLateFrame + 2, 0]);
                if (c.hit2Frame >= adjEarlyFrame) {
                    c.claimedFrame = this.nextUnclaimed++; //late or ok  // todo, once I switch from calcframes1
                    console.log("hit:" + c.hit1Frame);
                    if (c.hit1Frame <= adjLateFrame + 1) {
                        adjJF.forEach(ajf => {
                            console.log(ajf);
                            if (ajf[0] == c.hit1Frame)
                                c.jf1Chance = ajf[1];
                            if (ajf[0] == c.hit2Frame)
                                c.jf2Chance = ajf[1];
                        });
                    }
                    else
                        c.jf1Chance = c.jf2Chance = 0; // too late... 
                    c.chanceOK = ((c.hit1Chance * c.jf1Chance) + (c.hit2Chance * c.jf2Chance));
                }
                else { //early
                    // todo when i stop calcframes1
                    //c.chanceEarly=1 // maybe take this out for simplicity.
                    c.jf1Chance = 0;
                    c.jf2Chance = 0;
                    c.claimedFrame = this.nextUnclaimed; //claimed next frame but can still be claimed??? - Come back to STRICT
                    if (this.strict) { // strict mode = all buttons must be accounted for.
                        this.nextUnclaimed++;
                        c.chanceOK = 0;
                    }
                }
                // Calculate the pushframes... Happens once only I think...
                // IF so, don't need to use adjusted.
                if (c.firstFrame > jf.justFrame && jf.latestFrame > jf.justFrame) {
                    this.pushFrames = c.firstFrame - jf.justFrame;
                    this.pushCount = Math.floor(this.pushFrames);
                    if (this.pushFrames > jf.latestFrame - jf.justFrame) {
                        this.pushFrames = this.pushCount = jf.latestFrame - jf.justFrame; // max it out, or make it zero.. doesn't really matter
                    }
                }
            }
            else
                this.buttons.pop(); // don't need extras
        }
    }
    Tappy.resultset = resultset;
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map