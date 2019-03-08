/// <reference path='./phaser.d.ts'/>
var Tappy;
(function (Tappy) {
    class InitPhaser {
        static initGame() {
            let config = {
                type: Phaser.WEBGL,
                scale: {
                    mode: Phaser.Scale.ENVELOP,
                    width: 1200,
                    height: 2200
                },
                scene: [Tappy.TestScene],
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
    class TestScene extends Phaser.Scene {
        constructor() {
            super({ key: 'TestScene' });
            //Globals
            this.smallText = { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' };
            this.mediumText = { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' };
            this.largeText = { fontFamily: 'Arial', fontSize: 28, color: '#ffffff' };
            this.startX = 60;
            this.gameWidth = 1080;
            //moveDisplay
            this.frameBoxes = [];
            //state
            this.stateRunning = false;
            this.stateShowResults = false;
            this.frame = 0; //dont trust this for calc - only for realtime view.
            this.mouseButton = [];
        }
        preload() {
            this.load.bitmapFont('luc', ['./Fonts/lucidaconsole_0.png', './Fonts/lucidaconsole_1.png'], './Fonts/lucidaconsole.xml');
            this.load.json('moveFrames', './json/Lee/acidrain.json');
        }
        create() {
            this.input.mouse.disableContextMenu();
            this.justFrameMove = this.cache.json.get('moveFrames');
            this.lastFrame = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length - 1].latestFrame + 5;
            this.frameWidth = Math.round(this.gameWidth / this.lastFrame); //round it into clean frame size
            this.gameWidth = this.frameWidth * this.lastFrame; //multiply it back into clean gamewidth 
            // might be a practical minimum size for this. 3 frames probably... 
            // 3 frames times 60 = 180 + edges...
            this.speed = this.gameWidth / this.lastFrame / oneFrame; //speed still less accurate probably... only for realtime
            this.add.text(this.startX, 150, this.justFrameMove.MoveName, this.mediumText);
            this.add.text(this.startX, 170, this.justFrameMove.MoveNotation, this.mediumText);
            this.add.text(this.startX, 190, this.justFrameMove.Notes, this.mediumText);
            /* REDO all this
            1. to make the effect of push frames clearer.
            2. to show which buttons are for when
            3. to show optional buttons.
            4. recommended frames???
            5. late frames vs push frames.

            I need to know though, if it only ever happens on the first one.
            */
            let graphicsGuide = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 }, fillStyle: { color: 0x660000, alpha: 1 } });
            // make the whole set red.
            for (let i = 0; i <= this.lastFrame; i++) {
                this.add.text(this.startX + i * this.frameWidth + this.frameWidth / 2, 290, i.toString(), this.smallText).setOrigin(0.5);
                this.frameBoxes.push(new Phaser.Geom.Rectangle(this.startX + i * this.frameWidth, 250, this.frameWidth - 2, 30));
            }
            this.frameBoxes.forEach(frame => {
                graphicsGuide.strokeRectShape(frame);
                graphicsGuide.fillRectShape(frame);
            });
            this.justFrameMove.JustFrames.forEach(jf => {
                if (!jf.optional) { // just until I have a better plan
                    this.add.text(this.startX + jf.justFrame * this.frameWidth + this.frameWidth / 2, 240, jf.move, this.smallText).setOrigin(0.5);
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
                    }
                    graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[jf.justFrame].right, 230, this.frameBoxes[jf.latestFrame].right, 230));
                    //JF = Green
                    graphicsGuide.lineStyle(1, 0x00ff00);
                    graphicsGuide.fillStyle(0x007700);
                    graphicsGuide.fillRectShape(this.frameBoxes[jf.justFrame]);
                    graphicsGuide.strokeRectShape(this.frameBoxes[jf.justFrame]);
                    //JF bounds and text
                    let leftBounds = this.frameBoxes[jf.earlyFrame].left;
                    let rightBounds = this.frameBoxes[jf.justFrame].right;
                    graphicsGuide.lineStyle(1, 0xffffff);
                    graphicsGuide.strokeLineShape(new Phaser.Geom.Line(leftBounds, 230, rightBounds, 230));
                    graphicsGuide.strokeLineShape(new Phaser.Geom.Line(leftBounds, 230, leftBounds, 250));
                    graphicsGuide.strokeLineShape(new Phaser.Geom.Line(rightBounds, 230, rightBounds, 250));
                }
            });
            this.input.on('pointerdown', this.clicked, this);
            //this is for the realtime line - todo, something else - another way...
            this.graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 } });
            this.frameRuler = new Phaser.Geom.Line(this.startX, 320, this.startX, 320);
            this.scenefps = this.add.bitmapText(this.gameWidth + this.startX, 32, 'luc', '', 16).setOrigin(1);
            this.running = this.add.text(600, 50, 'Tap or Click when ready', this.largeText).setOrigin();
        }
        update(timestep, dt) {
            this.scenefps.setText(Phaser.Math.FloorTo(this.sys.game.loop.actualFps, -2).toString()); //seems slow - think i should do it myself. ? How often then?
            if (this.stateRunning) {
                this.frame++;
                var runtime = this.sys.game.loop.time - this.results.startTime;
                if (!this.stateShowResults) {
                    if (runtime > this.lastFrame * oneFrame) {
                        this.stateShowResults = true;
                    }
                    else {
                        let x = this.frameRuler.x2 += this.speed * dt;
                        this.frameRuler.x2 = x;
                        this.graphics.strokeLineShape(this.frameRuler); //I want to uses
                    }
                }
                if (runtime > (this.lastFrame + 15) * oneFrame) {
                    this.stateRunning = false;
                    this.running.setAlpha(1);
                }
            }
        }
        showResults() {
        }
        clicked(pointer) {
            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            //stateShowResults is a buffer so late clicks don't cause it to start again.
            if (this.stateRunning && !this.stateShowResults) {
                let frame = this.results.add(pointer.time);
                let dt = pointer.time - this.results.startTime;
                let x = firstClickX + this.speed * dt;
                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff, 0.5);
                let clickCircle = new Phaser.Geom.Circle(x, 270, this.frameWidth / 2);
                this.graphics.strokeCircleShape(clickCircle);
                this.graphics.fillCircleShape(clickCircle);
                let clickStartLine = new Phaser.Geom.Line(x, 250, x, 330);
                this.graphics.strokeLineShape(clickStartLine);
                let percent = Math.floor(frame[1] * 100);
                this.mouseButton.push(this.add.text(x - 2, 360, `Frame:${frame[0]}: ${percent}%
Frame:${frame[0] + 1}: ${100 - percent}%`, this.smallText));
            }
            if (!this.stateRunning) {
                this.results = null;
                this.stateRunning = true;
                this.stateShowResults = false;
                this.mouseButton.forEach(element => { element.destroy(); });
                this.results = new resultset(this.sys.game.loop.time);
                this.running.setAlpha(0);
                this.frameRuler.x2 = this.startX;
                this.graphics.clear();
                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff, 0.5);
                let clickCircle = new Phaser.Geom.Circle(firstClickX, 270, this.frameWidth / 2);
                this.graphics.strokeCircleShape(clickCircle);
                this.graphics.fillCircleShape(clickCircle);
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX, 250, firstClickX, 330)); //should be halfway through frame... Frame size 6?
                this.frame = 0;
            }
        }
    }
    Tappy.TestScene = TestScene;
    const oneFrame = 16.6666666666666666;
    class resultset {
        constructor(start, button = "1") {
            this.buttons = [];
            this.startTime = start;
            this.buttons.push({ time: start, button: button });
        }
        add(time, button = "1") {
            let index = this.buttons.push({ time: time, button: button });
            this.calcFrames(this.buttons[index - 1]);
            return [this.buttons[index - 1].firstFrame, this.buttons[index - 1].chance];
        }
        calcFrames(currentButton) {
            let timediff = currentButton.time - this.startTime; //eg 19.17/16
            let timeFrame = timediff / oneFrame; // part through 1st frame. =  1.15
            let timeFloor = Math.floor(timeFrame); // actual frame = 1
            let timePerc = timeFrame - timeFloor; // perc chance next frame.
            //ISSUE:1 - something is still wrong here..... or it has to be in the clicked method. 
            //Think this is solved. by changing gameWidth to be a multiple of frameWidth - problem was in clicked()
            //FEATURE:1 - This will need track and add push frames.
            currentButton.firstFrame = timeFloor;
            currentButton.chance = 1 - timePerc;
        }
    }
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map
