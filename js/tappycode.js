var Tappy;
(function (Tappy) {
    Tappy.oneFrame = 16.6666666666666666;
    class FrameGame extends Phaser.Scene {
        constructor() {
            super({ key: 'TestScene' });
            //Globals
            this.smallText = { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' };
            this.mediumText = { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' };
            this.largeText = { fontFamily: 'Arial', fontSize: 28, color: '#ffffff' };
            this.startX = 60;
            this.gameWidth = 1080;
            this.pushFrames = 0;
            //moveDisplay
            this.frameBoxes = [];
            //state
            this.stateRunning = false;
            this.stateShowResults = false;
            this.frame = 0; //dont trust this for calc - only for realtime view.
            this.resultsText = [];
        }
        preload() {
            this.load.bitmapFont('luc', ['./Fonts/lucidaconsole_0.png', './Fonts/lucidaconsole_1.png'], './Fonts/lucidaconsole.xml');
            this.load.json('moveFrames', './json/Paul/demoman.json');
            //this.load.json('moveFrames','./json/Lee/acidrain.json');
            //this.load.json('moveFrames','./json/Lee/misttrap.json');
        }
        create() {
            this.input.mouse.disableContextMenu();
            this.justFrameMove = this.cache.json.get('moveFrames');
            this.justFrameMove.JustFrames.forEach(f => {
                this.pushFrames += f.latestFrame - f.justFrame;
            });
            this.lastFrameDisplayed = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length - 1].latestFrame + this.pushFrames + 5;
            this.frameWidth = Math.round(this.gameWidth / this.lastFrameDisplayed); //round it into clean frame size
            this.gameWidth = this.frameWidth * this.lastFrameDisplayed; //multiply it back into clean gamewidth 
            // might be a practical minimum size for this. 3 frames probably... 
            // 3 frames times 60 = 180 + edges...
            this.speed = this.gameWidth / this.lastFrameDisplayed / Tappy.oneFrame; //speed still less accurate probably... only for realtime
            this.add.text(this.startX, 150, this.justFrameMove.MoveName, this.mediumText);
            this.add.text(this.startX, 170, this.justFrameMove.MoveNotation, this.mediumText);
            this.add.text(this.startX, 190, this.justFrameMove.Notes, this.mediumText);
            /* Possible features.
            1. to make the effect of push frames clearer.
            2. to show which buttons are for when
            4. recommended frames???
            */
            let graphicsGuide = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 }, fillStyle: { color: 0x660000, alpha: 1 } });
            // make the whole set red.
            for (let i = 0; i <= this.lastFrameDisplayed; i++) {
                this.add.text(this.startX + i * this.frameWidth + this.frameWidth / 2, 290, i.toString(), this.smallText).setOrigin(0.5);
                this.frameBoxes.push(new Phaser.Geom.Rectangle(this.startX + i * this.frameWidth, 250, this.frameWidth - 2, 30));
            }
            this.frameBoxes.forEach(frame => {
                graphicsGuide.strokeRectShape(frame);
                graphicsGuide.fillRectShape(frame);
            });
            let localPushCount = 0;
            this.justFrameMove.JustFrames.forEach(jf => {
                if (!jf.optional) { // TODO: I think get rid optionals.
                    //JF bounds and text
                    this.drawBounds(this.frameBoxes[jf.earlyFrame].left, this.frameBoxes[jf.justFrame].right, 230, 250, 0xffffff);
                    for (let i = 1; i <= localPushCount; i++) {
                        this.drawBounds(this.frameBoxes[jf.earlyFrame + i].left, this.frameBoxes[jf.justFrame + i].right, 232, 250, 0x550077);
                    }
                    this.add.text(this.startX + jf.justFrame * this.frameWidth + this.frameWidth / 2, 240, jf.move.toString(), this.smallText).setOrigin(0.5);
                    //early = blue
                    graphicsGuide.lineStyle(1, 0x0000ff);
                    graphicsGuide.fillStyle(0x000077);
                    for (let i = jf.earlyFrame; i < jf.justFrame; i++) {
                        graphicsGuide.fillRectShape(this.frameBoxes[i]);
                        graphicsGuide.strokeRectShape(this.frameBoxes[i]);
                    }
                    //late = purple
                    graphicsGuide.lineStyle(1, 0xcc00ff);
                    graphicsGuide.fillStyle(0x550077);
                    for (let i = jf.justFrame + 1; i <= jf.latestFrame; i++) {
                        graphicsGuide.fillRectShape(this.frameBoxes[i]);
                        graphicsGuide.strokeRectShape(this.frameBoxes[i]);
                        graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[i].right, 230, this.frameBoxes[i].right, 250));
                        localPushCount++; // Again assuming only one push frames... 
                    }
                    graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[jf.justFrame].right, 230, this.frameBoxes[jf.latestFrame].right, 230));
                    //JF = Green
                    graphicsGuide.lineStyle(1, 0x00ff00);
                    graphicsGuide.fillStyle(0x007700);
                    graphicsGuide.fillRectShape(this.frameBoxes[jf.justFrame]);
                    graphicsGuide.strokeRectShape(this.frameBoxes[jf.justFrame]);
                }
            });
            //set up input handdlers: // TODO add keyboard
            this.input.on('pointerdown', this.clicked, this);
            this.input.gamepad.on('down', this.pressed, this);
            this.graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 } }); //this is for the realtime line - todo, something else - another way...
            this.frameRuler = new Phaser.Geom.Line(this.startX, 300, this.startX, 300);
            this.scenefps = this.add.bitmapText(this.gameWidth + this.startX, 32, 'luc', '', 16).setOrigin(1);
            this.running = this.add.text(600, 50, 'Tap or Click when ready', this.largeText).setOrigin();
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
                this.frame++;
                var runtime = this.sys.game.loop.time - this.results.startTime;
                if (!this.stateShowResults) {
                    if (runtime > this.lastFrameDisplayed * Tappy.oneFrame) {
                        this.stateShowResults = true;
                    }
                    else {
                        let x = this.frameRuler.x2 += this.speed * dt;
                        this.frameRuler.x2 = x;
                        this.graphics.strokeLineShape(this.frameRuler); //I want to uses
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
            if (button.index < 4) {
                this.tapUpdate(this.sys.game.loop.time, button.index);
            }
        }
        clicked(pointer) {
            this.tapUpdate(pointer.time, pointer.buttons);
        }
        tapUpdate(time, button) {
            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            //stateShowResults is a buffer so late clicks don't cause it to start again.
            if (this.stateRunning && !this.stateShowResults) {
                this.results.add(time);
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
                this.results = new Tappy.resultset(this.sys.game.loop.time, this.justFrameMove.JustFrames);
                this.running.setAlpha(0);
                this.frameRuler.x2 = this.startX;
                this.graphics.clear();
                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff, 0.5);
                let clickCircle = new Phaser.Geom.Circle(firstClickX, 265, this.frameWidth / 2);
                this.graphics.strokeCircleShape(clickCircle);
                this.graphics.fillCircleShape(clickCircle);
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX, 250, firstClickX, 350)); //should be halfway through frame... Frame size 6?
                this.frame = 0;
            }
        }
        drawResults() {
            //if (this.results.nextUnclaimed < this.justFrameMove.JustFrames.length) this.results.recalcLast() //fix up ignored if not all are claimed //
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
                if (b.chanceEarly == 1 || b.claimedFrame == null) {
                    style.color = '#777777'; // grey 
                    y += 120;
                    claim = 'n/a';
                }
                else
                    claim = b.claimedFrame.toString();
                //notes
                let clickStartLine = new Phaser.Geom.Line(x, 300, x, y + 120);
                this.graphics.strokeLineShape(clickStartLine);
                this.resultsText.push(this.add.text(x + 2, y, `Button:${b.button}
Early %:${Phaser.Math.FloorTo(b.chanceEarly, -4)}
Late %: ${Phaser.Math.FloorTo(b.chanceLate, -4)}
Push %: ${Phaser.Math.FloorTo(b.chancePush, -4)}
PCount: ${this.results.pushCount}
1st %:  ${Phaser.Math.FloorTo(b.chanceFirst, -4)}
OK%:    ${Phaser.Math.FloorTo(b.chanceOK * 100, -4)}
JustF:  ${claim}`, style));
            });
            let successResult = this.results.getResult(); //final result
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
/// <reference path='./phaser.d.ts'/>
var Tappy;
(function (Tappy) {
    class InitPhaser {
        static initGame() {
            let config = {
                type: Phaser.WEBGL,
                input: {
                    //queue: true,
                    gamepad: true
                },
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: 1200,
                    height: 675
                },
                scene: [Tappy.FrameGame],
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
        constructor(start, moves, button = "1") {
            this.buttons = [];
            this.moveFrames = [];
            this.pushCount = 0;
            this.pushFrames = 0;
            this.nextUnclaimed = 1;
            this.chanceSuccess = 0;
            this.startTime = start;
            this.buttons.push({ time: start, button: button, firstFrame: 0, claimedFrame: 0, chanceEarly: 0, chanceFirst: 0, chanceLate: 0, chancePush: 0, chanceOK: 1 });
            this.moveFrames = moves;
        }
        add(time, button = "1") {
            let index = this.buttons.push({ time: time, button: button });
            this.calcFrames(this.buttons[index - 1]);
        }
        getResult() {
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
            let lastClaim = 0; // what if I only click once?
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].claimedFrame)
                    lastClaim = i;
            }
            lastClaim++;
            while (lastClaim < this.buttons.length) { // this is dumb... It will only ever calc the last one anyway - unless they were both before the 3rd.
                this.calcFrames(this.buttons[lastClaim], true);
                lastClaim++;
            }
        }
        calcFrames(c, redo = true) {
            let timediff = c.time - this.startTime; //eg 19.17/16
            let timeFrame = timediff / Tappy.oneFrame; // part through 1st frame. =  1.15
            let jf;
            c.firstFrame = timeFrame;
            if (this.nextUnclaimed < this.moveFrames.length) {
                jf = this.moveFrames[this.nextUnclaimed];
                c.chanceEarly = c.chanceLate = 0;
                if (c.firstFrame > jf.earlyFrame + this.pushCount - 1) { //at least partially in on early side
                    c.chanceFirst = (c.firstFrame < jf.earlyFrame + this.pushCount + 1) ? jf.earlyFrame + this.pushCount + 1 - c.firstFrame : 0; //need this incase we are pushing out of first frame
                    c.chancePush = this.pushFrames - this.pushCount; // don't do it the first time
                    if (c.firstFrame < jf.latestFrame + this.pushCount + 1) { //at least partially in on late side
                        if (c.firstFrame < jf.earlyFrame + this.pushCount)
                            c.chanceEarly = jf.earlyFrame + this.pushCount - c.firstFrame; // maybe early
                        // keeping percent justFrame seperate calculate it in the results. (earlyc*(1-pushc)+pushc) = true early chance ***WRONG!
                        if (c.firstFrame > jf.latestFrame + this.pushCount)
                            c.chanceLate = c.firstFrame - (jf.latestFrame + this.pushCount); // mayber late
                        // (2 *earlyC * pushc) - earlyc -pushc -1 = true late chance
                        if (c.firstFrame > jf.justFrame && jf.latestFrame > jf.justFrame) { //I presume push should always be zero and this is called once...but... can change later if need be.
                            this.pushFrames = c.firstFrame - jf.justFrame;
                            this.pushCount = Math.floor(this.pushFrames); //only guarenteed frames.
                            if (this.pushFrames > jf.latestFrame - jf.justFrame)
                                this.pushFrames = this.pushCount; // probably dont need this if I read late first but...?
                        }
                    }
                    else
                        c.chanceLate = c.firstFrame - (jf.latestFrame + this.pushCount); // late and clamed = 
                    c.claimedFrame = this.nextUnclaimed++; // was on time or late so claimed.
                }
                else {
                    c.chanceEarly = 1; //trying to fix situations where not enough presses. or not enough matches.  
                    if (redo) { // maybe I could always do this but just not increment...????
                        c.claimedFrame = this.nextUnclaimed;
                        c.chancePush = this.pushFrames - this.pushCount;
                    }
                }
            } //else we done...
            //moving out from draw function... TODO - move it into the frame calcs maybe?
            let pushEarly = 0;
            let pushLate = 0;
            if (c.claimedFrame) {
                //Calculate success.  Should move this into the Results object
                if (c.chanceEarly > 0) {
                    pushEarly = (c.chanceEarly < 1) ? (1 - c.chanceEarly) * (1 - c.chancePush) : 0;
                    // early = fail push = fail, only success i not (early * not push)
                    // I don't need to check chanceEarly < 1 as it will not be claimed... leaving it in case I change the claim system.     
                    c.chanceOK = pushEarly;
                }
                else if (c.chanceLate > 0) {
                    // todo, can probably simply this into 1 assignment.
                    if (c.chanceLate < 1) {
                        let earlyFactor = (c.chanceFirst > 0) ? 1 - c.chancePush : 1; //should reduce chances if push frames blow out of early.
                        pushLate = (earlyFactor * (1 - c.chanceLate)) + (c.chanceLate * c.chancePush);
                        // not late = okay. late only okay if push
                        // 1-late*1(push chance deosn't matter *) + (late*push)
                        // *unless it is a true just frame which I havent dealt with.
                    }
                    else if (c.chanceLate - 1 < 1) {
                        // only success if push
                        pushLate = (1 - (c.chanceLate - 1)) * c.chancePush;
                        // range 0 to .9999
                        // if it is exactly 0 - then chance is = push chance 
                    }
                    c.chanceOK = pushLate;
                }
                else
                    c.chanceOK = (c.chanceFirst > 0) ? (1 - c.chancePush) * c.chanceFirst + 1 - c.chanceFirst : 1;
                //chance no push * chance first + chance 2nd * 1 as success if push or not.                                                                    
            }
        }
    }
    Tappy.resultset = resultset;
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map