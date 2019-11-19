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
            this.moveTextY = 150;
            this.frameGuideY = 230;
            this.frameBoxY = 250;
            this.frameBoxHeight = 30;
            this.ySpace = 5;
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
            if (this.justFrameMove == null) { //If not called from menu
                this.justFrameMove = this.cache.json.get('defaultMove'); //Default to whatever in preload
                console.log(`Loaded default: ${this.justFrameMove.MoveName}`);
            }
            this.pushFrames = 0;
            this.justFrameMove.JustFrames.forEach(f => {
                this.pushFrames += f.latestFrame - f.justFrame;
            });
            var jfLastFrame = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length - 1];
            this.lastFrameDisplayed = jfLastFrame.latestFrame + this.pushFrames + 2;
            if (jfLastFrame.mehLate != null)
                this.lastFrameDisplayed += (jfLastFrame.mehLate > jfLastFrame.latestFrame) ? jfLastFrame.mehLate - jfLastFrame.latestFrame : 0;
            this.frameWidth = Math.floor(gameWidth / this.lastFrameDisplayed); //round it into clean frame size
            let cleanGameWidth = this.frameWidth * this.lastFrameDisplayed; //multiply it back into clean gamewidth 
            // might be a practical minimum size for this. 3 frames probably... 
            // 3 frames times 60 = 180 + edges...
            this.speed = cleanGameWidth / this.lastFrameDisplayed / Tappy.oneFrame; //speed still less accurate probably... only for realtime
            this.add.text(this.startX, this.moveTextY, this.justFrameMove.MoveName, Tappy.mediumText);
            this.add.text(this.startX, this.moveTextY + 20, this.justFrameMove.MoveNotation, Tappy.mediumText);
            this.add.text(this.startX, this.moveTextY + 40, this.justFrameMove.Notes, Tappy.mediumText);
            /* Possible features.
            1. to make the effect of push frames clearer.
            */
            this.graphicsGuide = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 }, fillStyle: { color: 0x660000, alpha: 1 } });
            // make the whole set red.
            this.graphicsGuide.strokeRect(0, 0, 1200, 600); //debug, show gamesize
            this.frameBoxes = [];
            for (let i = 0; i <= this.pushFrames; i++) {
                this.frameBoxes[i] = [];
            }
            this.yPush = 0;
            for (let p = 0; p <= this.pushFrames; p++) {
                this.graphicsGuide.lineStyle(1, 0xff0000);
                this.graphicsGuide.fillStyle(0x660000);
                let h = this.frameBoxHeight;
                if (p > 0) {
                    h = this.frameBoxHeight / 3;
                }
                for (let i = 0; i <= this.lastFrameDisplayed; i++) {
                    this.frameBoxes[p].push(new Phaser.Geom.Rectangle(this.startX + i * this.frameWidth, this.frameBoxY + this.yPush, this.frameWidth - 2, h));
                }
                this.frameBoxes[p].forEach(frame => {
                    this.graphicsGuide.strokeRectShape(frame);
                    this.graphicsGuide.fillRectShape(frame);
                });
                let localPushCount = 0;
                this.justFrameMove.JustFrames.forEach(jf => {
                    if (!jf.optional) { // TODO: I think get rid optionals - nah, maybe come back to it.
                        //draw meh frames
                        if (jf.mehEarly != null) {
                            //this.drawBounds(this.frameBoxes[jf.mehEarly].left, this.frameBoxes[jf.mehLate].right, 230,280,0xFFA500)
                            this.graphicsGuide.lineStyle(1, 0xFFA500);
                            this.graphicsGuide.fillStyle(0xFFA500);
                            for (let i = jf.mehEarly; i <= jf.mehLate; i++) {
                                this.graphicsGuide.fillRectShape(this.frameBoxes[p][i + localPushCount]);
                                //this.graphicsGuide.strokeRectShape(this.frameBoxes[i])
                            }
                        }
                        //early or JF= green
                        this.graphicsGuide.lineStyle(1, 0x00ff00);
                        this.graphicsGuide.fillStyle(0x007700);
                        for (let i = jf.earlyFrame; i <= jf.justFrame; i++) {
                            this.graphicsGuide.fillRectShape(this.frameBoxes[p][i + localPushCount]);
                            this.graphicsGuide.strokeRectShape(this.frameBoxes[p][i + localPushCount]);
                        }
                        //late = blue
                        this.graphicsGuide.lineStyle(1, 0x0000ff);
                        this.graphicsGuide.fillStyle(0x000077);
                        for (let i = jf.justFrame + 1; i <= jf.latestFrame - this.pushFrames + p; i++) {
                            this.graphicsGuide.fillRectShape(this.frameBoxes[p][i]);
                            this.graphicsGuide.strokeRectShape(this.frameBoxes[p][i]);
                            this.graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[p][i].right, this.frameGuideY, this.frameBoxes[p][i].right, this.frameBoxY));
                            localPushCount++; // Again assuming only one push frames... 
                        }
                        this.graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[p][jf.justFrame].right, this.frameGuideY, this.frameBoxes[p][jf.latestFrame].right, this.frameGuideY));
                    }
                });
                this.yPush += h + this.ySpace;
            }
            for (let i = 0; i <= this.lastFrameDisplayed; i++) {
                this.add.text(this.startX + i * this.frameWidth + this.frameWidth / 2, this.frameBoxY + this.ySpace + this.yPush, i.toString(), this.smallText).setOrigin(0.5);
            }
            this.justFrameMove.JustFrames.forEach(jf => {
                this.drawBounds(this.frameBoxes[0][jf.earlyFrame].left, this.frameBoxes[0][jf.justFrame].right, 230, 280, 0xffffff);
                this.add.text(this.startX + jf.justFrame * this.frameWidth + this.frameWidth / 2, this.frameGuideY + 10, jf.move.toString(), this.smallText).setOrigin(0.5);
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
            //LOOKS LIKE THIS IS BEING READ ONCE A FRAME... NEED MORE.
            if (this.justFrameMove.DirectionsOK || button.index < 4) {
                this.tapUpdate(this.sys.game.loop.time, button.index);
            }
        }
        clicked(pointer) {
            this.tapUpdate(pointer.time, pointer.buttons); //one day make sure pointer.time is the same as sys.game.loop.time... OR a better time hasn't been added to the others.
        }
        tapUpdate(time, button) {
            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            if (this.stateRunning && !this.stateShowResults) { //stateShowResults is a buffer so late clicks don't cause it to start again.
                this.results.add(time, button.toString());
                let dt = time - this.results.startTime;
                let x = firstClickX + this.speed * dt;
                let y = this.frameBoxY + this.frameBoxHeight / 2;
                if (this.results.pushCount > 0) {
                    y += this.frameBoxHeight / 3;
                    for (let i = 0; i < this.results.pushCount; i++) {
                        y += this.frameBoxHeight / 3 + this.ySpace;
                    }
                }
                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff, 0.5);
                let clickCircle = new Phaser.Geom.Circle(x, y, this.frameWidth / 2);
                this.graphics.strokeCircleShape(clickCircle);
                this.graphics.fillCircleShape(clickCircle);
            }
            if (!this.stateRunning) {
                this.results = null;
                this.stateRunning = true;
                this.stateShowResults = false;
                this.resultsText.forEach(element => { element.destroy(); });
                this.results = new Tappy.resultset(this.sys.game.loop.time, this.justFrameMove.JustFrames, button.toString(), this.strict, this.pushFrames);
                this.running.setAlpha(0);
                this.graphics.clear();
                //this.graphics.lineStyle(1, 0xffffff);
                //this.graphics.fillStyle(0xffffff, 0.5)
                //let clickCircle = new Phaser.Geom.Circle(firstClickX, 265, this.frameWidth / 2)
                //this.graphics.strokeCircleShape(clickCircle)
                //this.graphics.fillCircleShape(clickCircle)
                //this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX, 250, firstClickX, 350)) //should be halfway through frame...
            }
        }
        drawResults() {
            //if (this.results.nextUnclaimed < this.justFrameMove.JustFrames.length) this.results.recalcLast() //fix up ignored if not all are claimed //
            let successResult = this.results.getResult(); //final result
            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            this.results.buttons.forEach(b => {
                let y = this.frameBoxY + this.frameBoxHeight + this.ySpace + this.yPush;
                let dt = b.time - this.results.startTime;
                let x = firstClickX + this.speed * dt;
                let style = Object.create(this.smallText);
                //Draw stuff
                this.resultsText.push(this.add.text(x + 2, this.frameGuideY - 20, `${Phaser.Math.FloorTo(b.firstFrame, -2)}`, this.smallText));
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
${Phaser.Math.FloorTo(b.jf2Chance * 100, -2)}% Just

Button:${b.button}
PFrames:${Phaser.Math.FloorTo(this.results.pushFrames, -4)}
PCount: ${this.results.pushCount}
OK%:    ${Phaser.Math.FloorTo(b.chanceOK * 100, -2)}
JustF:  ${claim}`, style));
                this.resultsText.push(this.add.text(x - 2, y, `${Phaser.Math.FloorTo(b.hit1Frame, -2)}
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
        constructor(start, moves, button = "1", strict = false, pushFrames) {
            this.buttons = [];
            this.moveFrames = [];
            this.pushCount = 0; //at least this much push
            this.pushFrames = 0; // chance of 1 more push - THis is not chance... It is exact in relation to the next button/
            this.pushMax = 0;
            this.nextUnclaimed = 1;
            this.chanceSuccess = 0;
            this.pushMax = pushFrames;
            this.startTime = start;
            this.buttons.push({ time: start, button: button, firstFrame: 0, claimedFrame: 0, chanceOK: 1 });
            this.moveFrames = moves;
            this.strict = strict;
            this.buildSourceFrames();
        }
        buildSourceFrames() {
            //for each source move frame: get the just frames, and break them out into individual frames.
            //build the main array then concat the meh frames if applicable.
            //Maybe I should do this in the maingamescene instead so I can use it for the graphics too.
            this.moveFrames.forEach(sf => {
                let justFrames = new Map();
                //early meh frames
                if (sf.mehEarly != null) {
                    let earlyMeh = true;
                    for (let i = sf.mehEarly; i < sf.earlyFrame; i++) {
                        justFrames.set(i, { earlyMeh: earlyMeh, meh: true, adjEarly: 0, adjLate: 0, push: false }); // just going to assume no push on meh frames.
                        earlyMeh = false;
                    }
                }
                //just frames including pushing frames
                let firstJF = true;
                for (let i = sf.earlyFrame; i <= sf.latestFrame; i++) {
                    let push = (i > sf.justFrame);
                    justFrames.set(i, { meh: false, adjEarly: 0, adjLate: 0, push: push, firstJF: firstJF });
                    firstJF = false;
                }
                //late meh frames
                if (sf.mehLate != null) {
                    for (let i = sf.latestFrame + 1; i <= sf.mehLate; i++) {
                        //first one needs a flag for part push ***
                        let firstMeh = (i == sf.latestFrame + 1);
                        justFrames.set(i, { meh: true, partPush: firstMeh, adjEarly: 0, adjLate: 0, push: false }); // just going to assume no push on meh frames.
                    }
                }
                sf.individualFrames = justFrames;
            });
        }
        pushSourceFrames(pushAmount, frameWithPush) {
            this.pushFrames = pushAmount;
            this.pushCount = Math.floor(pushAmount);
            let adjAmount = pushAmount - this.pushCount;
            let pushedFrames = new Map();
            //move the numbers of each of the push sets 
            for (let i = frameWithPush + 1; i < this.moveFrames.length; i++) {
                let iFrames = this.moveFrames[i].individualFrames;
                let it = iFrames.entries();
                let frameNo;
                for (let i = 0; i < iFrames.size; i++) {
                    let value = it.next().value;
                    frameNo = value[0] + this.pushCount;
                    let frameInfo = value[1];
                    if (frameInfo.earlyMeh || frameInfo.firstJF) {
                        frameInfo.adjEarly = adjAmount;
                    }
                    if (frameInfo.partPush) {
                        frameInfo.adjLate = (pushAmount > this.pushMax) ? 0 : adjAmount;
                    }
                    pushedFrames.set(frameNo, frameInfo);
                    //todo bit worried about if the push count is the max... and over.
                    //haven't thought it through - do I change adjAmount? do I put an early on the last frame?
                    console.log(frameNo, frameInfo);
                }
                // generally add an extra frame with part push adjLate.
                // Not sure if this is actually needed.
                pushedFrames.set(frameNo + 1, { dead: true, adjLate: adjAmount, adjEarly: 0, push: false, meh: false });
                //return adjusted.
                this.moveFrames[i].individualFrames = pushedFrames;
            }
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
            // a new new one.  Oh well.
            // fixing JF push input... Should not be multiplying chances... Rather it should be the same chance for the same amount of the input variation within frame.
            let jf;
            //set up the return object with basic data
            c.firstFrame = (c.time - this.startTime) / Tappy.oneFrame; // c.firstFrame  
            c.hit1Frame = Math.floor(c.firstFrame);
            c.hit2Frame = c.hit1Frame + 1;
            // are there any unclaimed frames?
            if (this.nextUnclaimed < this.moveFrames.length) {
                let pushCheck = false;
                jf = this.moveFrames[this.nextUnclaimed].individualFrames; // get the next JF
                //process first hit frame chances
                if (jf.has(c.hit1Frame)) {
                    let singleJF = jf.get(c.hit1Frame);
                    if (singleJF.push)
                        pushCheck = true;
                    //so what do I want here.
                    //first (1 - hitstart) is the abosulte max I can have 
                    //if this is a meh frame normally then it must be late or it wont have calc early
                    // then situations: 
                    //  1. there is an adjearly on this frame which means there's only a chance if the frame is not pushed.
                    //      1a. only the first part of my hit until the push cuts into the next frame is okay.
                    //  2. there is an adjlate on this frame which means there's only a change if the frame is push.
                    //      2a. only the part of my hit after the push frames will count...
                    let hitStart = c.firstFrame - c.hit1Frame;
                    let calcLate = (singleJF.meh) ? 0 : 1;
                    let calcEarly = (hitStart > singleJF.adjEarly) ? 1 - hitStart : 1 - singleJF.adjEarly;
                    if (singleJF.adjLate > 0) {
                        calcLate = (hitStart < singleJF.adjLate) ? singleJF.adjLate - hitStart : 0;
                    }
                    //everything up to here is good .  Calc early * calclate looks good. not sure about DEAD
                    c.jf1Chance = (singleJF.dead) ? 0 : calcEarly * calcLate;
                    console.log("hit1:", singleJF);
                }
                else
                    c.jf1Chance = 0;
                //process 2nd hit frame chances.
                if (jf.has(c.hit2Frame)) {
                    let singleJF = jf.get(c.hit2Frame);
                    let hitStart = c.firstFrame - c.hit1Frame;
                    if (singleJF.push)
                        pushCheck = true;
                    //so what do I want here.
                    //first (hitstart) is the absulte max I can have  (could I make this 1-hitsart again?)
                    //if this is a meh frame normally then it must be late or it wont have calc early  *** I haven't covered this.
                    // then situations: 
                    //  1. there is an adjearly on this frame which means there's only a chance if the frame is not pushed.
                    //      1a. only the first part of my hit until the push cuts into the next frame is okay.
                    //  2. there is an adjlate on this frame which means there's only a change if the frame is push.
                    //      2a. only the part of my hit after the push frames will count...                    
                    //need something here - to make sure its never more than hitstart but multiply twice either... (think hit 1 is right but its hard to read.)
                    // break down the situations then make the code cleaner...
                    let calc = (singleJF.meh) ? 0 : hitStart;
                    if (singleJF.adjEarly > 0) {
                        calc = (hitStart > singleJF.adjEarly) ? hitStart - singleJF.adjEarly : 0;
                    }
                    //at this point calcEarly is either  1 or 0 correct.
                    //calc late is either 0 or hitstart. ( if it is hitsart and a is calc early we have a problem)
                    if (singleJF.adjLate > 0) {
                        calc = (hitStart > singleJF.adjLate) ? singleJF.adjLate : hitStart;
                    }
                    console.log("hit2:", singleJF);
                    c.jf2Chance = (singleJF.dead) ? 0 : calc;
                }
                else
                    c.jf2Chance = 0;
                console.log(c);
                c.chanceOK = c.jf1Chance + c.jf2Chance;
                // Calculate the pushframes... Happens once only I think...
                // jf.justFrame is the last Just-frame before push frames, jf.lastestframe is the last push frame
                //TODO Set a flag earlier for this if.
                if (pushCheck) {
                    this.pushSourceFrames(c.firstFrame - this.moveFrames[this.nextUnclaimed].justFrame, this.nextUnclaimed);
                }
                //failed to hit anything.  
                //    but now I'm no longer capturing late...  lets see if it matters.
                //    before early would leave it unclaimed but late wouldn't
                if (c.chanceOK == 0) {
                    c.claimedFrame = this.nextUnclaimed; //claimed next frame but can still be reclaimed
                    if (this.strict) { // strict mode = all buttons must be accounted for.
                        this.nextUnclaimed++;
                        c.chanceOK = 0;
                    }
                }
                else {
                    c.claimedFrame = this.nextUnclaimed;
                    this.nextUnclaimed++;
                }
            }
            else
                this.buttons.pop(); // no unclaimed so just don't worry about storing data of buttons pushed after.
        }
    }
    Tappy.resultset = resultset;
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map